import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border-y border-[color:var(--surface-divider)] px-6 py-12 text-center",
        className
      )}
    >
      <Icon className="mb-3 h-7 w-7 text-brand-blue/70" aria-hidden="true" />
      <p className="font-display text-lg font-semibold text-brand-navy">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
