/**
 * Client-safe approval surface serializers (G584).
 * Strips internal workflow/storage/cost/audit fields from approval payloads.
 * Pure; no I/O.
 */

import {
  assertClientPortalPayloadHasNoForbiddenKeys,
  collectClientPortalForbiddenPayloadKeys
} from "./client-portal-error-safety";

export const CLIENT_APPROVAL_SERIALIZER_VERSION = "CLIENT_APPROVAL_SERIALIZER_V1";

const FORBIDDEN_APPROVAL_KEYS = [
  "storageKey",
  "provider",
  "providerMetadata",
  "workflowRunId",
  "workflowRunStatus",
  "jobQueueStatus",
  "queueStatus",
  "auditLog",
  "auditLogs",
  "actualCostUsd",
  "estimatedCostUsd",
  "adminSummaryNotes",
  "contentDraftId",
  "executionLog",
  "miHandoffId",
  "releasePackageId",
  "rawCost",
  "costRows"
] as const;

export type ClientApprovalPendingListItem = {
  id: string;
  title: string;
  status: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string | null;
  createdAt: string;
};

export type ClientApprovalImageSurface = {
  id: string;
  title: string;
  altText: string;
  imageUrl: string | null;
  approvalStatus: string;
  rejectionReason: string | null;
};

export type ClientApprovalDetailSurface = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  category: string | null;
  scheduledPublishAt: string | null;
  status: string;
  bodyContent: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string | null;
  createdAt: string;
  images: ClientApprovalImageSurface[];
  /** Soft design hint only — not a durable counter until schema lands. */
  revisionRoundAvailable: boolean;
};

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

/**
 * Builds a client-safe pending-approval list row from a loose deliverable-shaped object.
 * Extra/internal keys on the input are ignored (never copied through).
 */
export function serializeClientApprovalPendingItem(input: {
  id: string;
  title: string;
  status: string;
  createdAt: Date | string;
  projectId?: string;
  projectName?: string;
  clientId?: string;
  clientName?: string | null;
  aiDeliveryProject?: {
    id: string;
    name: string;
    clientId: string;
    client?: { id: string; name: string } | null;
  };
}): ClientApprovalPendingListItem {
  const project = input.aiDeliveryProject;
  const item: ClientApprovalPendingListItem = {
    id: input.id,
    title: input.title,
    status: input.status,
    projectId: input.projectId ?? project?.id ?? "",
    projectName: input.projectName ?? project?.name ?? "",
    clientId: input.clientId ?? project?.clientId ?? "",
    clientName: input.clientName ?? project?.client?.name ?? null,
    createdAt: toIso(input.createdAt) ?? ""
  };
  assertClientPortalPayloadHasNoForbiddenKeys(item);
  return item;
}

/**
 * Builds a client-safe approval detail surface. Never copies forbidden keys from input bags.
 */
export function serializeClientApprovalDetail(input: {
  id: string;
  title: string;
  description?: string | null;
  tags?: string[];
  category?: string | null;
  scheduledPublishAt?: Date | string | null;
  status: string;
  bodyContent: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName?: string | null;
  createdAt: Date | string;
  images?: Array<{
    id: string;
    title: string;
    altText?: string;
    imageUrl?: string | null;
    approvalStatus?: string;
    rejectionReason?: string | null;
  }>;
  /** When false, UI may show one-round exhausted messaging after persistence lands. */
  revisionRoundAvailable?: boolean;
}): ClientApprovalDetailSurface {
  const detail: ClientApprovalDetailSurface = {
    id: input.id,
    title: input.title,
    description: input.description ?? null,
    tags: Array.isArray(input.tags) ? [...input.tags] : [],
    category: input.category ?? null,
    scheduledPublishAt: toIso(input.scheduledPublishAt ?? null),
    status: input.status,
    bodyContent: input.bodyContent,
    projectId: input.projectId,
    projectName: input.projectName,
    clientId: input.clientId,
    clientName: input.clientName ?? null,
    createdAt: toIso(input.createdAt) ?? "",
    images: (input.images ?? []).map((image) => ({
      id: image.id,
      title: image.title,
      altText: image.altText ?? image.title,
      imageUrl: image.imageUrl ?? null,
      approvalStatus: image.approvalStatus ?? "PENDING",
      rejectionReason: image.rejectionReason ?? null
    })),
    revisionRoundAvailable: input.revisionRoundAvailable !== false
  };
  assertClientPortalPayloadHasNoForbiddenKeys(detail);
  return detail;
}

/** Returns forbidden keys found if a raw object were returned to a client (test helper). */
export function findForbiddenKeysInApprovalPayload(payload: unknown): string[] {
  return collectClientPortalForbiddenPayloadKeys(payload);
}

export function listForbiddenApprovalPayloadKeys(): readonly string[] {
  return FORBIDDEN_APPROVAL_KEYS;
}
