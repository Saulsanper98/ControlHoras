import Link from "next/link";
import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollShadow } from "@/components/ui/scroll-shadow";
import { SectionBlock, TableSurface } from "@/components/ui/list-surface";
import { Select } from "@/components/ui/select";
import { Stagger } from "@/components/ui/stagger";
import { requireManagerSession } from "@/lib/auth-helpers";
import { formatDateTimeShort } from "@/lib/format-date";

const TAKE = 50;

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

function entityHref(entityType: string, entityId: string | null): string | null {
  if (!entityId) return null;
  switch (entityType) {
    case "TimeSheet":
      return `/jefa/controles/${entityId}`;
    case "VacationRequest":
      return `/jefa/vacaciones`;
    case "User":
      return `/jefa/empleados`;
    case "News":
      return `/jefa/noticias`;
    case "Schedule":
      return `/jefa/horarios`;
    default:
      return null;
  }
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; actor?: string; page?: string }>;
}) {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const params = await searchParams;
  const action = params.action?.trim() || undefined;
  const actorQuery = params.actor?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const skip = (page - 1) * TAKE;

  const where = {
    ...(action ? { action } : {}),
    ...(actorQuery
      ? {
          actor: {
            OR: [
              { name: { contains: actorQuery, mode: "insensitive" as const } },
              { email: { contains: actorQuery, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const [logs, total, actionRows] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: TAKE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      distinct: ["action"],
      select: { action: true },
      orderBy: { action: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / TAKE));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function pageHref(p: number) {
    const q = new URLSearchParams();
    if (action) q.set("action", action);
    if (actorQuery) q.set("actor", actorQuery);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/jefa/auditoria?${s}` : "/jefa/auditoria";
  }

  return (
    <div className="space-y-6">
      <Stagger>
        <PageHeader
          title="Auditoría"
          description="Registro de firmas, aprobaciones, altas y cambios relevantes."
        />
      </Stagger>

      <SectionBlock>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <label htmlFor="audit-action" className="mb-1 block text-xs font-medium text-slate-500">
              Acción
            </label>
            <Select id="audit-action" name="action" defaultValue={action ?? ""}>
              <option value="">Todas</option>
              {actionRows.map((a) => (
                <option key={a.action} value={a.action}>
                  {ACTION_LABEL[a.action] ?? a.action}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[12rem] flex-1">
            <label htmlFor="audit-actor" className="mb-1 block text-xs font-medium text-slate-500">
              Actor
            </label>
            <input
              id="audit-actor"
              name="actor"
              type="search"
              defaultValue={actorQuery ?? ""}
              placeholder="Nombre o email…"
              className="field-control w-full rounded-md px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="btn-primary">
            Filtrar
          </button>
          {(action || actorQuery) && (
            <Link href="/jefa/auditoria" className="btn-ghost">
              Limpiar
            </Link>
          )}
        </form>
      </SectionBlock>

      {logs.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Sin eventos"
          description={
            action || actorQuery
              ? "No hay eventos que coincidan con los filtros."
              : "Todavía no hay eventos de auditoría registrados."
          }
        />
      ) : (
        <>
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
                  {logs.map((l) => {
                    const href = entityHref(l.entityType, l.entityId);
                    const label = `${ENTITY_LABEL[l.entityType] ?? l.entityType}${
                      l.entityId ? ` · ${l.entityId.slice(0, 8)}…` : ""
                    }`;
                    return (
                      <tr key={l.id} className="border-b border-brand-navy/5 last:border-0">
                        <td className="whitespace-nowrap px-0 py-2 text-slate-500 sm:px-3">
                          {formatDateTimeShort(l.createdAt)}
                        </td>
                        <td className="px-3 py-2">{l.actor?.name ?? "Sistema"}</td>
                        <td className="px-3 py-2 font-medium text-brand-navy">
                          {ACTION_LABEL[l.action] ?? l.action}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {href ? (
                            <Link
                              href={href}
                              className="text-brand-blue hover:underline"
                              title={l.entityId ?? undefined}
                            >
                              {label}
                            </Link>
                          ) : (
                            <span title={l.entityId ?? undefined}>{label}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{l.detail ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableSurface>
          </ScrollShadow>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <p>
              Página {page} de {totalPages} · {total} evento{total === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              {hasPrev ? (
                <Link href={pageHref(page - 1)} className="btn-ghost">
                  Anterior
                </Link>
              ) : (
                <button type="button" disabled className="btn-ghost disabled:opacity-40">
                  Anterior
                </button>
              )}
              {hasNext ? (
                <Link href={pageHref(page + 1)} className="btn-ghost">
                  Siguiente
                </Link>
              ) : (
                <button type="button" disabled className="btn-ghost disabled:opacity-40">
                  Siguiente
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
