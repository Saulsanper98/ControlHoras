"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function SignaturePreview({
  label,
  signedAt,
  src,
  alt,
  className,
}: {
  label: string;
  signedAt?: string | null;
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn(className)}>
      <p className="mb-1 text-xs text-slate-500">
        {label}
        {signedAt ? <span className="ml-1 text-slate-400">· {signedAt}</span> : null}
      </p>
      {failed ? (
        <div
          className="flex h-16 items-center justify-center gap-2 rounded-lg border border-[color:var(--surface-divider)] bg-[color:var(--surface-muted)] px-2 text-xs text-slate-500"
          role="img"
          aria-label={alt}
        >
          <ImageOff className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>No se pudo cargar la firma</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setFailed(true)}
          className="h-16 rounded-lg border border-[color:var(--surface-divider)] bg-[color:var(--surface-muted)] p-2"
        />
      )}
    </div>
  );
}
