/** Mientras llegan los tres resúmenes: el esqueleto de la pantalla. */
export default function Cargando() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Leyendo los tres paneles">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((indice) => (
          <div key={indice} className="h-96 animate-pulse rounded-2xl bg-slate-200/70" />
        ))}
      </div>
    </div>
  );
}
