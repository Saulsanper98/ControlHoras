"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { saveSignatureImage } from "@/lib/signatures";
import { deleteUploadedFile } from "@/lib/uploads";
import { requireManagerSession } from "@/lib/auth-helpers";
import { clientIp } from "@/lib/request-ip";

export async function signAsResponsableAction(
  timeSheetId: string,
  signatureDataUrl: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const timeSheet = await prisma.timeSheet.findUnique({ where: { id: timeSheetId } });
  if (!timeSheet) return { ok: false, error: "Control horario no encontrado." };
  if (timeSheet.status !== "FIRMADO_EMPLEADO") {
    return { ok: false, error: "Este control horario no está pendiente de firma." };
  }

  const previousSignature = await prisma.signature.findUnique({
    where: { timeSheetId_signerRole: { timeSheetId: timeSheet.id, signerRole: "RESPONSABLE" } },
  });

  const imagePath = await saveSignatureImage(signatureDataUrl, `timesheets/${timeSheet.id}`);
  const ipAddress = await clientIp();

  await prisma.$transaction([
    prisma.timeSheet.update({
      where: { id: timeSheet.id },
      data: { status: "FIRMADO_RESPONSABLE", approvedAt: new Date() },
    }),
    prisma.signature.upsert({
      where: { timeSheetId_signerRole: { timeSheetId: timeSheet.id, signerRole: "RESPONSABLE" } },
      create: {
        timeSheetId: timeSheet.id,
        signerRole: "RESPONSABLE",
        signerId: session.user.id,
        imagePath,
        ipAddress,
      },
      update: { imagePath, signedAt: new Date(), ipAddress },
    }),
  ]);

  if (previousSignature && previousSignature.imagePath !== imagePath) {
    await deleteUploadedFile(previousSignature.imagePath);
  }

  revalidatePath("/jefa/controles");
  revalidatePath(`/jefa/controles/${timeSheetId}`);
  return { ok: true };
}

export async function rejectTimeSheetAction(
  timeSheetId: string,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireManagerSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const timeSheet = await prisma.timeSheet.findUnique({ where: { id: timeSheetId } });
  if (!timeSheet) return { ok: false, error: "Control horario no encontrado." };
  if (timeSheet.status !== "FIRMADO_EMPLEADO") {
    return { ok: false, error: "Este control horario no está pendiente de firma." };
  }

  await prisma.timeSheet.update({
    where: { id: timeSheet.id },
    data: {
      status: "RECHAZADO",
      // Conserva las notas del empleado y añade el motivo de rechazo.
      notes: [
        timeSheet.notes?.trim() || null,
        reason.trim()
          ? `Rechazado: ${reason.trim()}`
          : "Rechazado por la responsable.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  });

  revalidatePath("/jefa/controles");
  revalidatePath(`/jefa/controles/${timeSheetId}`);
  return { ok: true };
}
