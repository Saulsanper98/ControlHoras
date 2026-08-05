"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { employeeNav, jefaNav, adminNavSections, type NavItem } from "@/lib/nav";
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
          ? "bg-brand-yellow/90 text-brand-navy shadow-[0_1px_0_rgba(255,255,255,0.35)_inset,0_4px_14px_rgba(0,0,0,0.18)] ring-1 ring-brand-yellow/40"
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
  role: "EMPLEADO" | "JEFA" | "ADMIN";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  if (role === "ADMIN") {
    return (
      <nav className="flex flex-1 flex-col gap-4 px-3 py-4">
        {adminNavSections.map((section, idx) => (
          <div key={section.title ?? idx} className="flex flex-col gap-1">
            {section.title && (
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {section.title}
              </p>
            )}
            {section.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>
    );
  }

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
