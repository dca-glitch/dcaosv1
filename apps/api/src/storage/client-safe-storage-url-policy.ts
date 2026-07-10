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
};

const STORAGE_KEY_LEAK_PATTERN = /storageKey|"tenants\//i;

export function buildClientSafeStorageUrlPayload(input: ClientSafeStorageUrlInput): ClientSafeStorageUrlPayload {
  const exportUrl = input.exportUrl?.trim() ? input.exportUrl.trim() : null;
  const downloadUrl = input.downloadUrl?.trim() ? input.downloadUrl.trim() : null;
  const hasDocument = Boolean(input.storageKey?.trim()) || Boolean(exportUrl) || Boolean(downloadUrl);

  return {
    exportUrl,
    downloadUrl,
    hasDocument,
    truthLabel: input.truthLabel
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

  if ("storageKey" in value) {
    return false;
  }

  return true;
}

export function assertClientSafeUrlTruthLabel(label: ClientSafeUrlTruthLabel): {
  mayImplyLiveSignedUrl: boolean;
  requiresExplicitNonLiveLabel: boolean;
} {
  if (label === "live_signed") {
    return { mayImplyLiveSignedUrl: true, requiresExplicitNonLiveLabel: false };
  }

  return { mayImplyLiveSignedUrl: false, requiresExplicitNonLiveLabel: true };
}
