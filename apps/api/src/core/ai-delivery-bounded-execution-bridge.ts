import type { createPrismaClient } from "../../../../packages/data/src/client";
import {
  assertBoundedExecutionExactScope,
  assertValidBoundedProofOwnerRecipientEmail,
  type BoundedExecutionExactScope
} from "../config/ai-delivery-bounded-execution.config";
import {
  createPrismaBoundedWorkflowStore
} from "./ai-delivery-bounded-workflow.store";
import {
  BOUNDED_CONTENT_TO_DRAFT_WORKFLOW_TYPE,
  continueBoundedContentToDraftWorkflowAfterImageApproval,
  startBoundedContentToDraftWorkflow,
  type BoundedWorkflowProviders,
  type BoundedWorkflowStore
} from "./ai-delivery-bounded-workflow.service";
import type {
  BoundedProofCleanupProviders
} from "../services/ai-delivery-bounded-workflow.live-providers";
import { assertExactR2ObjectKey } from "../storage/r2.service";

type PrismaClientLike = ReturnType<typeof createPrismaClient>;

export const BOUNDED_PROOF_MANIFEST_VERSION =
  "DCA_AI_DELIVERY_BOUNDED_PROOF_V1" as const;

export type BoundedProofManifest = BoundedExecutionExactScope & {
  schemaVersion: typeof BOUNDED_PROOF_MANIFEST_VERSION;
  proofCorrelationId: string;
  workflowRunId: string | null;
  articleImageId: string | null;
  wordpressAttemptId: string | null;
  emailLogId: string | null;
  wordpressPostId: string | null;
  storageKey: string | null;
  wordpressIdempotencyKey: string | null;
};

export type BoundedProofInspection = {
  workflowRunId: string;
  tenantId: string;
  clientId: string;
  projectId: string;
  contentDraftId: string;
  publicationTargetId: string;
  articleImageId: string | null;
  storageKey: string | null;
  state: string;
  requestCounts: {
    image: number;
    storage: number;
    wordpress: number;
    email: number;
  };
  retryCount: number;
  fallbackUsed: boolean;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MANIFEST_KEYS = new Set([
  "schemaVersion",
  "proofCorrelationId",
  "tenantId",
  "clientId",
  "projectId",
  "contentDraftId",
  "publicationTargetId",
  "initiatingUserId",
  "workflowRunId",
  "articleImageId",
  "wordpressAttemptId",
  "emailLogId",
  "wordpressPostId",
  "storageKey",
  "wordpressIdempotencyKey"
]);

function proofProjectName(correlationId: string): string {
  return `[DCA-BOUNDED-PROOF:${correlationId}] Project`;
}

function proofDraftTitle(correlationId: string): string {
  return `[DCA-BOUNDED-PROOF:${correlationId}] Approved content draft`;
}

function requireUuid(value: unknown, name: string, nullable = false): string | null {
  if (nullable && value === null) {
    return null;
  }
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error(`Proof manifest ${name} must be ${nullable ? "null or " : ""}an exact UUID.`);
  }
  return value;
}

function nullableIdentifier(value: unknown, name: string): string | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== "string" || !value.trim() || /[*?\\]/.test(value)) {
    throw new Error(`Proof manifest ${name} must be null or one exact identifier.`);
  }
  return value.trim();
}

