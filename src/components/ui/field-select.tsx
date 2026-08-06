"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type FieldSelectOption = { value: string; label: string };

export function FieldSelect({
  value,
  onChange,
  options,
  disabled,
  placeholder,
  className,
  id,
  size = "md",
}: {
  value: string;
  onChange: (value: string) => void;
  options: FieldSelectOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  size?: "sm" | "md";
}) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          "field-control flex w-full items-center justify-between gap-2 text-left font-medium text-brand-navy transition",
          "hover:border-brand-blue/40 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" ? "min-h-8 px-2 py-1 text-xs" : "min-h-9 px-3 py-1.5 text-sm"
        )}
      >
        <span className={cn("truncate", !selected && "font-normal text-slate-400")}>
          {selected?.label ?? placeholder ?? "Seleccionar"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby={triggerId}
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-brand-navy/12 bg-[#eef4fa] py-1 shadow-lg ring-1 ring-brand-navy/5"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition",
                    active
                      ? "bg-brand-blue/12 font-medium text-brand-blue"
                      : "text-brand-navy hover:bg-brand-navy/6"
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {active && <Check className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
