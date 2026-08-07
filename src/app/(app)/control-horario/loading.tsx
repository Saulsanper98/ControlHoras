import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton del control horario: cabecera + filas de días. */
export default function Loading() {
  return (
    <div className="animate-fade-slide-up space-y-4" aria-busy="true" aria-label="Cargando control horario">
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[color:var(--surface-divider)] py-4">
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="space-y-0 divide-y divide-[color:var(--surface-divider)] border-y border-[color:var(--surface-divider)]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[3rem_1fr_1fr_4rem] items-center gap-3 py-2.5 sm:grid-cols-[4rem_6rem_6rem_5rem_1fr]">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-8 w-full max-w-[5.5rem]" />
            <Skeleton className="h-8 w-full max-w-[5.5rem]" />
            <Skeleton className="hidden h-4 w-10 sm:block" />
            <Skeleton className="hidden h-4 w-24 sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
