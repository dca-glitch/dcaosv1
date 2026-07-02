-- Add optional storageKey to AiDeliveryContentPlan for admin-triggered PDF export storage reference.

-- AlterTable
ALTER TABLE "AiDeliveryContentPlan" ADD COLUMN "storageKey" TEXT;
