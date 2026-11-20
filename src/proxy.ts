import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarSesion } from "@/lib/token";

/**
 * Primera barrera del panel: valida la firma de la cookie antes de tocar la
 * base. Que la cuenta siga activa lo revisa `requerirCuenta` en cada pantalla.
 */
export async function proxy(peticion: NextRequest) {
  const sesion = await verificarSesion(peticion.cookies.get(COOKIE_SESION)?.value);
  if (!sesion) {
    const destino = new URL("/entrar", peticion.url);
    destino.searchParams.set("volver", peticion.nextUrl.pathname);
    return NextResponse.redirect(destino);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};
