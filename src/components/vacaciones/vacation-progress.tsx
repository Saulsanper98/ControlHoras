"use client";

import { cn } from "@/lib/utils";
import { MONTH_SHORT_ES, monthFromDateKey, yearFromDateKey } from "@/lib/format-date";

export function VacationProgressBar({
  total,
  used,
  pending,
  compact,
}: {
  total: number;
  used: number;
  pending: number;
  compact?: boolean;
}) {
  if (total <= 0) return null;
  const usedPct = Math.min(100, (used / total) * 100);
  const pendingPct = Math.min(100 - usedPct, (pending / total) * 100);
  const remaining = Math.max(0, total - used - pending);

  return (
    <div className={cn("space-y-2", compact && "space-y-1")}>
      <div
        className={cn(
          "flex overflow-hidden rounded-full bg-brand-navy/8",
          compact ? "h-1.5" : "h-2.5"
        )}
      >
        <div
          className="bg-brand-blue transition-all duration-500"
          style={{ width: `${usedPct}%` }}
          title={`${used} días usados`}
        />
        <div
          className="bg-amber-400 transition-all duration-500"
          style={{ width: `${pendingPct}%` }}
          title={`${pending} días pendientes`}
        />
      </div>
      {!compact && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-blue" />
            Usados: <strong className="tabular-nums text-brand-navy">{used}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Pendientes: <strong className="tabular-nums text-brand-navy">{pending}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-navy/15" />
            Disponibles: <strong className="tabular-nums text-brand-navy">{remaining}</strong>
          </span>
        </div>
      )}
    </div>
  );
}

export function VacationTimeline({
  requests,
  year,
}: {
  requests: { startDate: string; endDate: string; status: string; days: number }[];
  year: number;
}) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const byMonth = months.map((m) =>
    requests.filter((r) => {
      if (yearFromDateKey(r.startDate) !== year && yearFromDateKey(r.endDate) !== year) {
        return false;
      }
      const startM = monthFromDateKey(r.startDate);
      const endM = monthFromDateKey(r.endDate);
      const startY = yearFromDateKey(r.startDate);
      const endY = yearFromDateKey(r.endDate);
      // Incluye el mes si el tramo lo atraviesa dentro del año.
      if (startY === year && endY === year) {
        return startM <= m && endM >= m;
      }
      if (startY === year) return startM <= m;
      if (endY === year) return endM >= m;
      return false;
    })
  );

  if (requests.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        Línea temporal {year}
      </p>
      <div className="grid grid-cols-12 gap-1">
        {months.map((m, i) => {
          const count = byMonth[i].length;
          const hasApproved = byMonth[i].some((r) => r.status === "APROBADA");
          const hasPending = byMonth[i].some((r) => r.status === "PENDIENTE");
          return (
            <div key={m} className="text-center">
              <div
                className={cn(
                  "mx-auto mb-1 flex h-8 w-full max-w-[2rem] items-center justify-center rounded-md text-[10px] font-semibold tabular-nums transition",
                  hasApproved && "bg-emerald-500/20 text-emerald-800",
                  !hasApproved && hasPending && "bg-amber-500/20 text-amber-800",
                  count === 0 && "bg-brand-navy/5 text-slate-400"
                )}
                title={`${MONTH_SHORT_ES[i]} · ${count} solicitud${count === 1 ? "" : "es"}`}
              >
                {count || "·"}
              </div>
              <span className="text-[10px] font-medium text-slate-500">
                {MONTH_SHORT_ES[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
