/**
 * Content draft batch planning contract (G56).
 * No live generation — planning and review queue only.
 */

export const AI_CONTENT_DRAFT_BATCH_VERSION = "AI_CONTENT_DRAFT_BATCH_V1";

export type AiDraftRegenerationScope = "section" | "full";

export interface AiContentDraftBatchItem {
  draftId: string;
  outlineId: string;
  title: string;
  status: "planned" | "draft" | "review_ready" | "approved" | "rejected";
  estimatedCostUsd: number;
  regenerationScopeDefault: AiDraftRegenerationScope;
}

export interface AiContentDraftBatchPlan {
  batchId: string;
  researchPackIds: string[];
  seoPlanId: string;
  monthlyArticleTarget: number;
  drafts: AiContentDraftBatchItem[];
  adminReviewQueueRequired: true;
  fullRegenerationLoopsDisabled: true;
}
