import { cn } from "@/lib/utils";

/** Lista plana unificada: sin cajas apiladas. */
export function ListSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-brand-navy/10 border-y border-brand-navy/10", className)}>
      {children}
    </div>
  );
}

/** Fila interactiva dentro de ListSurface. */
export function ListRow({
  children,
  className,
  interactive = true,
}: {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "py-3",
        interactive && "transition hover:bg-brand-navy/[0.03]",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Bloque de sección (filtros, formularios) sin caja. */
export function SectionBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-y border-brand-navy/10 py-4", className)}>{children}</div>
  );
}

/** Tabla sin Card envolvente. */
export function TableSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto border-y border-brand-navy/10", className)}>
      {children}
    </div>
  );
}
