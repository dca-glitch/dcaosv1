import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuthResolvedSessionContext } from "../auth/types";
import { sendEmailNotification } from "../services/email-notifications.service";
import { getEmailProviderConfig } from "../config";

const prisma = createPrismaClient();

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
    include: {
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

function toPendingApprovalSummary(deliverable: {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  aiDeliveryProject: { id: string; name: string; clientId: string; client: { id: string; name: string } | null };
}) {
  return {
    id: deliverable.id,
    title: deliverable.title,
    status: deliverable.status,
    projectId: deliverable.aiDeliveryProject.id,
    projectName: deliverable.aiDeliveryProject.name,
    clientId: deliverable.aiDeliveryProject.clientId,
    clientName: deliverable.aiDeliveryProject.client?.name ?? null,
    createdAt: deliverable.createdAt.toISOString()
  };
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
      include: {
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
    include: {
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
    deliverable: {
      id: deliverable.id,
      title: deliverable.title,
      description: deliverable.description ?? null,
      tags: deliverable.tags ?? [],
      category: deliverable.category ?? null,
      scheduledPublishAt: deliverable.scheduledPublishAt?.toISOString() ?? null,
      status: deliverable.status,
      bodyContent,
      projectId: deliverable.aiDeliveryProject.id,
      projectName: deliverable.aiDeliveryProject.name,
      clientId: deliverable.aiDeliveryProject.clientId,
      clientName: deliverable.aiDeliveryProject.client?.name ?? null,
      createdAt: deliverable.createdAt.toISOString(),
      images
    }
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
  if (!deliverable || deliverable.status !== "PENDING_CLIENT_REVIEW") return null;
  if (!(await assertClientPortalApprovalAccess(authSession, deliverable.aiDeliveryProject.clientId))) return null;

  const imageExists = deliverable.contentDraft?.articleImages.some((image) => image.id === imageId);
  if (!imageExists) return null;

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

  const reason = rejectionReason.trim();
  if (!reason) return null;

  const deliverable = await getDeliverableForClientApproval(tenantId, deliverableId);
  if (!deliverable || deliverable.status !== "PENDING_CLIENT_REVIEW") return null;
  if (!(await assertClientPortalApprovalAccess(authSession, deliverable.aiDeliveryProject.clientId))) return null;

  const imageExists = deliverable.contentDraft?.articleImages.some((image) => image.id === imageId);
  if (!imageExists) return null;

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

function allImagesReviewed(
  imageIds: string[],
  approvals: Array<{ articleImageId: string; status: string }>
): boolean {
  if (imageIds.length === 0) return true;
  return imageIds.every((imageId) => {
    const approval = approvals.find((row) => row.articleImageId === imageId);
    return approval && (approval.status === "APPROVED" || approval.status === "REJECTED");
  });
}

async function notifyDcaTeam(
  tenantId: string,
  subject: string,
  templateKey: "AI_DELIVERY_REVIEW_REQUEST" | "AI_DELIVERY_APPROVED",
  relatedEntityId: string
) {
  const config = getEmailProviderConfig();
  const adminUsers = await prisma.user.findMany({
    where: {
      memberships: {
        some: {
          tenantId,
          status: "ACTIVE",
          membershipRoles: {
            some: {
              role: { key: { in: ["owner", "admin"] }, status: "ACTIVE" }
            }
          }
        }
      }
    },
    select: { email: true }
  });

  const uniqueEmails = [...new Set(adminUsers.map((user) => user.email.toLowerCase()))];
  for (const recipientEmail of uniqueEmails) {
    await sendEmailNotification({
      tenantId,
      recipientEmail,
      subject,
      templateKey,
      relatedModule: "ai-delivery",
      relatedEntityId
    });
  }

  if (config.replyTo) {
    await sendEmailNotification({
      tenantId,
      recipientEmail: config.replyTo,
      subject,
      templateKey,
      relatedModule: "ai-delivery",
      relatedEntityId
    });
  }
}

async function notifyClientUsers(
  tenantId: string,
  clientId: string,
  subject: string,
  relatedEntityId: string
) {
  const clientUsers = await prisma.clientUserAccess.findMany({
    where: { tenantId, clientId, isArchived: false },
    include: { user: { select: { email: true } } }
  });

  for (const access of clientUsers) {
    if (!access.user?.email) continue;
    await sendEmailNotification({
      tenantId,
      recipientEmail: access.user.email,
      subject,
      templateKey: "AI_DELIVERY_REVIEW_REQUEST",
      relatedModule: "ai-delivery",
      relatedEntityId
    });
  }
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

  if (deliverable.status === "APPROVED_BY_CLIENT") {
    return { error: "ALREADY_APPROVED" as const };
  }
  if (deliverable.status !== "PENDING_CLIENT_REVIEW") {
    return null;
  }

  const imageIds = (deliverable.contentDraft?.articleImages ?? []).map((image) => image.id);
  if (!allImagesReviewed(imageIds, deliverable.imageApprovals)) {
    return { error: "IMAGES_PENDING" as const };
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
  await notifyDcaTeam(
    tenantId,
    `[${clientName} Approval] ${updated.title}`,
    "AI_DELIVERY_APPROVED",
    updated.id
  );

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

  const reason = rejectionReason.trim();
  if (!reason) return null;

  const deliverable = await getDeliverableForClientApproval(tenantId, deliverableId);
  if (!deliverable || deliverable.status !== "PENDING_CLIENT_REVIEW") return null;
  if (!(await assertClientPortalApprovalAccess(authSession, deliverable.aiDeliveryProject.clientId))) return null;

  const updated = await prisma.aiDeliveryDeliverable.update({
    where: { id: deliverableId },
    data: {
      status: "DRAFT",
      clientRejectionReason: reason
    },
    select: { id: true, title: true, status: true }
  });

  const clientName = deliverable.aiDeliveryProject.client?.name ?? "Client";
  await notifyDcaTeam(
    tenantId,
    `[${clientName} Rejection] ${updated.title}`,
    "AI_DELIVERY_REVIEW_REQUEST",
    updated.id
  );

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
    include: {
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
