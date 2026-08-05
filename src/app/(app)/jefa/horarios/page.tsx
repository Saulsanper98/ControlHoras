import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { ScheduleUploadRow } from "@/components/jefa/schedule-upload-row";

export default async function HorariosPage() {
  const [employees, schedules] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["EMPLEADO", "ADMIN"] }, active: true },
      include: { department: true },
      orderBy: [{ department: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.schedule.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const latestByUser = new Map<string, (typeof schedules)[number]>();
  for (const s of schedules) {
    if (!latestByUser.has(s.userId)) latestByUser.set(s.userId, s);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Horarios</h1>
        <p className="text-slate-500">Sube el horario de trabajo asignado a cada empleado (PDF o Excel).</p>
      </div>

      <div className="space-y-2">
        {employees.map((e) => {
          const s = latestByUser.get(e.id);
          return (
            <ScheduleUploadRow
              key={e.id}
              userId={e.id}
              name={e.name}
              departmentName={e.department?.name ?? "—"}
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
        {employees.length === 0 && (
          <Card className="text-sm text-slate-400">No hay empleados dados de alta.</Card>
        )}
      </div>
    </div>
  );
}
