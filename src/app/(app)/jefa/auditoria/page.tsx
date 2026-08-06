import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { TableSurface } from "@/components/ui/list-surface";
import { requireManagerSession } from "@/lib/auth-helpers";

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
        <p className="border-y border-brand-navy/10 py-6 text-sm text-slate-500">
          Todavía no hay eventos de auditoría.
        </p>
      ) : (
        <TableSurface>
          <table className="w-full text-left text-sm">
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
                  <td className="px-3 py-2 font-medium text-brand-navy">{l.action}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {l.entityType}
                    {l.entityId ? ` · ${l.entityId.slice(0, 8)}…` : ""}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{l.detail ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableSurface>
      )}
    </div>
  );
}
