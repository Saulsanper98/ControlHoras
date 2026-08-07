"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { DateField } from "@/components/ui/date-field";
import { FieldSelect } from "@/components/ui/field-select";
import { ListSurface } from "@/components/ui/list-surface";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionTitle } from "@/components/ui/section-title";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { countVacationDays } from "@/lib/holidays";
import { formatDate, yearFromDateKey } from "@/lib/format-date";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { LEAVE_TYPE_LABEL } from "@/lib/labels";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  cancelVacationRequestAction,
  createVacationRequestAction,
} from "@/app/(app)/vacaciones/actions";

type RequestRow = {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  leaveType?: string;
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
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [leaveType, setLeaveType] = useState<"VACACIONES" | "ASUNTOS_PROPIOS" | "MEDIO_DIA">("VACACIONES");

  function closeModal() {
    setShowModal(false);
    setStartDate("");
    setEndDate("");
    setNotes("");
    setLeaveType("VACACIONES");
  }

  function handleCreate() {
    startTransition(async () => {
      const result = await createVacationRequestAction(startDate, endDate, notes, leaveType);
      if (result.ok) {
        closeModal();
        showToast("Solicitud enviada correctamente.");
        router.refresh();
      } else {
        showToast(result.error ?? "Error al enviar.", "error");
      }
    });
  }

  function handleCancel(id: string) {
    void (async () => {
      const ok = await confirm({
        title: "Cancelar solicitud",
        message: "¿Cancelar esta solicitud de vacaciones?",
        variant: "danger",
        confirmLabel: "Cancelar solicitud",
      });
      if (!ok) return;
      startTransition(async () => {
        const result = await cancelVacationRequestAction(id);
        if (result.ok) {
          showToast("Solicitud cancelada.");
          router.refresh();
        } else {
          showToast(result.error ?? "Error al cancelar.", "error");
        }
      });
    })();
  }

  const yearRequests = requests.filter((r) => yearFromDateKey(r.startDate) === year);

  const estimatedDays = useMemo(() => {
    if (!startDate || !endDate || endDate < startDate) return null;
    if (leaveType === "MEDIO_DIA") return 0.5;
    if (leaveType === "ASUNTOS_PROPIOS") {
      const [ys, ms, ds] = startDate.split("-").map(Number);
      const [ye, me, de] = endDate.split("-").map(Number);
      return countVacationDays(new Date(ys, ms - 1, ds), new Date(ye, me - 1, de));
    }
    const [ys, ms, ds] = startDate.split("-").map(Number);
    const [ye, me, de] = endDate.split("-").map(Number);
    return countVacationDays(new Date(ys, ms - 1, ds), new Date(ye, me - 1, de));
  }, [startDate, endDate, leaveType]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionTitle>Mis solicitudes</SectionTitle>
          <p className="mt-0.5 text-xs text-slate-500">
            Vacaciones, asuntos propios o medio día · {year}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <CalendarPlus className="h-4 w-4" />
          Nueva solicitud
        </button>
      </div>

      {yearRequests.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={CalendarPlus}
          title={`Sin solicitudes para ${year}`}
          description="Pulsa «Nueva solicitud» para pedir vacaciones, asuntos propios o medio día."
          action={
            <button type="button" onClick={() => setShowModal(true)} className="btn-primary">
              Nueva solicitud
            </button>
          }
        />
      ) : (
        <ListSurface className="mt-4">
          {yearRequests.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-brand-navy">
                  {formatDate(r.startDate, { day: "numeric", month: "short" })}
                  {" – "}
                  {formatDate(r.endDate, { day: "numeric", month: "short", year: "numeric" })}
                  <span className="ml-2 font-normal tabular-nums text-slate-500">
                    {r.days} día{r.days === 1 ? "" : "s"}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {LEAVE_TYPE_LABEL[r.leaveType ?? "VACACIONES"] ?? r.leaveType}
                  {r.employeeNotes ? ` · ${r.employeeNotes}` : ""}
                  {" · "}
                  {formatRelativeTime(r.createdAt)}
                </p>
                {r.rejectionReason && (
                  <p className="mt-0.5 text-xs text-red-600">Motivo: {r.rejectionReason}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={r.status} preset="leave" />
                {r.status === "PENDIENTE" && (
                  <button
                    type="button"
                    onClick={() => handleCancel(r.id)}
                    disabled={pending}
                    className="btn-ghost px-2 py-1 text-xs text-slate-500 hover:text-red-600"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </ListSurface>
      )}

      <Modal open={showModal} onClose={closeModal} title="Nueva solicitud">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Tipo</label>
            <FieldSelect
              autoFocus
              value={leaveType}
              onChange={(v) => {
                const next = v as typeof leaveType;
                setLeaveType(next);
                if (next === "MEDIO_DIA" && startDate) setEndDate(startDate);
              }}
              options={[
                { value: "VACACIONES", label: "Vacaciones" },
                { value: "ASUNTOS_PROPIOS", label: "Asuntos propios" },
                { value: "MEDIO_DIA", label: "Medio día" },
              ]}
            />
            {leaveType === "ASUNTOS_PROPIOS" && (
              <p className="mt-1.5 text-xs text-slate-500">
                Los asuntos propios no descuentan del saldo de vacaciones.
              </p>
            )}
            {leaveType === "MEDIO_DIA" && (
              <p className="mt-1.5 text-xs text-slate-500">
                Se cuenta como medio día laborable (0,5).
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DateField
              id="vac-start"
              label="Desde"
              value={startDate}
              rangeStart={startDate || undefined}
              rangeEnd={endDate || undefined}
              onChange={(v) => {
                setStartDate(v);
                if (leaveType === "MEDIO_DIA") setEndDate(v);
                else if (endDate && v > endDate) setEndDate("");
              }}
            />
            <DateField
              id="vac-end"
              label="Hasta"
              value={endDate}
              min={startDate || undefined}
              rangeStart={startDate || undefined}
              rangeEnd={endDate || undefined}
              onChange={setEndDate}
              disabled={leaveType === "MEDIO_DIA"}
            />
          </div>

          {estimatedDays !== null && (
            <p className="border-y border-brand-navy/10 py-2 text-sm text-brand-navy">
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
            <button type="button" onClick={closeModal} className="btn-ghost">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={pending || !startDate || !endDate}
              className="btn-primary"
            >
              {pending ? "Enviando…" : "Enviar solicitud"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
