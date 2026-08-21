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
      <Modal open={Boolean(state)} onClose={() => handleClose(false)} title={state?.title ?? ""}>
        <p className="text-sm leading-relaxed text-slate-600">{state?.message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => handleClose(false)} className="btn-ghost" data-autofocus>
            {state?.cancelLabel ?? "Cancelar"}
          </button>
          <button
            type="button"
            onClick={() => handleClose(true)}
            className={state?.variant === "danger" ? "btn-danger" : "btn-primary"}
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
      confirm: async (options: ConfirmOptions) => {
        console.error(
          "[useConfirm] ConfirmProvider is missing; confirmation rejected.",
          options.title
        );
        return false;
      },
    };
  }
  return ctx;
}
