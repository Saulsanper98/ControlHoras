import { redirect } from "next/navigation";
import { Umbrella, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, StatCard } from "@/components/ui/card";
import { requireEmployeeSession } from "@/lib/auth-helpers";

export default async function VacacionesPage() {
  const session = await requireEmployeeSession();
  if (!session) redirect("/");

  const year = new Date().getFullYear();

  const [balance, adjustments] = await Promise.all([
    prisma.vacationBalance.findUnique({
      where: { userId_year: { userId: session.user.id, year } },
    }),
    prisma.hourAdjustment.findMany({
      where: { userId: session.user.id },
      include: { createdBy: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const totalDays = balance ? Number(balance.totalDays) : 0;
  const usedDays = balance ? Number(balance.usedDays) : 0;
  const remaining = balance ? totalDays - usedDays : null;
  const totalHours = adjustments.reduce((sum, a) => sum + Number(a.hours), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Vacaciones y horas</h1>
        <p className="text-brand-navy/55">
          Consulta tus días de vacaciones restantes y tu bolsa de horas acumuladas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Vacaciones restantes"
          value={remaining !== null ? `${remaining} días` : "Sin datos"}
          hint={`${usedDays} de ${totalDays} usados · ${year}`}
          icon={Umbrella}
        />
        <StatCard
          label="Bolsa de horas"
          value={`${totalHours.toFixed(1)} h`}
          hint="Ajustes acumulados"
          icon={Clock}
        />
      </div>

      <Card>
        <p className="mb-3 text-sm font-medium text-brand-navy">Historial de ajustes de horas</p>
        {adjustments.length === 0 ? (
          <p className="text-sm text-slate-500">Sin ajustes registrados.</p>
        ) : (
          <div className="space-y-2">
            {adjustments.map((a) => (
              <div
                key={a.id}
                className="surface-muted flex items-center justify-between rounded-md border border-brand-navy/10 px-3 py-2 text-sm"
              >
                <div>
                  <span
                    className={`font-medium ${Number(a.hours) >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {Number(a.hours) >= 0 ? "+" : ""}
                    {Number(a.hours).toFixed(1)} h
                  </span>
                  <span className="ml-2 text-slate-500">{a.reason}</span>
                </div>
                <span className="text-xs text-slate-500">
                  {a.createdAt.toLocaleDateString("es-ES")} · {a.createdBy.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
