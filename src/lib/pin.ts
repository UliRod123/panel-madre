import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Los PIN son cortos, así que se guardan con scrypt + sal individual.
 * Formato almacenado: "<sal hex>:<hash hex>".
 */
const LONGITUD_CLAVE = 32;

export function hashPin(pin: string): string {
  const sal = randomBytes(16);
  const derivada = scryptSync(pin.trim(), sal, LONGITUD_CLAVE);
  return `${sal.toString("hex")}:${derivada.toString("hex")}`;
}

export function verificarPin(pin: string, almacenado: string): boolean {
  const [salHex, hashHex] = almacenado.split(":");
  if (!salHex || !hashHex) return false;
  try {
    const derivada = scryptSync(pin.trim(), Buffer.from(salHex, "hex"), LONGITUD_CLAVE);
    const esperado = Buffer.from(hashHex, "hex");
    if (esperado.length !== derivada.length) return false;
    return timingSafeEqual(derivada, esperado);
  } catch {
    return false;
  }
}

export function pinValido(pin: string): boolean {
  return /^\d{4,8}$/.test(pin.trim());
}
