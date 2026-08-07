import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VacationEditor } from "@/components/jefa/vacation-editor";
import { BackLink } from "@/components/ui/back-link";
import { PageHeader } from "@/components/ui/page-header";
import { requireManagerSession } from "@/lib/auth-helpers";

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

  const [employee, balance, adjustments, pendingRequests] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { department: true } }),
    prisma.vacationBalance.findUnique({ where: { userId_year: { userId, year } } }),
    prisma.hourAdjustment.findMany({
      where: { userId, year },
      include: { createdBy: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vacationRequest.findMany({
      where: {
        userId,
        year,
        status: "PENDIENTE",
        leaveType: { in: ["VACACIONES", "MEDIO_DIA"] },
      },
      select: { days: true },
    }),
  ]);

  if (!employee || employee.role !== "EMPLEADO") notFound();

  const pendingDays = pendingRequests.reduce((sum, r) => sum + Number(r.days), 0);

  return (
    <div className="space-y-6">
      <div>
        <BackLink href={`/jefa/vacaciones?year=${year}`}>Volver al listado</BackLink>
        <PageHeader
          title={employee.name}
          description={`${employee.department?.name ?? "—"} · Saldo y bolsa ${year}`}
        />
      </div>

      <VacationEditor
        userId={employee.id}
        year={year}
        initialTotalDays={balance ? Number(balance.totalDays) : 0}
        initialUsedDays={balance ? Number(balance.usedDays) : 0}
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
    </div>
  );
}
