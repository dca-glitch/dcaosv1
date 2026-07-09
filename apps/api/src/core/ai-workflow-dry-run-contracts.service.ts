/**
 * Deterministic dry-run contract builders (G57–G59).
 * No live provider calls — placeholder outputs for operator preview.
 */

import type {
  AiContentDraftBatchPlan,
  AiResearchPackOutput,
  AiSeoPlanOutput
} from "@dca-os-v1/shared";
import {
  AI_CONTENT_DRAFT_BATCH_VERSION,
  AI_RESEARCH_PACK_CONTRACT_VERSION,
  AI_SEO_PLANNING_PACK_VERSION,
  PURIVA_MONTHLY_ARTICLE_TARGET
} from "@dca-os-v1/shared";

export const AI_WORKFLOW_DRY_RUN_CONTRACTS_VERSION = "AI_WORKFLOW_DRY_RUN_CONTRACTS_V1";

export function buildDryRunResearchPackOutput(input: {
  packId?: string;
  briefIds?: string[];
}): AiResearchPackOutput {
  return {
    packId: input.packId ?? "dry-run-research-pack",
    briefIds: input.briefIds ?? ["brief-dry-run-1"],
    sourceSummaries: [
      {
        sourceTitle: "Public wellness overview (dry-run placeholder)",
        sourceUrl: null,
        sourceType: "public_web",
        citationNote: "Dry-run only — no live research provider called.",
        retrievedAtIso: null
      }
    ],
    keyFindings: ["Dry-run research summary — operator review required before client use."],
    keywordOpportunities: ["wellness content", "local clinic visibility"],
    contentRecommendations: ["Educational articles with compliance review gate."],
    publicSourceOnly: true,
    reviewReady: false
  };
}

export function buildDryRunSeoPlanOutput(input: {
  planId?: string;
  researchPackId?: string | null;
}): AiSeoPlanOutput {
  return {
    planId: input.planId ?? "dry-run-seo-plan",
    researchPackId: input.researchPackId ?? "dry-run-research-pack",
    monthlyArticleTarget: PURIVA_MONTHLY_ARTICLE_TARGET,
    articleOutlines: [
      {
        outlineId: "outline-dry-run-1",
        title: "Dry-run article outline",
        targetKeyword: "wellness education",
        contentType: "article",
        sortOrder: 1,
        reviewReady: false
      }
    ],
    complianceReviewRequired: true,
    reviewReady: false
  };
}

export function buildDryRunContentDraftBatchPlan(input: {
  batchId?: string;
  seoPlanId?: string;
}): AiContentDraftBatchPlan {
  return {
    batchId: input.batchId ?? "dry-run-draft-batch",
    researchPackIds: ["dry-run-research-pack"],
    seoPlanId: input.seoPlanId ?? "dry-run-seo-plan",
    monthlyArticleTarget: PURIVA_MONTHLY_ARTICLE_TARGET,
    drafts: [
      {
        draftId: "draft-dry-run-1",
        outlineId: "outline-dry-run-1",
        title: "Dry-run article draft (planned)",
        status: "planned",
        estimatedCostUsd: 0.75,
        regenerationScopeDefault: "section"
      }
    ],
    adminReviewQueueRequired: true,
    fullRegenerationLoopsDisabled: true
  };
}

export function resolveDryRunContractForTaskType(taskType: string): {
  contractVersion: string;
  output: AiResearchPackOutput | AiSeoPlanOutput | AiContentDraftBatchPlan | null;
} {
  if (taskType === "research_pack") {
    return {
      contractVersion: AI_RESEARCH_PACK_CONTRACT_VERSION,
      output: buildDryRunResearchPackOutput({})
    };
  }
  if (taskType === "seo_plan" || taskType === "article_outline") {
    return {
      contractVersion: AI_SEO_PLANNING_PACK_VERSION,
      output: buildDryRunSeoPlanOutput({})
    };
  }
  if (taskType === "article_draft") {
    return {
      contractVersion: AI_CONTENT_DRAFT_BATCH_VERSION,
      output: buildDryRunContentDraftBatchPlan({})
    };
  }
  return { contractVersion: AI_WORKFLOW_DRY_RUN_CONTRACTS_VERSION, output: null };
}
