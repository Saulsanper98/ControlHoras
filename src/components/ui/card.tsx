import Link from "next/link";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("glass-panel rounded-2xl p-5", className)}>
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
    <>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-brand-navy">{value}</p>
        {hint && <p className="mt-1 text-xs text-brand-navy/45">{hint}</p>}
      </div>
      <div className="rounded-lg bg-brand-blue/10 p-2.5 text-brand-blue">
        <Icon className="h-5 w-5" />
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block transition hover:scale-[1.01]">
        <Card className="flex items-start justify-between hover:border-brand-blue">{content}</Card>
      </Link>
    );
  }

  return <Card className="flex items-start justify-between">{content}</Card>;
}
