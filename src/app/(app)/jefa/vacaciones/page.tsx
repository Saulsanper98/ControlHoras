import Link from "next/link";
import { redirect } from "next/navigation";
import { Umbrella, CalendarDays, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ListSurface } from "@/components/ui/list-surface";
import { PageHeader } from "@/components/ui/page-header";
import { Stagger } from "@/components/ui/stagger";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionEyebrow } from "@/components/ui/section-title";
import { YearSwitcher } from "@/components/ui/year-switcher";
import { PendingVacationRequests } from "@/components/jefa/pending-vacation-requests";
import { requireManagerSession } from "@/lib/auth-helpers";
import { toDateKey } from "@/lib/format-date";
import { cn } from "@/lib/utils";

export default async function JefaVacacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = Number(params.year) || currentYear;

  const [departments, employees, balances, adjustmentSums, pendingRequests, balanceYears] =
    await Promise.all([
      prisma.department.findMany({ orderBy: { name: "asc" } }),
      prisma.user.findMany({
        where: { role: "EMPLEADO", active: true },
        include: { department: true },
        orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
      }),
      prisma.vacationBalance.findMany({ where: { year } }),
      prisma.hourAdjustment.groupBy({
        by: ["userId"],
        where: { year },
        _sum: { hours: true },
      }),
      prisma.vacationRequest.findMany({
        where: { status: "PENDIENTE" },
        include: { user: { include: { department: true } } },
        orderBy: { createdAt: "asc" },
      }),
      prisma.vacationBalance.findMany({
        select: { year: true },
        distinct: ["year"],
        orderBy: { year: "desc" },
      }),
    ]);

  const years = [
    ...new Set([
      currentYear,
      currentYear - 1,
      ...balanceYears.map((b) => b.year),
      ...pendingRequests.map((r) => r.year),
    ]),
  ].sort((a, b) => b - a);

  const balanceByUser = new Map(balances.map((b) => [b.userId, b]));
  const hoursByUser = new Map(adjustmentSums.map((a) => [a.userId, Number(a._sum.hours ?? 0)]));

  const pendingThisYear = pendingRequests.filter((r) => r.year === year);
  const pendingOtherYears = pendingRequests.filter((r) => r.year !== year);
  const otherYearsCount = new Map<number, number>();
  for (const r of pendingOtherYears) {
    otherYearsCount.set(r.year, (otherYearsCount.get(r.year) ?? 0) + 1);
  }

  const pendingByUser = new Map<string, number>();
  for (const r of pendingThisYear) {
    if (r.leaveType !== "VACACIONES" && r.leaveType !== "MEDIO_DIA") continue;
    pendingByUser.set(r.userId, (pendingByUser.get(r.userId) ?? 0) + Number(r.days));
  }

  type Emp = (typeof employees)[number];
  const byDept = new Map<string, Emp[]>();
  const noDept: Emp[] = [];
  for (const e of employees) {
    if (!e.departmentId) {
      noDept.push(e);
      continue;
    }
    const list = byDept.get(e.departmentId) ?? [];
    list.push(e);
    byDept.set(e.departmentId, list);
  }

  function EmployeeLink({ e }: { e: Emp }) {
    const balance = balanceByUser.get(e.id);
    const pending = pendingByUser.get(e.id) ?? 0;
    const total = balance ? Number(balance.totalDays) : 0;
    const used = balance ? Number(balance.usedDays) : 0;
    const remaining = balance ? total - used - pending : null;
    const hours = hoursByUser.get(e.id) ?? 0;
    const availablePct =
      remaining !== null && total > 0
        ? Math.max(0, Math.min(100, Math.round((remaining / total) * 100)))
        : null;
    return (
      <Link
        href={`/jefa/vacaciones/${e.id}?year=${year}`}
        className="flex items-center justify-between gap-3 py-3 transition hover:bg-brand-navy/[0.035]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Umbrella className="h-4 w-4 shrink-0 text-brand-blue" />
          <div className="min-w-0">
            <p className="font-medium text-brand-navy">{e.name}</p>
            {pending > 0 && (
              <p className="text-xs text-amber-700">{pending} días en trámite</p>
            )}
            {total > 0 && (
              <div className="mt-1.5 w-28 max-w-full">
                <div className="flex h-1 overflow-hidden rounded-full bg-brand-navy/8">
                  <div
                    className="bg-brand-blue"
                    style={{ width: `${Math.min(100, (used / total) * 100)}%` }}
                  />
                  <div
                    className="bg-amber-400"
                    style={{
                      width: `${Math.min(100 - (used / total) * 100, (pending / total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-6 text-right text-sm">
          <div>
            <p className="text-xs text-slate-500">Disponibles</p>
            <p className="font-medium tabular-nums text-brand-navy">
              {remaining !== null ? `${remaining} días` : "Sin datos"}
            </p>
            {availablePct !== null && (
              <p className="text-[10px] tabular-nums text-slate-400">{availablePct}%</p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500">Bolsa</p>
            <p className="font-medium tabular-nums text-brand-navy">{hours.toFixed(1)} h</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-8">
      <Stagger>
        <PageHeader
          title="Vacaciones y horas"
          description={`Gestiona saldos, solicitudes pendientes y bolsa de horas (${year}).`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <YearSwitcher
              year={year}
              options={years.map((y) => ({
                year: y,
                href: y === currentYear ? "/jefa/vacaciones" : `/jefa/vacaciones?year=${y}`,
              }))}
            />
            <Link href="/jefa/vacaciones/calendario" className="btn-secondary">
              <CalendarDays className="h-4 w-4" />
              Calendario del equipo
            </Link>
          </div>
        </PageHeader>
      </Stagger>

      {otherYearsCount.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-500">Pendientes en otras anualidades:</span>
          {[...otherYearsCount.entries()]
            .sort((a, b) => b[0] - a[0])
            .map(([y, count]) => (
              <Link
                key={y}
                href={`/jefa/vacaciones?year=${y}`}
                className={cn(
                  "rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-900 transition hover:bg-amber-500/25"
                )}
              >
                {y}: {count}
              </Link>
            ))}
        </div>
      )}

      <PendingVacationRequests
        requests={pendingThisYear.map((r) => ({
          id: r.id,
          userName: r.user.name,
          departmentName: r.user.department?.name ?? null,
          startDate: toDateKey(r.startDate),
          endDate: toDateKey(r.endDate),
          days: Number(r.days),
          employeeNotes: r.employeeNotes,
          leaveType: r.leaveType,
        }))}
      />

      {departments.map((dept) => {
        const list = byDept.get(dept.id) ?? [];
        if (list.length === 0) return null;
        return (
          <section key={dept.id}>
            <SectionEyebrow>
              {dept.name} ({list.length})
            </SectionEyebrow>
            <ListSurface>
              {list.map((e) => (
                <EmployeeLink key={e.id} e={e} />
              ))}
            </ListSurface>
          </section>
        );
      })}

      {noDept.length > 0 && (
        <section>
          <SectionEyebrow>Sin departamento ({noDept.length})</SectionEyebrow>
          <ListSurface>
            {noDept.map((e) => (
              <EmployeeLink key={e.id} e={e} />
            ))}
          </ListSurface>
        </section>
      )}

      {employees.length === 0 && (
        <EmptyState
          icon={Users}
          title="No hay empleados"
          description="Cuando haya empleados activos, podrás gestionar aquí sus vacaciones y bolsa de horas."
        />
      )}
    </div>
  );
}
