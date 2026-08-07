"use client";

import { useId, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

// Zona de arrastrar-y-soltar reutilizable. Sube el archivo en cuanto se
// suelta/selecciona (no requiere un botón "Subir" aparte).
export function FileDropzone({
  accept,
  disabled,
  pending,
  label = "Arrastra un archivo aquí o haz clic para seleccionarlo",
  onFile,
  className,
}: {
  accept?: string;
  disabled?: boolean;
  pending?: boolean;
  label?: string;
  onFile: (file: File) => void;
  className?: string;
}) {
  const inputId = useId();
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-center text-xs font-medium text-brand-navy/55 transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-blue/30",
        dragOver
          ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
          : "border-brand-navy/18 bg-brand-navy/[0.03] hover:border-brand-blue/45 hover:bg-brand-navy/[0.055]",
        disabled && "pointer-events-none cursor-not-allowed opacity-60",
        className
      )}
    >
      <UploadCloud className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{pending ? "Subiendo…" : label}</span>
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </label>
  );
}
