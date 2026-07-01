/**
 * Workflow brief image set + package completeness + release prep — pure local logic.
 *
 * Naming guard:
 * - Release prep (this file): metadata/summary only; not publication handoff or final release package.
 * - Publication handoff: `workflow-brief-publication-handoff.execution`.
 * - Final release package: `workflow-brief-final-release.execution`.
 */
import { isWorkflowBriefDraftForBrief } from "./workflow-brief-draft.execution";
import { isWorkflowBriefPackagedDeliverable } from "./workflow-brief-deliverable-packaging.execution";

export const WORKFLOW_BRIEF_IMAGE_SET_VERSION = "WORKFLOW_BRIEF_IMAGE_SET_V1";
export const WORKFLOW_BRIEF_IMAGE_MARKER = "workflow-brief-image:v1";
export const WORKFLOW_BRIEF_RELEASE_PREP_VERSION = "WORKFLOW_BRIEF_RELEASE_PREP_V1";

export type WorkflowBriefImageSetOutcome =
  | "created"
  | "reused"
  | "updated"
  | "skipped_locked"
  | "skipped_ineligible"
  | "skipped_missing_draft";

export type WorkflowBriefImageSetStage =
  | "none"
  | "text_only"
  | "partially_prepared"
  | "fully_prepared"
  | "in_client_review"
  | "review_complete";

export type WorkflowBriefPackageCompletenessStage =
  | "incomplete"
  | "text_ready"
  | "images_prepared"
  | "ready_for_client_review"
  | "client_review_in_progress"
  | "package_complete"
  | "ready_for_release_prep";

export type WorkflowBriefReleasePrepStage =
  | "not_ready"
  | "ready_for_release"
  | "release_prepared"
  | "publication_target_missing";

const LOCKED_ARTICLE_IMAGE_STATUSES = new Set(["APPROVED", "FINAL_READY"]);

const CLIENT_APPROVED_TEXT_STATUSES = new Set(["APPROVED_BY_CLIENT", "ACCEPTED", "DELIVERED"]);

const ADMIN_READY_IMAGE_STATUSES = new Set(["APPROVED", "FINAL_READY", "PREVIEW_READY"]);

export function buildWorkflowBriefImageNotes(
  briefId: string,
  contentPlanItemId: string,
  contentDraftId: string
): string {
  return `[${WORKFLOW_BRIEF_IMAGE_MARKER} brief=${briefId} item=${contentPlanItemId} draft=${contentDraftId}]`;
}

export function isWorkflowBriefArticleImage(notes: string | null | undefined, briefId: string): boolean {
  return (notes ?? "").includes(`${WORKFLOW_BRIEF_IMAGE_MARKER} brief=${briefId}`);
}

export function isArticleImageLockedForRefresh(status: string | null | undefined): boolean {
  return LOCKED_ARTICLE_IMAGE_STATUSES.has((status ?? "").trim().toUpperCase());
}

export function canPrepareWorkflowBriefImageSet(input: {
  draft: {
    notes: string | null;
    draftBody: string;
    isArchived: boolean;
    contentPlanItemId: string | null;
  } | null;
  briefId: string;
}): boolean {
  if (!input.draft) {
    return false;
  }
  return canPrepareWorkflowBriefImageSetFromDraft(input.draft, input.briefId);
}

export function canPrepareWorkflowBriefImageSetFromDraft(
  draft: {
    notes: string | null;
    draftBody: string;
    isArchived: boolean;
    contentPlanItemId: string | null;
  },
  briefId: string
): boolean {
  if (draft.isArchived || !draft.contentPlanItemId) {
    return false;
  }
  if (!isWorkflowBriefDraftForBrief(draft.notes, briefId)) {
    return false;
  }
  return draft.draftBody.trim().length > 0;
}

export function buildWorkflowBriefImageCandidate(input: {
  briefId: string;
  contentPlanItemId: string;
  contentDraftId: string;
  draftTitle: string;
  targetKeyword: string | null;
  briefTitle: string;
  goal: string | null;
}): {
  title: string;
  prompt: string;
  styleNotes: string;
  status: "READY_FOR_GENERATION";
  notes: string;
} {
  const keyword = input.targetKeyword?.trim() || "primary topic";
  const goal = input.goal?.trim() || "brand awareness";
  const title = `Hero image — ${input.draftTitle.trim() || "Workflow article"}`;
  const prompt = [
    `Editorial hero image for article: "${input.draftTitle.trim()}".`,
    `Keyword focus: ${keyword}.`,
    `Campaign brief: ${input.briefTitle.trim()}.`,
    `Business goal: ${goal}.`,
    "Professional, on-brand, suitable for blog header use. No text overlay."
  ].join(" ");

  return {
    title,
    prompt,
    styleNotes: `Workflow brief image candidate for ${input.briefTitle.trim()}. Local prompt-only preparation; generation via existing AI Delivery image flow.`,
    status: "READY_FOR_GENERATION",
    notes: buildWorkflowBriefImageNotes(input.briefId, input.contentPlanItemId, input.contentDraftId)
  };
}

