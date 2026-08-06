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
          "surface-input w-full appearance-none rounded-md px-3 py-1.5 pr-8 text-sm text-slate-700 transition-colors",
          "focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20",
          "disabled:cursor-not-allowed disabled:text-slate-400",
          className
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
