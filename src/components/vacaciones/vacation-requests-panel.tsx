"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  cancelVacationRequestAction,
  createVacationRequestAction,
} from "@/app/(app)/vacaciones/actions";

const STATUS_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  PENDIENTE: "bg-amber-500/15 text-amber-800",
  APROBADA: "bg-emerald-500/15 text-emerald-800",
  RECHAZADA: "bg-red-500/15 text-red-800",
  CANCELADA: "bg-brand-navy/8 text-slate-500",
};

type RequestRow = {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  employeeNotes: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

export function VacationRequestsPanel({
  year,
  requests,
}: {
  year: number;
  requests: RequestRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleCreate() {
    setMessage(null);
    startTransition(async () => {
      const result = await createVacationRequestAction(startDate, endDate, notes);
      if (result.ok) {
        setShowForm(false);
        setStartDate("");
        setEndDate("");
        setNotes("");
        setMessage({ type: "success", text: "Solicitud enviada." });
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error ?? "Error al enviar." });
      }
    });
  }

  function handleCancel(id: string) {
    if (!window.confirm("¿Cancelar esta solicitud?")) return;
    setMessage(null);
    startTransition(async () => {
      const result = await cancelVacationRequestAction(id);
      if (result.ok) {
        router.refresh();
      } else {
        setMessage({ type: "error", text: result.error ?? "Error al cancelar." });
      }
    });
  }

  const yearRequests = requests.filter((r) => new Date(r.startDate).getFullYear() === year);

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-brand-navy">Mis solicitudes de vacaciones</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-md bg-brand-blue px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-blue-dark"
        >
          <CalendarPlus className="h-4 w-4" />
          Nueva solicitud
        </button>
      </div>

      {message && (
        <p
          className={`mb-3 rounded-md px-3 py-2 text-sm ${
            message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}

      {showForm && (
        <div className="surface-muted mb-4 space-y-3 rounded-lg border border-brand-navy/10 p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="vac-start" className="mb-1 block text-xs text-slate-500">
                Desde
              </label>
              <input
                id="vac-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="surface-input rounded-md px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="vac-end" className="mb-1 block text-xs text-slate-500">
                Hasta
              </label>
              <input
                id="vac-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="surface-input rounded-md px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="vac-request-notes" className="mb-1 block text-xs text-slate-500">
              Notas (opcional)
            </label>
            <input
              id="vac-request-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="surface-input w-full rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <p className="text-xs text-slate-500">
            Se cuentan solo días laborables (L–V), excluyendo festivos.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={pending || !startDate || !endDate}
              className="rounded-md bg-brand-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark disabled:opacity-60"
            >
              Enviar solicitud
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="surface-btn rounded-md px-4 py-2 text-sm font-medium text-slate-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {yearRequests.length === 0 ? (
        <p className="text-sm text-slate-500">Sin solicitudes para {year}.</p>
      ) : (
        <div className="space-y-2">
          {yearRequests.map((r) => (
            <div
              key={r.id}
              className="surface-muted flex flex-wrap items-center justify-between gap-2 rounded-md border border-brand-navy/10 px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium text-brand-navy">
                  {new Date(r.startDate).toLocaleDateString("es-ES")} –{" "}
                  {new Date(r.endDate).toLocaleDateString("es-ES")}
                </span>
                <span className="ml-2 text-slate-500">({r.days} días)</span>
                {r.employeeNotes && (
                  <p className="mt-0.5 text-xs text-slate-500">{r.employeeNotes}</p>
                )}
                {r.rejectionReason && (
                  <p className="mt-0.5 text-xs text-red-600">Rechazo: {r.rejectionReason}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
                {r.status === "PENDIENTE" && (
                  <button
                    type="button"
                    onClick={() => handleCancel(r.id)}
                    disabled={pending}
                    aria-label="Cancelar solicitud"
                    className="text-slate-400 hover:text-red-600"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
