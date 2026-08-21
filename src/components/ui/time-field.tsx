"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const PRESETS = ["06:00", "14:00", "22:00", "00:00"];
const POPOVER_WIDTH = 256;

function normalizeTime(raw: string) {
  const value = raw.trim();
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function TimeField({
  value,
  onChange,
  disabled,
  className,
  id,
  variant = "default",
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  variant?: "default" | "plain";
  "aria-label"?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [manualValue, setManualValue] = useState(value);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setManualValue(value);
  }, [value]);

  function positionPanel() {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const estimatedHeight = 180;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < estimatedHeight && rect.top > spaceBelow;
    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, window.innerWidth - POPOVER_WIDTH - 8)
    );
    setPanelStyle({
      position: "fixed",
      left,
      width: POPOVER_WIDTH,
      top: openUp ? undefined : rect.bottom + 8,
      bottom: openUp ? window.innerHeight - rect.top + 8 : undefined,
      zIndex: 300,
    });
  }

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
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        inputRef.current?.focus();
      }
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

  function applyManual() {
    const normalized = normalizeTime(manualValue);
    if (!normalized) {
      showToast("Hora no válida. Usa el formato HH:MM.", "error");
      return;
    }
    onChange(normalized);
    setOpen(false);
    inputRef.current?.focus();
  }

  const panel =
    open &&
    !disabled &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={panelRef}
        data-portal-menu
        role="dialog"
        aria-label="Selector de hora"
        style={panelStyle}
        className="surface-menu rounded-lg p-2 animate-fade-slide-up"
      >
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Hora manual
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              applyManual();
            }}
            placeholder="HH:MM"
            inputMode="numeric"
            className="field-control h-8 flex-1 px-2 text-sm tabular-nums text-brand-navy"
          />
          <button type="button" onClick={applyManual} className="btn-sm btn-primary">
            Aplicar
          </button>
        </div>

        <p className="mb-1 mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Horas predeterminadas
        </p>
        <div className="flex gap-1">
          {PRESETS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onChange(t);
                setOpen(false);
                inputRef.current?.focus();
              }}
              className={`min-h-11 rounded-md px-2 py-1 text-xs font-medium tabular-nums transition ${
                value === t
                  ? "bg-brand-blue text-white"
                  : "text-brand-navy hover:bg-brand-navy/8"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>,
      document.body
    );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          disabled={disabled}
          placeholder="HH:MM"
          inputMode="numeric"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
          onFocus={() => !disabled && setOpen(true)}
          onClick={() => !disabled && setOpen(true)}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            if (!value.trim()) {
              if (value !== "") onChange("");
              return;
            }
            const normalized = normalizeTime(value);
            if (normalized) {
              if (normalized !== value) onChange(normalized);
            } else {
              showToast("Hora no válida. Usa el formato HH:MM.", "error");
              onChange("");
            }
          }}
          className={cn(
            "field-time w-full min-h-8 pr-10 pl-2 py-1 text-sm font-medium tabular-nums text-brand-navy disabled:opacity-50",
            variant === "plain" ? "field-control-plain" : "field-control"
          )}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="hit-area absolute right-0.5 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:bg-brand-navy/6 hover:text-brand-blue disabled:opacity-40"
          aria-label="Horas rápidas"
        >
          <Clock className="h-3.5 w-3.5" />
        </button>
      </div>
      {panel}
    </div>
  );
}
