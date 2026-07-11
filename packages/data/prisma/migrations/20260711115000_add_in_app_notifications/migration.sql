-- CreateEnum
CREATE TYPE "InAppNotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateTable
CREATE TABLE "InAppNotification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "recipientRole" TEXT NOT NULL,
    "clientId" TEXT,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "relatedEntityType" TEXT NOT NULL,
    "relatedEntityId" TEXT NOT NULL,
    "actionKey" TEXT NOT NULL DEFAULT 'default',
    "correlationId" TEXT,
    "idempotencyKey" TEXT,
    "status" "InAppNotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "readAt" TIMESTAMP(3),
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InAppNotification_tenantId_eventType_relatedEntityType_relatedEntityId_recipientUserId_actionKey_key" ON "InAppNotification"("tenantId", "eventType", "relatedEntityType", "relatedEntityId", "recipientUserId", "actionKey");

-- CreateIndex
CREATE INDEX "InAppNotification_tenantId_recipientUserId_status_createdAt_idx" ON "InAppNotification"("tenantId", "recipientUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "InAppNotification_tenantId_clientId_status_createdAt_idx" ON "InAppNotification"("tenantId", "clientId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "InAppNotification_tenantId_eventType_createdAt_idx" ON "InAppNotification"("tenantId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "InAppNotification_tenantId_recipientRole_createdAt_idx" ON "InAppNotification"("tenantId", "recipientRole", "createdAt");

-- CreateIndex
CREATE INDEX "InAppNotification_correlationId_idx" ON "InAppNotification"("correlationId");

-- CreateIndex
CREATE INDEX "InAppNotification_idempotencyKey_idx" ON "InAppNotification"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InAppNotification" ADD CONSTRAINT "InAppNotification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
