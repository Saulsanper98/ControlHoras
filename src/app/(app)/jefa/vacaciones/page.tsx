import Link from "next/link";
import { Umbrella } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

export default async function JefaVacacionesPage() {
  const year = new Date().getFullYear();

  const [employees, balances, adjustmentSums] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["EMPLEADO", "ADMIN"] }, active: true },
      include: { department: true },
      orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.vacationBalance.findMany({ where: { year } }),
    prisma.hourAdjustment.groupBy({ by: ["userId"], _sum: { hours: true } }),
  ]);

  const balanceByUser = new Map(balances.map((b) => [b.userId, b]));
  const hoursByUser = new Map(adjustmentSums.map((a) => [a.userId, Number(a._sum.hours ?? 0)]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Vacaciones y horas</h1>
        <p className="text-slate-500">
          Gestiona los saldos de vacaciones ({year}) y la bolsa de horas de cada empleado.
        </p>
      </div>

      <div className="space-y-2">
        {employees.map((e) => {
          const balance = balanceByUser.get(e.id);
          const remaining = balance ? Number(balance.totalDays) - Number(balance.usedDays) : null;
          const hours = hoursByUser.get(e.id) ?? 0;
          return (
            <Link key={e.id} href={`/jefa/vacaciones/${e.id}`}>
              <Card className="flex items-center justify-between transition hover:border-brand-blue">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-brand-blue/10 p-2 text-brand-blue">
                    <Umbrella className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-brand-navy">{e.name}</p>
                    <p className="text-sm text-slate-500">{e.department?.name ?? "—"}</p>
                  </div>
                </div>
                <div className="flex gap-6 text-right text-sm">
                  <div>
                    <p className="text-slate-400">Vacaciones</p>
                    <p className="font-medium text-brand-navy">
                      {remaining !== null ? `${remaining} días` : "Sin datos"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Bolsa de horas</p>
                    <p className="font-medium text-brand-navy">{hours.toFixed(1)} h</p>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
        {employees.length === 0 && (
          <Card className="text-sm text-slate-400">No hay empleados dados de alta.</Card>
        )}
      </div>
    </div>
  );
}
