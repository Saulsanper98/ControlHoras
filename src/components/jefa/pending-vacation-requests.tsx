"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ListSurface } from "@/components/ui/list-surface";
import { StatusBadge } from "@/components/ui/status-badge";
import { SectionEyebrow } from "@/components/ui/section-title";
import { RejectReasonModal } from "@/components/ui/reject-reason-modal";
import { useToast } from "@/components/ui/toast";
import {
  approveVacationRequestAction,
  rejectVacationRequestAction,
} from "@/app/(app)/jefa/vacaciones/request-actions";
import { formatDateShort } from "@/lib/format-date";

type PendingRequest = {
  id: string;
  userId: string;
  userName: string;
  departmentName: string | null;
  startDate: string;
  endDate: string;
  days: number;
  employeeNotes: string | null;
  leaveType?: string;
};

export function PendingVacationRequests({
  requests,
  year,
}: {
  requests: PendingRequest[];
  year: number;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [, startTransition] = useTransition();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [overlapPrompt, setOverlapPrompt] = useState<{
    id: string;
    warning: string;
    overlaps: { userName: string; startDate: string; endDate: string }[];
  } | null>(null);

  if (requests.length === 0) return null;

  function handleApprove(id: string, force = false) {
    setPendingId(id);
    setPendingAction("approve");
    startTransition(async () => {
      const result = await approveVacationRequestAction(id, force);
      setPendingId(null);
      setPendingAction(null);
      if (result.ok) {
        setOverlapPrompt(null);
        showToast("Solicitud aprobada.");
        router.refresh();
        return;
      }
      if (result.warning && result.overlaps) {
        setOverlapPrompt({ id, warning: result.warning, overlaps: result.overlaps });
        return;
      }
      showToast(result.error ?? "Error al aprobar.", "error");
    });
  }

  function handleReject() {
    if (!rejectId) return;
    setPendingId(rejectId);
    setPendingAction("reject");
    startTransition(async () => {
      const result = await rejectVacationRequestAction(rejectId, reason);
      setPendingId(null);
      setPendingAction(null);
      if (result.ok) {
        setRejectId(null);
        setReason("");
        showToast("Solicitud rechazada.");
        router.refresh();
      } else {
        showToast(result.error ?? "Error al rechazar.", "error");
      }
    });
  }

  return (
    <section className="space-y-3">
      <SectionEyebrow className="text-amber-700">
        Solicitudes pendientes ({requests.length})
      </SectionEyebrow>
      <ListSurface>
        {requests.map((r) => {
          const busy = pendingId === r.id;
          const approving = busy && pendingAction === "approve";
          const rejecting = busy && pendingAction === "reject";
          return (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/jefa/vacaciones/${r.userId}?year=${year}`}
                    className="font-medium text-brand-navy hover:text-brand-blue hover:underline"
                  >
                    {r.userName}
                  </Link>
                  <StatusBadge status={r.leaveType ?? "VACACIONES"} preset="leaveType" />
                </div>
                <p className="text-sm text-slate-500">
                  {r.departmentName ?? "—"} ·{" "}
                  {formatDateShort(r.startDate)} – {formatDateShort(r.endDate)} ({r.days}{" "}
                  día{r.days === 1 ? "" : "s"})
                </p>
                {r.employeeNotes ? (
                  <p className="text-xs text-slate-500">{r.employeeNotes}</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleApprove(r.id)}
                  disabled={busy}
                  className="btn-success"
                >
                  <Check className="h-4 w-4" />
                  {approving ? "Aprobando…" : "Aprobar"}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectId(r.id)}
                  disabled={busy}
                  className="btn-danger"
                >
                  <XCircle className="h-4 w-4" />
                  {rejecting ? "Rechazando…" : "Rechazar"}
                </button>
              </div>
            </div>
          );
        })}
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
                  {o.userName}: {formatDateShort(o.startDate)} – {formatDateShort(o.endDate)}
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOverlapPrompt(null)}
                className="btn-ghost"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pendingId !== null}
                onClick={() => handleApprove(overlapPrompt.id, true)}
                className="btn-warning"
              >
                Aprobar igual
              </button>
            </div>
          </div>
        )}
      </Modal>

      <RejectReasonModal
        open={Boolean(rejectId)}
        onClose={() => {
          setRejectId(null);
          setReason("");
        }}
        title="Rechazar solicitud"
        reason={reason}
        onReasonChange={setReason}
        onConfirm={handleReject}
        pending={pendingId !== null}
      />
    </section>
  );
}
