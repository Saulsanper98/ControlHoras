"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { DateField } from "@/components/ui/date-field";
import { countVacationDays } from "@/lib/holidays";
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
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function closeModal() {
    setShowModal(false);
    setStartDate("");
    setEndDate("");
    setNotes("");
  }

  function handleCreate() {
    setMessage(null);
    startTransition(async () => {
      const result = await createVacationRequestAction(startDate, endDate, notes);
      if (result.ok) {
        closeModal();
        setMessage({ type: "success", text: "Solicitud enviada correctamente." });
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

  const estimatedDays = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return null;
    const [ys, ms, ds] = startDate.split("-").map(Number);
    const [ye, me, de] = endDate.split("-").map(Number);
    return countVacationDays(new Date(ys, ms - 1, ds), new Date(ye, me - 1, de));
  }, [startDate, endDate]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-brand-navy">Mis solicitudes</h2>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue-dark"
        >
          <CalendarPlus className="h-4 w-4" />
          Nueva solicitud
        </button>
      </div>

      {message && (
        <p
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            message.type === "success" ? "bg-emerald-500/12 text-emerald-800" : "bg-red-500/12 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      {yearRequests.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Sin solicitudes para {year}.</p>
      ) : (
        <ul className="mt-4 divide-y divide-brand-navy/8">
          {yearRequests.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-brand-navy">
                  {new Date(r.startDate).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  –{" "}
                  {new Date(r.endDate).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  <span className="ml-2 font-normal text-slate-500">{r.days} días</span>
                </p>
                {r.employeeNotes && (
                  <p className="mt-0.5 truncate text-xs text-slate-500">{r.employeeNotes}</p>
                )}
                {r.rejectionReason && (
                  <p className="mt-0.5 text-xs text-red-600">{r.rejectionReason}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
                {r.status === "PENDIENTE" && (
                  <button
                    type="button"
                    onClick={() => handleCancel(r.id)}
                    disabled={pending}
                    aria-label="Cancelar solicitud"
                    className="rounded-md p-1 text-slate-400 transition hover:bg-red-500/10 hover:text-red-600"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={showModal} onClose={closeModal} title="Nueva solicitud de vacaciones">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateField
              id="vac-start"
              label="Desde"
              value={startDate}
              onChange={(v) => {
                setStartDate(v);
                if (endDate && v > endDate) setEndDate("");
              }}
            />
            <DateField
              id="vac-end"
              label="Hasta"
              value={endDate}
              min={startDate || undefined}
              onChange={setEndDate}
            />
          </div>

          {estimatedDays !== null && (
            <p className="rounded-lg bg-brand-blue/8 px-3 py-2 text-sm text-brand-navy">
              <span className="font-semibold tabular-nums">{estimatedDays}</span>{" "}
              día{estimatedDays === 1 ? "" : "s"} laborable{estimatedDays === 1 ? "" : "s"}
              <span className="text-slate-500"> · sin fines de semana ni festivos</span>
            </p>
          )}

          <div>
            <label htmlFor="vac-request-notes" className="mb-1.5 block text-xs font-medium text-slate-500">
              Notas (opcional)
            </label>
            <textarea
              id="vac-request-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Motivo o comentario para la responsable"
              className="field-control w-full resize-none px-3 py-2 text-sm text-brand-navy placeholder:text-slate-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-navy/6"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={pending || !startDate || !endDate}
              className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue-dark disabled:opacity-50"
            >
              {pending ? "Enviando…" : "Enviar solicitud"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
