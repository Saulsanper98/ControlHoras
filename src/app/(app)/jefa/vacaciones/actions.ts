"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagerSession } from "@/lib/auth-helpers";

function revalidateAll(userId: string) {
  revalidatePath("/jefa/vacaciones");
  revalidatePath(`/jefa/vacaciones/${userId}`);
  revalidatePath("/vacaciones");
  revalidatePath("/");
}

export async function saveVacationBalanceAction(
  userId: string,
  year: number,
  totalDays: number,
  usedDays: number,
  notes: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };
  if (!Number.isFinite(totalDays) || !Number.isFinite(usedDays) || totalDays < 0 || usedDays < 0) {
    return { ok: false, error: "Los valores no pueden ser negativos." };
  }
  if (usedDays > totalDays) {
    return { ok: false, error: "Los días usados no pueden superar los días totales." };
  }

  const employee = await prisma.user.findUnique({ where: { id: userId } });
  if (!employee) return { ok: false, error: "Empleado no encontrado." };

  await prisma.vacationBalance.upsert({
    where: { userId_year: { userId, year } },
    create: { userId, year, totalDays, usedDays, notes: notes.trim() || null },
    update: { totalDays, usedDays, notes: notes.trim() || null },
  });

  revalidateAll(userId);
  return { ok: true };
}

export async function addHourAdjustmentAction(
  userId: string,
  hours: number,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };
  if (!Number.isFinite(hours) || hours === 0) {
    return { ok: false, error: "Indica un número de horas distinto de cero." };
  }
  if (!reason.trim()) return { ok: false, error: "Indica un motivo." };

  const employee = await prisma.user.findUnique({ where: { id: userId } });
  if (!employee) return { ok: false, error: "Empleado no encontrado." };

  await prisma.hourAdjustment.create({
    data: { userId, hours, reason: reason.trim(), createdById: session.user.id },
  });

  revalidateAll(userId);
  return { ok: true };
}

export async function deleteHourAdjustmentAction(
  id: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  try {
    await prisma.hourAdjustment.delete({ where: { id } });
  } catch {
    return { ok: false, error: "No se pudo eliminar el ajuste." };
  }

  revalidateAll(userId);
  return { ok: true };
}
