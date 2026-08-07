"use client";

import { useState, useTransition } from "react";
import { FileText, Trash2 } from "lucide-react";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { DateField } from "@/components/ui/date-field";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/format-date";
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
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [validFrom, setValidFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [showHistory, setShowHistory] = useState(false);

  function handleFile(file: File) {
    setMessage(null);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("validFrom", validFrom);
    startTransition(async () => {
      const result = await uploadScheduleAction(departmentId, formData);
      if (result.ok) {
        showToast("Horario subido. Se conserva el historial.");
        setMessage({ type: "success", text: "Horario subido. Se conserva el historial." });
      } else {
        showToast(result.error ?? "Error al subir el archivo.", "error");
        setMessage({ type: "error", text: result.error ?? "Error al subir el archivo." });
      }
    });
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: "Eliminar versión",
      message: "¿Eliminar esta versión del historial? Esta acción no se puede deshacer.",
      variant: "danger",
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteScheduleAction(id);
      if (result.ok) {
        showToast("Versión eliminada.");
      } else {
        showToast(result.error ?? "Error al eliminar el horario.", "error");
        setMessage({ type: "error", text: result.error ?? "Error al eliminar el horario." });
      }
    });
  }

  return (
    <div className="space-y-4 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-brand-navy">{departmentName}</p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                schedule
                  ? "bg-emerald-500/12 text-emerald-800"
                  : "bg-amber-500/12 text-amber-800"
              }`}
            >
              {schedule ? "Con horario" : "Sin horario"}
            </span>
          </div>
          {schedule ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <a
                href={`/api/uploads/${schedule.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 truncate font-medium text-brand-blue hover:underline"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{schedule.fileName}</span>
              </a>
              <span className="text-slate-500">
                Vigente desde{" "}
                <span className="tabular-nums text-brand-navy/80">
                  {formatDate(schedule.validFrom)}
                </span>
              </span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500">
              Aún no hay cuadrante publicado para este departamento.
            </p>
          )}
        </div>

        {history.length > 1 && (
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="btn-ghost text-xs"
          >
            {showHistory ? "Ocultar historial" : `Historial (${history.length})`}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-[color:var(--surface-divider)] pt-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-44">
          <DateField
            id={`valid-from-${departmentId}`}
            label="Vigente desde"
            value={validFrom}
            onChange={setValidFrom}
          />
        </div>
        <FileDropzone
          accept=".pdf,.xlsx,.xls"
          disabled={pending}
          pending={pending}
          label={schedule ? "Subir nueva versión" : "Subir horario (PDF o Excel)"}
          onFile={handleFile}
          className="w-full flex-1"
        />
      </div>

      {showHistory && history.length > 1 && (
        <ul className="divide-y divide-[color:var(--surface-divider)] border-t border-[color:var(--surface-divider)]">
          {history.map((h, idx) => (
            <li key={h.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <a
                  href={`/api/uploads/${h.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-brand-blue hover:underline"
                >
                  {h.fileName}
                  {idx === 0 ? " · actual" : ""}
                </a>
                <p className="text-xs text-slate-500">
                  Vigente {formatDate(h.validFrom)}
                </p>
              </div>
              {idx > 0 && (
                <button
                  type="button"
                  onClick={() => void handleDelete(h.id)}
                  disabled={pending}
                  className="hit-area inline-flex items-center justify-center rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-600"
                  aria-label="Eliminar versión"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
