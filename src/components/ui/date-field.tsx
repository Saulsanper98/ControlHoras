"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { holidaysInMonth } from "@/lib/holidays";
import { formatDate } from "@/lib/format-date";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const POPOVER_WIDTH = 280; // 17.5rem

function parseISODate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplay(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return formatDate(value);
}

function startOfCalendarGrid(year: number, month: number): Date {
  const first = new Date(year, month - 1, 1);
  // Monday-first: getDay() Sun=0 → shift so Monday=0
  const dow = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - dow);
  return start;
}

export function DateField({
  value,
  onChange,
  disabled,
  className,
  id,
  label,
  min,
  max,
  rangeStart,
  rangeEnd,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
  min?: string;
  max?: string;
  rangeStart?: string;
  rangeEnd?: string;
}) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  const selected = parseISODate(value);
  const initialView = selected ?? new Date();
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth() + 1);

  function positionPanel() {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const estimatedHeight = 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedHeight && rect.top > spaceBelow;
    const width = POPOVER_WIDTH;
    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, window.innerWidth - width - 8)
    );
    setPanelStyle({
      position: "fixed",
      left,
      width,
      top: openUp ? undefined : rect.bottom + 8,
      bottom: openUp ? window.innerHeight - rect.top + 8 : undefined,
      zIndex: 300,
      maxHeight: openUp
        ? Math.min(estimatedHeight, rect.top - 16)
        : Math.min(estimatedHeight, spaceBelow - 16),
    });
  }

  useEffect(() => {
    if (!open) return;
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth() + 1);
    }
  }, [open, selected]);

  useLayoutEffect(() => {
    if (!open) return;
    positionPanel();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function handleReposition() {
      positionPanel();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open]);

  const holidays = useMemo(
    () => holidaysInMonth(viewMonth, viewYear),
    [viewMonth, viewYear]
  );

  const cells = useMemo(() => {
    const start = startOfCalendarGrid(viewYear, viewMonth);
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [viewYear, viewMonth]);

  const minDate = min ? parseISODate(min) : null;
  const maxDate = max ? parseISODate(max) : null;

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth - 1 + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth() + 1);
  }

  function isDisabled(date: Date): boolean {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }

  const panel =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={panelRef}
        role="dialog"
        aria-label={label ?? "Calendario"}
        style={panelStyle}
        className="surface-menu overflow-auto rounded-xl p-3 animate-fade-slide-up"
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="hit-area inline-flex items-center justify-center rounded-lg text-slate-500 transition hover:bg-brand-navy/8 hover:text-brand-navy"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold capitalize text-brand-navy">
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="hit-area inline-flex items-center justify-center rounded-lg text-slate-500 transition hover:bg-brand-navy/8 hover:text-brand-navy"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-0.5">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((date) => {
            const inMonth = date.getMonth() + 1 === viewMonth;
            const iso = toISODate(date);
            const isSelected = value === iso;
            const isToday = toISODate(new Date()) === iso;
            const inRange =
              rangeStart &&
              rangeEnd &&
              rangeStart <= rangeEnd &&
              iso >= rangeStart &&
              iso <= rangeEnd &&
              iso !== rangeStart &&
              iso !== rangeEnd;
            const isRangeEdge = iso === rangeStart || iso === rangeEnd;
            const dow = date.getDay();
            const isWeekend = dow === 0 || dow === 6;
            const holidayName = inMonth ? holidays.get(date.getDate()) : undefined;
            const disabledDay = isDisabled(date);

            return (
              <button
                key={iso}
                type="button"
                disabled={disabledDay}
                title={holidayName}
                onClick={() => {
                  onChange(iso);
                  setOpen(false);
                }}
                className={cn(
                  "relative flex h-8 items-center justify-center rounded-lg text-sm transition",
                  !inMonth && "text-slate-300",
                  inRange && "bg-brand-blue/15 text-brand-navy",
                  inMonth && !isSelected && !inRange && !holidayName && !isWeekend && "text-brand-navy hover:bg-brand-navy/8",
                  inMonth && isWeekend && !isSelected && !inRange && !holidayName && "text-slate-500 hover:bg-slate-500/10",
                  inMonth && holidayName && !isSelected && !inRange && "font-medium text-amber-800 hover:bg-amber-500/15",
                  isToday && !isSelected && !inRange && "ring-1 ring-brand-blue/40",
                  (isSelected || isRangeEdge) && "bg-brand-blue font-semibold text-white shadow-sm hover:bg-brand-blue",
                  disabledDay && "cursor-not-allowed opacity-30 hover:bg-transparent"
                )}
              >
                {date.getDate()}
                {holidayName && inMonth && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-amber-500" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-brand-navy/8 pt-2 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Festivo
          </span>
          <button
            type="button"
            onClick={() => {
              onChange(toISODate(new Date()));
              setOpen(false);
            }}
            className="font-medium text-brand-blue hover:underline"
          >
            Hoy
          </button>
        </div>
      </div>,
      document.body
    );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {label && (
        <label htmlFor={triggerId} className="mb-1.5 block text-xs font-medium text-slate-500">
          {label}
        </label>
      )}
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "field-control flex w-full min-h-10 items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium transition",
          "hover:border-brand-blue/40 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          value ? "text-brand-navy" : "text-slate-400"
        )}
      >
        <span className="truncate">{value ? formatDisplay(value) : "Seleccionar fecha"}</span>
        <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
      </button>
      {panel}
    </div>
  );
}
