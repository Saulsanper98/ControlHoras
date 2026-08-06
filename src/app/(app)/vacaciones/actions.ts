"use server";

import { revalidatePath } from "next/cache";
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
  employeeNotes: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireEmployeeSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  if (!start || !end) {
    return { ok: false, error: "Fechas inválidas." };
  }
  if (end < start) {
    return { ok: false, error: "La fecha de fin no puede ser anterior al inicio." };
  }

  const days = countVacationDays(start, end);
  if (days <= 0) {
    return { ok: false, error: "El periodo seleccionado no incluye días laborables." };
  }

  const year = start.getFullYear();
  const balance = await prisma.vacationBalance.findUnique({
    where: { userId_year: { userId: session.user.id, year } },
  });
  const remaining = balance
    ? Number(balance.totalDays) - Number(balance.usedDays)
    : null;

  const pendingDays = await prisma.vacationRequest.aggregate({
    where: { userId: session.user.id, year, status: "PENDIENTE" },
    _sum: { days: true },
  });
  const pending = Number(pendingDays._sum.days ?? 0);

  if (remaining !== null && days + pending > remaining) {
    return {
      ok: false,
      error: `No tienes suficientes días disponibles (${remaining - pending} restantes contando solicitudes pendientes).`,
    };
  }

  await prisma.vacationRequest.create({
    data: {
      userId: session.user.id,
      year,
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
