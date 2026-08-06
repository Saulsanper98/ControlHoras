import Link from "next/link";
import { cn } from "@/lib/utils";

/** Panel único. Evitar anidar Cards dentro de Cards. */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-[#e8f0f8]/90 p-5 ring-1 ring-brand-navy/10",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
}) {
  const content = (
    <div className="flex items-start justify-between gap-3 py-1">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-brand-navy">{value}</p>
        {hint && <p className="mt-1 text-xs text-brand-navy/45">{hint}</p>}
      </div>
      <Icon className="mt-1 h-5 w-5 shrink-0 text-brand-blue/80" />
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block py-3 transition hover:bg-brand-navy/[0.03] sm:px-4"
      >
        {content}
      </Link>
    );
  }

  return <div className="py-3 sm:px-4">{content}</div>;
}
