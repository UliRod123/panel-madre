import { spawnSync } from "node:child_process";

/**
 * Aplica las migraciones durante el build.
 *
 * Si todavía no hay base de datos configurada (primer despliegue, antes de
 * crear el Postgres) el build NO se cae: el sitio queda arriba y muestra la
 * pantalla que explica qué falta. En cambio, si hay base y la migración falla
 * de verdad, el build sí se detiene: desplegar con el esquema a medias sería
 * peor que no desplegar.
 */
if (!process.env.DATABASE_URL) {
  console.warn(
    "\n⚠  Sin DATABASE_URL: se omiten las migraciones.\n" +
      "   Crea la base Postgres y vuelve a desplegar para que se creen las tablas.\n",
  );
  process.exit(0);
}

/**
 * La aplicación se conecta por el *pooler* (una conexión por consulta, que es
 * lo que necesita una función sin servidor). Migrar es lo contrario: Prisma
 * toma un candado de Postgres (`pg_advisory_lock`) y lo sostiene mientras
 * aplica los cambios.
 *
 * Un pooler en modo transacción no sostiene ese candado —cada consulta puede
 * salir por una conexión distinta—, así que el build moría con
 * `P1002: Timed out trying to acquire a postgres advisory lock`. Para migrar
 * hace falta una conexión DIRECTA.
 *
 * Se busca en este orden y solo para migrar; la aplicación sigue usando la
 * cadena normal:
 *
 *   1. `DIRECT_DATABASE_URL`, si alguien la puso a mano.
 *   2. `DATABASE_URL_UNPOOLED` / `POSTGRES_URL_NON_POOLING`, que es lo que
 *      agregan solas las integraciones de Postgres de Vercel.
 *   3. Derivarla de `DATABASE_URL`: en Neon el host con pooler se llama igual
 *      pero con el sufijo `-pooler`, así que quitarlo da la conexión directa.
 */
function urlParaMigrar() {
  const explicita =
    process.env.DIRECT_DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (explicita) return { url: explicita, origen: "conexión directa del entorno" };

  // Si no hay pooler que esquivar, la cadena se deja EXACTAMENTE como venía:
  // volver a serializarla le cambia detalles (un `host=/tmp` de socket acaba
  // como `host=%2Ftmp`) y rompe conexiones que funcionaban.
  const url = new URL(process.env.DATABASE_URL);
  const directo = url.hostname.replace(/-pooler\./, ".");
  if (directo === url.hostname && !url.searchParams.has("pgbouncer")) {
    return {
      url: process.env.DATABASE_URL,
      origen: "la misma cadena de la aplicación (no hay pooler que esquivar)",
    };
  }

  url.hostname = directo;
  // `pgbouncer=true` solo tiene sentido contra el pooler.
  url.searchParams.delete("pgbouncer");
  return { url: url.toString(), origen: "derivada quitando el pooler" };
}

const { url, origen } = urlParaMigrar();
console.log(`Migrando con ${origen}.`);

const ejecutable = process.platform === "win32" ? "npx.cmd" : "npx";
const entorno = { ...process.env, DATABASE_URL: url };

/**
 * P1002 llega por dos caminos distintos y los dos se resuelven esperando:
 *
 *  1. Una base sin servidor que estaba dormida y tarda en la primera conexión.
 *  2. **Otro despliegue migrando al mismo tiempo.** Cada compilación —también
 *     las de vista previa de cualquier rama— corre `migrate deploy` contra esta
 *     misma base, y Prisma toma un candado de Postgres mientras trabaja. Si se
 *     empujan dos ramas seguidas, las compilaciones se pelean el candado y la
 *     que pierde tumba el despliegue. Pasó en producción el 19 de agosto con
 *     tres compilaciones a la vez.
 *
 * Por eso la espera crece en lugar de ser fija: una migración ajena tarda más
 * que un arranque en frío. Cinco intentos con 10, 20, 40 y 60 s dan tiempo de
 * sobra a que la otra termine, y si de verdad la migración está rota el build
 * se detiene igual, solo que unos minutos después.
 */
const ESPERAS = [10, 20, 40, 60];
const INTENTOS = ESPERAS.length + 1;
let estado = 1;

for (let intento = 1; intento <= INTENTOS; intento += 1) {
  const resultado = spawnSync(ejecutable, ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: entorno,
  });
  estado = resultado.status ?? 1;
  if (estado === 0) break;

  if (intento < INTENTOS) {
    const espera = ESPERAS[intento - 1];
    console.warn(
      `\n⚠  La migración falló (intento ${intento} de ${INTENTOS}). ` +
        `Reintentando en ${espera} s: puede ser la base despertando ` +
        `o otro despliegue migrando al mismo tiempo.\n`,
    );
    spawnSync(process.execPath, ["-e", `setTimeout(()=>{}, ${espera * 1000})`]);
  }
}

process.exit(estado);
