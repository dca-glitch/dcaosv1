ALTER TABLE "AiDeliveryContentDraft"
  ADD COLUMN "reviewRequestedAt" TIMESTAMP(3),
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "revisionCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "clientComment" TEXT;