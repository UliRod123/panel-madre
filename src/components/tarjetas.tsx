import type { ReactNode } from "react";
import { hora } from "@/lib/fechas";
import {
  enlaceDePedido,
  type EtapaPedido,
  type Fuente,
  type Lectura,
  type Pendiente,
  type ResumenPedidos,
  type ResumenProduccion,
  type ResumenRastreo,
} from "@/lib/paneles";
import { IconoAlerta, IconoCaja, IconoCamion, IconoFlecha, IconoPalomita, IconoReloj } from "@/components/iconos";

/* ── Piezas chicas ──────────────────────────────────────────────────────── */

function cantidad(numero: number, singular: string, plural = `${singular}s`) {
  return `${numero} ${numero === 1 ? singular : plural}`;
}

function porcentaje(valor: number | null): string {
  return valor == null ? "—" : `${Math.round(valor)} %`;
}

function Cifra({ etiqueta, valor, detalle, tono = "text-slate-900" }: { etiqueta: string; valor: ReactNode; detalle?: ReactNode; tono?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-200/70">
      <p className="truncate text-[11px] font-bold tracking-[0.08em] text-slate-500 uppercase">{etiqueta}</p>
      <p className={`mt-0.5 text-2xl leading-tight font-bold tracking-[-0.03em] tabular-nums ${tono}`}>{valor}</p>
      {detalle ? <p className="truncate text-xs text-slate-500">{detalle}</p> : null}
    </div>
  );
}

function Barra({ valor, etiqueta, color = "bg-turquesa-600" }: { valor: number; etiqueta: string; color?: string }) {
  const ancho = Math.max(0, Math.min(100, valor));
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80" role="progressbar" aria-label={etiqueta} aria-valuenow={Math.round(ancho)} aria-valuemin={0} aria-valuemax={100}>
      <span className={`block h-full rounded-full ${color}`} style={{ width: `${ancho}%` }} />
    </div>
  );
}

const TONOS = {
  bien: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  aviso: "bg-amber-50 text-amber-900 ring-amber-200",
  mal: "bg-rose-50 text-rose-800 ring-rose-200",
  activo: "bg-turquesa-50 text-turquesa-800 ring-turquesa-200",
  neutro: "bg-slate-100 text-slate-700 ring-slate-200",
} as const;

function Etiqueta({ tono, children }: { tono: keyof typeof TONOS; children: ReactNode }) {
  return <span className={`inline-flex flex-none items-center rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${TONOS[tono]}`}>{children}</span>;
}

function Subtitulo({ children }: { children: ReactNode }) {
  return <h3 className="text-xs font-bold tracking-[0.09em] text-slate-500 uppercase">{children}</h3>;
}

const ICONOS: Record<Fuente["clave"], ReactNode> = {
  produccion: <IconoCaja tam={18} />,
  rastreo: <IconoCamion tam={18} />,
  pedidos: <IconoReloj tam={18} />,
};

const DE_QUE_ES: Record<Fuente["clave"], string> = {
  produccion: "Cajas del almacén",
  rastreo: "Rutas y entregas",
  pedidos: "Lentes de FranjaLC",
};

