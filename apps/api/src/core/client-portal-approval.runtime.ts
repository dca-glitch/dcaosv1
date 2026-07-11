import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuthResolvedSessionContext } from "../auth/types";
import { notifyClientUsers, notifyDcaTeam } from "../services/email-notifications.service";
import {
  createAdminInAppNotifications,
  createClientInAppNotifications
} from "../notifications/in-app-notifications.service";
import { mapApprovalSignalToNotification } from "./approval-notification-mapping";
import {
  serializeClientApprovalDetail,
  serializeClientApprovalPendingItem
} from "./client-approval-serializer";
import { evaluateClientPortalApprovalAction } from "./client-portal-approval-policy";
import { AiDeliveryGuardError } from "./ai-delivery-guard-error";
import { CLIENT_REVISION_ROUND_LIMIT } from "./revision-policy";

const prisma = createPrismaClient();

/**
 * Durable marker written into an AiDeliveryDeliverableReview row when a client requests changes.
 * Counting these rows derives revision-round usage from persisted history (no schema change),
 * so the one-client-revision policy survives re-send-for-review cycles.
 */
const CLIENT_REVISION_REVIEW_MARKER = "[CLIENT_REVISION_REQUEST]";

/** Deliverable statuses from which a deliverable may (re)enter client review. */
const CLIENT_REVIEW_ENTRY_SOURCE_STATUSES = new Set(["DRAFT", "REVISION_REQUESTED"]);

function throwClientReviewConflict(code: string, message: string): never {
  throw new AiDeliveryGuardError(409, code, message);
}

async function countClientRevisionRounds(tenantId: string, deliverableId: string): Promise<number> {
  return prisma.aiDeliveryDeliverableReview.count({
    where: {
      tenantId,
      deliverableId,
      reviewNotes: { startsWith: CLIENT_REVISION_REVIEW_MARKER }
    }
  });
}

function getActiveTenantId(authSession: AuthResolvedSessionContext): string | null {
  return authSession.tenantContext.activeMembership?.tenantId ?? null;
}

function userHasActiveTenantRole(authSession: AuthResolvedSessionContext, roles: string[]): boolean {
  const membership = authSession.tenantContext.activeMembership;
  if (!membership) return false;
  return membership.roles.some((role) => roles.includes(role));
}

export function isClientPortalApprovalUser(authSession: AuthResolvedSessionContext): boolean {
  return !userHasActiveTenantRole(authSession, ["owner", "admin"]);
}

async function getClientUserClientIds(tenantId: string, userId: string): Promise<string[]> {
  const accessEntries = await prisma.clientUserAccess.findMany({
    where: { tenantId, userId, isArchived: false },
    select: { clientId: true }
  });
  return accessEntries.map((entry) => entry.clientId);
}

export async function assertClientPortalApprovalAccess(
  authSession: AuthResolvedSessionContext,
  clientId: string
): Promise<boolean> {
  if (!isClientPortalApprovalUser(authSession)) {
    return false;
  }
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return false;
  const allowedClientIds = await getClientUserClientIds(tenantId, authSession.user.id);
  return allowedClientIds.includes(clientId);
}

async function getDeliverableForClientApproval(tenantId: string, deliverableId: string) {
  return prisma.aiDeliveryDeliverable.findFirst({
    where: { id: deliverableId, tenantId, isArchived: false },
    select: {
      id: true,
      title: true,
      description: true,
      tags: true,
      category: true,
      scheduledPublishAt: true,
      status: true,
      bodyContent: true,
      contentDraftId: true,
      createdAt: true,
      aiDeliveryProject: {
        select: {
          id: true,
          name: true,
          clientId: true,
          client: { select: { id: true, name: true } }
        }
      },
      contentDraft: {
        select: {
          id: true,
          draftBody: true,
          articleImages: {
            where: { isArchived: false },
            select: {
              id: true,
              title: true,
              previewImageUrl: true,
              finalImageUrl: true
            },
            orderBy: { createdAt: "asc" }
          }
        }
      },
      imageApprovals: {
        select: {
          id: true,
          articleImageId: true,
          status: true,
          rejectionReason: true,
          reviewedAt: true
        }
      }
    }
  });
}

