/** Todo se dice en la hora de la operación, no en la del servidor (UTC). */
export const ZONA = process.env.ZONA_HORARIA ?? "America/Mexico_City";

const FORMATO_LARGO = new Intl.DateTimeFormat("es-MX", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

const FORMATO_HORA = new Intl.DateTimeFormat("es-MX", {
  timeZone: ZONA,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** "jueves, 20 de noviembre" para una clave "2026-11-20". */
export function fechaLarga(clave: string): string {
  const dia = new Date(`${clave}T00:00:00.000Z`);
  return Number.isNaN(dia.getTime()) ? clave : FORMATO_LARGO.format(dia);
}

/** "10:42 a.m." de un instante (texto ISO o Date). */
export function hora(instante: string | Date | null | undefined): string {
  if (!instante) return "—";
  const fecha = typeof instante === "string" ? new Date(instante) : instante;
  return Number.isNaN(fecha.getTime()) ? "—" : FORMATO_HORA.format(fecha);
}

/** "2026-11-20": el día de hoy en la zona de la operación. */
export function claveHoy(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
