import { readFile, stat } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadsRoot } from "@/lib/uploads";
import { canManage } from "@/lib/roles";

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

// Tipos que el navegador puede mostrar embebidos (iframe/img). El resto
// (p. ej. .xlsx/.xls, sin visor nativo) se sirve para descargar.
const INLINE_VIEWABLE = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await auth();
  if (!session) return new NextResponse("No autorizado", { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { active: true },
  });
  if (!dbUser?.active) return new NextResponse("No autorizado", { status: 401 });

  const { path: segments } = await params;
  if (segments.length === 0) return new NextResponse("Ruta inválida", { status: 400 });

  const root = uploadsRoot();
  const relative = segments.join("/");
  const absolutePath = path.join(root, relative);

  // Comprobación robusta de path traversal: la ruta resuelta debe quedar
  // estrictamente dentro de uploadsRoot(), no solo compartir el prefijo de
  // texto (p. ej. "uploads-evil" pasaría un simple startsWith("uploads")).
  const relativeCheck = path.relative(root, absolutePath);
  if (relativeCheck.startsWith("..") || path.isAbsolute(relativeCheck)) {
    return new NextResponse("Ruta inválida", { status: 400 });
  }

  const isManager = canManage(session.user.role);
  const [category, ownerSegment] = segments;

  let authorized = false;
  if (category === "news") {
    // Las imágenes de noticias son visibles para cualquier usuario autenticado.
    authorized = true;
  } else if (category === "timesheets" && ownerSegment) {
    const timeSheet = await prisma.timeSheet.findUnique({
      where: { id: ownerSegment },
      select: { userId: true },
    });
    authorized = !!timeSheet && (timeSheet.userId === session.user.id || isManager);
  } else if (category === "schedules") {
    // Los horarios viven por departamento; la carpeta en disco puede ser
    // el departmentId (nuevo) o un userId legado. Autorizamos por el
    // registro en BD, no por el segmento de ruta.
    const schedule = await prisma.schedule.findFirst({
      where: { filePath: relative },
      select: { departmentId: true },
    });
    authorized =
      !!schedule &&
      (isManager || schedule.departmentId === session.user.departmentId);
  }

  if (!authorized) {
    return new NextResponse("No autorizado", { status: 403 });
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";
  const disposition = INLINE_VIEWABLE.has(mimeType) ? "inline" : "attachment";
  const fileName = path.basename(absolutePath).replace(/["\\\r\n]/g, "_");

  try {
    await stat(absolutePath);
    const data = await readFile(absolutePath);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `${disposition}; filename="${fileName}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("No encontrado", { status: 404 });
  }
}
