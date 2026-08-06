import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { ScheduleUploadRow } from "@/components/jefa/schedule-upload-row";
import { requireManagerSession } from "@/lib/auth-helpers";

export default async function HorariosPage() {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const [departments, schedules] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.schedule.findMany({
      orderBy: [{ departmentId: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const byDept = new Map<string, typeof schedules>();
  for (const s of schedules) {
    const list = byDept.get(s.departmentId) ?? [];
    list.push(s);
    byDept.set(s.departmentId, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Horarios</h1>
        <p className="text-brand-navy/55">
          Sube el horario por departamento. Se conserva el historial de versiones.
        </p>
      </div>

      <div className="space-y-2">
        {departments.map((dept) => {
          const list = byDept.get(dept.id) ?? [];
          const latest = list[0] ?? null;
          return (
            <ScheduleUploadRow
              key={dept.id}
              departmentId={dept.id}
              departmentName={dept.name}
              schedule={
                latest
                  ? {
                      id: latest.id,
                      fileName: latest.fileName,
                      filePath: latest.filePath,
                      createdAt: latest.createdAt.toISOString(),
                      validFrom: latest.validFrom.toISOString(),
                    }
                  : null
              }
              history={list.map((s) => ({
                id: s.id,
                fileName: s.fileName,
                filePath: s.filePath,
                createdAt: s.createdAt.toISOString(),
                validFrom: s.validFrom.toISOString(),
              }))}
            />
          );
        })}
        {departments.length === 0 && (
          <Card className="text-sm text-slate-500">No hay departamentos configurados.</Card>
        )}
      </div>
    </div>
  );
}
