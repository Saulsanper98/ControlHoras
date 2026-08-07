import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SectionBlock } from "@/components/ui/list-surface";
import { PageHeader } from "@/components/ui/page-header";
import { BackLink } from "@/components/ui/back-link";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollShadow } from "@/components/ui/scroll-shadow";
import { Select } from "@/components/ui/select";
import { YearSwitcher } from "@/components/ui/year-switcher";
import { requireManagerSession } from "@/lib/auth-helpers";
import { MONTH_NAMES_ES } from "@/lib/format-date";
import { daysInMonth } from "@/lib/timesheet-calc";
import { LEAVE_TYPE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

export default async function VacationCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; department?: string; tipos?: string }>;
}) {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const params = await searchParams;
  const now = new Date();
  const month = Number(params.month) || now.getMonth() + 1;
  const year = Number(params.year) || now.getFullYear();
  const departmentId = params.department || undefined;
  const showAllTypes = params.tipos === "todos";

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const days = daysInMonth(month, year);
  const firstDow = (monthStart.getDay() + 6) % 7;
  const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const [departments, approved] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.vacationRequest.findMany({
      where: {
        status: "APROBADA",
        ...(showAllTypes ? {} : { leaveType: "VACACIONES" }),
        startDate: { lte: monthEnd },
        endDate: { gte: monthStart },
        ...(departmentId ? { user: { departmentId } } : {}),
      },
      include: { user: { include: { department: true } } },
      orderBy: { startDate: "asc" },
    }),
  ]);

  type DayPerson = { name: string; dept: string; leaveType: string };
  const peopleByDay = new Map<number, DayPerson[]>();
  for (const r of approved) {
    const from = r.startDate < monthStart ? 1 : r.startDate.getDate();
    const to = r.endDate > monthEnd ? days : r.endDate.getDate();
    for (let d = from; d <= to; d++) {
      const list = peopleByDay.get(d) ?? [];
      list.push({
        name: r.user.name.split(" ")[0] ?? r.user.name,
        dept: r.user.department?.name ?? "—",
        leaveType: r.leaveType,
      });
      peopleByDay.set(d, list);
    }
  }

  const prev = month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
  const next = month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };
  const yearOptions = [year - 1, year, year + 1];

  function calendarHref(opts: {
    month?: number;
    year?: number;
    department?: string;
    tipos?: string;
  }) {
    const m = opts.month ?? month;
    const y = opts.year ?? year;
    const qs = new URLSearchParams();
    qs.set("month", String(m));
    qs.set("year", String(y));
    const dept = opts.department !== undefined ? opts.department : departmentId;
    if (dept) qs.set("department", dept);
    const tipos = opts.tipos !== undefined ? opts.tipos : showAllTypes ? "todos" : undefined;
    if (tipos) qs.set("tipos", tipos);
    return `/jefa/vacaciones/calendario?${qs.toString()}`;
  }

  function chipClass(leaveType: string) {
    if (leaveType === "ASUNTOS_PROPIOS") {
      return "bg-brand-navy/10 text-brand-navy";
    }
    if (leaveType === "MEDIO_DIA") {
      return "bg-sky-500/15 text-sky-900";
    }
    return "bg-amber-500/15 text-amber-900";
  }

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/jefa/vacaciones">Volver a vacaciones</BackLink>
        <PageHeader
          title="Calendario de vacaciones"
          description="Cobertura del equipo por día del mes."
        >
          <YearSwitcher
            year={year}
            options={yearOptions.map((y) => ({
              year: y,
              href: calendarHref({ year: y, month: 1 }),
            }))}
          />
        </PageHeader>
      </div>

      <SectionBlock className="flex flex-wrap items-center justify-between gap-3">
        <Link href={calendarHref({ month: prev.month, year: prev.year })} className="btn-ghost">
          ← {MONTH_NAMES_ES[prev.month - 1]}
        </Link>
        <span className="font-display text-lg font-semibold capitalize text-brand-navy">
          {MONTH_NAMES_ES[month - 1]} de {year}
        </span>
        <Link href={calendarHref({ month: next.month, year: next.year })} className="btn-ghost">
          {MONTH_NAMES_ES[next.month - 1]} →
        </Link>
      </SectionBlock>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Seleccionar mes">
        {MONTH_NAMES_ES.map((name, i) => {
          const m = i + 1;
          const active = m === month;
          return (
            <Link
              key={name}
              href={calendarHref({ month: m })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition",
                active
                  ? "bg-brand-blue text-white"
                  : "text-slate-600 hover:bg-brand-navy/8 hover:text-brand-navy"
              )}
            >
              {name.slice(0, 3)}
            </Link>
          );
        })}
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="year" value={year} />
        {showAllTypes && <input type="hidden" name="tipos" value="todos" />}
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
        <Link
          href={calendarHref({ tipos: showAllTypes ? "" : "todos" })}
          className={cn(
            "rounded-lg px-2.5 py-1 font-medium transition",
            showAllTypes
              ? "bg-brand-blue text-white"
              : "bg-brand-navy/8 text-brand-navy hover:bg-brand-navy/12"
          )}
        >
          {showAllTypes ? "Solo vacaciones" : "Incluir todos los tipos"}
        </Link>
        <span className="inline-flex items-center gap-1.5">
          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-medium text-amber-900">
            {LEAVE_TYPE_LABEL.VACACIONES}
          </span>
          {showAllTypes && (
            <>
              <span className="rounded-md bg-brand-navy/10 px-2 py-0.5 font-medium text-brand-navy">
                {LEAVE_TYPE_LABEL.ASUNTOS_PROPIOS}
              </span>
              <span className="rounded-md bg-sky-500/15 px-2 py-0.5 font-medium text-sky-900">
                {LEAVE_TYPE_LABEL.MEDIO_DIA}
              </span>
            </>
          )}
        </span>
      </div>
      <p className="text-xs text-slate-500">
        {showAllTypes
          ? "Mostrando todas las ausencias aprobadas (vacaciones, asuntos propios y medio día)."
          : `Este calendario muestra solo ausencias de tipo «${LEAVE_TYPE_LABEL.VACACIONES}» aprobadas.`}
      </p>

      {approved.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={`Sin ausencias en ${MONTH_NAMES_ES[month - 1]}`}
          description={
            showAllTypes
              ? "No hay ausencias aprobadas en este mes para el filtro actual."
              : "No hay vacaciones aprobadas en este mes. Prueba a incluir todos los tipos."
          }
        />
      ) : (
        <ScrollShadow>
          <div className="min-w-[36rem] border-y border-brand-navy/10 py-3">
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
                const isToday =
                  isCurrentMonth && `${year}-${month}-${day}` === todayKey;
                return (
                  <div
                    key={day}
                    className={cn(
                      "min-h-20 border-t p-1.5 text-left",
                      weekend
                        ? "border-brand-navy/8 bg-brand-navy/[0.04]"
                        : "border-brand-navy/10",
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
                        <span className="ml-1 text-[9px] font-medium uppercase tracking-wide">
                          hoy
                        </span>
                      )}
                    </p>
                    <div className="mt-1 space-y-0.5">
                      {people.slice(0, 3).map((p, idx) => (
                        <p
                          key={`${day}-${p.name}-${idx}`}
                          className={cn(
                            "truncate rounded-md px-1 text-[10px] font-medium",
                            chipClass(p.leaveType)
                          )}
                          title={`${p.name} · ${p.dept} · ${LEAVE_TYPE_LABEL[p.leaveType] ?? p.leaveType}`}
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
        </ScrollShadow>
      )}
    </div>
  );
}
