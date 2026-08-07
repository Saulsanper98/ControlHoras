"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
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

function useIsMac() {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/i.test(navigator.platform) || /Mac/i.test(navigator.userAgent));
  }, []);
  return isMac;
}

export function CommandPalette({ role }: { role: AppRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const isMac = useIsMac();
  const shortcutLabel = isMac ? "⌘K" : "Ctrl+K";

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
    // Evitar duplicar "Panel principal" si ya viene en nav
    const seen = new Set<string>();
    return base.filter((item) => {
      if (seen.has(item.href)) return false;
      seen.add(item.href);
      return true;
    });
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
        aria-label={`Buscar páginas (${shortcutLabel})`}
      >
        <Search className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-10 min-w-[200px] items-center gap-2 rounded-xl border border-brand-navy/10 bg-brand-navy/[0.05] px-3.5 text-sm text-slate-600 transition hover:bg-brand-navy/[0.08] md:flex"
        title={`Buscar (${shortcutLabel})`}
      >
        <Search className="h-4 w-4 text-brand-blue/85" />
        <span className="flex-1 text-left">Buscar…</span>
        <kbd className="rounded-md border border-brand-navy/10 bg-brand-navy/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-500">
          {shortcutLabel}
        </kbd>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Ir a…" className="max-w-xl">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe para buscar páginas…"
          className="field-control mb-3 w-full px-3 py-2 text-sm"
        />
        <ul className="max-h-64 overflow-y-auto px-0.5">
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
