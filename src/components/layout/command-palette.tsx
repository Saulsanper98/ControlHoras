"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ClipboardList, Search } from "lucide-react";
import { employeeNav, jefaNav } from "@/lib/nav";
import type { AppRole } from "@/lib/roles";
import { Modal } from "@/components/ui/modal";
import { InlineEmpty } from "@/components/ui/inline-empty";
import { cn } from "@/lib/utils";

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
  const [activeIndex, setActiveIndex] = useState(0);
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
        id: "calendario",
        label: "Calendario de vacaciones",
        href: "/jefa/vacaciones/calendario",
        icon: CalendarDays,
        keywords: "calendario vacaciones",
      });
    } else {
      base.push({
        id: "my-control",
        label: "Mi control horario de este mes",
        href: "/control-horario",
        icon: ClipboardList,
      });
    }
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

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

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

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) go(item.href);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hit-area inline-flex items-center justify-center rounded-lg text-brand-navy transition hover:bg-brand-navy/10 md:hidden"
        aria-label={`Buscar páginas (${shortcutLabel})`}
      >
        <Search className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden min-h-11 min-w-[200px] items-center gap-2 rounded-xl border border-brand-navy/10 bg-brand-navy/[0.05] px-3.5 text-sm text-slate-600 transition hover:bg-brand-navy/[0.08] md:flex"
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
          onKeyDown={onInputKeyDown}
          placeholder="Escribe para buscar páginas…"
          className="field-control mb-3 w-full px-3 py-2 text-sm"
          aria-activedescendant={
            filtered[activeIndex] ? `cmd-${filtered[activeIndex].id}` : undefined
          }
          role="combobox"
          aria-expanded={true}
          aria-controls="command-palette-list"
          aria-autocomplete="list"
        />
        <ul id="command-palette-list" role="listbox" className="max-h-64 overflow-y-auto px-0.5">
          {filtered.map((item, index) => {
            const Icon = item.icon;
            const active = index === activeIndex;
            return (
              <li key={item.id} role="option" aria-selected={active} id={`cmd-${item.id}`}>
                <button
                  type="button"
                  onClick={() => go(item.href)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-brand-navy transition",
                    active ? "bg-brand-navy/8" : "hover:bg-brand-navy/6"
                  )}
                >
                  <Icon className="h-4 w-4 text-brand-blue" />
                  {item.label}
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li>
              <InlineEmpty>Sin resultados</InlineEmpty>
            </li>
          )}
        </ul>
      </Modal>
    </>
  );
}
