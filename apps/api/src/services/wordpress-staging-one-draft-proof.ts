/**
 * Staging-only WordPress one-draft live proof harness.
 *
 * Operator / container entry only — not exposed as a public HTTP route.
 * Requires:
 *   - WORDPRESS_DRAFT_LIVE_ENABLED=true
 *   - WORDPRESS_DRAFT_LIVE_CALLS_ALLOWED=true
 *   - DCA_WP_DRAFT_PROOF_CONFIRM=I_UNDERSTAND_STAGING_ONE_DRAFT_ONLY
 *   - PUBLICATION_TARGET_ID
 *   - CREDENTIAL_ENCRYPTION_MASTER_KEY (runtime)
 *
 * Never prints Application Password, master key, Authorization, or ciphertext.
 */

import { randomBytes } from "node:crypto";
import { createPrismaClient } from "../../../../packages/data/src/client";
import {
  evaluateWordPressDraftLiveAuthorization
} from "../config/wordpress-draft-live.config";
import {
  getDecryptedPublicationTargetPassword
} from "../core/client-publication.runtime";
import {
  createWordPressDraft,
  trashWordPressDraftByExactId
} from "./wordpress-live-draft.adapter";
import {
  createPrismaWordPressDraftLiveAttemptStore
} from "./wordpress-live-draft-attempt.store";
import { WORDPRESS_LIVE_HTTP_FROZEN } from "./wordpress.service";
import { WORDPRESS_TEST_DRAFT_PROOF_MARKER } from "./wordpress-draft-proof-plan";

export const DCA_WP_DRAFT_PROOF_CONFIRM_VALUE = "I_UNDERSTAND_STAGING_ONE_DRAFT_ONLY" as const;

export type WordPressStagingOneDraftProofOptions = {
  publicationTargetId: string;
  confirm: string;
  cleanup?: boolean;
  env?: NodeJS.ProcessEnv;
  /** Injected for tests only */
  prisma?: ReturnType<typeof createPrismaClient>;
  fetchImpl?: typeof fetch;
  now?: () => Date;
  randomSuffix?: () => string;
  /** Injected for tests; production uses encrypted PublicationTargetCredential decrypt. */
  resolveApplicationPassword?: (
    tenantId: string,
    publicationTargetId: string
  ) => Promise<string | null>;
};

export type WordPressStagingOneDraftProofEvidence = {
  ok: boolean;
  phase: string;
  genericPublishFrozen: boolean;
  draftLiveAuthorized: boolean;
  marker: string | null;
  idempotencyKey: string | null;
  publicationTargetId: string | null;
  siteHost: string | null;
  usernamePresent: boolean;
  usernameLength: number;
  credentialDecryptReady: boolean;
  createStatus: string | null;
  wordpressPostId: string | null;
  wordpressStatus: string | null;
  submitRequestCount: number | null;
  retryCount: 0;
  fallbackUsed: false;
  mediaRequestCount: 0;
  liveProviderCalled: boolean | null;
  attemptState: string | null;
  cleanupStatus: string | null;
  cleanupSubmitRequestCount: number | null;
  safeError: string | null;
};

function redactEvidence(evidence: WordPressStagingOneDraftProofEvidence): string {
  const json = JSON.stringify(evidence);
  if (/Basic\s+[A-Za-z0-9+/=]{8,}/i.test(json)) {
    throw new Error("Proof evidence failed secret redaction invariant.");
  }
  if (/"applicationPassword"/i.test(json) || /"Authorization"/i.test(json)) {
    throw new Error("Proof evidence failed secret redaction invariant.");
  }
  if (/"ciphertext"|"authTag"|"masterKey"/i.test(json)) {
    throw new Error("Proof evidence failed secret redaction invariant.");
  }
  return json;
}

