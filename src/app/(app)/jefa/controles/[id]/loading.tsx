import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="animate-fade-slide-up space-y-6" aria-busy="true" aria-label="Cargando control">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="space-y-0 divide-y divide-[color:var(--surface-divider)] border-y border-[color:var(--surface-divider)]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48 max-w-[70%]" />
            </div>
            <Skeleton className="h-4 w-14 shrink-0" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}
