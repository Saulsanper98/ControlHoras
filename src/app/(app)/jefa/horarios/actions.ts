"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { saveUploadedFile, UploadValidationError } from "@/lib/uploads";
import { requireManagerSession } from "@/lib/auth-helpers";
import { createNotification } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/audit";

const SCHEDULE_EXTENSIONS = [".pdf", ".xlsx", ".xls"];

export async function uploadScheduleAction(
  departmentId: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecciona un archivo." };
  }

  const validFromRaw = String(formData.get("validFrom") ?? "").trim();
  const validFrom = validFromRaw ? new Date(validFromRaw) : new Date();
  if (Number.isNaN(validFrom.getTime())) {
    return { ok: false, error: "Fecha de vigencia inválida." };
  }

  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) return { ok: false, error: "Departamento no encontrado." };

  let saved;
  try {
    saved = await saveUploadedFile(file, `schedules/${departmentId}`, {
      allowedExtensions: SCHEDULE_EXTENSIONS,
    });
  } catch (err) {
    if (err instanceof UploadValidationError) return { ok: false, error: err.message };
    throw err;
  }

  // Conservamos historial: ya no se borra el horario anterior.
  await prisma.schedule.create({
    data: {
      departmentId,
      fileName: saved.fileName,
      filePath: saved.filePath,
      mimeType: saved.mimeType,
      uploadedById: session.user.id,
      validFrom,
    },
  });

  const employees = await prisma.user.findMany({
    where: { role: "EMPLEADO", active: true, departmentId },
    select: { id: true },
  });
  await Promise.all(
    employees.map((e) =>
      createNotification({
        userId: e.id,
        title: "Nuevo horario publicado",
        body: `Hay un horario nuevo para ${department.name}.`,
        href: "/horario",
      })
    )
  );

  await writeAuditLog({
    actorId: session.user.id,
    action: "SCHEDULE_UPLOADED",
    entityType: "Schedule",
    entityId: departmentId,
    detail: saved.fileName,
  });

  revalidatePath("/jefa/horarios");
  revalidatePath("/horario");
  return { ok: true };
}

export async function deleteScheduleAction(scheduleId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) return { ok: false, error: "Horario no encontrado." };

  // Soft-delete: marcamos validFrom en el pasado remoto no — mejor conservar archivo y solo eliminar registro si hay más recientes.
  const newer = await prisma.schedule.count({
    where: {
      departmentId: schedule.departmentId,
      createdAt: { gt: schedule.createdAt },
    },
  });
  if (!newer) {
    return { ok: false, error: "No puedes eliminar el horario vigente. Sube uno nuevo primero." };
  }

  try {
    await prisma.schedule.delete({ where: { id: scheduleId } });
  } catch {
    return { ok: false, error: "No se pudo eliminar el horario." };
  }

  await writeAuditLog({
    actorId: session.user.id,
    action: "SCHEDULE_DELETED",
    entityType: "Schedule",
    entityId: scheduleId,
  });

  revalidatePath("/jefa/horarios");
  revalidatePath("/horario");
  return { ok: true };
}
