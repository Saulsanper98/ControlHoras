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
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-brand-yellow text-brand-navy"
          : "text-slate-200 hover:bg-brand-navy-light hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function Sidebar({
  role,
  onNavigate,
}: {
  role: AppRole;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const items = role === "JEFA" ? jefaNav : employeeNav;

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {items.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={isActive(item.href)}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}
