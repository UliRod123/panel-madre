import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Cliente de Prisma perezoso: no se conecta hasta la primera consulta real.
 * Esto permite que `next build` compile aunque todavía no exista DATABASE_URL.
 *
 * Aquí vive además el reintento de las caídas de conexión, que es lo que la
 * operación veía como "Algo se atoró" a cada rato. En Vercel cada función se
 * congela entre visita y visita: el pozo guarda sockets que Postgres ya cerró
 * por su lado y, como los relojes tampoco corren mientras está congelada, nadie
 * los tira. La siguiente consulta —la primera de la pantalla— sale contra un
 * socket muerto y revienta la página entera. No es la base ni el código: es la
 * conexión, y en el segundo intento ya está buena.
 */

/** Milisegundos de espera antes de cada reintento. */
const ESPERAS = [100, 300];

/**
 * Consultas que solo leen. Se pueden repetir sin miedo: si la primera alcanzó a
 * correr, la segunda devuelve lo mismo.
 */
const SOLO_LECTURA = new Set([
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
]);

/**
 * Con estos textos el driver avisa que la conexión ni siquiera llegó a abrirse.
 * La consulta no salió del proceso, así que repetirla es seguro aunque escriba.
 */
const NUNCA_ABRIO = [
  "before secure tls connection was established",
  "authentication timed out",
  "timed out fetching a new connection",
  "timeout expired",
  "can't reach database server",
  "econnrefused",
  "enotfound",
  "eai_again",
];

/**
 * Estos otros son de una conexión que sí estaba viva y se cayó a media consulta.
 * No se sabe si Postgres alcanzó a aplicarla, así que solo se repiten lecturas:
 * reintentar una entrega podría guardarla dos veces.
 */
const SE_CAYO = [
  "connection terminated",
  "connection ended unexpectedly",
  "server closed the connection unexpectedly",
  "socket hang up",
  "econnreset",
  "epipe",
];

/**
 * Junta mensajes y códigos del error y de todo lo que trae colgando. Prisma
 * envuelve el fallo del driver dos veces —`meta.driverAdapterError` y de ahí su
 * `cause`—, así que el texto que importa nunca está en el primer nivel.
 */
function textoDelError(error: unknown): string {
  const partes: string[] = [];
  const vistos = new Set<object>();
  const pendientes: unknown[] = [error];

  while (pendientes.length > 0) {
    const actual = pendientes.pop();
    if (!actual || typeof actual !== "object" || vistos.has(actual)) continue;
    vistos.add(actual);

    const objeto = actual as {
      message?: unknown;
      code?: unknown;
      cause?: unknown;
      meta?: { driverAdapterError?: unknown };
    };
    if (typeof objeto.message === "string") partes.push(objeto.message);
    if (typeof objeto.code === "string") partes.push(objeto.code);
    pendientes.push(objeto.cause, objeto.meta?.driverAdapterError);
  }

  return partes.join(" | ").toLowerCase();
}

type Caida = "nunca-abrio" | "se-cayo" | null;

/**
 * Qué clase de caída fue, o `null` si el error es de verdad —un dato mal, una
 * regla de la base— y hay que dejarlo pasar tal cual.
 *
 * El orden importa: el socket que se muere durante el saludo TLS llega marcado
 * `ECONNRESET`, y ese caso es "nunca abrió", no "se cayó".
 */
function tipoDeCaida(error: unknown): Caida {
  const texto = textoDelError(error);
  if (NUNCA_ABRIO.some((patron) => texto.includes(patron))) return "nunca-abrio";
  if (SE_CAYO.some((patron) => texto.includes(patron))) return "se-cayo";
  return null;
}

function esperar(milisegundos: number) {
  return new Promise((listo) => setTimeout(listo, milisegundos));
}

/**
 * Corre `intento` y lo repite mientras la culpa sea de la conexión.
 * `sePuedeRepetir` dice si la operación aguanta correr dos veces; si no, solo se
 * reintenta cuando consta que la primera nunca llegó a Postgres.
 */
async function conReintento<T>(intento: () => Promise<T>, sePuedeRepetir: boolean): Promise<T> {
  for (let vuelta = 0; ; vuelta++) {
    try {
      return await intento();
    } catch (error) {
      const caida = tipoDeCaida(error);
      const vaDeNuevo =
        vuelta < ESPERAS.length &&
        (caida === "nunca-abrio" || (caida === "se-cayo" && sePuedeRepetir));
      if (!vaDeNuevo) throw error;

      console.warn(
        `Conexión a Postgres caída (${caida}); reintento ${vuelta + 1} de ${ESPERAS.length}`,
      );
      await esperar(ESPERAS[vuelta]);
    }
  }
}

