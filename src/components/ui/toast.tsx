"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { X } from "lucide-react";

type ToastAction = { label: string; onClick: () => void };

type ToastType = "success" | "error" | "warning";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
  exiting?: boolean;
  action?: ToastAction;
};

type ToastOptions = {
  action?: ToastAction;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", options?: ToastOptions) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type, action: options?.action }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, options?.action ? 8000 : 3800);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2 md:bottom-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-lg ring-1 ring-black/5 ${
              t.exiting ? "animate-toast-out" : "animate-toast-in"
            } ${
              t.type === "success"
                ? "bg-emerald-600 text-white"
                : t.type === "warning"
                  ? "bg-amber-500 text-white"
                  : "bg-red-600 text-white"
            }`}
          >
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1">{t.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Cerrar notificación"
                className="hit-area -mr-1 -mt-0.5 shrink-0 rounded-md p-1 transition hover:bg-white/20"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {t.action && (
              <button
                type="button"
                onClick={t.action.onClick}
                className="mt-2 rounded-md bg-white/20 px-2.5 py-1 text-xs font-semibold transition hover:bg-white/30"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { showToast: () => {} };
  }
  return ctx;
}
