import { SignJWT, jwtVerify } from "jose";

/** Contenido de la cookie de sesión. Se firma, no se cifra: nada sensible aquí. */
export type Sesion = {
  id: string;
  nombre: string;
  usuario: string;
};

export const COOKIE_SESION = "madre_sesion";
const DURACION = "30d";

function secreto(): Uint8Array {
  const valor = process.env.AUTH_SECRET;
  if (!valor || valor.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Falta AUTH_SECRET (mínimo 16 caracteres). Genera uno con: openssl rand -base64 32");
    }
    // Solo para desarrollo local sin configuración.
    return new TextEncoder().encode("desarrollo-local-panel-madre");
  }
  return new TextEncoder().encode(valor);
}

export async function firmarSesion(sesion: Sesion): Promise<string> {
  return new SignJWT({ ...sesion, tipo: "madre" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DURACION)
    .sign(secreto());
}

export async function verificarSesion(token: string | undefined): Promise<Sesion | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secreto());
    if (payload.tipo !== "madre" || !payload.id) return null;
    return {
      id: String(payload.id),
      nombre: String(payload.nombre ?? ""),
      usuario: String(payload.usuario ?? ""),
    };
  } catch {
    return null;
  }
}
