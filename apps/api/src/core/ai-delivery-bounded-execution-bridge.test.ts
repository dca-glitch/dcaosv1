import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BOUNDED_PROOF_MANIFEST_VERSION,
  parseBoundedProofManifest,
  withBoundedProofOwnerRecipientOverride
} from "./ai-delivery-bounded-execution-bridge";
import { WORDPRESS_LIVE_HTTP_FROZEN } from "../services/wordpress.service";
import type { BoundedWorkflowStore } from "./ai-delivery-bounded-workflow.service";

function manifest() {
  return {
    schemaVersion: BOUNDED_PROOF_MANIFEST_VERSION,
    proofCorrelationId: "11111111-1111-4111-8111-111111111111",
    tenantId: "22222222-2222-4222-8222-222222222222",
    clientId: "33333333-3333-4333-8333-333333333333",
    projectId: "44444444-4444-4444-8444-444444444444",
    contentDraftId: "55555555-5555-4555-8555-555555555555",
    publicationTargetId: "66666666-6666-4666-8666-666666666666",
    initiatingUserId: "77777777-7777-4777-8777-777777777777",
    workflowRunId: null,
    articleImageId: null,
    wordpressAttemptId: null,
    emailLogId: null,
    wordpressPostId: null,
    storageKey: null,
    wordpressIdempotencyKey: null
  };
}

describe("bounded execution proof manifest", () => {
  it("accepts an IDs-only unstarted manifest", () => {
    assert.deepEqual(parseBoundedProofManifest(manifest()), manifest());
    assert.equal(WORDPRESS_LIVE_HTTP_FROZEN, true);
  });

  it("refuses malformed, missing, or expanded manifests", () => {
    assert.throws(() => parseBoundedProofManifest(null), /JSON object/);
    assert.throws(
      () => parseBoundedProofManifest({ ...manifest(), workflowRunId: undefined }),
      /workflowRunId/
    );
    assert.throws(
      () => parseBoundedProofManifest({ ...manifest(), deleteAll: true }),
      /unsupported fields/
    );
  });

  it("refuses broad cleanup keys and non-exact post IDs", () => {
    assert.throws(
      () =>
        parseBoundedProofManifest({
          ...manifest(),
          storageKey: "tenants/*"
        }),
      /storageKey/
    );
    assert.throws(
      () =>
        parseBoundedProofManifest({
          ...manifest(),
          wordpressPostId: "all"
        }),
      /numeric/
    );
  });

  it("requires storage keys to match the exact tenant and draft", () => {
    assert.throws(
      () =>
        parseBoundedProofManifest({
          ...manifest(),
          storageKey:
            "tenants/99999999-9999-4999-8999-999999999999/ai-delivery/55555555-5555-4555-8555-555555555555/run/image.png"
        }),
      /exact bounded workflow object key/
    );
  });
});

describe("bounded proof owner recipient override isolation", () => {
  it("overrides only ownerRecipient.email and keeps userId", async () => {
    const base = {
      resolveStartContext: async () => null,
      getOrCreateRun: async () => {
        throw new Error("unused");
      },
      getRun: async () => null,
      claimState: async () => null,
      persistImagePreview: async () => {
        throw new Error("unused");
      },
      resolveContinuationContext: async () => ({
        tenantId: "22222222-2222-4222-8222-222222222222",
        clientId: "33333333-3333-4333-8333-333333333333",
        aiDeliveryProjectId: "44444444-4444-4444-8444-444444444444",
        contentDraftId: "55555555-5555-4555-8555-555555555555",
        contentTitle: "t",
        contentApproved: true,
        contentArchived: false,
        projectArchived: false,
        actorUserId: "77777777-7777-4777-8777-777777777777",
        articleImageId: "88888888-8888-4888-8888-888888888888",
        articleImageStatus: "APPROVED",
        articleImageArchived: false,
        publicationTarget: {
          id: "66666666-6666-4666-8666-666666666666",
          tenantId: "22222222-2222-4222-8222-222222222222",
          clientId: "33333333-3333-4333-8333-333333333333",
          connectorType: "WORDPRESS",
          isArchived: false
        },
        ownerRecipient: {
          userId: "77777777-7777-4777-8777-777777777777",
          email: "admin@dca.local"
        },
        imagePrompt: "p"
      }),
      persistWordPressDraft: async () => {
        throw new Error("unused");
      },
      persistAcceptedEmail: async () => {
        throw new Error("unused");
      }
    } as unknown as BoundedWorkflowStore;

    const wrapped = withBoundedProofOwnerRecipientOverride(
      base,
      "owner.proof@gmail.com"
    );
    const context = await wrapped.resolveContinuationContext("t", "r");
    assert.equal(context?.ownerRecipient.userId, "77777777-7777-4777-8777-777777777777");
    assert.equal(context?.ownerRecipient.email, "owner.proof@gmail.com");
    const untouched = await base.resolveContinuationContext("t", "r");
    assert.equal(untouched?.ownerRecipient.email, "admin@dca.local");
  });

  it("refuses invalid override emails before wrapping", () => {
    const base = {
      resolveContinuationContext: async () => null
    } as unknown as BoundedWorkflowStore;
    assert.throws(
      () => withBoundedProofOwnerRecipientOverride(base, "admin@dca.local"),
      /\.local|localhost/
    );
  });
});
