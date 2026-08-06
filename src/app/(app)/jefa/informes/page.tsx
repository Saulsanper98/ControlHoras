import Link from "next/link";
import { redirect } from "next/navigation";
import { Download, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { SectionBlock, TableSurface, ListSurface } from "@/components/ui/list-surface";
import { requireManagerSession } from "@/lib/auth-helpers";
import { buildInformeHoras } from "@/lib/informe-horas";
import { TIMESHEET_STATUS_COLOR, TIMESHEET_STATUS_LABEL } from "@/lib/labels";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const STATUS_LABEL: Record<string, string> = {
  ...TIMESHEET_STATUS_LABEL,
  SIN_CONTROL: "Sin control",
};

const STATUS_COLOR: Record<string, string> = {
  ...TIMESHEET_STATUS_COLOR,
  SIN_CONTROL: "bg-slate-500/12 text-slate-600",
};

export default async function InformeHorasPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    year?: string;
    department?: string;
    status?: string;
  }>;
}) {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const params = await searchParams;
  const now = new Date();
  const month = Number(params.month) || now.getMonth() + 1;
  const year = Number(params.year) || now.getFullYear();
  const departmentId = params.department || undefined;
  const status = params.status || undefined;

  const [departments, { rows, byDept, summary }] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    buildInformeHoras({ month, year, departmentId, status }),
  ]);

  const query = new URLSearchParams();
  query.set("month", String(month));
  query.set("year", String(year));
  if (departmentId) query.set("department", departmentId);
  if (status) query.set("status", status);
  const csvHref = `/api/informes/horas?${query.toString()}`;

  const missing = rows.filter((r) => !r.hasSheet);
  const hasFilters = Boolean(departmentId || status);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Informe de horas"
        description={`Totales de ${MONTH_NAMES[month - 1]} de ${year} por empleado y departamento.`}
      >
        <a
          href={csvHref}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </a>
      </PageHeader>

      <SectionBlock>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="w-36">
            <label htmlFor="inf-month" className="mb-1 block text-xs font-medium text-slate-500">
              Mes
            </label>
            <Select id="inf-month" name="month" defaultValue={month}>
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-24">
            <label htmlFor="inf-year" className="mb-1 block text-xs font-medium text-slate-500">
              Año
            </label>
            <input
              id="inf-year"
              type="number"
              name="year"
              defaultValue={year}
              className="field-control w-full px-3 py-2 text-sm"
            />
          </div>
          <div className="w-44">
            <label htmlFor="inf-dept" className="mb-1 block text-xs font-medium text-slate-500">
              Departamento
            </label>
            <Select id="inf-dept" name="department" defaultValue={departmentId ?? ""}>
              <option value="">Todos</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-48">
            <label htmlFor="inf-status" className="mb-1 block text-xs font-medium text-slate-500">
              Estado
            </label>
            <Select id="inf-status" name="status" defaultValue={status ?? ""}>
              <option value="">Todos</option>
              <option value="SIN_CONTROL">Sin control</option>
              <option value="BORRADOR">Borrador / sin enviar</option>
              <option value="FIRMADO_EMPLEADO">Pendiente de firma</option>
              <option value="FIRMADO_RESPONSABLE">Firmado</option>
              <option value="RECHAZADO">Rechazado</option>
            </Select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark"
          >
            Ver informe
          </button>
          {hasFilters && (
            <Link
              href={`/jefa/informes?month=${month}&year=${year}`}
              className="pb-2 text-sm font-medium text-slate-500 hover:text-brand-navy"
            >
              Limpiar filtros
            </Link>
          )}
        </form>
      </SectionBlock>

      <div className="grid grid-cols-2 divide-y divide-[color:var(--surface-divider)] border-y border-[color:var(--surface-divider)] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
        <SummaryStat label="Horas totales" value={`${summary.totalHours.toFixed(1)} h`} />
        <SummaryStat label="Empleados" value={String(summary.employees)} />
        <SummaryStat
          label="Sin control"
          value={String(summary.missing)}
          emphasize={summary.missing > 0}
        />
        <SummaryStat
          label="Pendientes de firma"
          value={String(summary.pendingSign)}
          emphasize={summary.pendingSign > 0}
        />
      </div>

      {missing.length > 0 && status !== "SIN_CONTROL" && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Sin control este mes ({missing.length})
          </h2>
          <ListSurface>
            {missing.map((r) => (
              <div
                key={r.userId}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-brand-navy">{r.name}</p>
                  <p className="text-slate-500">{r.dept}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR.SIN_CONTROL}`}>
                  Sin control
                </span>
              </div>
            ))}
          </ListSurface>
        </section>
      )}

      {[...byDept.entries()].map(([dept, list]) => {
        const deptTotal = list.reduce((s, r) => s + r.total, 0);
        const withSheet = list.filter((r) => r.hasSheet);
        return (
          <section key={dept} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-navy/45">
              {dept} · {deptTotal.toFixed(1)} h
              <span className="ml-2 font-normal text-slate-400">
                ({withSheet.length}/{list.length} con control)
              </span>
            </h2>
            <TableSurface>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[color:var(--surface-divider)] text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-0 py-2.5 sm:px-3">Empleado</th>
                    <th className="px-3 py-2.5">Estado</th>
                    <th className="px-3 py-2.5 tabular-nums">Total</th>
                    <th className="hidden px-3 py-2.5 tabular-nums sm:table-cell">Norm.</th>
                    <th className="hidden px-3 py-2.5 tabular-nums sm:table-cell">Extra</th>
                    <th className="hidden px-3 py-2.5 tabular-nums md:table-cell">Noct.</th>
                    <th className="px-3 py-2.5">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr
                      key={r.userId}
                      className="border-b border-[color:var(--surface-divider)] last:border-0"
                    >
                      <td className="px-0 py-2.5 font-medium text-brand-navy sm:px-3">
                        {r.name}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status] ?? ""}`}
                        >
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-brand-navy">
                        {r.hasSheet ? r.total.toFixed(1) : "—"}
                      </td>
                      <td className="hidden px-3 py-2.5 tabular-nums text-slate-600 sm:table-cell">
                        {r.hasSheet ? r.normal.toFixed(1) : "—"}
                      </td>
                      <td className="hidden px-3 py-2.5 tabular-nums text-slate-600 sm:table-cell">
                        {r.hasSheet ? r.overtime.toFixed(1) : "—"}
                      </td>
                      <td className="hidden px-3 py-2.5 tabular-nums text-slate-600 md:table-cell">
                        {r.hasSheet ? r.night.toFixed(1) : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        {r.id ? (
                          <a
                            href={`/api/timesheets/${r.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-blue hover:underline"
                          >
                            Descargar
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableSurface>
          </section>
        );
      })}

      {rows.length === 0 && (
        <p className="border-y border-[color:var(--surface-divider)] py-6 text-sm text-slate-500">
          No hay empleados que coincidan con los filtros.
        </p>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="py-4 sm:px-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-semibold tracking-tight tabular-nums ${
          emphasize ? "text-amber-800" : "text-brand-navy"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
