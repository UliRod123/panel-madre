import "server-only";

/* ============================================================================
   Los tres paneles

   El panel madre no tiene los datos del día: cada panel tiene su propia base.
   Aquí se le pide a cada uno su resumen —Producción y Rastreo en
   `/api/resumen`, Pedidos en la función `resumen-madre` de Supabase— con la
   clave que comparten (`RESUMEN_SECRETO_…` aquí = `RESUMEN_SECRETO` allá).

   Los tres se piden al mismo tiempo y cada uno por su lado: si Rastreo no
   contesta, Producción y Pedidos se ven igual y Rastreo dice qué pasó.

   Los tipos de abajo repiten lo que manda cada panel (su `src/lib/resumen.ts`
   y la migración 0058 de Pedidos). Si allá cambia algo, se cambia aquí.
   ========================================================================== */

export type ResumenProduccion = {
  panel: "produccion";
  dia: string;
  generadoEn: string;
  enCurso: {
    numero: number;
    folio: string | null;
    marca: string;
    color: string;
    piezas: number;
    urgente: boolean;
    etapa: number;
    nombreEtapa: string;
    hastaEtapa: number;
    piezasHechas: number;
    piezasDeLaEtapa: number;
    personasTrabajando: number;
  } | null;
  pedidos: {
    enCola: number;
    suspendidos: number;
    enEspera: number;
    retomar: number;
    terminadosHoy: number;
    piezasTerminadasHoy: number;
  };
  equipo: {
    total: number;
    trabajando: number;
    enPausa: number;
    suspendidas: number;
    piezasHoy: number;
    rendimientoPromedio: number | null;
  };
  personas: {
    nombre: string;
    estado: "trabajando" | "en pausa" | "por empezar" | "sin tarea" | "suspendida";
    etapa: number | null;
    piezasHoy: number;
    rendimientoHoy: number | null;
  }[];
};

export type ResumenRastreo = {
  panel: "rastreo";
  dia: string;
  generadoEn: string;
  folios: { total: number; entregados: number; porEntregar: number; conProblema: number; sinRuta: number };
  paradas: { total: number; cerradas: number; avance: number; vencidas: number; sinAcuse: number };
  borradores: number;
  enLaCalle: number;
  rezagadas: number;
  rutas: {
    chofer: string;
    estado: "PUBLICADA" | "EN_CURSO" | "CERRADA";
    total: number;
    cerradas: number;
    problemas: number;
    comiendo: boolean;
    iniciadaEn: string | null;
    cerradaEn: string | null;
  }[];
  incidencias: { chofer: string; titulo: string; estado: "FALLIDA" | "PARCIAL"; motivo: string | null; hora: string | null }[];
};

export type EtapaPedido = "nuevo" | "almacen" | "sinstock" | "proveedor" | "recibido" | "enviado" | "cancelado";

export type ResumenPedidos = {
  panel: "pedidos";
  dia: string;
  generadoEn: string;
  activos: number;
  porEtapa: Partial<Record<EtapaPedido, number>>;
  entraronHoy: number;
  enviadosHoy: number;
  canceladosHoy: number;
  atrasados: number;
  vencenHoy: number;
  solicitudesAbiertas: number;
  masAtrasados: { id: string; folio: string; producto: string; etapa: EtapaPedido; dias: number }[];
};

export type Lectura<T> =
  | { estado: "ok"; datos: T }
  | { estado: "sin-configurar"; falta: string }
  | { estado: "error"; mensaje: string };

export type Fuente = {
  clave: "produccion" | "rastreo" | "pedidos";
  nombre: string;
  /** A dónde lleva "Abrir". */
  abrir: string;
  /** De dónde se lee el resumen. */
  resumen: string;
  /** Nombre de la variable de Vercel con la clave. */
  variable: string;
  secreto: string;
};

const sinDiagonal = (url: string) => url.replace(/\/+$/, "");

export function fuentes(): Record<Fuente["clave"], Fuente> {
  const produccion = sinDiagonal(process.env.PRODUCCION_URL || "https://controldeproduccion.vercel.app");
  const rastreo = sinDiagonal(process.env.RASTREO_URL || "https://panel-de-rastreo.vercel.app");
  const pedidos = sinDiagonal(process.env.PEDIDOS_URL || "https://franjalc-pedidos.vercel.app");
  return {
    produccion: {
      clave: "produccion",
      nombre: "Producción",
      abrir: `${produccion}/panel`,
      resumen: `${produccion}/api/resumen`,
      variable: "RESUMEN_SECRETO_PRODUCCION",
      secreto: process.env.RESUMEN_SECRETO_PRODUCCION ?? "",
    },
    rastreo: {
      clave: "rastreo",
      nombre: "Rastreo",
      abrir: `${rastreo}/panel`,
      resumen: `${rastreo}/api/resumen`,
      variable: "RESUMEN_SECRETO_RASTREO",
      secreto: process.env.RESUMEN_SECRETO_RASTREO ?? "",
    },
    pedidos: {
      clave: "pedidos",
      nombre: "Pedidos",
      abrir: pedidos,
      resumen: process.env.PEDIDOS_RESUMEN_URL || "https://oarszkbfohniewmejjbn.supabase.co/functions/v1/resumen-madre",
      variable: "RESUMEN_SECRETO_PEDIDOS",
      secreto: process.env.RESUMEN_SECRETO_PEDIDOS ?? "",
    },
  };
}

/** El enlace que abre un pedido en la app de Pedidos (lo mismo que usan sus avisos). */
export function enlaceDePedido(id: string): string {
  return `${fuentes().pedidos.abrir}/?pedido=${encodeURIComponent(id)}`;
}

