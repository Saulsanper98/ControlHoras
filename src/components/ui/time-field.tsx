"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = ["06:00", "14:00", "22:00", "00:00"];

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
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  variant?: "default" | "plain";
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [manualValue, setManualValue] = useState(value);

  useEffect(() => {
    setManualValue(value);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

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
          onFocus={() => !disabled && setOpen(true)}
          onClick={() => !disabled && setOpen(true)}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            const normalized = normalizeTime(value);
            if (!value) return;
            if (normalized) onChange(normalized);
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
          className="absolute right-0.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-brand-navy/6 hover:text-brand-blue disabled:opacity-40"
          aria-label="Horas rápidas"
        >
          <Clock className="h-3.5 w-3.5" />
        </button>
      </div>
      {open && !disabled && (
        <div className="surface-menu absolute z-50 mt-1 min-w-[16rem] rounded-lg p-2">
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
                const normalized = normalizeTime(manualValue);
                if (!normalized) return;
                onChange(normalized);
                setOpen(false);
              }}
              placeholder="HH:MM"
              inputMode="numeric"
              className="field-control h-8 flex-1 px-2 text-sm tabular-nums text-brand-navy"
            />
            <button
              type="button"
              onClick={() => {
                const normalized = normalizeTime(manualValue);
                if (!normalized) return;
                onChange(normalized);
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="rounded-md bg-brand-blue px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-blue/90"
            >
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
                className={`rounded-md px-2 py-1 text-xs font-medium tabular-nums transition ${
                  value === t
                    ? "bg-brand-blue text-white"
                    : "text-brand-navy hover:bg-brand-navy/8"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
