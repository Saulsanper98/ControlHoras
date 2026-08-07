"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Modal } from "@/components/ui/modal";

export function SignatureModal({
  title,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}) {
  const padRef = useRef<SignatureCanvas>(null);
  const [emptyWarning, setEmptyWarning] = useState(false);

  function handleClear() {
    padRef.current?.clear();
    setEmptyWarning(false);
  }

  function handleConfirm() {
    if (!padRef.current || padRef.current.isEmpty()) {
      setEmptyWarning(true);
      return;
    }
    setEmptyWarning(false);
    const dataUrl = padRef.current.getTrimmedCanvas().toDataURL("image/png");
    onConfirm(dataUrl);
  }

  return (
    <Modal open onClose={onCancel} title={title} className="max-w-lg">
      <p className="mb-2 text-sm text-slate-500">Firma en el recuadro con el ratón o el dedo.</p>

      <div className="rounded-lg border border-dashed border-brand-navy/18 bg-brand-navy/[0.03]">
        <SignatureCanvas
          ref={padRef}
          penColor="#0a2240"
          canvasProps={{
            className: "w-full min-h-40 h-[min(40vw,12rem)] sm:h-48 rounded-lg touch-none",
          }}
          onBegin={() => setEmptyWarning(false)}
        />
      </div>

      {emptyWarning && (
        <p role="alert" className="mt-2 text-sm text-amber-700">
          Dibuja tu firma antes de confirmar.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={handleClear} className="btn-ghost">
          Limpiar
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancelar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={handleConfirm}
            className="btn-primary"
            aria-busy={pending}
          >
            {pending ? "Firmando…" : "Firmar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
