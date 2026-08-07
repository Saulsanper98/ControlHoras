"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ListSurface, SectionBlock } from "@/components/ui/list-surface";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatDateTimeShort } from "@/lib/format-date";
import {
  addHourAdjustmentAction,
  deleteHourAdjustmentAction,
  saveVacationBalanceAction,
} from "@/app/(app)/jefa/vacaciones/actions";
import { InlineEmpty } from "@/components/ui/inline-empty";

type Adjustment = { id: string; hours: number; reason: string; createdAt: string; createdByName: string };

export function VacationEditor({
  userId,
  year,
  initialTotalDays,
  initialUsedDays,
  initialNotes,
  adjustments,
  pendingDays = 0,
}: {
  userId: string;
  year: number;
  initialTotalDays: number;
  initialUsedDays: number;
  initialNotes: string;
  adjustments: Adjustment[];
  pendingDays?: number;
}) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const router = useRouter();
  const [totalDays, setTotalDays] = useState(initialTotalDays);
  const [usedDays, setUsedDays] = useState(initialUsedDays);
  const [notes, setNotes] = useState(initialNotes);
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSaveBalance() {
    startTransition(async () => {
      const result = await saveVacationBalanceAction(userId, year, totalDays, usedDays, notes);
      if (result.ok) {
        showToast("Saldo de vacaciones guardado.");
        router.refresh();
      } else {
        showToast(result.error ?? "Error al guardar.", "error");
      }
    });
  }

  function handleAddAdjustment() {
    const parsed = Number(hours);
    if (!parsed) {
      showToast("Indica un número de horas distinto de cero.", "error");
      return;
    }
    startTransition(async () => {
      const result = await addHourAdjustmentAction(userId, parsed, reason, year);
      if (result.ok) {
        setHours("");
        setReason("");
        showToast("Ajuste de horas añadido.");
        router.refresh();
      } else {
        showToast(result.error ?? "Error al añadir el ajuste.", "error");
      }
    });
  }

  async function handleDeleteAdjustment(id: string) {
    const ok = await confirm({
      title: "Eliminar ajuste",
      message: "¿Eliminar este ajuste de horas? Esta acción no se puede deshacer.",
      variant: "danger",
      confirmLabel: "Eliminar",
    });
    if (!ok) return;
    startTransition(async () => {
      const result = await deleteHourAdjustmentAction(id, userId);
      if (result.ok) {
        showToast("Ajuste eliminado.");
        router.refresh();
      } else {
        showToast(result.error ?? "Error al eliminar el ajuste.", "error");
      }
    });
  }

  const totalHours = adjustments.reduce((sum, a) => sum + a.hours, 0);
  const remaining = totalDays - usedDays - pendingDays;

  return (
    <div className="space-y-6">
      <SectionBlock>
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
              className="field-control w-24 px-2 py-1.5 text-sm"
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
              className="field-control w-24 px-2 py-1.5 text-sm"
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
              className="field-control w-full px-2 py-1.5 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">Visible para el empleado</p>
          </div>
          <button
            type="button"
            onClick={handleSaveBalance}
            disabled={pending}
            className="btn-sm btn-primary disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Restantes:{" "}
          <span className="font-medium text-brand-navy">{remaining.toFixed(1)} días</span>
          {pendingDays > 0 && (
            <span className="ml-2 text-amber-700">
              (incluye {pendingDays} en trámite)
            </span>
          )}
        </p>
      </SectionBlock>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-brand-navy">Bolsa de horas</p>
          <p className="text-sm text-slate-500">
            Total: <span className="font-medium text-brand-navy">{totalHours.toFixed(1)} h</span>
          </p>
        </div>

        <SectionBlock className="mb-0">
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
                className="field-control w-24 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="min-w-[160px] flex-1">
              <label htmlFor="hour-adjustment-reason" className="mb-1 block text-xs text-slate-500">
                Motivo <span className="text-red-600">*</span>
              </label>
              <input
                id="hour-adjustment-reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="field-control w-full px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleAddAdjustment}
              disabled={pending}
              className="btn-sm btn-secondary disabled:opacity-60"
            >
              Añadir ajuste
            </button>
          </div>
        </SectionBlock>

        {adjustments.length === 0 ? (
          <InlineEmpty className="mt-3 py-2">Sin ajustes registrados.</InlineEmpty>
        ) : (
          <ListSurface className="mt-3">
            {adjustments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div>
                  <span className={`font-medium ${a.hours >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {a.hours >= 0 ? "+" : ""}
                    {a.hours.toFixed(1)} h
                  </span>
                  <span className="ml-2 text-slate-500">{a.reason}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {formatDateTimeShort(a.createdAt)} · {a.createdByName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDeleteAdjustment(a.id)}
                  disabled={pending}
                  aria-label="Eliminar ajuste"
                  className="hit-area inline-flex items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </ListSurface>
        )}
      </section>
    </div>
  );
}
