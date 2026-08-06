"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagerSession } from "@/lib/auth-helpers";
import { syncVacationUsedDays } from "@/lib/vacation-sync";

function revalidateAll(userId: string) {
  revalidatePath("/jefa/vacaciones");
  revalidatePath(`/jefa/vacaciones/${userId}`);
  revalidatePath("/jefa/vacaciones/calendario");
  revalidatePath("/vacaciones");
  revalidatePath("/");
}

export async function approveVacationRequestAction(
  requestId: string
): Promise<{ ok: boolean; error?: string }> {
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

  await prisma.vacationRequest.update({
    where: { id: requestId },
    data: {
      status: "APROBADA",
      reviewedAt: new Date(),
      reviewedById: session.user.id,
    },
  });

  await syncVacationUsedDays(request.userId, request.year);
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

  await prisma.vacationRequest.update({
    where: { id: requestId },
    data: {
      status: "RECHAZADA",
      rejectionReason: reason.trim() || "Rechazada por la responsable.",
      reviewedAt: new Date(),
      reviewedById: session.user.id,
    },
  });

  revalidateAll(request.userId);
  return { ok: true };
}
