"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/** Selector de año: chips (instantáneo) o se deja al formulario padre con Select. */
export function YearSwitcher({
  years,
  year,
  hrefForYear,
  className,
}: {
  years: number[];
  year: number;
  hrefForYear: (y: number) => string;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-wrap gap-1.5", className)}
      role="group"
      aria-label="Seleccionar año"
    >
      {years.map((y) => {
        const active = y === year;
        return (
          <Link
            key={y}
            href={hrefForYear(y)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium tabular-nums transition",
              active
                ? "bg-brand-blue text-white"
                : "text-slate-600 hover:bg-brand-navy/8 hover:text-brand-navy"
            )}
          >
            {y}
          </Link>
        );
      })}
    </div>
  );
}
