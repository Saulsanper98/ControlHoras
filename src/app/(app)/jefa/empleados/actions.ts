"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireManagerSession } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";
import { TEMP_EMPLOYEE_PASSWORD } from "@/lib/labels";

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
  await writeAuditLog({
    actorId: session.user.id,
    action: active ? "EMPLOYEE_ACTIVATED" : "EMPLOYEE_DEACTIVATED",
    entityType: "User",
    entityId: userId,
  });
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

  const passwordHash = await bcrypt.hash(TEMP_EMPLOYEE_PASSWORD, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });
  await writeAuditLog({
    actorId: session.user.id,
    action: "EMPLOYEE_PASSWORD_RESET",
    entityType: "User",
    entityId: userId,
    detail: "Contraseña temporal regenerada",
  });

  revalidatePath("/jefa/empleados");
  return { ok: true };
}

export async function createEmployeeAction(input: {
  name: string;
  email: string;
  departmentId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || !email || !input.departmentId) {
    return { ok: false, error: "Nombre, email y departamento son obligatorios." };
  }

  const dept = await prisma.department.findUnique({ where: { id: input.departmentId } });
  if (!dept) return { ok: false, error: "Departamento no encontrado." };

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { ok: false, error: "Ya existe un usuario con ese email." };

  const passwordHash = await bcrypt.hash(TEMP_EMPLOYEE_PASSWORD, 10);
  const year = new Date().getFullYear();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "EMPLEADO",
      mustChangePassword: true,
      departmentId: input.departmentId,
      vacationBalances: {
        create: { year, totalDays: 22, usedDays: 0 },
      },
    },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: "EMPLOYEE_CREATED",
    entityType: "User",
    entityId: user.id,
    detail: email,
  });

  revalidatePath("/jefa/empleados");
  revalidatePath("/");
  return { ok: true };
}

export async function updateEmployeeAction(input: {
  userId: string;
  name: string;
  email: string;
  departmentId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const employee = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!employee || employee.role !== "EMPLEADO") {
    return { ok: false, error: "Empleado no encontrado." };
  }

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || !email || !input.departmentId) {
    return { ok: false, error: "Nombre, email y departamento son obligatorios." };
  }

  const emailTaken = await prisma.user.findFirst({
    where: { email, id: { not: input.userId } },
  });
  if (emailTaken) return { ok: false, error: "Ya existe un usuario con ese email." };

  await prisma.user.update({
    where: { id: input.userId },
    data: { name, email, departmentId: input.departmentId },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: "EMPLOYEE_UPDATED",
    entityType: "User",
    entityId: input.userId,
  });

  revalidatePath("/jefa/empleados");
  return { ok: true };
}
