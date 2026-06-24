-- AlterTable
ALTER TABLE "MarketIntelligenceInsight" ADD COLUMN     "resultData" JSONB;

-- AlterTable
ALTER TABLE "MarketIntelligenceResearchRun" ADD COLUMN     "executionLog" TEXT;
