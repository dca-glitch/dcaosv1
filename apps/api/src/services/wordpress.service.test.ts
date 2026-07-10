import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  buildAiDeliveryWordPressDraftPayload,
  buildWordPressCredentialPolicyMetadata,
  buildWordPressCredentialPolicyShape,
  publishAiDeliveryDeliverableToWordPress,
  WORDPRESS_LIVE_HTTP_FROZEN_REASON,
  WORDPRESS_TEST_DRAFT_PROOF_MARKER,
  WORDPRESS_TEST_DRAFT_PROOF_TAG,
  WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN
} from "./wordpress.service";

const originalPublishEnabled = process.env.WORDPRESS_PUBLISH_ENABLED;
const originalFetch = globalThis.fetch;

afterEach(() => {
  if (originalPublishEnabled === undefined) {
    delete process.env.WORDPRESS_PUBLISH_ENABLED;
  } else {
    process.env.WORDPRESS_PUBLISH_ENABLED = originalPublishEnabled;
  }

  globalThis.fetch = originalFetch;
});

describe("wordpress.service", () => {
  it("builds local draft payloads with draft status only", () => {
    const payload = buildAiDeliveryWordPressDraftPayload({
      title: "  Puriva SEO Article: Recovery & Wellness  ",
      body: "  Draft body for admin review.  ",
      excerpt: "  Short summary.  ",
      sourceType: "CONTENT_DRAFT",
      sourceId: "content-draft-1",
      publicationTargetId: "target-1",
      publicationTargetLabel: "Puriva staging",
      publicationSiteUrl: "https://staging.example.test",
      publishGateStatus: "disabled",
      credentialConfigured: false
    });

    assert.equal(payload.status, "PREPARED");
    assert.equal(payload.postStatus, "draft");
    assert.equal(payload.externalPostId, null);
    assert.equal(payload.externalEditUrl, null);
    assert.equal(payload.title, "Puriva SEO Article: Recovery & Wellness");
    assert.equal(payload.body, "Draft body for admin review.");
    assert.equal(payload.excerpt, "Short summary.");
    assert.equal(payload.slug, "puriva-seo-article-recovery-wellness");
    assert.match(payload.note, /Local WordPress draft payload only/);
    assert.equal(JSON.stringify(payload).includes("publish\""), false);
    assert.equal(JSON.stringify(payload).includes("future\""), false);
    assert.equal(JSON.stringify(payload).includes("pending\""), false);
  });

  it("keeps publish frozen before any live WordPress HTTP can run", async () => {
    process.env.WORDPRESS_PUBLISH_ENABLED = "true";
    let fetchCalled = false;
    globalThis.fetch = (async () => {
      fetchCalled = true;
      throw new Error("fetch must not be called while WordPress publish is frozen");
    }) as typeof fetch;

    const result = await publishAiDeliveryDeliverableToWordPress(
      {
        deliverableId: "deliverable-1",
        title: "Draft only",
        body: "Body",
        status: "publish"
      },
      {
        siteConfig: {
          siteUrl: "https://staging.example.test",
          siteSlug: "staging",
          wordPressComSite: false
        },
        applicationPassword: "raw-application-password"
      }
    );

    assert.equal(fetchCalled, false);
    assert.equal(result.ok, false);
    assert.equal(result.status, "provider_disabled");
    assert.equal(result.wordpressPostId, null);
    assert.equal(result.providerDisabledReason, WORDPRESS_LIVE_HTTP_FROZEN_REASON);
  });

  it("serializes credential policy shape without raw credential fields", () => {
    const rawCredential = "wp-app-password-plain";
    const shape = buildWordPressCredentialPolicyShape({
      configured: true,
      encryptionAvailable: true,
      updatedAt: new Date("2026-07-10T00:00:00.000Z"),
      applicationPassword: rawCredential,
      ciphertext: "ciphertext-blob"
    } as {
      configured: boolean;
      encryptionAvailable: boolean;
      updatedAt: Date;
      applicationPassword: string;
      ciphertext: string;
    });

    const serialized = JSON.stringify(shape);
    assert.deepEqual(shape, {
      configured: true,
      encryptionAvailable: true,
      updatedAt: "2026-07-10T00:00:00.000Z"
    });
    assert.equal(serialized.includes(rawCredential), false);
    assert.equal(serialized.includes("applicationPassword"), false);
    assert.equal(serialized.includes("ciphertext"), false);
  });

  it("serializes credential audit metadata as presence and host only", () => {
    const metadata = buildWordPressCredentialPolicyMetadata({
      credentialsPresent: true,
      siteUrl: "https://example.test/client-blog/path?token=do-not-serialize"
    });

    const serialized = JSON.stringify(metadata);
    assert.deepEqual(metadata, {
      credentialsPresent: true,
      siteUrlHost: "example.test"
    });
    assert.equal(serialized.includes("do-not-serialize"), false);
    assert.equal(serialized.includes("client-blog"), false);
    assert.equal(serialized.includes("token"), false);
  });

  it("keeps rollback/delete-test-draft plan constants staging-safe", () => {
    assert.equal(WORDPRESS_TEST_DRAFT_PROOF_MARKER, "[DCA-OS-PROOF-DO-NOT-PUBLISH]");
    assert.equal(WORDPRESS_TEST_DRAFT_PROOF_TAG, "dca-proof");
    assert.equal(WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.allowedStatus, "draft");
    assert.equal(WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.restorePublishEnv, "WORDPRESS_PUBLISH_ENABLED=false");
    assert.ok(WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.evidenceRequired.includes("cleanupActionAndTimestamp"));
  });
});
