import Link from "next/link";
import { redirect } from "next/navigation";
import { Umbrella, CalendarDays, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ListSurface } from "@/components/ui/list-surface";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { Stagger } from "@/components/ui/stagger";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionEyebrow } from "@/components/ui/section-title";
import { PendingVacationRequests } from "@/components/jefa/pending-vacation-requests";
import { requireManagerSession } from "@/lib/auth-helpers";
import { toDateKey } from "@/lib/format-date";

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
    ...new Set([currentYear, currentYear - 1, ...balanceYears.map((b) => b.year)]),
  ].sort((a, b) => b - a);

  const balanceByUser = new Map(balances.map((b) => [b.userId, b]));
  const hoursByUser = new Map(adjustmentSums.map((a) => [a.userId, Number(a._sum.hours ?? 0)]));

  const pendingByUser = new Map<string, number>();
  for (const r of pendingRequests) {
    if (r.year !== year) continue;
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
    const remaining = balance
      ? Number(balance.totalDays) - Number(balance.usedDays) - pending
      : null;
    const hours = hoursByUser.get(e.id) ?? 0;
    return (
      <Link
        href={`/jefa/vacaciones/${e.id}?year=${year}`}
        className="flex items-center justify-between gap-3 py-3 transition hover:bg-brand-navy/[0.035]"
      >
        <div className="flex items-center gap-3">
          <Umbrella className="h-4 w-4 text-brand-blue" />
          <div>
            <p className="font-medium text-brand-navy">{e.name}</p>
            {pending > 0 && (
              <p className="text-xs text-amber-700">{pending} días en trámite</p>
            )}
          </div>
        </div>
        <div className="flex gap-6 text-right text-sm">
          <div>
            <p className="text-xs text-slate-500">Disponibles</p>
            <p className="font-medium tabular-nums text-brand-navy">
              {remaining !== null ? `${remaining} días` : "Sin datos"}
            </p>
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
          <div className="flex flex-wrap items-end gap-3">
            <form method="get" className="flex items-end gap-2">
              <div className="w-28">
                <label htmlFor="jefa-vac-year" className="mb-1 block text-xs font-medium text-slate-500">
                  Año
                </label>
                <Select id="jefa-vac-year" name="year" defaultValue={String(year)}>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </div>
              <button type="submit" className="btn-primary">
                Ver
              </button>
            </form>
            <Link href="/jefa/vacaciones/calendario" className="btn-secondary">
              <CalendarDays className="h-4 w-4" />
              Calendario del equipo
            </Link>
          </div>
        </PageHeader>
      </Stagger>

      <PendingVacationRequests
        requests={pendingRequests.map((r) => ({
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
