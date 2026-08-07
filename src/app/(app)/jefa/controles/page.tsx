import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Stagger } from "@/components/ui/stagger";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionEyebrow } from "@/components/ui/section-title";
import { ListSurface, ListRow, SectionBlock } from "@/components/ui/list-surface";
import { requireManagerSession } from "@/lib/auth-helpers";

const PAGE_SIZE = 20;

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default async function ControlesPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string; month?: string; year?: string; page?: string }>;
}) {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const params = await searchParams;
  const departmentId = params.department || undefined;
  const month = params.month ? Number(params.month) : undefined;
  const year = params.year ? Number(params.year) : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const HISTORY_LIMIT = PAGE_SIZE;
  const historySkip = (page - 1) * PAGE_SIZE;

  const baseWhere = {
    ...(departmentId ? { user: { departmentId } } : {}),
    ...(month ? { month } : {}),
    ...(year ? { year } : {}),
  };

  const [pending, drafts, others, othersTotal, departments, years] = await Promise.all([
    prisma.timeSheet.findMany({
      where: { status: "FIRMADO_EMPLEADO", ...baseWhere },
      include: { user: { include: { department: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
    prisma.timeSheet.findMany({
      where: { status: "BORRADOR", ...baseWhere },
      include: { user: { include: { department: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 30,
    }),
    prisma.timeSheet.findMany({
      where: { status: { in: ["FIRMADO_RESPONSABLE", "RECHAZADO"] }, ...baseWhere },
      include: { user: { include: { department: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: HISTORY_LIMIT,
      skip: historySkip,
    }),
    prisma.timeSheet.count({
      where: { status: { in: ["FIRMADO_RESPONSABLE", "RECHAZADO"] }, ...baseWhere },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.timeSheet.findMany({
      distinct: ["year"],
      select: { year: true },
      orderBy: { year: "desc" },
    }),
  ]);

  const hasFilters = Boolean(departmentId || month || year);
  const isFullyEmpty = pending.length === 0 && drafts.length === 0 && othersTotal === 0;
  const totalPages = Math.max(1, Math.ceil(othersTotal / PAGE_SIZE));

  const queryBase = new URLSearchParams();
  if (departmentId) queryBase.set("department", departmentId);
  if (month) queryBase.set("month", String(month));
  if (year) queryBase.set("year", String(year));

  return (
    <div className="space-y-8">
      <Breadcrumbs />
      <Stagger>
        <PageHeader
          title="Controles horarios"
          description="Revisa, firma y descarga los controles horarios de los empleados."
        />
      </Stagger>

      <SectionBlock>
        <form className="flex flex-wrap items-end gap-3" method="get">
          <div className="w-40">
            <label htmlFor="filter-department" className="mb-1 block text-xs font-medium text-slate-500">
              Departamento
            </label>
            <Select id="filter-department" name="department" defaultValue={departmentId ?? ""}>
              <option value="">Todos</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-40">
            <label htmlFor="filter-month" className="mb-1 block text-xs font-medium text-slate-500">
              Mes
            </label>
            <Select id="filter-month" name="month" defaultValue={month ?? ""}>
              <option value="">Todos</option>
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-28">
            <label htmlFor="filter-year" className="mb-1 block text-xs font-medium text-slate-500">
              Año
            </label>
            <Select id="filter-year" name="year" defaultValue={year ?? ""}>
              <option value="">Todos</option>
              {years.map((y) => (
                <option key={y.year} value={y.year}>
                  {y.year}
                </option>
              ))}
            </Select>
          </div>
          <button type="submit" className="btn-primary">
            Filtrar
          </button>
          {hasFilters && (
            <Link href="/jefa/controles" className="btn-ghost">
              Limpiar filtros
            </Link>
          )}
        </form>
      </SectionBlock>

      {isFullyEmpty ? (
        <EmptyState
          icon={ClipboardList}
          title={
            hasFilters ? "Ningún control coincide con los filtros" : "No hay controles horarios"
          }
          description={
            hasFilters
              ? "Prueba con otros criterios o quita los filtros para ver todos los controles."
              : "Cuando un empleado cree o envíe un control, aparecerá aquí."
          }
          action={
            hasFilters ? (
              <Link href="/jefa/controles" className="btn-primary">
                Limpiar filtros
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
      <section>
        <SectionEyebrow>Pendientes de firma ({pending.length})</SectionEyebrow>
        {pending.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No hay controles pendientes"
            description="Cuando un empleado envíe su control, aparecerá aquí para firmar."
          />
        ) : (
          <ListSurface>
            {pending.map((t) => (
              <TimeSheetRow key={t.id} t={t} />
            ))}
          </ListSurface>
        )}
      </section>

      {drafts.length > 0 && (
        <section>
          <SectionEyebrow>Sin enviar (borrador) ({drafts.length})</SectionEyebrow>
          <ListSurface>
            {drafts.map((t) => (
              <TimeSheetRow key={t.id} t={t} />
            ))}
          </ListSurface>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <SectionEyebrow>Historial</SectionEyebrow>
          {others.length === HISTORY_LIMIT && othersTotal > HISTORY_LIMIT && (
            <p className="mb-3 text-xs text-slate-500">
              Página {page} de {totalPages} · {othersTotal} registros en total
            </p>
          )}
          <ListSurface>
            {others.map((t) => (
              <TimeSheetRow key={t.id} t={t} />
            ))}
          </ListSurface>
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/jefa/controles?${queryBase.toString()}&page=${page - 1}`}
                  className="btn-sm btn-ghost"
                >
                  ← Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/jefa/controles?${queryBase.toString()}&page=${page + 1}`}
                  className="btn-sm btn-ghost"
                >
                  Siguiente →
                </Link>
              )}
            </div>
          )}
        </section>
      )}
        </>
      )}
    </div>
  );
}

function TimeSheetRow({
  t,
}: {
  t: {
    id: string;
    month: number;
    year: number;
    status: string;
    user: { name: string; department: { name: string } | null };
  };
}) {
  return (
    <ListRow className="!py-0">
      <Link
        href={`/jefa/controles/${t.id}`}
        className="flex items-center justify-between gap-3 py-3"
      >
      <div>
        <p className="font-medium text-brand-navy">{t.user.name}</p>
        <p className="text-sm text-slate-500">
          {t.user.department?.name ?? "—"} · {MONTH_NAMES[t.month - 1]} de {t.year}
        </p>
      </div>
      <StatusBadge status={t.status} />
      </Link>
    </ListRow>
  );
}
