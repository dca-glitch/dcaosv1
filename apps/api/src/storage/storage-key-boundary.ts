/**
 * Shared storageKey leak assertions for client-safe serializer boundary tests.
 * Pure helpers only — no R2 IO.
 */

const STORAGE_KEY_FIELD = "storageKey";
const TENANT_KEY_PATH_PATTERN = /tenants\/[^\s"]+/i;

export function serializedContainsStorageKeyField(value: unknown): boolean {
  return JSON.stringify(value).includes(`"${STORAGE_KEY_FIELD}"`);
}

export function serializedContainsTenantStoragePath(value: unknown, storageKey: string): boolean {
  const serialized = JSON.stringify(value);
  return serialized.includes(storageKey) || TENANT_KEY_PATH_PATTERN.test(serialized);
}

export function assertNoStorageKeyLeak(
  value: unknown,
  options: { forbiddenStorageKey?: string | null } = {}
): void {
  if (serializedContainsStorageKeyField(value)) {
    throw new Error("Client-safe payload must not include storageKey field");
  }

  const forbidden = options.forbiddenStorageKey?.trim();
  if (forbidden && JSON.stringify(value).includes(forbidden)) {
    throw new Error("Client-safe payload must not include raw storageKey value");
  }
}
