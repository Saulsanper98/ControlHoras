"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  addHourAdjustmentAction,
  deleteHourAdjustmentAction,
  saveVacationBalanceAction,
} from "@/app/(app)/jefa/vacaciones/actions";

type Adjustment = { id: string; hours: number; reason: string; createdAt: string; createdByName: string };

export function VacationEditor({
  userId,
  year,
  initialTotalDays,
  initialUsedDays,
  initialNotes,
  adjustments,
}: {
  userId: string;
  year: number;
  initialTotalDays: number;
  initialUsedDays: number;
  initialNotes: string;
  adjustments: Adjustment[];
}) {
  const [totalDays, setTotalDays] = useState(initialTotalDays);
  const [usedDays, setUsedDays] = useState(initialUsedDays);
  const [notes, setNotes] = useState(initialNotes);
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSaveBalance() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveVacationBalanceAction(userId, year, totalDays, usedDays, notes);
      setMessage(
        result.ok
          ? { type: "success", text: "Saldo de vacaciones guardado." }
          : { type: "error", text: result.error ?? "Error al guardar." }
      );
    });
  }

  function handleAddAdjustment() {
    setMessage(null);
    const parsed = Number(hours);
    if (!parsed) {
      setMessage({ type: "error", text: "Indica un número de horas distinto de cero." });
      return;
    }
    startTransition(async () => {
      const result = await addHourAdjustmentAction(userId, parsed, reason);
      if (result.ok) {
        setHours("");
        setReason("");
      } else {
        setMessage({ type: "error", text: result.error ?? "Error al añadir el ajuste." });
      }
    });
  }

  function handleDeleteAdjustment(id: string) {
    if (!window.confirm("¿Eliminar este ajuste de horas? Esta acción no se puede deshacer.")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteHourAdjustmentAction(id, userId);
      if (!result.ok) setMessage({ type: "error", text: result.error ?? "Error al eliminar el ajuste." });
    });
  }

  const totalHours = adjustments.reduce((sum, a) => sum + a.hours, 0);

  return (
    <div className="space-y-6">
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

      <Card>
        <p className="mb-3 text-sm font-medium text-brand-navy">Saldo de vacaciones ({year})</p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="vac-total-days" className="mb-1 block text-xs text-slate-500">
              Días totales
            </label>
            <input
              id="vac-total-days"
              type="number"
              step="0.5"
              min="0"
              value={totalDays}
              onChange={(e) => setTotalDays(Number(e.target.value))}
              className="surface-input w-24 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="vac-used-days" className="mb-1 block text-xs text-slate-500">
              Días usados
            </label>
            <input
              id="vac-used-days"
              type="number"
              step="0.5"
              min="0"
              value={usedDays}
              onChange={(e) => setUsedDays(Number(e.target.value))}
              className="surface-input w-24 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <label htmlFor="vac-notes" className="mb-1 block text-xs text-slate-500">
              Notas
            </label>
            <input
              id="vac-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="surface-input w-full rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveBalance}
            disabled={pending}
            className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Restantes:{" "}
          <span className="font-medium text-brand-navy">{(totalDays - usedDays).toFixed(1)} días</span>
        </p>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-brand-navy">Bolsa de horas</p>
          <p className="text-sm text-slate-500">
            Total: <span className="font-medium text-brand-navy">{totalHours.toFixed(1)} h</span>
          </p>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="hour-adjustment" className="mb-1 block text-xs text-slate-500">
              Horas (+/-)
            </label>
            <input
              id="hour-adjustment"
              type="number"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="surface-input w-24 rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div className="min-w-[160px] flex-1">
            <label htmlFor="hour-adjustment-reason" className="mb-1 block text-xs text-slate-500">
              Motivo
            </label>
            <input
              id="hour-adjustment-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="surface-input w-full rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleAddAdjustment}
            disabled={pending}
            className="rounded-md border border-brand-blue px-4 py-2 text-sm font-semibold text-brand-blue hover:bg-brand-blue/10 disabled:opacity-60"
          >
            Añadir ajuste
          </button>
        </div>

        <div className="space-y-2">
          {adjustments.length === 0 && (
            <p className="text-sm text-slate-500">Sin ajustes registrados.</p>
          )}
          {adjustments.map((a) => (
            <div
              key={a.id}
              className="surface-muted flex items-center justify-between rounded-md border border-brand-navy/10 px-3 py-2 text-sm"
            >
              <div>
                <span className={`font-medium ${a.hours >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {a.hours >= 0 ? "+" : ""}
                  {a.hours.toFixed(1)} h
                </span>
                <span className="ml-2 text-slate-500">{a.reason}</span>
                <span className="ml-2 text-xs text-slate-500">
                  {new Date(a.createdAt).toLocaleDateString("es-ES")} · {a.createdByName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteAdjustment(a.id)}
                disabled={pending}
                aria-label="Eliminar ajuste"
                className="text-slate-400 hover:text-red-600 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
