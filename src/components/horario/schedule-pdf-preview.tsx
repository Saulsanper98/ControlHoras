"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/** Tiempo máximo del overlay de carga; el iframe sigue visible. */
const SKELETON_MAX_MS = 4_000;

export function SchedulePdfPreview({ src, title }: { src: string; title: string }) {
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    setShowSkeleton(true);
    const timer = window.setTimeout(() => setShowSkeleton(false), SKELETON_MAX_MS);
    return () => window.clearTimeout(timer);
  }, [src]);

  // PDF embebido: muchos navegadores no disparan onLoad de forma fiable.
  // Mostramos el iframe siempre y solo ocultamos el skeleton al cargar o al timeout.
  return (
    <div className="relative mx-auto max-w-4xl overflow-hidden border-y border-[color:var(--surface-divider)] bg-brand-navy/[0.03]">
      {showSkeleton && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-3 p-6">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-full min-h-[20rem] w-full" />
        </div>
      )}
      <iframe
        src={src}
        title={title}
        className="h-[min(75vh,52rem)] w-full bg-white"
        onLoad={() => setShowSkeleton(false)}
      />
    </div>
  );
}
