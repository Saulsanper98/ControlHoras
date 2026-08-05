"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, Bell, KeyRound } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { SignOutButton } from "@/components/layout/sign-out-button";

export function AppShell({
  role,
  userName,
  roleLabel,
  pendingSignatures,
  children,
}: {
  role: "EMPLEADO" | "JEFA" | "ADMIN";
  userName: string;
  roleLabel: string;
  pendingSignatures: number | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen w-full">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full flex-col bg-brand-navy transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          open ? "translate-x-0" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-6 md:justify-center">
          <img src="/brand/logo.svg" alt="Logo de la empresa" className="h-10 w-auto" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-slate-300 hover:text-white md:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <Sidebar role={role} onNavigate={() => setOpen(false)} />
        <div className="border-t border-white/10 px-3 py-4">
          <div className="mb-2 px-3 text-xs text-slate-400">
            <p className="font-medium text-slate-200">{userName}</p>
            <p>{roleLabel}</p>
          </div>
          <Link
            href="/cambiar-contrasena"
            className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-brand-navy-light hover:text-white"
          >
            <KeyRound className="h-4 w-4" />
            Cambiar contraseña
          </Link>
          <SignOutButton />
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#d9e4f0]">
        {/* Atmósfera con orbes visibles: el blur del glass necesita contraste detrás. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(165deg,#e4edf6_0%,#d5e3f0_40%,#cfdceb_100%)]" />
          <div
            className="glass-orb -left-24 top-[-8%] h-[420px] w-[420px] opacity-90"
            style={{
              background:
                "radial-gradient(circle, rgba(0,124,186,0.45) 0%, rgba(0,124,186,0.12) 45%, transparent 70%)",
            }}
          />
          <div
            className="glass-orb -right-16 top-[4%] h-[380px] w-[380px] opacity-95"
            style={{
              background:
                "radial-gradient(circle, rgba(245,234,97,0.55) 0%, rgba(245,234,97,0.18) 40%, transparent 68%)",
            }}
          />
          <div
            className="glass-orb bottom-[-10%] left-[28%] h-[460px] w-[460px] opacity-80"
            style={{
              background:
                "radial-gradient(circle, rgba(18,51,95,0.22) 0%, rgba(0,124,186,0.12) 40%, transparent 70%)",
            }}
          />
          <div
            className="glass-orb right-[18%] top-[48%] h-[280px] w-[280px] opacity-70"
            style={{
              background:
                "radial-gradient(circle, rgba(0,124,186,0.28) 0%, transparent 65%)",
            }}
          />
          {/* Textura suave para que el “frost” se lea mejor */}
          <div
            className="absolute inset-0 opacity-[0.35] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")",
            }}
          />
        </div>
        <header className="glass-panel-header relative z-10 flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-brand-navy md:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6" />
          </button>
          <img src="/brand/logo.svg" alt="Logo de la empresa" className="h-7 w-auto md:hidden" />
          <div className="flex-1" />
          {pendingSignatures !== null && (
            <Link
              href="/jefa/controles"
              className="relative rounded-full border border-white/60 bg-white/35 p-2 text-slate-600 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] transition-colors hover:bg-white/55 hover:text-brand-navy"
              aria-label={
                pendingSignatures > 0
                  ? `${pendingSignatures} controles horarios pendientes de firmar`
                  : "Sin controles pendientes"
              }
              title={
                pendingSignatures > 0
                  ? `${pendingSignatures} control${pendingSignatures === 1 ? "" : "es"} horario${pendingSignatures === 1 ? "" : "s"} pendiente${pendingSignatures === 1 ? "" : "s"} de firmar`
                  : "Sin controles pendientes"
              }
            >
              <Bell className="h-5 w-5" />
              {pendingSignatures > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                  {pendingSignatures > 99 ? "99+" : pendingSignatures}
                </span>
              )}
            </Link>
          )}
        </header>
        <main className="relative z-10 flex-1 px-4 py-6 sm:px-6 sm:py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
