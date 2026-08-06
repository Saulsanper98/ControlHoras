"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { saveSignatureImage } from "@/lib/signatures";
import { deleteUploadedFile } from "@/lib/uploads";
import { requireManagerSession } from "@/lib/auth-helpers";
import { clientIp } from "@/lib/request-ip";
import { createNotification } from "@/lib/notifications";
import { writeAuditLog } from "@/lib/audit";

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

  await createNotification({
    userId: timeSheet.userId,
    title: "Control horario firmado",
    body: `Tu control de ${timeSheet.month}/${timeSheet.year} ha sido firmado por la responsable.`,
    href: "/control-horario",
  });
  await writeAuditLog({
    actorId: session.user.id,
    action: "TIMESHEET_SIGNED",
    entityType: "TimeSheet",
    entityId: timeSheet.id,
    detail: `Firmado control ${timeSheet.month}/${timeSheet.year}`,
  });

  revalidatePath("/jefa/controles");
  revalidatePath(`/jefa/controles/${timeSheetId}`);
  revalidatePath("/control-horario");
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

  const finalReason = reason.trim() || "Rechazado por la responsable.";

  await prisma.$transaction(async (tx) => {
    const employeeSignature = await tx.signature.findUnique({
      where: { timeSheetId_signerRole: { timeSheetId: timeSheet.id, signerRole: "EMPLEADO" } },
    });

    await tx.timeSheet.update({
      where: { id: timeSheet.id },
      data: {
        status: "RECHAZADO",
        rejectionReason: finalReason,
        rejectedAt: new Date(),
        rejectedById: session.user.id,
        submittedAt: null,
      },
    });

    if (employeeSignature) {
      await tx.signature.delete({
        where: { timeSheetId_signerRole: { timeSheetId: timeSheet.id, signerRole: "EMPLEADO" } },
      });
      await deleteUploadedFile(employeeSignature.imagePath);
    }
  });

  await createNotification({
    userId: timeSheet.userId,
    title: "Control horario rechazado",
    body: finalReason,
    href: `/control-horario?month=${timeSheet.month}&year=${timeSheet.year}`,
  });
  await writeAuditLog({
    actorId: session.user.id,
    action: "TIMESHEET_REJECTED",
    entityType: "TimeSheet",
    entityId: timeSheet.id,
    detail: finalReason,
  });

  revalidatePath("/control-horario");
  revalidatePath(`/jefa/controles/${timeSheetId}`);
  return { ok: true };
}
