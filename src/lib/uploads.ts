import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

const UPLOADS_ROOT = path.resolve(/* turbopackIgnore: true */ process.env.UPLOADS_DIR ?? "./uploads");

const DEFAULT_MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export class UploadValidationError extends Error {}

export async function saveUploadedFile(
  file: File,
  subdir: string,
  options?: { allowedExtensions?: string[]; maxSizeBytes?: number }
): Promise<{ fileName: string; filePath: string; mimeType: string }> {
  const ext = path.extname(file.name).toLowerCase();

  if (options?.allowedExtensions && !options.allowedExtensions.includes(ext)) {
    throw new UploadValidationError(
      `Tipo de archivo no permitido. Formatos aceptados: ${options.allowedExtensions.join(", ")}.`
    );
  }

  const maxSize = options?.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
  if (file.size > maxSize) {
    throw new UploadValidationError(
      `El archivo supera el tamaño máximo permitido (${Math.floor(maxSize / (1024 * 1024))} MB).`
    );
  }

  const dir = path.join(UPLOADS_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const storedName = `${randomUUID()}${ext}`;
  const absolutePath = path.join(/* turbopackIgnore: true */ dir, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    fileName: file.name,
    filePath: path.join(subdir, storedName).replaceAll("\\", "/"),
    mimeType: file.type || "application/octet-stream",
  };
}

/** Borra un fichero subido a partir de su filePath relativo (tolera que ya no exista). */
export async function deleteUploadedFile(relativeFilePath: string | null | undefined): Promise<void> {
  if (!relativeFilePath) return;
  const absolutePath = path.join(UPLOADS_ROOT, relativeFilePath);
  const relativeCheck = path.relative(UPLOADS_ROOT, absolutePath);
  if (relativeCheck.startsWith("..") || path.isAbsolute(relativeCheck)) return;
  try {
    await unlink(absolutePath);
  } catch {
    // Ya no existe o no se pudo borrar; no es crítico para la operación principal.
  }
}

export function uploadsRoot() {
  return UPLOADS_ROOT;
}
