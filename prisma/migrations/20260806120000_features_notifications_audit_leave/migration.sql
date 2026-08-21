-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('VACACIONES', 'ASUNTOS_PROPIOS', 'MEDIO_DIA');

-- CreateEnum
CREATE TYPE "NewsStatus" AS ENUM ('BORRADOR', 'PUBLICADA');

-- AlterTable VacationRequest
ALTER TABLE "vacation_requests" ADD COLUMN "leaveType" "LeaveType" NOT NULL DEFAULT 'VACACIONES';
CREATE INDEX "vacation_requests_leaveType_idx" ON "vacation_requests"("leaveType");

-- AlterTable HourAdjustment
ALTER TABLE "hour_adjustments" ADD COLUMN "year" INTEGER NOT NULL DEFAULT 2026;
DROP INDEX IF EXISTS "hour_adjustments_userId_idx";
CREATE INDEX "hour_adjustments_userId_year_idx" ON "hour_adjustments"("userId", "year");

-- AlterTable News
ALTER TABLE "news" ADD COLUMN "status" "NewsStatus" NOT NULL DEFAULT 'PUBLICADA';
ALTER TABLE "news" ADD COLUMN "scheduledAt" TIMESTAMP(3);
DROP INDEX IF EXISTS "news_pinned_publishedAt_idx";
CREATE INDEX "news_status_pinned_publishedAt_idx" ON "news"("status", "pinned", "publishedAt");

-- CreateTable Notification
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt");
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable AuditLog
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
