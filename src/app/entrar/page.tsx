import { redirect } from "next/navigation";
import { connection } from "next/server";
import { faltaInstalar, sesionActual } from "@/lib/sesion";
import { entrar } from "@/server/acceso";
import { IconoCandado } from "@/components/iconos";
import { MarcoAcceso } from "@/components/MarcoAcceso";
import { BotonEnviar } from "@/components/interacciones";

export const metadata = { title: "Entrar" };

export default async function PaginaEntrar({ searchParams }: PageProps<"/entrar">) {
  await connection();
  if (await faltaInstalar()) redirect("/instalar");
  if (await sesionActual()) redirect("/panel");

  const parametros = await searchParams;
  const texto = (clave: string) => (typeof parametros[clave] === "string" ? (parametros[clave] as string) : "");
  const error = texto("error");
  const ok = texto("ok");

  return (
    <MarcoAcceso
      ceja="Todo el negocio"
      titulo="Entrar"
      descripcion="Producción, rutas y pedidos de hoy en una sola pantalla."
      pie="Si no tienes usuario, pídeselo al dueño."
    >
      <form action={entrar} className="tarjeta space-y-4 p-5 sm:p-6">
        <input type="hidden" name="volver" value={texto("volver")} />
        {error ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-950">
            {error}
          </p>
        ) : null}
        {ok ? (
          <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950">
            {ok}
          </p>
        ) : null}
        <div>
          <label className="rotulo" htmlFor="usuario">Usuario</label>
          <input id="usuario" name="usuario" className="campo" placeholder="meche" defaultValue={texto("usuario")} autoCapitalize="none" autoCorrect="off" autoComplete="username" required />
        </div>
        <div>
          <label className="rotulo" htmlFor="pin">PIN</label>
          <input id="pin" name="pin" type="password" className="campo" placeholder="••••" inputMode="numeric" autoComplete="current-password" required />
        </div>
        <BotonEnviar className="capsula capsula-primaria w-full" icono={<IconoCandado />} textoGuardando="Entrando…">
          Entrar
        </BotonEnviar>
      </form>
    </MarcoAcceso>
  );
}
