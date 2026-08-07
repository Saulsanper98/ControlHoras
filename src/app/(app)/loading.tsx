import { Skeleton } from "@/components/ui/skeleton";

/** Skeleton alineado al layout flat (sin cards). */
export default function Loading() {
  return (
    <div className="animate-fade-slide-up space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 divide-y divide-[color:var(--surface-divider)] border-y border-[color:var(--surface-divider)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="space-y-2 py-5 sm:px-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="space-y-2 py-5 sm:px-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div className="space-y-2 py-5 sm:px-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-24" />
        </div>
      </div>
      <div className="space-y-0 divide-y divide-[color:var(--surface-divider)] border-y border-[color:var(--surface-divider)]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-3.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
