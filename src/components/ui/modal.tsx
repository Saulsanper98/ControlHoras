"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function collectFocusable(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
}

/** Incluye campos en portales abiertos (FieldSelect, DateField, TimeField). */
function getFocusable(panel: HTMLElement): HTMLElement[] {
  const result = collectFocusable(panel);
  const seen = new Set(result);

  const portalRoots = document.querySelectorAll<HTMLElement>(
    '[data-portal-menu], [role="listbox"], [role="dialog"]'
  );
  for (const root of portalRoots) {
    if (panel.contains(root)) continue;
    for (const el of collectFocusable(root)) {
      if (!seen.has(el)) {
        seen.add(el);
        result.push(el);
      }
    }
  }

  return result;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  closeLabel = "Cerrar",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  /** aria-label del botón X (p. ej. onboarding: omitir introducción). */
  closeLabel?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = getFocusable(panelRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    const t = window.setTimeout(() => {
      const preferred = panelRef.current?.querySelector<HTMLElement>("[data-autofocus]");
      if (preferred) {
        preferred.focus();
        return;
      }
      const candidates = panelRef.current?.querySelectorAll<HTMLElement>(
        "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1']), button:not([disabled]), a[href]"
      );
      if (!candidates?.length) return;
      // Prefer first field over the close button
      for (const el of candidates) {
        if (el.getAttribute("data-modal-close") != null) continue;
        el.focus();
        return;
      }
      candidates[0]?.focus();
    }, 20);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Cerrar diálogo"
        className="animate-modal-backdrop absolute inset-0 bg-slate-900/35"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "animate-modal-panel relative max-h-[min(90vh,40rem)] w-full max-w-md overflow-y-auto rounded-2xl p-6 ring-1 ring-[color:var(--glass-border)]",
          "bg-[color:var(--surface-panel)] shadow-[var(--shadow-modal)]",
          className
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-lg font-semibold text-brand-navy">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            data-modal-close=""
            aria-label={closeLabel}
            className="hit-area inline-flex items-center justify-center rounded-lg text-slate-400 transition hover:bg-brand-navy/8 hover:text-brand-navy active:scale-[0.98]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
