"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <div className={cn("relative", className)}>
      <input
        id={id}
        type="time"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="field-control field-time w-full min-h-8 pr-8 pl-2 py-1 text-sm font-medium text-brand-navy disabled:opacity-50"
      />
      <Clock className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
