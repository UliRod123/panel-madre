import { redirect } from "next/navigation";
import { connection } from "next/server";
import { faltaInstalar } from "@/lib/sesion";
import { instalar } from "@/server/acceso";
import { IconoGuardar } from "@/components/iconos";
import { MarcoAcceso } from "@/components/MarcoAcceso";
import { BotonEnviar } from "@/components/interacciones";

export const metadata = { title: "Primer arranque" };

/**
 * La cuenta del dueño. Solo se ve con la base vacía: en cuanto existe una
 * cuenta, esta pantalla manda a la entrada.
 */
export default async function PaginaInstalar({ searchParams }: PageProps<"/instalar">) {
  await connection();
  if (!(await faltaInstalar())) redirect("/entrar");
  const parametros = await searchParams;
  const error = typeof parametros.error === "string" ? parametros.error : "";
  const pideClave = Boolean(process.env.CLAVE_INSTALACION);

  return (
    <MarcoAcceso
      ceja="Primer arranque"
      titulo="Tu cuenta de dueño"
      descripcion="Con ella entras y das de alta a las jefas. Esta pantalla desaparece en cuanto la guardes."
    >
      <form action={instalar} className="tarjeta space-y-4 p-5 sm:p-6">
        {error ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-950">
            {error}
          </p>
        ) : null}
        {pideClave ? (
          <div>
            <label className="rotulo" htmlFor="clave">Clave de instalación</label>
            <input id="clave" name="clave" type="password" className="campo" autoComplete="off" required />
            <p className="mt-1 text-xs text-slate-500">La que pusiste en Vercel como CLAVE_INSTALACION.</p>
          </div>
        ) : null}
        <div>
          <label className="rotulo" htmlFor="nombre">Tu nombre</label>
          <input id="nombre" name="nombre" className="campo" placeholder="Ulises" autoComplete="name" required />
        </div>
        <div>
          <label className="rotulo" htmlFor="usuario">Usuario</label>
          <input id="usuario" name="usuario" className="campo" placeholder="ulises" autoCapitalize="none" autoCorrect="off" autoComplete="username" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="rotulo" htmlFor="pin">PIN</label>
            <input id="pin" name="pin" type="password" className="campo" inputMode="numeric" placeholder="4 a 8 números" autoComplete="new-password" required />
          </div>
          <div>
            <label className="rotulo" htmlFor="repetir">Otra vez</label>
            <input id="repetir" name="repetir" type="password" className="campo" inputMode="numeric" autoComplete="new-password" required />
          </div>
        </div>
        <BotonEnviar className="capsula capsula-primaria w-full" icono={<IconoGuardar />}>
          Guardar y entrar
        </BotonEnviar>
      </form>
    </MarcoAcceso>
  );
}
