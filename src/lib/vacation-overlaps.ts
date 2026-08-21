import { prisma } from "@/lib/prisma";

/** Detecta compañeros del mismo departamento con vacaciones aprobadas solapadas. */
export async function findDepartmentVacationOverlaps(input: {
  userId: string;
  departmentId: string | null | undefined;
  startDate: Date;
  endDate: Date;
  excludeRequestId?: string;
}) {
  if (!input.departmentId) return [];

  const overlaps = await prisma.vacationRequest.findMany({
    where: {
      id: input.excludeRequestId ? { not: input.excludeRequestId } : undefined,
      status: "APROBADA",
      leaveType: "VACACIONES",
      userId: { not: input.userId },
      user: { departmentId: input.departmentId, active: true },
      startDate: { lte: input.endDate },
      endDate: { gte: input.startDate },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return overlaps.map((o) => ({
    id: o.id,
    userId: o.userId,
    userName: o.user.name,
    startDate: o.startDate,
    endDate: o.endDate,
    days: Number(o.days),
  }));
}
