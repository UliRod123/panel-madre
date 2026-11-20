import { connection } from "next/server";
import { leerLosTres, pendientes } from "@/lib/paneles";
import { hora } from "@/lib/fechas";
import { RecargaAutomatica } from "@/components/interacciones";
import { LoQueHayQueVer, TarjetaPedidos, TarjetaProduccion, TarjetaRastreo } from "@/components/tarjetas";

export const metadata = { title: "Hoy" };

/**
 * Hoy en los tres paneles. Cada uno se lee de su propio sistema al abrir la
 * pantalla y cada minuto mientras se tenga a la vista.
 */
export default async function PaginaHoy() {
  await connection();
  const lecturas = await leerLosTres();
  const lista = pendientes(lecturas);
  const leidos = [lecturas.produccion, lecturas.rastreo, lecturas.pedidos].filter((lectura) => lectura.estado === "ok").length;
  const { fuentes } = lecturas;

  return (
    <div className="space-y-5">
      <RecargaAutomatica />
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-marca-950 sm:text-3xl">Cómo va el día</h1>
          <p className="text-sm text-slate-600">Producción, rutas y pedidos, sin abrir cada panel.</p>
        </div>
        <p className="text-xs text-slate-500">Actualizado a las {hora(new Date())} · se actualiza solo cada minuto</p>
      </div>

      <LoQueHayQueVer lista={lista} leidos={leidos} nombres={{ produccion: fuentes.produccion.nombre, rastreo: fuentes.rastreo.nombre, pedidos: fuentes.pedidos.nombre }} />

      <div className="grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <TarjetaProduccion fuente={fuentes.produccion} lectura={lecturas.produccion} />
        <TarjetaRastreo fuente={fuentes.rastreo} lectura={lecturas.rastreo} />
        <TarjetaPedidos fuente={fuentes.pedidos} lectura={lecturas.pedidos} />
      </div>
    </div>
  );
}