export function parseBoundedProofManifest(value: unknown): BoundedProofManifest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Proof manifest must be a JSON object.");
  }
  const record = value as Record<string, unknown>;
  const unknownKeys = Object.keys(record).filter((key) => !MANIFEST_KEYS.has(key));
  if (unknownKeys.length > 0) {
    throw new Error("Proof manifest contains unsupported fields.");
  }
  if (record.schemaVersion !== BOUNDED_PROOF_MANIFEST_VERSION) {
    throw new Error("Proof manifest schemaVersion is unsupported.");
  }

  const manifest: BoundedProofManifest = {
    schemaVersion: BOUNDED_PROOF_MANIFEST_VERSION,
    proofCorrelationId: requireUuid(record.proofCorrelationId, "proofCorrelationId")!,
    tenantId: requireUuid(record.tenantId, "tenantId")!,
    clientId: requireUuid(record.clientId, "clientId")!,
    projectId: requireUuid(record.projectId, "projectId")!,
    contentDraftId: requireUuid(record.contentDraftId, "contentDraftId")!,
    publicationTargetId: requireUuid(record.publicationTargetId, "publicationTargetId")!,
    initiatingUserId: requireUuid(record.initiatingUserId, "initiatingUserId")!,
    workflowRunId: requireUuid(record.workflowRunId, "workflowRunId", true),
    articleImageId: requireUuid(record.articleImageId, "articleImageId", true),
    wordpressAttemptId: requireUuid(record.wordpressAttemptId, "wordpressAttemptId", true),
    emailLogId: requireUuid(record.emailLogId, "emailLogId", true),
    wordpressPostId: nullableIdentifier(record.wordpressPostId, "wordpressPostId"),
    storageKey: nullableIdentifier(record.storageKey, "storageKey"),
    wordpressIdempotencyKey: nullableIdentifier(
      record.wordpressIdempotencyKey,
      "wordpressIdempotencyKey"
    )
  };
  assertBoundedExecutionExactScope(manifest);
  if (manifest.storageKey) {
    const keyCheck = assertExactR2ObjectKey(manifest.storageKey);
    const requiredPrefix =
      `tenants/${manifest.tenantId}/ai-delivery/${manifest.contentDraftId}/`;
    if (!keyCheck.ok || !manifest.storageKey.startsWith(requiredPrefix)) {
      throw new Error("Proof manifest storageKey is not the exact bounded workflow object key.");
    }
  }
  if (manifest.wordpressPostId && !/^\d+$/.test(manifest.wordpressPostId)) {
    throw new Error("Proof manifest wordpressPostId must be one exact numeric ID.");
  }
  return manifest;
}

function exactScope(manifest: BoundedProofManifest) {
  return {
    tenantId: manifest.tenantId,
    clientId: manifest.clientId,
    aiDeliveryProjectId: manifest.projectId,
    contentDraftId: manifest.contentDraftId,
    publicationTargetId: manifest.publicationTargetId,
    actorUserId: manifest.initiatingUserId
  };
}

export async function prepareBoundedProofData(
  manifest: BoundedProofManifest,
  prisma: PrismaClientLike
): Promise<BoundedProofManifest> {
  const parsed = parseBoundedProofManifest(manifest);
  if (
    parsed.workflowRunId ||
    parsed.articleImageId ||
    parsed.wordpressAttemptId ||
    parsed.emailLogId ||
    parsed.wordpressPostId ||
    parsed.storageKey ||
    parsed.wordpressIdempotencyKey
  ) {
    throw new Error("Proof-data preparation requires an unstarted manifest.");
  }

  const [tenant, client, owner, target] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: parsed.tenantId }, select: { id: true } }),
    prisma.client.findFirst({
      where: { id: parsed.clientId, tenantId: parsed.tenantId },
      select: { id: true }
    }),
    prisma.tenantMembership.findFirst({
      where: {
        tenantId: parsed.tenantId,
        userId: parsed.initiatingUserId,
        status: "ACTIVE",
        membershipRoles: {
          some: {
            role: { key: { in: ["owner", "admin"] }, status: "ACTIVE" }
          }
        }
      },
      select: { userId: true }
    }),
    prisma.publicationTarget.findFirst({
      where: {
        id: parsed.publicationTargetId,
        tenantId: parsed.tenantId,
        clientId: parsed.clientId,
        connectorType: "WORDPRESS",
        isArchived: false
      },
      select: { id: true }
    })
  ]);
  if (!tenant || !client || !owner || !target) {
    throw new Error("Exact tenant/client/owner/publication-target proof scope did not match.");
  }

  await prisma.$transaction(async (tx) => {
    const project = await tx.aiDeliveryProject.findUnique({
      where: { id: parsed.projectId },
      select: { id: true, tenantId: true, clientId: true, name: true }
    });
    if (project) {
      if (
        project.tenantId !== parsed.tenantId ||
        project.clientId !== parsed.clientId ||
        project.name !== proofProjectName(parsed.proofCorrelationId)
      ) {
        throw new Error("Existing project ID is not the isolated proof project.");
      }
    } else {
      await tx.aiDeliveryProject.create({
        data: {
          id: parsed.projectId,
          tenantId: parsed.tenantId,
          clientId: parsed.clientId,
          name: proofProjectName(parsed.proofCorrelationId),
          targetMonth: new Date()
        }
      });
    }

    const draft = await tx.aiDeliveryContentDraft.findUnique({
      where: { id: parsed.contentDraftId },
      select: {
        id: true,
        tenantId: true,
        aiDeliveryProjectId: true,
        title: true,
        status: true
      }
    });
    if (draft) {
      if (
        draft.tenantId !== parsed.tenantId ||
        draft.aiDeliveryProjectId !== parsed.projectId ||
        draft.title !== proofDraftTitle(parsed.proofCorrelationId) ||
        draft.status !== "APPROVED"
      ) {
        throw new Error("Existing content draft ID is not the isolated approved proof draft.");
      }
    } else {
      await tx.aiDeliveryContentDraft.create({
        data: {
          id: parsed.contentDraftId,
          tenantId: parsed.tenantId,
          aiDeliveryProjectId: parsed.projectId,
          title: proofDraftTitle(parsed.proofCorrelationId),
          draftBody:
            "<p>Isolated staging execution bridge proof content. Do not publish.</p>",
          status: "APPROVED",
          approvedAt: new Date()
        }
      });
    }
  });
  return parsed;
}