/** Client-safe pending-approval list row (G201 / G584). Internal workflow/storage/cost fields are never included. */
export function toClientPortalPendingApprovalSummary(deliverable: {
  id: string;
  title: string;
  status: string;
  createdAt: Date | string;
  aiDeliveryProject: {
    id: string;
    name: string;
    clientId: string;
    client: { id: string; name: string } | null;
  };
}) {
  return serializeClientApprovalPendingItem(deliverable);
}

/** @deprecated Use toClientPortalPendingApprovalSummary */
const toPendingApprovalSummary = toClientPortalPendingApprovalSummary;

/** Client-safe approval detail payload (G201 / G584). Omits storageKey, provider, workflow, cost, audit, admin notes. */
export function toClientPortalApprovalDeliverableSummary(input: {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  category: string | null;
  scheduledPublishAt: Date | string | null;
  status: string;
  bodyContent: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string | null;
  createdAt: Date | string;
  images: Array<{
    id: string;
    title: string;
    altText: string;
    imageUrl: string | null;
    approvalStatus: string;
    rejectionReason: string | null;
  }>;
  revisionRoundAvailable?: boolean;
}) {
  const detail = serializeClientApprovalDetail(input);
  // Preserve prior response shape for existing clients (omit soft design hint until UI opts in).
  const { revisionRoundAvailable: _revisionRoundAvailable, ...legacyShape } = detail;
  void _revisionRoundAvailable;
  return legacyShape;
}

