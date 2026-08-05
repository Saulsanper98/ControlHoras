-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "attachments_timeSheetId_idx" ON "attachments"("timeSheetId");

-- CreateIndex
CREATE INDEX "attachments_userId_idx" ON "attachments"("userId");

-- CreateIndex
CREATE INDEX "hour_adjustments_userId_idx" ON "hour_adjustments"("userId");

-- CreateIndex
CREATE INDEX "news_pinned_publishedAt_idx" ON "news"("pinned", "publishedAt");

-- CreateIndex
CREATE INDEX "schedules_userId_createdAt_idx" ON "schedules"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "time_sheets_status_idx" ON "time_sheets"("status");

-- CreateIndex
CREATE INDEX "time_sheets_month_year_idx" ON "time_sheets"("month", "year");
