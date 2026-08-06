"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { Bell, ClipboardList, Umbrella } from "lucide-react";
import { useEffect, useState } from "react";

function vacationLabel(count: number) {
  return count === 1 ? "1 vacación por revisar" : `${count} vacaciones por revisar`;
}

function controlLabel(count: number) {
  return count === 1 ? "1 control por firmar" : `${count} controles por firmar`;
}

export function NotificationPanel({
  pendingControls,
  pendingVacations,
}: {
  pendingControls: number;
  pendingVacations: number;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const total = pendingControls + pendingVacations;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 text-slate-500 transition hover:bg-brand-navy/10 hover:text-brand-navy"
        aria-label={
          total > 0
            ? `${total} notificaciones pendientes`
            : "Sin notificaciones"
        }
      >
        <Bell className="h-5 w-5" />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {mounted &&
        open &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Cerrar notificaciones"
              className="fixed inset-0 z-[190] bg-transparent"
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed right-4 top-14 z-[200] w-72 rounded-xl border border-brand-navy/10 p-2 shadow-xl ring-1 ring-brand-navy/5 sm:right-6"
              style={{
                backgroundColor: "#ffffff",
                opacity: 1,
                isolation: "isolate",
              }}
            >
              <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pendientes
              </p>
              {total === 0 ? (
                <p className="px-2 py-4 text-center text-sm text-slate-500">Todo al día</p>
              ) : (
                <ul className="space-y-1">
                  {pendingControls > 0 && (
                    <li>
                      <Link
                        href="/jefa/controles"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-brand-navy hover:bg-brand-navy/6"
                      >
                        <ClipboardList className="h-4 w-4 text-brand-blue" />
                        {controlLabel(pendingControls)}
                      </Link>
                    </li>
                  )}
                  {pendingVacations > 0 && (
                    <li>
                      <Link
                        href="/jefa/vacaciones"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-brand-navy hover:bg-brand-navy/6"
                      >
                        <Umbrella className="h-4 w-4 text-amber-600" />
                        {vacationLabel(pendingVacations)}
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
