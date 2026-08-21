"use client";

import { useMemo } from "react";
import { calculateDayHours } from "@/lib/timesheet-calc";
import { formatWeekdayShort } from "@/lib/format-date";
import { FieldSelect } from "@/components/ui/field-select";
import { InlineEmpty } from "@/components/ui/inline-empty";
import { TimeField } from "@/components/ui/time-field";

type Entry = { day: number; checkIn: string; checkOut: string; notes: string };
type ShiftKey = "" | "LIBRE" | "M" | "T" | "N";

const shiftOptions = [
  { value: "LIBRE", label: "Libre" },
  { value: "M", label: "Mañana" },
  { value: "T", label: "Tarde" },
  { value: "N", label: "Noche" },
];

function isHiddenFreeDay(entry: Entry, editable: boolean) {
  return !editable && !entry.checkIn && !entry.checkOut && !entry.notes;
}

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
  const visibleEntries = useMemo(
    () => entries.filter((entry) => !isHiddenFreeDay(entry, editable)),
    [entries, editable]
  );

  const hiddenFreeDays = !editable ? entries.length - visibleEntries.length : 0;
  const containerClass = editable ? "md:hidden pb-[4.5rem]" : "md:hidden";

  if (entries.length === 0) {
    return (
      <div className={containerClass}>
        <InlineEmpty>No hay días que coincidan con el filtro.</InlineEmpty>
      </div>
    );
  }

  if (visibleEntries.length === 0 && hiddenFreeDays > 0) {
    return (
      <div className={containerClass}>
        <InlineEmpty>
          {hiddenFreeDays === 1
            ? "Se oculta 1 día libre"
            : `Se ocultan ${hiddenFreeDays} días libres`}
        </InlineEmpty>
      </div>
    );
  }

  return (
    <div className={`divide-y divide-[color:var(--surface-divider)] ${containerClass}`}>
      {visibleEntries.map((entry) => {
        const hours = calculateDayHours(entry.checkIn, entry.checkOut);
        const weekday = formatWeekdayShort(year, month, entry.day);
        const isWeekend = [0, 6].includes(new Date(year, month - 1, entry.day).getDay());
        const holidayName = monthHolidays.get(entry.day);
        const shiftKey = shiftKeyForEntry(entry);
        const rowOptions =
          shiftKey === "" ? [{ value: "", label: "Personalizado" }, ...shiftOptions] : shiftOptions;
        const isToday = todayDay === entry.day;

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
              className="mb-2 [&_button]:min-h-11"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor={`mobile-in-${entry.day}`}
                  className="mb-0.5 block text-[11px] font-medium text-slate-500"
                >
                  Entrada
                </label>
                <TimeField
                  id={`mobile-in-${entry.day}`}
                  aria-label={`Entrada día ${entry.day}`}
                  disabled={!editable}
                  value={entry.checkIn}
                  onChange={(v) => onUpdate(entry.day, { checkIn: v })}
                  variant="plain"
                />
              </div>
              <div>
                <label
                  htmlFor={`mobile-out-${entry.day}`}
                  className="mb-0.5 block text-[11px] font-medium text-slate-500"
                >
                  Salida
                </label>
                <TimeField
                  id={`mobile-out-${entry.day}`}
                  aria-label={`Salida día ${entry.day}`}
                  disabled={!editable}
                  value={entry.checkOut}
                  onChange={(v) => onUpdate(entry.day, { checkOut: v })}
                  variant="plain"
                />
              </div>
            </div>
            <label className="mt-2 block">
              <span className="sr-only">Observaciones día {entry.day}</span>
              <input
                type="text"
                disabled={!editable}
                value={entry.notes}
                onChange={(e) => onUpdate(entry.day, { notes: e.target.value })}
                placeholder="Observaciones"
                aria-label={`Observaciones día ${entry.day}`}
                className="field-control-plain w-full px-2 py-1.5 text-sm text-brand-navy placeholder:text-slate-400 disabled:opacity-60"
              />
            </label>
            <p className="mt-2 text-xs tabular-nums text-slate-500">
              Total: {hours.totalHours.toFixed(2)} h
              {(hours.overtimeHours > 0 || hours.nightHours > 0) && (
                <span className="text-slate-400">
                  {" "}
                  · Extra {hours.overtimeHours.toFixed(1)} · Noct. {hours.nightHours.toFixed(1)}
                </span>
              )}
            </p>
          </div>
        );
      })}
      {hiddenFreeDays > 0 && (
        <p className="px-4 py-3 text-center text-xs text-slate-500">
          {hiddenFreeDays === 1
            ? "Se oculta 1 día libre"
            : `Se ocultan ${hiddenFreeDays} días libres`}
        </p>
      )}
    </div>
  );
}
