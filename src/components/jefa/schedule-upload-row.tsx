"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { deleteScheduleAction, uploadScheduleAction } from "@/app/(app)/jefa/horarios/actions";

type Schedule = { id: string; fileName: string; filePath: string; createdAt: string };

export function ScheduleUploadRow({
  userId,
  name,
  departmentName,
  schedule,
}: {
  userId: string;
  name: string;
  departmentName: string;
  schedule: Schedule | null;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleFile(file: File) {
    setMessage(null);
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadScheduleAction(userId, formData);
      setMessage(result.ok ? "Horario subido." : result.error ?? "Error al subir el archivo.");
    });
  }

  function handleDelete() {
    if (!schedule) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteScheduleAction(schedule.id);
      if (!result.ok) setMessage(result.error ?? "Error al eliminar el horario.");
    });
  }

  return (
    <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <CalendarClock className="h-5 w-5 text-brand-blue" />
        <div>
          <p className="font-medium text-brand-navy">{name}</p>
          <p className="text-sm text-slate-500">{departmentName}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
        {schedule ? (
          <div className="flex items-center gap-2 text-sm">
            <a
              href={`/api/uploads/${schedule.filePath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-blue hover:underline"
            >
              {schedule.fileName}
            </a>
            <span className="text-xs text-slate-400">
              {new Date(schedule.createdAt).toLocaleDateString("es-ES")}
            </span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="text-slate-400 hover:text-red-600 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="text-sm text-slate-400">Sin horario asignado</span>
        )}

        <FileDropzone
          accept=".pdf,.xlsx,.xls"
          disabled={pending}
          pending={pending}
          label={schedule ? "Reemplazar horario" : "Subir horario (PDF o Excel)"}
          onFile={handleFile}
          className="w-full sm:w-64"
        />
      </div>

      {message && <p className="w-full text-xs text-brand-blue sm:w-auto">{message}</p>}
    </Card>
  );
}