export async function listClientPortalPendingApprovals(
  authSession: AuthResolvedSessionContext,
  clientId?: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  if (userHasActiveTenantRole(authSession, ["owner"])) {
    const deliverables = await prisma.aiDeliveryDeliverable.findMany({
      where: {
        tenantId,
        isArchived: false,
        status: "PENDING_CLIENT_REVIEW",
        ...(clientId ? { aiDeliveryProject: { clientId } } : {})
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        aiDeliveryProject: {
          select: {
            id: true,
            name: true,
            clientId: true,
            client: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    const pendingApprovals = deliverables.map(toPendingApprovalSummary);
    return { pendingApprovals, count: pendingApprovals.length };
  }

  if (!isClientPortalApprovalUser(authSession)) return null;

  const allowedClientIds = await getClientUserClientIds(tenantId, authSession.user.id);
  if (allowedClientIds.length === 0) {
    return { pendingApprovals: [], count: 0 };
  }

  const clientFilter = clientId
    ? allowedClientIds.includes(clientId)
      ? [clientId]
      : []
    : allowedClientIds;

  if (clientFilter.length === 0) {
    return { pendingApprovals: [], count: 0 };
  }

  const deliverables = await prisma.aiDeliveryDeliverable.findMany({
    where: {
      tenantId,
      isArchived: false,
      status: "PENDING_CLIENT_REVIEW",
      aiDeliveryProject: { clientId: { in: clientFilter } }
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      aiDeliveryProject: {
        select: {
          id: true,
          name: true,
          clientId: true,
          client: { select: { id: true, name: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const pendingApprovals = deliverables.map(toPendingApprovalSummary);
  return { pendingApprovals, count: pendingApprovals.length };
}

export async function getClientPortalDeliverableForApproval(
  authSession: AuthResolvedSessionContext,
  deliverableId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isClientPortalApprovalUser(authSession)) return null;

  const deliverable = await getDeliverableForClientApproval(tenantId, deliverableId);
  if (!deliverable) return null;

  const clientId = deliverable.aiDeliveryProject.clientId;
  if (!(await assertClientPortalApprovalAccess(authSession, clientId))) return null;

  if (deliverable.status !== "PENDING_CLIENT_REVIEW") {
    return { error: "ALREADY_REVIEWED" as const };
  }

  const images = (deliverable.contentDraft?.articleImages ?? []).map((image) => {
    const approval = deliverable.imageApprovals.find((row) => row.articleImageId === image.id);
    return {
      id: image.id,
      title: image.title,
      altText: image.title,
      imageUrl: image.finalImageUrl ?? image.previewImageUrl ?? null,
      approvalStatus: approval?.status ?? "PENDING",
      rejectionReason: approval?.rejectionReason ?? null
    };
  });

  const bodyContent =
    deliverable.bodyContent ??
    deliverable.contentDraft?.draftBody ??
    "";

  return {
    deliverable: toClientPortalApprovalDeliverableSummary({
      id: deliverable.id,
      title: deliverable.title,
      description: deliverable.description ?? null,
      tags: deliverable.tags ?? [],
      category: deliverable.category ?? null,
      scheduledPublishAt: deliverable.scheduledPublishAt,
      status: deliverable.status,
      bodyContent,
      projectId: deliverable.aiDeliveryProject.id,
      projectName: deliverable.aiDeliveryProject.name,
      clientId: deliverable.aiDeliveryProject.clientId,
      clientName: deliverable.aiDeliveryProject.client?.name ?? null,
      createdAt: deliverable.createdAt,
      images
    })
  };
}

export async function patchClientPortalDeliverableBody(
  authSession: AuthResolvedSessionContext,
  deliverableId: string,
  bodyContent: string
) {
  const { updateArticleBody } = await import("./client-portal-edit.runtime");
  return updateArticleBody(authSession, deliverableId, bodyContent);
}

async function getImageApprovalRow(tenantId: string, deliverableId: string, imageId: string) {
  return prisma.aiDeliveryDeliverableImageApproval.findFirst({
    where: { tenantId, deliverableId, articleImageId: imageId }
  });
}

export async function approveClientPortalDeliverableImage(
  authSession: AuthResolvedSessionContext,
  deliverableId: string,
  imageId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isClientPortalApprovalUser(authSession)) return null;

  const deliverable = await getDeliverableForClientApproval(tenantId, deliverableId);
  if (!deliverable) return null;
  if (!(await assertClientPortalApprovalAccess(authSession, deliverable.aiDeliveryProject.clientId))) return null;

  const imageIds = (deliverable.contentDraft?.articleImages ?? []).map((image) => image.id);
  const policy = evaluateClientPortalApprovalAction({
    action: "approve_image",
    deliverableStatus: deliverable.status,
    imageIds,
    imageId
  });
  if (!policy.ok) return null;

  const existing = await getImageApprovalRow(tenantId, deliverableId, imageId);
  const now = new Date();

  const approval = existing
    ? await prisma.aiDeliveryDeliverableImageApproval.update({
        where: { id: existing.id },
        data: {
          status: "APPROVED",
          rejectionReason: null,
          reviewedByUserId: authSession.user.id,
          reviewedAt: now
        }
      })
    : await prisma.aiDeliveryDeliverableImageApproval.create({
        data: {
          tenantId,
          deliverableId,
          articleImageId: imageId,
          status: "APPROVED",
          reviewedByUserId: authSession.user.id,
          reviewedAt: now
        }
      });

  const reviewedImage = deliverable.contentDraft?.articleImages.find((image) => image.id === imageId);
  const clientName = deliverable.aiDeliveryProject.client?.name ?? "Client";
  await createAdminInAppNotifications({
    tenantId,
    eventType: "image_approved",
    severity: "info",
    title: `[${clientName} Approval] Image approved${reviewedImage?.title ? `: ${reviewedImage.title}` : ""}`,
    relatedEntityType: "aiDeliveryDeliverableImage",
    relatedEntityId: imageId,
    actionKey: "client_image_approved",
    clientId: deliverable.aiDeliveryProject.clientId
  });

  return {
    imageApproval: {
      id: approval.id,
      articleImageId: approval.articleImageId,
      status: approval.status,
      rejectionReason: approval.rejectionReason
    }
  };
}

export async function rejectClientPortalDeliverableImage(
  authSession: AuthResolvedSessionContext,
  deliverableId: string,
  imageId: string,
  rejectionReason: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isClientPortalApprovalUser(authSession)) return null;

  const deliverable = await getDeliverableForClientApproval(tenantId, deliverableId);
  if (!deliverable) return null;
  if (!(await assertClientPortalApprovalAccess(authSession, deliverable.aiDeliveryProject.clientId))) return null;

  const imageIds = (deliverable.contentDraft?.articleImages ?? []).map((image) => image.id);
  const policy = evaluateClientPortalApprovalAction({
    action: "reject_image",
    deliverableStatus: deliverable.status,
    imageIds,
    imageId,
    reason: rejectionReason
  });
  if (!policy.ok) return null;

  const reason = policy.sanitizedReason ?? rejectionReason.trim();
  const existing = await getImageApprovalRow(tenantId, deliverableId, imageId);
  const now = new Date();

  const approval = existing
    ? await prisma.aiDeliveryDeliverableImageApproval.update({
        where: { id: existing.id },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          reviewedByUserId: authSession.user.id,
          reviewedAt: now
        }
      })
    : await prisma.aiDeliveryDeliverableImageApproval.create({
        data: {
          tenantId,
          deliverableId,
          articleImageId: imageId,
          status: "REJECTED",
          rejectionReason: reason,
          reviewedByUserId: authSession.user.id,
          reviewedAt: now
        }
      });

  const reviewedImage = deliverable.contentDraft?.articleImages.find((image) => image.id === imageId);
  const clientName = deliverable.aiDeliveryProject.client?.name ?? "Client";
  await createAdminInAppNotifications({
    tenantId,
    eventType: "image_rejected_with_reason",
    severity: "action_required",
    title: `[${clientName} Rejection] Image rejected${reviewedImage?.title ? `: ${reviewedImage.title}` : ""}`,
    body: reason,
    relatedEntityType: "aiDeliveryDeliverableImage",
    relatedEntityId: imageId,
    actionKey: "client_image_rejected",
    clientId: deliverable.aiDeliveryProject.clientId
  });

  return {
    imageApproval: {
      id: approval.id,
      articleImageId: approval.articleImageId,
      status: approval.status,
      rejectionReason: approval.rejectionReason
    }
  };
}

export async function undoClientPortalDeliverableImageReview(
  authSession: AuthResolvedSessionContext,
  deliverableId: string,
  imageId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isClientPortalApprovalUser(authSession)) return null;

  const deliverable = await getDeliverableForClientApproval(tenantId, deliverableId);
  if (!deliverable || deliverable.status !== "PENDING_CLIENT_REVIEW") return null;
  if (!(await assertClientPortalApprovalAccess(authSession, deliverable.aiDeliveryProject.clientId))) return null;

  const existing = await getImageApprovalRow(tenantId, deliverableId, imageId);
  if (!existing) return null;

  const approval = await prisma.aiDeliveryDeliverableImageApproval.update({
    where: { id: existing.id },
    data: {
      status: "PENDING",
      rejectionReason: null,
      reviewedByUserId: null,
      reviewedAt: null
    }
  });

  return {
    imageApproval: {
      id: approval.id,
      articleImageId: approval.articleImageId,
      status: approval.status,
      rejectionReason: approval.rejectionReason
    }
  };
}

export async function approveClientPortalDeliverable(
  authSession: AuthResolvedSessionContext,
  deliverableId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isClientPortalApprovalUser(authSession)) return null;

  const deliverable = await getDeliverableForClientApproval(tenantId, deliverableId);
  if (!deliverable) return null;
  if (!(await assertClientPortalApprovalAccess(authSession, deliverable.aiDeliveryProject.clientId))) return null;

  const imageIds = (deliverable.contentDraft?.articleImages ?? []).map((image) => image.id);
  const policy = evaluateClientPortalApprovalAction({
    action: "approve_deliverable",
    deliverableStatus: deliverable.status,
    imageIds,
    imageApprovals: deliverable.imageApprovals
  });

  if (!policy.ok) {
    if (policy.code === "ALREADY_APPROVED") {
      return { error: "ALREADY_APPROVED" as const };
    }
    if (policy.code === "IMAGES_PENDING") {
      return { error: "IMAGES_PENDING" as const };
    }
    return null;
  }

  const updated = await prisma.aiDeliveryDeliverable.update({
    where: { id: deliverableId },
    data: {
      status: "APPROVED_BY_CLIENT",
      clientRejectionReason: null
    },
    select: { id: true, title: true, status: true }
  });

  const clientName = deliverable.aiDeliveryProject.client?.name ?? "Client";
  if (policy.notifyAdmin) {
    const mapped = mapApprovalSignalToNotification("content_approved_by_client");
    await createAdminInAppNotifications({
      tenantId,
      eventType: mapped.eventType,
      severity: "info",
      title: `[${clientName} Approval] ${updated.title}`,
      relatedEntityType: "aiDeliveryDeliverable",
      relatedEntityId: updated.id,
      actionKey: "client_deliverable_approved",
      clientId: deliverable.aiDeliveryProject.clientId
    });
    await notifyDcaTeam(
      tenantId,
      `[${clientName} Approval] ${updated.title}`,
      policy.notificationKind ?? mapped.schemaKind ?? "AI_DELIVERY_APPROVED",
      updated.id
    );
  }

  return {
    deliverable: {
      id: updated.id,
      title: updated.title,
      status: updated.status
    }
  };
}

export async function rejectClientPortalDeliverable(
  authSession: AuthResolvedSessionContext,
  deliverableId: string,
  rejectionReason: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isClientPortalApprovalUser(authSession)) return null;

  const deliverable = await getDeliverableForClientApproval(tenantId, deliverableId);
  if (!deliverable) return null;
  if (!(await assertClientPortalApprovalAccess(authSession, deliverable.aiDeliveryProject.clientId))) return null;

  // Derive revision-round usage from persisted history (durable review rows), not a hardcoded flag.
  const revisionRoundsUsed = await countClientRevisionRounds(tenantId, deliverableId);
  const policy = evaluateClientPortalApprovalAction({
    action: "request_changes",
    deliverableStatus: deliverable.status,
    reason: rejectionReason,
    revisionRoundUsed: revisionRoundsUsed >= CLIENT_REVISION_ROUND_LIMIT
  });

  if (!policy.ok) {
    if (policy.code === "REVISION_ROUND_EXHAUSTED") {
      return { error: "REVISION_ROUND_EXHAUSTED" as const };
    }
    if (policy.code === "REASON_REQUIRED") {
      return { error: "REASON_REQUIRED" as const };
    }
    if (policy.code === "NOT_PENDING_REVIEW") {
      return { error: "NOT_PENDING_REVIEW" as const };
    }
    return null;
  }

  const reason = policy.sanitizedReason ?? rejectionReason.trim();
  const requestedBy = authSession.user.name ?? authSession.user.email ?? authSession.user.id;

  // Move to the explicit revision-requested state and record a durable, attributed history row
  // that consumes the single client revision allowance. Both writes are atomic.
  const updated = await prisma.$transaction(async (tx) => {
    const deliverableUpdate = await tx.aiDeliveryDeliverable.update({
      where: { id: deliverableId },
      data: {
        status: "REVISION_REQUESTED",
        clientRejectionReason: reason
      },
      select: { id: true, title: true, status: true }
    });

    await tx.aiDeliveryDeliverableReview.create({
      data: {
        tenantId,
        aiDeliveryProjectId: deliverable.aiDeliveryProject.id,
        deliverableId,
        status: "CHANGES_REQUESTED",
        reviewerName: requestedBy,
        reviewNotes: `${CLIENT_REVISION_REVIEW_MARKER} ${reason}`
      }
    });

    return deliverableUpdate;
  });

  const clientName = deliverable.aiDeliveryProject.client?.name ?? "Client";
  const reasonPreview = reason.length > 120 ? `${reason.slice(0, 117)}...` : reason;
  if (policy.notifyAdmin) {
    const mapped = mapApprovalSignalToNotification("content_changes_requested_by_client");
    await createAdminInAppNotifications({
      tenantId,
      eventType: mapped.eventType,
      severity: "action_required",
      title: `[${clientName} Rejection] ${updated.title}`,
      body: reason,
      relatedEntityType: "aiDeliveryDeliverable",
      relatedEntityId: updated.id,
      actionKey: "client_deliverable_changes_requested",
      clientId: deliverable.aiDeliveryProject.clientId
    });
    await notifyDcaTeam(
      tenantId,
      `[${clientName} Rejection] ${updated.title} — ${reasonPreview}`,
      policy.notificationKind ?? mapped.schemaKind ?? "AI_DELIVERY_REVIEW_REQUEST",
      updated.id,
      `Client rejection reason: ${reason}`
    );
  }

  return {
    deliverable: {
      id: updated.id,
      title: updated.title,
      status: updated.status
    }
  };
}

export async function sendAiDeliveryDeliverableForClientReview(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !userHasActiveTenantRole(authSession, ["owner", "admin"])) return null;

  const deliverable = await prisma.aiDeliveryDeliverable.findFirst({
    where: { id: deliverableId, tenantId, aiDeliveryProjectId, isArchived: false },
    select: {
      id: true,
      title: true,
      status: true,
      bodyContent: true,
      contentDraftId: true,
      aiDeliveryProject: { select: { clientId: true, name: true, client: { select: { name: true } } } },
      contentDraft: {
        select: {
          title: true,
          draftBody: true,
          articleImages: {
            where: { isArchived: false },
            select: { id: true }
          }
        }
      }
    }
  });

  if (!deliverable || !deliverable.contentDraftId) return null;

  // Idempotent repeat: already awaiting client review — do not reset image approvals or re-snapshot.
  if (deliverable.status === "PENDING_CLIENT_REVIEW") {
    return {
      deliverable: {
        id: deliverable.id,
        title: deliverable.title,
        status: deliverable.status,
        bodyContent: deliverable.bodyContent ?? ""
      }
    };
  }

  // Strict source-status guard: only a draft or a client-revision-requested deliverable may
  // (re)enter client review. Backward/invalid states (already-approved, internal, archived) are rejected.
  if (!CLIENT_REVIEW_ENTRY_SOURCE_STATUSES.has(deliverable.status)) {
    throwClientReviewConflict(
      "AI_DELIVERY_DELIVERABLE_CLIENT_REVIEW_SOURCE_INVALID",
      `Deliverable cannot be sent for client review from status ${deliverable.status}.`
    );
  }

  const bodyContent = deliverable.bodyContent ?? deliverable.contentDraft?.draftBody ?? "";
  const snapshotTitle = deliverable.title || deliverable.contentDraft?.title || "Untitled";

  await prisma.$transaction(async (tx) => {
    await tx.aiDeliveryDeliverable.update({
      where: { id: deliverableId },
      data: {
        status: "PENDING_CLIENT_REVIEW",
        title: snapshotTitle,
        bodyContent,
        clientRejectionReason: null
      }
    });

    // Genuine new review/revision cycle (DRAFT or REVISION_REQUESTED): reset image approvals to PENDING.
    const imageIds = deliverable.contentDraft?.articleImages.map((image) => image.id) ?? [];
    for (const imageId of imageIds) {
      await tx.aiDeliveryDeliverableImageApproval.upsert({
        where: {
          deliverableId_articleImageId: {
            deliverableId,
            articleImageId: imageId
          }
        },
        create: {
          tenantId,
          deliverableId,
          articleImageId: imageId,
          status: "PENDING"
        },
        update: {
          status: "PENDING",
          rejectionReason: null,
          reviewedByUserId: null,
          reviewedAt: null
        }
      });
    }
  });

  const clientName = deliverable.aiDeliveryProject.client?.name ?? "Client";
  const mapped = mapApprovalSignalToNotification("content_sent_for_client_review");
  await createClientInAppNotifications({
    tenantId,
    clientId: deliverable.aiDeliveryProject.clientId,
    eventType: mapped.eventType,
    severity: "action_required",
    title: `[${clientName}] Article ready for your approval: ${deliverable.title}`,
    body: "A deliverable is ready for your review in Client Portal.",
    relatedEntityType: "aiDeliveryDeliverable",
    relatedEntityId: deliverableId,
    actionKey: "client_review_requested"
  });
  await notifyClientUsers(
    tenantId,
    deliverable.aiDeliveryProject.clientId,
    `[${clientName}] Article ready for your approval: ${deliverable.title}`,
    deliverableId
  );

  const refreshed = await prisma.aiDeliveryDeliverable.findFirst({
    where: { id: deliverableId },
    select: { id: true, title: true, status: true, bodyContent: true }
  });

  return refreshed
    ? {
        deliverable: {
          id: refreshed.id,
          title: refreshed.title,
          status: refreshed.status,
          bodyContent: refreshed.bodyContent ?? ""
        }
      }
    : null;
}
