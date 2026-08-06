import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireManagerSession } from "@/lib/auth-helpers";
import { calculateDayHours, sumDayHours } from "@/lib/timesheet-calc";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default async function InformeHorasPage({
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

  const sheets = await prisma.timeSheet.findMany({
    where: { month, year },
    include: {
      user: { include: { department: true } },
      entries: true,
    },
    orderBy: [{ user: { department: { name: "asc" } } }, { user: { name: "asc" } }],
  });

  const rows = sheets.map((s) => {
    const totals = sumDayHours(
      s.entries.map((e) =>
        calculateDayHours(e.checkIn ?? "", e.checkOut ?? "")
      )
    );
    return {
      id: s.id,
      name: s.user.name,
      dept: s.user.department?.name ?? "—",
      status: s.status,
      total: totals.totalHours,
      normal: totals.normalHours,
      overtime: totals.overtimeHours,
      night: totals.nightHours,
    };
  });

  const byDept = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byDept.get(row.dept) ?? [];
    list.push(row);
    byDept.set(row.dept, list);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Informe de horas"
        description={`Totales de ${MONTH_NAMES[month - 1]} de ${year} por empleado y departamento.`}
      />

      <form method="get" className="flex flex-wrap gap-2">
        <select name="month" defaultValue={month} className="field-control px-3 py-2 text-sm">
          {MONTH_NAMES.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="year"
          defaultValue={year}
          className="field-control w-24 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white">
          Ver informe
        </button>
      </form>

      {[...byDept.entries()].map(([dept, list]) => {
        const deptTotal = list.reduce((s, r) => s + r.total, 0);
        return (
          <section key={dept} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-navy/50">
              {dept} · {deptTotal.toFixed(1)} h
            </h2>
            <Card className="overflow-x-auto p-0">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-brand-navy/10 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Empleado</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2 tabular-nums">Total</th>
                    <th className="px-3 py-2 tabular-nums">Norm.</th>
                    <th className="px-3 py-2 tabular-nums">Extra</th>
                    <th className="px-3 py-2 tabular-nums">Noct.</th>
                    <th className="px-3 py-2">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id} className="border-b border-brand-navy/5">
                      <td className="px-3 py-2 font-medium text-brand-navy">{r.name}</td>
                      <td className="px-3 py-2 text-slate-500">{r.status}</td>
                      <td className="px-3 py-2 tabular-nums">{r.total.toFixed(1)}</td>
                      <td className="px-3 py-2 tabular-nums">{r.normal.toFixed(1)}</td>
                      <td className="px-3 py-2 tabular-nums">{r.overtime.toFixed(1)}</td>
                      <td className="px-3 py-2 tabular-nums">{r.night.toFixed(1)}</td>
                      <td className="px-3 py-2">
                        <a
                          href={`/api/timesheets/${r.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-blue hover:underline"
                        >
                          Descargar
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </section>
        );
      })}

      {rows.length === 0 && (
        <Card className="text-sm text-slate-500">No hay controles en este mes.</Card>
      )}
    </div>
  );
}