function fail(
  phase: string,
  safeError: string,
  partial: Partial<WordPressStagingOneDraftProofEvidence> = {}
): WordPressStagingOneDraftProofEvidence {
  const evidence: WordPressStagingOneDraftProofEvidence = {
    ok: false,
    phase,
    genericPublishFrozen: WORDPRESS_LIVE_HTTP_FROZEN,
    draftLiveAuthorized: false,
    marker: null,
    idempotencyKey: null,
    publicationTargetId: partial.publicationTargetId ?? null,
    siteHost: null,
    usernamePresent: false,
    usernameLength: 0,
    credentialDecryptReady: false,
    createStatus: null,
    wordpressPostId: null,
    wordpressStatus: null,
    submitRequestCount: null,
    retryCount: 0,
    fallbackUsed: false,
    mediaRequestCount: 0,
    liveProviderCalled: null,
    attemptState: null,
    cleanupStatus: null,
    cleanupSubmitRequestCount: null,
    safeError,
    ...partial
  };
  redactEvidence(evidence);
  return evidence;
}

function siteHostOf(siteUrl: string): string | null {
  try {
    return new URL(siteUrl).hostname;
  } catch {
    return null;
  }
}

export async function runWordPressStagingOneDraftProof(
  options: WordPressStagingOneDraftProofOptions
): Promise<WordPressStagingOneDraftProofEvidence> {
  const env = options.env ?? process.env;
  const publicationTargetId = options.publicationTargetId?.trim();
  if (!publicationTargetId) {
    return fail("guard", "PUBLICATION_TARGET_ID is required.");
  }
  if (options.confirm !== DCA_WP_DRAFT_PROOF_CONFIRM_VALUE) {
    return fail("guard", "DCA_WP_DRAFT_PROOF_CONFIRM value is required and exact.", {
      publicationTargetId
    });
  }
  if (!WORDPRESS_LIVE_HTTP_FROZEN) {
    return fail("guard", "Generic WordPress publish freeze invariant broken.", {
      publicationTargetId
    });
  }

  const auth = evaluateWordPressDraftLiveAuthorization(env);
  if (!auth.authorized) {
    return fail("guard", auth.reason, {
      publicationTargetId,
      draftLiveAuthorized: false
    });
  }

  const prisma = options.prisma ?? createPrismaClient();
  const ownsPrisma = !options.prisma;
  const attemptStore = createPrismaWordPressDraftLiveAttemptStore(prisma);

  try {
    const target = await prisma.publicationTarget.findFirst({
      where: { id: publicationTargetId, isArchived: false },
      select: {
        id: true,
        tenantId: true,
        clientId: true,
        siteUrl: true,
        wordpressUsername: true,
        label: true
      }
    });
    if (!target) {
      return fail("target", "PublicationTarget not found or archived.", { publicationTargetId });
    }

    const username = target.wordpressUsername?.trim() ?? "";
    if (!username) {
      return fail("target", "PublicationTarget.wordpressUsername is required.", {
        publicationTargetId,
        siteHost: siteHostOf(target.siteUrl)
      });
    }

    const resolvePassword =
      options.resolveApplicationPassword ?? getDecryptedPublicationTargetPassword;
    const applicationPassword = await resolvePassword(target.tenantId, target.id);
    if (!applicationPassword) {
      return fail("credentials", "Encrypted Application Password missing or decrypt failed.", {
        publicationTargetId,
        siteHost: siteHostOf(target.siteUrl),
        usernamePresent: true,
        usernameLength: username.length,
        credentialDecryptReady: false,
        draftLiveAuthorized: true
      });
    }

    const now = options.now?.() ?? new Date();
    const utc = now.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/[-:]/g, "");
    const suffix =
      options.randomSuffix?.() ?? randomBytes(4).toString("hex");
    const marker = `DCA-WP-DRAFT-${utc}-${suffix}`;
    const idempotencyKey = `wp-draft-proof:${marker}`;

    const existing = await attemptStore.get(target.tenantId, idempotencyKey);
    if (existing && existing.state !== "NOT_STARTED" && existing.state !== "FAILED_BEFORE_REQUEST") {
      return fail("precheck", "Attempt already exists for generated idempotency key.", {
        publicationTargetId,
        siteHost: siteHostOf(target.siteUrl),
        usernamePresent: true,
        usernameLength: username.length,
        credentialDecryptReady: true,
        draftLiveAuthorized: true,
        marker,
        idempotencyKey,
        attemptState: existing.state
      });
    }

    const title = `${WORDPRESS_TEST_DRAFT_PROOF_MARKER} WordPress Staging Draft Proof ${utc}`;
    const content =
      "This is an isolated DCA OS staging integration proof. It contains no client content and must not be published.";
    const excerpt = "DCA OS staging WordPress draft integration proof.";

    const created = await createWordPressDraft(
      {
        tenantId: target.tenantId,
        publicationTargetId: target.id,
        siteUrl: target.siteUrl,
        username,
        applicationPassword,
        title,
        content,
        excerpt,
        marker,
        idempotencyKey
      },
      {
        attemptStore,
        fetchImpl: options.fetchImpl,
        env
      }
    );

    const afterCreate = await attemptStore.get(target.tenantId, idempotencyKey);
    const baseEvidence: WordPressStagingOneDraftProofEvidence = {
      ok: created.ok,
      phase: "create",
      genericPublishFrozen: WORDPRESS_LIVE_HTTP_FROZEN,
      draftLiveAuthorized: true,
      marker,
      idempotencyKey,
      publicationTargetId: target.id,
      siteHost: siteHostOf(target.siteUrl),
      usernamePresent: true,
      usernameLength: username.length,
      credentialDecryptReady: true,
      createStatus: created.status,
      wordpressPostId: created.wordpressPostId,
      wordpressStatus: created.wordpressStatus,
      submitRequestCount: created.submitRequestCount,
      retryCount: 0,
      fallbackUsed: false,
      mediaRequestCount: 0,
      liveProviderCalled: created.liveProviderCalled,
      attemptState: afterCreate?.state ?? null,
      cleanupStatus: null,
      cleanupSubmitRequestCount: null,
      safeError: created.safeError
    };
    redactEvidence(baseEvidence);

    if (!created.ok || created.status !== "wordpress_draft_created") {
      return { ...baseEvidence, ok: false, phase: "create_failed" };
    }

    const doCleanup = options.cleanup !== false;
    if (!doCleanup) {
      return { ...baseEvidence, phase: "create_only_no_cleanup" };
    }

    if (!created.wordpressPostId) {
      return {
        ...baseEvidence,
        ok: false,
        phase: "cleanup_blocked",
        safeError: "Create succeeded without post ID; cleanup refused."
      };
    }

    const trashed = await trashWordPressDraftByExactId(
      {
        tenantId: target.tenantId,
        siteUrl: target.siteUrl,
        username,
        applicationPassword,
        wordpressPostId: created.wordpressPostId,
        idempotencyKey
      },
      {
        attemptStore,
        fetchImpl: options.fetchImpl,
        env
      }
    );

    const afterTrash = await attemptStore.get(target.tenantId, idempotencyKey);
    const finalEvidence: WordPressStagingOneDraftProofEvidence = {
      ...baseEvidence,
      ok: trashed.ok,
      phase: trashed.ok ? "create_and_trash_complete" : "cleanup_failed",
      cleanupStatus: trashed.status,
      cleanupSubmitRequestCount: trashed.submitRequestCount,
      attemptState: afterTrash?.state ?? afterCreate?.state ?? null,
      safeError: trashed.ok ? null : trashed.safeError
    };
    redactEvidence(finalEvidence);
    return finalEvidence;
  } finally {
    if (ownsPrisma) {
      await prisma.$disconnect().catch(() => undefined);
    }
  }
}
