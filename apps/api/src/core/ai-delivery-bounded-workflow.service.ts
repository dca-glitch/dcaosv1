import { createHash } from "node:crypto";

export const BOUNDED_CONTENT_TO_DRAFT_WORKFLOW_TYPE = "CONTENT_TO_WORDPRESS_DRAFT";

export type BoundedWorkflowState =
  | "CONTENT_APPROVED"
  | "IMAGE_REQUEST_STARTED"
  | "IMAGE_PREVIEW_READY"
  | "WAITING_FOR_IMAGE_APPROVAL"
  | "IMAGE_APPROVED"
  | "WORDPRESS_REQUEST_STARTED"
  | "WORDPRESS_DRAFT_CREATED"
  | "EMAIL_REQUEST_STARTED"
  | "EMAIL_SENT"
  | "COMPLETED"
  | "FAILED_BEFORE_EXTERNAL_CALL"
  | "AMBIGUOUS_IMAGE"
  | "AMBIGUOUS_WORDPRESS"
  | "AMBIGUOUS_EMAIL"
  | "BLOCKED";

export type BoundedWorkflowRun = {
  id: string;
  tenantId: string;
  aiDeliveryProjectId: string;
  contentDraftId: string;
  publicationTargetId: string | null;
  articleImageId: string | null;
  wordpressAttemptId: string | null;
  emailLogId: string | null;
  initiatedByUserId: string | null;
  workflowType: string;
  state: BoundedWorkflowState;
  stateVersion: number;
  imageIdempotencyKey: string;
  storageIdempotencyKey: string;
  wordpressIdempotencyKey: string;
  emailIdempotencyKey: string;
  imageProviderRequestId: string | null;
  imageCorrelationId: string | null;
  storageKey: string | null;
  wordpressPostId: string | null;
  emailProviderMessageId: string | null;
  imageRequestCount: number;
  storageUploadCount: number;
  wordpressRequestCount: number;
  emailRequestCount: number;
  retryCount: number;
  fallbackUsed: boolean;
  safeError: string | null;
};

export type BoundedWorkflowStartContext = {
  tenantId: string;
  actorUserId: string;
  aiDeliveryProjectId: string;
  clientId: string;
  contentDraftId: string;
  contentTitle: string;
  contentBody: string;
  imagePrompt: string;
  contentApproved: boolean;
  contentArchived: boolean;
  projectArchived: boolean;
  publicationTargetId: string | null;
};

export type BoundedWorkflowContinuationContext = BoundedWorkflowStartContext & {
  run: BoundedWorkflowRun;
  articleImageId: string;
  articleImageStatus: string;
  articleImageArchived: boolean;
  publicationTarget: {
    id: string;
    tenantId: string;
    clientId: string;
    connectorType: string;
    siteUrl: string;
    wordpressUsername: string | null;
    isArchived: boolean;
  };
  ownerRecipient: {
    userId: string;
    email: string;
  };
};

export type BoundedImageGenerationResult = {
  status: "COMPLETED" | "FAILED" | "BLOCKED" | "SKIPPED";
  provider: string;
  model: string;
  correlationId: string;
  providerRequestId: string | null;
  submitRequestCount: number;
  retryCount: number;
  fallbackUsed: boolean;
  liveProviderCalled: boolean;
  outputCount: number;
  contentType: string | null;
  byteLength: number | null;
  width: number | null;
  height: number | null;
  sha256: string | null;
  imageBytes: Buffer | null;
  estimatedCostUsd: number | null;
  actualCostUsd: number | null;
  safeError: string | null;
};

export type BoundedStoredImage = {
  storageKey: string;
  sha256: string;
  byteLength: number;
  private: true;
  uploadCount: 1;
};

export type BoundedWordPressDraftResult = {
  ok: boolean;
  status: "wordpress_draft_created" | "blocked" | "failed" | "ambiguous" | "duplicate_blocked";
  attemptId: string | null;
  wordpressPostId: string | null;
  wordpressStatus: string | null;
  submitRequestCount: number;
  retryCount: number;
  fallbackUsed: boolean;
  mediaRequestCount: number;
  safeError: string | null;
};

export type BoundedOwnerEmailResult = {
  accepted: boolean;
  providerCalled: boolean;
  providerMessageId: string | null;
  requestCount: number;
  retryCount: number;
  safeError: string | null;
};

