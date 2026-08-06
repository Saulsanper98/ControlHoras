import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SectionBlock } from "@/components/ui/list-surface";
import { requireManagerSession } from "@/lib/auth-helpers";
import { daysInMonth } from "@/lib/timesheet-calc";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

export default async function VacationCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; department?: string }>;
}) {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const params = await searchParams;
  const now = new Date();
  const month = Number(params.month) || now.getMonth() + 1;
  const year = Number(params.year) || now.getFullYear();
  const departmentId = params.department || undefined;

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const days = daysInMonth(month, year);
  const firstDow = (monthStart.getDay() + 6) % 7;

  const [departments, approved] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.vacationRequest.findMany({
      where: {
        status: "APROBADA",
        leaveType: "VACACIONES",
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
        ...(departmentId ? { user: { departmentId } } : {}),
      },
      include: { user: { include: { department: true } } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const peopleByDay = new Map<number, { name: string; dept: string }[]>();
  for (const r of approved) {
    const from = r.startDate < monthStart ? 1 : r.startDate.getDate();
    const to = r.endDate > monthEnd ? days : r.endDate.getDate();
    for (let d = from; d <= to; d++) {
      const list = peopleByDay.get(d) ?? [];
      list.push({
        name: r.user.name.split(" ")[0] ?? r.user.name,
        dept: r.user.department?.name ?? "—",
      });
      peopleByDay.set(d, list);
    }
  }

  const prev = month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
  const next = month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };
  const queryDept = departmentId ? `&department=${departmentId}` : "";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/jefa/vacaciones"
          className="mb-2 inline-flex items-center gap-1 text-sm text-brand-blue hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a vacaciones
        </Link>
        <h1 className="text-2xl font-semibold text-brand-navy">Calendario de vacaciones</h1>
        <p className="text-brand-navy/55">Cobertura del equipo por día del mes.</p>
      </div>

      <SectionBlock className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/jefa/vacaciones/calendario?month=${prev.month}&year=${prev.year}${queryDept}`}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-brand-navy/5"
        >
          ← {MONTH_NAMES[prev.month - 1]}
        </Link>
        <span className="font-medium text-brand-navy">
          {MONTH_NAMES[month - 1]} de {year}
        </span>
        <Link
          href={`/jefa/vacaciones/calendario?month=${next.month}&year=${next.year}${queryDept}`}
          className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-brand-navy/5"
        >
          {MONTH_NAMES[next.month - 1]} →
        </Link>
      </SectionBlock>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="year" value={year} />
        <select
          name="department"
          defaultValue={departmentId ?? ""}
          className="field-control px-3 py-2 text-sm"
        >
          <option value="">Todos los departamentos</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto border-y border-brand-navy/10 py-3">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-20" />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const people = peopleByDay.get(day) ?? [];
            const weekend = [0, 6].includes(new Date(year, month - 1, day).getDay());
            return (
              <div
                key={day}
                className={`min-h-20 border-t p-1.5 text-left ${
                  weekend ? "border-brand-navy/8 bg-brand-navy/[0.04]" : "border-brand-navy/10"
                }`}
              >
                <p className="text-xs font-semibold text-brand-navy">{day}</p>
                <div className="mt-1 space-y-0.5">
                  {people.slice(0, 3).map((p, idx) => (
                    <p
                      key={`${day}-${p.name}-${idx}`}
                      className="truncate bg-amber-500/15 px-1 text-[10px] font-medium text-amber-900"
                      title={`${p.name} · ${p.dept}`}
                    >
                      {p.name}
                    </p>
                  ))}
                  {people.length > 3 && (
                    <p className="text-[10px] text-slate-500">+{people.length - 3} más</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {approved.length === 0 && (
        <p className="text-sm text-slate-500">No hay vacaciones aprobadas en este mes.</p>
      )}
    </div>
  );
}
