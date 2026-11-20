import { redirect } from "next/navigation";
import { connection } from "next/server";
import { faltaInstalar, sesionActual } from "@/lib/sesion";

/** La dirección pelona: el panel a quien ya entró, la puerta a los demás. */
export default async function Inicio() {
  // Se decide en cada visita, no al compilar.
  await connection();
  if (await faltaInstalar()) redirect("/instalar");
  if (await sesionActual()) redirect("/panel");
  redirect("/entrar");
}
