import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireEmployeeSession } from "@/lib/auth-helpers";
import { TimeSheetForm } from "@/components/control-horario/timesheet-form";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export default async function ControlHorarioPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await requireEmployeeSession();
  if (!session) redirect("/");

  const now = new Date();
  const params = await searchParams;
  const month = Number(params.month) || now.getMonth() + 1;
  const year = Number(params.year) || now.getFullYear();

  const timeSheet = await prisma.timeSheet.findUnique({
    where: { userId_month_year: { userId: session.user.id, month, year } },
    include: {
      entries: { orderBy: { day: "asc" } },
      attachments: { orderBy: { uploadedAt: "desc" } },
      signatures: true,
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Control horario</h1>
        <p className="text-brand-navy/55">
          {MONTH_NAMES[month - 1]} de {year}
        </p>
      </div>

      <TimeSheetForm
        timeSheetId={timeSheet?.id ?? null}
        month={month}
        year={year}
        monthNames={MONTH_NAMES}
        status={timeSheet?.status ?? "BORRADOR"}
        notes={timeSheet?.notes ?? ""}
        entries={
          timeSheet?.entries.map((e) => ({
            day: e.day,
            checkIn: e.checkIn ?? "",
            checkOut: e.checkOut ?? "",
            notes: e.notes ?? "",
          })) ?? []
        }
        attachments={
          timeSheet?.attachments.map((a) => ({
            id: a.id,
            fileName: a.fileName,
            filePath: a.filePath,
          })) ?? []
        }
        employeeSignaturePath={
          timeSheet?.signatures.find((s) => s.signerRole === "EMPLEADO")?.imagePath ?? null
        }
        responsableSignaturePath={
          timeSheet?.signatures.find((s) => s.signerRole === "RESPONSABLE")?.imagePath ?? null
        }
      />
    </div>
  );
}
