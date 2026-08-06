"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { deleteUploadedFile, saveUploadedFile, UploadValidationError } from "@/lib/uploads";
import { requireManagerSession } from "@/lib/auth-helpers";

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

  const previous = await prisma.schedule.findFirst({
    where: { departmentId },
    orderBy: { createdAt: "desc" },
  });

  await prisma.schedule.create({
    data: {
      departmentId,
      fileName: saved.fileName,
      filePath: saved.filePath,
      mimeType: saved.mimeType,
      uploadedById: session.user.id,
    },
  });

  if (previous) {
    await prisma.schedule.delete({ where: { id: previous.id } });
    await deleteUploadedFile(previous.filePath);
  }

  revalidatePath("/jefa/horarios");
  revalidatePath("/horario");
  return { ok: true };
}

export async function deleteScheduleAction(scheduleId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) return { ok: false, error: "Horario no encontrado." };

  try {
    await prisma.schedule.delete({ where: { id: scheduleId } });
  } catch {
    return { ok: false, error: "No se pudo eliminar el horario." };
  }

  await deleteUploadedFile(schedule.filePath);

  revalidatePath("/jefa/horarios");
  revalidatePath("/horario");
  return { ok: true };
}
