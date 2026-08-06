"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Paperclip, Trash2, ChevronLeft, ChevronRight, Save, PenLine, Download, Wand2, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FieldSelect } from "@/components/ui/field-select";
import { TimeField } from "@/components/ui/time-field";
import { calculateDayHours, daysInMonth, sumDayHours } from "@/lib/timesheet-calc";
import { holidaysInMonth } from "@/lib/holidays";
import { SignatureModal } from "@/components/signature/signature-pad";
import {
  copyFromPreviousMonthAction,
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
  BORRADOR: "bg-brand-navy/8 text-slate-600",
  FIRMADO_EMPLEADO: "bg-amber-500/15 text-amber-800",
  FIRMADO_RESPONSABLE: "bg-emerald-500/15 text-emerald-800",
  RECHAZADO: "bg-red-500/15 text-red-800",
};

export function TimeSheetForm({
  timeSheetId,
  month,
  year,
  monthNames,
  status,
  notes: initialNotes,
  rejectionReason,
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
  rejectionReason?: string | null;
  entries: Entry[];
  attachments: Attachment[];
  employeeSignaturePath: string | null;
  responsableSignaturePath: string | null;
}) {
  const router = useRouter();
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

  const monthHolidays = useMemo(() => holidaysInMonth(month, year), [month, year]);

  const summary = useMemo(() => {
    let workedDays = 0;
    let freeDays = 0;
    for (const entry of entries) {
      if (entry.checkIn && entry.checkOut) workedDays += 1;
      else if (!entry.checkIn && !entry.checkOut) freeDays += 1;
    }
    return { workedDays, freeDays, holidayCount: monthHolidays.size };
  }, [entries, monthHolidays.size]);

  function handleCopyPreviousMonth() {
    if (
      !window.confirm(
        "¿Copiar las horas del mes anterior? Se sobrescribirán los días que coincidan."
      )
    ) {
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await copyFromPreviousMonthAction(month, year);
      if (result.ok && result.entries) {
        const byDay = new Map(result.entries.map((e) => [e.day, e]));
        setEntries((prev) =>
          prev.map((e) => {
            const copied = byDay.get(e.day);
            return copied ?? e;
          })
        );
        setMessage({ type: "success", text: "Horas copiadas del mes anterior." });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error ?? "Error al copiar." });
      }
    });
  }

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
    if (
      !window.confirm(
        `¿Aplicar turno ${SHIFTS[bulkShift].label} a ${weekdaysOnly ? "todos los días laborables" : "todo el mes"}? Se sobrescribirán las horas actuales.`
      )
    ) {
      return;
    }
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
      if (result.ok) {
        setMessage({ type: "success", text: "Borrador guardado." });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error ?? "Error al guardar." });
      }
    });
  }

  function handleUpload(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await uploadAttachmentAction(month, year, formData);
      if (result.ok) {
        setMessage({ type: "success", text: "Archivo adjuntado." });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error ?? "Error al subir el archivo." });
      }
    });
  }

  function handleDeleteAttachment(id: string) {
    if (!window.confirm("¿Eliminar este adjunto? Esta acción no se puede deshacer.")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteAttachmentAction(id);
      if (result.ok) {
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error ?? "Error al eliminar el adjunto." });
      }
    });
  }

  function handleSign(signatureDataUrl: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await signAsEmployeeAction(month, year, entries, notes, signatureDataUrl);
      if (result.ok) {
        setShowSignPad(false);
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error ?? "Error al firmar." });
      }
    });
  }

  const prev = month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
  const next = month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };

  const shiftOptions = [
    { value: "LIBRE", label: "Libre" },
    { value: "M", label: "Mañana" },
    { value: "T", label: "Tarde" },
    { value: "N", label: "Noche" },
  ];

  const bulkShiftOptions = (Object.keys(SHIFTS) as (keyof typeof SHIFTS)[]).map((key) => ({
    value: key,
    label: SHIFTS[key].label,
  }));

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        {/* Cabecera + resumen + herramientas en un solo bloque */}
        <div className="border-b border-brand-navy/10 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link
                href={`/control-horario?month=${prev.month}&year=${prev.year}`}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-navy/6 hover:text-brand-navy"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <span className="min-w-[10rem] text-center text-sm font-semibold text-brand-navy">
                {monthNames[month - 1]} de {year}
              </span>
              <Link
                href={`/control-horario?month=${next.month}&year=${next.year}`}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-brand-navy/6 hover:text-brand-navy"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {timeSheetId && (
                <a
                  href={`/api/timesheets/${timeSheetId}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-brand-navy/6"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </a>
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLOR[status]}`}>
                {STATUS_LABEL[status]}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Trabajados</p>
              <p className="text-lg font-semibold tabular-nums text-brand-navy">{summary.workedDays}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Libres</p>
              <p className="text-lg font-semibold tabular-nums text-brand-navy">{summary.freeDays}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Festivos</p>
              <p className="text-lg font-semibold tabular-nums text-amber-700">{summary.holidayCount}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Horas</p>
              <p className="text-lg font-semibold tabular-nums text-brand-navy">{totals.totalHours.toFixed(1)} h</p>
            </div>
          </div>

          {monthHolidays.size > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              {[...monthHolidays.entries()]
                .map(([day, name]) => (
                  <span key={day} className="mr-3 inline-flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {day} · {name}
                  </span>
                ))}
            </p>
          )}

          {editable && (
            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-brand-navy/8 pt-4">
              <div className="w-full min-w-[10rem] sm:w-52">
                <label htmlFor="bulk-shift" className="mb-1 block text-xs font-medium text-slate-500">
                  Turno a aplicar
                </label>
                <FieldSelect
                  id="bulk-shift"
                  value={bulkShift}
                  onChange={(v) => setBulkShift(v as keyof typeof SHIFTS)}
                  options={bulkShiftOptions}
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={weekdaysOnly}
                  onChange={(e) => setWeekdaysOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-brand-navy/25 text-brand-blue focus:ring-brand-blue"
                />
                Solo L–V
              </label>
              <button
                type="button"
                onClick={applyBulkShift}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue/10 px-3 py-2 text-sm font-medium text-brand-blue transition hover:bg-brand-blue/18"
              >
                <Wand2 className="h-4 w-4" />
                Aplicar
              </button>
              <button
                type="button"
                onClick={handleCopyPreviousMonth}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-navy/6 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                Copiar mes anterior
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-brand-navy/10 bg-brand-navy/[0.04] text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2.5">Día</th>
                <th className="px-3 py-2.5">Turno</th>
                <th className="px-3 py-2.5">Entrada</th>
                <th className="px-3 py-2.5">Salida</th>
                <th className="px-3 py-2.5">Total</th>
                <th className="px-3 py-2.5">Norm.</th>
                <th className="px-3 py-2.5">Extra</th>
                <th className="px-3 py-2.5">Noct.</th>
                <th className="px-3 py-2.5">Obs.</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const hours = calculateDayHours(entry.checkIn, entry.checkOut);
                const weekday = new Date(year, month - 1, entry.day).toLocaleDateString("es-ES", {
                  weekday: "short",
                });
                const isWeekend = [0, 6].includes(new Date(year, month - 1, entry.day).getDay());
                const holidayName = monthHolidays.get(entry.day);
                const shiftKey = shiftKeyForEntry(entry);
                const rowOptions =
                  shiftKey === ""
                    ? [{ value: "", label: "Personalizado" }, ...shiftOptions]
                    : shiftOptions;

                return (
                  <tr
                    key={entry.day}
                    className={`border-b border-brand-navy/5 last:border-0 ${
                      holidayName ? "row-holiday" : isWeekend ? "row-weekend" : ""
                    }`}
                  >
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className="font-medium text-brand-navy">{entry.day}</span>{" "}
                      <span className="text-xs text-slate-500">{weekday}</span>
                      {holidayName && (
                        <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                          {holidayName}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      <FieldSelect
                        disabled={!editable}
                        value={shiftKey}
                        onChange={(v) => applyShiftToEntry(entry.day, v as ShiftKey)}
                        options={rowOptions}
                        size="sm"
                        className="w-28"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <TimeField
                        disabled={!editable}
                        value={entry.checkIn}
                        onChange={(v) => updateEntry(entry.day, { checkIn: v })}
                        className="w-28"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <TimeField
                        disabled={!editable}
                        value={entry.checkOut}
                        onChange={(v) => updateEntry(entry.day, { checkOut: v })}
                        className="w-28"
                      />
                    </td>
                    <td className="px-3 py-1.5 tabular-nums text-slate-600">{hours.totalHours.toFixed(2)}</td>
                    <td className="px-3 py-1.5 tabular-nums text-slate-600">{hours.normalHours.toFixed(2)}</td>
                    <td className="px-3 py-1.5 tabular-nums text-slate-600">{hours.overtimeHours.toFixed(2)}</td>
                    <td className="px-3 py-1.5 tabular-nums text-slate-600">{hours.nightHours.toFixed(2)}</td>
                    <td className="px-3 py-1.5">
                      <input
                        type="text"
                        disabled={!editable}
                        value={entry.notes}
                        onChange={(e) => updateEntry(entry.day, { notes: e.target.value })}
                        className="field-control w-full min-w-[100px] px-2 py-1 text-sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-brand-navy/10 bg-brand-navy/[0.04] font-semibold text-brand-navy">
                <td className="px-3 py-2.5" colSpan={4}>
                  Totales
                </td>
                <td className="px-3 py-2.5 tabular-nums">{totals.totalHours.toFixed(2)}</td>
                <td className="px-3 py-2.5 tabular-nums">{totals.normalHours.toFixed(2)}</td>
                <td className="px-3 py-2.5 tabular-nums">{totals.overtimeHours.toFixed(2)}</td>
                <td className="px-3 py-2.5 tabular-nums">{totals.nightHours.toFixed(2)}</td>
                <td className="px-3 py-2.5" />
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="border-t border-brand-navy/10 px-4 py-4 sm:px-5">
          <label htmlFor="monthly-notes" className="block text-sm font-medium text-brand-navy">
            Notas del mes
          </label>
          <textarea
            id="monthly-notes"
            disabled={!editable}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="field-control mt-2 w-full resize-none px-3 py-2 text-sm"
          />
        </div>

        <div className="border-t border-brand-navy/10 px-4 py-4 sm:px-5">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-brand-navy">
            <Paperclip className="h-4 w-4" />
            Adjuntos (PDF/Excel)
          </p>

          {attachments.length > 0 && (
            <ul className="mb-3 divide-y divide-brand-navy/8">
              {attachments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2 first:pt-0">
                  <a
                    href={`/api/uploads/${a.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm text-brand-blue hover:underline"
                  >
                    {a.fileName}
                  </a>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAttachment(a.id)}
                      aria-label="Eliminar adjunto"
                      className="shrink-0 rounded p-1 text-slate-400 hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {editable && (
            <form action={handleUpload} className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                name="file"
                accept=".pdf,.xlsx,.xls"
                className="min-w-0 flex-1 text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-blue/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-blue"
              />
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-brand-blue/10 px-3 py-1.5 text-sm font-medium text-brand-blue hover:bg-brand-blue/18 disabled:opacity-50"
              >
                Subir
              </button>
            </form>
          )}
        </div>

        {(employeeSignaturePath || responsableSignaturePath) && (
          <div className="border-t border-brand-navy/10 px-4 py-4 sm:px-5">
            <p className="mb-3 text-sm font-medium text-brand-navy">Firmas</p>
            <div className="flex flex-wrap gap-6">
              {employeeSignaturePath && (
                <div>
                  <p className="mb-1 text-xs text-slate-500">Empleado</p>
                  <img
                    src={`/api/uploads/${employeeSignaturePath}`}
                    alt="Firma del empleado"
                    className="h-16 rounded-lg border border-brand-navy/10 bg-white/50 p-2"
                  />
                </div>
              )}
              {responsableSignaturePath && (
                <div>
                  <p className="mb-1 text-xs text-slate-500">Responsable</p>
                  <img
                    src={`/api/uploads/${responsableSignaturePath}`}
                    alt="Firma de la responsable"
                    className="h-16 rounded-lg border border-brand-navy/10 bg-white/50 p-2"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            message.type === "success"
              ? "bg-emerald-500/12 text-emerald-800"
              : "bg-red-500/12 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      {status === "RECHAZADO" && rejectionReason && (
        <div className="rounded-lg border border-red-200/80 bg-red-500/10 px-4 py-3 text-sm text-red-800">
          <p className="font-medium">Motivo del rechazo</p>
          <p className="mt-1 whitespace-pre-wrap">{rejectionReason}</p>
        </div>
      )}

      {editable && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-blue/30 bg-brand-blue/8 px-4 py-2 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue/14 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={() => setShowSignPad(true)}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue-dark disabled:opacity-50"
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
