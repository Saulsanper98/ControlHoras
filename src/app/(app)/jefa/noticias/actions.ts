"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { deleteUploadedFile, saveUploadedFile, UploadValidationError } from "@/lib/uploads";
import { requireManagerSession } from "@/lib/auth-helpers";

const NEWS_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const NEWS_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

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

  await prisma.news.create({
    data: { title, body, pinned, imagePath, publishedById: session.user.id },
  });

  revalidateAll();
  return { ok: true };
}

export async function updateNewsAction(
  id: string,
  title: string,
  body: string,
  pinned: boolean
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };
  if (!title.trim() || !body.trim()) return { ok: false, error: "Título y contenido son obligatorios." };

  await prisma.news.update({
    where: { id },
    data: { title: title.trim(), body: body.trim(), pinned },
  });

  revalidateAll();
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

  revalidateAll();
  return { ok: true };
}
