import { TableSurface } from "@/components/ui/list-surface";
import { dateKeyToUtcNoon, formatWeekdayShort } from "@/lib/format-date";
import { holidaysInMonth } from "@/lib/holidays";
import { daysInMonth, sumDayHours } from "@/lib/timesheet-calc";

type GridEntry = {
  day: number;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number;
  normalHours: number;
  overtimeHours: number;
  nightHours: number;
  notes: string | null;
};

export function TimeSheetGrid({
  month,
  year,
  entries,
  showAllDays = false,
}: {
  month: number;
  year: number;
  entries: GridEntry[];
  /** Si true, muestra todos los días del mes (incluidos vacíos). */
  showAllDays?: boolean;
}) {
  const entryByDay = new Map(entries.map((e) => [e.day, e]));
  const monthHolidays = holidaysInMonth(month, year);
  const totalDays = daysInMonth(month, year);
  const displayEntries = showAllDays
    ? Array.from({ length: totalDays }, (_, i) => {
        const day = i + 1;
        return (
          entryByDay.get(day) ?? {
            day,
            checkIn: null,
            checkOut: null,
            totalHours: 0,
            normalHours: 0,
            overtimeHours: 0,
            nightHours: 0,
            notes: null,
          }
        );
      })
    : entries.filter((e) => e.checkIn || e.checkOut || e.notes);

  const totals = sumDayHours(
    entries.map((e) => ({
      totalHours: e.totalHours,
      normalHours: e.normalHours,
      overtimeHours: e.overtimeHours,
      nightHours: e.nightHours,
    }))
  );

  return (
    <TableSurface scroll={false}>
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-brand-navy/10 text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="px-0 py-2 sm:px-3">Día</th>
            <th className="px-3 py-2">Entrada</th>
            <th className="px-3 py-2">Salida</th>
            <th className="px-3 py-2">Total</th>
            <th className="px-3 py-2">Normales</th>
            <th className="px-3 py-2">Extra</th>
            <th className="px-3 py-2">Nocturnas</th>
            <th className="px-3 py-2">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {displayEntries.map((entry) => {
              const weekday = formatWeekdayShort(year, month, entry.day);
              const dayKey = `${year}-${String(month).padStart(2, "0")}-${String(entry.day).padStart(2, "0")}`;
              const isWeekend = [0, 6].includes(dateKeyToUtcNoon(dayKey).getUTCDay());
              const holidayName = monthHolidays.get(entry.day);
              return (
                <tr
                  key={entry.day}
                  className={`border-b border-brand-navy/5 last:border-0 ${
                    holidayName ? "row-holiday" : isWeekend ? "row-weekend" : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-0 py-1.5 text-slate-600 sm:px-3">
                    {entry.day} <span className="text-xs text-slate-500">{weekday}</span>
                    {holidayName && (
                      <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                        {holidayName}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5 text-slate-600">{entry.checkIn || "—"}</td>
                  <td className="px-3 py-1.5 text-slate-600">{entry.checkOut || "—"}</td>
                  <td className="px-3 py-1.5 text-slate-600">{entry.totalHours.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-slate-600">{entry.normalHours.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-slate-600">{entry.overtimeHours.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-slate-600">{entry.nightHours.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-slate-600">{entry.notes || ""}</td>
                </tr>
              );
            })}
          {displayEntries.length === 0 && (
            <tr>
              <td colSpan={8} className="px-3 py-4 text-center text-slate-500">
                Sin registros diarios (puede que se haya adjuntado un archivo).
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-brand-navy/10 font-semibold text-brand-navy">
            <td className="px-0 py-2 sm:px-3" colSpan={3}>
              Totales
            </td>
            <td className="px-3 py-2">{totals.totalHours.toFixed(2)}</td>
            <td className="px-3 py-2">{totals.normalHours.toFixed(2)}</td>
            <td className="px-3 py-2">{totals.overtimeHours.toFixed(2)}</td>
            <td className="px-3 py-2">{totals.nightHours.toFixed(2)}</td>
            <td className="px-3 py-2"></td>
          </tr>
        </tfoot>
      </table>
    </TableSurface>
  );
}
