import { redirect } from "next/navigation";
import { Users, Mail, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { requireManagerSession } from "@/lib/auth-helpers";

type EmployeeRowUser = {
  id: string;
  name: string;
  email: string;
  role: "EMPLEADO" | "JEFA" | "ADMIN";
  active: boolean;
  departmentId: string | null;
};

export default async function EmpleadosPage() {
  const session = await requireManagerSession();
  if (!session) redirect("/");

  const [departments, users] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: { in: ["EMPLEADO", "ADMIN"] } },
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
      <div>
        <h1 className="text-2xl font-semibold text-brand-navy">Empleados</h1>
        <p className="text-slate-500">
          {activeCount} activos de {users.length} en total, agrupados por departamento.
        </p>
      </div>

      {departments.map((dept) => {
        const list = usersByDept.get(dept.id) ?? [];
        if (list.length === 0) return null;
        return (
          <section key={dept.id}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {dept.name} ({list.length})
            </h2>
            <div className="space-y-2">
              {list.map((u) => (
                <EmployeeRow key={u.id} user={u} />
              ))}
            </div>
          </section>
        );
      })}

      {noDept.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Sin departamento ({noDept.length})
          </h2>
          <div className="space-y-2">
            {noDept.map((u) => (
              <EmployeeRow key={u.id} user={u} />
            ))}
          </div>
        </section>
      )}

      {users.length === 0 && (
        <Card className="text-sm text-slate-400">No hay empleados dados de alta.</Card>
      )}
    </div>
  );
}

function EmployeeRow({ user }: { user: EmployeeRowUser }) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-brand-blue/10 p-2 text-brand-blue">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <p className="flex items-center gap-2 font-medium text-brand-navy">
            {user.name}
            {user.role === "ADMIN" && (
              <span className="flex items-center gap-1 rounded-full bg-brand-yellow/40 px-2 py-0.5 text-xs font-medium text-brand-navy">
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            )}
          </p>
          <p className="flex items-center gap-1 text-sm text-slate-500">
            <Mail className="h-3.5 w-3.5" /> {user.email}
          </p>
        </div>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          user.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {user.active ? "Activo" : "Inactivo"}
      </span>
    </Card>
  );
}
