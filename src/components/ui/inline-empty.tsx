import { cn } from "@/lib/utils";

/** Empty compacto para paneles, popovers y celdas. */
export function InlineEmpty({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("py-4 text-center text-sm text-slate-500", className)}>{children}</p>
  );
}
