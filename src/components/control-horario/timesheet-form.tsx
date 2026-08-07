"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Paperclip,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Save,
  PenLine,
  Download,
  Wand2,
  Copy,
  Loader2,
} from "lucide-react";
import { FieldSelect } from "@/components/ui/field-select";
import { TimeField } from "@/components/ui/time-field";
import { ScrollShadow } from "@/components/ui/scroll-shadow";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Alert } from "@/components/ui/alert";
import { InlineEmpty } from "@/components/ui/inline-empty";
import { SignaturePreview } from "@/components/ui/signature-preview";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDensity } from "@/lib/density";
import { TimeSheetMobileDays } from "@/components/control-horario/timesheet-mobile";
import { calculateDayHours, daysInMonth, sumDayHours } from "@/lib/timesheet-calc";
import { holidaysInMonth } from "@/lib/holidays";
import { formatDateTimeShort, formatWeekdayShort } from "@/lib/format-date";
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
  employeeSignedAt,
  responsableSignedAt,
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
  employeeSignedAt?: string | null;
  responsableSignedAt?: string | null;
}) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { tableCell } = useDensity();
  const editable = status === "BORRADOR" || status === "RECHAZADO";
  const days = daysInMonth(month, year);
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const todayDay = isCurrentMonth ? now.getDate() : null;

  const initialSnapshot = useRef(
    JSON.stringify({ entries: initialEntries, notes: initialNotes })
  );

  const [entries, setEntries] = useState<Entry[]>(() => {
    const byDay = new Map(initialEntries.map((e) => [e.day, e]));
    return Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      return byDay.get(day) ?? { day, checkIn: "", checkOut: "", notes: "" };
    });
  });
  const [notes, setNotes] = useState(initialNotes);
  const [pending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"save" | "sign" | null>(null);
  const [showSignPad, setShowSignPad] = useState(false);
  const [bulkShift, setBulkShift] = useState<keyof typeof SHIFTS>("M");
  const [weekdaysOnly, setWeekdaysOnly] = useState(true);
  const [filter, setFilter] = useState<"all" | "filled" | "empty">("all");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [uploadPending, setUploadPending] = useState(false);

  const isDirty = useMemo(
    () => JSON.stringify({ entries, notes }) !== initialSnapshot.current,
    [entries, notes]
  );

  useEffect(() => {
    if (!isDirty || !editable) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, editable]);

  const totals = useMemo(
    () => sumDayHours(entries.map((e) => calculateDayHours(e.checkIn, e.checkOut))),
    [entries]
  );

  const monthHolidays = useMemo(() => holidaysInMonth(month, year), [month, year]);

  const summary = useMemo(() => {
    let workedDays = 0;
    let freeDays = 0;
    let incompleteDays = 0;
    for (const entry of entries) {
      const hasIn = Boolean(entry.checkIn);
      const hasOut = Boolean(entry.checkOut);
      if (hasIn && hasOut) workedDays += 1;
      else if (!hasIn && !hasOut) freeDays += 1;
      else if (hasIn !== hasOut) incompleteDays += 1;
    }
    return { workedDays, freeDays, incompleteDays, holidayCount: monthHolidays.size };
  }, [entries, monthHolidays.size]);

  const filteredEntries = useMemo(() => {
    if (filter === "filled") return entries.filter((e) => e.checkIn && e.checkOut);
    if (filter === "empty") return entries.filter((e) => !e.checkIn && !e.checkOut);
    return entries;
  }, [entries, filter]);

  function handleCopyPreviousMonth() {
    void (async () => {
      const ok = await confirm({
        title: "Copiar mes anterior",
        message: "¿Copiar las horas del mes anterior? Se sobrescribirán los días que coincidan.",
      });
      if (!ok) return;
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
          showToast("Horas copiadas del mes anterior.");
          router.refresh();
        } else {
          showToast(result.error ?? "Error al copiar.", "error");
        }
      });
    })();
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
    void (async () => {
      const ok = await confirm({
        title: "Aplicar turno",
        message: `¿Aplicar turno ${SHIFTS[bulkShift].label} a ${weekdaysOnly ? "todos los días laborables" : "todo el mes"}? Se sobrescribirán las horas actuales.`,
      });
      if (!ok) return;
      setEntries((prev) =>
        prev.map((e) => {
          const isWeekend = [0, 6].includes(new Date(year, month - 1, e.day).getDay());
          if (weekdaysOnly && (isWeekend || monthHolidays.has(e.day))) return e;
          const s = SHIFTS[bulkShift];
          return { ...e, checkIn: s.checkIn, checkOut: s.checkOut };
        })
      );
    })();
  }

  function handleSave() {
    setPendingAction("save");
    startTransition(async () => {
      try {
        const result = await saveDraftAction(month, year, entries, notes);
        if (result.ok) {
          initialSnapshot.current = JSON.stringify({ entries, notes });
          showToast("Borrador guardado.");
          router.refresh();
        } else {
          showToast(result.error ?? "Error al guardar.", "error");
        }
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleUpload(formData: FormData) {
    setUploadPending(true);
    startTransition(async () => {
      try {
        const result = await uploadAttachmentAction(month, year, formData);
        if (result.ok) {
          showToast("Archivo adjuntado.");
          router.refresh();
        } else {
          showToast(result.error ?? "Error al subir el archivo.", "error");
        }
      } finally {
        setUploadPending(false);
      }
    });
  }

  function handleUploadFile(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    handleUpload(formData);
  }

  async function handlePdfDownload() {
    if (!timeSheetId || pdfLoading) return;
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/timesheets/${timeSheetId}/pdf`);
      if (!res.ok) throw new Error("Error al generar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (!opened) {
        const a = document.createElement("a");
        a.href = url;
        a.download = `parte-${year}-${String(month).padStart(2, "0")}.pdf`;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      showToast("No se pudo generar el PDF.", "error");
    } finally {
      setPdfLoading(false);
    }
  }

  function handleDeleteAttachment(id: string) {
    void (async () => {
      const ok = await confirm({
        title: "Eliminar adjunto",
        message: "¿Eliminar este adjunto? Esta acción no se puede deshacer.",
        variant: "danger",
        confirmLabel: "Eliminar",
      });
      if (!ok) return;
      startTransition(async () => {
        const result = await deleteAttachmentAction(id);
        if (result.ok) {
          showToast("Adjunto eliminado.");
          router.refresh();
        } else {
          showToast(result.error ?? "Error al eliminar el adjunto.", "error");
        }
      });
    })();
  }

  function handleSign(signatureDataUrl: string) {
    setPendingAction("sign");
    startTransition(async () => {
      try {
        const result = await signAsEmployeeAction(month, year, entries, notes, signatureDataUrl);
        if (result.ok) {
          setShowSignPad(false);
          showToast("Control firmado correctamente");
          router.refresh();
        } else {
          showToast(result.error ?? "Error al firmar.", "error");
        }
      } finally {
        setPendingAction(null);
      }
    });
  }

  async function navigateMonth(href: string, targetMonth: number, targetYear: number) {
    if (isDirty && editable) {
      const ok = await confirm({
        title: "Cambios sin guardar",
        message: "Tienes cambios sin guardar. ¿Cambiar de mes de todos modos?",
      });
      if (!ok) return;
    }
    const currentOrdinal = now.getFullYear() * 12 + (now.getMonth() + 1);
    const targetOrdinal = targetYear * 12 + targetMonth;
    if (targetOrdinal > currentOrdinal + 1) {
      showToast("Estás entrando en un mes muy adelantado; probablemente aún no tenga datos.", "warning");
    }
    router.push(href);
  }

  const prev = month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
  const next = month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };
  const prevHref = `/control-horario?month=${prev.month}&year=${prev.year}`;
  const nextHref = `/control-horario?month=${next.month}&year=${next.year}`;

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
      <div className="border-y border-[color:var(--surface-divider)]">
        {/* Cabecera + resumen */}
        <div className="border-b border-[color:var(--surface-divider)] py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link
                href={prevHref}
                aria-label="Mes anterior"
                onClick={(e) => {
                  e.preventDefault();
                  void navigateMonth(prevHref, prev.month, prev.year);
                }}
                className="hit-area inline-flex items-center justify-center rounded-lg text-slate-500 transition hover:bg-brand-navy/6 hover:text-brand-navy"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <span className="min-w-[10rem] text-center text-sm font-semibold text-brand-navy">
                {monthNames[month - 1]} de {year}
              </span>
              <Link
                href={nextHref}
                aria-label="Mes siguiente"
                onClick={(e) => {
                  e.preventDefault();
                  void navigateMonth(nextHref, next.month, next.year);
                }}
                className="hit-area inline-flex items-center justify-center rounded-lg text-slate-500 transition hover:bg-brand-navy/6 hover:text-brand-navy"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {timeSheetId && (
                <button
                  type="button"
                  onClick={() => void handlePdfDownload()}
                  disabled={pdfLoading}
                  className="btn-sm btn-ghost disabled:opacity-60"
                >
                  {pdfLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {pdfLoading ? "Generando…" : "PDF"}
                </button>
              )}
              <StatusBadge status={status} />
              {isDirty && editable && (
                <StatusBadge
                  status="Sin guardar"
                  preset="timesheet"
                  className="bg-amber-500/12 text-amber-800"
                />
              )}
            </div>
          </div>

          <div
            className={`mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 ${
              summary.incompleteDays > 0 ? "lg:grid-cols-5" : "lg:grid-cols-4"
            }`}
          >
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Trabajados</p>
              <p className="text-lg font-semibold tabular-nums text-brand-navy">{summary.workedDays}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Libres</p>
              <p className="text-lg font-semibold tabular-nums text-brand-navy">{summary.freeDays}</p>
            </div>
            {summary.incompleteDays > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Incompletos</p>
                <p className="text-lg font-semibold tabular-nums text-amber-700">{summary.incompleteDays}</p>
              </div>
            )}
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
        </div>

        {/* Herramientas: bulk / copiar / filtros — fondo con degradado, sin aristas duras */}
        <div className="bg-gradient-to-b from-transparent via-[color:var(--surface-muted)] to-transparent px-4 py-5 sm:px-5 sm:py-6">
          {editable && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full min-w-[10rem] sm:w-52">
                <label htmlFor="bulk-shift" className="mb-1.5 block text-xs font-medium text-slate-500">
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
                  className="accent-brand-blue"
                />
                Solo L–V
              </label>
              <button
                type="button"
                onClick={applyBulkShift}
                className="btn-sm btn-secondary"
              >
                <Wand2 className="h-4 w-4" />
                Aplicar
              </button>
              <button
                type="button"
                onClick={handleCopyPreviousMonth}
                disabled={pending}
                className="btn-sm btn-ghost disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                Copiar mes anterior
              </button>
            </div>
          )}

          <div
            className={`flex flex-wrap items-center gap-3 text-xs text-slate-500 ${
              editable
                ? "mt-5 border-t border-[color:var(--surface-divider)]/60 pt-4"
                : ""
            }`}
          >
            <span className="font-medium text-slate-600">Leyenda:</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-4 rounded bg-slate-400/20" /> Fin de semana
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-4 rounded bg-amber-400/30" /> Festivo
            </span>
            {todayDay && (
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full ring-2 ring-brand-blue/40" /> Hoy
              </span>
            )}
            <span
              role="group"
              aria-label="Filtrar días"
              className="ml-auto flex gap-1"
            >
              {(["all", "filled", "empty"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`inline-flex min-h-11 items-center rounded-md px-3 py-1.5 font-medium transition ${
                    filter === f
                      ? "bg-brand-blue/15 text-brand-blue"
                      : "hover:bg-brand-navy/6"
                  }`}
                >
                  {f === "all" ? "Todos" : f === "filled" ? "Con horas" : "Vacíos"}
                </button>
              ))}
            </span>
          </div>
        </div>

        <TimeSheetMobileDays
          entries={filteredEntries}
          month={month}
          year={year}
          editable={editable}
          monthHolidays={monthHolidays}
          todayDay={todayDay}
          onUpdate={updateEntry}
          onApplyShift={applyShiftToEntry}
          shiftKeyForEntry={shiftKeyForEntry}
        />

        <ScrollShadow className="hidden md:block">
          {filteredEntries.length === 0 ? (
            <InlineEmpty>No hay días que coincidan con el filtro.</InlineEmpty>
          ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead className="sticky top-0 z-10 bg-[color:var(--app-gradient-top)]">
              <tr className="border-b border-[color:var(--surface-divider)] text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th className={tableCell}>Día</th>
                <th className={tableCell}>Turno</th>
                <th className={tableCell}>Entrada</th>
                <th className={tableCell}>Salida</th>
                <th className={tableCell} title="Horas totales">
                  Total
                </th>
                <th className={tableCell} title="Horas normales">
                  Normales
                </th>
                <th className={tableCell} title="Horas extra">
                  Extra
                </th>
                <th className={tableCell} title="Horas nocturnas">
                  Nocturnas
                </th>
                <th className={tableCell} title="Observaciones">
                  Obs.
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => {
                const hours = calculateDayHours(entry.checkIn, entry.checkOut);
                const weekday = formatWeekdayShort(year, month, entry.day);
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
                    className={`border-b border-[color:var(--surface-divider)] last:border-0 ${
                      holidayName ? "row-holiday" : isWeekend ? "row-weekend" : ""
                    } ${todayDay === entry.day ? "bg-brand-blue/[0.04]" : ""}`}
                  >
                    <td className={`${tableCell} whitespace-nowrap`}>
                      <span className="font-medium text-brand-navy">{entry.day}</span>{" "}
                      <span className="text-xs text-slate-500">{weekday}</span>
                      {todayDay === entry.day && (
                        <span className="ml-2 text-[10px] font-medium uppercase text-brand-blue">
                          Hoy
                        </span>
                      )}
                      {holidayName && (
                        <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                          {holidayName}
                        </span>
                      )}
                    </td>
                    <td className={tableCell}>
                      <FieldSelect
                        disabled={!editable}
                        value={shiftKey}
                        onChange={(v) => applyShiftToEntry(entry.day, v as ShiftKey)}
                        options={rowOptions}
                        size="sm"
                        variant="plain"
                        className="w-28"
                      />
                    </td>
                    <td className={tableCell}>
                      <TimeField
                        disabled={!editable}
                        value={entry.checkIn}
                        onChange={(v) => updateEntry(entry.day, { checkIn: v })}
                        variant="plain"
                        className="w-28"
                      />
                    </td>
                    <td className={tableCell}>
                      <TimeField
                        disabled={!editable}
                        value={entry.checkOut}
                        onChange={(v) => updateEntry(entry.day, { checkOut: v })}
                        variant="plain"
                        className="w-28"
                      />
                    </td>
                    <td className={`${tableCell} tabular-nums text-slate-600`}>
                      {hours.totalHours.toFixed(2)}
                    </td>
                    <td className={`${tableCell} tabular-nums text-slate-600`}>
                      {hours.normalHours.toFixed(2)}
                    </td>
                    <td className={`${tableCell} tabular-nums text-slate-600`}>
                      {hours.overtimeHours.toFixed(2)}
                    </td>
                    <td className={`${tableCell} tabular-nums text-slate-600`}>
                      {hours.nightHours.toFixed(2)}
                    </td>
                    <td className={tableCell}>
                      <input
                        type="text"
                        disabled={!editable}
                        value={entry.notes}
                        onChange={(e) => updateEntry(entry.day, { notes: e.target.value })}
                        className="field-control-plain w-full min-w-[100px] px-2 py-1 text-sm"
                        placeholder="—"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-[color:var(--surface-divider)] bg-brand-navy/[0.04] font-semibold text-brand-navy">
                <td className={tableCell} colSpan={4}>
                  Totales
                </td>
                <td className={`${tableCell} tabular-nums`}>{totals.totalHours.toFixed(2)}</td>
                <td className={`${tableCell} tabular-nums`}>{totals.normalHours.toFixed(2)}</td>
                <td className={`${tableCell} tabular-nums`}>{totals.overtimeHours.toFixed(2)}</td>
                <td className={`${tableCell} tabular-nums`}>{totals.nightHours.toFixed(2)}</td>
                <td className={tableCell} />
              </tr>
            </tfoot>
          </table>
          )}
        </ScrollShadow>

        {editable && (
          <div className="sticky bottom-0 z-10 border-t border-[color:var(--surface-divider)] bg-[color:var(--app-sticky)]/92 px-3 py-2 backdrop-blur-md">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 text-xs tabular-nums text-brand-navy">
                <strong>{totals.totalHours.toFixed(1)} h</strong>
                <span className="text-slate-500"> · {summary.workedDays} días</span>
              </p>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={pending}
                  className="btn-secondary"
                >
                  <Save className="h-4 w-4" />
                  <span className="md:hidden">{pendingAction === "save" ? "Guardando…" : "Guardar"}</span>
                  <span className="hidden md:inline">
                    {pendingAction === "save" ? "Guardando…" : "Guardar borrador"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignPad(true)}
                  disabled={pending}
                  className="btn-primary"
                  title="Firmar y enviar el control"
                  aria-label="Firmar y enviar"
                >
                  <PenLine className="h-4 w-4" />
                  <span className="md:hidden">{pendingAction === "sign" ? "Firmando…" : "Firmar"}</span>
                  <span className="hidden md:inline">
                    {pendingAction === "sign" ? "Firmando…" : "Firmar y enviar"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-[color:var(--surface-divider)] py-4">
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

        <div className="border-t border-[color:var(--surface-divider)] py-4">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-brand-navy">
            <Paperclip className="h-4 w-4" />
            Adjuntos (PDF/Excel)
          </p>

          {attachments.length === 0 ? (
            <InlineEmpty className="mb-3 py-2">Sin adjuntos</InlineEmpty>
          ) : (
            <ul className="mb-3 divide-y divide-[color:var(--surface-divider)]">
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
                      className="hit-area shrink-0 inline-flex items-center justify-center rounded p-1 text-slate-400 hover:bg-red-500/10 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {editable && (
            <div className="space-y-2">
              <FileDropzone
                accept=".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                disabled={pending || uploadPending}
                pending={uploadPending}
                label="Arrastra un PDF o Excel, o haz clic"
                onFile={handleUploadFile}
              />
              {uploadPending && (
                <div className="h-1 overflow-hidden rounded-full bg-brand-navy/10">
                  <div className="animate-shimmer h-full w-1/3 rounded-full bg-brand-blue/60" />
                </div>
              )}
            </div>
          )}
        </div>

        {(employeeSignaturePath || responsableSignaturePath) && (
          <div className="border-t border-[color:var(--surface-divider)] py-4">
            <p className="mb-3 text-sm font-medium text-brand-navy">Firmas</p>
            <div className="flex flex-wrap gap-6">
              {employeeSignaturePath && (
                <SignaturePreview
                  label="Firma del empleado"
                  signedAt={employeeSignedAt ? formatDateTimeShort(employeeSignedAt) : null}
                  src={`/api/uploads/${employeeSignaturePath}`}
                  alt="Firma del empleado"
                />
              )}
              {responsableSignaturePath && (
                <SignaturePreview
                  label="Firma de la responsable"
                  signedAt={responsableSignedAt ? formatDateTimeShort(responsableSignedAt) : null}
                  src={`/api/uploads/${responsableSignaturePath}`}
                  alt="Firma de la responsable"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {status === "RECHAZADO" && rejectionReason && (
        <Alert variant="danger" title="Motivo del rechazo">
          <p className="whitespace-pre-wrap">{rejectionReason}</p>
        </Alert>
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
