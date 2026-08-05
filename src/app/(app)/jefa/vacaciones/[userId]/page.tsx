import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VacationEditor } from "@/components/jefa/vacation-editor";

export default async function VacationDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const year = new Date().getFullYear();

  const [employee, balance, adjustments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { department: true } }),
    prisma.vacationBalance.findUnique({ where: { userId_year: { userId, year } } }),
    prisma.hourAdjustment.findMany({
      where: { userId },
      include: { createdBy: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!employee) notFound();

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
