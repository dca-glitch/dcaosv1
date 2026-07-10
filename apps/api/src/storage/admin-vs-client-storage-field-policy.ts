/**
 * Admin vs client storage field policy — which fields may appear on which surface.
 * Pure policy constants + helpers. No R2 IO.
 * G476 — expanded admin-only fields + policy snapshot helper.
 */

export const ADMIN_STORAGE_FIELDS = [
  "storageKey",
  "documentStorageKey",
  "exportUrl",
  "downloadUrl",
  "downloadReference",
  "hasDocument",
  "expiresSeconds",
  "publicUrl",
  "bucketName",
  "objectEtag"
] as const;

export const CLIENT_ALLOWED_STORAGE_FIELDS = [
  "exportUrl",
  "downloadUrl",
  "downloadReference",
  "hasDocument",
  "expiresSeconds",
  "truthLabel"
] as const;

export const CLIENT_FORBIDDEN_STORAGE_FIELDS = [
  "storageKey",
  "documentStorageKey",
  "publicUrl",
  "bucketName",
  "objectEtag"
] as const;

export type StorageAudience = "admin" | "client";

export type StorageFieldPolicyDecision = {
  audience: StorageAudience;
  field: string;
  allowed: boolean;
  reason: string;
};

export function isClientForbiddenStorageField(field: string): boolean {
  return (CLIENT_FORBIDDEN_STORAGE_FIELDS as readonly string[]).includes(field);
}

export function isClientAllowedStorageField(field: string): boolean {
  return (CLIENT_ALLOWED_STORAGE_FIELDS as readonly string[]).includes(field);
}

export function isAdminStorageField(field: string): boolean {
  return (ADMIN_STORAGE_FIELDS as readonly string[]).includes(field);
}

export function evaluateStorageFieldPolicy(
  audience: StorageAudience,
  field: string
): StorageFieldPolicyDecision {
  if (audience === "admin") {
    return {
      audience,
      field,
      allowed: true,
      reason: "Admin surfaces may include internal storage fields for operator tooling."
    };
  }

  if (isClientForbiddenStorageField(field)) {
    return {
      audience,
      field,
      allowed: false,
      reason: "Client surfaces must never receive storageKey, documentStorageKey, or admin-only storage metadata."
    };
  }

  if (isClientAllowedStorageField(field)) {
    return {
      audience,
      field,
      allowed: true,
      reason: "Client surfaces may receive export/download URLs and hasDocument only."
    };
  }

  return {
    audience,
    field,
    allowed: false,
    reason: "Unknown storage field is denied on client surfaces by default."
  };
}

/**
 * Returns true when a payload object has no client-forbidden storage fields.
 */
export function payloadRespectsClientStorageFieldPolicy(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return true;
  }

  const walk = (node: unknown): boolean => {
    if (!node || typeof node !== "object") {
      return true;
    }
    if (Array.isArray(node)) {
      return node.every(walk);
    }
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      if (isClientForbiddenStorageField(key)) {
        return false;
      }
      if (!walk(child)) {
        return false;
      }
    }
    return true;
  };

  return walk(value);
}

/**
 * Snapshot of field-policy decisions for tests/docs — field names only, never values.
 */
export function toAdminVsClientStorageFieldPolicySnapshot(): {
  clientAllowedFields: readonly string[];
  clientForbiddenFields: readonly string[];
  adminFields: readonly string[];
  liveProven: false;
  clientStorageKeyAllowed: false;
  clientDocumentStorageKeyAllowed: false;
} {
  return {
    clientAllowedFields: CLIENT_ALLOWED_STORAGE_FIELDS,
    clientForbiddenFields: CLIENT_FORBIDDEN_STORAGE_FIELDS,
    adminFields: ADMIN_STORAGE_FIELDS,
    liveProven: false,
    clientStorageKeyAllowed: false,
    clientDocumentStorageKeyAllowed: false
  };
}
