/**
 * Workflow brief deliverable packaging — pure local logic for packaging generated drafts
 * into review-ready AiDeliveryDeliverable records without provider dependencies.
 */
import { isWorkflowBriefDraftForBrief } from "./workflow-brief-draft.execution";

export const WORKFLOW_BRIEF_DELIVERABLE_PACKAGING_VERSION = "WORKFLOW_BRIEF_DELIVERABLE_PACKAGING_V1";
export const WORKFLOW_BRIEF_DELIVERABLE_MARKER = "workflow-brief-deliverable:v1";

export type WorkflowBriefPackagingOutcome =
  | "created"
  | "reused"
  | "updated"
  | "skipped_locked"
  | "skipped_ineligible"
  | "skipped_missing_draft";

export type WorkflowBriefDeliverablePackagingStage =
  | "none"
  | "drafts_only"
  | "partially_packaged"
  | "fully_packaged"
  | "in_client_review"
  | "review_complete";

export type WorkflowBriefItemPackagingState =
  | "not_eligible"
  | "unpackaged"
  | "packaged"
  | "locked"
  | "pending_review"
  | "approved"
  | "rejected";

const LOCKED_DELIVERABLE_STATUSES = new Set([
  "PENDING_CLIENT_REVIEW",
  "APPROVED_BY_CLIENT",
  "DELIVERED",
  "ACCEPTED"
]);

const CLIENT_REVIEW_DELIVERABLE_STATUSES = new Set(["PENDING_CLIENT_REVIEW", "APPROVED_BY_CLIENT"]);

export function buildWorkflowBriefDeliverableNotes(
  briefId: string,
  contentPlanItemId: string,
  contentDraftId: string
): string {
  return `[${WORKFLOW_BRIEF_DELIVERABLE_MARKER} brief=${briefId} item=${contentPlanItemId} draft=${contentDraftId}]`;
}

export function isWorkflowBriefPackagedDeliverable(notes: string | null | undefined, briefId: string): boolean {
  return (notes ?? "").includes(`${WORKFLOW_BRIEF_DELIVERABLE_MARKER} brief=${briefId}`);
}

export function isDeliverableLockedForRepackage(status: string | null | undefined): boolean {
  return LOCKED_DELIVERABLE_STATUSES.has((status ?? "").trim().toUpperCase());
}

export function canPackageWorkflowBriefContentDraft(
  draft: {
    notes: string | null;
    draftBody: string;
    isArchived: boolean;
    contentPlanItemId: string | null;
  },
  briefId: string
): boolean {
  if (draft.isArchived) {
    return false;
  }
  if (!draft.contentPlanItemId) {
    return false;
  }
  if (!isWorkflowBriefDraftForBrief(draft.notes, briefId)) {
    return false;
  }
  return draft.draftBody.trim().length > 0;
}

export function classifyItemPackagingState(input: {
  isEligible: boolean;
  hasDeliverable: boolean;
  deliverableStatus: string | null;
}): WorkflowBriefItemPackagingState {
  if (!input.isEligible) {
    return "not_eligible";
  }
  if (!input.hasDeliverable) {
    return "unpackaged";
  }

  const status = (input.deliverableStatus ?? "").toUpperCase();
  if (status === "PENDING_CLIENT_REVIEW") {
    return "pending_review";
  }
  if (status === "APPROVED_BY_CLIENT" || status === "ACCEPTED" || status === "DELIVERED") {
    return "approved";
  }
  if (status === "DRAFT" && input.hasDeliverable) {
    return "packaged";
  }
  if (status === "READY" || status === "REVISION_REQUESTED") {
    return "packaged";
  }
  if (isDeliverableLockedForRepackage(status)) {
    return "locked";
  }
  return "packaged";
}

export function classifyItemPackagingStateWithRejection(input: {
  isEligible: boolean;
  hasDeliverable: boolean;
  deliverableStatus: string | null;
  clientRejectionReason: string | null;
}): WorkflowBriefItemPackagingState {
  if (
    input.hasDeliverable &&
    (input.deliverableStatus ?? "").toUpperCase() === "DRAFT" &&
    (input.clientRejectionReason ?? "").trim().length > 0
  ) {
    return "rejected";
  }
  return classifyItemPackagingState(input);
}

export function canRepackageWorkflowBriefDeliverable(
  deliverable: { status: string; isArchived: boolean } | null
): boolean {
  if (!deliverable || deliverable.isArchived) {
    return false;
  }
  return !isDeliverableLockedForRepackage(deliverable.status);
}

export function computePackagingStage(input: {
  eligibleDraftCount: number;
  packagedCount: number;
  pendingReviewCount: number;
  approvedByClientCount: number;
}): WorkflowBriefDeliverablePackagingStage {
  if (input.eligibleDraftCount === 0) {
    return "none";
  }
  if (input.packagedCount === 0) {
    return "drafts_only";
  }
  if (input.approvedByClientCount > 0 && input.approvedByClientCount === input.packagedCount) {
    return "review_complete";
  }
  if (input.pendingReviewCount > 0) {
    return "in_client_review";
  }
  if (input.packagedCount < input.eligibleDraftCount) {
    return "partially_packaged";
  }
  return "fully_packaged";
}

export function buildWorkflowBriefDeliverablePayload(input: {
  briefId: string;
  productionPlanId: string | null;
  contentPlanItemId: string;
  contentDraftId: string;
  title: string;
  draftBody: string;
  slug: string | null;
}): {
  title: string;
  bodyContent: string;
  description: string | null;
  deliveryType: "ARTICLE_DRAFT";
  status: "DRAFT";
  notes: string;
  briefId: string;
  productionPlanId: string | null;
  contentDraftId: string;
} {
  const description =
    input.draftBody.trim().length > 240 ? `${input.draftBody.trim().slice(0, 237)}...` : input.draftBody.trim() || null;

  return {
    title: input.title.trim() || "Untitled workflow draft",
    bodyContent: input.draftBody,
    description,
    deliveryType: "ARTICLE_DRAFT",
    status: "DRAFT",
    notes: buildWorkflowBriefDeliverableNotes(input.briefId, input.contentPlanItemId, input.contentDraftId),
    briefId: input.briefId,
    productionPlanId: input.productionPlanId,
    contentDraftId: input.contentDraftId
  };
}

export function isClientReviewableDeliverableStatus(status: string | null | undefined): boolean {
  return CLIENT_REVIEW_DELIVERABLE_STATUSES.has((status ?? "").trim().toUpperCase());
}

export function summarizeBatchPackagingResult(outcomes: WorkflowBriefPackagingOutcome[]): {
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
