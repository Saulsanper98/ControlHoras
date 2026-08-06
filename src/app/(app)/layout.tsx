import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManage } from "@/lib/roles";
import { AppShell } from "@/components/layout/app-shell";
import { AppProviders } from "@/components/providers/app-providers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const pendingSignatures = canManage(session.user.role)
    ? await prisma.timeSheet.count({ where: { status: "FIRMADO_EMPLEADO" } })
    : null;

  const pendingVacations = canManage(session.user.role)
    ? await prisma.vacationRequest.count({ where: { status: "PENDIENTE" } })
    : 0;

  return (
    <AppProviders>
      <AppShell
        role={session.user.role}
        userName={session.user.name ?? ""}
        roleLabel={
          session.user.role === "JEFA"
            ? "Responsable"
            : session.user.departmentName ?? "Empleado"
        }
        pendingSignatures={pendingSignatures}
        pendingVacations={pendingVacations}
      >
        {children}
      </AppShell>
    </AppProviders>
  );
}