/**
 * Los modos de SSL que el driver acepta pero por los que protesta.
 *
 * `pg` los trata a los tres como `verify-full` —comprueba el certificado y el
 * nombre del servidor— y avisa en cada arranque de función que en su próxima
 * versión mayor van a pasar a significar algo más flojo. El aviso salía en
 * TODAS las peticiones y era lo único marcado en rojo en el registro de Vercel:
 * tapaba lo que sí importa, que es justo lo que hizo falta el día que se atoró
 * la pantalla del repartidor y hubo que revisar los logs a mano.
 */
const SSL_QUE_AVISA = new Set(["prefer", "require", "verify-ca"]);

/**
 * Deja escrito el modo de SSL que el driver ya está aplicando.
 *
 * No cambia nada del comportamiento —hoy `require` ya se comporta como
 * `verify-full`, que es de lo que avisa el propio mensaje—: solo lo dice de
 * frente para que el driver no tenga que advertirlo, y para que el día que `pg`
 * cambie el significado de esos modos la conexión de producción no se afloje
 * sola sin que nadie lo haya decidido.
 *
 * Solo toca la cadena si ya traía un modo de los que avisan. Si no trae
 * `sslmode`, se deja igual: añadirlo rompería a quien conecta sin cifrado, como
 * una base local de pruebas.
 */
function conSslExplicito(cadena: string): string {
  let url: URL;
  try {
    url = new URL(cadena);
  } catch {
    // Cadena con formato propio (por ejemplo `host=... port=...`). No se toca:
    // más vale el aviso en el registro que una conexión que deja de abrir.
    return cadena;
  }

  const modo = url.searchParams.get("sslmode");
  if (!modo || !SSL_QUE_AVISA.has(modo)) return cadena;

  url.searchParams.set("sslmode", "verify-full");
  return url.toString();
}

function crearCliente(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "Falta la variable DATABASE_URL. Configura la base de datos Postgres " +
        "(en Vercel: Storage → Postgres) y vuelve a desplegar.",
    );
  }

  const adaptador = new PrismaPg(
    {
      connectionString: conSslExplicito(connectionString),
      // Cada función de Vercel abre su propio pozo, y hay muchas al mismo
      // tiempo: pocas conexiones cada una y que se suelten pronto, para no
      // acorralar al pooler ni quedarse con sockets viejos.
      max: 5,
      idleTimeoutMillis: 10_000,
      // Sin esto, un saludo que no avanza se queda colgado hasta que Postgres
      // corta con "Authentication timed out". Así falla pronto y se reintenta.
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 5_000,
      allowExitOnIdle: true,
    },
    {
      // Un socket guardado que se muere emite 'error' sin que nadie escuche, y
      // eso tumba el proceso entero. Aquí solo se anota.
      onPoolError: (error) => console.warn("Pozo de conexiones:", error.message),
      onConnectionError: (error) => console.warn("Conexión a Postgres:", error.message),
    },
  );

  const base = new PrismaClient({ adapter: adaptador });

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, args, query }) {
          return conReintento(() => query(args), SOLO_LECTURA.has(operation));
        },
      },
    },
  }) as unknown as PrismaClient;
}

let cliente: PrismaClient | undefined;

const globalCache = globalThis as unknown as { prisma?: PrismaClient };
cliente = globalCache.prisma;

function obtenerCliente(): PrismaClient {
  if (cliente) return cliente;

  cliente = crearCliente();
  // En desarrollo el hot-reload recrearía el cliente en cada cambio.
  if (process.env.NODE_ENV !== "production") globalCache.prisma = cliente;
  return cliente;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_destino, propiedad) {
    const instancia = obtenerCliente();
    const valor = Reflect.get(instancia, propiedad, instancia);
    if (typeof valor !== "function") return valor;

    const metodo = valor.bind(instancia) as (...datos: unknown[]) => unknown;

    // `$transaction` no pasa por la extensión de arriba. Si el socket estaba
    // muerto, quien revienta es el BEGIN y ninguna consulta llegó a correr: ese
    // caso —y solo ese— se puede repetir entero sin duplicar nada.
    if (propiedad === "$transaction") {
      return (...datos: unknown[]) => conReintento(async () => metodo(...datos), false);
    }
    return metodo;
  },
});
