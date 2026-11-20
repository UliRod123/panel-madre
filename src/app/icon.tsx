import { ImageResponse } from "next/og";
import { dibujoPaneles } from "@/components/Marca";

/** Los íconos de la app, dibujados aquí en vez de guardarse como PNG. */
export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default async function Icono({ id }: { id: Promise<string> }) {
  const tam = Number(await id) || 192;
  return new ImageResponse(dibujoPaneles({ tam, esquina: tam <= 32 ? 14 : 16 }), { width: tam, height: tam });
}
