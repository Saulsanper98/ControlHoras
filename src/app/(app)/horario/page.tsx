import { CalendarClock, Download, FileWarning } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";

// Solo el PDF tiene un visor nativo en el navegador; Excel siempre se
// descarga porque no hay forma de previsualizarlo sin una librería extra.
const PREVIEWABLE_EXTENSIONS = [".pdf"];

export default async function HorarioPage() {
  const session = await auth();
  if (!session) return null;

  const departmentId = session.user.departmentId;
  const schedule = departmentId
    ? await prisma.schedule.findFirst({
        where: { departmentId },
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: true },
      })
    : null;

  const ext = schedule
    ? schedule.fileName.slice(schedule.fileName.lastIndexOf(".")).toLowerCase()
    : "";
  const canPreview = PREVIEWABLE_EXTENSIONS.includes(ext);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Mi horario</h1>
        <p className="text-slate-500">Consulta el horario de trabajo asignado por tu responsable.</p>
      </div>

      {schedule ? (
        <>
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-brand-blue/10 p-2 text-brand-blue">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-brand-navy">{schedule.fileName}</p>
                  <p className="text-sm text-slate-500">
                    Subido el {schedule.createdAt.toLocaleDateString("es-ES")} por {schedule.uploadedBy.name}
                  </p>
                </div>
              </div>
              <a
                href={`/api/uploads/${schedule.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark"
              >
                <Download className="h-4 w-4" />
                {canPreview ? "Abrir en pestaña nueva" : "Descargar"}
              </a>
            </div>
          </Card>

          {canPreview ? (
            <Card className="overflow-hidden p-0">
              <iframe
                src={`/api/uploads/${schedule.filePath}`}
                title="Horario asignado"
                className="h-[75vh] w-full"
              />
            </Card>
          ) : (
            <Card className="flex items-center gap-3 text-sm text-slate-500">
              <FileWarning className="h-5 w-5 shrink-0 text-slate-400" />
              Este archivo es un Excel y no se puede previsualizar aquí: descárgalo para abrirlo.
            </Card>
          )}
        </>
      ) : (
        <Card>
          <p className="text-sm text-slate-500">Todavía no se ha asignado ningún horario.</p>
        </Card>
      )}
    </div>
  );
}
