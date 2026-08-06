import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VacationEditor } from "@/components/jefa/vacation-editor";
import { requireManagerSession } from "@/lib/auth-helpers";

export default async function VacationDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const { userId } = await params;
  const year = new Date().getFullYear();

  const [employee, balance, adjustments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { department: true } }),
    prisma.vacationBalance.findUnique({ where: { userId_year: { userId, year } } }),
    prisma.hourAdjustment.findMany({
      where: { userId, year },
      include: { createdBy: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!employee || employee.role !== "EMPLEADO") notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">{employee.name}</h1>
        <p className="text-slate-500">{employee.department?.name ?? "—"}</p>
      </div>

      <VacationEditor
        userId={employee.id}
        year={year}
        initialTotalDays={balance ? Number(balance.totalDays) : 0}
        initialUsedDays={balance ? Number(balance.usedDays) : 0}
        initialNotes={balance?.notes ?? ""}
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
