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
      distinct: ["departmentId"],
      orderBy: [{ departmentId: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const latestByDept = new Map(schedules.map((s) => [s.departmentId, s]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Horarios</h1>
        <p className="text-brand-navy/55">
          Sube el horario de trabajo por departamento (PDF o Excel). Todos los empleados del departamento verán el mismo archivo.
        </p>
      </div>

      <div className="space-y-2">
        {departments.map((dept) => {
          const s = latestByDept.get(dept.id);
          return (
            <ScheduleUploadRow
              key={dept.id}
              departmentId={dept.id}
              departmentName={dept.name}
              schedule={
                s
                  ? {
                      id: s.id,
                      fileName: s.fileName,
                      filePath: s.filePath,
                      createdAt: s.createdAt.toISOString(),
                    }
                  : null
              }
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
