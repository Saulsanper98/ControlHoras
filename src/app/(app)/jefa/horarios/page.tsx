import { redirect } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ScheduleUploadRow } from "@/components/jefa/schedule-upload-row";
import { ListSurface } from "@/components/ui/list-surface";
import { Stagger } from "@/components/ui/stagger";
import { requireManagerSession } from "@/lib/auth-helpers";

export default async function HorariosPage() {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const [departments, schedules] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.schedule.findMany({
      orderBy: [{ departmentId: "asc" }, { validFrom: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const byDept = new Map<string, typeof schedules>();
  for (const s of schedules) {
    const list = byDept.get(s.departmentId) ?? [];
    list.push(s);
    byDept.set(s.departmentId, list);
  }

  const withSchedule = departments.filter((d) => (byDept.get(d.id) ?? []).length > 0).length;
  const withoutSchedule = departments.length - withSchedule;

  return (
    <div className="space-y-8">
      <Stagger>
        <PageHeader
          title="Horarios"
          description="Publica el cuadrante por departamento. Se conserva el historial de versiones."
        />
      </Stagger>

      {departments.length > 0 && (
        <div className="grid grid-cols-2 divide-x divide-[color:var(--surface-divider)] border-y border-[color:var(--surface-divider)] sm:grid-cols-3">
          <div className="py-4 sm:px-4">
            <p className="text-sm text-slate-500">Departamentos</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-brand-navy">
              {departments.length}
            </p>
          </div>
          <div className="py-4 sm:px-4">
            <p className="text-sm text-slate-500">Con horario</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-emerald-800">
              {withSchedule}
            </p>
          </div>
          <div className="col-span-2 py-4 sm:col-span-1 sm:px-4">
            <p className="text-sm text-slate-500">Sin horario</p>
            <p
              className={`mt-1 font-display text-2xl font-semibold tabular-nums ${
                withoutSchedule > 0 ? "text-amber-800" : "text-brand-navy"
              }`}
            >
              {withoutSchedule}
            </p>
          </div>
        </div>
      )}

      {departments.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Sin departamentos"
          description="Configura departamentos para poder publicar cuadrantes de horario."
        />
      ) : (
        <ListSurface>
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
        </ListSurface>
      )}
    </div>
  );
}
