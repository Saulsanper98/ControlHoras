"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagerSession } from "@/lib/auth-helpers";

const TEMP_PASSWORD = "Cambiar123!";

export async function toggleEmployeeActiveAction(
  userId: string,
  active: boolean
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const employee = await prisma.user.findUnique({ where: { id: userId } });
  if (!employee || employee.role !== "EMPLEADO") {
    return { ok: false, error: "Empleado no encontrado." };
  }

  await prisma.user.update({ where: { id: userId }, data: { active } });
  revalidatePath("/jefa/empleados");
  revalidatePath("/");
  return { ok: true };
}

export async function resetEmployeePasswordAction(
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const employee = await prisma.user.findUnique({ where: { id: userId } });
  if (!employee || employee.role !== "EMPLEADO") {
    return { ok: false, error: "Empleado no encontrado." };
  }

  const passwordHash = await bcrypt.hash(TEMP_PASSWORD, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });

  revalidatePath("/jefa/empleados");
  return { ok: true };
}
