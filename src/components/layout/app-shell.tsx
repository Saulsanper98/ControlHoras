"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, Bell, KeyRound } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { SignOutButton } from "@/components/layout/sign-out-button";
import type { AppRole } from "@/lib/roles";

export function AppShell({
  role,
  userName,
  roleLabel,
  pendingSignatures,
  children,
}: {
  role: AppRole;
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

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#c8d5e4]">
        {/* Atmósfera con color suficiente para que el frost se lea */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#d5e2ef_0%,#b8c9db_100%)]" />
          <div
            className="glass-orb -left-24 top-[-12%] h-[440px] w-[440px] opacity-85"
            style={{
              background:
                "radial-gradient(circle, rgba(0,124,186,0.30) 0%, transparent 68%)",
            }}
          />
          <div
            className="glass-orb -right-20 top-[6%] h-[360px] w-[360px] opacity-70"
            style={{
              background:
                "radial-gradient(circle, rgba(245,234,97,0.20) 0%, transparent 70%)",
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
              className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-brand-navy/10 hover:text-brand-navy"
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
