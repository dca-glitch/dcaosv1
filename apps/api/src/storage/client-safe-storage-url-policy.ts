/**
 * Client-safe URL policy for private storage responses.
 * Clients may receive exportUrl / temporary downloadUrl.
 * Clients must never receive storageKey or internal bucket paths.
 * Mocked / future URLs must be truth-labeled so they are not mistaken for live signed URLs.
 */

export type ClientSafeUrlTruthLabel =
  | "export_url"
  | "live_signed"
  | "mocked"
  | "future_placeholder";

export const CLIENT_SAFE_URL_TRUTH_LABELS = [
  "export_url",
  "live_signed",
  "mocked",
  "future_placeholder"
] as const;

export type ClientSafeStorageUrlInput = {
  exportUrl?: string | null;
  downloadUrl?: string | null;
  /** Internal only — stripped from client-safe output. */
  storageKey?: string | null;
  truthLabel: ClientSafeUrlTruthLabel;
};

export type ClientSafeStorageUrlPayload = {
  exportUrl: string | null;
  downloadUrl: string | null;
  hasDocument: boolean;
  truthLabel: ClientSafeUrlTruthLabel;
  /** Always false: building a client-safe payload is not live R2 proof. */
  liveProven: false;
};

const STORAGE_KEY_LEAK_PATTERN = /storageKey|"tenants\//i;

export function isClientSafeUrlTruthLabel(value: unknown): value is ClientSafeUrlTruthLabel {
  return (
    typeof value === "string" &&
    (CLIENT_SAFE_URL_TRUTH_LABELS as readonly string[]).includes(value)
  );
}

export function buildClientSafeStorageUrlPayload(input: ClientSafeStorageUrlInput): ClientSafeStorageUrlPayload {
  if (!isClientSafeUrlTruthLabel(input.truthLabel)) {
    throw new Error("Client-safe storage URL payload requires a valid truthLabel.");
  }

  const exportUrl = input.exportUrl?.trim() ? input.exportUrl.trim() : null;
  const downloadUrl = input.downloadUrl?.trim() ? input.downloadUrl.trim() : null;
  const hasDocument = Boolean(input.storageKey?.trim()) || Boolean(exportUrl) || Boolean(downloadUrl);

  return {
    exportUrl,
    downloadUrl,
    hasDocument,
    truthLabel: input.truthLabel,
    liveProven: false
  };
}

export function isClientSafeStorageUrlPayload(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }

  const serialized = JSON.stringify(value);
  if (STORAGE_KEY_LEAK_PATTERN.test(serialized)) {
    return false;
  }

  if ("storageKey" in value || "documentStorageKey" in value) {
    return false;
  }

  const record = value as Record<string, unknown>;
  if ("truthLabel" in record && !isClientSafeUrlTruthLabel(record.truthLabel)) {
    return false;
  }

  return true;
}

export function assertClientSafeUrlTruthLabel(label: ClientSafeUrlTruthLabel): {
  mayImplyLiveSignedUrl: boolean;
  requiresExplicitNonLiveLabel: boolean;
  /** Mocked / future / export labels must never be reported as live-proven. */
  liveProvenImplied: false | true;
} {
  if (label === "live_signed") {
    return {
      mayImplyLiveSignedUrl: true,
      requiresExplicitNonLiveLabel: false,
      liveProvenImplied: true
    };
  }

  return {
    mayImplyLiveSignedUrl: false,
    requiresExplicitNonLiveLabel: true,
    liveProvenImplied: false
  };
}

/**
 * Hardening: mocked / future_placeholder / export_url must never be treated as live signed proof.
 */
export function assertNonLiveClientSafeUrlLabel(label: ClientSafeUrlTruthLabel): {
  ok: boolean;
  reason: string;
} {
  const decision = assertClientSafeUrlTruthLabel(label);
  if (decision.mayImplyLiveSignedUrl) {
    return {
      ok: false,
      reason: `Truth label "${label}" may imply a live signed URL; use only when IO actually issued a signed URL.`
    };
  }
  return {
    ok: true,
    reason: `Truth label "${label}" is explicitly non-live.`
  };
}

/**
 * G477 — Truth-label matrix for client-safe storage URLs (no live IO).
 * Documents which labels may imply a live signed URL vs explicit non-live labels.
 */
export function toClientSafeUrlTruthLabelMatrix(): Array<{
  truthLabel: ClientSafeUrlTruthLabel;
  mayImplyLiveSignedUrl: boolean;
  requiresExplicitNonLiveLabel: boolean;
  liveProvenImplied: boolean;
  nonLiveAssertOk: boolean;
}> {
  return CLIENT_SAFE_URL_TRUTH_LABELS.map((truthLabel) => {
    const decision = assertClientSafeUrlTruthLabel(truthLabel);
    const nonLive = assertNonLiveClientSafeUrlLabel(truthLabel);
    return {
      truthLabel,
      mayImplyLiveSignedUrl: decision.mayImplyLiveSignedUrl,
      requiresExplicitNonLiveLabel: decision.requiresExplicitNonLiveLabel,
      liveProvenImplied: decision.liveProvenImplied === true,
      nonLiveAssertOk: nonLive.ok
    };
  });
}

/**
 * Snapshot of a client-safe URL payload — never includes storageKey values.
 */
export function toClientSafeStorageUrlPayloadSnapshot(
  payload: ClientSafeStorageUrlPayload
): {
  hasExportUrl: boolean;
  hasDownloadUrl: boolean;
  hasDocument: boolean;
  truthLabel: ClientSafeUrlTruthLabel;
  liveProven: false;
  containsStorageKeyField: false;
} {
  return {
    hasExportUrl: Boolean(payload.exportUrl),
    hasDownloadUrl: Boolean(payload.downloadUrl),
    hasDocument: payload.hasDocument,
    truthLabel: payload.truthLabel,
    liveProven: false,
    containsStorageKeyField: false
  };
}
