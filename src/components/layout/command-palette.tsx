"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  LayoutDashboard,
  Search,
  Umbrella,
  Users,
} from "lucide-react";
import { employeeNav, jefaNav } from "@/lib/nav";
import type { AppRole } from "@/lib/roles";
import { Modal } from "@/components/ui/modal";

type CommandItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
};

export function CommandPalette({ role }: { role: AppRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const items = useMemo<CommandItem[]>(() => {
    const nav = role === "JEFA" ? jefaNav : employeeNav;
    const base: CommandItem[] = nav.map((n) => ({
      id: n.href,
      label: n.label,
      href: n.href,
      icon: n.icon,
    }));
    if (role === "JEFA") {
      base.push({
        id: "next-controls",
        label: "Controles pendientes de firmar",
        href: "/jefa/controles",
        icon: ClipboardList,
        keywords: "firmar pendiente",
      });
      base.push({
        id: "vac-pending",
        label: "Vacaciones pendientes",
        href: "/jefa/vacaciones",
        icon: Umbrella,
        keywords: "aprobar vacaciones",
      });
      base.push({
        id: "employees",
        label: "Lista de empleados",
        href: "/jefa/empleados",
        icon: Users,
      });
    } else {
      base.push({
        id: "my-control",
        label: "Mi control horario de este mes",
        href: "/control-horario",
        icon: ClipboardList,
      });
    }
    base.unshift({
      id: "home",
      label: "Panel principal",
      href: "/",
      icon: LayoutDashboard,
    });
    return base;
  }, [role]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.href.toLowerCase().includes(q) ||
        i.keywords?.toLowerCase().includes(q)
    );
  }, [items, query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg p-2 text-brand-navy transition hover:bg-brand-navy/10 md:hidden"
        aria-label="Buscar páginas"
      >
        <Search className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-brand-navy/12 bg-white/40 px-3 py-1.5 text-xs text-slate-500 transition hover:bg-white/60 md:flex"
        title="Buscar (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Buscar…</span>
        <kbd className="rounded border border-brand-navy/10 bg-white/50 px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Ir a…">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe para buscar páginas…"
          className="field-control mb-3 w-full px-3 py-2 text-sm"
        />
        <ul className="max-h-64 overflow-y-auto">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => go(item.href)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-brand-navy transition hover:bg-brand-navy/6"
                >
                  <Icon className="h-4 w-4 text-brand-blue" />
                  {item.label}
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-3 py-4 text-center text-sm text-slate-500">Sin resultados</li>
          )}
        </ul>
      </Modal>
    </>
  );
}
