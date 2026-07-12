import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createFakeWordPressTransport } from "./wordpress-live-draft.fake-transport";
import { createPrismaWordPressDraftLiveAttemptStore } from "./wordpress-live-draft-attempt.store";
import {
  DCA_WP_DRAFT_PROOF_CONFIRM_VALUE,
  runWordPressStagingOneDraftProof
} from "./wordpress-staging-one-draft-proof";
import { WORDPRESS_DRAFT_LIVE_ENV_KEYS } from "../config/wordpress-draft-live.config";

function createMockPrisma(seedTarget: {
  id: string;
  tenantId: string;
  clientId: string;
  siteUrl: string;
  wordpressUsername: string | null;
}) {
  const attempts = new Map<string, Record<string, unknown>>();
  const keyOf = (tenantId: string, idempotencyKey: string) => `${tenantId}::${idempotencyKey}`;

  const prisma = {
    publicationTarget: {
      async findFirst({ where }: { where: { id: string; isArchived: boolean } }) {
        if (where.id !== seedTarget.id || where.isArchived !== false) return null;
        return { ...seedTarget, isArchived: false, label: "proof" };
      }
    },
    wordPressDraftLiveAttempt: {
      async findUnique({
        where
      }: {
        where: { tenantId_idempotencyKey: { tenantId: string; idempotencyKey: string } };
      }) {
        return attempts.get(
          keyOf(where.tenantId_idempotencyKey.tenantId, where.tenantId_idempotencyKey.idempotencyKey)
        ) ?? null;
      },
      async findFirst({
        where
      }: {
        where: { tenantId: string; wordpressPostId: string };
      }) {
        for (const row of attempts.values()) {
          if (row.tenantId === where.tenantId && row.wordpressPostId === where.wordpressPostId) {
            return row;
          }
        }
        return null;
      },
      async upsert({
        where,
        create,
        update
      }: {
        where: { tenantId_idempotencyKey: { tenantId: string; idempotencyKey: string } };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) {
        const key = keyOf(
          where.tenantId_idempotencyKey.tenantId,
          where.tenantId_idempotencyKey.idempotencyKey
        );
        const existing = attempts.get(key);
        const next = existing
          ? { ...existing, ...update, updatedAt: new Date() }
          : { id: "att-1", ...create, createdAt: new Date(), updatedAt: new Date() };
        attempts.set(key, next);
        return next;
      }
    },
    async $disconnect() {
      return undefined;
    }
  };

  return { prisma, attempts };
}

describe("wordpress-staging-one-draft-proof harness", () => {
  it("blocks without exact confirm token", async () => {
    const { prisma } = createMockPrisma({
      id: "pt-1",
      tenantId: "t-1",
      clientId: "c-1",
      siteUrl: "https://wp-staging.example",
      wordpressUsername: "author"
    });
    const result = await runWordPressStagingOneDraftProof({
      publicationTargetId: "pt-1",
      confirm: "nope",
      prisma: prisma as never,
      env: {
        [WORDPRESS_DRAFT_LIVE_ENV_KEYS.enabled]: "true",
        [WORDPRESS_DRAFT_LIVE_ENV_KEYS.liveCallsAllowed]: "true"
      }
    });
    assert.equal(result.ok, false);
    assert.equal(result.phase, "guard");
  });

  it("runs one create + exact-ID trash via Prisma-backed store and fake transport", async () => {
    const { prisma, attempts } = createMockPrisma({
      id: "pt-1",
      tenantId: "t-1",
      clientId: "c-1",
      siteUrl: "https://wp-staging.example",
      wordpressUsername: "author"
    });
    const { fetchImpl, stats } = createFakeWordPressTransport({ postId: 9001 });

    const result = await runWordPressStagingOneDraftProof({
      publicationTargetId: "pt-1",
      confirm: DCA_WP_DRAFT_PROOF_CONFIRM_VALUE,
      prisma: prisma as never,
      fetchImpl,
      resolveApplicationPassword: async () => "xxxx xxxx xxxx xxxx",
      now: () => new Date("2026-07-12T12:00:00.000Z"),
      randomSuffix: () => "aabbccdd",
      env: {
        [WORDPRESS_DRAFT_LIVE_ENV_KEYS.enabled]: "true",
        [WORDPRESS_DRAFT_LIVE_ENV_KEYS.liveCallsAllowed]: "true"
      }
    });

    assert.equal(result.ok, true);
    assert.equal(result.phase, "create_and_trash_complete");
    assert.equal(result.wordpressPostId, "9001");
    assert.equal(result.wordpressStatus, "draft");
    assert.equal(result.submitRequestCount, 1);
    assert.equal(result.cleanupSubmitRequestCount, 1);
    assert.equal(result.retryCount, 0);
    assert.equal(result.fallbackUsed, false);
    assert.equal(result.mediaRequestCount, 0);
    assert.equal(result.attemptState, "TRASHED");
    assert.equal(stats.createCount, 1);
    assert.equal(stats.trashCount, 1);
    assert.equal(attempts.size, 1);

    const serialized = JSON.stringify(result);
    assert.equal(serialized.includes("xxxx"), false);
    assert.equal(serialized.includes("Authorization"), false);
    assert.equal(serialized.includes("applicationPassword"), false);

    // Prove Prisma store factory wiring
    const store = createPrismaWordPressDraftLiveAttemptStore(prisma as never);
    const row = await store.get("t-1", result.idempotencyKey!);
    assert.equal(row?.state, "TRASHED");
    assert.equal(row?.wordpressPostId, "9001");
  });
});
