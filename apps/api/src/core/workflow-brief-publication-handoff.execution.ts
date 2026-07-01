/**
 * Workflow brief publication handoff — package-to-publication mapping and idempotency helpers.
 *
 * Naming guard (helpers only; not wired to runtime/API/UI in this block):
 * - Release prep: `workflow-brief-image-set.execution` — admin release-prep summary.
 * - Publication handoff (this file): maps packaged items for WordPress draft preparation.
 * - Final release package: `workflow-brief-final-release.execution` — client-safe finalize snapshot.
 *
 * Legacy note: a prior mixed block stored handoff results as `release_execution_result` in planJson.
 * Future runtime wiring should read that legacy kind for backward compatibility.
 */
import { createHash } from "node:crypto";

export const WORKFLOW_BRIEF_PUBLICATION_HANDOFF_VERSION = "WORKFLOW_BRIEF_PUBLICATION_HANDOFF_V1";
export const WORKFLOW_BRIEF_PUBLICATION_HANDOFF_MODE = "PREPARE_WORDPRESS_DRAFT";

/** @deprecated Use WORKFLOW_BRIEF_PUBLICATION_HANDOFF_VERSION — legacy mixed-block alias. */
export const WORKFLOW_BRIEF_RELEASE_EXECUTION_VERSION = WORKFLOW_BRIEF_PUBLICATION_HANDOFF_VERSION;

/** @deprecated Use WORKFLOW_BRIEF_PUBLICATION_HANDOFF_MODE — legacy mixed-block alias. */
export const WORKFLOW_BRIEF_RELEASE_EXECUTION_MODE = WORKFLOW_BRIEF_PUBLICATION_HANDOFF_MODE;

export type WorkflowBriefPublicationHandoffStage =
  | "not_ready"
  | "publication_target_missing"
  | "release_prep_missing"
  | "ready_to_execute"
  | "draft_prepared"
  | "package_changed_since_handoff";

export type WorkflowBriefPublicationHandoffPackageMappingItem = {
  contentPlanItemId: string;
  planItemTitle: string;
  contentDraftId: string;
  textDeliverableId: string;
  articleImageId: string;
  textTitle: string;
  bodyContent: string;
  excerpt: string | null;
  imageTitle: string;
  featuredImageRef: string | null;
  textDeliverableStatus: string;
  imageStatus: string;
  textDeliverableUpdatedAt: string;
  contentDraftUpdatedAt: string;
  articleImageUpdatedAt: string;
};

export type WorkflowBriefPublicationHandoffItem = {
  contentPlanItemId: string;
  planItemTitle: string;
  textDeliverableId: string;
  articleImageId: string;
  publicationLogId: string | null;
  outcome: "created" | "reused";
  draftStatus: "PREPARED";
  draftTitle: string;
  draftBodyPreview: string;
  featuredImageRef: string | null;
  publicationTargetId: string;
  publicationTargetLabel: string;
  preparedAt: string;
};

export type WorkflowBriefPublicationHandoffRecord = {
  version: string;
  kind: "publication_handoff_result";
  briefId: string;
  executedAt: string;
  executionMode: typeof WORKFLOW_BRIEF_PUBLICATION_HANDOFF_MODE;
  publicationTargetId: string;
  publicationTargetLabel: string;
  packageFingerprint: string;
  aiDeliveryProjectId: string;
  productionPlanId: string | null;
  preparedCount: number;
  reusedCount: number;
  items: WorkflowBriefPublicationHandoffItem[];
  note: string;
};

export function computePublicationHandoffPackageFingerprint(
  items: WorkflowBriefPublicationHandoffPackageMappingItem[]
): string {
  const payload = items
    .map((item) =>
      [
        item.contentPlanItemId,
        item.textDeliverableId,
        item.contentDraftId,
        item.articleImageId,
        item.textDeliverableUpdatedAt,
        item.contentDraftUpdatedAt,
        item.articleImageUpdatedAt,
        item.textDeliverableStatus,
        item.imageStatus
      ].join(":")
    )
    .sort()
    .join("|");
  const digest = createHash("sha256").update(payload).digest("hex").slice(0, 16);
  return `fp_v1_${digest}`;
}

