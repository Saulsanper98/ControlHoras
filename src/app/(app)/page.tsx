import Link from "next/link";
import { ClipboardList, Umbrella, Clock, Users, Newspaper, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Stagger } from "@/components/ui/stagger";
import { formatRelativeTime } from "@/lib/format-relative-time";
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
    where: {
      status: "PUBLICADA",
      OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
    },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    take: 3,
  });

  const role = session.user.role;
  const showManagement = canManage(role);
  const showPersonal = hasOwnEmployeeData(role);

  const [managementStats, personalStats, nextPending, pendingVacations, nextVacationRequests] =
    await Promise.all([
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
            where: { userId: session.user.id, year },
            _sum: { hours: true },
          }),
        ])
      : null,
    showManagement
      ? prisma.timeSheet.findFirst({
          where: { status: "FIRMADO_EMPLEADO" },
          orderBy: { submittedAt: "asc" },
          include: { user: { include: { department: true } } },
        })
      : null,
    showManagement
      ? prisma.vacationRequest.count({ where: { status: "PENDIENTE" } })
      : 0,
    showManagement
      ? prisma.vacationRequest.findMany({
          where: { status: "PENDIENTE" },
          include: { user: true },
          orderBy: { createdAt: "asc" },
          take: 3,
        })
      : [],
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
      <Stagger>
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-navy sm:text-3xl">
            {greeting(now)}, {(session.user.name ?? "").split(" ")[0]}{" "}
            <span className="animate-wave" aria-hidden="true">
              👋
            </span>
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-brand-navy/55">
              {role === "JEFA"
                ? `Resumen de ${MONTH_NAMES[month - 1]} de ${year}`
                : `${session.user.departmentName} · ${MONTH_NAMES[month - 1]} de ${year}`}
            </p>
            {showPersonal && timeSheet?.status === "FIRMADO_EMPLEADO" && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800">
                Control enviado
              </span>
            )}
            {showPersonal && timeSheet?.status === "RECHAZADO" && (
              <Link
                href="/control-horario"
                className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-800 hover:underline"
              >
                Control rechazado — corrígelo
              </Link>
            )}
            {showPersonal && (!timeSheet || timeSheet.status === "BORRADOR") && now.getDate() >= 25 && (
              <Link
                href="/control-horario"
                className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800 hover:underline"
              >
                Recuerda enviar tu control de {MONTH_NAMES[month - 1]}
              </Link>
            )}
            {showPersonal && !timeSheet && (
              <Link
                href="/control-horario"
                className="rounded-full bg-brand-blue/12 px-2 py-0.5 text-xs font-medium text-brand-blue hover:underline"
              >
                Empieza tu control de {MONTH_NAMES[month - 1]}
              </Link>
            )}
          </div>
        </div>
      </Stagger>

      {showPersonal && timeSheet?.status === "RECHAZADO" && (
        <Link
          href="/control-horario"
          className="block rounded-2xl bg-red-500/10 px-4 py-3 ring-1 ring-red-300/40 transition hover:bg-red-500/14"
        >
          <p className="text-sm font-medium text-red-800">Tu control horario fue rechazado</p>
          <p className="mt-1 text-sm text-brand-navy">
            {timeSheet.rejectionReason ?? "Revisa el motivo y vuelve a enviarlo firmado."}
          </p>
          <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">
            Ir a corregir <ArrowRight className="h-4 w-4" />
          </p>
        </Link>
      )}
      {showManagement && (
        <div className="animate-fade-slide-up space-y-5" style={{ animationDelay: "90ms" }}>
          {(nextPending || nextVacationRequests.length > 0) && (
            <div className="divide-y divide-[color:var(--surface-divider)] border-y border-[color:var(--surface-divider)]">
              {nextPending && (
                <Link
                  href={`/jefa/controles/${nextPending.id}`}
                  className="flex items-center justify-between gap-3 py-3.5 transition hover:bg-brand-navy/[0.035]"
                >
                  <div>
                    <p className="text-sm font-medium text-brand-blue">Siguiente control pendiente</p>
                    <p className="font-semibold text-brand-navy">
                      {nextPending.user.name} · {MONTH_NAMES[nextPending.month - 1]} de{" "}
                      {nextPending.year}
                    </p>
                    <p className="text-xs text-slate-500">
                      {nextPending.user.department?.name ?? "—"}
                      {pendingVacations > 0 &&
                        ` · ${pendingVacations} solicitud${pendingVacations === 1 ? "" : "es"} de vacaciones pendiente${pendingVacations === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-brand-blue" />
                </Link>
              )}
              {nextVacationRequests.map((r) => (
                <Link
                  key={r.id}
                  href="/jefa/vacaciones"
                  className="flex items-center justify-between gap-3 py-3.5 transition hover:bg-brand-navy/[0.035]"
                >
                  <div>
                    <p className="text-sm font-medium text-amber-800">Vacaciones pendientes</p>
                    <p className="font-semibold text-brand-navy">
                      {r.user.name} · {Number(r.days)} días
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-amber-700" />
                </Link>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 divide-y divide-[color:var(--surface-divider)] border-y border-[color:var(--surface-divider)] sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:border-x-0">
            <StatCard
              label="Controles pendientes de firmar"
              value={String(pendientes)}
              icon={ClipboardList}
              href="/jefa/controles"
            />
            <StatCard
              label="Empleados activos"
              value={String(empleados)}
              icon={Users}
              href="/jefa/empleados"
            />
            <StatCard
              label="Controles horarios este mes"
              value={String(controlesDelMes)}
              icon={Clock}
              href={`/jefa/controles?month=${month}&year=${year}`}
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
          <div className="grid grid-cols-1 divide-y divide-[color:var(--surface-divider)] border-y border-[color:var(--surface-divider)] sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:border-x-0">
            <StatCard
              label="Control horario de este mes"
              value={timeSheet ? STATUS_LABEL[timeSheet.status] : "Sin empezar"}
              icon={ClipboardList}
              href="/control-horario"
            />
            <StatCard
              label="Vacaciones restantes"
              value={diasRestantes !== null ? `${diasRestantes} días` : "Sin datos"}
              hint={year.toString()}
              icon={Umbrella}
              href="/vacaciones"
            />
            <StatCard
              label="Bolsa de horas"
              value={`${horasAcumuladas.toFixed(1)} h`}
              hint="Ajustes acumulados"
              icon={Clock}
              href="/vacaciones"
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
        <EmptyState
          icon={Newspaper}
          title="Sin noticias todavía"
          description="Cuando la responsable publique novedades, aparecerán aquí."
        />
      ) : (
        <div className="divide-y divide-[color:var(--surface-divider)] border-y border-[color:var(--surface-divider)]">
          {news.map((item) => (
            <Link
              key={item.id}
              href={`/noticias/${item.id}`}
              className="block py-3.5 transition hover:bg-brand-navy/[0.035]"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-brand-navy">{item.title}</p>
                <span className="shrink-0 text-xs text-slate-400">
                  {formatRelativeTime(item.publishedAt)}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{item.body}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
