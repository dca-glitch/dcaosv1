/**
 * Local fake-transport smoke for WordPress dedicated live-draft adapter.
 * Never contacts a real WordPress host. Never prints Application Passwords.
 */
import { createFakeWordPressTransport } from "../apps/api/src/services/wordpress-live-draft.fake-transport.ts";
import { createMemoryWordPressDraftLiveAttemptStore } from "../apps/api/src/services/wordpress-live-draft-attempt.store.ts";
import {
  createWordPressDraft,
  trashWordPressDraftByExactId
} from "../apps/api/src/services/wordpress-live-draft.adapter.ts";
import { WORDPRESS_LIVE_HTTP_FROZEN } from "../apps/api/src/services/wordpress.service.ts";
import { WORDPRESS_TEST_DRAFT_PROOF_MARKER } from "../apps/api/src/services/wordpress-draft-proof-plan.ts";

function pass(label, detail = "") {
  console.log(`PASS ${label}${detail ? ` - ${detail}` : ""}`);
}
function fail(label, detail = "") {
  console.error(`FAIL ${label}${detail ? ` - ${detail}` : ""}`);
  process.exitCode = 1;
}

async function main() {
  console.log("[SMOKE][WORDPRESS_LIVE_DRAFT_ADAPTER_LOCAL] starting");
  let passed = 0;
  const expect = (ok, label, detail) => {
    if (ok) {
      pass(label, detail);
      passed += 1;
    } else {
      fail(label, detail);
    }
  };

  expect(WORDPRESS_LIVE_HTTP_FROZEN === true, "generic publish freeze remains true");

  const store = createMemoryWordPressDraftLiveAttemptStore();
  const { fetchImpl, stats } = createFakeWordPressTransport({ postId: 5150 });
  const marker = `${WORDPRESS_TEST_DRAFT_PROOF_MARKER} smoke`;
  const key = "DCA-WP-SMOKE-IDEMP-1";
  const password = "never-print-this-application-password";

  const created = await createWordPressDraft(
    {
      tenantId: "smoke-tenant",
      siteUrl: "https://example.test",
      username: "author-user",
      applicationPassword: password,
      title: "Smoke draft",
      content: "No-image bounded body.",
      marker,
      idempotencyKey: key
    },
    { fetchImpl, attemptStore: store, bypassLiveAuthorizationForFakeTransport: true }
  );

  expect(created.ok === true, "one draft request succeeds");
  expect(created.status === "wordpress_draft_created", "truthful draft result status", created.status);
  expect(created.wordpressStatus === "draft", "wordpress status draft");
  expect(created.submitRequestCount === 1, "submitRequestCount=1");
  expect(created.retryCount === 0, "retryCount=0");
  expect(created.fallbackUsed === false, "fallbackUsed=false");
  expect(created.mediaRequestCount === 0, "mediaRequestCount=0");
  expect(created.wordpressPostId === "5150", "post ID captured", String(created.wordpressPostId));
  expect(stats.createCount === 1, "exactly one create", String(stats.createCount));

  const authRaw = stats.lastCreate?.authorizationRawForTestOnly ?? "";
  const decoded = Buffer.from(authRaw.replace(/^Basic\s+/i, ""), "base64").toString("utf8");
  expect(decoded.startsWith("author-user:"), "Basic auth includes username");
  expect(decoded === `author-user:${password}`, "Basic auth uses username:applicationPassword");
  expect(stats.lastCreate?.authorizationRedacted === "Basic [REDACTED]", "Authorization redacted in capture");

  const serialized = JSON.stringify(created);
  expect(!serialized.includes(password), "Application Password not printed in result JSON");
  expect(!serialized.includes("Authorization"), "Authorization not in result JSON");

  const duplicate = await createWordPressDraft(
    {
      tenantId: "smoke-tenant",
      siteUrl: "https://example.test",
      username: "author-user",
      applicationPassword: password,
      title: "Smoke draft",
      content: "No-image bounded body.",
      marker,
      idempotencyKey: key
    },
    { fetchImpl, attemptStore: store, bypassLiveAuthorizationForFakeTransport: true }
  );
  expect(duplicate.status === "duplicate_blocked", "duplicate key blocked");
  expect(stats.createCount === 1, "still exactly one create after duplicate", String(stats.createCount));

  const trash = await trashWordPressDraftByExactId(
    {
      tenantId: "smoke-tenant",
      siteUrl: "https://example.test",
      username: "author-user",
      applicationPassword: password,
      wordpressPostId: "5150",
      idempotencyKey: key
    },
    { fetchImpl, attemptStore: store, bypassLiveAuthorizationForFakeTransport: true }
  );
  expect(trash.ok === true, "exact-ID trash succeeds");
  expect(trash.submitRequestCount === 1, "trash submitRequestCount=1");
  expect(stats.trashCount === 1, "exactly one trash");

  console.log(`[SMOKE][WORDPRESS_LIVE_DRAFT_ADAPTER_LOCAL] finished - ${passed} checks`);
  if (process.exitCode) {
    process.exit(process.exitCode);
  }
}

main().catch((error) => {
  console.error("[SMOKE][WORDPRESS_LIVE_DRAFT_ADAPTER_LOCAL] crashed", error);
  process.exit(1);
});
