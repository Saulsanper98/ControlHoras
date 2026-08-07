import { cn } from "@/lib/utils";

/** Página 404 alineada con la marca. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--app-canvas)] px-6">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8 text-center">
        <p className="text-caption font-semibold uppercase tracking-wide text-brand-blue">404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-brand-navy">
          Página no encontrada
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          La ruta no existe o ya no está disponible.
        </p>
        <a href="/" className="btn-primary mt-6 inline-flex">
          Ir al inicio
        </a>
      </div>
    </div>
  );
}
