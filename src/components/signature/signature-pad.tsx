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
  const [empty, setEmpty] = useState(true);

  function handleClear() {
    padRef.current?.clear();
    setEmpty(true);
  }

  function handleConfirm() {
    if (!padRef.current || padRef.current.isEmpty()) return;
    const dataUrl = padRef.current.getTrimmedCanvas().toDataURL("image/png");
    onConfirm(dataUrl);
  }

  return (
    <Modal open onClose={onCancel} title={title} className="max-w-lg">
      <p className="mb-2 text-sm text-slate-500">Firma en el recuadro con el ratón o el dedo.</p>

      <div className="rounded-md border border-dashed border-brand-navy/18 bg-brand-navy/[0.03]">
        <SignatureCanvas
          ref={padRef}
          penColor="#0a2240"
          canvasProps={{ className: "w-full h-48 rounded-md" }}
          onBegin={() => setEmpty(false)}
        />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleClear}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Limpiar
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-navy/6"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={empty || pending}
            onClick={handleConfirm}
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark disabled:opacity-60"
          >
            {pending ? "Firmando..." : "Firmar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
