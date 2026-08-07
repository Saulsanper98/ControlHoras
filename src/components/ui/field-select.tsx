"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  variant = "default",
}: {
  value: string;
  onChange: (value: string) => void;
  options: FieldSelectOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  size?: "sm" | "md";
  variant?: "default" | "plain";
}) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const selected = options.find((o) => o.value === value);
  const selectedIndex = options.findIndex((o) => o.value === value);

  function positionMenu() {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 220 && rect.top > spaceBelow;
    const width = Math.max(rect.width, 140);
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - width - 8
    );
    setMenuStyle({
      position: "fixed",
      left,
      width,
      top: openUp ? undefined : rect.bottom + 4,
      bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
      zIndex: 300,
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    positionMenu();
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((i) => (i < 0 ? 0 : Math.min(i + 1, options.length - 1)));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((i) => (i < 0 ? options.length - 1 : Math.max(i - 1, 0)));
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        if (highlight >= 0 && highlight < options.length) {
          e.preventDefault();
          onChange(options[highlight].value);
          setOpen(false);
        }
      }
    }
    function handleReposition() {
      positionMenu();
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
  }, [open, highlight, options, onChange]);

  useEffect(() => {
    if (!open || highlight < 0 || !menuRef.current) return;
    const el = menuRef.current.querySelector<HTMLElement>(`[data-index="${highlight}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  const menu =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <ul
        ref={menuRef}
        role="listbox"
        aria-labelledby={triggerId}
        style={menuStyle}
        className="surface-menu max-h-56 overflow-auto rounded-xl py-1"
      >
        {options.map((opt, index) => {
          const active = opt.value === value;
          const focused = index === highlight;
          return (
            <li key={opt.value} role="option" aria-selected={active}>
              <button
                type="button"
                data-index={index}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition",
                  active
                    ? "bg-brand-blue/12 font-medium text-brand-blue"
                    : focused
                      ? "bg-brand-navy/8 text-brand-navy"
                      : "text-brand-navy hover:bg-brand-navy/6"
                )}
              >
                <span className="truncate">{opt.label}</span>
                {active && <Check className="h-4 w-4 shrink-0" />}
              </button>
            </li>
          );
        })}
      </ul>,
      document.body
    );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          "flex w-full items-center justify-between gap-2 text-left font-medium text-brand-navy transition",
          "focus:outline-none focus:ring-2 focus:ring-brand-blue/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          variant === "plain"
            ? "field-control-plain"
            : "field-control hover:border-brand-blue/40 focus:border-brand-blue",
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
      {menu}
    </div>
  );
}
