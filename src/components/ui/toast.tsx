"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastAction = { label: string; onClick: () => void };

type Toast = {
  id: number;
  message: string;
  type: "success" | "error";
  exiting?: boolean;
  action?: ToastAction;
};

type ToastOptions = {
  action?: ToastAction;
};

type ToastContextValue = {
  showToast: (message: string, type?: "success" | "error", options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success", options?: ToastOptions) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type, action: options?.action }]);
      window.setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        );
        window.setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 200);
      }, options?.action ? 8000 : 3800);
    },
    []
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-20 right-4 z-[100] flex max-w-sm flex-col gap-2 sm:bottom-4"
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
                : "bg-red-600 text-white"
            }`}
          >
            <p>{t.message}</p>
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
