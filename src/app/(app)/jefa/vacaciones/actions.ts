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

async function requireActiveEmployee(userId: string) {
  const employee = await prisma.user.findUnique({ where: { id: userId } });
  if (!employee || employee.role !== "EMPLEADO") {
    return { ok: false as const, error: "Empleado no encontrado." };
  }
  if (!employee.active) {
    return { ok: false as const, error: "El empleado está inactivo." };
  }
  return { ok: true as const, employee };
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

  const target = await requireActiveEmployee(userId);
  if (!target.ok) return target;

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
  reason: string,
  year: number
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };
  if (!Number.isFinite(hours) || hours === 0) {
    return { ok: false, error: "Indica un número de horas distinto de cero." };
  }
  if (!reason.trim()) return { ok: false, error: "Indica un motivo." };
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return { ok: false, error: "Año no válido." };
  }

  const target = await requireActiveEmployee(userId);
  if (!target.ok) return target;

  await prisma.hourAdjustment.create({
    data: {
      userId,
      year,
      hours,
      reason: reason.trim(),
      createdById: session.user.id,
    },
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

  const existing = await prisma.hourAdjustment.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return { ok: false, error: "No se pudo eliminar el ajuste." };
  }

  try {
    await prisma.hourAdjustment.delete({ where: { id } });
  } catch {
    return { ok: false, error: "No se pudo eliminar el ajuste." };
  }

  revalidateAll(userId);
  return { ok: true };
}