export async function startBoundedProof(
  manifest: BoundedProofManifest,
  dependencies: { prisma: PrismaClientLike; providers: BoundedWorkflowProviders }
): Promise<BoundedProofManifest> {
  const parsed = parseBoundedProofManifest(manifest);
  const store = createPrismaBoundedWorkflowStore(dependencies.prisma, {
    exactScope: exactScope(parsed)
  });
  const run = await startBoundedContentToDraftWorkflow(
    {
      tenantId: parsed.tenantId,
      contentDraftId: parsed.contentDraftId,
      actorUserId: parsed.initiatingUserId
    },
    { store, providers: dependencies.providers }
  );
  if (
    run.aiDeliveryProjectId !== parsed.projectId ||
    run.contentDraftId !== parsed.contentDraftId ||
    run.publicationTargetId !== parsed.publicationTargetId ||
    run.initiatedByUserId !== parsed.initiatingUserId
  ) {
    throw new Error("Started workflow does not match the exact proof manifest.");
  }
  return parseBoundedProofManifest({
    ...parsed,
    workflowRunId: run.id,
    articleImageId: run.articleImageId,
    wordpressAttemptId: run.wordpressAttemptId,
    emailLogId: run.emailLogId,
    wordpressPostId: run.wordpressPostId,
    storageKey: run.storageKey,
    wordpressIdempotencyKey: run.wordpressIdempotencyKey
  });
}

export async function inspectBoundedProof(
  manifest: BoundedProofManifest,
  prisma: PrismaClientLike
): Promise<BoundedProofInspection> {
  const parsed = parseBoundedProofManifest(manifest);
  if (!parsed.workflowRunId) {
    throw new Error("Proof manifest has no workflowRunId.");
  }
  const run = await prisma.aiDeliveryBoundedWorkflowRun.findFirst({
    where: {
      id: parsed.workflowRunId,
      tenantId: parsed.tenantId,
      aiDeliveryProjectId: parsed.projectId,
      contentDraftId: parsed.contentDraftId,
      publicationTargetId: parsed.publicationTargetId,
      initiatedByUserId: parsed.initiatingUserId,
      workflowType: BOUNDED_CONTENT_TO_DRAFT_WORKFLOW_TYPE
    },
    include: {
      aiDeliveryProject: { select: { clientId: true } }
    }
  });
  if (!run || run.aiDeliveryProject.clientId !== parsed.clientId) {
    throw new Error("Exact workflow run was not found for the proof manifest.");
  }
  if (
    (parsed.articleImageId && run.articleImageId !== parsed.articleImageId) ||
    (parsed.storageKey && run.storageKey !== parsed.storageKey)
  ) {
    throw new Error("Proof manifest artifact linkage does not match the durable run.");
  }
  const [attemptMatches, emailMatches] = await Promise.all([
    parsed.wordpressAttemptId
      ? prisma.wordPressDraftLiveAttempt.count({
          where: {
            id: parsed.wordpressAttemptId,
            tenantId: parsed.tenantId,
            idempotencyKey: run.wordpressIdempotencyKey
          }
        })
      : 1,
    parsed.emailLogId
      ? prisma.emailLog.count({
          where: {
            id: parsed.emailLogId,
            tenantId: parsed.tenantId,
            relatedEntityId: run.id
          }
        })
      : 1
  ]);
  if (
    attemptMatches !== 1 ||
    emailMatches !== 1 ||
    (run.wordpressAttemptId &&
      parsed.wordpressAttemptId !== run.wordpressAttemptId) ||
    (run.emailLogId && parsed.emailLogId !== run.emailLogId)
  ) {
    throw new Error("Proof manifest external linkage does not match the durable run.");
  }
  return {
    workflowRunId: run.id,
    tenantId: run.tenantId,
    clientId: run.aiDeliveryProject.clientId,
    projectId: run.aiDeliveryProjectId,
    contentDraftId: run.contentDraftId,
    publicationTargetId: run.publicationTargetId!,
    articleImageId: run.articleImageId,
    storageKey: run.storageKey,
    state: run.state,
    requestCounts: {
      image: run.imageRequestCount,
      storage: run.storageUploadCount,
      wordpress: run.wordpressRequestCount,
      email: run.emailRequestCount
    },
    retryCount: run.retryCount,
    fallbackUsed: run.fallbackUsed
  };
}

