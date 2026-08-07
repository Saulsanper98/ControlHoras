"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PenLine, XCircle } from "lucide-react";
import { SignatureModal } from "@/components/signature/signature-pad";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { rejectTimeSheetAction, signAsResponsableAction } from "@/app/(app)/jefa/controles/actions";

export function ReviewActions({ timeSheetId }: { timeSheetId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [pending, startTransition] = useTransition();
  const [showSignPad, setShowSignPad] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  function handleSign(dataUrl: string) {
    startTransition(async () => {
      const result = await signAsResponsableAction(timeSheetId, dataUrl);
      if (result.ok) {
        setShowSignPad(false);
        showToast("Control firmado correctamente.");
        router.refresh();
      } else {
        showToast(result.error ?? "Error al firmar.", "error");
      }
    });
  }

  async function openReject() {
    const ok = await confirm({
      title: "Rechazar control horario",
      message: "El empleado tendrá que corregir y volver a enviar el control. ¿Continuar?",
      variant: "danger",
      confirmLabel: "Continuar",
    });
    if (ok) setShowReject(true);
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectTimeSheetAction(timeSheetId, reason);
      if (result.ok) {
        setShowReject(false);
        setReason("");
        showToast("Control rechazado.");
        router.refresh();
      } else {
        showToast(result.error ?? "Error al rechazar.", "error");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="hidden items-center gap-3 md:flex">
        <button
          type="button"
          onClick={() => setShowSignPad(true)}
          disabled={pending}
          className="btn-primary disabled:opacity-60"
        >
          <PenLine className="h-4 w-4" />
          Firmar como responsable
        </button>
        <button
          type="button"
          onClick={() => void openReject()}
          disabled={pending}
          className="btn-danger disabled:opacity-60"
        >
          <XCircle className="h-4 w-4" />
          Rechazar
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[color:var(--surface-divider)] bg-[color:var(--app-sticky)]/95 px-4 py-3 backdrop-blur-sm md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSignPad(true)}
            disabled={pending}
            className="btn-primary flex-1 disabled:opacity-60"
          >
            <PenLine className="h-4 w-4" />
            Firmar
          </button>
          <button
            type="button"
            onClick={() => void openReject()}
            disabled={pending}
            className="btn-danger flex-1 disabled:opacity-60"
          >
            <XCircle className="h-4 w-4" />
            Rechazar
          </button>
        </div>
      </div>
      {/* Spacer so content isn't hidden behind the fixed bar */}
      <div className="h-16 md:hidden" aria-hidden />

      {showSignPad && (
        <SignatureModal
          title="Firma como responsable"
          pending={pending}
          onCancel={() => setShowSignPad(false)}
          onConfirm={handleSign}
        />
      )}

      <Modal
        open={showReject}
        onClose={() => setShowReject(false)}
        title="Rechazar control horario"
      >
        <label htmlFor="reject-reason" className="mb-1 block text-xs font-medium text-slate-500">
          Motivo (opcional)
        </label>
        <textarea
          id="reject-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo del rechazo"
          rows={3}
          className="field-control w-full rounded-md px-3 py-2 text-sm"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setShowReject(false)} className="btn-ghost">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={pending}
            className="btn-danger disabled:opacity-60"
          >
            {pending ? "Rechazando..." : "Rechazar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
