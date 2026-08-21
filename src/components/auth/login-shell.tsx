"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { LoginVideoBackground } from "@/components/auth/login-video-background";
import { cn } from "@/lib/utils";

/**
 * Login en el cliente contra el origen actual (localhost o IP LAN).
 * No usa Server Action: Next.js estaba enviando FormData vacío (`{}`) y
 * Auth.js con AUTH_URL=localhost rompía cookies al entrar por la IP.
 */
export function LoginShell({ callbackUrl }: { callbackUrl: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formFocus, setFormFocus] = useState(false);

  const target = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = event.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    const password = String(new FormData(form).get("password") ?? "");

    if (!email || !password) {
      setPending(false);
      setError("Usuario o contraseña incorrectos.");
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: target,
      });

      if (!result || result.error) {
        setPending(false);
        // CallbackRouteError suele ser BD caída (p. ej. localhost:5433 apagado).
        const code = result?.error ?? "";
        if (
          code === "CallbackRouteError" ||
          code === "Configuration" ||
          code === "AccessDenied"
        ) {
          setError(
            "No se puede conectar con la base de datos. Arranca Postgres (Docker) y reinicia npm run dev."
          );
          return;
        }
        setError("Usuario o contraseña incorrectos.");
        return;
      }

      window.location.assign(result.url || target);
    } catch {
      setPending(false);
      setError("No se pudo iniciar sesión. Recarga la página e inténtalo de nuevo.");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-navy px-4">
      <LoginVideoBackground revealed={false} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex h-16 justify-center">
          <img
            src="/brand/logo.svg"
            alt="Logo de la empresa"
            className="h-16 w-auto animate-login-enter drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
          />
        </div>

        <div
          className={cn(
            "animate-login-enter relative overflow-hidden rounded-2xl border border-white/25 bg-white/12 p-8 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-150 transition-[box-shadow] duration-300",
            formFocus && "shadow-[0_28px_72px_rgba(0,0,0,0.5),0_0_0_1px_rgba(245,234,97,0.18)]"
          )}
          style={{ animationDelay: "110ms" }}
          onFocusCapture={() => setFormFocus(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setFormFocus(false);
            }
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-yellow/90 to-transparent"
          />

          <h1 className="mb-1 font-display text-xl font-semibold tracking-tight text-white">
            Portal del Empleado
          </h1>
          <p className="mb-6 text-sm text-slate-300">Centro de Control de la Movilidad</p>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="username"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                defaultValue=""
                className="mt-1 w-full rounded-md border border-white/25 bg-white/90 px-3 py-2 text-sm text-brand-navy placeholder:text-slate-400 transition focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-yellow/40"
                placeholder="nombre@empresa.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/90">
                Contraseña
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  defaultValue=""
                  className="w-full rounded-md border border-white/25 bg-white/90 py-2 pl-3 pr-10 text-sm text-brand-navy placeholder:text-slate-400 transition focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-yellow/40"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="hit-area absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:text-brand-navy"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p
                id="login-error"
                role="alert"
                aria-live="assertive"
                className="rounded-md border border-red-400/30 bg-red-500/20 px-3 py-2 text-sm text-red-100 backdrop-blur-sm"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              aria-busy={pending}
              className="login-btn-shine group relative w-full overflow-hidden rounded-md bg-brand-yellow px-4 py-2.5 text-sm font-semibold text-brand-navy transition hover:bg-brand-yellow/90 disabled:cursor-wait disabled:opacity-90"
            >
              {pending ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>

        <p
          className="mt-6 rounded-md bg-brand-navy/50 px-3 py-2 text-center text-[11px] tracking-[0.18em] text-white/80 uppercase animate-login-enter"
          style={{ animationDelay: "220ms" }}
        >
          CCMGC · Portal del empleado
        </p>
      </div>
    </div>
  );
}
