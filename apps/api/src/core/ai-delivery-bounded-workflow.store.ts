import { randomUUID } from "node:crypto";
import type { AiDeliveryBoundedWorkflowState, Prisma } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import {
  BOUNDED_CONTENT_TO_DRAFT_WORKFLOW_TYPE,
  BoundedWorkflowError,
  buildBoundedWorkflowStageKey,
  type BoundedImageGenerationResult,
  type BoundedStoredImage,
  type BoundedWorkflowContinuationContext,
  type BoundedWorkflowRun,
  type BoundedWorkflowStartContext,
  type BoundedWorkflowState,
  type BoundedWorkflowStore,
  type BoundedWordPressDraftResult,
  type BoundedOwnerEmailResult
} from "./ai-delivery-bounded-workflow.service";

type PrismaClientLike = ReturnType<typeof createPrismaClient>;
type RunRow = Awaited<ReturnType<PrismaClientLike["aiDeliveryBoundedWorkflowRun"]["findUnique"]>>;

export type PrismaBoundedWorkflowExactScope = {
  tenantId: string;
  clientId: string;
  aiDeliveryProjectId: string;
  contentDraftId: string;
  publicationTargetId: string;
  actorUserId: string;
};

function mapRun(row: NonNullable<RunRow>): BoundedWorkflowRun {
  return {
    id: row.id,
    tenantId: row.tenantId,
    aiDeliveryProjectId: row.aiDeliveryProjectId,
    contentDraftId: row.contentDraftId,
    publicationTargetId: row.publicationTargetId,
    articleImageId: row.articleImageId,
    wordpressAttemptId: row.wordpressAttemptId,
    emailLogId: row.emailLogId,
    initiatedByUserId: row.initiatedByUserId,
    workflowType: row.workflowType,
    state: row.state as BoundedWorkflowState,
    stateVersion: row.stateVersion,
    imageIdempotencyKey: row.imageIdempotencyKey,
    storageIdempotencyKey: row.storageIdempotencyKey,
    wordpressIdempotencyKey: row.wordpressIdempotencyKey,
    emailIdempotencyKey: row.emailIdempotencyKey,
    imageProviderRequestId: row.imageProviderRequestId,
    imageCorrelationId: row.imageCorrelationId,
    storageKey: row.storageKey,
    wordpressPostId: row.wordpressPostId,
    emailProviderMessageId: row.emailProviderMessageId,
    imageRequestCount: row.imageRequestCount,
    storageUploadCount: row.storageUploadCount,
    wordpressRequestCount: row.wordpressRequestCount,
    emailRequestCount: row.emailRequestCount,
    retryCount: row.retryCount,
    fallbackUsed: row.fallbackUsed,
    safeError: row.safeError
  };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

function stateTimestamp(state: BoundedWorkflowState): Prisma.AiDeliveryBoundedWorkflowRunUpdateManyMutationInput {
  const now = new Date();
  switch (state) {
    case "IMAGE_REQUEST_STARTED":
      return { imageRequestStartedAt: now };
    case "IMAGE_PREVIEW_READY":
      return { imagePreviewReadyAt: now };
    case "IMAGE_APPROVED":
      return { imageApprovedAt: now };
    case "WORDPRESS_REQUEST_STARTED":
      return { wordpressRequestStartedAt: now };
    case "WORDPRESS_DRAFT_CREATED":
      return { wordpressDraftCreatedAt: now };
    case "EMAIL_REQUEST_STARTED":
      return { emailRequestStartedAt: now };
    case "EMAIL_SENT":
      return { emailSentAt: now };
    case "COMPLETED":
      return { completedAt: now };
    default:
      return {};
  }
}

function runPatch(
  patch: Partial<BoundedWorkflowRun>
): Prisma.AiDeliveryBoundedWorkflowRunUpdateManyMutationInput {
  return {
    safeError: patch.safeError,
    imageProviderRequestId: patch.imageProviderRequestId,
    imageCorrelationId: patch.imageCorrelationId,
    storageKey: patch.storageKey,
    wordpressPostId: patch.wordpressPostId,
    emailProviderMessageId: patch.emailProviderMessageId,
    imageRequestCount: patch.imageRequestCount,
    storageUploadCount: patch.storageUploadCount,
    wordpressRequestCount: patch.wordpressRequestCount,
    emailRequestCount: patch.emailRequestCount,
    retryCount: patch.retryCount,
    fallbackUsed: patch.fallbackUsed
  };
}

export function createPrismaBoundedWorkflowStore(
  prisma: PrismaClientLike = createPrismaClient(),
  options: { exactScope?: PrismaBoundedWorkflowExactScope } = {}
): BoundedWorkflowStore {
  return {
    async resolveStartContext(input) {
      const exactScope = options.exactScope;
      if (
        exactScope &&
        (input.tenantId !== exactScope.tenantId ||
          input.contentDraftId !== exactScope.contentDraftId ||
          input.actorUserId !== exactScope.actorUserId)
      ) {
        return null;
      }
      const [draft, membership] = await Promise.all([
        prisma.aiDeliveryContentDraft.findFirst({
          where: {
            id: input.contentDraftId,
            tenantId: input.tenantId,
            ...(exactScope
              ? { aiDeliveryProjectId: exactScope.aiDeliveryProjectId }
              : {})
          },
          include: {
            aiDeliveryProject: true
          }
        }),
        prisma.tenantMembership.findFirst({
          where: {
            tenantId: input.tenantId,
            userId: input.actorUserId,
            status: "ACTIVE",
            membershipRoles: {
              some: {
                role: { key: { in: ["owner", "admin"] }, status: "ACTIVE" }
              }
            }
          }
        })
      ]);
      if (
        !draft ||
        !membership ||
        draft.aiDeliveryProject.tenantId !== input.tenantId ||
        (exactScope &&
          (draft.aiDeliveryProject.id !== exactScope.aiDeliveryProjectId ||
            draft.aiDeliveryProject.clientId !== exactScope.clientId))
      ) {
        return null;
      }

      const publicationTarget = await prisma.publicationTarget.findFirst({
        where: {
          tenantId: input.tenantId,
          clientId: draft.aiDeliveryProject.clientId,
          connectorType: "WORDPRESS",
          isArchived: false,
          ...(exactScope ? { id: exactScope.publicationTargetId } : {})
        },
        ...(exactScope
          ? {}
          : { orderBy: [{ isDefault: "desc" as const }, { createdAt: "asc" as const }] })
      });
      if (exactScope && !publicationTarget) {
        return null;
      }

      return {
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        aiDeliveryProjectId: draft.aiDeliveryProjectId,
        clientId: draft.aiDeliveryProject.clientId,
        contentDraftId: draft.id,
        contentTitle: draft.title,
        contentBody: draft.draftBody,
        imagePrompt: `Create one editorial hero image for: ${draft.title}`,
        contentApproved: draft.status === "APPROVED",
        contentArchived: draft.isArchived,
        projectArchived: draft.aiDeliveryProject.isArchived,
        publicationTargetId: publicationTarget?.id ?? null
      };
    },

    async getOrCreateRun(context) {
      const id = randomUUID();
      try {
        const row = await prisma.aiDeliveryBoundedWorkflowRun.create({
          data: {
            id,
            tenantId: context.tenantId,
            aiDeliveryProjectId: context.aiDeliveryProjectId,
            contentDraftId: context.contentDraftId,
            publicationTargetId: context.publicationTargetId,
            initiatedByUserId: context.actorUserId,
            workflowType: BOUNDED_CONTENT_TO_DRAFT_WORKFLOW_TYPE,
            imageIdempotencyKey: buildBoundedWorkflowStageKey(
              "image",
              context.tenantId,
              context.contentDraftId,
              id
            ),
            storageIdempotencyKey: buildBoundedWorkflowStageKey(
              "storage",
              context.tenantId,
              context.contentDraftId,
              id
            ),
            wordpressIdempotencyKey: buildBoundedWorkflowStageKey(
              "wordpress",
              context.tenantId,
              context.contentDraftId,
              id
            ),
            emailIdempotencyKey: buildBoundedWorkflowStageKey(
              "email",
              context.tenantId,
              context.contentDraftId,
              id
            ),
            imageCorrelationId: `bounded-image-${id}`
          }
        });
        return mapRun(row);
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }
        const existing = await prisma.aiDeliveryBoundedWorkflowRun.findUnique({
          where: {
            tenantId_contentDraftId_workflowType: {
              tenantId: context.tenantId,
              contentDraftId: context.contentDraftId,
              workflowType: BOUNDED_CONTENT_TO_DRAFT_WORKFLOW_TYPE
            }
          }
        });
        if (!existing) {
          throw error;
        }
        return mapRun(existing);
      }
    },

    async getRun(tenantId, workflowRunId) {
      const row = await prisma.aiDeliveryBoundedWorkflowRun.findFirst({
        where: {
          id: workflowRunId,
          tenantId,
          ...(options.exactScope
            ? {
                aiDeliveryProjectId: options.exactScope.aiDeliveryProjectId,
                contentDraftId: options.exactScope.contentDraftId,
                publicationTargetId: options.exactScope.publicationTargetId,
                initiatedByUserId: options.exactScope.actorUserId
              }
            : {})
        }
      });
      return row ? mapRun(row) : null;
    },

    async claimState(tenantId, workflowRunId, expectedState, nextState, patch = {}) {
      return prisma.$transaction(async (tx) => {
        const claimed = await tx.aiDeliveryBoundedWorkflowRun.updateMany({
          where: {
            id: workflowRunId,
            tenantId,
            state: expectedState as AiDeliveryBoundedWorkflowState
          },
          data: {
            state: nextState as AiDeliveryBoundedWorkflowState,
            stateVersion: { increment: 1 },
            ...stateTimestamp(nextState),
            ...runPatch(patch)
          }
        });
        if (claimed.count !== 1) {
          return null;
        }
        const row = await tx.aiDeliveryBoundedWorkflowRun.findUniqueOrThrow({
          where: { id: workflowRunId }
        });
        return mapRun(row);
      });
    },

    async persistImagePreview(input) {
      return prisma.$transaction(async (tx) => {
        const image = await tx.aiDeliveryArticleImage.create({
          data: {
            tenantId: input.run.tenantId,
            aiDeliveryProjectId: input.run.aiDeliveryProjectId,
            contentDraftId: input.run.contentDraftId,
            title: `${input.context.contentTitle} image`,
            prompt: input.context.imagePrompt,
            status: "PREVIEW_READY",
            storageKey: input.stored.storageKey,
            provider: input.generation.provider,
            providerModel: input.generation.model,
            correlationId: input.generation.correlationId,
            contentType: input.generation.contentType,
            width: input.generation.width,
            height: input.generation.height,
            byteLength: input.generation.byteLength,
            sha256: input.generation.sha256,
            retryCount: input.generation.retryCount,
            fallbackUsed: input.generation.fallbackUsed,
            estimatedCostUsd: input.generation.estimatedCostUsd,
            actualCostUsd: input.generation.actualCostUsd,
            generatedAt: new Date()
          }
        });
        const claimed = await tx.aiDeliveryBoundedWorkflowRun.updateMany({
          where: {
            id: input.run.id,
            tenantId: input.run.tenantId,
            state: "IMAGE_REQUEST_STARTED"
          },
          data: {
            state: "IMAGE_PREVIEW_READY",
            stateVersion: { increment: 1 },
            articleImageId: image.id,
            imageProviderRequestId: input.generation.providerRequestId,
            imageCorrelationId: input.generation.correlationId,
            storageKey: input.stored.storageKey,
            storageUploadCount: input.stored.uploadCount,
            retryCount: input.generation.retryCount,
            fallbackUsed: input.generation.fallbackUsed,
            imagePreviewReadyAt: new Date()
          }
        });
        if (claimed.count !== 1) {
          throw new BoundedWorkflowError("state_conflict", "Image preview stage was not owned by this request.");
        }
        return mapRun(
          await tx.aiDeliveryBoundedWorkflowRun.findUniqueOrThrow({ where: { id: input.run.id } })
        );
      });
    },

    async resolveContinuationContext(tenantId, workflowRunId) {
      const run = await prisma.aiDeliveryBoundedWorkflowRun.findFirst({
        where: {
          id: workflowRunId,
          tenantId,
          ...(options.exactScope
            ? {
                aiDeliveryProjectId: options.exactScope.aiDeliveryProjectId,
                contentDraftId: options.exactScope.contentDraftId,
                publicationTargetId: options.exactScope.publicationTargetId,
                initiatedByUserId: options.exactScope.actorUserId
              }
            : {})
        }
      });
      if (!run || !run.articleImageId || !run.publicationTargetId || !run.initiatedByUserId) {
        return null;
      }
      const [draft, image, target, owner] = await Promise.all([
        prisma.aiDeliveryContentDraft.findFirst({
          where: { id: run.contentDraftId, tenantId },
          include: { aiDeliveryProject: true }
        }),
        prisma.aiDeliveryArticleImage.findFirst({
          where: { id: run.articleImageId, tenantId }
        }),
        prisma.publicationTarget.findFirst({
          where: { id: run.publicationTargetId, tenantId }
        }),
        prisma.tenantMembership.findFirst({
          where: {
            tenantId,
            userId: run.initiatedByUserId,
            status: "ACTIVE",
            membershipRoles: {
              some: {
                role: { key: { in: ["owner", "admin"] }, status: "ACTIVE" }
              }
            }
          },
          include: { user: { select: { id: true, email: true } } }
        })
      ]);
      if (
        !draft ||
        !image ||
        !target ||
        !owner ||
        draft.aiDeliveryProjectId !== run.aiDeliveryProjectId ||
        image.aiDeliveryProjectId !== run.aiDeliveryProjectId ||
        image.contentDraftId !== run.contentDraftId
      ) {
        return null;
      }
      return {
        tenantId,
        actorUserId: run.initiatedByUserId,
        aiDeliveryProjectId: run.aiDeliveryProjectId,
        clientId: draft.aiDeliveryProject.clientId,
        contentDraftId: draft.id,
        contentTitle: draft.title,
        contentBody: draft.draftBody,
        imagePrompt: image.prompt,
        contentApproved: draft.status === "APPROVED",
        contentArchived: draft.isArchived,
        projectArchived: draft.aiDeliveryProject.isArchived,
        publicationTargetId: target.id,
        run: mapRun(run),
        articleImageId: image.id,
        articleImageStatus: image.status,
        articleImageArchived: image.isArchived,
        publicationTarget: {
          id: target.id,
          tenantId: target.tenantId,
          clientId: target.clientId,
          connectorType: target.connectorType,
          siteUrl: target.siteUrl,
          wordpressUsername: target.wordpressUsername,
          isArchived: target.isArchived
        },
        ownerRecipient: {
          userId: owner.user.id,
          email: owner.user.email
        }
      } satisfies BoundedWorkflowContinuationContext;
    },

    async persistWordPressDraft(input) {
      return prisma.$transaction(async (tx) => {
        const attempt = await tx.wordPressDraftLiveAttempt.findUnique({
          where: {
            tenantId_idempotencyKey: {
              tenantId: input.run.tenantId,
              idempotencyKey: input.run.wordpressIdempotencyKey
            }
          }
        });
        const attemptId = input.result.attemptId ?? attempt?.id ?? null;
        if (!attemptId) {
          throw new BoundedWorkflowError("wordpress_attempt_missing", "WordPress attempt linkage is missing.");
        }
        const claimed = await tx.aiDeliveryBoundedWorkflowRun.updateMany({
          where: {
            id: input.run.id,
            tenantId: input.run.tenantId,
            state: "WORDPRESS_REQUEST_STARTED"
          },
          data: {
            state: "WORDPRESS_DRAFT_CREATED",
            stateVersion: { increment: 1 },
            wordpressAttemptId: attemptId,
            wordpressPostId: input.result.wordpressPostId,
            wordpressRequestCount: input.result.submitRequestCount,
            wordpressDraftCreatedAt: new Date()
          }
        });
        if (claimed.count !== 1) {
          throw new BoundedWorkflowError("state_conflict", "WordPress stage was not owned by this request.");
        }
        return mapRun(
          await tx.aiDeliveryBoundedWorkflowRun.findUniqueOrThrow({ where: { id: input.run.id } })
        );
      });
    },

    async persistAcceptedEmail(input) {
      return prisma.$transaction(async (tx) => {
        const emailLog = await tx.emailLog.create({
          data: {
            tenantId: input.run.tenantId,
            recipientEmail: input.recipientEmail.trim().toLowerCase(),
            subject: "WordPress draft created and ready for admin review",
            templateKey: "AI_DELIVERY_REVIEW_REQUEST",
            status: "SENT",
            relatedModule: "ai-delivery-bounded-workflow",
            relatedEntityId: input.run.id,
            providerMessageId: input.result.providerMessageId,
            sentAt: new Date()
          }
        });
        const claimed = await tx.aiDeliveryBoundedWorkflowRun.updateMany({
          where: {
            id: input.run.id,
            tenantId: input.run.tenantId,
            state: "EMAIL_REQUEST_STARTED"
          },
          data: {
            state: "EMAIL_SENT",
            stateVersion: { increment: 1 },
            emailLogId: emailLog.id,
            emailProviderMessageId: input.result.providerMessageId,
            emailRequestCount: input.result.requestCount,
            emailSentAt: new Date()
          }
        });
        if (claimed.count !== 1) {
          throw new BoundedWorkflowError("state_conflict", "Email stage was not owned by this request.");
        }
        return mapRun(
          await tx.aiDeliveryBoundedWorkflowRun.findUniqueOrThrow({ where: { id: input.run.id } })
        );
      });
    }
  };
}
