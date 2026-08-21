"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagerSession } from "@/lib/auth-helpers";
import { syncVacationUsedDays } from "@/lib/vacation-sync";
import { createNotification } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/audit";
import { findDepartmentVacationOverlaps } from "@/lib/vacation-overlaps";
import { LEAVE_TYPE_LABEL } from "@/lib/labels";
import { formatDateNumeric } from "@/lib/format-date";

function revalidateAll(userId: string) {
  revalidatePath("/jefa/vacaciones");
  revalidatePath(`/jefa/vacaciones/${userId}`);
  revalidatePath("/jefa/vacaciones/calendario");
  revalidatePath("/vacaciones");
  revalidatePath("/");
}

export async function approveVacationRequestAction(
  requestId: string,
  force = false
): Promise<{
  ok: boolean;
  error?: string;
  warning?: string;
  overlaps?: { userName: string; startDate: string; endDate: string }[];
}> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const request = await prisma.vacationRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  });
  if (!request) return { ok: false, error: "Solicitud no encontrada." };
  if (request.status !== "PENDIENTE") {
    return { ok: false, error: "Esta solicitud ya fue gestionada." };
  }

  if (request.leaveType === "VACACIONES" || request.leaveType === "MEDIO_DIA") {
    const balance = await prisma.vacationBalance.findUnique({
      where: { userId_year: { userId: request.userId, year: request.year } },
    });
    const used = balance ? Number(balance.usedDays) : 0;
    const total = balance ? Number(balance.totalDays) : 0;
    const remaining = total - used;

    if (balance && Number(request.days) > remaining) {
      return {
        ok: false,
        error: `El empleado solo tiene ${remaining} días disponibles.`,
      };
    }
  }

  const overlaps = await findDepartmentVacationOverlaps({
    userId: request.userId,
    departmentId: request.user.departmentId,
    startDate: request.startDate,
    endDate: request.endDate,
    excludeRequestId: request.id,
  });

  if (overlaps.length > 0 && !force) {
    return {
      ok: false,
      warning: `Hay ${overlaps.length} compañero(s) de vacaciones en las mismas fechas.`,
      overlaps: overlaps.map((o) => ({
        userName: o.userName,
        startDate: o.startDate.toISOString(),
        endDate: o.endDate.toISOString(),
      })),
    };
  }

  await prisma.vacationRequest.update({
    where: { id: requestId },
    data: {
      status: "APROBADA",
      reviewedAt: new Date(),
      reviewedById: session.user.id,
    },
  });

  await syncVacationUsedDays(request.userId, request.year);
  await createNotification({
    userId: request.userId,
    title: `${LEAVE_TYPE_LABEL[request.leaveType] ?? "Solicitud"} aprobada`,
    body: `Tu solicitud del ${formatDateNumeric(request.startDate)} al ${formatDateNumeric(request.endDate)} ha sido aprobada.`,
    href: "/vacaciones",
  });
  await writeAuditLog({
    actorId: session.user.id,
    action: "LEAVE_APPROVED",
    entityType: "VacationRequest",
    entityId: request.id,
    detail: overlaps.length ? `Aprobada con ${overlaps.length} solape(s) de equipo` : "Aprobada",
  });

  revalidateAll(request.userId);
  return { ok: true };
}

export async function rejectVacationRequestAction(
  requestId: string,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const request = await prisma.vacationRequest.findUnique({ where: { id: requestId } });
  if (!request) return { ok: false, error: "Solicitud no encontrada." };
  if (request.status !== "PENDIENTE") {
    return { ok: false, error: "Esta solicitud ya fue gestionada." };
  }

  const finalReason = reason.trim() || "Rechazada por la responsable.";

  await prisma.vacationRequest.update({
    where: { id: requestId },
    data: {
      status: "RECHAZADA",
      rejectionReason: finalReason,
      reviewedAt: new Date(),
      reviewedById: session.user.id,
    },
  });

  await createNotification({
    userId: request.userId,
    title: `${LEAVE_TYPE_LABEL[request.leaveType] ?? "Solicitud"} rechazada`,
    body: finalReason,
    href: "/vacaciones",
  });
  await writeAuditLog({
    actorId: session.user.id,
    action: "LEAVE_REJECTED",
    entityType: "VacationRequest",
    entityId: request.id,
    detail: finalReason,
  });

  revalidateAll(request.userId);
  return { ok: true };
}
