"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { employeeNav, jefaNav, type NavItem } from "@/lib/nav";
import type { AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

function NavLink({
  item,
  active,
  onNavigate,
  badge,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  badge?: number;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      prefetch
      onClick={onNavigate}
      className={cn(
        "relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-brand-yellow text-brand-navy shadow-sm"
          : "text-slate-200 hover:bg-brand-navy-light hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2.25 : 2} />
      <span className="flex-1">{item.label}</span>
      {badge != null && badge > 0 && (
        <span
          className={cn(
            "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold tabular-nums",
            active ? "bg-brand-navy/15 text-brand-navy" : "bg-red-500 text-white"
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({
  role,
  onNavigate,
  pendingSignatures,
  pendingVacations,
}: {
  role: AppRole;
  onNavigate?: () => void;
  pendingSignatures?: number | null;
  pendingVacations?: number;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const items = role === "JEFA" ? jefaNav : employeeNav;

  function badgeFor(href: string): number | undefined {
    if (role !== "JEFA") return undefined;
    if (href === "/jefa/controles") return pendingSignatures ?? undefined;
    if (href === "/jefa/vacaciones") return pendingVacations;
    return undefined;
  }

  return (
    <nav className="flex flex-col gap-1.5 px-2 py-3" aria-label="Navegación principal">
      {items.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={isActive(item.href)}
          onNavigate={onNavigate}
          badge={badgeFor(item.href)}
        />
      ))}
    </nav>
  );
}
