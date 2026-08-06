"use client";

import { useState, useTransition } from "react";
import { CalendarClock, Trash2 } from "lucide-react";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { deleteScheduleAction, uploadScheduleAction } from "@/app/(app)/jefa/horarios/actions";

type Schedule = {
  id: string;
  fileName: string;
  filePath: string;
  createdAt: string;
  validFrom: string;
};

export function ScheduleUploadRow({
  departmentId,
  departmentName,
  schedule,
  history = [],
}: {
  departmentId: string;
  departmentName: string;
  schedule: Schedule | null;
  history?: Schedule[];
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [validFrom, setValidFrom] = useState(() => new Date().toISOString().slice(0, 10));

  function handleFile(file: File) {
    setMessage(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("validFrom", validFrom);
    startTransition(async () => {
      const result = await uploadScheduleAction(departmentId, formData);
      setMessage(
        result.ok
          ? { type: "success", text: "Horario subido. Se conserva el historial." }
          : { type: "error", text: result.error ?? "Error al subir el archivo." }
      );
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar esta versión del historial?")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteScheduleAction(id);
      if (!result.ok) setMessage({ type: "error", text: result.error ?? "Error al eliminar el horario." });
    });
  }

  return (
    <div className="space-y-3 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-4 w-4 text-brand-blue" />
          <div>
            <p className="font-medium text-brand-navy">{departmentName}</p>
            <p className="text-sm text-slate-500">Horario compartido del departamento</p>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          {schedule ? (
            <div className="text-sm">
              <a
                href={`/api/uploads/${schedule.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue hover:underline"
              >
                {schedule.fileName}
              </a>
              <p className="text-xs text-slate-500">
                Vigente desde {new Date(schedule.validFrom).toLocaleDateString("es-ES")}
              </p>
            </div>
          ) : (
            <span className="text-sm text-slate-500">Sin horario asignado</span>
          )}

          <input
            type="date"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className="field-control px-2 py-1.5 text-xs"
            title="Fecha de vigencia"
          />

          <FileDropzone
            accept=".pdf,.xlsx,.xls"
            disabled={pending}
            pending={pending}
            label={schedule ? "Subir nueva versión" : "Subir horario (PDF o Excel)"}
            onFile={handleFile}
            className="w-full sm:w-64"
          />
        </div>
      </div>

      {history.length > 1 && (
        <div className="border-t border-brand-navy/8 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Historial</p>
          <ul className="divide-y divide-brand-navy/8">
            {history.map((h, idx) => (
              <li key={h.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <a
                  href={`/api/uploads/${h.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-brand-blue hover:underline"
                >
                  {h.fileName}
                  {idx === 0 ? " (actual)" : ""}
                </a>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {new Date(h.validFrom).toLocaleDateString("es-ES")}
                  </span>
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(h.id)}
                      disabled={pending}
                      className="text-slate-400 hover:text-red-600"
                      aria-label="Eliminar versión"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && (
        <p className={`text-xs ${message.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
