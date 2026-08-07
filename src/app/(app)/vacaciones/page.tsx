import { redirect } from "next/navigation";
import { Umbrella, Clock, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Stagger } from "@/components/ui/stagger";
import { ListSurface } from "@/components/ui/list-surface";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionEyebrow, SectionTitle } from "@/components/ui/section-title";
import { YearSwitcher } from "@/components/ui/year-switcher";
import { VacationRequestsPanel } from "@/components/vacaciones/vacation-requests-panel";
import { VacationProgressBar, VacationTimeline } from "@/components/vacaciones/vacation-progress";
import { requireEmployeeSession } from "@/lib/auth-helpers";
import {
  formatDateShort,
  formatDateTimeShort,
  toDateKey,
  yearFromDateKey,
} from "@/lib/format-date";
import { LEAVE_TYPE_LABEL } from "@/lib/labels";

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

  const [balance, adjustments, availableYears, adjustmentYears, vacationRequests, pendingDaysAgg, teamApproved] =
    await Promise.all([
      prisma.vacationBalance.findUnique({
        where: { userId_year: { userId: session.user.id, year } },
      }),
      prisma.hourAdjustment.findMany({
        where: { userId: session.user.id, year },
        include: { createdBy: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vacationBalance.findMany({
        where: { userId: session.user.id },
        select: { year: true },
        orderBy: { year: "desc" },
      }),
      prisma.hourAdjustment.findMany({
        where: { userId: session.user.id },
        select: { year: true },
        distinct: ["year"],
      }),
      prisma.vacationRequest.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.vacationRequest.aggregate({
        where: {
          userId: session.user.id,
          year,
          status: "PENDIENTE",
          leaveType: { in: ["VACACIONES", "MEDIO_DIA"] },
        },
        _sum: { days: true },
      }),
      deptId
        ? prisma.vacationRequest.findMany({
            where: {
              status: "APROBADA",
              year,
              user: { departmentId: deptId, id: { not: session.user.id } },
              startDate: { lte: new Date(Date.UTC(year, 11, 31)) },
              endDate: { gte: new Date(Date.UTC(year, 0, 1)) },
            },
            include: { user: { select: { name: true } } },
            orderBy: { startDate: "asc" },
            take: 20,
          })
        : Promise.resolve([]),
    ]);

  const years = [
    ...new Set([
      currentYear,
      currentYear - 1,
      ...availableYears.map((b) => b.year),
      ...adjustmentYears.map((a) => a.year),
      ...vacationRequests.flatMap((r) => [
        yearFromDateKey(toDateKey(r.startDate)),
        yearFromDateKey(toDateKey(r.endDate)),
      ]),
    ]),
  ].sort((a, b) => b - a);

  const totalDays = balance ? Number(balance.totalDays) : 0;
  const usedDays = balance ? Number(balance.usedDays) : 0;
  const pendingDays = Number(pendingDaysAgg._sum.days ?? 0);
  const rawRemaining = balance ? totalDays - usedDays - pendingDays : null;
  const remaining = rawRemaining !== null ? Math.max(0, rawRemaining) : null;
  const remainingNegative = rawRemaining !== null && rawRemaining < 0;
  const totalHours = adjustments.reduce((sum, a) => sum + Number(a.hours), 0);

  const timelineRequests = vacationRequests
    .filter(
      (r) =>
        yearFromDateKey(r.startDate) === year || yearFromDateKey(r.endDate) === year
    )
    .map((r) => ({
      startDate: toDateKey(r.startDate),
      endDate: toDateKey(r.endDate),
      status: r.status,
      days: Number(r.days),
    }));

  return (
    <div className="space-y-8">
      <Stagger>
        <PageHeader
          title="Vacaciones y horas"
          description="Consulta tu saldo, solicita ausencias y revisa tu bolsa de horas."
        >
          <YearSwitcher
            year={year}
            options={years.map((y) => ({
              year: y,
              href: y === currentYear ? "/vacaciones" : `/vacaciones?year=${y}`,
            }))}
          />
        </PageHeader>
      </Stagger>

      <div className="grid grid-cols-1 divide-y divide-[color:var(--surface-divider)] border-y border-[color:var(--surface-divider)] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="flex items-center gap-3 py-3.5 sm:pr-5">
          <Umbrella className="h-5 w-5 shrink-0 text-brand-blue" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-500">Vacaciones disponibles</p>
            <p className="font-display text-xl font-semibold tabular-nums text-brand-navy">
              {remaining !== null
                ? `${remaining} días`
                : "Consulta con tu responsable si no ves tu saldo"}
            </p>
            {remainingNegative && (
              <p className="mt-0.5 text-xs text-amber-700">
                El saldo registrado está por debajo de cero; se muestra 0 hasta regularizar.
              </p>
            )}
            {totalDays > 0 && (
              <p className="mt-0.5 text-xs tabular-nums text-slate-500">
                Total {totalDays} · Usados {usedDays}
                {pendingDays > 0 ? ` · En trámite ${pendingDays}` : ""}
              </p>
            )}
            {totalDays > 0 && (
              <div className="mt-2">
                <VacationProgressBar
                  total={totalDays}
                  used={usedDays}
                  pending={pendingDays}
                  compact
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 py-3.5 sm:pl-5">
          <Clock className="h-5 w-5 shrink-0 text-brand-blue" />
          <div>
            <p className="text-sm text-slate-500">Bolsa de horas</p>
            <p className="font-display text-xl font-semibold tabular-nums text-brand-navy">
              {totalHours.toFixed(1)} h
            </p>
            <p className="text-xs text-slate-500">
              {adjustments.length === 0
                ? "Sin ajustes este año"
                : `${adjustments.length} ajuste${adjustments.length === 1 ? "" : "s"} en ${year}`}
            </p>
          </div>
        </div>
      </div>

      {timelineRequests.length > 0 && (
        <section className="border-y border-[color:var(--surface-divider)] py-4">
          <VacationTimeline year={year} requests={timelineRequests} />
        </section>
      )}

      {balance?.notes && (
        <section className="border-y border-[color:var(--surface-divider)] py-4">
          <SectionEyebrow className="mb-1">Notas de la responsable</SectionEyebrow>
          <p className="whitespace-pre-wrap text-sm text-brand-navy">{balance.notes}</p>
        </section>
      )}

      <section>
        <VacationRequestsPanel
          year={year}
          requests={vacationRequests.map((r) => ({
            id: r.id,
            startDate: toDateKey(r.startDate),
            endDate: toDateKey(r.endDate),
            days: Number(r.days),
            status: r.status,
            leaveType: r.leaveType,
            employeeNotes: r.employeeNotes,
            rejectionReason: r.rejectionReason,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
      </section>

      {teamApproved.length > 0 && (
        <section>
          <SectionTitle className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-blue" />
            Vacaciones del equipo (aprobadas)
          </SectionTitle>
          <ListSurface>
            {teamApproved.map((r) => (
              <div key={r.id} className="flex justify-between gap-2 py-3 text-sm">
                <div className="min-w-0">
                  <span className="font-medium text-brand-navy">{r.user.name}</span>
                  {r.leaveType && r.leaveType !== "VACACIONES" && (
                    <span className="ml-2 text-xs text-slate-500">
                      {LEAVE_TYPE_LABEL[r.leaveType] ?? r.leaveType}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-slate-500 tabular-nums">
                  {formatDateShort(r.startDate)} – {formatDateShort(r.endDate)}
                </span>
              </div>
            ))}
          </ListSurface>
        </section>
      )}

      <section>
        <SectionTitle className="mb-3">Historial de ajustes de horas</SectionTitle>
        {adjustments.length === 0 ? (
          <EmptyState
            icon={Clock}
            title={`Sin ajustes en ${year}`}
            description="Cuando la responsable registre horas extras o descuentos, aparecerán aquí."
          />
        ) : (
          <ListSurface>
            {adjustments.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
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
                  {formatDateTimeShort(a.createdAt)} · {a.createdBy.name}
                </span>
              </div>
            ))}
          </ListSurface>
        )}
      </section>
    </div>
  );
}
