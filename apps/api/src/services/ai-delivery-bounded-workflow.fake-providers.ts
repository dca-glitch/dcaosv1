import { createHash } from "node:crypto";
import { generateOneImageViaAiPolicy } from "../core/image-generation-ai-policy.service";
import type {
  BoundedWorkflowProviders,
  BoundedWordPressDraftResult
} from "../core/ai-delivery-bounded-workflow.service";
import { createFakeOpenAITransport, type CreateFakeOpenAITransportOptions } from "./openai-image.fake-transport";
import { createMemoryWordPressDraftLiveAttemptStore } from "./wordpress-live-draft-attempt.store";
import { createWordPressDraft } from "./wordpress-live-draft.adapter";
import { createFakeWordPressTransport } from "./wordpress-live-draft.fake-transport";

export type BoundedFakeProviderStats = {
  imageRequests: number;
  storageUploads: number;
  wordpressCreates: number;
  emailSends: number;
  storageKeys: string[];
  emailRecipients: string[];
};

export type BoundedFakeProviderOptions = {
  image?: CreateFakeOpenAITransportOptions;
  failStorage?: boolean;
  corruptStorageChecksum?: boolean;
  ambiguousWordPress?: boolean;
  rejectEmail?: boolean;
  ambiguousEmail?: boolean;
};

export function createBoundedFakeWorkflowProviders(options: BoundedFakeProviderOptions = {}): {
  providers: BoundedWorkflowProviders;
  stats: BoundedFakeProviderStats;
} {
  const image = createFakeOpenAITransport(options.image);
  const wordpress = createFakeWordPressTransport({
    ambiguousCreate: options.ambiguousWordPress
  });
  const wordpressAttempts = createMemoryWordPressDraftLiveAttemptStore();
  const stored = new Map<string, { sha256: string; byteLength: number }>();
  const sentEmails = new Map<string, string>();
  const stats: BoundedFakeProviderStats = {
    imageRequests: 0,
    storageUploads: 0,
    wordpressCreates: 0,
    emailSends: 0,
    storageKeys: [],
    emailRecipients: []
  };

  return {
    stats,
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
          adapterOptions: {
            fetchImpl: image.fetchImpl,
            apiKeyForTests: "fake-local-image-key"
          },
          authorizeForFakeTransport: true
        });
        stats.imageRequests = image.stats.submitCount;
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
        if (options.failStorage) {
          throw new Error("Fake private storage failed after generation.");
        }
        const checksum = createHash("sha256").update(input.bytes).digest("hex");
        if (checksum !== input.expectedSha256) {
          throw new Error("Fake private storage rejected checksum mismatch.");
        }
        const existing = stored.get(input.deterministicStorageKey);
        if (existing) {
          if (existing.sha256 !== checksum || existing.byteLength !== input.bytes.length) {
            throw new Error("Deterministic private storage key contains different bytes.");
          }
          return {
            storageKey: input.deterministicStorageKey,
            sha256: options.corruptStorageChecksum ? "corrupt" : checksum,
            byteLength: input.bytes.length,
            private: true,
            uploadCount: 1
          };
        }
        stored.set(input.deterministicStorageKey, {
          sha256: checksum,
          byteLength: input.bytes.length
        });
        stats.storageUploads += 1;
        stats.storageKeys.push(input.deterministicStorageKey);
        return {
          storageKey: input.deterministicStorageKey,
          sha256: options.corruptStorageChecksum ? "corrupt" : checksum,
          byteLength: input.bytes.length,
          private: true,
          uploadCount: 1
        };
      },

      async createWordPressDraft(input): Promise<BoundedWordPressDraftResult> {
        const result = await createWordPressDraft(
          {
            tenantId: input.context.tenantId,
            publicationTargetId: input.context.publicationTarget.id,
            siteUrl: input.context.publicationTarget.siteUrl,
            username: input.context.publicationTarget.wordpressUsername ?? "bounded-fake-author",
            applicationPassword: "fake-local-application-password",
            title: input.context.contentTitle,
            content: input.context.contentBody,
            marker: input.marker,
            idempotencyKey: input.idempotencyKey
          },
          {
            fetchImpl: wordpress.fetchImpl,
            attemptStore: wordpressAttempts,
            bypassLiveAuthorizationForFakeTransport: true
          }
        );
        stats.wordpressCreates = wordpress.stats.createCount;
        return {
          ok: result.ok,
          status: result.status,
          attemptId: result.ok ? `fake-wp-attempt-${input.context.run.id}` : null,
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
        if (options.ambiguousEmail) {
          stats.emailSends += 1;
          throw new Error("Fake email acceptance was ambiguous.");
        }
        if (options.rejectEmail) {
          stats.emailSends += 1;
          return {
            accepted: false,
            providerCalled: true,
            providerMessageId: null,
            requestCount: 1,
            retryCount: 0,
            safeError: "Fake email provider rejected before acceptance."
          };
        }
        const existing = sentEmails.get(input.idempotencyKey);
        if (existing) {
          return {
            accepted: true,
            providerCalled: false,
            providerMessageId: existing,
            requestCount: 1,
            retryCount: 0,
            safeError: null
          };
        }
        const providerMessageId = `fake-email-${input.context.run.id}`;
        sentEmails.set(input.idempotencyKey, providerMessageId);
        stats.emailSends += 1;
        stats.emailRecipients.push(input.recipientEmail);
        return {
          accepted: true,
          providerCalled: true,
          providerMessageId,
          requestCount: 1,
          retryCount: 0,
          safeError: null
        };
      }
    }
  };
}