export function classifyImageSetItemState(input: {
  isEligible: boolean;
  hasImage: boolean;
  imageStatus: string | null;
}): "not_eligible" | "missing" | "prepared" | "locked" | "preview_ready" | "approved" {
  if (!input.isEligible) {
    return "not_eligible";
  }
  if (!input.hasImage) {
    return "missing";
  }
  const status = (input.imageStatus ?? "").toUpperCase();
  if (status === "APPROVED" || status === "FINAL_READY") {
    return "approved";
  }
  if (status === "PREVIEW_READY") {
    return "preview_ready";
  }
  if (isArticleImageLockedForRefresh(status)) {
    return "locked";
  }
  return "prepared";
}

export function computeImageSetStage(input: {
  eligibleCount: number;
  preparedCount: number;
  pendingReviewCount: number;
  reviewCompleteCount: number;
}): WorkflowBriefImageSetStage {
  if (input.eligibleCount === 0) {
    return "none";
  }
  if (input.preparedCount === 0) {
    return "text_only";
  }
  if (input.reviewCompleteCount > 0 && input.reviewCompleteCount === input.eligibleCount) {
    return "review_complete";
  }
  if (input.pendingReviewCount > 0) {
    return "in_client_review";
  }
  if (input.preparedCount < input.eligibleCount) {
    return "partially_prepared";
  }
  return "fully_prepared";
}

export function isTextDeliverableClientApproved(status: string | null | undefined): boolean {
  return CLIENT_APPROVED_TEXT_STATUSES.has((status ?? "").trim().toUpperCase());
}

export function isImageAssetReviewComplete(input: {
  imageStatus: string | null;
  imageApprovalStatus: string | null;
  deliverableInClientReview: boolean;
}): boolean {
  if (input.deliverableInClientReview && input.imageApprovalStatus) {
    return input.imageApprovalStatus.toUpperCase() === "APPROVED";
  }
  return ADMIN_READY_IMAGE_STATUSES.has((input.imageStatus ?? "").trim().toUpperCase());
}

export function computePackageItemCompleteness(input: {
  hasTextDeliverable: boolean;
  textDeliverableStatus: string | null;
  hasImageCandidate: boolean;
  imageStatus: string | null;
  imageApprovalStatus: string | null;
  deliverableStatus: string | null;
}): {
  hasTextDeliverable: boolean;
  hasImageCandidate: boolean;
  textClientReviewed: boolean;
  imageClientReviewed: boolean;
  readyForClientReview: boolean;
  packageComplete: boolean;
  completenessStage: WorkflowBriefPackageCompletenessStage;
} {
  const deliverableInClientReview = (input.deliverableStatus ?? "").toUpperCase() === "PENDING_CLIENT_REVIEW";
  const textClientReviewed = isTextDeliverableClientApproved(input.textDeliverableStatus);
  const imageClientReviewed = isImageAssetReviewComplete({
    imageStatus: input.imageStatus,
    imageApprovalStatus: input.imageApprovalStatus,
    deliverableInClientReview
  });

  const readyForClientReview =
    input.hasTextDeliverable &&
    input.hasImageCandidate &&
    !textClientReviewed &&
    (input.textDeliverableStatus ?? "").toUpperCase() === "DRAFT";

  const packageComplete =
    input.hasTextDeliverable && input.hasImageCandidate && textClientReviewed && imageClientReviewed;

  let completenessStage: WorkflowBriefPackageCompletenessStage = "incomplete";
  if (packageComplete) {
    completenessStage = "package_complete";
  } else if (deliverableInClientReview) {
    completenessStage = "client_review_in_progress";
  } else if (readyForClientReview) {
    completenessStage = "ready_for_client_review";
  } else if (input.hasImageCandidate && input.hasTextDeliverable) {
    completenessStage = "images_prepared";
  } else if (input.hasTextDeliverable) {
    completenessStage = "text_ready";
  }

  return {
    hasTextDeliverable: input.hasTextDeliverable,
    hasImageCandidate: input.hasImageCandidate,
    textClientReviewed,
    imageClientReviewed,
    readyForClientReview,
    packageComplete,
    completenessStage
  };
}

