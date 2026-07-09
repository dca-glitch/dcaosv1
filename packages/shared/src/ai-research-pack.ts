/**
 * Research pack workflow contract (G56).
 * Public/source-only constraints; no live research provider calls.
 */

export const AI_RESEARCH_PACK_CONTRACT_VERSION = "AI_RESEARCH_PACK_V1";

/** Reuse research pack across 2–3 briefs instead of per-article. */
export const RESEARCH_PACK_BRIEF_REUSE_MIN = 2;
export const RESEARCH_PACK_BRIEF_REUSE_MAX = 3;

export interface AiResearchSourceSummary {
  sourceTitle: string;
  sourceUrl: string | null;
  sourceType: "public_web" | "approved_business_fact" | "operator_note";
  citationNote: string | null;
  retrievedAtIso: string | null;
}

export interface AiResearchPackOutput {
  packId: string;
  briefIds: string[];
  sourceSummaries: AiResearchSourceSummary[];
  keyFindings: string[];
  keywordOpportunities: string[];
  contentRecommendations: string[];
  publicSourceOnly: true;
  reviewReady: boolean;
}
