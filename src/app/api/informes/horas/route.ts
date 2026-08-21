import { NextRequest, NextResponse } from "next/server";
import { requireManagerSession } from "@/lib/auth-helpers";
import { buildInformeHoras, informeToCsv } from "@/lib/informe-horas";
import { TIMESHEET_STATUS_LABEL } from "@/lib/labels";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export async function GET(req: NextRequest) {
  const session = await requireManagerSession();
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const { searchParams } = req.url ? new URL(req.url) : { searchParams: new URLSearchParams() };
  const now = new Date();
  const month = Number(searchParams.get("month")) || now.getMonth() + 1;
  const year = Number(searchParams.get("year")) || now.getFullYear();
  const departmentId = searchParams.get("department") || undefined;
  const status = searchParams.get("status") || undefined;

  const { rows } = await buildInformeHoras({ month, year, departmentId, status });
  const csv = informeToCsv(rows, TIMESHEET_STATUS_LABEL);
  const filename = `informe-horas-${MONTH_NAMES[month - 1]}-${year}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
