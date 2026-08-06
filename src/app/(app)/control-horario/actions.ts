"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  calculateDayHours,
  daysInMonth,
  isSuspiciousShift,
} from "@/lib/timesheet-calc";
import { deleteUploadedFile, saveUploadedFile, UploadValidationError } from "@/lib/uploads";
import { saveSignatureImage } from "@/lib/signatures";
import { requireEmployeeSession } from "@/lib/auth-helpers";
import { clientIp } from "@/lib/request-ip";

type EntryInput = {
  day: number;
  checkIn: string;
  checkOut: string;
  notes: string;
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const ATTACHMENT_EXTENSIONS = [".pdf", ".xlsx", ".xls"];

/** Valida mes/año/entradas del formulario. Devuelve un mensaje de error o null si todo es correcto. */
function validateTimeSheetInput(month: number, year: number, entries: EntryInput[]): string | null {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return "Mes inválido.";
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return "Año inválido.";
  }

  const maxDay = daysInMonth(month, year);
  const seenDays = new Set<number>();

  for (const entry of entries) {
    if (!Number.isInteger(entry.day) || entry.day < 1 || entry.day > maxDay) {
      return `Día inválido (${entry.day}) para ${month}/${year}.`;
    }
    if (seenDays.has(entry.day)) {
      return `Día duplicado (${entry.day}).`;
    }
    seenDays.add(entry.day);

    if (entry.checkIn && !TIME_RE.test(entry.checkIn)) {
      return `Hora de entrada inválida en el día ${entry.day}.`;
    }
    if (entry.checkOut && !TIME_RE.test(entry.checkOut)) {
      return `Hora de salida inválida en el día ${entry.day}.`;
    }
    const hasIn = Boolean(entry.checkIn);
    const hasOut = Boolean(entry.checkOut);
    if (hasIn !== hasOut) {
      return `El día ${entry.day} tiene solo entrada o solo salida; completa ambas o déjalas vacías.`;
    }
    if (entry.checkIn && entry.checkOut) {
      const hours = calculateDayHours(entry.checkIn, entry.checkOut);
      if (isSuspiciousShift(hours)) {
        return `El turno del día ${entry.day} supera las 16 horas; revisa la hora de entrada/salida.`;
      }
    }
  }

  return null;
}

async function getOrCreateDraftTimeSheet(userId: string, month: number, year: number) {
  const existing = await prisma.timeSheet.findUnique({
    where: { userId_month_year: { userId, month, year } },
  });
  if (existing) return existing;

  try {
    return await prisma.timeSheet.create({
      data: { userId, month, year },
    });
  } catch (err) {
    // Condición de carrera: dos peticiones simultáneas intentan crear el
    // mismo borrador (mismo usuario/mes/año). La segunda choca contra la
    // restricción única; recuperamos el registro creado por la primera.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const recovered = await prisma.timeSheet.findUnique({
        where: { userId_month_year: { userId, month, year } },
      });
      if (recovered) return recovered;
    }
    throw err;
  }
}

export async function saveDraftAction(
  month: number,
  year: number,
  entries: EntryInput[],
  notes: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireEmployeeSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const validationError = validateTimeSheetInput(month, year, entries);
  if (validationError) return { ok: false, error: validationError };

  const timeSheet = await getOrCreateDraftTimeSheet(session.user.id, month, year);

  if (timeSheet.status !== "BORRADOR" && timeSheet.status !== "RECHAZADO") {
    return { ok: false, error: "Este control horario ya no se puede editar." };
  }

  await prisma.$transaction([
    prisma.timeSheet.update({
      where: { id: timeSheet.id },
      data: { notes },
    }),
    ...entries.map((entry) => {
      const hours = calculateDayHours(entry.checkIn, entry.checkOut);
      return prisma.timeEntry.upsert({
        where: { timeSheetId_day: { timeSheetId: timeSheet.id, day: entry.day } },
        create: {
          timeSheetId: timeSheet.id,
          day: entry.day,
          checkIn: entry.checkIn || null,
          checkOut: entry.checkOut || null,
          notes: entry.notes || null,
          ...hours,
        },
        update: {
          checkIn: entry.checkIn || null,
          checkOut: entry.checkOut || null,
          notes: entry.notes || null,
          ...hours,
        },
      });
    }),
  ]);

  revalidatePath("/control-horario");
  return { ok: true };
}

export async function uploadAttachmentAction(
  month: number,
  year: number,
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireEmployeeSession();
  if (!session) return { ok: false, error: "No autorizado." };

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2100) {
    return { ok: false, error: "Mes/año inválido." };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "Selecciona un archivo." };

  const timeSheet = await getOrCreateDraftTimeSheet(session.user.id, month, year);
  if (timeSheet.status !== "BORRADOR" && timeSheet.status !== "RECHAZADO") {
    return { ok: false, error: "Este control horario ya no se puede editar." };
  }

  let saved;
  try {
    saved = await saveUploadedFile(file, `timesheets/${timeSheet.id}`, {
      allowedExtensions: ATTACHMENT_EXTENSIONS,
    });
  } catch (err) {
    if (err instanceof UploadValidationError) return { ok: false, error: err.message };
    throw err;
  }

  await prisma.attachment.create({
    data: {
      timeSheetId: timeSheet.id,
      userId: session.user.id,
      fileName: saved.fileName,
      filePath: saved.filePath,
      mimeType: saved.mimeType,
    },
  });

  revalidatePath("/control-horario");
  return { ok: true };
}

