import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollShadow } from "@/components/ui/scroll-shadow";
import { TableSurface } from "@/components/ui/list-surface";
import { requireManagerSession } from "@/lib/auth-helpers";

const ACTION_LABEL: Record<string, string> = {
  TIMESHEET_SIGNED: "Control firmado",
  TIMESHEET_REJECTED: "Control rechazado",
  LEAVE_APPROVED: "Vacaciones aprobadas",
  LEAVE_REJECTED: "Vacaciones rechazadas",
  EMPLOYEE_CREATED: "Empleado dado de alta",
  EMPLOYEE_UPDATED: "Empleado actualizado",
  EMPLOYEE_ACTIVATED: "Empleado activado",
  EMPLOYEE_DEACTIVATED: "Empleado desactivado",
  EMPLOYEE_PASSWORD_RESET: "Contraseña restablecida",
  SCHEDULE_UPLOADED: "Horario subido",
  SCHEDULE_DELETED: "Horario eliminado",
  NEWS_CREATED: "Noticia creada",
  NEWS_UPDATED: "Noticia actualizada",
  NEWS_DELETED: "Noticia eliminada",
};

const ENTITY_LABEL: Record<string, string> = {
  TimeSheet: "Control",
  VacationRequest: "Solicitud",
  User: "Usuario",
  Schedule: "Horario",
  News: "Noticia",
};

export default async function AuditoriaPage() {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const logs = await prisma.auditLog.findMany({
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoría"
        description="Registro de firmas, aprobaciones, altas y cambios relevantes."
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Sin eventos"
          description="Todavía no hay eventos de auditoría registrados."
        />
      ) : (
        <ScrollShadow>
          <TableSurface>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-brand-navy/10 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-0 py-2 sm:px-3">Fecha</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Acción</th>
                  <th className="px-3 py-2">Entidad</th>
                  <th className="px-3 py-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-brand-navy/5 last:border-0">
                    <td className="whitespace-nowrap px-0 py-2 text-slate-500 sm:px-3">
                      {l.createdAt.toLocaleString("es-ES")}
                    </td>
                    <td className="px-3 py-2">{l.actor?.name ?? "Sistema"}</td>
                    <td className="px-3 py-2 font-medium text-brand-navy">
                      {ACTION_LABEL[l.action] ?? l.action}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      <span title={l.entityId ?? undefined}>
                        {ENTITY_LABEL[l.entityType] ?? l.entityType}
                        {l.entityId ? ` · ${l.entityId.slice(0, 8)}…` : ""}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">{l.detail ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableSurface>
        </ScrollShadow>
      )}
    </div>
  );
}
