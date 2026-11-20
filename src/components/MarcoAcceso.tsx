import type { ReactNode } from "react";
import { Marca } from "@/components/Marca";

export function MarcoAcceso({
  ceja,
  titulo,
  descripcion,
  children,
  pie,
}: {
  ceja: string;
  titulo: string;
  descripcion: string;
  children: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <main className="panel-navegacion safe-inline-compact safe-bottom relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden py-[max(2rem,env(safe-area-inset-top))]">
      <span className="absolute -top-24 -right-20 size-72 rounded-full bg-marca-300/10" aria-hidden />
      <span className="absolute -bottom-32 -left-24 size-80 rounded-full bg-turquesa-300/10" aria-hidden />

      <div className="relative w-full max-w-md">
        <div className="mb-5 flex justify-center">
          <Marca grande />
        </div>

        <div className="mb-5 text-center text-white">
          <p className="text-xs font-bold tracking-[0.14em] text-turquesa-200 uppercase">{ceja}</p>
          <h1 className="mt-2 text-3xl leading-tight font-bold tracking-[-0.03em]">{titulo}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-marca-100">{descripcion}</p>
        </div>

        {children}

        {pie ? <div className="mt-4 text-center text-xs leading-relaxed text-marca-100/75">{pie}</div> : null}
      </div>
    </main>
  );
}
