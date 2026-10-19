import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nails & Co. · Reserva tu Cita Clásica",
  description: "Estudio de manicuría, kapping y diseños de uñas con estilo cartoon clásico de los años 30.",
  icons: {
    icon: "/mascot.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased retro-paper-bg text-slate-900 min-h-screen selection:bg-mascot-purple selection:text-white">
        {children}
      </body>
    </html>
  );
}