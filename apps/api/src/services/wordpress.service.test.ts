import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertWordPressDraftStatusFrozen,
  buildAiDeliveryWordPressDraftPayload,
  buildWordPressCredentialPolicyMetadata,
  buildWordPressCredentialPolicyShape,
  isWordPressDraftStatusFrozen,
  publishAiDeliveryDeliverableToWordPress,
  resolveWordPressDraftPostStatus,
  WORDPRESS_DRAFT_POST_STATUS,
  WORDPRESS_LIVE_HTTP_FROZEN_REASON,
  WORDPRESS_TEST_DRAFT_PROOF_MARKER,
  WORDPRESS_TEST_DRAFT_PROOF_TAG,
  WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN
} from "./wordpress.service";

const originalPublishEnabled = process.env.WORDPRESS_PUBLISH_ENABLED;
const originalFetch = globalThis.fetch;
const serviceSourcePath = join(dirname(fileURLToPath(import.meta.url)), "wordpress.service.ts");

afterEach(() => {
  if (originalPublishEnabled === undefined) {
    delete process.env.WORDPRESS_PUBLISH_ENABLED;
  } else {
    process.env.WORDPRESS_PUBLISH_ENABLED = originalPublishEnabled;
  }

  globalThis.fetch = originalFetch;
});

describe("wordpress.service", () => {
  describe("G181 draft payload builder hardening", () => {
    it("builds local draft payloads with title, slug, excerpt, body/content, taxonomy, featured placeholder, draft status, and source deliverable id", () => {
      const payload = buildAiDeliveryWordPressDraftPayload({
        title: "  Puriva SEO Article: Recovery & Wellness  ",
        body: "  Draft body for admin review.  ",
        excerpt: "  Short summary.  ",
        sourceType: "DELIVERABLE",
        sourceId: "deliverable-42",
        deliverableId: "deliverable-42",
        categories: ["Wellness", " Recovery ", "Wellness"],
        tags: ["puriva", "seo"],
        featuredImagePlaceholder: "assets/hero-placeholder.png",
        publicationTargetId: "target-1",
        publicationTargetLabel: "Puriva staging",
        publicationSiteUrl: "https://staging.example.test",
        publishGateStatus: "disabled",
        credentialConfigured: false
      });

      assert.equal(payload.status, "PREPARED");
      assert.equal(payload.postStatus, "draft");
      assert.equal(payload.postStatus, WORDPRESS_DRAFT_POST_STATUS);
      assert.equal(payload.externalPostId, null);
      assert.equal(payload.externalEditUrl, null);
      assert.equal(payload.title, "Puriva SEO Article: Recovery & Wellness");
      assert.equal(payload.body, "Draft body for admin review.");
      assert.equal(payload.content, "Draft body for admin review.");
      assert.equal(payload.excerpt, "Short summary.");
      assert.equal(payload.slug, "puriva-seo-article-recovery-wellness");
      assert.equal(payload.sourceId, "deliverable-42");
      assert.equal(payload.deliverableId, "deliverable-42");
      assert.deepEqual(payload.categories, ["Wellness", "Recovery"]);
      assert.deepEqual(payload.tags, ["puriva", "seo"]);
      assert.equal(payload.featuredImagePlaceholder, "assets/hero-placeholder.png");
      assert.match(payload.note, /Local WordPress draft payload only/);

      const serialized = JSON.stringify(payload);
      assert.equal(serialized.includes('"publish"'), false);
      assert.equal(serialized.includes('"future"'), false);
      assert.equal(serialized.includes('"pending"'), false);
      assert.notEqual(String(payload.postStatus), "publish");
    });

    it("maps accepted image candidates into featured placeholder via inclusion contract", () => {
      const payload = buildAiDeliveryWordPressDraftPayload({
        title: "Image mapped draft",
        body: "Body",
        sourceType: "CONTENT_DRAFT",
        sourceId: "content-draft-1",
        imageCandidates: [
          { slot: "hero", acceptance: "accepted", reference: "hero-ref" },
          { slot: "supporting_1", acceptance: "accepted", reference: "s1-ref" },
          { slot: "social_preview", acceptance: "accepted", reference: "og-ref" }
        ],
        publishGateStatus: "disabled",
        credentialConfigured: false
      });

      assert.equal(payload.featuredImagePlaceholder, "hero-ref");
      assert.equal(payload.imageInclusion.featuredImagePlaceholder, "hero-ref");
      assert.deepEqual(payload.imageInclusion.supportingImagePlaceholders, ["s1-ref"]);
      assert.equal(payload.imageInclusion.socialPreviewPlaceholder, "og-ref");
      assert.equal(payload.deliverableId, null);
    });
  });

  describe("G183 draft status freeze guard", () => {
    it("resolves only draft status and rejects publish status drift", () => {
      assert.equal(resolveWordPressDraftPostStatus(), "draft");
      assert.equal(isWordPressDraftStatusFrozen(), true);
      assert.doesNotThrow(() => assertWordPressDraftStatusFrozen({ postStatus: "draft" }));
      assert.throws(
        () => assertWordPressDraftStatusFrozen({ postStatus: "publish" }),
        /status freeze violated/
      );
    });

    it("ensures no local draft-prep helper assigns publish status in source", () => {
      const source = readFileSync(serviceSourcePath, "utf8");
      const builderStart = source.indexOf("export function buildAiDeliveryWordPressDraftPayload");
      const builderEnd = source.indexOf("export function isAiDeliveryWordPressPublishFrozen");
      assert.ok(builderStart >= 0 && builderEnd > builderStart);
      const builderBody = source.slice(builderStart, builderEnd);
      assert.equal(builderBody.includes('postStatus: "publish"'), false);
      assert.equal(builderBody.includes('postStatus: "pending"'), false);
      assert.equal(builderBody.includes('postStatus: "future"'), false);
      assert.match(builderBody, /resolveWordPressDraftPostStatus\(\)/);
    });
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
    assert.ok(WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.steps.includes("create_draft"));
    assert.ok(WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.steps.includes("delete_or_trash_draft"));
    assert.ok(WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN.steps.includes("no_publish"));
  });
});
