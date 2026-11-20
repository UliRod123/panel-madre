import { ImageResponse } from "next/og";
import { dibujoPaneles } from "@/components/Marca";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** El del iPhone/iPad: a sangre, porque iOS redondea las esquinas solo. */
export default function IconoApple() {
  return new ImageResponse(dibujoPaneles({ tam: 180, esquina: 0, margen: 6 }), size);
}
