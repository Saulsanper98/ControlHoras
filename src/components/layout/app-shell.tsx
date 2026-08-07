"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, KeyRound, Maximize2, Minimize2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { CommandPalette } from "@/components/layout/command-palette";
import { NotificationPanel } from "@/components/layout/notification-panel";
import { PageTransition } from "@/components/ui/page-transition";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { useDensity } from "@/lib/density";
import { mobileTitleForPath } from "@/lib/nav";
import type { AppRole } from "@/lib/roles";

function atmosphereForPath(pathname: string) {
  if (pathname.includes("vacaciones")) return "warm";
  if (
    pathname.includes("control") ||
    pathname.includes("informe") ||
    pathname.includes("horario") ||
    pathname.includes("emplead") ||
    pathname.includes("auditoria")
  ) {
    return "cool";
  }
  if (pathname.includes("noticia")) return "default";
  return "default";
}

export function AppShell({
  role,
  userName,
  roleLabel,
  pendingSignatures,
  pendingVacations,
  inbox,
  children,
}: {
  role: AppRole;
  userName: string;
  roleLabel: string;
  pendingSignatures: number | null;
  pendingVacations: number;
  inbox: {
    id: string;
    title: string;
    body: string;
    href: string | null;
    createdAt: string;
    readAt: string | null;
  }[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { density, setDensity } = useDensity();
  const atmosphere = atmosphereForPath(pathname);
  const drawerId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const mobileTitle = mobileTitleForPath(pathname);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !drawerRef.current) return;
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    const t = window.setTimeout(() => {
      const closeBtn = drawerRef.current?.querySelector<HTMLElement>(
        'button[aria-label="Cerrar menú"]'
      );
      closeBtn?.focus();
    }, 20);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      menuButtonRef.current?.focus();
    };
  }, [open]);

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
        ref={drawerRef}
        id={drawerId}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label={open ? "Menú de navegación" : "Barra lateral"}
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 -translate-x-full flex-col bg-brand-navy transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          open ? "translate-x-0" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-6 md:justify-center">
          <img src="/brand/logo.svg" alt="CCMGC" className="h-10 w-auto" width={120} height={40} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="hit-area inline-flex items-center justify-center text-slate-300 hover:text-white md:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <Sidebar
            role={role}
            onNavigate={() => setOpen(false)}
            pendingSignatures={pendingSignatures}
            pendingVacations={pendingVacations}
          />
        </div>
        <div className="mx-3 mb-4 mt-auto rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
          <div className="mb-2 px-3 text-xs">
            <p className="font-medium text-slate-100">{userName}</p>
            <p className="text-slate-400">{roleLabel}</p>
          </div>
          <Link
            href="/cambiar-contrasena"
            className="mb-1 flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-brand-navy-light hover:text-white"
          >
            <KeyRound className="h-4 w-4" />
            Cambiar contraseña
          </Link>
          <SignOutButton />
        </div>
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[color:var(--app-canvas)]">
        <div aria-hidden="true" className="bg-atmosphere pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--app-gradient-top)_0%,var(--app-gradient-bottom)_100%)]" />
          <div
            className="glass-orb -left-24 top-[-12%] h-[440px] w-[440px] opacity-85 transition-opacity duration-700"
            style={{
              background:
                atmosphere === "warm"
                  ? "radial-gradient(circle, rgba(245,158,11,0.18) 0%, transparent 68%)"
                  : "radial-gradient(circle, rgba(0,124,186,0.30) 0%, transparent 68%)",
            }}
          />
          <div
            className="glass-orb -right-20 top-[6%] h-[360px] w-[360px] opacity-70"
            style={{
              background:
                atmosphere === "warm"
                  ? "radial-gradient(circle, rgba(245,234,97,0.22) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(245,234,97,0.20) 0%, transparent 70%)",
            }}
          />
        </div>

        <header className="glass-panel-header relative z-30 flex items-center gap-3 px-4 py-3">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setOpen(true)}
            className="hit-area inline-flex items-center justify-center text-brand-navy md:hidden"
            aria-label="Abrir menú"
            aria-expanded={open}
            aria-controls={drawerId}
          >
            <Menu className="h-6 w-6" />
          </button>
          <p className="font-display text-sm font-semibold text-brand-navy md:hidden">
            {mobileTitle}
          </p>
          <CommandPalette role={role} />
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setDensity(density === "compact" ? "comfortable" : "compact")}
            className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-brand-navy/10 hover:text-brand-navy md:block"
            title="Densidad de tablas del control horario"
            aria-label={
              density === "compact"
                ? "Activar modo cómodo de tablas del control horario"
                : "Activar modo compacto de tablas del control horario"
            }
          >
            {density === "compact" ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </button>
          <NotificationPanel
            pendingControls={pendingSignatures}
            pendingVacations={pendingVacations}
            inbox={inbox}
          />
        </header>

        <main className="relative z-10 flex-1 px-4 py-6 sm:px-6 sm:py-8 md:px-10">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {role === "EMPLEADO" && <OnboardingModal />}
    </div>
  );
}
