"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { RejectReasonModal } from "@/components/ui/reject-reason-modal";
import { useToast } from "@/components/ui/toast";
import {
  approveVacationRequestAction,
  rejectVacationRequestAction,
} from "@/app/(app)/jefa/vacaciones/request-actions";
import { formatDateShort } from "@/lib/format-date";

export function RequestReviewButtons({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);
  const [, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [overlapPrompt, setOverlapPrompt] = useState<{
    warning: string;
    overlaps: { userName: string; startDate: string; endDate: string }[];
  } | null>(null);

  const busy = pendingAction !== null;

  function handleApprove(force = false) {
    setPendingAction("approve");
    startTransition(async () => {
      const result = await approveVacationRequestAction(requestId, force);
      setPendingAction(null);
      if (result.ok) {
        setOverlapPrompt(null);
        showToast("Solicitud aprobada.");
        router.refresh();
        return;
      }
      if (result.warning && result.overlaps) {
        setOverlapPrompt({ warning: result.warning, overlaps: result.overlaps });
        return;
      }
      showToast(result.error ?? "Error al aprobar.", "error");
    });
  }

  function handleReject() {
    setPendingAction("reject");
    startTransition(async () => {
      const result = await rejectVacationRequestAction(requestId, reason);
      setPendingAction(null);
      if (result.ok) {
        setRejectOpen(false);
        setReason("");
        showToast("Solicitud rechazada.");
        router.refresh();
      } else {
        showToast(result.error ?? "Error al rechazar.", "error");
      }
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleApprove()}
          disabled={busy}
          className="btn-success"
        >
          <Check className="h-4 w-4" />
          {pendingAction === "approve" ? "Aprobando…" : "Aprobar"}
        </button>
        <button
          type="button"
          onClick={() => setRejectOpen(true)}
          disabled={busy}
          className="btn-danger"
        >
          <XCircle className="h-4 w-4" />
          {pendingAction === "reject" ? "Rechazando…" : "Rechazar"}
        </button>
      </div>

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
              <button type="button" onClick={() => setOverlapPrompt(null)} className="btn-ghost">
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleApprove(true)}
                className="btn-warning"
              >
                Aprobar igual
              </button>
            </div>
          </div>
        )}
      </Modal>

      <RejectReasonModal
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
          setReason("");
        }}
        title="Rechazar solicitud"
        reason={reason}
        onReasonChange={setReason}
        onConfirm={handleReject}
        pending={pendingAction === "reject"}
      />
    </>
  );
}
