import { randomUUID } from "node:crypto";
import {
  BOUNDED_CONTENT_TO_DRAFT_WORKFLOW_TYPE,
  BoundedWorkflowError,
  buildBoundedWorkflowStageKey,
  type BoundedOwnerEmailResult,
  type BoundedWorkflowContinuationContext,
  type BoundedWorkflowRun,
  type BoundedWorkflowStartContext,
  type BoundedWorkflowStore,
  type BoundedWordPressDraftResult,
  type BoundedImageGenerationResult,
  type BoundedStoredImage
} from "./ai-delivery-bounded-workflow.service";

export type BoundedMemoryFixture = BoundedWorkflowStartContext & {
  publicationTarget: BoundedWorkflowContinuationContext["publicationTarget"];
  ownerRecipient: BoundedWorkflowContinuationContext["ownerRecipient"];
};

export type BoundedMemoryStoreOptions = {
  failImagePersistenceAfterStorage?: boolean;
  failWordpressPersistenceAfterCreate?: boolean;
  failEmailPersistenceAfterAcceptance?: boolean;
};

export function createBoundedMemoryWorkflowStore(
  fixtures: BoundedMemoryFixture[],
  options: BoundedMemoryStoreOptions = {}
): {
  store: BoundedWorkflowStore;
  approveImage(workflowRunId: string): void;
  archiveContent(contentDraftId: string): void;
  runs: Map<string, BoundedWorkflowRun>;
  images: Map<string, {
    id: string;
    tenantId: string;
    projectId: string;
    contentDraftId: string;
    status: string;
    isArchived: boolean;
    storageKey: string;
    generation: BoundedImageGenerationResult;
  }>;
  emailLogs: Array<{ id: string; workflowRunId: string; recipientEmail: string; providerMessageId: string }>;
} {
  const fixtureByDraft = new Map(fixtures.map((fixture) => [`${fixture.tenantId}:${fixture.contentDraftId}`, fixture]));
  const runs = new Map<string, BoundedWorkflowRun>();
  const runIdByKey = new Map<string, string>();
  const images = new Map<string, {
    id: string;
    tenantId: string;
    projectId: string;
    contentDraftId: string;
    status: string;
    isArchived: boolean;
    storageKey: string;
    generation: BoundedImageGenerationResult;
  }>();
  const emailLogs: Array<{
    id: string;
    workflowRunId: string;
    recipientEmail: string;
    providerMessageId: string;
  }> = [];

  const copy = (run: BoundedWorkflowRun): BoundedWorkflowRun => ({ ...run });
  const replaceRun = (run: BoundedWorkflowRun): BoundedWorkflowRun => {
    runs.set(run.id, run);
    return copy(run);
  };

  const store: BoundedWorkflowStore = {
    async resolveStartContext(input) {
      const fixture = fixtureByDraft.get(`${input.tenantId}:${input.contentDraftId}`);
      if (!fixture || fixture.actorUserId !== input.actorUserId) {
        return null;
      }
      return { ...fixture };
    },

    async getOrCreateRun(context) {
      const uniqueKey = `${context.tenantId}:${context.contentDraftId}:${BOUNDED_CONTENT_TO_DRAFT_WORKFLOW_TYPE}`;
      const existingId = runIdByKey.get(uniqueKey);
      if (existingId) {
        return copy(runs.get(existingId)!);
      }
      const id = randomUUID();
      const run: BoundedWorkflowRun = {
        id,
        tenantId: context.tenantId,
        aiDeliveryProjectId: context.aiDeliveryProjectId,
        contentDraftId: context.contentDraftId,
        publicationTargetId: context.publicationTargetId,
        articleImageId: null,
        wordpressAttemptId: null,
        emailLogId: null,
        initiatedByUserId: context.actorUserId,
        workflowType: BOUNDED_CONTENT_TO_DRAFT_WORKFLOW_TYPE,
        state: "CONTENT_APPROVED",
        stateVersion: 0,
        imageIdempotencyKey: buildBoundedWorkflowStageKey("image", context.tenantId, context.contentDraftId, id),
        storageIdempotencyKey: buildBoundedWorkflowStageKey("storage", context.tenantId, context.contentDraftId, id),
        wordpressIdempotencyKey: buildBoundedWorkflowStageKey(
          "wordpress",
          context.tenantId,
          context.contentDraftId,
          id
        ),
        emailIdempotencyKey: buildBoundedWorkflowStageKey("email", context.tenantId, context.contentDraftId, id),
        imageProviderRequestId: null,
        imageCorrelationId: `bounded-image-${id}`,
        storageKey: null,
        wordpressPostId: null,
        emailProviderMessageId: null,
        imageRequestCount: 0,
        storageUploadCount: 0,
        wordpressRequestCount: 0,
        emailRequestCount: 0,
        retryCount: 0,
        fallbackUsed: false,
        safeError: null
      };
      runIdByKey.set(uniqueKey, id);
      return replaceRun(run);
    },

    async getRun(tenantId, workflowRunId) {
      const run = runs.get(workflowRunId);
      return run?.tenantId === tenantId ? copy(run) : null;
    },

    async claimState(tenantId, workflowRunId, expectedState, nextState, patch = {}) {
      const run = runs.get(workflowRunId);
      if (!run || run.tenantId !== tenantId || run.state !== expectedState) {
        return null;
      }
      return replaceRun({
        ...run,
        ...patch,
        state: nextState,
        stateVersion: run.stateVersion + 1
      });
    },

    async persistImagePreview(input: {
      run: BoundedWorkflowRun;
      context: BoundedWorkflowStartContext;
      generation: BoundedImageGenerationResult;
      stored: BoundedStoredImage;
    }) {
      if (options.failImagePersistenceAfterStorage) {
        throw new Error("Fake DB failure after private image persistence.");
      }
      const current = runs.get(input.run.id);
      if (!current || current.state !== "IMAGE_REQUEST_STARTED") {
        throw new BoundedWorkflowError("state_conflict", "Image preview stage was not owned by this request.");
      }
      const imageId = randomUUID();
      images.set(imageId, {
        id: imageId,
        tenantId: current.tenantId,
        projectId: current.aiDeliveryProjectId,
        contentDraftId: current.contentDraftId,
        status: "PREVIEW_READY",
        isArchived: false,
        storageKey: input.stored.storageKey,
        generation: input.generation
      });
      return replaceRun({
        ...current,
        state: "IMAGE_PREVIEW_READY",
        stateVersion: current.stateVersion + 1,
        articleImageId: imageId,
        imageProviderRequestId: input.generation.providerRequestId,
        imageCorrelationId: input.generation.correlationId,
        storageKey: input.stored.storageKey,
        storageUploadCount: input.stored.uploadCount,
        retryCount: input.generation.retryCount,
        fallbackUsed: input.generation.fallbackUsed
      });
    },

    async resolveContinuationContext(tenantId, workflowRunId) {
      const run = runs.get(workflowRunId);
      if (!run || run.tenantId !== tenantId || !run.articleImageId) {
        return null;
      }
      const fixture = fixtureByDraft.get(`${tenantId}:${run.contentDraftId}`);
      const image = images.get(run.articleImageId);
      if (!fixture || !image) {
        return null;
      }
      return {
        ...fixture,
        run: copy(run),
        articleImageId: image.id,
        articleImageStatus: image.status,
        articleImageArchived: image.isArchived
      };
    },

    async persistWordPressDraft(input: { run: BoundedWorkflowRun; result: BoundedWordPressDraftResult }) {
      if (options.failWordpressPersistenceAfterCreate) {
        throw new Error("Fake DB failure after WordPress draft creation.");
      }
      const current = runs.get(input.run.id);
      if (!current || current.state !== "WORDPRESS_REQUEST_STARTED") {
        throw new BoundedWorkflowError("state_conflict", "WordPress stage was not owned by this request.");
      }
      return replaceRun({
        ...current,
        state: "WORDPRESS_DRAFT_CREATED",
        stateVersion: current.stateVersion + 1,
        wordpressAttemptId: input.result.attemptId ?? `memory-wp-attempt-${current.id}`,
        wordpressPostId: input.result.wordpressPostId,
        wordpressRequestCount: input.result.submitRequestCount
      });
    },

    async persistAcceptedEmail(input: {
      run: BoundedWorkflowRun;
      recipientEmail: string;
      result: BoundedOwnerEmailResult;
    }) {
      if (options.failEmailPersistenceAfterAcceptance) {
        throw new Error("Fake DB failure after email provider acceptance.");
      }
      const current = runs.get(input.run.id);
      if (!current || current.state !== "EMAIL_REQUEST_STARTED" || !input.result.providerMessageId) {
        throw new BoundedWorkflowError("state_conflict", "Email stage was not owned by this request.");
      }
      const emailLogId = randomUUID();
      emailLogs.push({
        id: emailLogId,
        workflowRunId: current.id,
        recipientEmail: input.recipientEmail,
        providerMessageId: input.result.providerMessageId
      });
      return replaceRun({
        ...current,
        state: "EMAIL_SENT",
        stateVersion: current.stateVersion + 1,
        emailLogId,
        emailProviderMessageId: input.result.providerMessageId,
        emailRequestCount: input.result.requestCount
      });
    }
  };

  return {
    store,
    runs,
    images,
    emailLogs,
    approveImage(workflowRunId) {
      const run = runs.get(workflowRunId);
      if (!run?.articleImageId) {
        throw new Error("Workflow image does not exist.");
      }
      const image = images.get(run.articleImageId)!;
      images.set(image.id, { ...image, status: "APPROVED" });
    },
    archiveContent(contentDraftId) {
      for (const [key, fixture] of fixtureByDraft.entries()) {
        if (fixture.contentDraftId === contentDraftId) {
          fixtureByDraft.set(key, { ...fixture, contentArchived: true });
        }
      }
    }
  };
}
