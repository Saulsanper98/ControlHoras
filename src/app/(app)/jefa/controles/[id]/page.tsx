import { notFound, redirect } from "next/navigation";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { TimeSheetGridSection } from "@/components/jefa/timesheet-grid-section";
import { ReviewActions } from "@/components/jefa/review-actions";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { BackLink } from "@/components/ui/back-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScrollShadow } from "@/components/ui/scroll-shadow";
import { Stagger } from "@/components/ui/stagger";
import { SignaturePreview } from "@/components/ui/signature-preview";
import { requireManagerSession } from "@/lib/auth-helpers";
import { formatDateTimeShort, MONTH_NAMES_ES } from "@/lib/format-date";

export default async function ControlDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string; year?: string; department?: string }>;
}) {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const { id } = await params;
  const sp = await searchParams;

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

  const backQuery = new URLSearchParams();
  if (sp.month ?? timeSheet.month) backQuery.set("month", String(sp.month ?? timeSheet.month));
  if (sp.year ?? timeSheet.year) backQuery.set("year", String(sp.year ?? timeSheet.year));
  if (sp.department) backQuery.set("department", sp.department);
  const backHref = backQuery.toString()
    ? `/jefa/controles?${backQuery.toString()}`
    : "/jefa/controles";

  return (
    <div className="space-y-6">
      <Stagger>
        <div>
          <BackLink href={backHref}>Volver a controles</BackLink>
          <PageHeader
            title={timeSheet.user.name}
            description={`${timeSheet.user.department?.name ?? "—"} · ${MONTH_NAMES_ES[timeSheet.month - 1]} de ${timeSheet.year}`}
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
      </Stagger>

      <ScrollShadow>
        <TimeSheetGridSection
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
