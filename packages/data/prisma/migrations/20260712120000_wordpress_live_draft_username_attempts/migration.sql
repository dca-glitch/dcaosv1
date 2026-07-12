-- AlterTable
ALTER TABLE "PublicationTarget" ADD COLUMN "wordpressUsername" TEXT;

-- CreateTable
CREATE TABLE "WordPressDraftLiveAttempt" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "publicationTargetId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "marker" TEXT,
    "state" TEXT NOT NULL,
    "wordpressPostId" TEXT,
    "safeError" TEXT,
    "submitRequestCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordPressDraftLiveAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WordPressDraftLiveAttempt_tenantId_idx" ON "WordPressDraftLiveAttempt"("tenantId");

-- CreateIndex
CREATE INDEX "WordPressDraftLiveAttempt_tenantId_wordpressPostId_idx" ON "WordPressDraftLiveAttempt"("tenantId", "wordpressPostId");

-- CreateIndex
CREATE UNIQUE INDEX "WordPressDraftLiveAttempt_tenantId_idempotencyKey_key" ON "WordPressDraftLiveAttempt"("tenantId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "WordPressDraftLiveAttempt" ADD CONSTRAINT "WordPressDraftLiveAttempt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordPressDraftLiveAttempt" ADD CONSTRAINT "WordPressDraftLiveAttempt_publicationTargetId_fkey" FOREIGN KEY ("publicationTargetId") REFERENCES "PublicationTarget"("id") ON DELETE SET NULL ON UPDATE CASCADE;
