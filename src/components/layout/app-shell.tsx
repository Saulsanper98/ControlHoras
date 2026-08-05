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
          <div className="mb-2 px-3 text-xs">
            <p className="font-medium text-slate-100">{userName}</p>
            <p className="text-slate-400">{roleLabel}</p>
          </div>
          <Link
            href="/cambiar-contrasena"
            className="mb-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-brand-navy-light hover:text-white"
          >
            <KeyRound className="h-4 w-4" />
            Cambiar contraseña
          </Link>
          <SignOutButton />
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#c5d4e6]">
        {/* Atmósfera: más navy/azul de marca, amarillo solo como acento suave */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(165deg,#d2deec_0%,#c4d3e6_38%,#b7c8de_100%)]" />
          <div
            className="glass-orb -left-28 top-[-12%] h-[480px] w-[480px] opacity-95"
            style={{
              background:
                "radial-gradient(circle, rgba(10,34,64,0.28) 0%, rgba(0,124,186,0.22) 40%, transparent 70%)",
            }}
          />
          <div
            className="glass-orb -right-20 top-[2%] h-[360px] w-[360px] opacity-70"
            style={{
              background:
                "radial-gradient(circle, rgba(245,234,97,0.22) 0%, rgba(245,234,97,0.06) 42%, transparent 68%)",
            }}
          />
          <div
            className="glass-orb bottom-[-12%] left-[22%] h-[500px] w-[500px] opacity-85"
            style={{
              background:
                "radial-gradient(circle, rgba(18,51,95,0.28) 0%, rgba(0,124,186,0.14) 42%, transparent 70%)",
            }}
          />
          <div
            className="glass-orb right-[12%] top-[52%] h-[300px] w-[300px] opacity-75"
            style={{
              background:
                "radial-gradient(circle, rgba(0,124,186,0.32) 0%, transparent 65%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.28] mix-blend-overlay"
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
              className="relative rounded-full border border-white/40 bg-white/25 p-2 text-brand-navy/70 shadow-[0_1px_0_rgba(255,255,255,0.55)_inset] transition-colors hover:bg-white/40 hover:text-brand-navy"
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
