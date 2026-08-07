import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canManage, hasOwnEmployeeData } from "@/lib/roles";
import { AppShell } from "@/components/layout/app-shell";
import { AppProviders } from "@/components/providers/app-providers";

/**
 * Si el client de Prisma no se regeneró tras un pull, los delegates nuevos
 * (vacationRequest, notification, …) quedan `undefined` y el layout petaba
 * con "Cannot read properties of undefined (reading 'count')".
 */
function assertPrismaReady() {
  const missing: string[] = [];
  if (typeof prisma.vacationRequest?.count !== "function") missing.push("vacationRequest");
  if (typeof prisma.notification?.findMany !== "function") missing.push("notification");
  if (typeof prisma.timeSheet?.count !== "function") missing.push("timeSheet");
  if (missing.length === 0) return;
  throw new Error(
    `Prisma Client desactualizado (faltan: ${missing.join(", ")}). ` +
      `En la carpeta del proyecto ejecuta: npx prisma generate && reinicia npm run dev`
  );
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  assertPrismaReady();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const pendingSignatures = canManage(session.user.role)
    ? await prisma.timeSheet.count({ where: { status: "FIRMADO_EMPLEADO" } })
    : null;

  const pendingVacations = canManage(session.user.role)
    ? await prisma.vacationRequest.count({ where: { status: "PENDIENTE" } })
    : 0;

  const employeeBadges = hasOwnEmployeeData(session.user.role)
    ? await Promise.all([
        prisma.timeSheet.findUnique({
          where: { userId_month_year: { userId: session.user.id, month, year } },
          select: { status: true },
        }),
        prisma.vacationRequest.count({
          where: { userId: session.user.id, status: "PENDIENTE" },
        }),
      ])
    : null;

  const employeeRejectedTimesheet =
    employeeBadges?.[0]?.status === "RECHAZADO" ? 1 : 0;
  const employeePendingVacations = employeeBadges?.[1] ?? 0;

  const inboxRaw = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const inbox = inboxRaw.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    href: n.href,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt?.toISOString() ?? null,
  }));

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
        employeeRejectedTimesheet={employeeRejectedTimesheet}
        employeePendingVacations={employeePendingVacations}
        inbox={inbox}
      >
        {children}
      </AppShell>
    </AppProviders>
  );
}
