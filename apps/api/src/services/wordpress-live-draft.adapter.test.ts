import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  evaluateWordPressDraftLiveAuthorization,
  WORDPRESS_DRAFT_LIVE_ENV_KEYS
} from "../config/wordpress-draft-live.config";
import { WORDPRESS_LIVE_HTTP_FROZEN, publishAiDeliveryDeliverableToWordPress } from "./wordpress.service";
import { WORDPRESS_TEST_DRAFT_PROOF_MARKER } from "./wordpress-draft-proof-plan";
import {
  buildWordPressLiveDraftAuthHeaderForTests,
  createWordPressDraft,
  trashWordPressDraftByExactId,
  WORDPRESS_LIVE_DRAFT_RESULT_CREATED,
  WORDPRESS_LIVE_DRAFT_STATUS
} from "./wordpress-live-draft.adapter";
import { createMemoryWordPressDraftLiveAttemptStore } from "./wordpress-live-draft-attempt.store";
import { createFakeWordPressTransport } from "./wordpress-live-draft.fake-transport";

const MARKER = `${WORDPRESS_TEST_DRAFT_PROOF_MARKER} wellness`;
const KEY = "DCA-WP-IDEMP-1";

function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    tenantId: "tenant-1",
    publicationTargetId: "target-1",
    siteUrl: "https://example.test",
    username: "wp-author",
    applicationPassword: "xxxx xxxx xxxx xxxx xxxx xxxx",
    title: "Neutral staging draft",
    content: "Bounded no-image proof body.",
    marker: MARKER,
    idempotencyKey: KEY,
    ...overrides
  };
}

describe("wordpress-draft-live.config", () => {
  const originalEnabled = process.env[WORDPRESS_DRAFT_LIVE_ENV_KEYS.enabled];
  const originalAllowed = process.env[WORDPRESS_DRAFT_LIVE_ENV_KEYS.liveCallsAllowed];

  afterEach(() => {
    if (originalEnabled === undefined) delete process.env[WORDPRESS_DRAFT_LIVE_ENV_KEYS.enabled];
    else process.env[WORDPRESS_DRAFT_LIVE_ENV_KEYS.enabled] = originalEnabled;
    if (originalAllowed === undefined) delete process.env[WORDPRESS_DRAFT_LIVE_ENV_KEYS.liveCallsAllowed];
    else process.env[WORDPRESS_DRAFT_LIVE_ENV_KEYS.liveCallsAllowed] = originalAllowed;
  });

  it("defaults to disabled / unauthorized", () => {
    delete process.env[WORDPRESS_DRAFT_LIVE_ENV_KEYS.enabled];
    delete process.env[WORDPRESS_DRAFT_LIVE_ENV_KEYS.liveCallsAllowed];
    const snap = evaluateWordPressDraftLiveAuthorization({});
    assert.equal(snap.enabled, false);
    assert.equal(snap.liveCallsAllowed, false);
    assert.equal(snap.authorized, false);
  });

  it("requires both flags exact true", () => {
    assert.equal(
      evaluateWordPressDraftLiveAuthorization({
        [WORDPRESS_DRAFT_LIVE_ENV_KEYS.enabled]: "true",
        [WORDPRESS_DRAFT_LIVE_ENV_KEYS.liveCallsAllowed]: "TRUE"
      }).authorized,
      false
    );
    assert.equal(
      evaluateWordPressDraftLiveAuthorization({
        [WORDPRESS_DRAFT_LIVE_ENV_KEYS.enabled]: "true",
        [WORDPRESS_DRAFT_LIVE_ENV_KEYS.liveCallsAllowed]: "true"
      }).authorized,
      true
    );
  });
});