/** @deprecated Use computePublicationHandoffPackageFingerprint — legacy mixed-block alias. */
export const computeWorkflowBriefPackageFingerprint = computePublicationHandoffPackageFingerprint;

export function computePublicationHandoffStage(input: {
  packageComplete: boolean;
  releasePrepared: boolean;
  publicationTargetAvailable: boolean;
  handoffExecuted: boolean;
  packageFingerprint: string;
  storedFingerprint: string | null;
}): WorkflowBriefPublicationHandoffStage {
  if (!input.packageComplete) {
    return "not_ready";
  }
  if (!input.publicationTargetAvailable) {
    return "publication_target_missing";
  }
  if (!input.releasePrepared) {
    return "release_prep_missing";
  }
  if (
    input.handoffExecuted &&
    input.storedFingerprint &&
    input.storedFingerprint !== input.packageFingerprint
  ) {
    return "package_changed_since_handoff";
  }
  if (input.handoffExecuted) {
    return "draft_prepared";
  }
  return "ready_to_execute";
}

/** @deprecated Use computePublicationHandoffStage — legacy mixed-block alias. */
export const computeReleaseExecutionStage = computePublicationHandoffStage;

export function canExecutePublicationHandoff(input: {
  packageComplete: boolean;
  releasePrepared: boolean;
  publicationTargetAvailable: boolean;
  isAdmin: boolean;
}): { allowed: boolean; blockReason: string | null } {
  if (!input.isAdmin) {
    return { allowed: false, blockReason: "Admin access required to execute publication handoff." };
  }
  if (!input.packageComplete) {
    return { allowed: false, blockReason: "Package is not complete enough for publication handoff." };
  }
  if (!input.publicationTargetAvailable) {
    return {
      allowed: false,
      blockReason: "Configure a publication target for this client before publication handoff."
    };
  }
  if (!input.releasePrepared) {
    return {
      allowed: false,
      blockReason: "Run release preparation before executing publication handoff."
    };
  }
  return { allowed: true, blockReason: null };
}

/** @deprecated Use canExecutePublicationHandoff — legacy mixed-block alias. */
export const canExecuteWorkflowBriefRelease = canExecutePublicationHandoff;

export function resolvePublicationHandoffFeaturedImageRef(input: {
  finalImageUrl?: string | null;
  previewImageUrl?: string | null;
}): string | null {
  const finalRef = input.finalImageUrl?.trim() || null;
  if (finalRef) {
    return finalRef;
  }
  const previewRef = input.previewImageUrl?.trim() || null;
  return previewRef || null;
}

/** @deprecated Use resolvePublicationHandoffFeaturedImageRef — legacy mixed-block alias. */
export const resolveFeaturedImageRef = resolvePublicationHandoffFeaturedImageRef;

export function buildPublicationHandoffPackageMappingItem(input: {
  contentPlanItemId: string;
  planItemTitle: string;
  contentDraftId: string;
  textDeliverableId: string;
  articleImageId: string;
  textTitle: string;
  bodyContent: string;
  excerpt?: string | null;
  imageTitle: string;
  featuredImageRef: string | null;
  textDeliverableStatus: string;
  imageStatus: string;
  textDeliverableUpdatedAt: Date;
  contentDraftUpdatedAt: Date;
  articleImageUpdatedAt: Date;
}): WorkflowBriefPublicationHandoffPackageMappingItem {
  return {
    contentPlanItemId: input.contentPlanItemId,
    planItemTitle: input.planItemTitle,
    contentDraftId: input.contentDraftId,
    textDeliverableId: input.textDeliverableId,
    articleImageId: input.articleImageId,
    textTitle: input.textTitle.trim(),
    bodyContent: input.bodyContent.trim(),
    excerpt: input.excerpt?.trim() || null,
    imageTitle: input.imageTitle.trim(),
    featuredImageRef: input.featuredImageRef,
    textDeliverableStatus: input.textDeliverableStatus,
    imageStatus: input.imageStatus,
    textDeliverableUpdatedAt: input.textDeliverableUpdatedAt.toISOString(),
    contentDraftUpdatedAt: input.contentDraftUpdatedAt.toISOString(),
    articleImageUpdatedAt: input.articleImageUpdatedAt.toISOString()
  };
}

