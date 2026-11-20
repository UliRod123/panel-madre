import { requerirCuenta } from "@/lib/sesion";
import { claveHoy, fechaLarga } from "@/lib/fechas";
import { salir } from "@/server/acceso";
import { Marca } from "@/components/Marca";
import { Navegacion } from "@/components/Navegacion";
import { IconoSalir } from "@/components/iconos";

/** El marco del panel: la barra de arriba con las pantallas, quién entró y la salida. */
export default async function LayoutPanel({ children }: LayoutProps<"/panel">) {
  const cuenta = await requerirCuenta();

  return (
    <div className="panel-shell flex min-h-full flex-1 flex-col">
      <header className="panel-navegacion safe-inline-panel sticky top-0 z-40 text-white">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center gap-x-5 gap-y-2 pt-[max(.65rem,env(safe-area-inset-top))] pb-2.5">
          <Marca subtitulo={fechaLarga(claveHoy())} />
          <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
            <Navegacion esDueno={cuenta.esDueno} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-right text-xs sm:block">
              <span className="block font-bold text-white">{cuenta.nombre}</span>
              <span className="text-marca-100">{cuenta.esDueno ? "Dueño" : "Jefa"}</span>
            </span>
            <form action={salir}>
              <button className="capsula capsula-sm capsula-fantasma h-10 text-marca-100 hover:text-white">
                <IconoSalir tam={15} />
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="entrada-panel safe-inline-panel py-5 lg:py-7">
        <div className="mx-auto max-w-[1480px]">{children}</div>
      </main>
    </div>
  );
}
