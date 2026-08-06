import { redirect } from "next/navigation";
import { Umbrella, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { VacationRequestsPanel } from "@/components/vacaciones/vacation-requests-panel";
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

  const [balance, adjustments, availableYears, vacationRequests] = await Promise.all([
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
    prisma.vacationRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
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
            Consulta tu saldo, solicita vacaciones y revisa tu bolsa de horas.
          </p>
        </div>
        <form method="get" className="flex items-end gap-2">
          <div className="w-28">
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
            className="rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark"
          >
            Ver
          </button>
        </form>
      </div>

      <Card className="overflow-hidden p-0">
        {/* Resumen en una sola franja, sin tarjetas anidadas */}
        <div className="grid grid-cols-1 divide-y divide-brand-navy/8 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="flex items-center gap-4 px-5 py-5">
            <div className="rounded-xl bg-brand-blue/10 p-3 text-brand-blue">
              <Umbrella className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Vacaciones restantes</p>
              <p className="text-2xl font-semibold tabular-nums text-brand-navy">
                {remaining !== null ? `${remaining} días` : "Sin datos"}
              </p>
              <p className="text-xs text-slate-500">
                {usedDays} de {totalDays} usados · {year}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-5 py-5">
            <div className="rounded-xl bg-brand-blue/10 p-3 text-brand-blue">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Bolsa de horas</p>
              <p className="text-2xl font-semibold tabular-nums text-brand-navy">
                {totalHours.toFixed(1)} h
              </p>
              <p className="text-xs text-slate-500">Ajustes acumulados</p>
            </div>
          </div>
        </div>

        {balance?.notes && (
          <div className="border-t border-brand-navy/10 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Notas de la responsable
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-brand-navy">{balance.notes}</p>
          </div>
        )}

        <div className="border-t border-brand-navy/10 px-5 py-5">
          <VacationRequestsPanel
            year={year}
            requests={vacationRequests.map((r) => ({
              id: r.id,
              startDate: r.startDate.toISOString(),
              endDate: r.endDate.toISOString(),
              days: Number(r.days),
              status: r.status,
              employeeNotes: r.employeeNotes,
              rejectionReason: r.rejectionReason,
              createdAt: r.createdAt.toISOString(),
            }))}
          />
        </div>

        <div className="border-t border-brand-navy/10 px-5 py-5">
          <h2 className="text-sm font-semibold text-brand-navy">Historial de ajustes de horas</h2>
          {adjustments.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Sin ajustes registrados.</p>
          ) : (
            <ul className="mt-3 divide-y divide-brand-navy/8">
              {adjustments.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
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
                    {a.createdAt.toLocaleDateString("es-ES")} · {a.createdBy.name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