/** @deprecated Use buildPublicationHandoffPackageMappingItem — legacy mixed-block alias. */
export const buildWorkflowBriefReleasePackageMappingItem = buildPublicationHandoffPackageMappingItem;

export function buildPublicationHandoffItemFromDraft(input: {
  mapping: WorkflowBriefPublicationHandoffPackageMappingItem;
  wordpressDraft: {
    title: string;
    body: string;
    publicationTargetId?: string | null;
    publicationTargetLabel?: string | null;
  };
  publicationLogId: string | null;
  outcome: "created" | "reused";
  preparedAt: string;
}): WorkflowBriefPublicationHandoffItem {
  return {
    contentPlanItemId: input.mapping.contentPlanItemId,
    planItemTitle: input.mapping.planItemTitle,
    textDeliverableId: input.mapping.textDeliverableId,
    articleImageId: input.mapping.articleImageId,
    publicationLogId: input.publicationLogId,
    outcome: input.outcome,
    draftStatus: "PREPARED",
    draftTitle: input.wordpressDraft.title,
    draftBodyPreview: input.wordpressDraft.body.slice(0, 280),
    featuredImageRef: input.mapping.featuredImageRef,
    publicationTargetId: input.wordpressDraft.publicationTargetId ?? "",
    publicationTargetLabel: input.wordpressDraft.publicationTargetLabel ?? "",
    preparedAt: input.preparedAt
  };
}

/** @deprecated Use buildPublicationHandoffItemFromDraft — legacy mixed-block alias. */
export const buildReleaseExecutionItemFromDraft = buildPublicationHandoffItemFromDraft;

export function buildPublicationHandoffRecord(input: {
  briefId: string;
  executedAt: string;
  publicationTargetId: string;
  publicationTargetLabel: string;
  packageFingerprint: string;
  aiDeliveryProjectId: string;
  productionPlanId: string | null;
  items: WorkflowBriefPublicationHandoffItem[];
}): WorkflowBriefPublicationHandoffRecord {
  const preparedCount = input.items.filter((item) => item.outcome === "created").length;
  const reusedCount = input.items.filter((item) => item.outcome === "reused").length;

  return {
    version: WORKFLOW_BRIEF_PUBLICATION_HANDOFF_VERSION,
    kind: "publication_handoff_result",
    briefId: input.briefId,
    executedAt: input.executedAt,
    executionMode: WORKFLOW_BRIEF_PUBLICATION_HANDOFF_MODE,
    publicationTargetId: input.publicationTargetId,
    publicationTargetLabel: input.publicationTargetLabel,
    packageFingerprint: input.packageFingerprint,
    aiDeliveryProjectId: input.aiDeliveryProjectId,
    productionPlanId: input.productionPlanId,
    preparedCount,
    reusedCount,
    items: input.items,
    note: "Publication handoff helpers only. WordPress draft preparation is not executed in this block."
  };
}

/** @deprecated Use buildPublicationHandoffRecord — legacy mixed-block alias. */
export const buildReleaseExecutionRecord = buildPublicationHandoffRecord;

export function shouldReusePublicationHandoff(input: {
  storedFingerprint: string | null;
  currentFingerprint: string;
  handoffExecuted: boolean;
}): boolean {
  return Boolean(
    input.handoffExecuted &&
      input.storedFingerprint &&
      input.storedFingerprint === input.currentFingerprint
  );
}

/** @deprecated Use shouldReusePublicationHandoff — legacy mixed-block alias. */
export function shouldReuseReleaseExecution(input: {
  storedFingerprint: string | null;
  currentFingerprint: string;
  releaseExecuted: boolean;
}): boolean {
  return shouldReusePublicationHandoff({
    storedFingerprint: input.storedFingerprint,
    currentFingerprint: input.currentFingerprint,
    handoffExecuted: input.releaseExecuted
  });
}
