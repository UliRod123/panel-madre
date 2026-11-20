"use client";

import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

/** El botón de un formulario: dice "Guardando…" y no se deja tocar dos veces. */
export function BotonEnviar({
  children,
  icono,
  textoGuardando = "Guardando…",
  className = "capsula capsula-primaria",
  ...resto
}: {
  children: ReactNode;
  icono?: ReactNode;
  textoGuardando?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} aria-busy={pending} {...resto} disabled={resto.disabled || pending}>
      {icono ? <span className="capsula-chip">{pending ? <Girando /> : icono}</span> : pending ? <Girando /> : null}
      {pending ? textoGuardando : children}
    </button>
  );
}

function Girando() {
  return <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />;
}

/**
 * Vuelve a pedir los tres resúmenes cada minuto mientras la pestaña está a la
 * vista, y en cuanto se regresa a ella. Así el panel puede quedarse abierto en
 * una pantalla todo el día.
 */
export function RecargaAutomatica({ cadaSegundos = 60 }: { cadaSegundos?: number }) {
  const router = useRouter();
  useEffect(() => {
    let ultima = Date.now();
    const recargar = () => {
      if (document.visibilityState !== "visible") return;
      ultima = Date.now();
      router.refresh();
    };
    const reloj = window.setInterval(recargar, cadaSegundos * 1000);
    const alVolver = () => {
      if (document.visibilityState === "visible" && Date.now() - ultima > 15_000) recargar();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      window.clearInterval(reloj);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [router, cadaSegundos]);
  return null;
}
