import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPin, pinValido, verificarPin } from "@/lib/pin";
import { ErrorDeCaptura } from "@/lib/formulario";
import type { Sesion } from "@/lib/token";

/* ============================================================================
   Quién entra al panel madre

   El dueño y las jefas, cada quien con su usuario y su PIN. Todos ven el mismo
   resumen; solo el dueño da de alta cuentas, cambia PIN y las desactiva.
   ========================================================================== */

/** Cinco PIN equivocados seguidos frenan la cuenta cinco minutos. */
export const INTENTOS_PERMITIDOS = 5;
export const MINUTOS_DE_FRENO = 5;

function limpiarUsuario(bruto: string): string {
  return bruto.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
}

function revisarPin(pin: string, repetido?: string) {
  if (!pinValido(pin)) throw new ErrorDeCaptura("El PIN debe ser de 4 a 8 números.");
  if (repetido !== undefined && pin !== repetido) throw new ErrorDeCaptura("Los dos PIN no coinciden.");
}

/**
 * Usuario y PIN. Mismo mensaje para usuario inexistente y PIN incorrecto: no se
 * dice cuál de los dos falló.
 */
export async function comprobarAcceso(usuarioBruto: string, pin: string, ahora = new Date()): Promise<Sesion> {
  const usuario = limpiarUsuario(usuarioBruto);
  if (!usuario || !pin) throw new ErrorDeCaptura("Escribe tu usuario y tu PIN.");
  const cuenta = await prisma.cuenta.findUnique({ where: { usuario } });
  if (!cuenta || !cuenta.activa) {
    // Se calcula igual un hash para que la respuesta tarde lo mismo.
    verificarPin(pin, "00:00");
    throw new ErrorDeCaptura("Usuario o PIN incorrecto.");
  }
  if (cuenta.bloqueadaHasta && cuenta.bloqueadaHasta > ahora) {
    const minutos = Math.max(1, Math.ceil((cuenta.bloqueadaHasta.getTime() - ahora.getTime()) / 60_000));
    throw new ErrorDeCaptura(`Demasiados intentos. Espera ${minutos} min o pide al dueño que te cambie el PIN.`);
  }
  if (!verificarPin(pin, cuenta.pinHash)) {
    const intentos = cuenta.intentosFallidos + 1;
    const frena = intentos >= INTENTOS_PERMITIDOS;
    await prisma.cuenta.update({
      where: { id: cuenta.id },
      data: {
        intentosFallidos: frena ? 0 : intentos,
        bloqueadaHasta: frena ? new Date(ahora.getTime() + MINUTOS_DE_FRENO * 60_000) : null,
      },
    });
    throw new ErrorDeCaptura(
      frena ? `Demasiados intentos. Espera ${MINUTOS_DE_FRENO} min o pide al dueño que te cambie el PIN.` : "Usuario o PIN incorrecto.",
    );
  }
  if (cuenta.intentosFallidos > 0 || cuenta.bloqueadaHasta) {
    await prisma.cuenta.update({ where: { id: cuenta.id }, data: { intentosFallidos: 0, bloqueadaHasta: null } });
  }
  return { id: cuenta.id, nombre: cuenta.nombre, usuario: cuenta.usuario };
}

function claveDeInstalacionValida(dada: string): boolean {
  const esperada = process.env.CLAVE_INSTALACION ?? "";
  if (!esperada) return true;
  const huella = (texto: string) => createHash("sha256").update(texto).digest();
  return timingSafeEqual(huella(dada), huella(esperada));
}

/** Primer arranque: la cuenta del dueño. Solo funciona con la base vacía. */
export async function crearPrimeraCuenta(datos: { nombre: string; usuario: string; pin: string; repetido: string; clave: string }) {
  if (!claveDeInstalacionValida(datos.clave)) throw new ErrorDeCaptura("La clave de instalación no es correcta.");
  const usuario = limpiarUsuario(datos.usuario);
  if (!usuario) throw new ErrorDeCaptura("El usuario solo puede tener letras y números.");
  revisarPin(datos.pin, datos.repetido);
  // Dentro de una transacción serializable: si dos personas lo intentan a la
  // vez, solo una se queda con la primera cuenta.
  return prisma.$transaction(
    async (tx) => {
      if ((await tx.cuenta.count()) > 0) throw new ErrorDeCaptura("El panel ya está instalado. Entra con tu usuario.");
      return tx.cuenta.create({ data: { nombre: datos.nombre, usuario, pinHash: hashPin(datos.pin), esDueno: true } });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function crearCuenta(datos: { nombre: string; usuario: string; pin: string; esDueno: boolean }) {
  const usuario = limpiarUsuario(datos.usuario);
  if (!usuario) throw new ErrorDeCaptura("El usuario solo puede tener letras y números.");
  revisarPin(datos.pin);
  if (await prisma.cuenta.findUnique({ where: { usuario } })) throw new ErrorDeCaptura(`El usuario "${usuario}" ya está ocupado.`);
  return prisma.cuenta.create({ data: { nombre: datos.nombre, usuario, pinHash: hashPin(datos.pin), esDueno: datos.esDueno } });
}

/** Cambiar el PIN también quita el freno de intentos. */
export async function cambiarPin(cuentaId: string, pin: string) {
  revisarPin(pin);
  const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId }, select: { id: true } });
  if (!cuenta) throw new ErrorDeCaptura("Esa cuenta ya no existe.");
  await prisma.cuenta.update({ where: { id: cuentaId }, data: { pinHash: hashPin(pin), intentosFallidos: 0, bloqueadaHasta: null } });
}

/**
 * Nadie se desactiva a sí mismo —sería la forma más fácil de quedarse fuera— ni
 * deja el panel sin ningún dueño activo.
 */
export async function alternarCuenta(cuentaId: string, quienPide: string): Promise<boolean> {
  const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId } });
  if (!cuenta) throw new ErrorDeCaptura("Esa cuenta ya no existe.");
  if (cuentaId === quienPide) throw new ErrorDeCaptura("No puedes desactivar tu propia cuenta.");
  if (cuenta.activa && cuenta.esDueno) {
    const duenos = await prisma.cuenta.count({ where: { activa: true, esDueno: true } });
    if (duenos <= 1) throw new ErrorDeCaptura("Tiene que quedar al menos un dueño activo.");
  }
  await prisma.cuenta.update({ where: { id: cuentaId }, data: { activa: !cuenta.activa } });
  return !cuenta.activa;
}

export function listarCuentas() {
  return prisma.cuenta.findMany({
    orderBy: [{ esDueno: "desc" }, { activa: "desc" }, { nombre: "asc" }],
    select: { id: true, nombre: true, usuario: true, esDueno: true, activa: true, bloqueadaHasta: true },
  });
}
