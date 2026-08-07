import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VacationEditor } from "@/components/jefa/vacation-editor";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { ListSurface } from "@/components/ui/list-surface";
import { SectionTitle } from "@/components/ui/section-title";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { YearSwitcher } from "@/components/ui/year-switcher";
import { VacationProgressBar } from "@/components/vacaciones/vacation-progress";
import { Stagger } from "@/components/ui/stagger";
import { requireManagerSession } from "@/lib/auth-helpers";
import { formatDateShort } from "@/lib/format-date";
import { LEAVE_TYPE_LABEL } from "@/lib/labels";
import { CalendarDays } from "lucide-react";
import { RequestReviewButtons } from "@/components/jefa/request-review-buttons";

export default async function VacationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const { userId } = await params;
  const sp = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = Number(sp.year) || currentYear;

  const [employee, balance, adjustments, yearRequests, balanceYears] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { department: true } }),
    prisma.vacationBalance.findUnique({ where: { userId_year: { userId, year } } }),
    prisma.hourAdjustment.findMany({
      where: { userId, year },
      include: { createdBy: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vacationRequest.findMany({
      where: { userId, year },
      orderBy: { startDate: "desc" },
    }),
    prisma.vacationBalance.findMany({
      where: { userId },
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "desc" },
    }),
  ]);

  if (!employee || employee.role !== "EMPLEADO") notFound();

  const years = [
    ...new Set([currentYear, currentYear - 1, ...balanceYears.map((b) => b.year), year]),
  ].sort((a, b) => b - a);

  const pendingDays = yearRequests
    .filter(
      (r) =>
        r.status === "PENDIENTE" &&
        (r.leaveType === "VACACIONES" || r.leaveType === "MEDIO_DIA")
    )
    .reduce((sum, r) => sum + Number(r.days), 0);

  const totalDays = balance ? Number(balance.totalDays) : 0;
  const usedDays = balance ? Number(balance.usedDays) : 0;

  return (
    <div className="space-y-6">
      <Stagger>
        <div>
          <BackLink href={`/jefa/vacaciones?year=${year}`}>Volver al listado</BackLink>
          <PageHeader
            title={employee.name}
            description={`${employee.department?.name ?? "—"} · Saldo y bolsa ${year}`}
          >
            <YearSwitcher
              year={year}
              options={years.map((y) => ({
                year: y,
                href: `/jefa/vacaciones/${userId}?year=${y}`,
              }))}
            />
          </PageHeader>
        </div>
      </Stagger>

      {totalDays > 0 && (
        <VacationProgressBar total={totalDays} used={usedDays} pending={pendingDays} />
      )}

      <VacationEditor
        userId={employee.id}
        year={year}
        initialTotalDays={totalDays}
        initialUsedDays={usedDays}
        initialNotes={balance?.notes ?? ""}
        pendingDays={pendingDays}
        adjustments={adjustments.map((a) => ({
          id: a.id,
          hours: Number(a.hours),
          reason: a.reason,
          createdAt: a.createdAt.toISOString(),
          createdByName: a.createdBy.name,
        }))}
      />

      <section>
        <SectionTitle className="mb-3">Solicitudes {year}</SectionTitle>
        {yearRequests.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Sin solicitudes"
            description={`No hay solicitudes de ausencia en ${year}.`}
          />
        ) : (
          <ListSurface>
            {yearRequests.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-brand-navy">
                    {formatDateShort(r.startDate)} – {formatDateShort(r.endDate)}
                    <span className="ml-2 font-normal tabular-nums text-slate-500">
                      {Number(r.days)} día{Number(r.days) === 1 ? "" : "s"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {LEAVE_TYPE_LABEL[r.leaveType] ?? r.leaveType}
                    {r.employeeNotes ? ` · ${r.employeeNotes}` : ""}
                  </p>
                  {r.rejectionReason && (
                    <p className="mt-0.5 text-xs text-red-700">{r.rejectionReason}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {r.status === "PENDIENTE" ? (
                    <RequestReviewButtons requestId={r.id} />
                  ) : (
                    <StatusBadge status={r.status} preset="leave" />
                  )}
                </div>
              </div>
            ))}
          </ListSurface>
        )}
      </section>
    </div>
  );
}
