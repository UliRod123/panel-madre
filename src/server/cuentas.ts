"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirDueno } from "@/lib/sesion";
import { alternarCuenta, cambiarPin, crearCuenta } from "@/lib/cuentas";
import { conMensaje, mensajeDeError, textoRequerido } from "@/lib/formulario";

const CUENTAS = "/panel/cuentas";

async function guardarYVolver(accion: () => Promise<string>) {
  let mensaje: string;
  try {
    mensaje = await accion();
  } catch (error) {
    redirect(conMensaje(CUENTAS, "error", mensajeDeError(error)));
  }
  revalidatePath(CUENTAS);
  redirect(conMensaje(CUENTAS, "ok", mensaje));
}

export async function darDeAlta(datos: FormData) {
  await requerirDueno();
  await guardarYVolver(async () => {
    const cuenta = await crearCuenta({
      nombre: textoRequerido(datos, "nombre", "el nombre", 80),
      usuario: textoRequerido(datos, "usuario", "el usuario", 40),
      pin: String(datos.get("pin") ?? "").trim(),
      esDueno: datos.get("esDueno") === "on",
    });
    return `${cuenta.nombre} ya puede entrar con el usuario "${cuenta.usuario}".`;
  });
}

export async function nuevoPin(datos: FormData) {
  await requerirDueno();
  await guardarYVolver(async () => {
    await cambiarPin(textoRequerido(datos, "cuentaId", "la cuenta", 40), String(datos.get("pin") ?? "").trim());
    return "PIN actualizado.";
  });
}

export async function activarODesactivar(datos: FormData) {
  const sesion = await requerirDueno();
  await guardarYVolver(async () => {
    const activa = await alternarCuenta(textoRequerido(datos, "cuentaId", "la cuenta", 40), sesion.id);
    return activa ? "Cuenta activada." : "Cuenta desactivada: ya no puede entrar.";
  });
}
