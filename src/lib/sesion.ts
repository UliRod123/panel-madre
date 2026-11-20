import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { COOKIE_SESION, firmarSesion, verificarSesion, type Sesion } from "@/lib/token";

export type { Sesion };

export type CuentaEnSesion = Sesion & { esDueno: boolean };

export async function sesionActual(): Promise<Sesion | null> {
  const almacen = await cookies();
  return verificarSesion(almacen.get(COOKIE_SESION)?.value);
}

export async function abrirSesion(sesion: Sesion): Promise<void> {
  const token = await firmarSesion(sesion);
  const almacen = await cookies();
  almacen.set(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete(COOKIE_SESION);
}

/**
 * La puerta del panel. Además de la firma de la cookie, mira que la cuenta siga
 * activa: a quien se desactiva se le cierra el panel en su siguiente clic, no
 * dentro de treinta días cuando caduque la cookie.
 */
export async function requerirCuenta(): Promise<CuentaEnSesion> {
  const sesion = await sesionActual();
  if (!sesion) redirect("/entrar");
  const cuenta = await prisma.cuenta.findUnique({ where: { id: sesion.id }, select: { activa: true, esDueno: true, nombre: true } });
  if (!cuenta?.activa) redirect("/entrar");
  return { ...sesion, nombre: cuenta.nombre, esDueno: cuenta.esDueno };
}

/** Solo el dueño reparte accesos. A los demás se les regresa al resumen. */
export async function requerirDueno(): Promise<CuentaEnSesion> {
  const cuenta = await requerirCuenta();
  if (!cuenta.esDueno) redirect("/panel");
  return cuenta;
}

/** El primer arranque: mientras no haya ninguna cuenta, solo `/instalar` está abierta. */
export async function faltaInstalar(): Promise<boolean> {
  return (await prisma.cuenta.count()) === 0;
}
