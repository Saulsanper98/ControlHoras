import { redirect } from "next/navigation";
import { CalendarClock, Download, ExternalLink, FileSpreadsheet, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionBlock } from "@/components/ui/list-surface";
import { SectionTitle } from "@/components/ui/section-title";
import { formatDate } from "@/lib/format-date";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { requireEmployeeSession } from "@/lib/auth-helpers";

const PREVIEWABLE_EXTENSIONS = [".pdf"];

export default async function HorarioPage() {
  const session = await requireEmployeeSession();
  if (!session) redirect("/");

  const departmentId = session.user.departmentId;
  const departmentName = session.user.departmentName;

  const schedule = departmentId
    ? await prisma.schedule.findFirst({
        where: { departmentId },
        orderBy: [{ validFrom: "desc" }, { createdAt: "desc" }],
        include: { uploadedBy: true },
      })
    : null;

  const ext = schedule
    ? schedule.fileName.slice(schedule.fileName.lastIndexOf(".")).toLowerCase()
    : "";
  const canPreview = PREVIEWABLE_EXTENSIONS.includes(ext);
  const isExcel = [".xlsx", ".xls"].includes(ext);
  const isNew =
    schedule != null && Date.now() - schedule.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;
  const fileHref = schedule ? `/api/uploads/${schedule.filePath}` : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mi horario"
        description={
          departmentName
            ? `Horario del departamento ${departmentName}.`
            : "Consulta el horario de trabajo asignado por tu responsable."
        }
      >
        {fileHref && (
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={fileHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              {canPreview ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
              {canPreview ? "Abrir PDF" : "Descargar"}
            </a>
            {canPreview && (
              <a
                href={fileHref}
                download={schedule?.fileName}
                className="btn-ghost text-sm"
              >
                <Download className="h-4 w-4" />
                Descargar
              </a>
            )}
          </div>
        )}
      </PageHeader>

      {!schedule ? (
        <EmptyState
          icon={CalendarClock}
          title="Todavía no hay horario"
          description="Cuando tu responsable suba el cuadrante del departamento, aparecerá aquí."
        />
      ) : (
        <>
          <SectionBlock>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                {isExcel ? (
                  <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                ) : (
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-brand-navy">{schedule.fileName}</p>
                    <span className="rounded-md bg-emerald-500/12 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Horario vigente
                    </span>
                    {isNew && (
                      <span className="rounded-md bg-brand-blue/12 px-2 py-0.5 text-xs font-semibold text-brand-blue">
                        Nuevo
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {isExcel ? "Excel" : canPreview ? "PDF" : "Archivo"} · subido{" "}
                    {formatRelativeTime(schedule.createdAt)} por {schedule.uploadedBy.name}
                  </p>
                </div>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-4 border-t border-[color:var(--surface-divider)] pt-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Departamento
                </dt>
                <dd className="mt-1 text-sm font-medium text-brand-navy">
                  {departmentName ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Vigente desde
                </dt>
                <dd className="mt-1 text-sm font-medium tabular-nums text-brand-navy">
                  {formatDate(schedule.validFrom, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Publicado
                </dt>
                <dd className="mt-1 text-sm font-medium tabular-nums text-brand-navy">
                  {formatDate(schedule.createdAt, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </SectionBlock>

          {canPreview ? (
            <section>
              <SectionTitle className="mb-3 uppercase tracking-wide text-brand-navy/45">
                Vista previa
              </SectionTitle>
              <div className="mx-auto max-w-4xl overflow-hidden border-y border-[color:var(--surface-divider)] bg-brand-navy/[0.03]">
                <iframe
                  src={fileHref!}
                  title="Horario asignado"
                  className="h-[min(75vh,52rem)] w-full"
                />
              </div>
            </section>
          ) : (
            <p className="flex items-start gap-3 border-y border-[color:var(--surface-divider)] py-5 text-sm text-slate-600">
              <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-brand-blue" />
              <span>
                Este archivo es un Excel y no se puede previsualizar en el navegador. Usa{" "}
                <strong className="font-semibold text-brand-navy">Descargar</strong> para abrirlo
                en tu equipo.
              </span>
            </p>
          )}
        </>
      )}
    </div>
  );
}
