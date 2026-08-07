"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { LEAVE_TYPE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

export type DayPerson = {
  name: string;
  dept: string;
  leaveType: string;
  chipClassName: string;
};

export function CalendarDayCell({
  day,
  isToday,
  weekend,
  people,
  monthLabel,
}: {
  day: number;
  isToday: boolean;
  weekend: boolean;
  people: DayPerson[];
  monthLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = people.slice(0, 3);
  const overflow = people.length - 3;

  return (
    <>
      <div
        className={cn(
          "min-h-20 border-t p-1.5 text-left",
          weekend ? "border-brand-navy/8 bg-brand-navy/[0.04]" : "border-brand-navy/10",
          isToday && "bg-brand-blue/8 ring-1 ring-inset ring-brand-blue/35"
        )}
      >
        <p
          className={cn(
            "text-xs font-semibold",
            isToday ? "text-brand-blue" : "text-brand-navy"
          )}
        >
          {day}
          {isToday && (
            <span className="ml-1 text-[9px] font-medium uppercase tracking-wide">hoy</span>
          )}
        </p>
        <div className="mt-1 space-y-0.5">
          {visible.map((p, idx) => (
            <p
              key={`${day}-${p.name}-${idx}`}
              className={cn(
                "truncate rounded-lg px-1 text-[10px] font-medium",
                p.chipClassName
              )}
              title={`${p.name} · ${p.dept} · ${LEAVE_TYPE_LABEL[p.leaveType] ?? p.leaveType}`}
            >
              {p.name}
            </p>
          ))}
          {overflow > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-left text-[10px] text-brand-blue underline-offset-2 hover:underline"
            >
              +{overflow} más
            </button>
          )}
        </div>
      </div>

      <Modal
        open={expanded}
        onClose={() => setExpanded(false)}
        title={`${day} de ${monthLabel}`}
      >
        <ul className="space-y-2">
          {people.map((p, idx) => (
            <li
              key={`${day}-all-${p.name}-${idx}`}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-sm font-medium",
                p.chipClassName
              )}
            >
              <span>{p.name}</span>
              <span className="ml-2 text-xs font-normal opacity-80">
                {p.dept} · {LEAVE_TYPE_LABEL[p.leaveType] ?? p.leaveType}
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
