import { redirect } from "next/navigation";
import { Umbrella, Clock, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { Stagger } from "@/components/ui/stagger";
import { VacationRequestsPanel } from "@/components/vacaciones/vacation-requests-panel";
import { VacationProgressBar, VacationTimeline } from "@/components/vacaciones/vacation-progress";
import { requireEmployeeSession } from "@/lib/auth-helpers";

export default async function VacacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await requireEmployeeSession();
  if (!session) redirect("/");

  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = Number(params.year) || currentYear;

  const deptId = session.user.departmentId;

  const [balance, adjustments, availableYears, vacationRequests, pendingDaysAgg, teamApproved] =
    await Promise.all([
      prisma.vacationBalance.findUnique({
        where: { userId_year: { userId: session.user.id, year } },
      }),
      prisma.hourAdjustment.findMany({
        where: { userId: session.user.id },
        include: { createdBy: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vacationBalance.findMany({
        where: { userId: session.user.id },
        select: { year: true },
        orderBy: { year: "desc" },
      }),
      prisma.vacationRequest.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vacationRequest.aggregate({
        where: { userId: session.user.id, year, status: "PENDIENTE" },
        _sum: { days: true },
      }),
      deptId
        ? prisma.vacationRequest.findMany({
            where: {
              status: "APROBADA",
              year,
              user: { departmentId: deptId, id: { not: session.user.id } },
              startDate: { lte: new Date(year, 11, 31) },
              endDate: { gte: new Date(year, 0, 1) },
            },
            include: { user: { select: { name: true } } },
            orderBy: { startDate: "asc" },
            take: 8,
          })
        : Promise.resolve([]),
    ]);

  const years = [
    ...new Set([currentYear, ...availableYears.map((b) => b.year)]),
  ].sort((a, b) => b - a);

  const totalDays = balance ? Number(balance.totalDays) : 0;
  const usedDays = balance ? Number(balance.usedDays) : 0;
  const pendingDays = Number(pendingDaysAgg._sum.days ?? 0);
  const remaining = balance ? totalDays - usedDays - pendingDays : null;
  const totalHours = adjustments.reduce((sum, a) => sum + Number(a.hours), 0);

  return (
    <div className="space-y-6">
      <Stagger>
        <PageHeader
          title="Vacaciones y horas"
          description="Consulta tu saldo, solicita vacaciones y revisa tu bolsa de horas."
        >
          <form method="get" className="flex items-end gap-2">
            <div className="w-28">
              <label htmlFor="vac-year" className="mb-1 block text-xs font-medium text-slate-500">
                Año
              </label>
              <Select id="vac-year" name="year" defaultValue={String(year)}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
            <button
              type="submit"
              className="btn-press rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark"
            >
              Ver
            </button>
          </form>
        </PageHeader>
      </Stagger>

      <Stagger delay={80}>
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-1 divide-y divide-brand-navy/8 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="flex items-center gap-4 px-5 py-5">
              <div className="rounded-xl bg-brand-blue/10 p-3 text-brand-blue">
                <Umbrella className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-500">Vacaciones restantes</p>
                <p className="font-display text-2xl font-semibold tabular-nums text-brand-navy">
                  {remaining !== null ? `${remaining} días` : "Sin datos"}
                </p>
                {totalDays > 0 && (
                  <div className="mt-3">
                    <VacationProgressBar total={totalDays} used={usedDays} pending={pendingDays} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 px-5 py-5">
              <div className="rounded-xl bg-brand-blue/10 p-3 text-brand-blue">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Bolsa de horas</p>
                <p className="font-display text-2xl font-semibold tabular-nums text-brand-navy">
                  {totalHours.toFixed(1)} h
                </p>
                <p className="text-xs text-slate-500">Ajustes acumulados</p>
              </div>
            </div>
          </div>

          <div className="border-t border-brand-navy/10 px-5 py-4">
            <VacationTimeline
              year={year}
              requests={vacationRequests.map((r) => ({
                startDate: r.startDate.toISOString(),
                endDate: r.endDate.toISOString(),
                status: r.status,
                days: Number(r.days),
              }))}
            />
          </div>

          {balance?.notes && (
            <div className="border-t border-brand-navy/10 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Notas de la responsable
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-brand-navy">{balance.notes}</p>
            </div>
          )}

          <div className="border-t border-brand-navy/10 px-5 py-5">
            <VacationRequestsPanel
              year={year}
              requests={vacationRequests.map((r) => ({
                id: r.id,
                startDate: r.startDate.toISOString(),
                endDate: r.endDate.toISOString(),
                days: Number(r.days),
                status: r.status,
                employeeNotes: r.employeeNotes,
                rejectionReason: r.rejectionReason,
                createdAt: r.createdAt.toISOString(),
              }))}
            />
          </div>

          {teamApproved.length > 0 && (
            <div className="border-t border-brand-navy/10 px-5 py-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-navy">
                <Users className="h-4 w-4 text-brand-blue" />
                Vacaciones del equipo (aprobadas)
              </h2>
              <ul className="divide-y divide-brand-navy/8">
                {teamApproved.map((r) => (
                  <li key={r.id} className="flex justify-between gap-2 py-2 text-sm first:pt-0">
                    <span className="font-medium text-brand-navy">{r.user.name}</span>
                    <span className="text-slate-500 tabular-nums">
                      {r.startDate.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} –{" "}
                      {r.endDate.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-brand-navy/10 px-5 py-5">
            <h2 className="text-sm font-semibold text-brand-navy">Historial de ajustes de horas</h2>
            {adjustments.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">Sin ajustes registrados.</p>
            ) : (
              <ul className="mt-3 divide-y divide-brand-navy/8">
                {adjustments.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <span
                        className={`font-semibold tabular-nums ${
                          Number(a.hours) >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {Number(a.hours) >= 0 ? "+" : ""}
                        {Number(a.hours).toFixed(1)} h
                      </span>
                      <span className="ml-2 text-sm text-slate-600">{a.reason}</span>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">
                      {a.createdAt.toLocaleDateString("es-ES")} · {a.createdBy.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </Stagger>
    </div>
  );
}
