"use client";

import { useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
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
        "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-center text-xs font-medium text-brand-navy/55 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30",
        dragOver
          ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
          : "border-brand-navy/18 bg-brand-navy/[0.03] hover:border-brand-blue/45 hover:bg-brand-navy/[0.055]",
        disabled && "cursor-not-allowed opacity-60 hover:border-brand-navy/18 hover:bg-brand-navy/[0.03]",
        className
      )}
    >
      <UploadCloud className="h-4 w-4 shrink-0" />
      <span>{pending ? "Subiendo…" : label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
