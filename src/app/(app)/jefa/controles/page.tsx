import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Stagger } from "@/components/ui/stagger";
import { ListSurface, SectionBlock } from "@/components/ui/list-surface";
import { requireManagerSession } from "@/lib/auth-helpers";

const PAGE_SIZE = 20;

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  FIRMADO_EMPLEADO: "Pendiente de firma",
  FIRMADO_RESPONSABLE: "Firmado",
  RECHAZADO: "Rechazado",
};

const STATUS_COLOR: Record<string, string> = {
  BORRADOR: "bg-brand-navy/[0.06] text-slate-600",
  FIRMADO_EMPLEADO: "bg-amber-500/12 text-amber-800",
  FIRMADO_RESPONSABLE: "bg-emerald-500/12 text-emerald-800",
  RECHAZADO: "bg-red-500/12 text-red-800",
};

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
          <button
            type="submit"
            className="rounded-md bg-brand-blue px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-blue-dark"
          >
            Filtrar
          </button>
          {hasFilters && (
            <Link
              href="/jefa/controles"
              className="text-sm font-medium text-slate-500 hover:text-brand-navy"
            >
              Limpiar filtros
            </Link>
          )}
        </form>
      </SectionBlock>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Pendientes de firma ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="border-y border-brand-navy/10 py-6 text-sm text-slate-500">
            No hay controles pendientes.
          </p>
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
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Sin enviar (borrador) ({drafts.length})
          </h2>
          <ListSurface>
            {drafts.map((t) => (
              <TimeSheetRow key={t.id} t={t} />
            ))}
          </ListSurface>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Historial
          </h2>
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
                  className="rounded-lg px-3 py-1.5 text-sm text-brand-blue hover:bg-brand-blue/10"
                >
                  ← Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/jefa/controles?${queryBase.toString()}&page=${page + 1}`}
                  className="rounded-lg px-3 py-1.5 text-sm text-brand-blue hover:bg-brand-blue/10"
                >
                  Siguiente →
                </Link>
              )}
            </div>
          )}
        </section>
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
    <Link
      href={`/jefa/controles/${t.id}`}
      className="flex items-center justify-between gap-3 py-3 transition hover:bg-brand-navy/[0.03]"
    >
      <div>
        <p className="font-medium text-brand-navy">{t.user.name}</p>
        <p className="text-sm text-slate-500">
          {t.user.department?.name ?? "—"} · {MONTH_NAMES[t.month - 1]} de {t.year}
        </p>
      </div>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[t.status]}`}>
        {STATUS_LABEL[t.status]}
      </span>
    </Link>
  );
}
