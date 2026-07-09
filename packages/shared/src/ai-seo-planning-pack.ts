/**
 * SEO planning pack contract (G56).
 * Built on approved context and research summaries.
 */

export const AI_SEO_PLANNING_PACK_VERSION = "AI_SEO_PLANNING_PACK_V1";

/** Monthly article target for Puriva operating pack. */
export const PURIVA_MONTHLY_ARTICLE_TARGET = 30;

export interface AiArticleOutlineBatchItem {
  outlineId: string;
  title: string;
  targetKeyword: string | null;
  contentType: string;
  sortOrder: number;
  reviewReady: boolean;
}

export interface AiSeoPlanOutput {
  planId: string;
  researchPackId: string | null;
  monthlyArticleTarget: number;
  articleOutlines: AiArticleOutlineBatchItem[];
  complianceReviewRequired: true;
  reviewReady: boolean;
}
