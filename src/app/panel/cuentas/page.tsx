import { requerirDueno } from "@/lib/sesion";
import { listarCuentas } from "@/lib/cuentas";
import { leerMensajes } from "@/lib/formulario";
import { activarODesactivar, darDeAlta, nuevoPin } from "@/server/cuentas";
import { BotonEnviar } from "@/components/interacciones";
import { IconoCandado, IconoMas } from "@/components/iconos";

export const metadata = { title: "Cuentas" };

/** Quién entra al panel madre. Solo la ve el dueño. */
export default async function PaginaCuentas({ searchParams }: PageProps<"/panel/cuentas">) {
  const sesion = await requerirDueno();
  const [cuentas, parametros] = await Promise.all([listarCuentas(), searchParams]);
  const { error, ok } = leerMensajes(parametros);
  const ahora = new Date();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-marca-950 sm:text-3xl">Cuentas</h1>
        <p className="text-sm text-slate-600">
          Quién puede entrar al panel madre. Todas ven lo mismo; solo el dueño da de alta y cambia PIN.
        </p>
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-950">{error}</p>
      ) : null}
      {ok ? (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950">{ok}</p>
      ) : null}

      <section className="tarjeta overflow-hidden" aria-labelledby="titulo-cuentas">
        <h2 id="titulo-cuentas" className="border-b border-slate-200/80 px-4 py-3.5 text-lg font-bold text-marca-950 sm:px-5">
          Con acceso
        </h2>
        <ul className="divide-y divide-slate-100">
          {cuentas.map((cuenta) => {
            const frenada = cuenta.bloqueadaHasta && cuenta.bloqueadaHasta > ahora;
            return (
              <li key={cuenta.id} className={`space-y-3 px-4 py-4 sm:px-5 ${cuenta.activa ? "" : "bg-slate-50"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 flex-1 font-bold text-slate-900">
                    {cuenta.nombre} <span className="font-normal text-slate-500">· {cuenta.usuario}</span>
                  </p>
                  {cuenta.esDueno ? <span className="rounded-full bg-marca-900 px-2 py-0.5 text-xs font-bold text-white">Dueño</span> : null}
                  {!cuenta.activa ? <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">Desactivada</span> : null}
                  {frenada ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">Frenada por intentos</span> : null}
                  {cuenta.id === sesion.id ? <span className="text-xs text-slate-500">(tú)</span> : null}
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <form action={nuevoPin} className="flex items-end gap-2">
                    <input type="hidden" name="cuentaId" value={cuenta.id} />
                    <div>
                      <label className="rotulo text-xs" htmlFor={`pin-${cuenta.id}`}>PIN nuevo</label>
                      <input id={`pin-${cuenta.id}`} name="pin" type="password" inputMode="numeric" className="campo w-36" placeholder="4 a 8 números" autoComplete="new-password" required />
                    </div>
                    <BotonEnviar className="capsula capsula-sm capsula-normal h-11" icono={<IconoCandado tam={14} />}>
                      Cambiar PIN
                    </BotonEnviar>
                  </form>
                  {cuenta.id !== sesion.id ? (
                    <form action={activarODesactivar} className="ml-auto">
                      <input type="hidden" name="cuentaId" value={cuenta.id} />
                      <BotonEnviar className={`capsula capsula-sm h-11 ${cuenta.activa ? "capsula-normal text-rose-800" : "capsula-exito"}`}>
                        {cuenta.activa ? "Desactivar" : "Activar"}
                      </BotonEnviar>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="tarjeta p-4 sm:p-5" aria-labelledby="titulo-alta">
        <h2 id="titulo-alta" className="text-lg font-bold text-marca-950">Dar de alta</h2>
        <p className="mb-4 text-sm text-slate-600">Por ejemplo a Meche o a Marisol. Dile su usuario y su PIN en persona.</p>
        <form action={darDeAlta} className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="rotulo" htmlFor="nombre">Nombre</label>
            <input id="nombre" name="nombre" className="campo" placeholder="Meche" required />
          </div>
          <div>
            <label className="rotulo" htmlFor="usuario">Usuario</label>
            <input id="usuario" name="usuario" className="campo" placeholder="meche" autoCapitalize="none" autoCorrect="off" required />
          </div>
          <div>
            <label className="rotulo" htmlFor="pin-nuevo">PIN</label>
            <input id="pin-nuevo" name="pin" type="password" inputMode="numeric" className="campo" placeholder="4 a 8 números" autoComplete="new-password" required />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
            <input type="checkbox" name="esDueno" className="size-4" />
            También es dueño (puede dar de alta y cambiar PIN)
          </label>
          <div className="sm:text-right">
            <BotonEnviar className="capsula capsula-primaria w-full sm:w-auto" icono={<IconoMas tam={15} />}>
              Dar de alta
            </BotonEnviar>
          </div>
        </form>
      </section>
    </div>
  );
}
