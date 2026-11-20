/**
 * Iconos ligeros del sistema visual del panel.
 *
 * Todos se dibujan sobre una rejilla de 16×16 con `currentColor`, así que
 * heredan el color de la cápsula que los contiene y no hay que mantener una
 * versión por color. Son trazo puro: pesan menos que una imagen y se ven
 * nítidos a cualquier tamaño.
 *
 * Este archivo no lleva "use client" a propósito: los iconos son marcado
 * estático y deben poder usarse tanto desde componentes de servidor como
 * desde los de cliente de `interacciones.tsx`.
 */

import type { ReactNode } from "react";

/** Tamaño de dibujo por defecto. El chip de la calle usa 22. */
const TAM = 18;

function Icono({ children, tam = TAM }: { children: ReactNode; tam?: number }) {
  return (
    <svg
      width={tam}
      height={tam}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

type Props = { tam?: number };

/** Palomita. Con `animada` se dibuja sola: es el remate de una acción hecha. */
export function IconoPalomita({ animada = false, tam = TAM }: Props & { animada?: boolean }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 16 16" aria-hidden>
      <path
        d="M2.8 8.4l3.4 3.4L13.2 4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={animada ? 18 : undefined}
        strokeDashoffset={animada ? 18 : undefined}
        style={animada ? { animation: "trazo .44s cubic-bezier(.2,.9,.25,1) forwards" } : undefined}
      />
    </svg>
  );
}

/** El día en curso: un tablero con su aguja. Es el icono de "Hoy". */
export function IconoHoy({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M2.2 11.4a6 6 0 1111.6 0" />
      <path d="M8 9.6l2.6-3" />
      <circle cx="8" cy="9.8" r="1" />
      <path d="M2.6 13.6h10.8" />
    </Icono>
  );
}

export function IconoPin({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M8 14.2s4.6-4.1 4.6-7.5a4.6 4.6 0 10-9.2 0c0 3.4 4.6 7.5 4.6 7.5z" />
      <circle cx="8" cy="6.6" r="1.7" />
    </Icono>
  );
}

export function IconoCamion({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M1.6 4.2h7.2v6.6H1.6z" />
      <path d="M8.8 6.6h2.9l2.7 2.5v1.7h-5.6z" />
      <circle cx="4.6" cy="12.4" r="1.5" />
      <circle cx="11.5" cy="12.4" r="1.5" />
    </Icono>
  );
}

export function IconoTelefono({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M5.6 2.4l1.5 2.6-1.4 1.4a8 8 0 003.9 3.9l1.4-1.4 2.6 1.5v2.1c0 .6-.5 1.1-1.1 1.1A11.6 11.6 0 012.4 3.5c0-.6.5-1.1 1.1-1.1z" />
    </Icono>
  );
}

export function IconoCamara({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M1.8 5.2h2.6l1-1.6h5.2l1 1.6h2.6v8H1.8z" />
      <circle cx="8" cy="9" r="2.6" />
    </Icono>
  );
}

export function IconoMas({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M8 3.2v9.6M3.2 8h9.6" />
    </Icono>
  );
}

export function IconoFlecha({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M3 8h9.4M8.6 4.2L12.4 8l-3.8 3.8" />
    </Icono>
  );
}

export function IconoEquis({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M4.6 4.6l6.8 6.8M11.4 4.6l-6.8 6.8" />
    </Icono>
  );
}

export function IconoReloj({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <circle cx="8" cy="8" r="5.9" />
      <path d="M8 4.6V8l2.3 1.6" />
    </Icono>
  );
}

export function IconoGuardar({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M2.4 2.9h8.3l2.9 2.9v7.3H2.4z" />
      <path d="M5.3 2.9v3.6h5.4V2.9M5.3 13.1V9.5h5.4v3.6" />
    </Icono>
  );
}

export function IconoLupa({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <circle cx="7.1" cy="7.1" r="4.4" />
      <path d="M10.3 10.3l3.1 3.1" />
    </Icono>
  );
}

export function IconoAlerta({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M8 2.3l6 10.4H2z" />
      <path d="M8 6.4v3.1M8 11.4h.01" />
    </Icono>
  );
}

export function IconoCampana({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M4 6.9a4 4 0 018 0c0 3 1.2 3.9 1.2 3.9H2.8S4 9.9 4 6.9z" />
      <path d="M6.6 13.1a1.6 1.6 0 002.8 0" />
    </Icono>
  );
}

export function IconoCaja({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M2.2 5.2L8 2.4l5.8 2.8v5.6L8 13.6l-5.8-2.8z" />
      <path d="M2.2 5.2L8 8l5.8-2.8M8 8v5.6" />
    </Icono>
  );
}

export function IconoPersona({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <circle cx="8" cy="5.6" r="2.7" />
      <path d="M2.9 13.4a5.1 5.1 0 0110.2 0" />
    </Icono>
  );
}

export function IconoCalendario({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <rect x="2.3" y="3.4" width="11.4" height="10.3" rx="1.6" />
      <path d="M2.3 6.6h11.4M5.6 2.3v2.2M10.4 2.3v2.2" />
    </Icono>
  );
}

export function IconoCandado({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <rect x="3.3" y="7.1" width="9.4" height="6.6" rx="1.6" />
      <path d="M5.6 7.1V5.3a2.4 2.4 0 014.8 0v1.8" />
    </Icono>
  );
}

export function IconoBasura({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M2.9 4.3h10.2M6.2 4.3V2.9h3.6v1.4" />
      <path d="M4.3 4.3l.7 8.8h6l.7-8.8" />
    </Icono>
  );
}

export function IconoRefrescar({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M13.3 8a5.3 5.3 0 11-1.6-3.8" />
      <path d="M13.4 2.6v3.1h-3.1" />
    </Icono>
  );
}

export function IconoRayo({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M8.9 1.8L3.4 9.1h3.7l-.9 5.1 5.5-7.3H8z" />
    </Icono>
  );
}

/** Dos fotos encimadas: el carrete del teléfono. */
export function IconoGaleria({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M5.6 2.6h7.2a1.2 1.2 0 011.2 1.2v6a1.2 1.2 0 01-1.2 1.2H5.6a1.2 1.2 0 01-1.2-1.2v-6a1.2 1.2 0 011.2-1.2z" />
      <path d="M4.4 8.6l2.1-1.9 2.3 2 1.7-1.4 3.5 3" />
      <path d="M11.4 13.4H3.2A1.2 1.2 0 012 12.2V5.4" />
    </Icono>
  );
}

/** Tres barras y una línea de base: la pantalla de medir. */
export function IconoGrafica({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M2.2 13.4h11.6" />
      <path d="M4.6 11.2V7.4" />
      <path d="M8 11.2V3.6" />
      <path d="M11.4 11.2V5.9" />
    </Icono>
  );
}

export function IconoSalir({ tam }: Props) {
  return (
    <Icono tam={tam}>
      <path d="M6.2 13.4H3.4a1.2 1.2 0 01-1.2-1.2V3.8a1.2 1.2 0 011.2-1.2h2.8" />
      <path d="M10.2 11.1L13.4 8l-3.2-3.1M13.4 8H6" />
    </Icono>
  );
}
