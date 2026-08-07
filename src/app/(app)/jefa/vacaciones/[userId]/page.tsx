import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { VacationEditor } from "@/components/jefa/vacation-editor";
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
        <Link
          href={`/jefa/vacaciones?year=${year}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-brand-navy"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al listado
        </Link>
        <h1 className="text-2xl font-semibold text-brand-navy">{employee.name}</h1>
        <p className="text-slate-500">
          {employee.department?.name ?? "—"} · Saldo y bolsa {year}
        </p>
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
