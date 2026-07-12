import { createHash } from "node:crypto";
import type { createPrismaClient } from "../../../../packages/data/src/client";
import {
  generateOneImageViaAiPolicy
} from "../core/image-generation-ai-policy.service";
import type {
  BoundedWorkflowProviders,
  BoundedWordPressDraftResult
} from "../core/ai-delivery-bounded-workflow.service";
import {
  deletePrivateStorageObject,
  putPrivateStorageObjectAtExactKey
} from "../storage/private-storage.service";
import { decryptCredentialPlaintext } from "./credential-encryption.service";
import { deliverEmailNotification } from "./email-notifications.service";
import {
  createWordPressDraft,
  trashWordPressDraftByExactId
} from "./wordpress-live-draft.adapter";
import {
  createPrismaWordPressDraftLiveAttemptStore
} from "./wordpress-live-draft-attempt.store";

type PrismaClientLike = ReturnType<typeof createPrismaClient>;

export type BoundedProofCleanupProviders = {
  deletePrivateImage(input: { storageKey: string }): Promise<{ ok: boolean }>;
  trashWordPressDraft(input: {
    tenantId: string;
    publicationTargetId: string;
    wordpressPostId: string;
    wordpressIdempotencyKey: string;
  }): Promise<{ ok: boolean }>;
};

export type BoundedLiveProviderOptions = {
  openAiFetchImpl?: typeof fetch;
  wordpressFetchImpl?: typeof fetch;
  emailFetchImpl?: typeof fetch;
  env?: NodeJS.ProcessEnv;
};

async function resolveWordPressTargetAndPassword(
  prisma: PrismaClientLike,
  tenantId: string,
  publicationTargetId: string
) {
  const target = await prisma.publicationTarget.findFirst({
    where: {
      id: publicationTargetId,
      tenantId,
      connectorType: "WORDPRESS",
      isArchived: false
    },
    select: {
      id: true,
      tenantId: true,
      siteUrl: true,
      wordpressUsername: true,
      credentials: {
        select: { ciphertext: true, iv: true, authTag: true }
      }
    }
  });
  const password =
    target?.credentials &&
    decryptCredentialPlaintext(
      target.credentials.ciphertext,
      target.credentials.iv,
      target.credentials.authTag,
      tenantId
    );
  if (!target?.wordpressUsername?.trim() || !password) {
    throw new Error("Exact WordPress target credentials are unavailable.");
  }
  return {
    ...target,
    wordpressUsername: target.wordpressUsername.trim(),
    applicationPassword: password
  };
}

