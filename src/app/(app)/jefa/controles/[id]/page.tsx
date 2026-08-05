import { notFound, redirect } from "next/navigation";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TimeSheetGrid } from "@/components/control-horario/timesheet-grid";
import { ReviewActions } from "@/components/jefa/review-actions";
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

export default async function ControlDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const { id } = await params;

  const timeSheet = await prisma.timeSheet.findUnique({
    where: { id },
    include: {
      user: { include: { department: true } },
      entries: { orderBy: { day: "asc" } },
      attachments: { orderBy: { uploadedAt: "desc" } },
      signatures: true,
    },
  });

  if (!timeSheet) notFound();

  const employeeSignature = timeSheet.signatures.find((s) => s.signerRole === "EMPLEADO");
  const responsableSignature = timeSheet.signatures.find((s) => s.signerRole === "RESPONSABLE");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-brand-navy">{timeSheet.user.name}</h1>
          <p className="text-slate-500">
            {timeSheet.user.department?.name ?? "—"} · {MONTH_NAMES[timeSheet.month - 1]} de{" "}
            {timeSheet.year} · {STATUS_LABEL[timeSheet.status]}
          </p>
        </div>
        <a
          href={`/api/timesheets/${timeSheet.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-2 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <Download className="h-4 w-4" />
          Descargar PDF
        </a>
      </div>

      <TimeSheetGrid
        month={timeSheet.month}
        year={timeSheet.year}
        entries={timeSheet.entries.map((e) => ({
          day: e.day,
          checkIn: e.checkIn,
          checkOut: e.checkOut,
          totalHours: Number(e.totalHours),
          normalHours: Number(e.normalHours),
          overtimeHours: Number(e.overtimeHours),
          nightHours: Number(e.nightHours),
          notes: e.notes,
        }))}
      />

      {timeSheet.notes && (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span className="font-medium">Notas: </span>
          {timeSheet.notes}
        </p>
      )}

      {timeSheet.attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-brand-navy">Archivos adjuntos</p>
          {timeSheet.attachments.map((a) => (
            <a
              key={a.id}
              href={`/api/uploads/${a.filePath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-md border border-slate-200 px-3 py-2 text-sm text-brand-blue hover:underline"
            >
              {a.fileName}
            </a>
          ))}
        </div>
      )}

      {(employeeSignature || responsableSignature) && (
        <div className="flex flex-wrap gap-6">
          {employeeSignature && (
            <div>
              <p className="mb-1 text-xs text-slate-500">Firma del empleado</p>
              <img
                src={`/api/uploads/${employeeSignature.imagePath}`}
                alt="Firma del empleado"
                className="h-16 rounded-md border border-slate-200 bg-white p-2"
              />
            </div>
          )}
          {responsableSignature && (
            <div>
              <p className="mb-1 text-xs text-slate-500">Firma de la responsable</p>
              <img
                src={`/api/uploads/${responsableSignature.imagePath}`}
                alt="Firma de la responsable"
                className="h-16 rounded-md border border-slate-200 bg-white p-2"
              />
            </div>
          )}
        </div>
      )}

      {timeSheet.status === "FIRMADO_EMPLEADO" && <ReviewActions timeSheetId={timeSheet.id} />}
    </div>
  );
}
