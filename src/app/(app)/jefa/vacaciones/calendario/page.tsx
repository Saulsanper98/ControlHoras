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
import { Stagger } from "@/components/ui/stagger";
import { requireManagerSession } from "@/lib/auth-helpers";
import { MONTH_NAMES_ES, dateKeyToUtcNoon, toDateKey } from "@/lib/format-date";
import { daysInMonth } from "@/lib/timesheet-calc";
import { CalendarDayCell } from "@/components/jefa/calendar-day-cell";
import { LEAVE_TYPE_COLOR, LEAVE_TYPE_LABEL } from "@/lib/labels";
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

  const monthStartKey = `${year}-${String(month).padStart(2, "0")}-01`;
  const days = daysInMonth(month, year);
  const monthEndKey = `${year}-${String(month).padStart(2, "0")}-${String(days).padStart(2, "0")}`;
  const monthStart = dateKeyToUtcNoon(monthStartKey);
  const monthEnd = dateKeyToUtcNoon(monthEndKey);
  // Lunes=0 … Domingo=6 (civil, mediodía UTC)
  const firstDow = (dateKeyToUtcNoon(monthStartKey).getUTCDay() + 6) % 7;
  const todayKey = toDateKey(now);

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

  type DayPerson = { name: string; dept: string; leaveType: string; chipClassName: string };

  function chipDisplayName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0] ?? fullName;
    return `${parts[0]} ${parts[1]![0]}.`;
  }

  const peopleByDay = new Map<number, DayPerson[]>();
  for (const r of approved) {
    const startKey = toDateKey(r.startDate);
    const endKey = toDateKey(r.endDate);
    const from = startKey < monthStartKey ? 1 : Number(startKey.slice(8, 10));
    const to = endKey > monthEndKey ? days : Number(endKey.slice(8, 10));
    for (let d = from; d <= to; d++) {
      const list = peopleByDay.get(d) ?? [];
      list.push({
        name: chipDisplayName(r.user.name),
        dept: r.user.department?.name ?? "—",
        leaveType: r.leaveType,
        chipClassName: chipClass(r.leaveType),
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
    return LEAVE_TYPE_COLOR[leaveType] ?? "bg-brand-navy/[0.06] text-slate-600";
  }

  return (
    <div className="space-y-6">
      <Stagger>
        <div>
          <BackLink href={`/jefa/vacaciones?year=${year}`}>Volver a vacaciones</BackLink>
          <PageHeader
            title="Calendario de vacaciones"
            description="Cobertura del equipo por día del mes."
          >
            <YearSwitcher
              year={year}
              options={yearOptions.map((y) => ({
                year: y,
                href: calendarHref({ year: y }),
              }))}
            />
          </PageHeader>
        </div>
      </Stagger>

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
                "inline-flex min-h-11 items-center rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition",
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
        {departmentId && (
          <Link href={calendarHref({ department: "" })} className="btn-ghost">
            Limpiar departamento
          </Link>
        )}
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
          <span
            className={cn(
              "rounded-lg px-2 py-0.5 font-medium",
              LEAVE_TYPE_COLOR.VACACIONES
            )}
          >
            {LEAVE_TYPE_LABEL.VACACIONES}
          </span>
          {showAllTypes && (
            <>
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 font-medium",
                  LEAVE_TYPE_COLOR.ASUNTOS_PROPIOS
                )}
              >
                {LEAVE_TYPE_LABEL.ASUNTOS_PROPIOS}
              </span>
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 font-medium",
                  LEAVE_TYPE_COLOR.MEDIO_DIA
                )}
              >
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
          action={
            departmentId ? (
              <Link href={calendarHref({ department: "" })} className="btn-secondary">
                Quitar filtro de departamento
              </Link>
            ) : !showAllTypes ? (
              <Link href={calendarHref({ tipos: "todos" })} className="btn-secondary">
                Incluir todos los tipos
              </Link>
            ) : undefined
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
                const dayKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const weekend = [0, 6].includes(dateKeyToUtcNoon(dayKey).getUTCDay());
                const isToday = dayKey === todayKey;
                return (
                  <CalendarDayCell
                    key={day}
                    day={day}
                    isToday={isToday}
                    weekend={weekend}
                    people={people}
                    monthLabel={`${MONTH_NAMES_ES[month - 1]} de ${year}`}
                  />
                );
              })}
            </div>
          </div>
        </ScrollShadow>
      )}
    </div>
  );
}
