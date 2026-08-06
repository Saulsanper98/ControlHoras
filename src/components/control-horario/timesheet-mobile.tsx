"use client";

import { calculateDayHours } from "@/lib/timesheet-calc";
import { FieldSelect } from "@/components/ui/field-select";
import { TimeField } from "@/components/ui/time-field";

type Entry = { day: number; checkIn: string; checkOut: string; notes: string };
type ShiftKey = "" | "LIBRE" | "M" | "T" | "N";

const shiftOptions = [
  { value: "LIBRE", label: "Libre" },
  { value: "M", label: "Mañana" },
  { value: "T", label: "Tarde" },
  { value: "N", label: "Noche" },
];

export function TimeSheetMobileDays({
  entries,
  month,
  year,
  editable,
  monthHolidays,
  todayDay,
  onUpdate,
  onApplyShift,
  shiftKeyForEntry,
}: {
  entries: Entry[];
  month: number;
  year: number;
  editable: boolean;
  monthHolidays: Map<number, string>;
  todayDay: number | null;
  onUpdate: (day: number, patch: Partial<Entry>) => void;
  onApplyShift: (day: number, key: ShiftKey) => void;
  shiftKeyForEntry: (entry: Entry) => ShiftKey;
}) {
  return (
    <div className="divide-y divide-brand-navy/8 md:hidden">
      {entries.map((entry) => {
        const hours = calculateDayHours(entry.checkIn, entry.checkOut);
        const weekday = new Date(year, month - 1, entry.day).toLocaleDateString("es-ES", {
          weekday: "short",
        });
        const isWeekend = [0, 6].includes(new Date(year, month - 1, entry.day).getDay());
        const holidayName = monthHolidays.get(entry.day);
        const shiftKey = shiftKeyForEntry(entry);
        const rowOptions =
          shiftKey === "" ? [{ value: "", label: "Personalizado" }, ...shiftOptions] : shiftOptions;
        const isToday = todayDay === entry.day;

        if (!entry.checkIn && !entry.checkOut && !editable) return null;

        return (
          <div
            key={entry.day}
            className={`px-4 py-3 ${
              holidayName ? "row-holiday" : isWeekend ? "row-weekend" : ""
            } ${isToday ? "bg-brand-blue/[0.04]" : ""}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-brand-navy">
                {entry.day} {weekday}
                {isToday && (
                  <span className="ml-2 text-[10px] font-medium uppercase text-brand-blue">Hoy</span>
                )}
              </span>
              {holidayName && (
                <span className="text-[10px] font-medium uppercase text-amber-700">{holidayName}</span>
              )}
            </div>
            <FieldSelect
              disabled={!editable}
              value={shiftKey}
              onChange={(v) => onApplyShift(entry.day, v as ShiftKey)}
              options={rowOptions}
              size="sm"
              variant="plain"
              className="mb-2"
            />
            <div className="grid grid-cols-2 gap-2">
              <TimeField
                disabled={!editable}
                value={entry.checkIn}
                onChange={(v) => onUpdate(entry.day, { checkIn: v })}
                variant="plain"
              />
              <TimeField
                disabled={!editable}
                value={entry.checkOut}
                onChange={(v) => onUpdate(entry.day, { checkOut: v })}
                variant="plain"
              />
            </div>
            <p className="mt-2 text-xs tabular-nums text-slate-500">
              Total: {hours.totalHours.toFixed(2)} h
            </p>
          </div>
        );
      })}
    </div>
  );
}
