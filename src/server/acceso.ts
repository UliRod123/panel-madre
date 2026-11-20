"use server";

import { redirect } from "next/navigation";
import { abrirSesion, cerrarSesion } from "@/lib/sesion";
import { comprobarAcceso, crearPrimeraCuenta } from "@/lib/cuentas";
import { conMensaje, mensajeDeError, textoRequerido } from "@/lib/formulario";
import type { Sesion } from "@/lib/token";

export async function entrar(datos: FormData) {
  const usuario = String(datos.get("usuario") ?? "");
  const pin = String(datos.get("pin") ?? "").trim();
  const volver = String(datos.get("volver") ?? "").trim();
  let sesion: Sesion;
  try {
    sesion = await comprobarAcceso(usuario, pin);
  } catch (error) {
    const parametros = new URLSearchParams({ usuario: usuario.trim().toLowerCase() });
    if (volver) parametros.set("volver", volver);
    redirect(conMensaje(`/entrar?${parametros.toString()}`, "error", mensajeDeError(error)));
  }
  await abrirSesion(sesion);
  // Solo se vuelve a pantallas del panel: "//otro.com" también empieza con "/".
  redirect(/^\/panel(\/[a-z]+)?$/.test(volver) ? volver : "/panel");
}

export async function salir() {
  await cerrarSesion();
  redirect("/entrar");
}

/** El primer arranque: la cuenta del dueño. Se cierra sola en cuanto hay una. */
export async function instalar(datos: FormData) {
  let sesion: Sesion;
  try {
    const cuenta = await crearPrimeraCuenta({
      nombre: textoRequerido(datos, "nombre", "tu nombre", 80),
      usuario: textoRequerido(datos, "usuario", "el usuario", 40),
      pin: String(datos.get("pin") ?? "").trim(),
      repetido: String(datos.get("repetir") ?? "").trim(),
      clave: String(datos.get("clave") ?? "").trim(),
    });
    sesion = { id: cuenta.id, nombre: cuenta.nombre, usuario: cuenta.usuario };
  } catch (error) {
    redirect(conMensaje("/instalar", "error", mensajeDeError(error)));
  }
  await abrirSesion(sesion);
  redirect(conMensaje("/panel/cuentas", "ok", "Listo, ya tienes tu cuenta. Ahora da de alta a las jefas."));
}
