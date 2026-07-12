/**
 * In-memory WordPress draft live-attempt store for unit/smoke tests.
 * Prisma-backed store is available for runtime; tests must not require DB.
 */

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
