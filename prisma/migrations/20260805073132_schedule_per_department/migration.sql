-- El horario asignado pasa a ser por departamento en lugar de por empleado.
-- Migramos los horarios ya subidos usando el departamento del empleado al
-- que estaban asignados, para no perder ningún archivo existente.

-- DropForeignKey
ALTER TABLE "schedules" DROP CONSTRAINT "schedules_userId_fkey";

-- DropIndex
DROP INDEX "schedules_userId_createdAt_idx";

-- AlterTable: añadir la nueva columna (nullable de momento, para poder rellenarla)
ALTER TABLE "schedules" ADD COLUMN "departmentId" TEXT;

-- Backfill: departamento del empleado al que estaba asignado cada horario
UPDATE "schedules" s
SET "departmentId" = u."departmentId"
FROM "users" u
WHERE s."userId" = u."id";

-- Cualquier horario que quedara sin departamento (usuario sin depto asignado)
-- no tiene un destino válido en el nuevo modelo; se elimina para poder aplicar
-- la restricción NOT NULL.
DELETE FROM "schedules" WHERE "departmentId" IS NULL;

-- AlterTable: ahora sí, columna obligatoria y quitamos la antigua
ALTER TABLE "schedules" ALTER COLUMN "departmentId" SET NOT NULL;
ALTER TABLE "schedules" DROP COLUMN "userId";

-- CreateIndex
CREATE INDEX "schedules_departmentId_createdAt_idx" ON "schedules"("departmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
