"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PenLine, XCircle } from "lucide-react";
import { SignatureModal } from "@/components/signature/signature-pad";
import { RejectReasonModal } from "@/components/ui/reject-reason-modal";
import { useToast } from "@/components/ui/toast";
import { rejectTimeSheetAction, signAsResponsableAction } from "@/app/(app)/jefa/controles/actions";

export function ReviewActions({ timeSheetId }: { timeSheetId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
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
          className="btn-primary"
        >
          <PenLine className="h-4 w-4" />
          Firmar como responsable
        </button>
        <button
          type="button"
          onClick={() => setShowReject(true)}
          disabled={pending}
          className="btn-danger"
        >
          <XCircle className="h-4 w-4" />
          Rechazar
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[color:var(--surface-divider)] bg-[color:var(--app-sticky)]/92 px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSignPad(true)}
            disabled={pending}
            className="btn-primary flex-1"
          >
            <PenLine className="h-4 w-4" />
            Firmar
          </button>
          <button
            type="button"
            onClick={() => setShowReject(true)}
            disabled={pending}
            className="btn-danger flex-1"
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

      <RejectReasonModal
        open={showReject}
        onClose={() => {
          setShowReject(false);
          setReason("");
        }}
        title="Rechazar control horario"
        reason={reason}
        onReasonChange={setReason}
        onConfirm={handleReject}
        pending={pending}
      />
    </div>
  );
}
