import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SectionBlock } from "@/components/ui/list-surface";
import { PageHeader } from "@/components/ui/page-header";
import { BackLink } from "@/components/ui/back-link";
import { Select } from "@/components/ui/select";
import { requireManagerSession } from "@/lib/auth-helpers";
import { daysInMonth } from "@/lib/timesheet-calc";
import { LEAVE_TYPE_LABEL } from "@/lib/labels";

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
  const yearOptions = [year - 1, year, year + 1];

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/jefa/vacaciones">Volver a vacaciones</BackLink>
        <PageHeader
          title="Calendario de vacaciones"
          description="Cobertura del equipo por día del mes."
        />
      </div>

      <SectionBlock className="flex flex-wrap items-center justify-between gap-3">
        <a
          href={`/jefa/vacaciones/calendario?month=${prev.month}&year=${prev.year}${queryDept}`}
          className="btn-ghost"
        >
          ← {MONTH_NAMES[prev.month - 1]}
        </a>
        <span className="font-display text-lg font-semibold text-brand-navy">
          {MONTH_NAMES[month - 1]} de {year}
        </span>
        <a
          href={`/jefa/vacaciones/calendario?month=${next.month}&year=${next.year}${queryDept}`}
          className="btn-ghost"
        >
          {MONTH_NAMES[next.month - 1]} →
        </a>
      </SectionBlock>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="w-36">
          <label htmlFor="cal-month" className="mb-1 block text-xs font-medium text-slate-500">
            Mes
          </label>
          <Select id="cal-month" name="month" defaultValue={month}>
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-28">
          <label htmlFor="cal-year" className="mb-1 block text-xs font-medium text-slate-500">
            Año
          </label>
          <Select id="cal-year" name="year" defaultValue={year}>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-52">
          <label htmlFor="cal-dept" className="mb-1 block text-xs font-medium text-slate-500">
            Departamento
          </label>
          <Select id="cal-dept" name="department" defaultValue={departmentId ?? ""}>
            <option value="">Todos los departamentos</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
        <button type="submit" className="btn-primary">
          Filtrar
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 font-medium text-amber-900">
            {LEAVE_TYPE_LABEL.VACACIONES}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 opacity-50">
          <span className="rounded-md bg-brand-navy/8 px-2 py-0.5 font-medium">
            {LEAVE_TYPE_LABEL.ASUNTOS_PROPIOS}
          </span>
          <span className="rounded-md bg-brand-navy/8 px-2 py-0.5 font-medium">
            {LEAVE_TYPE_LABEL.MEDIO_DIA}
          </span>
          no incluidos
        </span>
      </div>
      <p className="text-xs text-slate-500">
        Este calendario muestra solo ausencias de tipo «{LEAVE_TYPE_LABEL.VACACIONES}» aprobadas.
      </p>

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
                      className="truncate rounded-md bg-amber-500/15 px-1 text-[10px] font-medium text-amber-900"
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