/**
 * Proof-path-only: override continuation ownerRecipient.email while keeping userId.
 * Normal application email resolution never calls this helper.
 */
export function withBoundedProofOwnerRecipientOverride(
  store: BoundedWorkflowStore,
  ownerRecipientEmail: string
): BoundedWorkflowStore {
  const normalized = assertValidBoundedProofOwnerRecipientEmail(ownerRecipientEmail);
  return {
    ...store,
    async resolveContinuationContext(tenantId, workflowRunId) {
      const context = await store.resolveContinuationContext(tenantId, workflowRunId);
      if (!context) {
        return null;
      }
      return {
        ...context,
        ownerRecipient: {
          userId: context.ownerRecipient.userId,
          email: normalized
        }
      };
    }
  };
}

export async function continueBoundedProof(
  manifest: BoundedProofManifest,
  dependencies: {
    prisma: PrismaClientLike;
    providers: BoundedWorkflowProviders;
    /** Required for live/staging proof CLI; optional only for injected unit fixtures. */
    ownerRecipientEmailOverride?: string;
  }
): Promise<BoundedProofManifest> {
  const parsed = parseBoundedProofManifest(manifest);
  if (!parsed.workflowRunId) {
    throw new Error("Proof manifest has no workflowRunId.");
  }
  const baseStore = createPrismaBoundedWorkflowStore(dependencies.prisma, {
    exactScope: exactScope(parsed)
  });
  const store = dependencies.ownerRecipientEmailOverride
    ? withBoundedProofOwnerRecipientOverride(baseStore, dependencies.ownerRecipientEmailOverride)
    : baseStore;
  const run = await continueBoundedContentToDraftWorkflowAfterImageApproval(
    { tenantId: parsed.tenantId, workflowRunId: parsed.workflowRunId },
    { store, providers: dependencies.providers }
  );
  const attempt = await dependencies.prisma.wordPressDraftLiveAttempt.findUnique({
    where: {
      tenantId_idempotencyKey: {
        tenantId: parsed.tenantId,
        idempotencyKey: run.wordpressIdempotencyKey
      }
    },
    select: { id: true }
  });
  return parseBoundedProofManifest({
    ...parsed,
    articleImageId: run.articleImageId,
    wordpressAttemptId: run.wordpressAttemptId ?? attempt?.id ?? null,
    emailLogId: run.emailLogId,
    wordpressPostId: run.wordpressPostId,
    storageKey: run.storageKey,
    wordpressIdempotencyKey: run.wordpressIdempotencyKey
  });
}

