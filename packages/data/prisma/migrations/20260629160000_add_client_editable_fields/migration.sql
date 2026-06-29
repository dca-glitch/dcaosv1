-- AlterTable
ALTER TABLE "AiDeliveryDeliverable" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "category" TEXT,
ADD COLUMN     "scheduledPublishAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ClientEdit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "deliverableId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientEdit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientEdit_tenantId_idx" ON "ClientEdit"("tenantId");

-- CreateIndex
CREATE INDEX "ClientEdit_deliverableId_idx" ON "ClientEdit"("deliverableId");

-- CreateIndex
CREATE INDEX "ClientEdit_userId_idx" ON "ClientEdit"("userId");

-- CreateIndex
CREATE INDEX "ClientEdit_createdAt_idx" ON "ClientEdit"("createdAt");

-- AddForeignKey
ALTER TABLE "ClientEdit" ADD CONSTRAINT "ClientEdit_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "AiDeliveryDeliverable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientEdit" ADD CONSTRAINT "ClientEdit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
