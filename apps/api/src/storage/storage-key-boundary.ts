/**
 * Shared storageKey leak assertions for client-safe serializer boundary tests.
 * Pure helpers only — no R2 IO.
 */

const STORAGE_KEY_FIELD = "storageKey";
const DOCUMENT_STORAGE_KEY_FIELD = "documentStorageKey";
const TENANT_KEY_PATH_PATTERN = /tenants\/[^\s"]+/i;

export function serializedContainsStorageKeyField(value: unknown): boolean {
  const serialized = JSON.stringify(value);
  return (
    serialized.includes(`"${STORAGE_KEY_FIELD}"`) ||
    serialized.includes(`"${DOCUMENT_STORAGE_KEY_FIELD}"`)
  );
}

export function serializedContainsTenantStoragePath(value: unknown, storageKey: string): boolean {
  const serialized = JSON.stringify(value);
  return serialized.includes(storageKey) || TENANT_KEY_PATH_PATTERN.test(serialized);
}

export function collectForbiddenStorageKeyFields(value: unknown): string[] {
  const found = new Set<string>();

  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") {
      return;
    }
    if (Array.isArray(node)) {
      for (const entry of node) {
        walk(entry);
      }
      return;
    }
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      if (key === STORAGE_KEY_FIELD || key === DOCUMENT_STORAGE_KEY_FIELD) {
        found.add(key);
      }
      walk(child);
    }
  };

  walk(value);
  return [...found].sort();
}

export function assertNoStorageKeyLeak(
  value: unknown,
  options: { forbiddenStorageKey?: string | null } = {}
): void {
  const leakedFields = collectForbiddenStorageKeyFields(value);
  if (leakedFields.length > 0) {
    throw new Error(
      `Client-safe payload must not include storage key fields: ${leakedFields.join(", ")}`
    );
  }

  if (serializedContainsStorageKeyField(value)) {
    throw new Error("Client-safe payload must not include storageKey field");
  }

  const forbidden = options.forbiddenStorageKey?.trim();
  if (forbidden && JSON.stringify(value).includes(forbidden)) {
    throw new Error("Client-safe payload must not include raw storageKey value");
  }
}

/**
 * Snapshot helper for boundary tests — boolean leak flags only, never the key value.
 */
export function toStorageKeyBoundarySnapshot(
  value: unknown,
  forbiddenStorageKey?: string | null
): {
  hasStorageKeyField: boolean;
  hasDocumentStorageKeyField: boolean;
  containsForbiddenKeyValue: boolean;
  liveProven: false;
} {
  const fields = collectForbiddenStorageKeyFields(value);
  const forbidden = forbiddenStorageKey?.trim() ?? "";
  return {
    hasStorageKeyField: fields.includes(STORAGE_KEY_FIELD),
    hasDocumentStorageKeyField: fields.includes(DOCUMENT_STORAGE_KEY_FIELD),
    containsForbiddenKeyValue: Boolean(forbidden) && JSON.stringify(value).includes(forbidden),
    liveProven: false
  };
}