export async function signAsEmployeeAction(
  month: number,
  year: number,
  entries: EntryInput[],
  notes: string,
  signatureDataUrl: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await requireEmployeeSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const validationError = validateTimeSheetInput(month, year, entries);
  if (validationError) return { ok: false, error: validationError };

  const timeSheet = await getOrCreateDraftTimeSheet(session.user.id, month, year);
  if (timeSheet.status !== "BORRADOR" && timeSheet.status !== "RECHAZADO") {
    return { ok: false, error: "Este control horario ya no se puede firmar." };
  }

  const hasAnyEntry = entries.some((e) => e.checkIn && e.checkOut);
  const attachmentCount = await prisma.attachment.count({ where: { timeSheetId: timeSheet.id } });
  if (!hasAnyEntry && attachmentCount === 0) {
    return { ok: false, error: "Rellena al menos un día o adjunta un archivo antes de firmar." };
  }

  // Si se está re-firmando (p. ej. tras un rechazo), elimina la firma
  // anterior del disco para no dejar ficheros huérfanos.
  const previousSignature = await prisma.signature.findUnique({
    where: { timeSheetId_signerRole: { timeSheetId: timeSheet.id, signerRole: "EMPLEADO" } },
  });

  const imagePath = await saveSignatureImage(signatureDataUrl, `timesheets/${timeSheet.id}`);
  const ipAddress = await clientIp();

  await prisma.$transaction([
    prisma.timeSheet.update({
      where: { id: timeSheet.id },
      data: {
        notes,
        status: "FIRMADO_EMPLEADO",
        submittedAt: new Date(),
        rejectionReason: null,
        rejectedAt: null,
        rejectedById: null,
      },
    }),
    ...entries.map((entry) => {
      const hours = calculateDayHours(entry.checkIn, entry.checkOut);
      return prisma.timeEntry.upsert({
        where: { timeSheetId_day: { timeSheetId: timeSheet.id, day: entry.day } },
        create: {
          timeSheetId: timeSheet.id,
          day: entry.day,
          checkIn: entry.checkIn || null,
          checkOut: entry.checkOut || null,
          notes: entry.notes || null,
          ...hours,
        },
        update: {
          checkIn: entry.checkIn || null,
          checkOut: entry.checkOut || null,
          notes: entry.notes || null,
          ...hours,
        },
      });
    }),
    prisma.signature.upsert({
      where: { timeSheetId_signerRole: { timeSheetId: timeSheet.id, signerRole: "EMPLEADO" } },
      create: {
        timeSheetId: timeSheet.id,
        signerRole: "EMPLEADO",
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

  revalidatePath("/control-horario");
  return { ok: true };
}

export async function deleteAttachmentAction(attachmentId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await requireEmployeeSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { timeSheet: true },
  });
  if (!attachment || attachment.userId !== session.user.id) {
    return { ok: false, error: "Adjunto no encontrado." };
  }

  if (
    attachment.timeSheet &&
    attachment.timeSheet.status !== "BORRADOR" &&
    attachment.timeSheet.status !== "RECHAZADO"
  ) {
    return { ok: false, error: "Este control horario ya no se puede editar." };
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });
  await deleteUploadedFile(attachment.filePath);

  revalidatePath("/control-horario");
  return { ok: true };
}

export async function copyFromPreviousMonthAction(
  month: number,
  year: number
): Promise<{ ok: boolean; error?: string; entries?: EntryInput[] }> {
  const session = await requireEmployeeSession();
  if (!session) return { ok: false, error: "No autorizado." };

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const previous = await prisma.timeSheet.findUnique({
    where: { userId_month_year: { userId: session.user.id, month: prevMonth, year: prevYear } },
    include: { entries: { orderBy: { day: "asc" } } },
  });

  if (!previous || previous.entries.length === 0) {
    return { ok: false, error: "No hay datos en el mes anterior para copiar." };
  }

  const current = await getOrCreateDraftTimeSheet(session.user.id, month, year);
  if (current.status !== "BORRADOR" && current.status !== "RECHAZADO") {
    return { ok: false, error: "Este control horario ya no se puede editar." };
  }

  const maxDay = daysInMonth(month, year);
  const entries: EntryInput[] = previous.entries
    .filter((e) => e.day <= maxDay)
    .map((e) => ({
      day: e.day,
      checkIn: e.checkIn ?? "",
      checkOut: e.checkOut ?? "",
      notes: e.notes ?? "",
    }));

  const validationError = validateTimeSheetInput(month, year, entries);
  if (validationError) return { ok: false, error: validationError };

  await prisma.$transaction(
    entries.map((entry) => {
      const hours = calculateDayHours(entry.checkIn, entry.checkOut);
      return prisma.timeEntry.upsert({
        where: { timeSheetId_day: { timeSheetId: current.id, day: entry.day } },
        create: {
          timeSheetId: current.id,
          day: entry.day,
          checkIn: entry.checkIn || null,
          checkOut: entry.checkOut || null,
          notes: entry.notes || null,
          ...hours,
        },
        update: {
          checkIn: entry.checkIn || null,
          checkOut: entry.checkOut || null,
          notes: entry.notes || null,
          ...hours,
        },
      });
    })
  );

  revalidatePath("/control-horario");
  return { ok: true, entries };
}
