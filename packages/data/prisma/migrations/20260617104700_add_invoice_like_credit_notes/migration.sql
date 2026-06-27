-- AlterTable
ALTER TABLE "CreditNote"
ADD COLUMN     "subtotalCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "taxCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalCents" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN   "amountCents" SET DEFAULT 0;

-- Backfill existing amount-only credit notes into invoice-like total fields.
UPDATE "CreditNote"
SET
  "subtotalCents" = "amountCents",
  "taxCents" = 0,
  "discountCents" = 0,
  "totalCents" = "amountCents"
WHERE "amountCents" > 0;

-- CreateTable
CREATE TABLE "CreditNoteLineItem" (
    "id" TEXT NOT NULL,
    "creditNoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditNoteLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditNoteLineItem_creditNoteId_idx" ON "CreditNoteLineItem"("creditNoteId");

-- AddForeignKey
ALTER TABLE "CreditNoteLineItem" ADD CONSTRAINT "CreditNoteLineItem_creditNoteId_fkey" FOREIGN KEY ("creditNoteId") REFERENCES "CreditNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;