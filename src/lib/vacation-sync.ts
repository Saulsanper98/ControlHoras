import { prisma } from "@/lib/prisma";

/** Recalcula usedDays a partir de solicitudes aprobadas del año. */
export async function syncVacationUsedDays(userId: string, year: number): Promise<void> {
  const approved = await prisma.vacationRequest.findMany({
    where: {
      userId,
      year,
      status: "APROBADA",
      leaveType: { in: ["VACACIONES", "MEDIO_DIA"] },
    },
    select: { days: true },
  });

  const usedDays = approved.reduce((sum, r) => sum + Number(r.days), 0);

  await prisma.vacationBalance.upsert({
    where: { userId_year: { userId, year } },
    create: { userId, year, totalDays: 22, usedDays },
    update: { usedDays },
  });
}
