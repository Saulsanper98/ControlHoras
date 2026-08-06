"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(
    null
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  function handleClose(result: boolean) {
    state?.resolve(result);
    setState(null);
  }

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        open={Boolean(state)}
        onClose={() => handleClose(false)}
        title={state?.title ?? ""}
      >
        <p className="text-sm leading-relaxed text-slate-600">{state?.message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => handleClose(false)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-navy/6 active:scale-[0.98]"
          >
            {state?.cancelLabel ?? "Cancelar"}
          </button>
          <button
            type="button"
            onClick={() => handleClose(true)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] ${
              state?.variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-brand-blue hover:bg-brand-blue-dark"
            }`}
          >
            {state?.confirmLabel ?? "Confirmar"}
          </button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return {
      confirm: async () => window.confirm("¿Continuar?"),
    };
  }
  return ctx;
}
