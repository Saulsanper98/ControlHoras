import { cn } from "@/lib/utils";

const VARIANTS = {
  info: "border-[color:var(--surface-divider)] bg-brand-blue/8 text-brand-navy",
  success: "border-emerald-300/50 bg-emerald-500/10 text-emerald-900",
  warning: "border-amber-300/50 bg-amber-500/10 text-amber-900",
  danger: "border-red-300/50 bg-red-500/10 text-red-900",
} as const;

export function Alert({
  variant = "info",
  title,
  children,
  className,
  action,
}: {
  variant?: keyof typeof VARIANTS;
  title?: string;
  children?: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-y px-4 py-3 text-sm",
        VARIANTS[variant],
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && "mt-1")}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
