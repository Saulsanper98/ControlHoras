"use server";

import { revalidatePath } from "next/cache";
import type { LeaveType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireEmployeeSession } from "@/lib/auth-helpers";
import { countVacationDays } from "@/lib/holidays";

function revalidateVacationPaths() {
  revalidatePath("/vacaciones");
  revalidatePath("/jefa/vacaciones");
}

function parseLocalDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export async function createVacationRequestAction(
  startDate: string,
  endDate: string,
  employeeNotes: string,
  leaveType: LeaveType = "VACACIONES"
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireEmployeeSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const allowed: LeaveType[] = ["VACACIONES", "ASUNTOS_PROPIOS", "MEDIO_DIA"];
  if (!allowed.includes(leaveType)) {
    return { ok: false, error: "Tipo de ausencia no válido." };
  }

  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end) {
    return { ok: false, error: "Fechas inválidas." };
  }
  if (end < start) {
    return { ok: false, error: "La fecha de fin no puede ser anterior al inicio." };
  }

  let days =
    leaveType === "MEDIO_DIA" ? 0.5 : countVacationDays(start, end);
  if (leaveType === "MEDIO_DIA" && start.toDateString() !== end.toDateString()) {
    return { ok: false, error: "Medio día debe solicitarse en una sola fecha." };
  }
  if (days <= 0) {
    return { ok: false, error: "El periodo seleccionado no incluye días laborables." };
  }

  const overlap = await prisma.vacationRequest.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["PENDIENTE", "APROBADA"] },
      startDate: { lte: end },
      endDate: { gte: start },
    },
  });
  if (overlap) {
    return {
      ok: false,
      error: "Ya tienes una solicitud pendiente o aprobada que se solapa con estas fechas.",
    };
  }

  const year = start.getFullYear();

  if (leaveType === "VACACIONES" || leaveType === "MEDIO_DIA") {
    const balance = await prisma.vacationBalance.findUnique({
      where: { userId_year: { userId: session.user.id, year } },
    });
    const remaining = balance
      ? Number(balance.totalDays) - Number(balance.usedDays)
      : null;

    const pendingDays = await prisma.vacationRequest.aggregate({
      where: {
        userId: session.user.id,
        year,
        status: "PENDIENTE",
        leaveType: { in: ["VACACIONES", "MEDIO_DIA"] },
      },
      _sum: { days: true },
    });
    const pending = Number(pendingDays._sum.days ?? 0);

    if (remaining !== null && days + pending > remaining) {
      return {
        ok: false,
        error: `No tienes suficientes días disponibles (${remaining - pending} restantes contando solicitudes pendientes).`,
      };
    }
  }

  await prisma.vacationRequest.create({
    data: {
      userId: session.user.id,
      year,
      leaveType,
      startDate: start,
      endDate: end,
      days,
      employeeNotes: employeeNotes.trim() || null,
    },
  });

  revalidateVacationPaths();
  return { ok: true };
}

export async function cancelVacationRequestAction(
  requestId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireEmployeeSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const request = await prisma.vacationRequest.findUnique({ where: { id: requestId } });
  if (!request || request.userId !== session.user.id) {
    return { ok: false, error: "Solicitud no encontrada." };
  }
  if (request.status !== "PENDIENTE") {
    return { ok: false, error: "Solo puedes cancelar solicitudes pendientes." };
  }

  await prisma.vacationRequest.update({
    where: { id: requestId },
    data: { status: "CANCELADA" },
  });

  revalidateVacationPaths();
  return { ok: true };
}
