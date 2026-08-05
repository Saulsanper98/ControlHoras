"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Paperclip, Trash2, ChevronLeft, ChevronRight, Save, PenLine, Download, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { calculateDayHours, daysInMonth, sumDayHours } from "@/lib/timesheet-calc";
import { SignatureModal } from "@/components/signature/signature-pad";
import {
  deleteAttachmentAction,
  saveDraftAction,
  signAsEmployeeAction,
  uploadAttachmentAction,
} from "@/app/(app)/control-horario/actions";

type Entry = { day: number; checkIn: string; checkOut: string; notes: string };
type Attachment = { id: string; fileName: string; filePath: string };

// Turnos preestablecidos para rellenar entrada/salida con un clic. "N"
// (noche) cruza la medianoche; calculateDayHours ya soporta ese caso.
const SHIFTS: Record<"M" | "T" | "N", { label: string; checkIn: string; checkOut: string }> = {
  M: { label: "Mañana (06:00–14:00)", checkIn: "06:00", checkOut: "14:00" },
  T: { label: "Tarde (14:00–22:00)", checkIn: "14:00", checkOut: "22:00" },
  N: { label: "Noche (22:00–06:00)", checkIn: "22:00", checkOut: "06:00" },
};

type ShiftKey = "" | "LIBRE" | keyof typeof SHIFTS;

function shiftKeyForEntry(entry: Entry): ShiftKey {
  if (!entry.checkIn && !entry.checkOut) return "LIBRE";
  for (const key of Object.keys(SHIFTS) as (keyof typeof SHIFTS)[]) {
    const s = SHIFTS[key];
    if (entry.checkIn === s.checkIn && entry.checkOut === s.checkOut) return key;
  }
  return "";
}

const STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  FIRMADO_EMPLEADO: "Enviado, pendiente de la responsable",
  FIRMADO_RESPONSABLE: "Firmado y cerrado",
  RECHAZADO: "Rechazado, puedes corregirlo",
};

const STATUS_COLOR: Record<string, string> = {
  BORRADOR: "bg-slate-100 text-slate-600",
  FIRMADO_EMPLEADO: "bg-amber-100 text-amber-700",
  FIRMADO_RESPONSABLE: "bg-emerald-100 text-emerald-700",
  RECHAZADO: "bg-red-100 text-red-700",
};

