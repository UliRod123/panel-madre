"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconoHoy, IconoPersona } from "@/components/iconos";

/** Las pantallas del panel, como pestañas sobre la barra de arriba. */
export function Navegacion({ esDueno }: { esDueno: boolean }) {
  const ruta = usePathname();
  const destinos = [
    { href: "/panel", texto: "Hoy", icono: <IconoHoy tam={15} /> },
    ...(esDueno ? [{ href: "/panel/cuentas", texto: "Cuentas", icono: <IconoPersona tam={15} /> }] : []),
  ];
  return (
    <nav aria-label="Panel" className="flex gap-1 overflow-x-auto">
      {destinos.map((destino) => {
        const activo = destino.href === "/panel" ? ruta === "/panel" : ruta.startsWith(destino.href);
        return (
          <Link
            key={destino.href}
            href={destino.href}
            aria-current={activo ? "page" : undefined}
            className={`inline-flex min-h-10 flex-none items-center gap-2 rounded-xl px-3.5 text-sm font-bold no-underline transition-colors duration-150 ${
              activo ? "bg-white/12 text-white ring-1 ring-white/15" : "text-marca-100 hover:text-white"
            }`}
          >
            {destino.icono}
            {destino.texto}
          </Link>
        );
      })}
    </nav>
  );
}
