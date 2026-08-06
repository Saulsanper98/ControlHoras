"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, XCircle } from "lucide-react";
import {
  approveVacationRequestAction,
  rejectVacationRequestAction,
} from "@/app/(app)/jefa/vacaciones/request-actions";

type PendingRequest = {
  id: string;
  userName: string;
  departmentName: string | null;
  startDate: string;
  endDate: string;
  days: number;
  employeeNotes: string | null;
};

export function PendingVacationRequests({ requests }: { requests: PendingRequest[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  if (requests.length === 0) return null;

  function handleApprove(id: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await approveVacationRequestAction(id);
      if (result.ok) {
        router.refresh();
      } else {
        setMessage(result.error ?? "Error al aprobar.");
      }
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
        Solicitudes de vacaciones pendientes ({requests.length})
      </h2>
      {message && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{message}</p>}
      <div className="space-y-2">
        {requests.map((r) => (
          <div
            key={r.id}
            className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-xl p-4"
          >
            <div>
              <p className="font-medium text-brand-navy">{r.userName}</p>
              <p className="text-sm text-slate-500">
                {r.departmentName ?? "—"} ·{" "}
                {new Date(r.startDate).toLocaleDateString("es-ES")} –{" "}
                {new Date(r.endDate).toLocaleDateString("es-ES")} ({r.days} días)
              </p>
              {r.employeeNotes && <p className="text-xs text-slate-500">{r.employeeNotes}</p>}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleApprove(r.id)}
                disabled={pending}
                className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                Aprobar
              </button>
              <button
                type="button"
                onClick={() => setRejectId(r.id)}
                disabled={pending}
                className="flex items-center gap-1 rounded-md border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                <XCircle className="h-4 w-4" />
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>

      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-5">
            <h3 className="mb-3 text-lg font-semibold text-brand-navy">Rechazar solicitud</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo (opcional)"
              rows={3}
              className="surface-input w-full rounded-md px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectId(null)}
                className="surface-btn rounded-md px-4 py-2 text-sm font-medium text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={pending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
