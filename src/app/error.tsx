"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm glass-panel rounded-2xl p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="mb-1 text-lg font-semibold text-brand-navy">Algo salió mal</h1>
        <p className="mb-6 text-sm text-slate-500">
          Ha ocurrido un error inesperado. Puedes intentarlo de nuevo; si el problema
          persiste, contacta con tu responsable.
        </p>
        {error.digest && (
          <p className="mb-6 text-xs text-slate-500">Referencia: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={() => retry()}
          className="w-full rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
