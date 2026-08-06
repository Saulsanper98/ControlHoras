import Link from "next/link";
import { redirect } from "next/navigation";
import { Umbrella, CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PendingVacationRequests } from "@/components/jefa/pending-vacation-requests";
import { requireManagerSession } from "@/lib/auth-helpers";

export default async function JefaVacacionesPage() {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const year = new Date().getFullYear();

  const [employees, balances, adjustmentSums, pendingRequests] = await Promise.all([
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
  ]);

  const balanceByUser = new Map(balances.map((b) => [b.userId, b]));
  const hoursByUser = new Map(adjustmentSums.map((a) => [a.userId, Number(a._sum.hours ?? 0)]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-navy">Vacaciones y horas</h1>
          <p className="text-brand-navy/55">
            Gestiona los saldos de vacaciones ({year}) y la bolsa de horas de cada empleado.
          </p>
        </div>
        <Link
          href="/jefa/vacaciones/calendario"
          className="surface-btn flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-brand-blue"
        >
          <CalendarDays className="h-4 w-4" />
          Calendario del equipo
        </Link>
      </div>

      <PendingVacationRequests
        requests={pendingRequests.map((r) => ({
          id: r.id,
          userName: r.user.name,
          departmentName: r.user.department?.name ?? null,
          startDate: r.startDate.toISOString(),
          endDate: r.endDate.toISOString(),
          days: Number(r.days),
          employeeNotes: r.employeeNotes,
          leaveType: r.leaveType,
        }))}
      />

      <div className="divide-y divide-brand-navy/10 border-y border-brand-navy/10">
        {employees.map((e) => {
          const balance = balanceByUser.get(e.id);
          const remaining = balance ? Number(balance.totalDays) - Number(balance.usedDays) : null;
          const hours = hoursByUser.get(e.id) ?? 0;
          return (
            <Link
              key={e.id}
              href={`/jefa/vacaciones/${e.id}`}
            className="flex items-center justify-between gap-3 py-3 transition hover:bg-brand-navy/[0.03]"
          >
            <div className="flex items-center gap-3">
              <Umbrella className="h-4 w-4 text-brand-blue" />
              <div>
                <p className="font-medium text-brand-navy">{e.name}</p>
                <p className="text-sm text-slate-500">{e.department?.name ?? "—"}</p>
              </div>
            </div>
            <div className="flex gap-6 text-right text-sm">
              <div>
                <p className="text-xs text-slate-500">Vacaciones</p>
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
      })}
      {employees.length === 0 && (
        <p className="py-6 text-sm text-slate-500">No hay empleados dados de alta.</p>
      )}
      </div>
    </div>
  );
}
