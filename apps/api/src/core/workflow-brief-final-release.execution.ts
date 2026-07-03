/**
 * Workflow brief final release package — client-safe snapshot and finalize gates.
 *
 * Naming guard (do not confuse with other release stages):
 * - Release prep: `workflow-brief-image-set.execution` — admin summary before handoff/finalize.
 * - Publication handoff: `workflow-brief-publication-handoff.execution` — WordPress draft mapping only.
 * - Final release package (this file): `planJson.releasePackage` client-safe finalize snapshot.
 */
import { createHash, randomUUID } from "node:crypto";

export const WORKFLOW_BRIEF_FINAL_RELEASE_PACKAGE_VERSION = "WORKFLOW_BRIEF_FINAL_RELEASE_PACKAGE_V1";

export type WorkflowBriefFinalReleasePackageStage =
  | "not_ready"
  | "release_prep_missing"
  | "ready_to_finalize"
  | "finalized"
  | "package_changed_since_finalize";

export type WorkflowBriefFinalReleasePackageItemSource = {
  contentPlanItemId: string;
  planItemTitle: string;
  textDeliverableId: string;
  articleImageId: string;
  textTitle: string;
  deliveryType: string;
  exportUrl: string | null;
  textDeliverableStatus: string;
  imageTitle: string;
  imageUrl: string | null;
  imageStatus: string;
};

export type WorkflowBriefFinalReleasePackageRecord = {
  version: string;
  kind: "final_release_package";
  releasePackageId: string;
  briefId: string;
  briefTitle: string;
  aiDeliveryProjectId: string;
  projectName: string;
  productionPlanId: string | null;
  finalizedAt: string;
  releaseStatus: "RELEASED";
  packageFingerprint: string;
  summary: string;
  deliverableCount: number;
  imageCount: number;
  items: WorkflowBriefFinalReleasePackageItemSource[];
  clientSnapshot: ClientSafeReleasePackage;
  note: string;
};

export type ClientSafeReleasePackageDeliverable = {
  title: string;
  type: string;
  exportUrl: string | null;
  status: "RELEASED";
};

export type ClientSafeReleasePackageImage = {
  title: string;
  altText: string | null;
  imageUrl: string | null;
  status: "FINAL";
};

export type ClientSafeReleasePackage = {
  briefTitle: string;
  projectName: string;
  finalizedAt: string;
  releaseStatus: "RELEASED";
  summary: string;
  deliverables: ClientSafeReleasePackageDeliverable[];
  images: ClientSafeReleasePackageImage[];
  notes: string | null;
};

const RELEASABLE_TEXT_STATUSES = new Set(["APPROVED_BY_CLIENT", "ACCEPTED", "DELIVERED"]);

export type FinalReleasePackageFingerprintItem = {
  contentPlanItemId: string;
  textDeliverableId: string;
  contentDraftId: string;
  articleImageId: string;
  textDeliverableUpdatedAt: Date;
  contentDraftUpdatedAt: Date;
  articleImageUpdatedAt: Date;
  textDeliverableStatus: string;
  imageStatus: string;
};