export async function cleanupBoundedProofExactIds(
  manifest: BoundedProofManifest,
  dependencies: {
    prisma: PrismaClientLike;
    cleanupProviders: BoundedProofCleanupProviders;
  }
): Promise<{ deletedRows: number; residualRows: number }> {
  const parsed = parseBoundedProofManifest(manifest);
  const projectName = proofProjectName(parsed.proofCorrelationId);
  const draftTitle = proofDraftTitle(parsed.proofCorrelationId);

  const [project, draft, run] = await Promise.all([
    dependencies.prisma.aiDeliveryProject.findFirst({
      where: {
        id: parsed.projectId,
        tenantId: parsed.tenantId,
        clientId: parsed.clientId,
        name: projectName
      },
      select: { id: true }
    }),
    dependencies.prisma.aiDeliveryContentDraft.findFirst({
      where: {
        id: parsed.contentDraftId,
        tenantId: parsed.tenantId,
        aiDeliveryProjectId: parsed.projectId,
        title: draftTitle
      },
      select: { id: true }
    }),
    parsed.workflowRunId
      ? dependencies.prisma.aiDeliveryBoundedWorkflowRun.findFirst({
          where: {
            id: parsed.workflowRunId,
            tenantId: parsed.tenantId,
            aiDeliveryProjectId: parsed.projectId,
            contentDraftId: parsed.contentDraftId
          }
        })
      : null
  ]);
  if (!project || !draft) {
    throw new Error("Cleanup refused: exact isolated proof project/draft do not match.");
  }
  if (parsed.workflowRunId && !run) {
    throw new Error("Cleanup refused: exact workflow run does not match.");
  }

  if (parsed.wordpressPostId) {
    if (!parsed.wordpressIdempotencyKey) {
      throw new Error("Cleanup refused: WordPress post lacks its exact idempotency key.");
    }
    const trashed = await dependencies.cleanupProviders.trashWordPressDraft({
      tenantId: parsed.tenantId,
      publicationTargetId: parsed.publicationTargetId,
      wordpressPostId: parsed.wordpressPostId,
      wordpressIdempotencyKey: parsed.wordpressIdempotencyKey
    });
    if (!trashed.ok) {
      throw new Error("Cleanup stopped: exact WordPress draft trash failed.");
    }
  }
  if (parsed.storageKey) {
    const deleted = await dependencies.cleanupProviders.deletePrivateImage({
      storageKey: parsed.storageKey
    });
    if (!deleted.ok) {
      throw new Error("Cleanup stopped: exact private R2 object delete failed.");
    }
  }

  const deletedRows = await dependencies.prisma.$transaction(async (tx) => {
    let count = 0;
    if (parsed.workflowRunId) {
      count += (
        await tx.aiDeliveryBoundedWorkflowRun.deleteMany({
          where: {
            id: parsed.workflowRunId,
            tenantId: parsed.tenantId,
            aiDeliveryProjectId: parsed.projectId,
            contentDraftId: parsed.contentDraftId
          }
        })
      ).count;
    }
    if (parsed.emailLogId) {
      count += (
        await tx.emailLog.deleteMany({
          where: {
            id: parsed.emailLogId,
            tenantId: parsed.tenantId,
            relatedEntityId: parsed.workflowRunId
          }
        })
      ).count;
    }
    if (parsed.wordpressAttemptId) {
      count += (
        await tx.wordPressDraftLiveAttempt.deleteMany({
          where: {
            id: parsed.wordpressAttemptId,
            tenantId: parsed.tenantId,
            publicationTargetId: parsed.publicationTargetId
          }
        })
      ).count;
    }
    if (parsed.articleImageId) {
      count += (
        await tx.aiDeliveryArticleImage.deleteMany({
          where: {
            id: parsed.articleImageId,
            tenantId: parsed.tenantId,
            aiDeliveryProjectId: parsed.projectId,
            contentDraftId: parsed.contentDraftId
          }
        })
      ).count;
    }
    count += (
      await tx.aiDeliveryContentDraft.deleteMany({
        where: {
          id: parsed.contentDraftId,
          tenantId: parsed.tenantId,
          aiDeliveryProjectId: parsed.projectId,
          title: draftTitle
        }
      })
    ).count;
    count += (
      await tx.aiDeliveryProject.deleteMany({
        where: {
          id: parsed.projectId,
          tenantId: parsed.tenantId,
          clientId: parsed.clientId,
          name: projectName
        }
      })
    ).count;
    return count;
  });

  const residualRows = await dependencies.prisma.$transaction(async (tx) => {
    return (
      (await tx.aiDeliveryProject.count({ where: { id: parsed.projectId } })) +
      (await tx.aiDeliveryContentDraft.count({
        where: { id: parsed.contentDraftId }
      })) +
      (parsed.workflowRunId
        ? await tx.aiDeliveryBoundedWorkflowRun.count({
            where: { id: parsed.workflowRunId }
          })
        : 0) +
      (parsed.articleImageId
        ? await tx.aiDeliveryArticleImage.count({
            where: { id: parsed.articleImageId }
          })
        : 0) +
      (parsed.wordpressAttemptId
        ? await tx.wordPressDraftLiveAttempt.count({
            where: { id: parsed.wordpressAttemptId }
          })
        : 0) +
      (parsed.emailLogId
        ? await tx.emailLog.count({ where: { id: parsed.emailLogId } })
        : 0)
    );
  });
  if (residualRows !== 0) {
    throw new Error("Cleanup failed: residual proof rows remain.");
  }
  return { deletedRows, residualRows };
}
