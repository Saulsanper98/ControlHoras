import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Wrapper sobre el <select> nativo para quitar el estilo de fábrica del
// navegador (flecha, padding, colores) y sustituirlo por uno acorde a la
// marca. No necesita "use client": sigue siendo un <select> normal, así que
// funciona igual dentro de páginas de servidor (formularios GET, etc.).
export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          "field-control w-full appearance-none rounded-lg px-3 py-2 pr-9 text-sm font-medium text-brand-navy transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
