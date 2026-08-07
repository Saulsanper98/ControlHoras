import { notFound, redirect } from "next/navigation";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TimeSheetGrid } from "@/components/control-horario/timesheet-grid";
import { ReviewActions } from "@/components/jefa/review-actions";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { BackLink } from "@/components/ui/back-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScrollShadow } from "@/components/ui/scroll-shadow";
import { SignaturePreview } from "@/components/ui/signature-preview";
import { requireManagerSession } from "@/lib/auth-helpers";
import { formatDateTimeShort } from "@/lib/format-date";
import { sumDayHours } from "@/lib/timesheet-calc";

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

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

  const gridEntries = timeSheet.entries.map((e) => ({
    day: e.day,
    checkIn: e.checkIn,
    checkOut: e.checkOut,
    totalHours: Number(e.totalHours),
    normalHours: Number(e.normalHours),
    overtimeHours: Number(e.overtimeHours),
    nightHours: Number(e.nightHours),
    notes: e.notes,
  }));

  const monthTotals =
    gridEntries.length > 0
      ? sumDayHours(
          gridEntries.map((e) => ({
            totalHours: e.totalHours,
            normalHours: e.normalHours,
            overtimeHours: e.overtimeHours,
            nightHours: e.nightHours,
          }))
        )
      : null;

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/jefa/controles">Volver a controles</BackLink>
        <PageHeader
          title={timeSheet.user.name}
          description={`${timeSheet.user.department?.name ?? "—"} · ${MONTH_NAMES[timeSheet.month - 1]} de ${timeSheet.year}`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={timeSheet.status} />
            <a
              href={`/api/timesheets/${timeSheet.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </a>
          </div>
        </PageHeader>
      </div>

      {monthTotals && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Total</p>
            <p className="text-lg font-semibold tabular-nums text-brand-navy">
              {monthTotals.totalHours.toFixed(1)} h
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Normales</p>
            <p className="text-lg font-semibold tabular-nums text-brand-navy">
              {monthTotals.normalHours.toFixed(1)} h
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Extra</p>
            <p className="text-lg font-semibold tabular-nums text-brand-navy">
              {monthTotals.overtimeHours.toFixed(1)} h
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Nocturnas</p>
            <p className="text-lg font-semibold tabular-nums text-brand-navy">
              {monthTotals.nightHours.toFixed(1)} h
            </p>
          </div>
        </div>
      )}

      <ScrollShadow>
        <TimeSheetGrid
          month={timeSheet.month}
          year={timeSheet.year}
          entries={gridEntries}
        />
      </ScrollShadow>

      {timeSheet.notes && (
        <p className="border-y border-brand-navy/10 py-3 text-sm text-slate-600">
          <span className="font-medium">Notas del empleado: </span>
          {timeSheet.notes}
        </p>
      )}

      {timeSheet.rejectionReason && (
        <Alert variant="danger" title="Motivo del rechazo">
          <p>{timeSheet.rejectionReason}</p>
        </Alert>
      )}

      {timeSheet.attachments.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-brand-navy">Archivos adjuntos</p>
          <div className="divide-y divide-brand-navy/10 border-y border-brand-navy/10">
            {timeSheet.attachments.map((a) => (
              <a
                key={a.id}
                href={`/api/uploads/${a.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-3 text-sm text-brand-blue transition hover:bg-brand-navy/[0.03] hover:underline"
              >
                {a.fileName}
              </a>
            ))}
          </div>
        </div>
      )}

      {(employeeSignature || responsableSignature) && (
        <div className="flex flex-wrap gap-6">
          {employeeSignature && (
            <SignaturePreview
              label="Firma del empleado"
              signedAt={
                employeeSignature.signedAt
                  ? formatDateTimeShort(employeeSignature.signedAt)
                  : null
              }
              src={`/api/uploads/${employeeSignature.imagePath}`}
              alt="Firma del empleado"
            />
          )}
          {responsableSignature && (
            <SignaturePreview
              label="Firma de la responsable"
              signedAt={
                responsableSignature.signedAt
                  ? formatDateTimeShort(responsableSignature.signedAt)
                  : null
              }
              src={`/api/uploads/${responsableSignature.imagePath}`}
              alt="Firma de la responsable"
            />
          )}
        </div>
      )}

      {timeSheet.status === "FIRMADO_EMPLEADO" && <ReviewActions timeSheetId={timeSheet.id} />}
    </div>
  );
}
