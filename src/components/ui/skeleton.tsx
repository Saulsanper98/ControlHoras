import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-brand-navy/8",
        className
      )}
      aria-hidden="true"
    />
  );
}
