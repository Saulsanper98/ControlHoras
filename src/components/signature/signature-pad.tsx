"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-brand-navy">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-2 text-sm text-slate-500">Firma en el recuadro con el ratón o el dedo.</p>

        <div className="surface-muted rounded-md border-2 border-dashed border-brand-navy/20">
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
              className="surface-btn rounded-md px-4 py-2 text-sm font-medium text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={empty || pending}
              onClick={handleConfirm}
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark disabled:opacity-60"
            >
              {pending ? "Firmando..." : "Firmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
