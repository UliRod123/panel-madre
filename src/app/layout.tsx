import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NOMBRE_APP } from "@/components/Marca";

export const metadata: Metadata = {
  title: {
    default: NOMBRE_APP,
    template: `%s · ${NOMBRE_APP}`,
  },
  description: "Producción, rutas y pedidos de hoy en una sola pantalla",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: NOMBRE_APP,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#10283f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full" data-scroll-behavior="smooth">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
