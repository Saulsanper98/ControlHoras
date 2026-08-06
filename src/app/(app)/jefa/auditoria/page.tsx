import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-brand-navy/10 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Acción</th>
              <th className="px-3 py-2">Entidad</th>
              <th className="px-3 py-2">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-brand-navy/5">
                <td className="px-3 py-2 whitespace-nowrap text-slate-500">
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
      </Card>

      {logs.length === 0 && (
        <p className="text-sm text-slate-500">Todavía no hay eventos de auditoría.</p>
      )}
    </div>
  );
}
