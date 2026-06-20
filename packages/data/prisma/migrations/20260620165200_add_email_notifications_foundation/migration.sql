-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "EmailTemplateKey" AS ENUM ('CLIENT_INVITE', 'PASSWORD_RESET', 'AI_DELIVERY_BRIEF_REQUEST', 'AI_DELIVERY_REVIEW_REQUEST', 'AI_DELIVERY_APPROVED', 'INVOICE_ISSUED');

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "templateKey" "EmailTemplateKey" NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "relatedModule" TEXT,
    "relatedEntityId" TEXT,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLog_tenantId_idx" ON "EmailLog"("tenantId");

-- CreateIndex
CREATE INDEX "EmailLog_recipientEmail_idx" ON "EmailLog"("recipientEmail");

-- CreateIndex
CREATE INDEX "EmailLog_templateKey_idx" ON "EmailLog"("templateKey");

-- CreateIndex
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");

-- CreateIndex
CREATE INDEX "EmailLog_relatedModule_relatedEntityId_idx" ON "EmailLog"("relatedModule", "relatedEntityId");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;