/* ============================================================================
   La marca de la app: "Panel Madre"

   Tres placas en escalera sobre el mismo cuadro turquesa de Producción: los
   tres paneles vistos desde arriba. Es la misma figura en la entrada, el panel
   y el ícono del teléfono.
   ========================================================================== */

export const NOMBRE_APP = "Panel Madre";

/**
 * La figura sola. Es una función y no un componente para poder dibujarla
 * también dentro de `ImageResponse` (los íconos generados).
 */
export function dibujoPaneles({ tam, esquina = 16, margen = 0 }: { tam: number; esquina?: number; margen?: number }) {
  const escala = (64 - margen * 2) / 64;
  return (
    <svg width={tam} height={tam} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="64" height="64" rx={esquina} fill="#0a8587" />
      <g transform={`translate(${margen} ${margen}) scale(${escala})`}>
        <rect x="13" y="12" width="38" height="11" rx="3.5" fill="#cef6f3" />
        <rect x="13" y="26.5" width="38" height="11" rx="3.5" fill="#35c0bd" />
        <rect x="13" y="41" width="38" height="11" rx="3.5" fill="#0b696d" stroke="#ffffff" strokeWidth="2.6" />
        <circle cx="19.5" cy="17.5" r="2.4" fill="#0b696d" />
        <circle cx="19.5" cy="32" r="2.4" fill="#ffffff" />
        <circle cx="19.5" cy="46.5" r="2.4" fill="#ffffff" />
      </g>
    </svg>
  );
}

/** Ícono + nombre, para las barras oscuras de arriba y la pantalla de entrada. */
export function Marca({ grande = false, subtitulo }: { grande?: boolean; subtitulo?: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-3">
      <span className="flex-none drop-shadow-[0_8px_18px_rgb(0_0_0/0.25)]">{dibujoPaneles({ tam: grande ? 56 : 38 })}</span>
      <span className="min-w-0 text-left leading-tight">
        <span className={`block truncate font-bold tracking-[-0.02em] text-white ${grande ? "text-2xl" : "text-[15px]"}`}>
          {NOMBRE_APP}
        </span>
        {subtitulo ? <span className="block truncate text-xs text-marca-100 first-letter:uppercase">{subtitulo}</span> : null}
      </span>
    </span>
  );
}
