import { prisma } from "@/lib/prisma";

export async function writeAuditLog(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  detail?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        detail: input.detail ?? null,
      },
    });
  } catch {
    // No bloquear flujos de negocio por fallos de auditoría
  }
}