export function TimeSheetForm({
  timeSheetId,
  month,
  year,
  monthNames,
  status,
  notes: initialNotes,
  entries: initialEntries,
  attachments,
  employeeSignaturePath,
  responsableSignaturePath,
}: {
  timeSheetId: string | null;
  month: number;
  year: number;
  monthNames: string[];
  status: string;
  notes: string;
  entries: Entry[];
  attachments: Attachment[];
  employeeSignaturePath: string | null;
  responsableSignaturePath: string | null;
}) {
  const editable = status === "BORRADOR" || status === "RECHAZADO";
  const days = daysInMonth(month, year);

  const [entries, setEntries] = useState<Entry[]>(() => {
    const byDay = new Map(initialEntries.map((e) => [e.day, e]));
    return Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      return byDay.get(day) ?? { day, checkIn: "", checkOut: "", notes: "" };
    });
  });
  const [notes, setNotes] = useState(initialNotes);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showSignPad, setShowSignPad] = useState(false);
  const [bulkShift, setBulkShift] = useState<keyof typeof SHIFTS>("M");
  const [weekdaysOnly, setWeekdaysOnly] = useState(true);

  const totals = useMemo(
    () => sumDayHours(entries.map((e) => calculateDayHours(e.checkIn, e.checkOut))),
    [entries]
  );

  function updateEntry(day: number, patch: Partial<Entry>) {
    setEntries((prev) => prev.map((e) => (e.day === day ? { ...e, ...patch } : e)));
  }

  function applyShiftToEntry(day: number, key: ShiftKey) {
    if (key === "LIBRE" || key === "") {
      updateEntry(day, { checkIn: "", checkOut: "" });
    } else {
      const s = SHIFTS[key];
      updateEntry(day, { checkIn: s.checkIn, checkOut: s.checkOut });
    }
  }

  function applyBulkShift() {
    setEntries((prev) =>
      prev.map((e) => {
        const isWeekend = [0, 6].includes(new Date(year, month - 1, e.day).getDay());
        if (weekdaysOnly && isWeekend) return e;
        const s = SHIFTS[bulkShift];
        return { ...e, checkIn: s.checkIn, checkOut: s.checkOut };
      })
    );
  }

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveDraftAction(month, year, entries, notes);
      setMessage(
        result.ok
          ? { type: "success", text: "Borrador guardado." }
          : { type: "error", text: result.error ?? "Error al guardar." }
      );
    });
  }

  function handleUpload(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await uploadAttachmentAction(month, year, formData);
      setMessage(
        result.ok
          ? { type: "success", text: "Archivo adjuntado." }
          : { type: "error", text: result.error ?? "Error al subir el archivo." }
      );
    });
  }

  function handleDeleteAttachment(id: string) {
    if (!window.confirm("¿Eliminar este adjunto? Esta acción no se puede deshacer.")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteAttachmentAction(id);
      if (!result.ok) setMessage({ type: "error", text: result.error ?? "Error al eliminar el adjunto." });
    });
  }

  function handleSign(signatureDataUrl: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await signAsEmployeeAction(month, year, entries, notes, signatureDataUrl);
      if (result.ok) {
        setShowSignPad(false);
      } else {
        setMessage({ type: "error", text: result.error ?? "Error al firmar." });
      }
    });
  }

  const prev = month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
  const next = month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };

  return (
    <div className="space-y-6">
      <Card className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-2">
          <Link
            href={`/control-horario?month=${prev.month}&year=${prev.year}`}
            className="rounded-lg border border-white/70 bg-white/40 p-2 text-slate-600 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] hover:bg-white/60"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-[10rem] text-center text-sm font-medium text-brand-navy">
            {monthNames[month - 1]} de {year}
          </span>
          <Link
            href={`/control-horario?month=${next.month}&year=${next.year}`}
            className="rounded-lg border border-white/70 bg-white/40 p-2 text-slate-600 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] hover:bg-white/60"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {timeSheetId && (
            <a
              href={`/api/timesheets/${timeSheetId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border border-white/70 bg-white/40 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] hover:bg-white/60"
            >
              <Download className="h-4 w-4" />
              Descargar PDF
            </a>
          )}
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>
      </Card>

      {message && (
        <p
          className={`rounded-md px-3 py-2 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      {editable && (
        <Card className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <label htmlFor="bulk-shift" className="mb-1 block text-xs font-medium text-slate-500">
              Turno a aplicar
            </label>
            <Select
              id="bulk-shift"
              value={bulkShift}
              onChange={(e) => setBulkShift(e.target.value as keyof typeof SHIFTS)}
            >
              {(Object.keys(SHIFTS) as (keyof typeof SHIFTS)[]).map((key) => (
                <option key={key} value={key}>
                  {SHIFTS[key].label}
                </option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={weekdaysOnly}
              onChange={(e) => setWeekdaysOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
            />
            Solo días laborables (L–V)
          </label>
          <button
            type="button"
            onClick={applyBulkShift}
            className="flex items-center gap-2 rounded-md border border-brand-blue px-3 py-1.5 text-sm font-medium text-brand-blue hover:bg-brand-blue/10"
          >
            <Wand2 className="h-4 w-4" />
            Aplicar turno a todo el mes
          </button>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-white/50 bg-white/35 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Día</th>
              <th className="px-3 py-2">Turno</th>
              <th className="px-3 py-2">Entrada</th>
              <th className="px-3 py-2">Salida</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Normales</th>
              <th className="px-3 py-2">Extra</th>
              <th className="px-3 py-2">Nocturnas</th>
              <th className="px-3 py-2">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const hours = calculateDayHours(entry.checkIn, entry.checkOut);
              const weekday = new Date(year, month - 1, entry.day).toLocaleDateString("es-ES", {
                weekday: "short",
              });
              const isWeekend = [0, 6].includes(new Date(year, month - 1, entry.day).getDay());
              const shiftKey = shiftKeyForEntry(entry);
              return (
                <tr
                  key={entry.day}
                  className={`border-b border-white/40 last:border-0 ${isWeekend ? "bg-brand-navy/[0.04]" : ""}`}
                >
                  <td className="px-3 py-1.5 whitespace-nowrap text-slate-600">
                    {entry.day} <span className="text-xs text-slate-500">{weekday}</span>
                  </td>
                  <td className="px-3 py-1.5">
                    <Select
                      disabled={!editable}
                      value={shiftKey}
                      onChange={(e) => applyShiftToEntry(entry.day, e.target.value as ShiftKey)}
                      className="w-32"
                    >
                      {shiftKey === "" && <option value="">Personalizado</option>}
                      <option value="LIBRE">Libre</option>
                      <option value="M">Mañana</option>
                      <option value="T">Tarde</option>
                      <option value="N">Noche</option>
                    </Select>
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="time"
                      disabled={!editable}
                      value={entry.checkIn}
                      onChange={(e) => updateEntry(entry.day, { checkIn: e.target.value })}
                      className="w-28 rounded-md border border-white/70 bg-white/55 px-2 py-1 text-sm shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] disabled:bg-white/30 disabled:text-slate-400"
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <input
                      type="time"
                      disabled={!editable}
                      value={entry.checkOut}
                      onChange={(e) => updateEntry(entry.day, { checkOut: e.target.value })}
                      className="w-28 rounded-md border border-white/70 bg-white/55 px-2 py-1 text-sm shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] disabled:bg-white/30 disabled:text-slate-400"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-slate-600">{hours.totalHours.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-slate-600">{hours.normalHours.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-slate-600">{hours.overtimeHours.toFixed(2)}</td>
                  <td className="px-3 py-1.5 text-slate-600">{hours.nightHours.toFixed(2)}</td>
                  <td className="px-3 py-1.5">
                    <input
                      type="text"
                      disabled={!editable}
                      value={entry.notes}
                      onChange={(e) => updateEntry(entry.day, { notes: e.target.value })}
                      className="w-full min-w-[120px] rounded-md border border-white/70 bg-white/55 px-2 py-1 text-sm shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] disabled:bg-white/30 disabled:text-slate-400"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-white/40 font-semibold text-brand-navy">
              <td className="px-3 py-2" colSpan={4}>
                Totales
              </td>
              <td className="px-3 py-2">{totals.totalHours.toFixed(2)}</td>
              <td className="px-3 py-2">{totals.normalHours.toFixed(2)}</td>
              <td className="px-3 py-2">{totals.overtimeHours.toFixed(2)}</td>
              <td className="px-3 py-2">{totals.nightHours.toFixed(2)}</td>
              <td className="px-3 py-2"></td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <Card>
        <label htmlFor="monthly-notes" className="block text-sm font-medium text-brand-navy">
          Notas del mes
        </label>
        <textarea
          id="monthly-notes"
          disabled={!editable}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border border-white/70 bg-white/55 px-3 py-2 text-sm shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] disabled:bg-white/30 disabled:text-slate-400"
        />
      </Card>

      <Card>
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-brand-navy">
          <Paperclip className="h-4 w-4" />
          Adjuntar control horario en PDF/Excel (alternativa al formulario)
        </p>

        <div className="space-y-2">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between rounded-md border border-white/60 bg-white/40 px-3 py-2 text-sm"
            >
              <a
                href={`/api/uploads/${a.filePath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-blue hover:underline"
              >
                {a.fileName}
              </a>
              {editable && (
                <button
                  type="button"
                  onClick={() => handleDeleteAttachment(a.id)}
                  aria-label="Eliminar adjunto"
                  className="text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {editable && (
          <form
            action={handleUpload}
            className="mt-3 flex items-center gap-2"
          >
            <input
              type="file"
              name="file"
              accept=".pdf,.xlsx,.xls"
              className="flex-1 text-sm text-slate-500"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-md border border-brand-blue px-3 py-1.5 text-sm font-medium text-brand-blue hover:bg-brand-blue/10 disabled:opacity-60"
            >
              Subir
            </button>
          </form>
        )}
      </Card>

      {(employeeSignaturePath || responsableSignaturePath) && (
        <Card>
          <p className="mb-3 text-sm font-medium text-brand-navy">Firmas</p>
          <div className="flex flex-wrap gap-6">
            {employeeSignaturePath && (
              <div>
                <p className="mb-1 text-xs text-slate-500">Empleado</p>
                <img
                  src={`/api/uploads/${employeeSignaturePath}`}
                  alt="Firma del empleado"
                  className="h-16 rounded-md border border-white/60 bg-white/50 p-2"
                />
              </div>
            )}
            {responsableSignaturePath && (
              <div>
                <p className="mb-1 text-xs text-slate-500">Responsable</p>
                <img
                  src={`/api/uploads/${responsableSignaturePath}`}
                  alt="Firma de la responsable"
                  className="h-16 rounded-md border border-white/60 bg-white/50 p-2"
                />
              </div>
            )}
          </div>
        </Card>
      )}

      {editable && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="flex items-center gap-2 rounded-md border border-white/70 bg-white/45 px-4 py-2 text-sm font-semibold text-brand-blue shadow-[0_1px_0_rgba(255,255,255,0.7)_inset] hover:bg-white/60 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={() => setShowSignPad(true)}
            disabled={pending}
            className="flex items-center gap-2 rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark disabled:opacity-60"
          >
            <PenLine className="h-4 w-4" />
            Firmar y enviar
          </button>
        </div>
      )}

      {showSignPad && (
        <SignatureModal
          title="Firma tu control horario"
          pending={pending}
          onCancel={() => setShowSignPad(false)}
          onConfirm={handleSign}
        />
      )}
    </div>
  );
}
