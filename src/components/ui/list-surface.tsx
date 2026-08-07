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
    <div
      className={cn(
        "divide-y divide-[color:var(--surface-divider)] border-y border-[color:var(--surface-divider)]",
        className
      )}
    >
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
        "py-3.5",
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
    <div
      className={cn(
        "border-y border-[color:var(--surface-divider)] py-4",
        className
      )}
    >
      {children}
    </div>
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
    <div
      className={cn(
        "overflow-x-auto border-y border-[color:var(--surface-divider)]",
        className
      )}
    >
      {children}
    </div>
  );
}
