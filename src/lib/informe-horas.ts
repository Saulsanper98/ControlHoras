import { prisma } from "@/lib/prisma";
import { calculateDayHours, sumDayHours } from "@/lib/timesheet-calc";

export type InformeFilters = {
  month: number;
  year: number;
  departmentId?: string;
  status?: string;
};

export type InformeRow = {
  id: string | null;
  userId: string;
  name: string;
  dept: string;
  departmentId: string | null;
  status: string;
  total: number;
  normal: number;
  overtime: number;
  night: number;
  hasSheet: boolean;
};

export async function buildInformeHoras(filters: InformeFilters) {
  const { month, year, departmentId, status } = filters;

  const [employees, sheets] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "EMPLEADO",
        active: true,
        ...(departmentId ? { departmentId } : {}),
      },
      include: { department: true },
      orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.timeSheet.findMany({
      where: {
        month,
        year,
        ...(departmentId ? { user: { departmentId } } : {}),
      },
      include: {
        entries: true,
      },
    }),
  ]);

  const sheetByUser = new Map(sheets.map((s) => [s.userId, s]));

  const rows: InformeRow[] = employees.map((e) => {
    const sheet = sheetByUser.get(e.id);
    if (!sheet) {
      return {
        id: null,
        userId: e.id,
        name: e.name,
        dept: e.department?.name ?? "—",
        departmentId: e.departmentId,
        status: "SIN_CONTROL",
        total: 0,
        normal: 0,
        overtime: 0,
        night: 0,
        hasSheet: false,
      };
    }
    const totals = sumDayHours(
      sheet.entries.map((entry) =>
        calculateDayHours(entry.checkIn ?? "", entry.checkOut ?? "")
      )
    );
    return {
      id: sheet.id,
      userId: e.id,
      name: e.name,
      dept: e.department?.name ?? "—",
      departmentId: e.departmentId,
      status: sheet.status,
      total: totals.totalHours,
      normal: totals.normalHours,
      overtime: totals.overtimeHours,
      night: totals.nightHours,
      hasSheet: true,
    };
  });

  const filtered = !status ? rows : rows.filter((r) => r.status === status);

  const byDept = new Map<string, InformeRow[]>();
  for (const row of filtered) {
    const list = byDept.get(row.dept) ?? [];
    list.push(row);
    byDept.set(row.dept, list);
  }

  const withHours = filtered.filter((r) => r.hasSheet);
  const summary = {
    employees: filtered.length,
    withSheet: withHours.length,
    missing: filtered.filter((r) => !r.hasSheet).length,
    pendingSign: filtered.filter((r) => r.status === "FIRMADO_EMPLEADO").length,
    drafts: filtered.filter((r) => r.status === "BORRADOR").length,
    signed: filtered.filter((r) => r.status === "FIRMADO_RESPONSABLE").length,
    rejected: filtered.filter((r) => r.status === "RECHAZADO").length,
    totalHours: withHours.reduce((s, r) => s + r.total, 0),
    normalHours: withHours.reduce((s, r) => s + r.normal, 0),
    overtimeHours: withHours.reduce((s, r) => s + r.overtime, 0),
    nightHours: withHours.reduce((s, r) => s + r.night, 0),
  };

  return { rows: filtered, byDept, summary };
}

export function informeToCsv(
  rows: InformeRow[],
  statusLabel: Record<string, string>
): string {
  const header = [
    "Empleado",
    "Departamento",
    "Estado",
    "Total",
    "Normales",
    "Extra",
    "Nocturnas",
  ];
  const lines = [
    header.join(";"),
    ...rows.map((r) =>
      [
        csvEscape(r.name),
        csvEscape(r.dept),
        csvEscape(statusLabel[r.status] ?? r.status),
        r.total.toFixed(2).replace(".", ","),
        r.normal.toFixed(2).replace(".", ","),
        r.overtime.toFixed(2).replace(".", ","),
        r.night.toFixed(2).replace(".", ","),
      ].join(";")
    ),
  ];
  return "\uFEFF" + lines.join("\n");
}

function csvEscape(value: string) {
  if (/[;"\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
