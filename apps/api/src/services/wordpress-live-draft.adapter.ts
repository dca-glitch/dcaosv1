/**
 * Dedicated WordPress live-draft adapter.
 *
 * Separate from generic publish-wordpress (which remains WORDPRESS_LIVE_HTTP_FROZEN).
 * Hard-locks status=draft, Application Password Basic auth as username:password,
 * exactly one create request, retry=0, no media, injectable transport.
 */

import {
  evaluateWordPressDraftLiveAuthorization,
  isWordPressDraftLiveAuthorized
} from "../config/wordpress-draft-live.config";
import { WORDPRESS_LIVE_HTTP_FROZEN } from "./wordpress.service";
import { WORDPRESS_TEST_DRAFT_PROOF_MARKER } from "./wordpress-draft-proof-plan";
import {
  createMemoryWordPressDraftLiveAttemptStore,
  type WordPressDraftLiveAttemptRecord,
  type WordPressDraftLiveAttemptStore
} from "./wordpress-live-draft-attempt.store";
import type { WordPressFetch } from "./wordpress-live-draft.fake-transport";

export const WORDPRESS_LIVE_DRAFT_STATUS = "draft" as const;
export const WORDPRESS_LIVE_DRAFT_RESULT_CREATED = "wordpress_draft_created" as const;

export type WordPressLiveDraftCreateInput = {
  tenantId: string;
  publicationTargetId?: string | null;
  siteUrl: string;
  username: string;
  applicationPassword: string;
  title: string;
  content: string;
  excerpt?: string | null;
  slug?: string | null;
  marker: string;
  idempotencyKey: string;
  /**
   * Forbidden: callers must never pass post status. Kept here only so TypeScript
   * rejects accidental spreads of publish-shaped objects when using exact types.
   * @deprecated never accepted
   */
  status?: never;
};

export type WordPressLiveDraftCreateResult = {
  ok: boolean;
  status:
    | typeof WORDPRESS_LIVE_DRAFT_RESULT_CREATED
    | "blocked"
    | "failed"
    | "ambiguous"
    | "duplicate_blocked";
  wordpressPostId: string | null;
  wordpressStatus: string | null;
  editUrl: string | null;
  submitRequestCount: number;
  retryCount: 0;
  fallbackUsed: false;
  mediaRequestCount: 0;
  liveProviderCalled: boolean;
  idempotencyKey: string;
  marker: string;
  safeError: string | null;
  genericPublishFrozen: typeof WORDPRESS_LIVE_HTTP_FROZEN;
};

export type WordPressLiveDraftTrashInput = {
  tenantId: string;
  siteUrl: string;
  username: string;
  applicationPassword: string;
  wordpressPostId: string;
  idempotencyKey: string;
};

export type WordPressLiveDraftTrashResult = {
  ok: boolean;
  status: "trashed" | "blocked" | "failed";
  wordpressPostId: string | null;
  submitRequestCount: number;
  retryCount: 0;
  fallbackUsed: false;
  liveProviderCalled: boolean;
  safeError: string | null;
};

export type WordPressLiveDraftAdapterOptions = {
  fetchImpl?: WordPressFetch;
  attemptStore?: WordPressDraftLiveAttemptStore;
  /**
   * When true, skip env live-authorization (tests/smoke with fake transport only).
   * Must never be used with the default global fetch against a real host.
   */
  bypassLiveAuthorizationForFakeTransport?: boolean;
  env?: NodeJS.ProcessEnv;
};

function normalizeSiteUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function buildBasicAuthHeader(username: string, applicationPassword: string): string {
  const token = Buffer.from(`${username}:${applicationPassword}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

function redactSecrets(value: string): string {
  return value
    .replace(/Basic\s+[A-Za-z0-9+/=]+/gi, "Basic [REDACTED]")
    .replace(/applicationPassword[=:]\s*\S+/gi, "applicationPassword=[REDACTED]");
}

function safeSerializeResult(result: unknown): string {
  const json = JSON.stringify(result);
  if (/Basic\s+[A-Za-z0-9+/=]{8,}/i.test(json)) {
    throw new Error("WordPress live-draft result failed secret redaction invariant.");
  }
  if (/"applicationPassword"\s*:/i.test(json) || /xxxx xxxx xxxx/i.test(json)) {
    throw new Error("WordPress live-draft result failed secret redaction invariant.");
  }
  if (/"Authorization"\s*:/i.test(json)) {
    throw new Error("WordPress live-draft result failed secret redaction invariant.");
  }
  return json;
}

function assertNoCallerStatus(input: WordPressLiveDraftCreateInput): string | null {
  if (Object.prototype.hasOwnProperty.call(input, "status") && (input as { status?: unknown }).status !== undefined) {
    return "Caller-controlled WordPress post status is forbidden on the live-draft path.";
  }
  return null;
}

function validateCreateInput(input: WordPressLiveDraftCreateInput): string | null {
  const statusError = assertNoCallerStatus(input);
  if (statusError) return statusError;
  if (!input.tenantId?.trim()) return "tenantId is required.";
  if (!input.siteUrl?.trim()) return "siteUrl is required.";
  if (!input.username?.trim()) return "WordPress username is required before live draft HTTP.";
  if (!input.applicationPassword?.trim()) {
    return "WordPress Application Password is required before live draft HTTP.";
  }
  if (!input.title?.trim() || !input.content?.trim()) return "title and content are required.";
  if (!input.marker?.trim()) return "proof marker is required.";
  if (!input.idempotencyKey?.trim()) return "idempotencyKey is required.";
  const marker = input.marker.trim();
  if (
    !marker.includes(WORDPRESS_TEST_DRAFT_PROOF_MARKER) &&
    !marker.startsWith("DCA-WP-") &&
    !marker.startsWith("[DCA-")
  ) {
    return "marker must include the DCA WordPress proof marker.";
  }
  return null;
}

export function buildWordPressLiveDraftAuthHeaderForTests(
  username: string,
  applicationPassword: string
): { header: string; decodedUserInfo: string } {
  const header = buildBasicAuthHeader(username, applicationPassword);
  const decodedUserInfo = Buffer.from(header.replace(/^Basic\s+/i, ""), "base64").toString("utf8");
  return { header, decodedUserInfo };
}

export async function createWordPressDraft(
  input: WordPressLiveDraftCreateInput,
  options: WordPressLiveDraftAdapterOptions = {}
): Promise<WordPressLiveDraftCreateResult> {
  const attemptStore = options.attemptStore ?? createMemoryWordPressDraftLiveAttemptStore();
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;

  const blocked = (
    status: WordPressLiveDraftCreateResult["status"],
    safeError: string,
    extra?: Partial<WordPressLiveDraftCreateResult>
  ): WordPressLiveDraftCreateResult => {
    const result: WordPressLiveDraftCreateResult = {
      ok: false,
      status,
      wordpressPostId: null,
      wordpressStatus: null,
      editUrl: null,
      submitRequestCount: 0,
      retryCount: 0,
      fallbackUsed: false,
      mediaRequestCount: 0,
      liveProviderCalled: false,
      idempotencyKey: input.idempotencyKey,
      marker: input.marker,
      safeError: redactSecrets(safeError),
      genericPublishFrozen: WORDPRESS_LIVE_HTTP_FROZEN,
      ...extra
    };
    safeSerializeResult(result);
    return result;
  };

  if (!options.bypassLiveAuthorizationForFakeTransport) {
    const auth = evaluateWordPressDraftLiveAuthorization(env);
    if (!auth.authorized) {
      return blocked("blocked", auth.reason);
    }
  } else if (fetchImpl === fetch) {
    return blocked(
      "blocked",
      "Fake-transport authorization bypass requires an injected fetchImpl (refusing real network)."
    );
  }

  // Generic publish remains frozen regardless of draft flags.
  if (!WORDPRESS_LIVE_HTTP_FROZEN) {
    return blocked("blocked", "Invariant broken: generic WordPress publish freeze must remain true.");
  }

  const validationError = validateCreateInput(input);
  if (validationError) {
    await attemptStore.upsert({
      tenantId: input.tenantId,
      publicationTargetId: input.publicationTargetId ?? null,
      idempotencyKey: input.idempotencyKey,
      marker: input.marker,
      state: "FAILED_BEFORE_REQUEST",
      wordpressPostId: null,
      safeError: validationError,
      submitRequestCount: 0
    });
    return blocked("failed", validationError);
  }

  const existing = await attemptStore.get(input.tenantId, input.idempotencyKey);
  if (existing) {
    if (existing.state === "COMPLETED") {
      return blocked("duplicate_blocked", "Idempotency key already completed; second create blocked.", {
        wordpressPostId: existing.wordpressPostId,
        submitRequestCount: existing.submitRequestCount
      });
    }
    if (existing.state === "REQUEST_STARTED" || existing.state === "AMBIGUOUS") {
      return blocked(
        "ambiguous",
        "Prior attempt is REQUEST_STARTED/AMBIGUOUS; manual review required — no retry.",
        { wordpressPostId: existing.wordpressPostId, submitRequestCount: existing.submitRequestCount }
      );
    }
    if (existing.state === "NOT_STARTED" || existing.state === "FAILED_BEFORE_REQUEST") {
      // Allow continuing only if no HTTP was issued.
    } else if (existing.submitRequestCount > 0) {
      return blocked("duplicate_blocked", "Idempotency key already used; second create blocked.", {
        submitRequestCount: existing.submitRequestCount
      });
    }
  }

  const started: WordPressDraftLiveAttemptRecord = {
    tenantId: input.tenantId,
    publicationTargetId: input.publicationTargetId ?? null,
    idempotencyKey: input.idempotencyKey,
    marker: input.marker,
    state: "REQUEST_STARTED",
    wordpressPostId: null,
    safeError: null,
    submitRequestCount: 0
  };
  await attemptStore.upsert(started);

  const siteUrl = normalizeSiteUrl(input.siteUrl);
  const endpoint = `${siteUrl}/wp-json/wp/v2/posts`;
  const authHeader = buildBasicAuthHeader(input.username.trim(), input.applicationPassword);
  const title = input.title.includes(input.marker) ? input.title : `${input.marker} ${input.title}`.trim();

  const body = {
    title,
    content: input.content,
    excerpt: input.excerpt ?? undefined,
    slug: input.slug ?? undefined,
    status: WORDPRESS_LIVE_DRAFT_STATUS
  };

  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "WordPress draft request failed.";
    await attemptStore.upsert({
      ...started,
      state: "AMBIGUOUS",
      submitRequestCount: 1,
      safeError: redactSecrets(message)
    });
    return blocked("ambiguous", "Transport error after request start; no retry.", {
      submitRequestCount: 1,
      liveProviderCalled: true
    });
  }

  const submitRequestCount = 1;

  let payload: { id?: number | string; status?: string; link?: string } | null = null;
  try {
    payload = (await response.json()) as { id?: number | string; status?: string; link?: string };
  } catch {
    await attemptStore.upsert({
      ...started,
      state: "AMBIGUOUS",
      submitRequestCount,
      safeError: "Ambiguous non-JSON WordPress response; no retry."
    });
    return blocked("ambiguous", "Ambiguous non-JSON WordPress response; no retry.", {
      submitRequestCount,
      liveProviderCalled: true
    });
  }

  if (!response.ok) {
    await attemptStore.upsert({
      ...started,
      state: "AMBIGUOUS",
      submitRequestCount,
      safeError: `WordPress draft HTTP ${response.status}; no retry.`
    });
    return blocked("ambiguous", `WordPress draft HTTP ${response.status}; no retry.`, {
      submitRequestCount,
      liveProviderCalled: true
    });
  }

  const wordpressPostId = payload?.id != null ? String(payload.id) : null;
  const wordpressStatus = typeof payload?.status === "string" ? payload.status : null;
  if (!wordpressPostId) {
    await attemptStore.upsert({
      ...started,
      state: "AMBIGUOUS",
      submitRequestCount,
      safeError: "WordPress response missing post id; no retry."
    });
    return blocked("ambiguous", "WordPress response missing post id; no retry.", {
      submitRequestCount,
      liveProviderCalled: true
    });
  }

  if (wordpressStatus !== WORDPRESS_LIVE_DRAFT_STATUS) {
    await attemptStore.upsert({
      ...started,
      state: "AMBIGUOUS",
      wordpressPostId,
      submitRequestCount,
      safeError: `Provider returned non-draft status "${wordpressStatus ?? "unknown"}".`
    });
    return blocked("failed", `Provider returned non-draft status "${wordpressStatus ?? "unknown"}".`, {
      wordpressPostId,
      wordpressStatus,
      submitRequestCount,
      liveProviderCalled: true
    });
  }

  const editUrl =
    wordpressPostId != null ? `${siteUrl}/wp-admin/post.php?post=${wordpressPostId}&action=edit` : null;

  await attemptStore.upsert({
    ...started,
    state: "COMPLETED",
    wordpressPostId,
    submitRequestCount,
    safeError: null
  });

  const result: WordPressLiveDraftCreateResult = {
    ok: true,
    status: WORDPRESS_LIVE_DRAFT_RESULT_CREATED,
    wordpressPostId,
    wordpressStatus,
    editUrl,
    submitRequestCount,
    retryCount: 0,
    fallbackUsed: false,
    mediaRequestCount: 0,
    liveProviderCalled: true,
    idempotencyKey: input.idempotencyKey,
    marker: input.marker,
    safeError: null,
    genericPublishFrozen: WORDPRESS_LIVE_HTTP_FROZEN
  };
  safeSerializeResult(result);
  return result;
}

/**
 * Exact-ID trash helper. Only allowed for a post ID previously recorded for the same
 * tenant + idempotency key attempt. force=false. One DELETE. No retry.
 */
export async function trashWordPressDraftByExactId(
  input: WordPressLiveDraftTrashInput,
  options: WordPressLiveDraftAdapterOptions = {}
): Promise<WordPressLiveDraftTrashResult> {
  const attemptStore = options.attemptStore ?? createMemoryWordPressDraftLiveAttemptStore();
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;

  const blocked = (
    status: WordPressLiveDraftTrashResult["status"],
    safeError: string,
    extra?: Partial<WordPressLiveDraftTrashResult>
  ): WordPressLiveDraftTrashResult => ({
    ok: false,
    status,
    wordpressPostId: null,
    submitRequestCount: 0,
    retryCount: 0,
    fallbackUsed: false,
    liveProviderCalled: false,
    safeError: redactSecrets(safeError),
    ...extra
  });

  if (!options.bypassLiveAuthorizationForFakeTransport) {
    if (!isWordPressDraftLiveAuthorized(env)) {
      return blocked("blocked", "WordPress live draft trash is not authorized.");
    }
  } else if (fetchImpl === fetch) {
    return blocked("blocked", "Fake-transport trash bypass requires injected fetchImpl.");
  }

  const postId = input.wordpressPostId?.trim();
  if (!postId || !/^\d+$/.test(postId)) {
    return blocked("failed", "Exact numeric WordPress post ID is required.");
  }
  if (!input.username?.trim() || !input.applicationPassword?.trim()) {
    return blocked("failed", "Username and Application Password are required for trash.");
  }

  const recorded = await attemptStore.get(input.tenantId, input.idempotencyKey);
  if (!recorded || recorded.wordpressPostId !== postId) {
    return blocked(
      "blocked",
      "Cleanup refused: post ID is not recorded for this tenant idempotency key."
    );
  }
  if (recorded.state !== "COMPLETED" && recorded.state !== "AMBIGUOUS") {
    return blocked("blocked", "Cleanup refused: attempt is not in a cleanup-eligible state.");
  }

  // Re-check via post id lookup to block arbitrary IDs even if key mismatched somehow.
  const byPost = await attemptStore.getByPostId(input.tenantId, postId);
  if (!byPost || byPost.idempotencyKey !== input.idempotencyKey) {
    return blocked("blocked", "Cleanup refused: post ID is not bound to the proof attempt.");
  }

  const siteUrl = normalizeSiteUrl(input.siteUrl);
  const endpoint = `${siteUrl}/wp-json/wp/v2/posts/${postId}?force=false`;
  const authHeader = buildBasicAuthHeader(input.username.trim(), input.applicationPassword);

  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
        Accept: "application/json"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "WordPress trash failed.";
    return blocked("failed", redactSecrets(message), { liveProviderCalled: true, submitRequestCount: 1 });
  }

  if (!response.ok) {
    return blocked("failed", `WordPress trash HTTP ${response.status}; no retry.`, {
      liveProviderCalled: true,
      submitRequestCount: 1,
      wordpressPostId: postId
    });
  }

  await attemptStore.upsert({
    ...recorded,
    state: "TRASHED",
    submitRequestCount: recorded.submitRequestCount
  });

  const result: WordPressLiveDraftTrashResult = {
    ok: true,
    status: "trashed",
    wordpressPostId: postId,
    submitRequestCount: 1,
    retryCount: 0,
    fallbackUsed: false,
    liveProviderCalled: true,
    safeError: null
  };
  safeSerializeResult(result);
  return result;
}
