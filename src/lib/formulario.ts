/**
 * Lectura y validación de formularios.
 *
 * Los formularios se envían con `<form action={accionDeServidor}>`, que funciona
 * aunque el JavaScript no haya cargado. Por eso los errores no se devuelven como
 * estado de React sino como parámetro en la URL: es la única forma de avisar que
 * sobrevive sin JavaScript.
 */

/** Un error que se le puede enseñar tal cual a la persona. */
export class ErrorDeCaptura extends Error {}

export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorDeCaptura) return error.message;
  console.error(error);
  return "Algo se atoró. Intenta otra vez en un momento.";
}

export function conMensaje(ruta: string, clave: "error" | "ok", mensaje: string): string {
  const separador = ruta.includes("?") ? "&" : "?";
  // `n` cambia en cada envío para que dos avisos iguales seguidos se noten.
  return `${ruta}${separador}${clave}=${encodeURIComponent(mensaje)}&n=${Date.now().toString(36)}`;
}

export function textoRequerido(datos: FormData, campo: string, etiqueta: string, max = 200): string {
  const valor = String(datos.get(campo) ?? "").trim().slice(0, max);
  if (!valor) throw new ErrorDeCaptura(`Falta ${etiqueta}.`);
  return valor;
}

/** Lo que llega en `?error=` / `?ok=` de la URL. */
export function leerMensajes(parametros: Record<string, string | string[] | undefined>) {
  const texto = (clave: string) => (typeof parametros[clave] === "string" ? (parametros[clave] as string) : "");
  return { error: texto("error"), ok: texto("ok") };
}