describe("wordpress-live-draft.adapter", () => {
  it("keeps generic publish frozen", async () => {
    assert.equal(WORDPRESS_LIVE_HTTP_FROZEN, true);
    const publish = await publishAiDeliveryDeliverableToWordPress(
      { deliverableId: "d1", title: "t", body: "b", status: "publish" },
      {
        siteConfig: { siteUrl: "https://example.test" },
        applicationPassword: "secret"
      }
    );
    assert.equal(publish.status, "provider_disabled");
  });

  it("blocks when live authorization flags are false", async () => {
    const { fetchImpl, stats } = createFakeWordPressTransport();
    const result = await createWordPressDraft(baseInput(), {
      fetchImpl,
      env: {},
      attemptStore: createMemoryWordPressDraftLiveAttemptStore()
    });
    assert.equal(result.ok, false);
    assert.equal(result.status, "blocked");
    assert.equal(stats.createCount, 0);
  });

  it("fails before HTTP when username missing", async () => {
    const { fetchImpl, stats } = createFakeWordPressTransport();
    const result = await createWordPressDraft(baseInput({ username: "  " }), {
      fetchImpl,
      bypassLiveAuthorizationForFakeTransport: true,
      attemptStore: createMemoryWordPressDraftLiveAttemptStore()
    });
    assert.equal(result.ok, false);
    assert.match(result.safeError ?? "", /username/i);
    assert.equal(stats.createCount, 0);
  });

  it("fails before HTTP when Application Password missing", async () => {
    const { fetchImpl, stats } = createFakeWordPressTransport();
    const result = await createWordPressDraft(baseInput({ applicationPassword: "" }), {
      fetchImpl,
      bypassLiveAuthorizationForFakeTransport: true,
      attemptStore: createMemoryWordPressDraftLiveAttemptStore()
    });
    assert.equal(result.ok, false);
    assert.match(result.safeError ?? "", /Application Password/i);
    assert.equal(stats.createCount, 0);
  });

  it("encodes username:applicationPassword in Basic auth", async () => {
    const { header, decodedUserInfo } = buildWordPressLiveDraftAuthHeaderForTests(
      "wp-author",
      "app-pass-value"
    );
    assert.match(header, /^Basic /);
    assert.equal(decodedUserInfo, "wp-author:app-pass-value");
    assert.notEqual(decodedUserInfo.startsWith(":"), true);

    const { fetchImpl, stats } = createFakeWordPressTransport();
    await createWordPressDraft(baseInput(), {
      fetchImpl,
      bypassLiveAuthorizationForFakeTransport: true,
      attemptStore: createMemoryWordPressDraftLiveAttemptStore()
    });
    const raw = stats.lastCreate?.authorizationRawForTestOnly ?? "";
    const decoded = Buffer.from(raw.replace(/^Basic\s+/i, ""), "base64").toString("utf8");
    assert.equal(decoded, "wp-author:xxxx xxxx xxxx xxxx xxxx xxxx");
  });

  it("never serializes Authorization or applicationPassword in result", async () => {
    const { fetchImpl } = createFakeWordPressTransport();
    const result = await createWordPressDraft(baseInput(), {
      fetchImpl,
      bypassLiveAuthorizationForFakeTransport: true,
      attemptStore: createMemoryWordPressDraftLiveAttemptStore()
    });
    const serialized = JSON.stringify(result);
    assert.equal(serialized.includes("Authorization"), false);
    assert.equal(serialized.includes("applicationPassword"), false);
    assert.equal(serialized.includes("xxxx xxxx"), false);
    assert.equal(serialized.includes("Basic "), false);
  });

  it("hard-locks status=draft and rejects caller publish/pending/future", async () => {
    const { fetchImpl, stats } = createFakeWordPressTransport();
    for (const status of ["publish", "pending", "future"] as const) {
      const result = await createWordPressDraft(baseInput({ status, idempotencyKey: `key-${status}` }), {
        fetchImpl,
        bypassLiveAuthorizationForFakeTransport: true,
        attemptStore: createMemoryWordPressDraftLiveAttemptStore()
      });
      assert.equal(result.ok, false);
      assert.match(result.safeError ?? "", /status/i);
    }
    assert.equal(stats.createCount, 0);

    const ok = await createWordPressDraft(baseInput({ idempotencyKey: "key-ok" }), {
      fetchImpl,
      bypassLiveAuthorizationForFakeTransport: true,
      attemptStore: createMemoryWordPressDraftLiveAttemptStore()
    });
    assert.equal(ok.ok, true);
    assert.equal(stats.lastCreate?.body?.status, WORDPRESS_LIVE_DRAFT_STATUS);
    assert.equal(ok.wordpressStatus, "draft");
    assert.equal(ok.status, WORDPRESS_LIVE_DRAFT_RESULT_CREATED);
  });

  it("issues exactly one POST with retry=0 fallback=false media=0 and no images required", async () => {
    const { fetchImpl, stats } = createFakeWordPressTransport({ postId: 99 });
    const result = await createWordPressDraft(baseInput(), {
      fetchImpl,
      bypassLiveAuthorizationForFakeTransport: true,
      attemptStore: createMemoryWordPressDraftLiveAttemptStore()
    });
    assert.equal(result.ok, true);
    assert.equal(result.submitRequestCount, 1);
    assert.equal(result.retryCount, 0);
    assert.equal(result.fallbackUsed, false);
    assert.equal(result.mediaRequestCount, 0);
    assert.equal(stats.createCount, 1);
    assert.equal(stats.trashCount, 0);
    assert.equal(result.wordpressPostId, "99");
    assert.equal(result.liveProviderCalled, true);
    assert.equal(result.genericPublishFrozen, true);
  });

  it("fails safely when provider returns non-draft status", async () => {
    const { fetchImpl, stats } = createFakeWordPressTransport({ returnedStatus: "publish" });
    const result = await createWordPressDraft(baseInput(), {
      fetchImpl,
      bypassLiveAuthorizationForFakeTransport: true,
      attemptStore: createMemoryWordPressDraftLiveAttemptStore()
    });
    assert.equal(result.ok, false);
    assert.equal(stats.createCount, 1);
    assert.match(result.safeError ?? "", /non-draft/i);
  });

  it("does not retry on HTTP failure or ambiguous response", async () => {
    const fail = createFakeWordPressTransport({ failCreate: true });
    const failResult = await createWordPressDraft(baseInput({ idempotencyKey: "fail-1" }), {
      fetchImpl: fail.fetchImpl,
      bypassLiveAuthorizationForFakeTransport: true,
      attemptStore: createMemoryWordPressDraftLiveAttemptStore()
    });
    assert.equal(failResult.status, "ambiguous");
    assert.equal(fail.stats.createCount, 1);

    const amb = createFakeWordPressTransport({ ambiguousCreate: true });
    const ambResult = await createWordPressDraft(baseInput({ idempotencyKey: "amb-1" }), {
      fetchImpl: amb.fetchImpl,
      bypassLiveAuthorizationForFakeTransport: true,
      attemptStore: createMemoryWordPressDraftLiveAttemptStore()
    });
    assert.equal(ambResult.status, "ambiguous");
    assert.equal(amb.stats.createCount, 1);
  });

  it("blocks duplicate create for the same idempotency key", async () => {
    const store = createMemoryWordPressDraftLiveAttemptStore();
    const { fetchImpl, stats } = createFakeWordPressTransport();
    const first = await createWordPressDraft(baseInput(), {
      fetchImpl,
      bypassLiveAuthorizationForFakeTransport: true,
      attemptStore: store
    });
    assert.equal(first.ok, true);
    const second = await createWordPressDraft(baseInput(), {
      fetchImpl,
      bypassLiveAuthorizationForFakeTransport: true,
      attemptStore: store
    });
    assert.equal(second.ok, false);
    assert.equal(second.status, "duplicate_blocked");
    assert.equal(stats.createCount, 1);
  });

  it("exact cleanup uses recorded post ID and refuses arbitrary IDs", async () => {
    const store = createMemoryWordPressDraftLiveAttemptStore();
    const { fetchImpl, stats } = createFakeWordPressTransport({ postId: 777 });
    const created = await createWordPressDraft(baseInput(), {
      fetchImpl,
      bypassLiveAuthorizationForFakeTransport: true,
      attemptStore: store
    });
    assert.equal(created.wordpressPostId, "777");

    const refused = await trashWordPressDraftByExactId(
      {
        tenantId: "tenant-1",
        siteUrl: "https://example.test",
        username: "wp-author",
        applicationPassword: "pass",
        wordpressPostId: "999",
        idempotencyKey: KEY
      },
      { fetchImpl, bypassLiveAuthorizationForFakeTransport: true, attemptStore: store }
    );
    assert.equal(refused.ok, false);
    assert.equal(stats.trashCount, 0);

    const trashed = await trashWordPressDraftByExactId(
      {
        tenantId: "tenant-1",
        siteUrl: "https://example.test",
        username: "wp-author",
        applicationPassword: "pass",
        wordpressPostId: "777",
        idempotencyKey: KEY
      },
      { fetchImpl, bypassLiveAuthorizationForFakeTransport: true, attemptStore: store }
    );
    assert.equal(trashed.ok, true);
    assert.equal(trashed.status, "trashed");
    assert.equal(trashed.submitRequestCount, 1);
    assert.equal(trashed.retryCount, 0);
    assert.equal(stats.trashCount, 1);
    assert.match(stats.lastTrash?.url ?? "", /\/posts\/777\?force=false/);
  });

  it("refuses real-network fake bypass without injected fetch", async () => {
    const result = await createWordPressDraft(baseInput(), {
      bypassLiveAuthorizationForFakeTransport: true
    });
    assert.equal(result.ok, false);
    assert.match(result.safeError ?? "", /injected fetchImpl/i);
  });
});
