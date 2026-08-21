import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="animate-fade-slide-up space-y-8" aria-busy="true" aria-label="Cargando noticias">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="space-y-0 divide-y divide-[color:var(--surface-divider)] border-y border-[color:var(--surface-divider)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 py-4 sm:flex-row sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-56 max-w-full" />
              <Skeleton className="h-3 w-full max-w-md" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-24 w-full sm:w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}
