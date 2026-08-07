"use client";

import { useActionState, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { changePasswordAction } from "./actions";

const MIN_LENGTH = 8;

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, {
    error: null,
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const requirementsId = useId();
  const errorId = useId();

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-white/90">
          Contraseña actual
        </label>
        <div className="relative mt-1">
          <input
            id="currentPassword"
            name="currentPassword"
            type={showCurrent ? "text" : "password"}
            required
            autoComplete="current-password"
            disabled={pending}
            aria-invalid={Boolean(state.error)}
            aria-describedby={state.error ? errorId : undefined}
            className="w-full rounded-md border border-white/25 bg-white/90 py-2 pl-3 pr-10 text-sm text-brand-navy placeholder:text-slate-400 focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-yellow/40 disabled:opacity-70"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-brand-navy"
            aria-label={showCurrent ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-white/90">
          Nueva contraseña
        </label>
        <div className="relative mt-1">
          <input
            id="newPassword"
            name="newPassword"
            type={showNew ? "text" : "password"}
            required
            minLength={MIN_LENGTH}
            autoComplete="new-password"
            disabled={pending}
            aria-describedby={`${requirementsId}${state.error ? ` ${errorId}` : ""}`}
            aria-invalid={Boolean(state.error)}
            className="w-full rounded-md border border-white/25 bg-white/90 py-2 pl-3 pr-10 text-sm text-brand-navy placeholder:text-slate-400 focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-yellow/40 disabled:opacity-70"
            placeholder="Al menos 8 caracteres"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-brand-navy"
            aria-label={showNew ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <ul
          id={requirementsId}
          className="mt-2 space-y-0.5 text-xs text-white/70"
        >
          <li>· Mínimo {MIN_LENGTH} caracteres</li>
          <li>· Debe coincidir con la confirmación</li>
        </ul>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90">
          Repite la nueva contraseña
        </label>
        <div className="relative mt-1">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            required
            minLength={MIN_LENGTH}
            autoComplete="new-password"
            disabled={pending}
            aria-invalid={Boolean(state.error)}
            aria-describedby={state.error ? errorId : undefined}
            className="w-full rounded-md border border-white/25 bg-white/90 py-2 pl-3 pr-10 text-sm text-brand-navy placeholder:text-slate-400 focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-yellow/40 disabled:opacity-70"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-brand-navy"
            aria-label={showConfirm ? "Ocultar confirmación" : "Mostrar confirmación"}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {state.error && (
        <p
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="rounded-md border border-red-400/30 bg-red-500/20 px-3 py-2 text-sm text-red-100 backdrop-blur-sm"
        >
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="w-full rounded-md bg-brand-yellow px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-brand-yellow/90 disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
