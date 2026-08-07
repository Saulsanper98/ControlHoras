import { redirect } from "next/navigation";
import { Mail, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EmployeeCreateForm, EmployeeRowActions } from "@/components/jefa/employee-row-actions";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionEyebrow } from "@/components/ui/section-title";
import { ListSurface } from "@/components/ui/list-surface";
import { requireManagerSession } from "@/lib/auth-helpers";

type EmployeeRowUser = {
  id: string;
  name: string;
  email: string;
  role: "EMPLEADO" | "JEFA";
  active: boolean;
  departmentId: string | null;
};

export default async function EmpleadosPage() {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const [departments, users] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "EMPLEADO" },
      select: { id: true, name: true, email: true, role: true, active: true, departmentId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const usersByDept = new Map<string, EmployeeRowUser[]>();
  const noDept: EmployeeRowUser[] = [];
  for (const u of users) {
    if (!u.departmentId) {
      noDept.push(u);
      continue;
    }
    const list = usersByDept.get(u.departmentId) ?? [];
    list.push(u);
    usersByDept.set(u.departmentId, list);
  }

  const activeCount = users.filter((u) => u.active).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Empleados"
        description={`${activeCount} activos de ${users.length} en total, agrupados por departamento.`}
      >
        <EmployeeCreateForm departments={departments} />
      </PageHeader>

      {departments.map((dept) => {
        const list = usersByDept.get(dept.id) ?? [];
        if (list.length === 0) return null;
        return (
          <section key={dept.id}>
            <SectionEyebrow>
              {dept.name} ({list.length})
            </SectionEyebrow>
            <ListSurface>
              {list.map((u) => (
                <EmployeeRow key={u.id} user={u} departments={departments} />
              ))}
            </ListSurface>
          </section>
        );
      })}

      {noDept.length > 0 && (
        <section>
          <SectionEyebrow>Sin departamento ({noDept.length})</SectionEyebrow>
          <ListSurface>
            {noDept.map((u) => (
              <EmployeeRow key={u.id} user={u} departments={departments} />
            ))}
          </ListSurface>
        </section>
      )}

      {users.length === 0 && (
        <EmptyState
          icon={Users}
          title="No hay empleados"
          description="Da de alta el primer empleado para empezar a gestionar controles y vacaciones."
        />
      )}
    </div>
  );
}

function EmployeeRow({
  user,
  departments,
}: {
  user: EmployeeRowUser;
  departments: { id: string; name: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-medium text-brand-navy">{user.name}</p>
        <p className="flex items-center gap-1 text-sm text-slate-500">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{user.email}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            user.active ? "bg-emerald-500/12 text-emerald-800" : "bg-brand-navy/[0.06] text-slate-500"
          }`}
        >
          {user.active ? "Activo" : "Inactivo"}
        </span>
        <EmployeeRowActions user={user} departments={departments} />
      </div>
    </div>
  );
}
