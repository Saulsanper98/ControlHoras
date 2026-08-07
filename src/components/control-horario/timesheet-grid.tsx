import { TableSurface } from "@/components/ui/list-surface";
import { formatWeekdayShort } from "@/lib/format-date";
import { sumDayHours } from "@/lib/timesheet-calc";

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
}: {
  month: number;
  year: number;
  entries: GridEntry[];
}) {
  const totals = sumDayHours(
    entries.map((e) => ({
      totalHours: e.totalHours,
      normalHours: e.normalHours,
      overtimeHours: e.overtimeHours,
      nightHours: e.nightHours,
    }))
  );

  return (
    <TableSurface>
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
          {entries
            .filter((e) => e.checkIn || e.checkOut || e.notes)
            .map((entry) => {
              const weekday = formatWeekdayShort(year, month, entry.day);
              return (
                <tr key={entry.day} className="border-b border-brand-navy/5 last:border-0">
                  <td className="whitespace-nowrap px-0 py-1.5 text-slate-600 sm:px-3">
                    {entry.day} <span className="text-xs text-slate-500">{weekday}</span>
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
          {entries.every((e) => !e.checkIn && !e.checkOut && !e.notes) && (
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
