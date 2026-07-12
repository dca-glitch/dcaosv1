/**
 * WordPress draft live-attempt store.
 * Memory store: unit/smoke tests (no DB).
 * Prisma store: staging/runtime proof harness only.
 */

import type { createPrismaClient } from "../../../../packages/data/src/client";

export type WordPressDraftLiveAttemptState =
  | "NOT_STARTED"
  | "REQUEST_STARTED"
  | "COMPLETED"
  | "AMBIGUOUS"
  | "FAILED_BEFORE_REQUEST"
  | "TRASHED";

export type WordPressDraftLiveAttemptRecord = {
  tenantId: string;
  publicationTargetId: string | null;
  idempotencyKey: string;
  marker: string | null;
  state: WordPressDraftLiveAttemptState;
  wordpressPostId: string | null;
  safeError: string | null;
  submitRequestCount: number;
};

export interface WordPressDraftLiveAttemptStore {
  get(tenantId: string, idempotencyKey: string): Promise<WordPressDraftLiveAttemptRecord | null>;
  upsert(record: WordPressDraftLiveAttemptRecord): Promise<WordPressDraftLiveAttemptRecord>;
  getByPostId(tenantId: string, wordpressPostId: string): Promise<WordPressDraftLiveAttemptRecord | null>;
}

type PrismaClientLike = ReturnType<typeof createPrismaClient>;

function toRecord(row: {
  tenantId: string;
  publicationTargetId: string | null;
  idempotencyKey: string;
  marker: string | null;
  state: string;
  wordpressPostId: string | null;
  safeError: string | null;
  submitRequestCount: number;
}): WordPressDraftLiveAttemptRecord {
  return {
    tenantId: row.tenantId,
    publicationTargetId: row.publicationTargetId,
    idempotencyKey: row.idempotencyKey,
    marker: row.marker,
    state: row.state as WordPressDraftLiveAttemptState,
    wordpressPostId: row.wordpressPostId,
    safeError: row.safeError,
    submitRequestCount: row.submitRequestCount
  };
}

export function createMemoryWordPressDraftLiveAttemptStore(): WordPressDraftLiveAttemptStore {
  const map = new Map<string, WordPressDraftLiveAttemptRecord>();
  const keyOf = (tenantId: string, idempotencyKey: string) => `${tenantId}::${idempotencyKey}`;

  return {
    async get(tenantId, idempotencyKey) {
      return map.get(keyOf(tenantId, idempotencyKey)) ?? null;
    },
    async upsert(record) {
      const next = { ...record };
      map.set(keyOf(record.tenantId, record.idempotencyKey), next);
      return next;
    },
    async getByPostId(tenantId, wordpressPostId) {
      for (const row of map.values()) {
        if (row.tenantId === tenantId && row.wordpressPostId === wordpressPostId) {
          return row;
        }
      }
      return null;
    }
  };
}

/**
 * Prisma-backed attempt store for staging live proof.
 * Inject a Prisma client so tests can mock without a real DB.
 */
export function createPrismaWordPressDraftLiveAttemptStore(
  prisma: PrismaClientLike
): WordPressDraftLiveAttemptStore {
  return {
    async get(tenantId, idempotencyKey) {
      const row = await prisma.wordPressDraftLiveAttempt.findUnique({
        where: {
          tenantId_idempotencyKey: { tenantId, idempotencyKey }
        }
      });
      return row ? toRecord(row) : null;
    },
    async upsert(record) {
      const row = await prisma.wordPressDraftLiveAttempt.upsert({
        where: {
          tenantId_idempotencyKey: {
            tenantId: record.tenantId,
            idempotencyKey: record.idempotencyKey
          }
        },
        create: {
          tenantId: record.tenantId,
          publicationTargetId: record.publicationTargetId,
          idempotencyKey: record.idempotencyKey,
          marker: record.marker,
          state: record.state,
          wordpressPostId: record.wordpressPostId,
          safeError: record.safeError,
          submitRequestCount: record.submitRequestCount
        },
        update: {
          publicationTargetId: record.publicationTargetId,
          marker: record.marker,
          state: record.state,
          wordpressPostId: record.wordpressPostId,
          safeError: record.safeError,
          submitRequestCount: record.submitRequestCount
        }
      });
      return toRecord(row);
    },
    async getByPostId(tenantId, wordpressPostId) {
      const row = await prisma.wordPressDraftLiveAttempt.findFirst({
        where: { tenantId, wordpressPostId }
      });
      return row ? toRecord(row) : null;
    }
  };
}
