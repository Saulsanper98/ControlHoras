"use client";

import { Modal } from "@/components/ui/modal";

/** Un solo paso: motivo + confirmar rechazo (sin ConfirmDialog previo). */
export function RejectReasonModal({
  open,
  onClose,
  title,
  reason,
  onReasonChange,
  onConfirm,
  pending,
  confirmLabel = "Rechazar",
  reasonOptional = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  reason: string;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
  pending?: boolean;
  confirmLabel?: string;
  reasonOptional?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-3 text-sm text-slate-600">
        {reasonOptional
          ? "Puedes indicar un motivo (opcional). La persona afectada será notificada."
          : "Indica el motivo del rechazo."}
      </p>
      <label htmlFor="reject-reason-field" className="mb-1 block text-xs font-medium text-slate-500">
        Motivo{reasonOptional ? " (opcional)" : ""}
      </label>
      <textarea
        id="reject-reason-field"
        data-autofocus
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="Motivo del rechazo"
        rows={3}
        className="field-control w-full px-3 py-2 text-sm"
      />
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn-ghost">
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending || (!reasonOptional && !reason.trim())}
          className="btn-danger"
          aria-busy={pending}
        >
          {pending ? "Rechazando…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