export interface BoundedWorkflowStore {
  resolveStartContext(input: {
    tenantId: string;
    contentDraftId: string;
    actorUserId: string;
  }): Promise<BoundedWorkflowStartContext | null>;
  getOrCreateRun(context: BoundedWorkflowStartContext): Promise<BoundedWorkflowRun>;
  getRun(tenantId: string, workflowRunId: string): Promise<BoundedWorkflowRun | null>;
  claimState(
    tenantId: string,
    workflowRunId: string,
    expectedState: BoundedWorkflowState,
    nextState: BoundedWorkflowState,
    patch?: Partial<BoundedWorkflowRun>
  ): Promise<BoundedWorkflowRun | null>;
  persistImagePreview(input: {
    run: BoundedWorkflowRun;
    context: BoundedWorkflowStartContext;
    generation: BoundedImageGenerationResult;
    stored: BoundedStoredImage;
  }): Promise<BoundedWorkflowRun>;
  resolveContinuationContext(
    tenantId: string,
    workflowRunId: string
  ): Promise<BoundedWorkflowContinuationContext | null>;
  persistWordPressDraft(input: {
    run: BoundedWorkflowRun;
    result: BoundedWordPressDraftResult;
  }): Promise<BoundedWorkflowRun>;
  persistAcceptedEmail(input: {
    run: BoundedWorkflowRun;
    recipientEmail: string;
    result: BoundedOwnerEmailResult;
  }): Promise<BoundedWorkflowRun>;
}

export interface BoundedWorkflowProviders {
  generateImage(input: {
    context: BoundedWorkflowStartContext;
    correlationId: string;
    idempotencyKey: string;
  }): Promise<BoundedImageGenerationResult>;
  storePrivateImage(input: {
    bytes: Buffer;
    contentType: string;
    deterministicStorageKey: string;
    expectedSha256: string;
    idempotencyKey: string;
  }): Promise<BoundedStoredImage>;
  createWordPressDraft(input: {
    context: BoundedWorkflowContinuationContext;
    idempotencyKey: string;
    marker: string;
  }): Promise<BoundedWordPressDraftResult>;
  sendOwnerEmail(input: {
    context: BoundedWorkflowContinuationContext;
    wordpressPostId: string;
    recipientEmail: string;
    idempotencyKey: string;
  }): Promise<BoundedOwnerEmailResult>;
}

export class BoundedWorkflowError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "BoundedWorkflowError";
  }
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/Basic\s+[A-Za-z0-9+/=]+/gi, "Basic [REDACTED]")
    .replace(/(password|secret|token|api[_-]?key)\s*[=:]\s*\S+/gi, "$1=[REDACTED]")
    .slice(0, 400);
}

