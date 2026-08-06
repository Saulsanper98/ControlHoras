"use client";

import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export function DateField({
  value,
  onChange,
  disabled,
  className,
  id,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-500">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type="date"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="field-control field-date w-full min-h-10 pr-10 pl-3 py-2 text-sm font-medium text-brand-navy disabled:opacity-50"
        />
        <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}
