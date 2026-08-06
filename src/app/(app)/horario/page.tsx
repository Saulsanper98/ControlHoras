import { redirect } from "next/navigation";
import { CalendarClock, Download, ExternalLink, FileSpreadsheet, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionBlock } from "@/components/ui/list-surface";
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
          <a
            href={fileHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-dark"
          >
            {canPreview ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            {canPreview ? "Abrir PDF" : "Descargar"}
          </a>
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
                    {isNew && (
                      <span className="rounded-full bg-brand-blue/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-blue">
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
                  {schedule.validFrom.toLocaleDateString("es-ES", {
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
                  {schedule.createdAt.toLocaleDateString("es-ES", {
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
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-navy/45">
                  Vista previa
                </h2>
                <a
                  href={fileHref!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-blue hover:underline"
                >
                  Abrir en pestaña nueva
                </a>
              </div>
              <div className="overflow-hidden border-y border-[color:var(--surface-divider)] bg-brand-navy/[0.03]">
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