function stableToken(...parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

export function buildBoundedWorkflowStageKey(
  stage: "image" | "storage" | "wordpress" | "email",
  tenantId: string,
  contentDraftId: string,
  workflowRunId: string
): string {
  return `bounded-${stage}-${stableToken(tenantId, contentDraftId, workflowRunId, stage)}`;
}

export function buildBoundedWorkflowStorageKey(run: BoundedWorkflowRun, contentType: string): string {
  const extension = contentType === "image/jpeg" ? "jpg" : contentType === "image/webp" ? "webp" : "png";
  return `tenants/${run.tenantId}/ai-delivery/${run.contentDraftId}/${run.id}/image-candidate.${extension}`;
}

async function markFailure(
  store: BoundedWorkflowStore,
  run: BoundedWorkflowRun,
  state: BoundedWorkflowState,
  error: unknown,
  patch: Partial<BoundedWorkflowRun> = {}
): Promise<BoundedWorkflowRun> {
  return (
    (await store.claimState(run.tenantId, run.id, run.state, state, {
      safeError: safeError(error),
      ...patch
    })) ?? run
  );
}

function assertStartContext(context: BoundedWorkflowStartContext | null): asserts context is BoundedWorkflowStartContext {
  if (!context) {
    throw new BoundedWorkflowError("not_found", "Approved content draft was not found in the active tenant.");
  }
  if (!context.contentApproved || context.contentArchived || context.projectArchived) {
    throw new BoundedWorkflowError("content_not_approved", "Content must remain approved and active.");
  }
}

function validGeneratedImage(result: BoundedImageGenerationResult): boolean {
  return (
    result.status === "COMPLETED" &&
    result.outputCount === 1 &&
    result.submitRequestCount === 1 &&
    result.retryCount === 0 &&
    result.fallbackUsed === false &&
    Buffer.isBuffer(result.imageBytes) &&
    result.imageBytes.length > 0 &&
    typeof result.contentType === "string" &&
    typeof result.width === "number" &&
    typeof result.height === "number" &&
    typeof result.byteLength === "number" &&
    typeof result.sha256 === "string"
  );
}

export async function startBoundedContentToDraftWorkflow(
  input: { tenantId: string; contentDraftId: string; actorUserId: string },
  dependencies: { store: BoundedWorkflowStore; providers: BoundedWorkflowProviders }
): Promise<BoundedWorkflowRun> {
  const context = await dependencies.store.resolveStartContext(input);
  assertStartContext(context);

  let run = await dependencies.store.getOrCreateRun(context);
  if (run.state === "IMAGE_PREVIEW_READY") {
    return (
      (await dependencies.store.claimState(
        run.tenantId,
        run.id,
        "IMAGE_PREVIEW_READY",
        "WAITING_FOR_IMAGE_APPROVAL"
      )) ?? run
    );
  }
  if (run.state !== "CONTENT_APPROVED") {
    return run;
  }

  const claimed = await dependencies.store.claimState(
    run.tenantId,
    run.id,
    "CONTENT_APPROVED",
    "IMAGE_REQUEST_STARTED",
    { imageRequestCount: 1, safeError: null }
  );
  if (!claimed) {
    return (await dependencies.store.getRun(run.tenantId, run.id)) ?? run;
  }
  run = claimed;

  let generation: BoundedImageGenerationResult;
  try {
    generation = await dependencies.providers.generateImage({
      context,
      correlationId: run.imageCorrelationId ?? run.imageIdempotencyKey,
      idempotencyKey: run.imageIdempotencyKey
    });
  } catch (error) {
    return markFailure(dependencies.store, run, "AMBIGUOUS_IMAGE", error);
  }

  if (!validGeneratedImage(generation)) {
    const ambiguous = generation.liveProviderCalled || generation.submitRequestCount > 0;
    return markFailure(
      dependencies.store,
      run,
      ambiguous ? "AMBIGUOUS_IMAGE" : "FAILED_BEFORE_EXTERNAL_CALL",
      generation.safeError ?? "Image generation did not produce one validated image.",
      {
        imageProviderRequestId: generation.providerRequestId,
        imageCorrelationId: generation.correlationId,
        retryCount: generation.retryCount,
        fallbackUsed: generation.fallbackUsed
      }
    );
  }

  let stored: BoundedStoredImage;
  try {
    stored = await dependencies.providers.storePrivateImage({
      bytes: generation.imageBytes!,
      contentType: generation.contentType!,
      deterministicStorageKey: buildBoundedWorkflowStorageKey(run, generation.contentType!),
      expectedSha256: generation.sha256!,
      idempotencyKey: run.storageIdempotencyKey
    });
  } catch (error) {
    return markFailure(dependencies.store, run, "AMBIGUOUS_IMAGE", error, {
      imageProviderRequestId: generation.providerRequestId,
      imageCorrelationId: generation.correlationId
    });
  }

  if (
    stored.private !== true ||
    stored.uploadCount !== 1 ||
    stored.sha256 !== generation.sha256 ||
    stored.byteLength !== generation.byteLength
  ) {
    return markFailure(dependencies.store, run, "AMBIGUOUS_IMAGE", "Private image verification failed.");
  }

  try {
    run = await dependencies.store.persistImagePreview({ run, context, generation, stored });
  } catch (error) {
    return markFailure(dependencies.store, run, "AMBIGUOUS_IMAGE", error);
  }
  return (
    (await dependencies.store.claimState(
      run.tenantId,
      run.id,
      "IMAGE_PREVIEW_READY",
      "WAITING_FOR_IMAGE_APPROVAL"
    )) ?? run
  );
}

function assertContinuationContext(
  context: BoundedWorkflowContinuationContext | null
): asserts context is BoundedWorkflowContinuationContext {
  if (!context) {
    throw new BoundedWorkflowError("not_found", "Bounded workflow was not found in the active tenant.");
  }
  if (!context.contentApproved || context.contentArchived || context.projectArchived) {
    throw new BoundedWorkflowError("content_not_approved", "Content must remain approved and active.");
  }
  if (context.articleImageArchived || context.articleImageStatus !== "APPROVED") {
    throw new BoundedWorkflowError("image_not_approved", "The workflow image must be approved and active.");
  }
  if (
    context.publicationTarget.tenantId !== context.tenantId ||
    context.publicationTarget.clientId !== context.clientId ||
    context.publicationTarget.connectorType !== "WORDPRESS" ||
    context.publicationTarget.isArchived
  ) {
    throw new BoundedWorkflowError("publication_target_mismatch", "Publication target does not match the workflow client.");
  }
  if (context.ownerRecipient.userId !== context.actorUserId) {
    throw new BoundedWorkflowError("owner_recipient_mismatch", "Workflow recipient must be the initiating owner/admin.");
  }
}

export async function continueBoundedContentToDraftWorkflowAfterImageApproval(
  input: { tenantId: string; workflowRunId: string },
  dependencies: { store: BoundedWorkflowStore; providers: BoundedWorkflowProviders }
): Promise<BoundedWorkflowRun> {
  let run = await dependencies.store.getRun(input.tenantId, input.workflowRunId);
  if (!run) {
    throw new BoundedWorkflowError("not_found", "Bounded workflow was not found in the active tenant.");
  }
  if (
    run.state === "COMPLETED" ||
    run.state.startsWith("AMBIGUOUS_") ||
    run.state === "BLOCKED" ||
    run.state === "FAILED_BEFORE_EXTERNAL_CALL"
  ) {
    return run;
  }
  if (run.state === "IMAGE_PREVIEW_READY") {
    run =
      (await dependencies.store.claimState(
        run.tenantId,
        run.id,
        "IMAGE_PREVIEW_READY",
        "WAITING_FOR_IMAGE_APPROVAL"
      )) ?? run;
  }

  const context = await dependencies.store.resolveContinuationContext(input.tenantId, input.workflowRunId);
  assertContinuationContext(context);

  if (run.state === "WAITING_FOR_IMAGE_APPROVAL") {
    run =
      (await dependencies.store.claimState(
        run.tenantId,
        run.id,
        "WAITING_FOR_IMAGE_APPROVAL",
        "IMAGE_APPROVED",
        { safeError: null }
      )) ?? run;
  }
  if (run.state === "IMAGE_APPROVED") {
    const claimed = await dependencies.store.claimState(
      run.tenantId,
      run.id,
      "IMAGE_APPROVED",
      "WORDPRESS_REQUEST_STARTED",
      { wordpressRequestCount: 1 }
    );
    if (!claimed) {
      return (await dependencies.store.getRun(run.tenantId, run.id)) ?? run;
    }
    run = claimed;

    let wordpress: BoundedWordPressDraftResult;
    try {
      wordpress = await dependencies.providers.createWordPressDraft({
        context,
        idempotencyKey: run.wordpressIdempotencyKey,
        marker: `[DCA-BOUNDED-WORKFLOW:${run.id}]`
      });
    } catch (error) {
      return markFailure(dependencies.store, run, "AMBIGUOUS_WORDPRESS", error);
    }
    if (
      !wordpress.ok ||
      wordpress.status !== "wordpress_draft_created" ||
      wordpress.wordpressStatus !== "draft" ||
      !wordpress.wordpressPostId ||
      wordpress.submitRequestCount !== 1 ||
      wordpress.retryCount !== 0 ||
      wordpress.fallbackUsed ||
      wordpress.mediaRequestCount !== 0
    ) {
      const ambiguous = wordpress.status === "ambiguous" || wordpress.submitRequestCount > 0;
      return markFailure(
        dependencies.store,
        run,
        ambiguous ? "AMBIGUOUS_WORDPRESS" : "BLOCKED",
        wordpress.safeError ?? "WordPress draft creation failed."
      );
    }
    try {
      run = await dependencies.store.persistWordPressDraft({ run, result: wordpress });
    } catch (error) {
      return markFailure(dependencies.store, run, "AMBIGUOUS_WORDPRESS", error);
    }
  }

  if (run.state === "WORDPRESS_DRAFT_CREATED") {
    const claimed = await dependencies.store.claimState(
      run.tenantId,
      run.id,
      "WORDPRESS_DRAFT_CREATED",
      "EMAIL_REQUEST_STARTED",
      { emailRequestCount: 1 }
    );
    if (!claimed) {
      return (await dependencies.store.getRun(run.tenantId, run.id)) ?? run;
    }
    run = claimed;

    let email: BoundedOwnerEmailResult;
    try {
      email = await dependencies.providers.sendOwnerEmail({
        context,
        wordpressPostId: run.wordpressPostId!,
        recipientEmail: context.ownerRecipient.email,
        idempotencyKey: run.emailIdempotencyKey
      });
    } catch (error) {
      return markFailure(dependencies.store, run, "AMBIGUOUS_EMAIL", error);
    }
    if (
      !email.accepted ||
      !email.providerMessageId ||
      email.requestCount !== 1 ||
      email.retryCount !== 0
    ) {
      return markFailure(
        dependencies.store,
        run,
        email.providerCalled ? "BLOCKED" : "FAILED_BEFORE_EXTERNAL_CALL",
        email.safeError ?? "Owner email was not accepted."
      );
    }
    try {
      run = await dependencies.store.persistAcceptedEmail({
        run,
        recipientEmail: context.ownerRecipient.email,
        result: email
      });
    } catch (error) {
      return markFailure(dependencies.store, run, "AMBIGUOUS_EMAIL", error);
    }
  }

  if (run.state === "EMAIL_SENT") {
    run =
      (await dependencies.store.claimState(run.tenantId, run.id, "EMAIL_SENT", "COMPLETED", {
        safeError: null
      })) ?? run;
  }
  return run;
}
