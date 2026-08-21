"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { deleteUploadedFile, saveUploadedFile, UploadValidationError } from "@/lib/uploads";
import { requireManagerSession } from "@/lib/auth-helpers";
import { writeAuditLog } from "@/lib/audit";

const NEWS_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const NEWS_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

function revalidateAll() {
  revalidatePath("/jefa/noticias");
  revalidatePath("/noticias");
  revalidatePath("/");
}

export async function createNewsAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pinned = formData.get("pinned") === "on";
  const asDraft = formData.get("draft") === "on";
  const scheduledRaw = String(formData.get("scheduledAt") ?? "").trim();
  const file = formData.get("image");

  if (!title || !body) return { ok: false, error: "Título y contenido son obligatorios." };

  let imagePath: string | null = null;
  if (file instanceof File && file.size > 0) {
    try {
      const saved = await saveUploadedFile(file, "news", {
        allowedExtensions: NEWS_IMAGE_EXTENSIONS,
        maxSizeBytes: NEWS_IMAGE_MAX_BYTES,
      });
      imagePath = saved.filePath;
    } catch (err) {
      if (err instanceof UploadValidationError) return { ok: false, error: err.message };
      throw err;
    }
  }

  const scheduledAt = scheduledRaw ? new Date(scheduledRaw) : null;
  if (scheduledRaw && Number.isNaN(scheduledAt?.getTime())) {
    return { ok: false, error: "Fecha de programación inválida." };
  }

  const news = await prisma.news.create({
    data: {
      title,
      body,
      pinned,
      imagePath,
      publishedById: session.user.id,
      status: asDraft || (scheduledAt && scheduledAt > new Date()) ? "BORRADOR" : "PUBLICADA",
      scheduledAt,
      publishedAt: scheduledAt && scheduledAt > new Date() ? scheduledAt : new Date(),
    },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: "NEWS_CREATED",
    entityType: "News",
    entityId: news.id,
    detail: news.status,
  });

  revalidateAll();
  return { ok: true };
}

export async function updateNewsAction(
  id: string,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pinned = formData.get("pinned") === "on";
  const asDraft = formData.get("draft") === "on";
  const scheduledRaw = String(formData.get("scheduledAt") ?? "").trim();
  const file = formData.get("image");

  if (!title || !body) return { ok: false, error: "Título y contenido son obligatorios." };

  const existing = await prisma.news.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Noticia no encontrada." };

  const scheduledAt = scheduledRaw ? new Date(scheduledRaw) : null;
  if (scheduledRaw && Number.isNaN(scheduledAt?.getTime())) {
    return { ok: false, error: "Fecha de programación inválida." };
  }

  let imagePath = existing.imagePath;
  if (file instanceof File && file.size > 0) {
    try {
      const saved = await saveUploadedFile(file, "news", {
        allowedExtensions: NEWS_IMAGE_EXTENSIONS,
        maxSizeBytes: NEWS_IMAGE_MAX_BYTES,
      });
      if (existing.imagePath) await deleteUploadedFile(existing.imagePath);
      imagePath = saved.filePath;
    } catch (err) {
      if (err instanceof UploadValidationError) return { ok: false, error: err.message };
      throw err;
    }
  }

  await prisma.news.update({
    where: { id },
    data: {
      title,
      body,
      pinned,
      imagePath,
      status: asDraft || (scheduledAt && scheduledAt > new Date()) ? "BORRADOR" : "PUBLICADA",
      scheduledAt,
      ...(scheduledAt && scheduledAt > new Date()
        ? { publishedAt: scheduledAt }
        : !asDraft
          ? { publishedAt: existing.publishedAt ?? new Date() }
          : {}),
    },
  });

  await writeAuditLog({
    actorId: session.user.id,
    action: "NEWS_UPDATED",
    entityType: "News",
    entityId: id,
  });

  revalidateAll();
  revalidatePath(`/noticias/${id}`);
  return { ok: true };
}

export async function deleteNewsAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const news = await prisma.news.findUnique({ where: { id } });
  if (!news) return { ok: false, error: "Noticia no encontrada." };

  try {
    await prisma.news.delete({ where: { id } });
  } catch {
    return { ok: false, error: "No se pudo eliminar la noticia." };
  }

  await deleteUploadedFile(news.imagePath);
  await writeAuditLog({
    actorId: session.user.id,
    action: "NEWS_DELETED",
    entityType: "News",
    entityId: id,
  });

  revalidateAll();
  return { ok: true };
}
