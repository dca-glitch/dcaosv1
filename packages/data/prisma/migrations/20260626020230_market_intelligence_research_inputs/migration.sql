-- Add research input fields to MarketIntelligenceProject
-- These optional fields capture keywords, competitors, niche, product/service focus,
-- and lightweight client/month context for deterministic insight generation.

ALTER TABLE "MarketIntelligenceProject" ADD COLUMN "keywords" TEXT;
ALTER TABLE "MarketIntelligenceProject" ADD COLUMN "competitors" TEXT;
ALTER TABLE "MarketIntelligenceProject" ADD COLUMN "niche" TEXT;
ALTER TABLE "MarketIntelligenceProject" ADD COLUMN "productServiceFocus" TEXT;
ALTER TABLE "MarketIntelligenceProject" ADD COLUMN "targetClientName" TEXT;
ALTER TABLE "MarketIntelligenceProject" ADD COLUMN "targetMonth" TEXT;
