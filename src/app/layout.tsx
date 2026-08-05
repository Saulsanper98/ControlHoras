import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portal del Empleado",
  description: "Control horario, horarios, vacaciones y noticias",
};

// Toda la app es un portal interno autenticado: cada página depende de la
// sesión del usuario y de datos en vivo (saldo de vacaciones, controles
// pendientes, noticias, etc.). Forzamos renderizado dinámico en toda la
// aplicación para evitar que Next.js intente pre-renderizar estáticamente
// en build-time cualquier página (lo que "congelaría" datos del momento del
// build y además requeriría BD accesible durante `next build`).
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