export function computeOverallPackageCompletenessStage(input: {
  itemStages: WorkflowBriefPackageCompletenessStage[];
  eligibleItemCount: number;
  completeItemCount: number;
  publicationTargetAvailable: boolean;
  releasePrepared: boolean;
}): WorkflowBriefPackageCompletenessStage {
  if (input.eligibleItemCount === 0) {
    return "incomplete";
  }
  if (input.completeItemCount === input.eligibleItemCount) {
    return input.releasePrepared ? "ready_for_release_prep" : "package_complete";
  }
  if (input.itemStages.some((stage) => stage === "client_review_in_progress")) {
    return "client_review_in_progress";
  }
  if (input.itemStages.every((stage) => stage === "ready_for_client_review" || stage === "images_prepared")) {
    return "ready_for_client_review";
  }
  if (input.itemStages.some((stage) => stage === "images_prepared" || stage === "text_ready")) {
    return input.itemStages.some((stage) => stage === "images_prepared") ? "images_prepared" : "text_ready";
  }
  return "incomplete";
}

export function computeReleasePrepStage(input: {
  packageComplete: boolean;
  publicationTargetAvailable: boolean;
  releasePrepared: boolean;
}): WorkflowBriefReleasePrepStage {
  if (input.releasePrepared) {
    return input.publicationTargetAvailable ? "release_prepared" : "publication_target_missing";
  }
  if (!input.packageComplete) {
    return "not_ready";
  }
  if (!input.publicationTargetAvailable) {
    return "publication_target_missing";
  }
  return "ready_for_release";
}

export function buildPublishablePackageSummary(input: {
  briefId: string;
  projectId: string;
  productionPlanId: string | null;
  publicationTargetId: string | null;
  publicationTargetLabel: string | null;
  packages: Array<{
    contentPlanItemId: string;
    planItemTitle: string;
    contentDraftId: string;
    textDeliverableId: string;
    articleImageId: string;
    textTitle: string;
    bodyPreview: string;
    imageTitle: string;
    imagePromptPreview: string;
  }>;
}): Record<string, unknown> {
  return {
    version: WORKFLOW_BRIEF_RELEASE_PREP_VERSION,
    kind: "publishable_package_summary",
    briefId: input.briefId,
    aiDeliveryProjectId: input.projectId,
    productionPlanId: input.productionPlanId,
    publicationTargetId: input.publicationTargetId,
    publicationTargetLabel: input.publicationTargetLabel,
    packageCount: input.packages.length,
    packages: input.packages.map((pkg) => ({
      contentPlanItemId: pkg.contentPlanItemId,
      planItemTitle: pkg.planItemTitle,
      contentDraftId: pkg.contentDraftId,
      textDeliverableId: pkg.textDeliverableId,
      articleImageId: pkg.articleImageId,
      textTitle: pkg.textTitle,
      bodyPreview: pkg.bodyPreview.slice(0, 280),
      imageTitle: pkg.imageTitle,
      imagePromptPreview: pkg.imagePromptPreview.slice(0, 280)
    })),
    preparedAt: new Date().toISOString(),
    note: "Release preparation summary only. Live publication is not executed in this block."
  };
}

export function summarizeImageSetBatchResult(outcomes: WorkflowBriefImageSetOutcome[]): {
  created: number;
  reused: number;
  updated: number;
  skippedLocked: number;
  skippedIneligible: number;
  skippedMissingDraft: number;
} {
  return {
    created: outcomes.filter((o) => o === "created").length,
    reused: outcomes.filter((o) => o === "reused").length,
    updated: outcomes.filter((o) => o === "updated").length,
    skippedLocked: outcomes.filter((o) => o === "skipped_locked").length,
    skippedIneligible: outcomes.filter((o) => o === "skipped_ineligible").length,
    skippedMissingDraft: outcomes.filter((o) => o === "skipped_missing_draft").length
  };
}

export function isWorkflowBriefTextDeliverable(
  notes: string | null | undefined,
  briefId: string
): boolean {
  return isWorkflowBriefPackagedDeliverable(notes, briefId);
}
