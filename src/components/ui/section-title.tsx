import { cn } from "@/lib/utils";

/** Título de sección unificado en toda la app. */
export function SectionTitle({
  children,
  className,
  as: Tag = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h2" | "h3" | "p";
}) {
  return (
    <Tag className={cn("font-display text-sm font-semibold text-brand-navy", className)}>
      {children}
    </Tag>
  );
}

/** Etiqueta de grupo (departamento, etc.). */
export function SectionEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-caption mb-3 font-semibold uppercase tracking-wide text-brand-navy/55",
        className
      )}
    >
      {children}
    </p>
  );
}
