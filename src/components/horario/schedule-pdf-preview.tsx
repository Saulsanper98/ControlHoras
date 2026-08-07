"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function SchedulePdfPreview({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <p className="border-y border-[color:var(--surface-divider)] py-6 text-center text-sm text-slate-500">
        No se pudo cargar la vista previa. Usa Abrir PDF o Descargar.
      </p>
    );
  }

  return (
    <div className="relative mx-auto max-w-4xl overflow-hidden border-y border-[color:var(--surface-divider)] bg-brand-navy/[0.03]">
      {!loaded && (
        <div className="absolute inset-0 z-10 flex flex-col gap-3 p-6">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-full min-h-[20rem] w-full" />
        </div>
      )}
      <iframe
        src={src}
        title={title}
        className={`h-[min(75vh,52rem)] w-full transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </div>
  );
}
