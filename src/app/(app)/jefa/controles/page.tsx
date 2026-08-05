import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { requireManagerSession } from "@/lib/auth-helpers";

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
  BORRADOR: "bg-slate-100 text-slate-600",
  FIRMADO_EMPLEADO: "bg-amber-100 text-amber-700",
  FIRMADO_RESPONSABLE: "bg-emerald-100 text-emerald-700",
  RECHAZADO: "bg-red-100 text-red-700",
};

export default async function ControlesPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string; month?: string; year?: string }>;
}) {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const params = await searchParams;
  const departmentId = params.department || undefined;
  const month = params.month ? Number(params.month) : undefined;
  const year = params.year ? Number(params.year) : undefined;

  const HISTORY_LIMIT = 100;

  const baseWhere = {
    ...(departmentId ? { user: { departmentId } } : {}),
    ...(month ? { month } : {}),
    ...(year ? { year } : {}),
  };

  const [pending, others, departments, years] = await Promise.all([
    prisma.timeSheet.findMany({
      where: { status: "FIRMADO_EMPLEADO", ...baseWhere },
      include: { user: { include: { department: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
    prisma.timeSheet.findMany({
      where: { status: { in: ["FIRMADO_RESPONSABLE", "RECHAZADO"] }, ...baseWhere },
      include: { user: { include: { department: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: HISTORY_LIMIT,
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.timeSheet.findMany({
      distinct: ["year"],
      select: { year: true },
      orderBy: { year: "desc" },
    }),
  ]);

  const hasFilters = Boolean(departmentId || month || year);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Controles horarios</h1>
        <p className="text-brand-navy/55">Revisa, firma y descarga los controles horarios de los empleados.</p>
      </div>

      <Card>
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
      </Card>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Pendientes de firma ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <Card className="text-sm text-slate-500">No hay controles pendientes.</Card>
        ) : (
          <div className="space-y-2">
            {pending.map((t) => (
              <TimeSheetRow key={t.id} t={t} />
            ))}
          </div>
        )}
      </section>

      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Historial
          </h2>
          {others.length === HISTORY_LIMIT && (
            <p className="mb-3 text-xs text-slate-500">
              Mostrando los {HISTORY_LIMIT} más recientes. Usa los filtros para acotar la búsqueda.
            </p>
          )}
          <div className="space-y-2">
            {others.map((t) => (
              <TimeSheetRow key={t.id} t={t} />
            ))}
          </div>
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
    <Link href={`/jefa/controles/${t.id}`}>
      <Card className="flex items-center justify-between transition hover:border-brand-blue">
        <div>
          <p className="font-medium text-brand-navy">{t.user.name}</p>
          <p className="text-sm text-slate-500">
            {t.user.department?.name ?? "—"} · {MONTH_NAMES[t.month - 1]} de {t.year}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[t.status]}`}>
          {STATUS_LABEL[t.status]}
        </span>
      </Card>
    </Link>
  );
}
