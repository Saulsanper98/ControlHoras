import Link from "next/link";
import { cn } from "@/lib/utils";

/** Selector de año con chips. Recibe hrefs ya resueltos (no funciones: Server→Client safe). */
export function YearSwitcher({
  year,
  options = [],
  className,
  id,
  labelledBy,
}: {
  year: number;
  options?: { year: number; href: string }[];
  className?: string;
  id?: string;
  /** id del elemento que etiqueta el grupo (p. ej. un <label id="…">). */
  labelledBy?: string;
}) {
  if (options.length === 0) return null;

  return (
    <div
      id={id}
      className={cn("flex flex-wrap gap-1.5", className)}
      role="group"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : "Seleccionar año"}
    >
      {options.map((opt) => {
        const active = opt.year === year;
        return (
          <Link
            key={opt.year}
            href={opt.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-lg px-3 py-1.5 text-sm font-medium tabular-nums transition",
              active
                ? "bg-brand-blue text-white"
                : "text-slate-600 hover:bg-brand-navy/8 hover:text-brand-navy"
            )}
          >
            {opt.year}
          </Link>
        );
      })}
    </div>
  );
}
