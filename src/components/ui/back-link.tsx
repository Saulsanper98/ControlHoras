import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackLink({
  href,
  children = "Volver",
  className,
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "mb-3 inline-flex items-center gap-1 text-sm font-medium text-brand-blue transition hover:text-brand-blue-dark",
        className
      )}
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      {children}
    </Link>
  );
}
