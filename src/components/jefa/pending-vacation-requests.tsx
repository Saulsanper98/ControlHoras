"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ListSurface } from "@/components/ui/list-surface";
import {
  approveVacationRequestAction,
  rejectVacationRequestAction,
} from "@/app/(app)/jefa/vacaciones/request-actions";
import { LEAVE_TYPE_LABEL } from "@/lib/labels";

type PendingRequest = {
  id: string;
  userName: string;
  departmentName: string | null;
  startDate: string;
  endDate: string;
  days: number;
  employeeNotes: string | null;
  leaveType?: string;
};

export function PendingVacationRequests({ requests }: { requests: PendingRequest[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [overlapPrompt, setOverlapPrompt] = useState<{
    id: string;
    warning: string;
    overlaps: { userName: string; startDate: string; endDate: string }[];
  } | null>(null);

  if (requests.length === 0) return null;

  function handleApprove(id: string, force = false) {
    setMessage(null);
    startTransition(async () => {
      const result = await approveVacationRequestAction(id, force);
      if (result.ok) {
        setOverlapPrompt(null);
        router.refresh();
        return;
      }
      if (result.warning && result.overlaps) {
        setOverlapPrompt({ id, warning: result.warning, overlaps: result.overlaps });
        return;
      }
      setMessage(result.error ?? "Error al aprobar.");
    });
  }

  function handleReject() {
    if (!rejectId) return;
    setMessage(null);
    startTransition(async () => {
      const result = await rejectVacationRequestAction(rejectId, reason);
      if (result.ok) {
        setRejectId(null);
        setReason("");
        router.refresh();
      } else {
        setMessage(result.error ?? "Error al rechazar.");
      }
    });
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
        Solicitudes pendientes ({requests.length})
      </h2>
      {message && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{message}</p>}
      <ListSurface>
        {requests.map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div>
              <p className="font-medium text-brand-navy">{r.userName}</p>
              <p className="text-sm text-slate-500">
                {r.departmentName ?? "—"} ·{" "}
                {new Date(r.startDate).toLocaleDateString("es-ES")} –{" "}
                {new Date(r.endDate).toLocaleDateString("es-ES")} ({r.days} días)
                {r.leaveType && r.leaveType !== "VACACIONES"
                  ? ` · ${LEAVE_TYPE_LABEL[r.leaveType] ?? r.leaveType}`
                  : ""}
              </p>
              {r.employeeNotes && <p className="text-xs text-slate-500">{r.employeeNotes}</p>}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleApprove(r.id)}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                Aprobar
              </button>
              <button
                type="button"
                onClick={() => setRejectId(r.id)}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 ring-1 ring-red-300/70 hover:bg-red-50 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </ListSurface>

      <Modal
        open={Boolean(overlapPrompt)}
        onClose={() => setOverlapPrompt(null)}
        title="Posible solape de equipo"
      >
        {overlapPrompt && (
          <div>
            <p className="mb-3 text-sm text-slate-600">{overlapPrompt.warning}</p>
            <ul className="mb-4 max-h-40 space-y-1 overflow-y-auto text-sm text-slate-600">
              {overlapPrompt.overlaps.map((o, idx) => (
                <li key={`${o.userName}-${idx}`}>
                  {o.userName}: {new Date(o.startDate).toLocaleDateString("es-ES")} –{" "}
                  {new Date(o.endDate).toLocaleDateString("es-ES")}
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOverlapPrompt(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleApprove(overlapPrompt.id, true)}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
              >
                Aprobar igual
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(rejectId)}
        onClose={() => setRejectId(null)}
        title="Rechazar solicitud"
      >
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo (opcional)"
          rows={3}
          className="field-control w-full rounded-md px-3 py-2 text-sm"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setRejectId(null)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={pending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            Rechazar
          </button>
        </div>
      </Modal>
    </section>
  );
}
