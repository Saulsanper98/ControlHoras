"use client";

import Link from "next/link";
import { Bell, ClipboardList, Umbrella } from "lucide-react";
import { useState } from "react";

export function NotificationPanel({
  pendingControls,
  pendingVacations,
}: {
  pendingControls: number;
  pendingVacations: number;
}) {
  const [open, setOpen] = useState(false);
  const total = pendingControls + pendingVacations;

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

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar notificaciones"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2 w-72 animate-toast-in rounded-xl border border-brand-navy/10 bg-[#eef4fa] p-2 shadow-xl ring-1 ring-brand-navy/5">
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
                      {pendingControls} control{pendingControls === 1 ? "" : "es"} por firmar
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
                      {pendingVacations} vacacion{pendingVacations === 1 ? "" : "es"} por revisar
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