export function resolveFeaturedImageRef(input: {
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

export function computeFinalReleasePackageFingerprint(
  items: FinalReleasePackageFingerprintItem[]
): string {
  const payload = items
    .map((item) =>
      [
        item.contentPlanItemId,
        item.textDeliverableId,
        item.contentDraftId,
        item.articleImageId,
        item.textDeliverableUpdatedAt.toISOString(),
        item.contentDraftUpdatedAt.toISOString(),
        item.articleImageUpdatedAt.toISOString(),
        item.textDeliverableStatus,
        item.imageStatus
      ].join(":")
    )
    .sort()
    .join("|");
  const digest = createHash("sha256").update(payload).digest("hex").slice(0, 16);
  return `fp_v1_${digest}`;
}

export function isReleasableTextDeliverableStatus(status: string | null | undefined): boolean {
  return RELEASABLE_TEXT_STATUSES.has((status ?? "").trim().toUpperCase());
}

export function computeFinalReleasePackageStage(input: {
  releasePrepared: boolean;
  releasePackageFinalized: boolean;
  canFinalize: boolean;
  packageChangedSinceFinalize: boolean;
}): WorkflowBriefFinalReleasePackageStage {
  if (input.releasePackageFinalized) {
    if (input.packageChangedSinceFinalize) {
      return "package_changed_since_finalize";
    }
    return "finalized";
  }
  if (!input.releasePrepared) {
    return "release_prep_missing";
  }
  if (input.canFinalize) {
    return "ready_to_finalize";
  }
  return "not_ready";
}

export function canFinalizeWorkflowBriefReleasePackage(input: {
  releasePrepared: boolean;
  packageComplete: boolean;
  isAdmin: boolean;
  alreadyFinalized: boolean;
  packageChangedSinceFinalize: boolean;
}): { allowed: boolean; blockReason: string | null } {
  if (!input.isAdmin) {
    return { allowed: false, blockReason: "Admin access required to finalize the release package." };
  }
  if (!input.releasePrepared) {
    return { allowed: false, blockReason: "Run release preparation before finalizing the release package." };
  }
  if (!input.packageComplete) {
    return { allowed: false, blockReason: "Packages are not complete enough for final release." };
  }
  if (input.alreadyFinalized && !input.packageChangedSinceFinalize) {
    return { allowed: false, blockReason: "Release package is already finalized." };
  }
  return { allowed: true, blockReason: null };
}

export function buildClientSafeReleasePackage(input: {
  briefTitle: string;
  projectName: string;
  finalizedAt: string;
  summary: string;
  items: WorkflowBriefFinalReleasePackageItemSource[];
  notes?: string | null;
}): ClientSafeReleasePackage {
  return {
    briefTitle: input.briefTitle.trim(),
    projectName: input.projectName.trim(),
    finalizedAt: input.finalizedAt,
    releaseStatus: "RELEASED",
    summary: input.summary.trim(),
    deliverables: input.items.map((item) => ({
      title: item.textTitle.trim(),
      type: item.deliveryType.trim(),
      exportUrl: item.exportUrl,
      status: "RELEASED" as const
    })),
    images: input.items.map((item) => ({
      title: item.imageTitle.trim(),
      altText: item.imageTitle.trim() || null,
      imageUrl: item.imageUrl,
      status: "FINAL" as const
    })),
    notes: input.notes?.trim() || null
  };
}

export function buildFinalReleasePackageRecord(input: {
  briefId: string;
  briefTitle: string;
  aiDeliveryProjectId: string;
  projectName: string;
  productionPlanId: string | null;
  packageFingerprint: string;
  summary: string;
  items: WorkflowBriefFinalReleasePackageItemSource[];
  finalizedAt?: string;
  releasePackageId?: string;
}): WorkflowBriefFinalReleasePackageRecord {
  const finalizedAt = input.finalizedAt ?? new Date().toISOString();
  const releasePackageId = input.releasePackageId ?? randomUUID();
  const clientSnapshot = buildClientSafeReleasePackage({
    briefTitle: input.briefTitle,
    projectName: input.projectName,
    finalizedAt,
    summary: input.summary,
    items: input.items,
    notes: input.summary
  });

  return {
    version: WORKFLOW_BRIEF_FINAL_RELEASE_PACKAGE_VERSION,
    kind: "final_release_package",
    releasePackageId,
    briefId: input.briefId,
    briefTitle: input.briefTitle.trim(),
    aiDeliveryProjectId: input.aiDeliveryProjectId,
    projectName: input.projectName.trim(),
    productionPlanId: input.productionPlanId,
    finalizedAt,
    releaseStatus: "RELEASED",
    packageFingerprint: input.packageFingerprint,
    summary: input.summary.trim(),
    deliverableCount: input.items.length,
    imageCount: input.items.length,
    items: input.items,
    clientSnapshot,
    note: "Final client-safe release package snapshot. No live publishing or external provider calls in this block."
  };
}

export function shouldReuseFinalReleasePackage(input: {
  storedFingerprint: string | null;
  currentFingerprint: string;
  releasePackageFinalized: boolean;
}): boolean {
  return Boolean(
    input.releasePackageFinalized &&
      input.storedFingerprint &&
      input.storedFingerprint === input.currentFingerprint
  );
}

export function toClientSafeReleasePackageFromRecord(
  record: WorkflowBriefFinalReleasePackageRecord | null | undefined
): ClientSafeReleasePackage | null {
  if (!record || record.version !== WORKFLOW_BRIEF_FINAL_RELEASE_PACKAGE_VERSION) {
    return null;
  }
  if (record.clientSnapshot && record.clientSnapshot.finalizedAt) {
    return sanitizeClientSafeReleasePackage(record.clientSnapshot);
  }
  return buildClientSafeReleasePackage({
    briefTitle: record.briefTitle,
    projectName: record.projectName,
    finalizedAt: record.finalizedAt,
    summary: record.summary,
    items: record.items,
    notes: record.summary
  });
}

export function sanitizeClientSafeReleasePackage(value: ClientSafeReleasePackage): ClientSafeReleasePackage {
  return {
    briefTitle: value.briefTitle,
    projectName: value.projectName,
    finalizedAt: value.finalizedAt,
    releaseStatus: "RELEASED",
    summary: value.summary,
    deliverables: (value.deliverables ?? []).map((item) => ({
      title: item.title,
      type: item.type,
      exportUrl: item.exportUrl ?? null,
      status: "RELEASED" as const
    })),
    images: (value.images ?? []).map((item) => ({
      title: item.title,
      altText: item.altText ?? null,
      imageUrl: item.imageUrl ?? null,
      status: "FINAL" as const
    })),
    notes: value.notes ?? null
  };
}
