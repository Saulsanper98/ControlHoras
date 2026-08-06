import Link from "next/link";
import { redirect } from "next/navigation";
import { Umbrella, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, StatCard } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
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

  const [balance, adjustments, availableYears] = await Promise.all([
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
  ]);

  const years = [
    ...new Set([currentYear, ...availableYears.map((b) => b.year)]),
  ].sort((a, b) => b - a);

  const totalDays = balance ? Number(balance.totalDays) : 0;
  const usedDays = balance ? Number(balance.usedDays) : 0;
  const remaining = balance ? totalDays - usedDays : null;
  const totalHours = adjustments.reduce((sum, a) => sum + Number(a.hours), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-navy">Vacaciones y horas</h1>
          <p className="text-brand-navy/55">
            Consulta tus días de vacaciones restantes y tu bolsa de horas acumuladas.
          </p>
        </div>
        <form method="get" className="flex items-end gap-2">
          <div>
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
            className="rounded-md bg-brand-blue px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-blue-dark"
          >
            Ver
          </button>
        </form>
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

      {balance?.notes && (
        <Card>
          <p className="text-sm font-medium text-brand-navy">Notas de la responsable</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{balance.notes}</p>
        </Card>
      )}

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
