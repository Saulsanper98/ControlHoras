import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { requireManagerSession } from "@/lib/auth-helpers";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default async function VacationCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const params = await searchParams;
  const now = new Date();
  const month = Number(params.month) || now.getMonth() + 1;
  const year = Number(params.year) || now.getFullYear();

  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  const approved = await prisma.vacationRequest.findMany({
    where: {
      status: "APROBADA",
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart },
    },
    include: { user: { include: { department: true } } },
    orderBy: { startDate: "asc" },
  });

  const prev = month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
  const next = month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/jefa/vacaciones"
          className="mb-2 inline-flex items-center gap-1 text-sm text-brand-blue hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a vacaciones
        </Link>
        <h1 className="text-2xl font-semibold text-brand-navy">Calendario de vacaciones</h1>
        <p className="text-brand-navy/55">Vacaciones aprobadas del equipo.</p>
      </div>

      <Card className="flex items-center justify-between gap-3 py-3">
        <Link
          href={`/jefa/vacaciones/calendario?month=${prev.month}&year=${prev.year}`}
          className="surface-btn rounded-lg px-3 py-1.5 text-sm text-slate-600"
        >
          ← {MONTH_NAMES[prev.month - 1]}
        </Link>
        <span className="font-medium text-brand-navy">
          {MONTH_NAMES[month - 1]} de {year}
        </span>
        <Link
          href={`/jefa/vacaciones/calendario?month=${next.month}&year=${next.year}`}
          className="surface-btn rounded-lg px-3 py-1.5 text-sm text-slate-600"
        >
          {MONTH_NAMES[next.month - 1]} →
        </Link>
      </Card>

      {approved.length === 0 ? (
        <Card className="text-sm text-slate-500">
          No hay vacaciones aprobadas en este mes.
        </Card>
      ) : (
        <div className="space-y-2">
          {approved.map((r) => (
            <Card key={r.id} className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-brand-navy">{r.user.name}</p>
                <p className="text-sm text-slate-500">{r.user.department?.name ?? "—"}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium text-brand-navy">
                  {r.startDate.toLocaleDateString("es-ES")} – {r.endDate.toLocaleDateString("es-ES")}
                </p>
                <p className="text-slate-500">{Number(r.days)} días</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
