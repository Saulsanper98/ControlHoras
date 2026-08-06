"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS = ["06:00", "14:00", "22:00", "00:00"];

export function TimeField({
  value,
  onChange,
  disabled,
  className,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

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
          id={inputId}
          type="time"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="field-control field-time w-full min-h-8 pr-14 pl-2 py-1 text-sm font-medium tabular-nums text-brand-navy disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-brand-navy/6 hover:text-brand-blue disabled:opacity-40"
          aria-label="Horas rápidas"
        >
          <Clock className="h-3.5 w-3.5" />
        </button>
      </div>
      {open && !disabled && (
        <div className="absolute z-50 mt-1 flex gap-1 rounded-lg border border-brand-navy/12 bg-[#eef4fa] p-1.5 shadow-lg">
          {PRESETS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onChange(t);
                setOpen(false);
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
      )}
    </div>
  );
}
