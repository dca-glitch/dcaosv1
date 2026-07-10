import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertWordPressDraftProofPlanInvariants,
  assertWordPressDraftStatusFrozen,
  buildAiDeliveryWordPressDraftPayload,
  buildWordPressCredentialPolicyMetadata,
  buildWordPressCredentialPolicyShape,
  isAiDeliveryWordPressPublishFrozen,
  isWordPressDraftStatusFrozen,
  publishAiDeliveryDeliverableToWordPress,
  resolveWordPressDraftPostStatus,
  WORDPRESS_AUTHOR_TENANT_MAPPING_DESIGN,
  WORDPRESS_DRAFT_POST_STATUS,
  WORDPRESS_LIVE_HTTP_FROZEN,
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
  describe("G290 / G541 draft payload snapshot", () => {
    it("builds a stable local draft payload snapshot (draft-only, no live ids)", () => {
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
      assert.match(payload.note, /placeholders only|No category\/tag placeholders/i);
      assert.match(payload.note, /Design-only/);

      const snapshot = {
        status: payload.status,
        postStatus: payload.postStatus,
        title: payload.title,
        slug: payload.slug,
        body: payload.body,
        content: payload.content,
        excerpt: payload.excerpt,
        categories: payload.categories,
        tags: payload.tags,
        featuredImagePlaceholder: payload.featuredImagePlaceholder,
        externalPostId: payload.externalPostId,
        externalEditUrl: payload.externalEditUrl,
        deliverableId: payload.deliverableId,
        sourceType: payload.sourceType,
        publishGateStatus: payload.publishGateStatus,
        credentialConfigured: payload.credentialConfigured
      };

      assert.deepEqual(snapshot, {
        status: "PREPARED",
        postStatus: "draft",
        title: "Puriva SEO Article: Recovery & Wellness",
        slug: "puriva-seo-article-recovery-wellness",
        body: "Draft body for admin review.",
        content: "Draft body for admin review.",
        excerpt: "Short summary.",
        categories: ["Wellness", "Recovery"],
        tags: ["puriva", "seo"],
        featuredImagePlaceholder: "assets/hero-placeholder.png",
        externalPostId: null,
        externalEditUrl: null,
        deliverableId: "deliverable-42",
        sourceType: "DELIVERABLE",
        publishGateStatus: "disabled",
        credentialConfigured: false
      });

      const serialized = JSON.stringify(payload);
      assert.equal(serialized.includes('"publish"'), false);
      assert.equal(serialized.includes('"future"'), false);
      assert.equal(serialized.includes('"pending"'), false);
      assert.equal(serialized.includes("applicationPassword"), false);
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

    it("G541 drops numeric taxonomy ids and redacts secret fragments in body", () => {
      const payload = buildAiDeliveryWordPressDraftPayload({
        title: "Taxonomy edge draft",
        body: "Safe copy. applicationPassword: leak-me-not",
        sourceType: "DELIVERABLE",
        sourceId: "deliverable-99",
        categories: ["12", "Wellness"],
        tags: ["7", "seo"],
        publishGateStatus: "credentials_missing",
        credentialConfigured: true
      });

      assert.deepEqual(payload.categories, ["Wellness"]);
      assert.deepEqual(payload.tags, ["seo"]);
      assert.equal(payload.body.includes("leak-me-not"), false);
      assert.equal(payload.body.includes("applicationPassword"), false);
      assert.match(payload.body, /\[REDACTED\]/);
      assert.equal(payload.postStatus, "draft");
      assert.match(payload.note, /Save publication target credentials/);
    });
  });

  describe("G291 / G543 draft-only status invariant", () => {
    it("resolves only draft status and rejects publish status drift", () => {
      assert.equal(resolveWordPressDraftPostStatus(), "draft");
      assert.equal(isWordPressDraftStatusFrozen(), true);
      assert.doesNotThrow(() => assertWordPressDraftStatusFrozen({ postStatus: "draft" }));
      assert.throws(
        () => assertWordPressDraftStatusFrozen({ postStatus: "publish" }),
        /status freeze violated/
      );
      assert.throws(
        () => assertWordPressDraftStatusFrozen({ postStatus: "pending" }),
        /status freeze violated/
      );
      assert.throws(
        () => assertWordPressDraftStatusFrozen({ postStatus: "future" }),
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

    it("G543 freezes every gate-status draft payload to postStatus draft", () => {
      for (const gate of ["disabled", "credentials_missing", "target_configured"] as const) {
        const payload = buildAiDeliveryWordPressDraftPayload({
          title: `Gate ${gate}`,
          body: "Body",
          sourceType: "DELIVERABLE",
          sourceId: "d-1",
          publishGateStatus: gate,
          credentialConfigured: gate !== "disabled"
        });
        assert.equal(payload.postStatus, WORDPRESS_DRAFT_POST_STATUS);
        assertWordPressDraftStatusFrozen(payload);
      }
    });
  });

  describe("G292 / G300 / G544 publish freeze and no-live service guard", () => {
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

      assert.equal(WORDPRESS_LIVE_HTTP_FROZEN, true);
      assert.equal(isAiDeliveryWordPressPublishFrozen(), true);
      assert.equal(fetchCalled, false);
      assert.equal(result.ok, false);
      assert.equal(result.status, "provider_disabled");
      assert.equal(result.wordpressPostId, null);
      assert.equal(result.providerDisabledReason, WORDPRESS_LIVE_HTTP_FROZEN_REASON);
      assert.equal(JSON.stringify(result).includes("raw-application-password"), false);
    });

    it("documents no-live guard in service source before fetch", () => {
      const source = readFileSync(serviceSourcePath, "utf8");
      const publishStart = source.indexOf("export async function publishAiDeliveryDeliverableToWordPress");
      const fetchIndex = source.indexOf("await fetch(", publishStart);
      const freezeIndex = source.indexOf("isAiDeliveryWordPressPublishFrozen()", publishStart);
      assert.ok(publishStart >= 0);
      assert.ok(freezeIndex > publishStart);
      assert.ok(fetchIndex > freezeIndex);
    });

    it("G544 returns validation error without fetch when required fields missing", async () => {
      let fetchCalled = false;
      globalThis.fetch = (async () => {
        fetchCalled = true;
        return new Response("{}", { status: 200 });
      }) as typeof fetch;

      const result = await publishAiDeliveryDeliverableToWordPress({
        deliverableId: "",
        title: "",
        body: ""
      });

      assert.equal(fetchCalled, false);
      assert.equal(result.status, "error");
      assert.equal(result.ok, false);
      assert.ok(result.errorMessage);
    });
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
    assert.equal(assertWordPressDraftProofPlanInvariants(), true);
    assert.equal(WORDPRESS_AUTHOR_TENANT_MAPPING_DESIGN.draftAuthorId, null);
  });
});
