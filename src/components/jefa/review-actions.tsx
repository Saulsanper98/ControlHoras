"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PenLine, XCircle } from "lucide-react";
import { SignatureModal } from "@/components/signature/signature-pad";
import { Modal } from "@/components/ui/modal";
import { rejectTimeSheetAction, signAsResponsableAction } from "@/app/(app)/jefa/controles/actions";

export function ReviewActions({ timeSheetId }: { timeSheetId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showSignPad, setShowSignPad] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function handleSign(dataUrl: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await signAsResponsableAction(timeSheetId, dataUrl);
      if (result.ok) {
        setShowSignPad(false);
        router.refresh();
      } else {
        setMessage(result.error ?? "Error al firmar.");
      }
    });
  }

  function handleReject() {
    setMessage(null);
    startTransition(async () => {
      const result = await rejectTimeSheetAction(timeSheetId, reason);
      if (result.ok) {
        setShowReject(false);
        router.refresh();
      } else {
        setMessage(result.error ?? "Error al rechazar.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {message && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{message}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowSignPad(true)}
          disabled={pending}
          className="flex items-center gap-2 rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark disabled:opacity-60"
        >
          <PenLine className="h-4 w-4" />
          Firmar como responsable
        </button>
        <button
          type="button"
          onClick={() => setShowReject(true)}
          disabled={pending}
          className="flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          <XCircle className="h-4 w-4" />
          Rechazar
        </button>
      </div>

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
            onClick={() => setShowReject(false)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-navy/6"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={pending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {pending ? "Rechazando..." : "Rechazar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
