"use client";

import { useEffect, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/login/actions";
import { LoginVideoBackground } from "./login-video-background";
import { cn } from "@/lib/utils";

const EXIT_MS = 1300;
const EXIT_MS_REDUCED = 140;

export function LoginShell({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(loginAction, {
    error: null,
    redirectTo: null,
  });
  const [exiting, setExiting] = useState(false);
  const [cardGone, setCardGone] = useState(false);
  const [shake, setShake] = useState(false);
  const [formFocus, setFormFocus] = useState(false);
  // Bloquea el relleno automático al montar; al enfocar se habilitan
  // username / current-password para sugerencias al escribir.
  const [unlockFields, setUnlockFields] = useState(false);

  useEffect(() => {
    router.prefetch(callbackUrl || "/");
  }, [router, callbackUrl]);

  useEffect(() => {
    if (!state.redirectTo) return;

    setExiting(true);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduceMotion ? EXIT_MS_REDUCED : EXIT_MS;
    // Solo rutas relativas internas (evita open-redirect).
    const raw = state.redirectTo;
    const target = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

    const timer = window.setTimeout(() => {
      // Navegación completa: la cookie de sesión del Server Action se aplica seguro.
      window.location.assign(target);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [state.redirectTo]);

  // El formulario sale del DOM en cuanto termina su fade, para no dejar un fantasma borroso.
  useEffect(() => {
    if (!exiting) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setCardGone(true), reduceMotion ? 80 : 380);
    return () => window.clearTimeout(timer);
  }, [exiting]);

  useEffect(() => {
    if (!state.error || exiting) return;
    setShake(true);
    const timer = window.setTimeout(() => setShake(false), 520);
    return () => window.clearTimeout(timer);
  }, [state, exiting]);

  const busy = pending || exiting;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-navy px-4">
      <LoginVideoBackground revealed={exiting} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo en flujo (antes de entrar) */}
        <div className="mb-8 flex h-16 justify-center">
          {!exiting ? (
            <img
              src="/brand/logo.svg"
              alt="Logo de la empresa"
              className="h-16 w-auto animate-login-enter drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
            />
          ) : null}
        </div>

        {/* Logo centrado en overlay durante la revelación del vídeo */}
        {exiting && (
          <div className="login-logo-exit-overlay" aria-hidden="true">
            <img src="/brand/logo.svg" alt="" />
          </div>
        )}

        {!cardGone && (
          <div
            className={cn(
              "animate-login-enter relative overflow-hidden rounded-2xl border border-white/25 bg-white/12 p-8 shadow-[0_24px_64px_rgba(0,0,0,0.45)] backdrop-blur-2xl backdrop-saturate-150 transition-[box-shadow] duration-300",
              formFocus && !exiting && "shadow-[0_28px_72px_rgba(0,0,0,0.5),0_0_0_1px_rgba(245,234,97,0.18)]",
              exiting && "login-card-exit",
              shake && !exiting && "animate-login-shake"
            )}
            style={{ animationDelay: "110ms" }}
            onFocusCapture={() => setFormFocus(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setFormFocus(false);
              }
            }}
          >
            {/* Acento de marca en el borde superior */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-yellow/90 to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 top-0 h-[2px] bg-gradient-to-r from-brand-blue/0 via-brand-blue/50 to-brand-blue/0 blur-[1px]"
            />

            <h1 className="mb-1 text-xl font-semibold tracking-tight text-white">
              Portal del Empleado
            </h1>
            <p className="mb-6 text-sm text-slate-300">
              Centro de Control de la Movilidad
            </p>

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="callbackUrl" value={callbackUrl} />

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
                  // readOnly hasta el primer foco: evita que el navegador
                  // rellene la cuenta al cargar, pero permite sugerencias al escribir.
                  readOnly={!unlockFields}
                  onFocus={() => setUnlockFields(true)}
                  disabled={busy}
                  className="mt-1 w-full rounded-md border border-white/25 bg-white/90 px-3 py-2 text-sm text-brand-navy placeholder:text-slate-400 transition focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-yellow/40 disabled:opacity-70"
                  placeholder="nombre@empresa.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/90">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  readOnly={!unlockFields}
                  onFocus={() => setUnlockFields(true)}
                  disabled={busy}
                  className="mt-1 w-full rounded-md border border-white/25 bg-white/90 px-3 py-2 text-sm text-brand-navy placeholder:text-slate-400 transition focus:border-brand-yellow focus:outline-none focus:ring-2 focus:ring-brand-yellow/40 disabled:opacity-70"
                  placeholder="••••••••"
                />
              </div>

              {state.error && !exiting && (
                <p className="rounded-md border border-red-400/30 bg-red-500/20 px-3 py-2 text-sm text-red-100 backdrop-blur-sm">
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                onMouseEnter={() => router.prefetch(callbackUrl || "/")}
                onFocus={() => router.prefetch(callbackUrl || "/")}
                className="login-btn-shine group relative w-full overflow-hidden rounded-md bg-brand-yellow px-4 py-2.5 text-sm font-semibold text-brand-navy transition hover:bg-brand-yellow/90 disabled:cursor-wait disabled:opacity-90"
              >
                <span
                  className={cn(
                    "relative z-10 inline-flex items-center justify-center gap-2 transition-opacity",
                    busy ? "opacity-0" : "opacity-100"
                  )}
                >
                  Entrar
                </span>
                {busy && !exiting && (
                  <span className="absolute inset-0 z-10 flex items-center justify-center gap-2">
                    <span className="login-pulse-dot" />
                    <span className="login-pulse-dot [animation-delay:120ms]" />
                    <span className="login-pulse-dot [animation-delay:240ms]" />
                  </span>
                )}
              </button>
            </form>
          </div>
        )}

        {!cardGone && (
          <p
            className={cn(
              "mt-6 text-center text-[11px] tracking-[0.18em] text-white/40 uppercase animate-login-enter transition-opacity duration-300",
              exiting && "opacity-0"
            )}
            style={{ animationDelay: "220ms" }}
          >
            CCMGC · Portal del empleado
          </p>
        )}
      </div>
    </div>
  );
}