/** Un panel dormido (arranque en frío) tarda unos segundos; más de esto ya es que no contesta. */
const ESPERA_MS = 9_000;

async function leer<T extends { panel: string }>(fuente: Fuente): Promise<Lectura<T>> {
  if (fuente.secreto.length < 16) return { estado: "sin-configurar", falta: fuente.variable };
  try {
    const respuesta = await fetch(fuente.resumen, {
      headers: { Authorization: `Bearer ${fuente.secreto}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    if (respuesta.status === 401) return { estado: "error", mensaje: `La clave no coincide. Revisa que ${fuente.variable} sea igual a la RESUMEN_SECRETO de ${fuente.nombre}.` };
    if (respuesta.status === 404) return { estado: "error", mensaje: `${fuente.nombre} todavía no tiene su resumen encendido (falta su RESUMEN_SECRETO o publicar la versión nueva).` };
    if (!respuesta.ok) return { estado: "error", mensaje: `${fuente.nombre} contestó con un error (${respuesta.status}).` };
    const datos = (await respuesta.json()) as T;
    if (datos?.panel !== fuente.clave) return { estado: "error", mensaje: `Lo que contestó ${fuente.nombre} no es su resumen.` };
    return { estado: "ok", datos };
  } catch (error) {
    const seAcabo = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    if (!seAcabo) console.warn(`Resumen de ${fuente.nombre}:`, error);
    return { estado: "error", mensaje: seAcabo ? `${fuente.nombre} no contestó a tiempo.` : `No se pudo llegar a ${fuente.nombre}.` };
  }
}

export async function leerLosTres() {
  const lista = fuentes();
  const [produccion, rastreo, pedidos] = await Promise.all([
    leer<ResumenProduccion>(lista.produccion),
    leer<ResumenRastreo>(lista.rastreo),
    leer<ResumenPedidos>(lista.pedidos),
  ]);
  return { fuentes: lista, produccion, rastreo, pedidos };
}

/* ── Lo que hay que ver primero ─────────────────────────────────────────── */

export type Pendiente = { panel: Fuente["clave"]; tono: "mal" | "aviso"; texto: string };

function cantidad(numero: number, singular: string, plural = `${singular}s`) {
  return `${numero} ${numero === 1 ? singular : plural}`;
}

/**
 * Lo que necesita atención en los tres paneles, lo más grave primero. Es la
 * razón de ser del panel madre: enterarse sin abrir cada uno.
 */
export function pendientes(lecturas: Awaited<ReturnType<typeof leerLosTres>>): Pendiente[] {
  const lista: Pendiente[] = [];
  const { produccion, rastreo, pedidos } = lecturas;

  if (rastreo.estado === "ok") {
    const r = rastreo.datos;
    const fallidas = r.incidencias.filter((i) => i.estado === "FALLIDA").length;
    const parciales = r.incidencias.filter((i) => i.estado === "PARCIAL").length;
    if (r.paradas.vencidas) lista.push({ panel: "rastreo", tono: "mal", texto: `${cantidad(r.paradas.vencidas, "parada")} con la hora límite pasada` });
    if (fallidas) lista.push({ panel: "rastreo", tono: "mal", texto: `${cantidad(fallidas, "entrega")} que no se pudo hacer` });
    if (r.paradas.sinAcuse) lista.push({ panel: "rastreo", tono: "mal", texto: `${cantidad(r.paradas.sinAcuse, "urgente")} que el chofer no ha visto` });
    if (parciales) lista.push({ panel: "rastreo", tono: "aviso", texto: `${cantidad(parciales, "entrega")} a medias` });
    if (r.rezagadas) lista.push({ panel: "rastreo", tono: "aviso", texto: `${cantidad(r.rezagadas, "parada")} de días anteriores sin volver a cargar` });
    if (r.folios.sinRuta) lista.push({ panel: "rastreo", tono: "aviso", texto: `${cantidad(r.folios.sinRuta, "folio")} de hoy sin ruta` });
  }
  if (pedidos.estado === "ok") {
    const p = pedidos.datos;
    if (p.atrasados) lista.push({ panel: "pedidos", tono: "mal", texto: `${cantidad(p.atrasados, "pedido atrasado", "pedidos atrasados")}` });
    if (p.vencenHoy) lista.push({ panel: "pedidos", tono: "aviso", texto: `${cantidad(p.vencenHoy, "pedido vence", "pedidos vencen")} hoy` });
    if (p.solicitudesAbiertas) lista.push({ panel: "pedidos", tono: "aviso", texto: `${cantidad(p.solicitudesAbiertas, "solicitud", "solicitudes")} sin contestar` });
  }
  if (produccion.estado === "ok") {
    const c = produccion.datos;
    if (c.pedidos.retomar) lista.push({ panel: "produccion", tono: "mal", texto: `${cantidad(c.pedidos.retomar, "pedido")} de días anteriores por retomar` });
    if (c.pedidos.suspendidos) lista.push({ panel: "produccion", tono: "aviso", texto: `${cantidad(c.pedidos.suspendidos, "pedido suspendido", "pedidos suspendidos")}` });
    if (c.equipo.suspendidas) lista.push({ panel: "produccion", tono: "aviso", texto: `${cantidad(c.equipo.suspendidas, "persona suspendida", "personas suspendidas")} hoy` });
    // "No hay pedido en curso" no va aquí: en la noche es lo normal y saldría
    // como pendiente hasta el día siguiente. Lo dice la tarjeta de Producción.
  }
  return lista.sort((a, b) => Number(a.tono === "aviso") - Number(b.tono === "aviso"));
}
