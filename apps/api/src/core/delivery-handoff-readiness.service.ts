/**
 * Mega Layer 2 — delivery handoff readiness helpers (admin-only, no external calls).
 */

import type { AiDeliveryRevenueChainReadinessCheck } from "./core.types";
import type { PrivateStorageStatus } from "../storage/private-storage.service";

export type DeliverableAssetRow = {
  id: string;
  title: string;
  status: string;
  storageKey: string | null;
  exportUrl: string | null;
  contentDraftId: string | null;
  articleImageId: string | null;
};

export type ImageAssetRow = {
  id: string;
  title: string;
  status: string;
  storageKey: string | null;
  previewImageUrl: string | null;
  finalImageUrl: string | null;
  contentDraftId: string | null;
};

export type WordPressHandoffContext = {
  hasPublicationTarget: boolean;
  publicationTargetLabel: string | null;
  credentialConfigured: boolean;
  publishEnvEnabled: boolean;
  preparedDraftLogCount: number;
  privateStorage: PrivateStorageStatus;
};

export type WordPressPublishGateStatus = "disabled" | "credentials_missing" | "target_configured";

export function buildSlugFromPublicationTitle(title: string): string | null {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized ? normalized.slice(0, 80) : null;
}

export function resolveWordPressPublishGateStatus(
  credentialConfigured: boolean,
  publishEnvEnabled: boolean
): WordPressPublishGateStatus {
  if (!publishEnvEnabled) {
    return "disabled";
  }

  if (!credentialConfigured) {
    return "credentials_missing";
  }

  return "target_configured";
}

export function buildWordPressPublishGateDetail(
  gateStatus: WordPressPublishGateStatus,
  hasPublicationTarget: boolean
): string {
  if (!hasPublicationTarget) {
    return "No client publication target configured.";
  }

  if (gateStatus === "disabled") {
    return "Live publish env gate is off (WORDPRESS_PUBLISH_ENABLED is not true). Draft prep remains local-only.";
  }

  if (gateStatus === "credentials_missing") {
    return "Publication target exists but WordPress application password is not configured.";
  }

  return "Target and credentials present; live publish remains confirm-gated and env-controlled.";
}

export function buildPrivateAssetReadinessChecks(
  deliverables: DeliverableAssetRow[],
  images: ImageAssetRow[],
  privateStorage: PrivateStorageStatus
): { checks: AiDeliveryRevenueChainReadinessCheck[]; warnings: string[] } {
  const checks: AiDeliveryRevenueChainReadinessCheck[] = [];
  const warnings: string[] = [];

  const deliverablesWithReference = deliverables.filter(
    (row) => Boolean(row.storageKey?.trim()) || Boolean(row.exportUrl?.trim())
  );
  const deliverablesMissingReference = deliverables.filter(
    (row) => !row.storageKey?.trim() && !row.exportUrl?.trim()
  );
  const imagesWithAsset = images.filter(
    (row) => Boolean(row.storageKey?.trim()) || Boolean(row.finalImageUrl?.trim()) || Boolean(row.previewImageUrl?.trim())
  );
  const imagesMissingAsset = images.filter(
    (row) => !row.storageKey?.trim() && !row.finalImageUrl?.trim() && !row.previewImageUrl?.trim()
  );

  if (deliverables.length === 0 && images.length === 0) {
    checks.push({
      key: "private_assets",
      label: "Private assets",
      status: "optional",
      detail: "No deliverable or image records to assess for private asset references."
    });
    return { checks, warnings };
  }

  const storageMode = privateStorage.configured ? "R2 configured" : "R2 not configured (upload/download guarded)";
  const detailParts = [
    storageMode,
    `${deliverablesWithReference.length}/${deliverables.length} deliverable(s) with export or storage reference`,
    `${imagesWithAsset.length}/${images.length} image record(s) with preview/final/storage reference`
  ];

  if (deliverablesMissingReference.length > 0) {
    warnings.push(
      `${deliverablesMissingReference.length} deliverable(s) missing exportUrl/storageKey for final handoff tracking.`
    );
  }

  if (imagesMissingAsset.length > 0) {
    warnings.push(
      `${imagesMissingAsset.length} image record(s) missing preview/final/storage references.`
    );
  }

  if (!privateStorage.configured && deliverables.some((row) => row.storageKey?.trim())) {
    warnings.push("Private storage keys exist but R2 is not configured; signed download may be unavailable.");
  }

  const status =
    deliverablesMissingReference.length === 0 && imagesMissingAsset.length === 0
      ? "ready"
      : deliverablesWithReference.length > 0 || imagesWithAsset.length > 0
        ? "warning"
        : "missing";

  checks.push({
    key: "private_assets",
    label: "Private assets",
    status,
    detail: detailParts.join("; ")
  });

  return { checks, warnings };
}

export function buildWordPressHandoffReadinessCheck(
  ctx: WordPressHandoffContext
): { check: AiDeliveryRevenueChainReadinessCheck; warnings: string[] } {
  const warnings: string[] = [];
  const gateStatus = resolveWordPressPublishGateStatus(ctx.credentialConfigured, ctx.publishEnvEnabled);
  const detail = buildWordPressPublishGateDetail(gateStatus, ctx.hasPublicationTarget);

  if (!ctx.hasPublicationTarget) {
    warnings.push("Configure a client publication target before WordPress draft prep.");
  }

  if (ctx.hasPublicationTarget && gateStatus === "disabled") {
    warnings.push("WordPress draft prep is local-only; live publish remains disabled by default.");
  }

  if (ctx.hasPublicationTarget && gateStatus === "credentials_missing") {
    warnings.push("Save WordPress application password on the publication target before attempting guarded publish.");
  }

  const status: AiDeliveryRevenueChainReadinessCheck["status"] = !ctx.hasPublicationTarget
    ? "warning"
    : ctx.preparedDraftLogCount > 0
      ? "ready"
      : gateStatus === "target_configured"
        ? "warning"
        : "warning";

  return {
    check: {
      key: "wordpress_handoff",
      label: "WordPress handoff",
      status,
      detail: `${detail} Prepared draft log entries: ${ctx.preparedDraftLogCount}.`
    },
    warnings
  };
}

export function buildClientPortalVisibilityCheck(
  deliverables: DeliverableAssetRow[]
): AiDeliveryRevenueChainReadinessCheck {
  const clientVisible = deliverables.filter((row) => ["DELIVERED", "ACCEPTED"].includes(row.status));
  const readyNotVisible = deliverables.filter((row) => row.status === "READY");

  return {
    key: "client_portal_visibility",
    label: "Client portal finals",
    status: clientVisible.length > 0 ? "ready" : deliverables.length > 0 ? "warning" : "optional",
    detail:
      clientVisible.length > 0
        ? `${clientVisible.length} deliverable(s) in DELIVERED/ACCEPTED client-visible state.`
        : deliverables.length > 0
          ? `${readyNotVisible.length} READY deliverable(s) not yet DELIVERED/ACCEPTED for client portal list.`
          : "No deliverables to expose in client portal yet."
  };
}
