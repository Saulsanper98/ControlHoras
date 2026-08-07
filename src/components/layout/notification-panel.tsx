"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { Bell, ClipboardList, MessageSquare, Umbrella } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(app)/notifications/actions";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { InlineEmpty } from "@/components/ui/inline-empty";

type InboxItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
  readAt: string | null;
};

function InboxMessage({
  n,
  onNavigate,
  onMarkRead,
  pending,
}: {
  n: InboxItem;
  onNavigate: () => void;
  onMarkRead: (id: string) => void;
  pending: boolean;
}) {
  const content = (
    <>
      <p className={n.readAt ? "font-medium" : "font-semibold"}>{n.title}</p>
      <p className="text-xs text-slate-500">{n.body}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">
        {formatRelativeTime(new Date(n.createdAt))}
      </p>
    </>
  );

  const className = `block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-brand-navy/6 ${
    n.readAt ? "text-slate-500" : "text-brand-navy"
  }`;

  if (n.href) {
    return (
      <Link
        href={n.href}
        onClick={() => {
          onNavigate();
          if (!n.readAt) onMarkRead(n.id);
        }}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending || !!n.readAt}
      onClick={() => onMarkRead(n.id)}
      className={className}
    >
      {content}
    </button>
  );
}

export function NotificationPanel({
  pendingControls,
  pendingVacations,
  inbox,
}: {
  pendingControls: number | null;
  pendingVacations: number;
  inbox: InboxItem[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pending, startTransition] = useTransition();
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const unreadInbox = inbox.filter((n) => !n.readAt);
  const readInbox = inbox.filter((n) => n.readAt);
  const managerPending = (pendingControls ?? 0) + pendingVacations;
  const total = managerPending + unreadInbox.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
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

    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      first?.focus();
    }, 20);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      triggerRef.current?.focus();
    };
  }, [open]);

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  function markRead(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hit-area relative inline-flex items-center justify-center rounded-full text-slate-500 transition hover:bg-brand-navy/10 hover:text-brand-navy"
        aria-label={
          total > 0
            ? `${total} notificaciones pendientes`
            : readInbox.length > 0
              ? "Sin pendientes"
              : "Sin notificaciones"
        }
        aria-expanded={open}
        aria-controls={panelId}
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
              className="fixed inset-0 z-[190] bg-brand-navy/20 backdrop-blur-[1px]"
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              id={panelId}
              role="region"
              aria-label="Notificaciones"
              className="surface-menu fixed right-4 top-14 z-[200] w-80 rounded-xl p-2 sm:right-6"
            >
              <div className="flex items-center justify-between px-2 py-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Pendientes
                </p>
                {unreadInbox.length > 0 && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={markAll}
                    className="inline-flex min-h-11 items-center px-2 text-[11px] font-medium text-brand-blue hover:underline disabled:opacity-50"
                  >
                    Marcar leídas
                  </button>
                )}
              </div>

              {total === 0 && readInbox.length === 0 ? (
                <InlineEmpty>Todo al día</InlineEmpty>
              ) : (
                <ul className="max-h-80 space-y-1 overflow-y-auto">
                  {pendingControls !== null && pendingControls > 0 && (
                    <li>
                      <Link
                        href="/jefa/controles"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-brand-navy hover:bg-brand-navy/6"
                      >
                        <ClipboardList className="h-4 w-4 shrink-0 text-brand-blue" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">Controles por firmar</span>
                          <span className="text-xs text-slate-500">
                            {pendingControls === 1
                              ? "1 control pendiente"
                              : `${pendingControls} controles pendientes`}
                          </span>
                        </span>
                      </Link>
                    </li>
                  )}
                  {pendingControls !== null && pendingVacations > 0 && (
                    <li>
                      <Link
                        href="/jefa/vacaciones"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-brand-navy hover:bg-brand-navy/6"
                      >
                        <Umbrella className="h-4 w-4 shrink-0 text-amber-600" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">
                            Solicitudes de vacaciones por revisar
                          </span>
                          <span className="text-xs text-slate-500">
                            {pendingVacations === 1
                              ? "1 solicitud pendiente"
                              : `${pendingVacations} solicitudes pendientes`}
                          </span>
                        </span>
                      </Link>
                    </li>
                  )}
                  {unreadInbox.length > 0 && (
                    <li className="px-2 pb-0.5 pt-2">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <MessageSquare className="h-3 w-3" />
                        Mensajes
                      </p>
                    </li>
                  )}
                  {unreadInbox.map((n) => (
                    <li key={n.id}>
                      <InboxMessage
                        n={n}
                        pending={pending}
                        onNavigate={() => setOpen(false)}
                        onMarkRead={markRead}
                      />
                    </li>
                  ))}
                  {readInbox.length > 0 && (
                    <li className="px-2 pb-0.5 pt-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Anteriores
                      </p>
                    </li>
                  )}
                  {readInbox.map((n) => (
                    <li key={n.id}>
                      <InboxMessage
                        n={n}
                        pending={pending}
                        onNavigate={() => setOpen(false)}
                        onMarkRead={markRead}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