export function createBoundedLiveWorkflowProviders(
  prisma: PrismaClientLike,
  options: BoundedLiveProviderOptions = {}
): {
  providers: BoundedWorkflowProviders;
  cleanupProviders: BoundedProofCleanupProviders;
} {
  const attemptStore = createPrismaWordPressDraftLiveAttemptStore(prisma);
  const env = options.env ?? process.env;

  return {
    providers: {
      async generateImage(input) {
        const generated = await generateOneImageViaAiPolicy({
          request: {
            prompt: input.context.imagePrompt,
            width: 1024,
            height: 1024,
            outputFormat: "png",
            correlationId: input.correlationId,
            safeMetadata: {
              workflow: "bounded_content_to_draft",
              contentDraftId: input.context.contentDraftId
            }
          },
          adapterOptions: options.openAiFetchImpl
            ? { fetchImpl: options.openAiFetchImpl }
            : undefined
        });
        const result = generated.result;
        return {
          status: result.status,
          provider: result.provider,
          model: result.model,
          correlationId: result.correlationId,
          providerRequestId: result.providerRequestId,
          submitRequestCount: result.submitRequestCount,
          retryCount: result.retryCount,
          fallbackUsed: result.fallbackUsed,
          liveProviderCalled: result.liveProviderCalled,
          outputCount: result.outputCount,
          contentType: result.contentType,
          byteLength: result.byteLength,
          width: result.width,
          height: result.height,
          sha256: result.sha256,
          imageBytes: result.imageBytes,
          estimatedCostUsd: result.estimatedCostUsd,
          actualCostUsd: result.actualCostUsd,
          safeError: result.safeError
        };
      },

      async storePrivateImage(input) {
        const checksum = createHash("sha256").update(input.bytes).digest("hex");
        if (checksum !== input.expectedSha256) {
          throw new Error("Private R2 upload refused a checksum mismatch.");
        }
        const uploaded = await putPrivateStorageObjectAtExactKey({
          body: input.bytes,
          mimeType: input.contentType,
          storageKey: input.deterministicStorageKey
        });
        if (!uploaded || uploaded.storageKey !== input.deterministicStorageKey) {
          throw new Error("Private R2 exact-key upload did not return the expected key.");
        }
        return {
          storageKey: uploaded.storageKey,
          sha256: checksum,
          byteLength: input.bytes.length,
          private: true,
          uploadCount: 1
        };
      },

      async createWordPressDraft(input): Promise<BoundedWordPressDraftResult> {
        const target = await resolveWordPressTargetAndPassword(
          prisma,
          input.context.tenantId,
          input.context.publicationTarget.id
        );
        const result = await createWordPressDraft(
          {
            tenantId: input.context.tenantId,
            publicationTargetId: target.id,
            siteUrl: target.siteUrl,
            username: target.wordpressUsername,
            applicationPassword: target.applicationPassword,
            title: input.context.contentTitle,
            content: input.context.contentBody,
            marker: input.marker,
            idempotencyKey: input.idempotencyKey
          },
          {
            attemptStore,
            fetchImpl: options.wordpressFetchImpl,
            env
          }
        );
        return {
          ok: result.ok,
          status: result.status,
          attemptId: null,
          wordpressPostId: result.wordpressPostId,
          wordpressStatus: result.wordpressStatus,
          submitRequestCount: result.submitRequestCount,
          retryCount: result.retryCount,
          fallbackUsed: result.fallbackUsed,
          mediaRequestCount: result.mediaRequestCount,
          safeError: result.safeError
        };
      },

      async sendOwnerEmail(input) {
        const delivery = await deliverEmailNotification(
          {
            tenantId: input.context.tenantId,
            recipientEmail: input.recipientEmail,
            subject: "WordPress draft created and ready for admin review",
            templateKey: "AI_DELIVERY_REVIEW_REQUEST",
            relatedModule: "ai-delivery-bounded-workflow",
            relatedEntityId: input.context.run.id,
            textBody: `WordPress draft ${input.wordpressPostId} is ready for admin review.`
          },
          { fetchImpl: options.emailFetchImpl }
        );
        if (
          delivery.providerCalled &&
          (delivery.status !== "SENT" || !delivery.providerMessageId)
        ) {
          throw new Error("Email provider result is ambiguous after request start.");
        }
        return {
          accepted: delivery.status === "SENT" && Boolean(delivery.providerMessageId),
          providerCalled: delivery.providerCalled,
          providerMessageId: delivery.providerMessageId,
          requestCount: delivery.providerCalled ? 1 : 0,
          retryCount: 0,
          safeError: delivery.errorMessage
        };
      }
    },

    cleanupProviders: {
      async deletePrivateImage(input) {
        const result = await deletePrivateStorageObject(input.storageKey);
        return { ok: result.ok };
      },

      async trashWordPressDraft(input) {
        const target = await resolveWordPressTargetAndPassword(
          prisma,
          input.tenantId,
          input.publicationTargetId
        );
        const result = await trashWordPressDraftByExactId(
          {
            tenantId: input.tenantId,
            siteUrl: target.siteUrl,
            username: target.wordpressUsername,
            applicationPassword: target.applicationPassword,
            wordpressPostId: input.wordpressPostId,
            idempotencyKey: input.wordpressIdempotencyKey
          },
          {
            attemptStore,
            fetchImpl: options.wordpressFetchImpl,
            env
          }
        );
        return { ok: result.ok };
      }
    }
  };
}
