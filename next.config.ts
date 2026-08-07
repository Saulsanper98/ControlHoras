import type { NextConfig } from "next";

// Cabeceras de seguridad básicas aplicadas a toda la app. No se restringe
// script-src/style-src con una CSP estricta para no romper la hidratación
// de Next.js (requeriría nonces); se cubren en cambio las protecciones de
// bajo riesgo con alto impacto: clickjacking, MIME sniffing, filtrado de
// referrer y permisos de APIs del navegador que esta app no usa.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Acceso al dev server desde la LAN (p. ej. http://192.168.12.45:3000)
  allowedDevOrigins: ["192.168.12.45"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
