import Link from "next/link";
import { ClipboardList, Umbrella, Clock, Users, Newspaper } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, StatCard } from "@/components/ui/card";
import { canManage, hasOwnEmployeeData } from "@/lib/roles";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  FIRMADO_EMPLEADO: "Enviado, pendiente de la responsable",
  FIRMADO_RESPONSABLE: "Firmado y cerrado",
  RECHAZADO: "Rechazado",
};

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const news = await prisma.news.findMany({
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    take: 3,
  });

  const role = session.user.role;
  const showManagement = canManage(role);
  const showPersonal = hasOwnEmployeeData(role);

  const [managementStats, personalStats] = await Promise.all([
    showManagement
      ? Promise.all([
          prisma.timeSheet.count({ where: { status: "FIRMADO_EMPLEADO" } }),
          prisma.user.count({ where: { role: "EMPLEADO", active: true } }),
          prisma.timeSheet.count({ where: { month, year } }),
        ])
      : null,
    showPersonal
      ? Promise.all([
          prisma.timeSheet.findUnique({
            where: { userId_month_year: { userId: session.user.id, month, year } },
          }),
          prisma.vacationBalance.findUnique({
            where: { userId_year: { userId: session.user.id, year } },
          }),
          prisma.hourAdjustment.aggregate({
            where: { userId: session.user.id },
            _sum: { hours: true },
          }),
        ])
      : null,
  ]);

  const [pendientes, empleados, controlesDelMes] = managementStats ?? [0, 0, 0];
  const [timeSheet, vacationBalance, hourAdjustments] = personalStats ?? [
    null,
    null,
    { _sum: { hours: null } },
  ];

  const diasRestantes = vacationBalance
    ? Number(vacationBalance.totalDays) - Number(vacationBalance.usedDays)
    : null;
  const horasAcumuladas = Number(hourAdjustments._sum.hours ?? 0);

  return (
    <div className="space-y-8">
      <div className="animate-fade-slide-up">
        <h1 className="text-2xl font-semibold text-brand-navy">
          {greeting(now)}, {(session.user.name ?? "").split(" ")[0]}{" "}
          <span className="animate-wave" aria-hidden="true">
            👋
          </span>
        </h1>
        <p className="text-brand-navy/55">
          {role === "JEFA"
            ? `Resumen de ${MONTH_NAMES[month - 1]} de ${year}`
            : `${session.user.departmentName} · ${MONTH_NAMES[month - 1]} de ${year}`}
        </p>
      </div>

      {showManagement && (
        <div className="animate-fade-slide-up" style={{ animationDelay: "90ms" }}>
          {showPersonal && (
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-navy/45">
              Resumen de gestión
            </h2>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Controles pendientes de firmar"
              value={String(pendientes)}
              icon={ClipboardList}
            />
            <StatCard
              label="Empleados activos"
              value={String(empleados)}
              icon={Users}
            />
            <StatCard
              label="Controles horarios este mes"
              value={String(controlesDelMes)}
              icon={Clock}
            />
          </div>
        </div>
      )}

      {showPersonal && (
        <div className="animate-fade-slide-up" style={{ animationDelay: "170ms" }}>
          {showManagement && (
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-navy/45">
              Mi resumen personal
            </h2>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Control horario de este mes"
              value={timeSheet ? STATUS_LABEL[timeSheet.status] : "Sin empezar"}
              icon={ClipboardList}
            />
            <StatCard
              label="Vacaciones restantes"
              value={diasRestantes !== null ? `${diasRestantes} días` : "Sin datos"}
              hint={year.toString()}
              icon={Umbrella}
            />
            <StatCard
              label="Bolsa de horas"
              value={`${horasAcumuladas.toFixed(1)} h`}
              hint="Ajustes acumulados"
              icon={Clock}
            />
          </div>
        </div>
      )}

      <div className="animate-fade-slide-up" style={{ animationDelay: "250ms" }}>
        <NewsSection news={news} viewAllHref={showManagement ? "/jefa/noticias" : "/noticias"} />
      </div>
    </div>
  );
}

function NewsSection({
  news,
  viewAllHref,
}: {
  news: { id: string; title: string; body: string; publishedAt: Date }[];
  viewAllHref: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-brand-blue" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-navy/45">
            Últimas noticias
          </h2>
        </div>
        <Link href={viewAllHref} className="text-sm font-medium text-brand-blue hover:underline">
          Ver todas
        </Link>
      </div>
      {news.length === 0 ? (
        <Card className="text-sm text-slate-500">
          Todavía no hay noticias publicadas.
        </Card>
      ) : (
        <div className="space-y-3">
          {news.map((item) => (
            <Card key={item.id}>
              <p className="font-medium text-brand-navy">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {item.body}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
