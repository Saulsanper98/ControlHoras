import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EmployeeCreateForm } from "@/components/jefa/employee-row-actions";
import { EmployeesDirectory } from "@/components/jefa/employees-directory";
import { PageHeader } from "@/components/ui/page-header";
import { Stagger } from "@/components/ui/stagger";
import { requireManagerSession } from "@/lib/auth-helpers";

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

  const activeCount = users.filter((u) => u.active).length;

  return (
    <div className="space-y-8">
      <Stagger>
        <PageHeader
          title="Empleados"
          description={
            users.length === 0
              ? "Da de alta empleados para gestionar controles y vacaciones por departamento."
              : `${activeCount} activos de ${users.length} en total, agrupados por departamento.`
          }
        >
          <EmployeeCreateForm departments={departments} />
        </PageHeader>
      </Stagger>

      <EmployeesDirectory departments={departments} users={users} />
    </div>
  );
}