/** El marco de cada panel: nombre, botón para abrirlo y su contenido (o qué falló). */
function Marco<T>({ fuente, lectura, children }: { fuente: Fuente; lectura: Lectura<T>; children: (datos: T) => ReactNode }) {
  return (
    <section className="tarjeta flex min-w-0 flex-col overflow-hidden" aria-labelledby={`titulo-${fuente.clave}`}>
      <header className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 flex-none items-center justify-center rounded-xl bg-marca-900 text-turquesa-200">{ICONOS[fuente.clave]}</span>
          <div className="min-w-0">
            <h2 id={`titulo-${fuente.clave}`} className="truncate text-lg leading-tight font-bold tracking-[-0.02em] text-marca-950">
              {fuente.nombre}
            </h2>
            <p className="truncate text-xs text-slate-500">
              {DE_QUE_ES[fuente.clave]}
              {lectura.estado === "ok" ? ` · al ${hora((lectura.datos as { generadoEn?: string }).generadoEn)}` : null}
            </p>
          </div>
        </div>
        <a href={fuente.abrir} target="_blank" rel="noopener" className="capsula capsula-sm capsula-normal">
          Abrir
          <IconoFlecha tam={14} />
        </a>
      </header>
      <div className="flex-1 space-y-5 p-4 sm:p-5">
        {lectura.estado === "ok" ? (
          children(lectura.datos)
        ) : lectura.estado === "sin-configurar" ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            <p className="font-bold text-slate-800">Falta conectar {fuente.nombre}.</p>
            <p className="mt-1">
              En Vercel, pon <code className="rounded bg-white px-1 py-0.5 text-xs ring-1 ring-slate-200">{fuente.variable}</code> con la misma clave que tiene {fuente.nombre} en su RESUMEN_SECRETO.
            </p>
          </div>
        ) : (
          <div role="alert" className="flex gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-950">
            <span className="mt-0.5 flex-none text-rose-700"><IconoAlerta tam={16} /></span>
            <div>
              <p className="font-bold">No se pudo leer {fuente.nombre} ahora.</p>
              <p className="mt-1">{lectura.mensaje}</p>
              <p className="mt-1 text-rose-800/80">Se vuelve a intentar solo en un minuto. El panel de {fuente.nombre} sigue funcionando aparte.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Lo que hay que ver primero ─────────────────────────────────────────── */

export function LoQueHayQueVer({ lista, nombres, leidos }: { lista: Pendiente[]; nombres: Record<Fuente["clave"], string>; leidos: number }) {
  return (
    <section aria-labelledby="titulo-pendientes" className="tarjeta overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200/80 px-4 py-3.5 sm:px-5">
        <h2 id="titulo-pendientes" className="text-lg font-bold tracking-[-0.02em] text-marca-950">Lo que hay que ver</h2>
        <p className="text-xs text-slate-500">
          {leidos === 3 ? "De los tres paneles" : leidos === 0 ? "No se pudo leer ningún panel" : `De ${leidos} de los 3 paneles`}
        </p>
      </div>
      {lista.length === 0 ? (
        <p className="flex items-center gap-2.5 px-4 py-4 text-sm font-semibold text-emerald-800 sm:px-5">
          <span className="flex size-7 items-center justify-center rounded-full bg-emerald-100"><IconoPalomita tam={15} /></span>
          {leidos === 0 ? "Sin datos por ahora." : "Todo en orden. No hay nada atorado."}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {lista.map((pendiente) => (
            <li key={`${pendiente.panel}-${pendiente.texto}`} className="flex items-center gap-3 px-4 py-2.5 text-sm sm:px-5">
              <span className={`size-2.5 flex-none rounded-full ${pendiente.tono === "mal" ? "bg-rose-500" : "bg-amber-400"}`} aria-hidden />
              <span className="min-w-0 flex-1 font-semibold text-slate-800">{pendiente.texto}</span>
              <span className="flex-none text-xs font-bold text-slate-500">{nombres[pendiente.panel]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ── Producción ─────────────────────────────────────────────────────────── */

function tonoRendimiento(valor: number | null) {
  if (valor == null) return "text-slate-400";
  if (valor >= 100) return "text-emerald-700";
  if (valor >= 85) return "text-amber-700";
  return "text-rose-700";
}

const ESTADO_PERSONA: Record<ResumenProduccion["personas"][number]["estado"], keyof typeof TONOS> = {
  trabajando: "bien",
  "en pausa": "aviso",
  "por empezar": "neutro",
  "sin tarea": "neutro",
  suspendida: "mal",
};

export function TarjetaProduccion({ fuente, lectura }: { fuente: Fuente; lectura: Lectura<ResumenProduccion> }) {
  return (
    <Marco fuente={fuente} lectura={lectura}>
      {(r) => {
        const curso = r.enCurso;
        const avance = curso && curso.piezasDeLaEtapa > 0 ? (curso.piezasHechas / curso.piezasDeLaEtapa) * 100 : 0;
        return (
          <>
            {curso ? (
              <div className="space-y-2.5 rounded-xl bg-marca-900 p-4 text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="size-3 flex-none rounded-full ring-2 ring-white/30" style={{ backgroundColor: curso.color }} aria-hidden />
                  <p className="min-w-0 flex-1 truncate font-bold">
                    Pedido {curso.numero} · {curso.marca}
                    {curso.folio ? <span className="font-medium text-marca-100"> · {curso.folio}</span> : null}
                  </p>
                  {curso.urgente ? <Etiqueta tono="mal">Urgente</Etiqueta> : null}
                </div>
                <p className="text-sm text-marca-100">
                  Etapa {curso.etapa} de {curso.hastaEtapa}: {curso.nombreEtapa} · {cantidad(curso.personasTrabajando, "persona trabajando", "personas trabajando")}
                </p>
                <Barra valor={avance} etiqueta="Avance de la etapa" color="bg-turquesa-400" />
                <p className="text-xs text-marca-100">
                  {curso.piezasHechas.toLocaleString("es-MX")} de {curso.piezasDeLaEtapa.toLocaleString("es-MX")} piezas de esta etapa
                </p>
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200/70">No hay pedido en curso ahorita.</p>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <Cifra etiqueta="Piezas hoy" valor={r.equipo.piezasHoy.toLocaleString("es-MX")} detalle={`${cantidad(r.equipo.total, "persona")} en el equipo`} />
              <Cifra etiqueta="Rendimiento" valor={porcentaje(r.equipo.rendimientoPromedio)} detalle="promedio contra la meta" tono={tonoRendimiento(r.equipo.rendimientoPromedio)} />
              <Cifra etiqueta="Terminados hoy" valor={r.pedidos.terminadosHoy} detalle={`${r.pedidos.piezasTerminadasHoy.toLocaleString("es-MX")} piezas`} />
              <Cifra
                etiqueta="En cola"
                valor={r.pedidos.enCola}
                detalle={[r.pedidos.enEspera ? `${r.pedidos.enEspera} en espera` : "", r.pedidos.suspendidos ? `${r.pedidos.suspendidos} suspendido${r.pedidos.suspendidos === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ") || "esperando turno"}
              />
            </div>

            {r.personas.length ? (
              <div className="space-y-2">
                <Subtitulo>Equipo de hoy</Subtitulo>
                <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200/70">
                  {r.personas.map((persona) => (
                    <li key={persona.nombre} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-sm sm:flex-nowrap">
                      <span className="min-w-0 basis-full truncate font-semibold text-slate-800 sm:flex-1 sm:basis-auto">{persona.nombre}</span>
                      <span className="flex-1 sm:flex-none">
                        <Etiqueta tono={ESTADO_PERSONA[persona.estado]}>
                        {persona.estado}
                          {persona.etapa && persona.estado !== "suspendida" ? ` · E${persona.etapa}` : ""}
                        </Etiqueta>
                      </span>
                      <span className="w-14 flex-none text-right tabular-nums text-slate-600">{persona.piezasHoy.toLocaleString("es-MX")}</span>
                      <span className={`w-12 flex-none text-right font-bold tabular-nums ${tonoRendimiento(persona.rendimientoHoy)}`}>{porcentaje(persona.rendimientoHoy)}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-500">Piezas que terminó hoy y su rendimiento contra la meta de la marca.</p>
              </div>
            ) : null}
          </>
        );
      }}
    </Marco>
  );
}

/* ── Rastreo ────────────────────────────────────────────────────────────── */

const ESTADO_RUTA: Record<ResumenRastreo["rutas"][number]["estado"], { texto: string; tono: keyof typeof TONOS }> = {
  EN_CURSO: { texto: "En la calle", tono: "activo" },
  PUBLICADA: { texto: "Por salir", tono: "neutro" },
  CERRADA: { texto: "Terminó", tono: "bien" },
};

export function TarjetaRastreo({ fuente, lectura }: { fuente: Fuente; lectura: Lectura<ResumenRastreo> }) {
  return (
    <Marco fuente={fuente} lectura={lectura}>
      {(r) => (
        <>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-bold text-slate-700">Paradas cerradas</p>
              <p className="text-2xl font-bold tracking-[-0.03em] text-marca-950 tabular-nums">{r.paradas.avance} %</p>
            </div>
            <Barra valor={r.paradas.avance} etiqueta="Paradas cerradas" />
            <p className="text-xs text-slate-500">
              {r.paradas.cerradas} de {cantidad(r.paradas.total, "parada")} · {cantidad(r.enLaCalle, "chofer en la calle", "choferes en la calle")}
              {r.borradores ? ` · ${cantidad(r.borradores, "ruta armándose", "rutas armándose")}` : ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Cifra etiqueta="Folios del día" valor={r.folios.total} detalle={r.folios.sinRuta ? `${r.folios.sinRuta} sin ruta` : "todos con ruta"} />
            <Cifra etiqueta="Entregados" valor={r.folios.entregados} detalle={r.folios.total ? `de ${r.folios.total}` : "sin capturas"} tono="text-emerald-700" />
            <Cifra etiqueta="Por entregar" valor={r.folios.porEntregar} />
            <Cifra etiqueta="Con problema" valor={r.folios.conProblema} tono={r.folios.conProblema ? "text-rose-700" : "text-slate-900"} detalle={r.folios.conProblema ? "requieren seguimiento" : "sin incidencias"} />
          </div>

          {r.rutas.length ? (
            <div className="space-y-2">
              <Subtitulo>Choferes</Subtitulo>
              <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200/70">
                {r.rutas.map((ruta) => (
                  <li key={`${ruta.chofer}-${ruta.iniciadaEn}`} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-sm sm:flex-nowrap">
                    <span className="min-w-0 basis-full truncate font-semibold text-slate-800 sm:flex-1 sm:basis-auto">{ruta.chofer}</span>
                    <span className="flex-1 sm:hidden" aria-hidden />
                    {ruta.comiendo ? <Etiqueta tono="aviso">Comiendo</Etiqueta> : null}
                    {ruta.problemas ? <Etiqueta tono="mal">{cantidad(ruta.problemas, "problema")}</Etiqueta> : null}
                    <Etiqueta tono={ESTADO_RUTA[ruta.estado].tono}>{ESTADO_RUTA[ruta.estado].texto}</Etiqueta>
                    <span className="w-12 flex-none text-right font-bold tabular-nums text-slate-700">
                      {ruta.cerradas}/{ruta.total}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200/70">
              {r.borradores ? "Las rutas de hoy todavía se están armando." : "No hay rutas publicadas hoy."}
            </p>
          )}

          {r.incidencias.length ? (
            <div className="space-y-2">
              <Subtitulo>No se pudo / a medias</Subtitulo>
              <ul className="space-y-1.5">
                {r.incidencias.slice(0, 4).map((incidencia, indice) => (
                  <li key={`${incidencia.titulo}-${indice}`} className="rounded-lg bg-rose-50/70 px-3 py-2 text-sm ring-1 ring-rose-100">
                    <p className="font-semibold text-slate-800">
                      {incidencia.titulo} <span className="font-normal text-slate-500">· {incidencia.chofer} · {hora(incidencia.hora)}</span>
                    </p>
                    {incidencia.motivo ? <p className="text-slate-600">{incidencia.motivo}</p> : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </Marco>
  );
}

/* ── Pedidos ────────────────────────────────────────────────────────────── */

/** Las mismas columnas y nombres que el tablero de Pedidos (`src/logica/etapas.ts`). */
const ETAPAS: { id: EtapaPedido; nombre: string; color: string }[] = [
  { id: "nuevo", nombre: "Nuevo pedido", color: "bg-sky-500" },
  { id: "almacen", nombre: "Revisión de almacén", color: "bg-teal-500" },
  { id: "sinstock", nombre: "Sin stock", color: "bg-amber-500" },
  { id: "proveedor", nombre: "Pedido a proveedor", color: "bg-violet-500" },
  { id: "recibido", nombre: "Llegó · pedir guía", color: "bg-cyan-500" },
];

const NOMBRE_ETAPA: Record<string, string> = Object.fromEntries(ETAPAS.map((etapa) => [etapa.id, etapa.nombre]));

export function TarjetaPedidos({ fuente, lectura }: { fuente: Fuente; lectura: Lectura<ResumenPedidos> }) {
  return (
    <Marco fuente={fuente} lectura={lectura}>
      {(r) => {
        const mayor = Math.max(1, ...ETAPAS.map((etapa) => r.porEtapa[etapa.id] ?? 0));
        return (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <Cifra etiqueta="En proceso" valor={r.activos} detalle="sin enviar ni cancelar" />
              <Cifra etiqueta="Atrasados" valor={r.atrasados} tono={r.atrasados ? "text-rose-700" : "text-slate-900"} detalle={r.vencenHoy ? `${r.vencenHoy} vence${r.vencenHoy === 1 ? "" : "n"} hoy` : "pasó su fecha límite"} />
              <Cifra etiqueta="Entraron hoy" valor={r.entraronHoy} />
              <Cifra etiqueta="Enviados hoy" valor={r.enviadosHoy} tono="text-emerald-700" detalle={r.canceladosHoy ? `${r.canceladosHoy} cancelado${r.canceladosHoy === 1 ? "" : "s"}` : undefined} />
            </div>

            <div className="space-y-2">
              <Subtitulo>Dónde están</Subtitulo>
              <ul className="space-y-2">
                {ETAPAS.map((etapa) => {
                  const numero = r.porEtapa[etapa.id] ?? 0;
                  return (
                    <li key={etapa.id} className="grid grid-cols-[minmax(0,10rem)_1fr_2rem] items-center gap-2.5 text-sm">
                      <span className="truncate text-slate-700">{etapa.nombre}</span>
                      <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <span className={`block h-full rounded-full ${etapa.color}`} style={{ width: `${(numero / mayor) * 100}%` }} />
                      </span>
                      <span className="text-right font-bold tabular-nums text-slate-800">{numero}</span>
                    </li>
                  );
                })}
              </ul>
              {r.solicitudesAbiertas ? <p className="text-xs text-slate-500">{cantidad(r.solicitudesAbiertas, "solicitud", "solicitudes")} (guía, recibo…) sin contestar.</p> : null}
            </div>

            {r.masAtrasados.length ? (
              <div className="space-y-2">
                <Subtitulo>Los más atrasados</Subtitulo>
                <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200/70">
                  {r.masAtrasados.map((pedido) => (
                    <li key={pedido.id}>
                      <a href={enlaceDePedido(pedido.id)} target="_blank" rel="noopener" className="fila px-3 py-2 text-sm text-slate-800 sm:px-3">
                        <span className="flex-none font-bold text-marca-800">{pedido.folio}</span>
                        <span className="min-w-0 flex-1 truncate">
                          {pedido.producto} <span className="text-slate-500">· {NOMBRE_ETAPA[pedido.etapa] ?? pedido.etapa}</span>
                        </span>
                        <Etiqueta tono="mal">{cantidad(pedido.dias, "día")}</Etiqueta>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        );
      }}
    </Marco>
  );
}
