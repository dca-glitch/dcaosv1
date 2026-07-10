import { getR2Config, getR2EnvPresence, R2_REQUIRED_ENV_KEYS } from "./r2.config";
import { getSignedR2ReadUrl, uploadR2Object, type R2DocumentType } from "./r2.service";
import {
  buildDownloadFailureClientError,
  buildLocalMockDownloadTruth,
  type DownloadFailureClientError,
  type LocalMockDownloadTruth
} from "./private-delivery-download-boundary";
import type { ClientSafeUrlTruthLabel } from "./client-safe-storage-url-policy";

export type PrivateStorageNamespace =
  | "invoice-document"
  | "bill-document"
  | "credit-note-document"
  | "ai-delivery-deliverable"
  | "ai-delivery-asset"
  | "ai-delivery-report"
  | "finance-report"
  | "generic-document";

export interface PrivateStorageStatus {
  configured: boolean;
  missingEnvKeys: string[];
  mode: "disabled" | "private-r2";
  provider: "r2";
  requiredEnvPresent: boolean;
}

export interface PutPrivateStorageObjectInput {
  body: Buffer;
  documentDate?: Date | null;
  mimeType: string;
  namespace: PrivateStorageNamespace;
  originalFileName: string;
  projectSlugOrId?: string | null;
  tenantSlugOrId: string;
}

export interface PutPrivateStorageObjectResult {
  provider: "r2";
  storageKey: string;
}

export interface PrivateStorageDownloadReference {
  downloadUrl: string;
  expiresSeconds: number;
  provider: "r2";
}

/** Client-facing download reference — never includes storageKey. */
export interface PrivateStorageClientDownloadReference {
  downloadUrl: string | null;
  expiresSeconds: number | null;
  provider: "r2" | "mock";
  truthLabel: ClientSafeUrlTruthLabel;
  hasDocument: boolean;
  liveProven: false;
}

const DEFAULT_DOWNLOAD_EXPIRY_SECONDS = 300;
const LOCAL_MOCK_DOWNLOAD_URL = "https://mock.local/private-storage/download-fixture";

function getDocumentType(namespace: PrivateStorageNamespace): R2DocumentType {
  if (namespace === "invoice-document") {
    return "invoices";
  }

  if (namespace === "bill-document") {
    return "bills";
  }

  if (namespace === "ai-delivery-asset" || namespace === "ai-delivery-report" || namespace === "finance-report") {
    return "documents";
  }

  return "documents";
}

function getFileNamePrefix(namespace: PrivateStorageNamespace): string {
  switch (namespace) {
    case "credit-note-document":
      return "credit-note";
    case "ai-delivery-deliverable":
      return "deliverable";
    case "ai-delivery-report":
      return "report";
    case "finance-report":
      return "finance-report";
    case "ai-delivery-asset":
      return "asset";
    case "generic-document":
      return "document";
    default:
      return "";
  }
}

function getMissingStorageEnvKeys() {
  const presence = getR2EnvPresence();
  return R2_REQUIRED_ENV_KEYS.filter((key) => !presence[key]);
}

function hasAnyRequiredStorageEnvKey() {
  const presence = getR2EnvPresence();
  return R2_REQUIRED_ENV_KEYS.some((key) => presence[key]);
}

function prefixFileName(fileName: string, namespace: PrivateStorageNamespace): string {
  const prefix = getFileNamePrefix(namespace);
  return prefix ? `${prefix}-${fileName}` : fileName;
}

export function getPrivateStorageStatus(): PrivateStorageStatus {
  const configured = Boolean(getR2Config());

  return {
    configured,
    missingEnvKeys: configured ? [] : getMissingStorageEnvKeys(),
    mode: configured ? "private-r2" : "disabled",
    provider: "r2",
    requiredEnvPresent: configured || hasAnyRequiredStorageEnvKey()
  };
}

export async function putPrivateStorageObject(
  input: PutPrivateStorageObjectInput
): Promise<PutPrivateStorageObjectResult | null> {
  if (!getR2Config()) {
    return null;
  }

  const upload = await uploadR2Object({
    body: input.body,
    documentDate: input.documentDate,
    documentType: getDocumentType(input.namespace),
    mimeType: input.mimeType,
    originalFileName: prefixFileName(input.originalFileName, input.namespace),
    projectSlugOrId: input.projectSlugOrId ?? null,
    tenantSlugOrId: input.tenantSlugOrId
  });

  return {
    provider: "r2",
    storageKey: upload.storageKey
  };
}

export function getPrivateStorageDownloadReference(
  storageKey: string,
  expiresSeconds = DEFAULT_DOWNLOAD_EXPIRY_SECONDS
): PrivateStorageDownloadReference | null {
  if (!storageKey?.trim()) {
    return null;
  }

  const downloadUrl = getSignedR2ReadUrl(storageKey, expiresSeconds);
  if (!downloadUrl) {
    return null;
  }

  return {
    downloadUrl,
    expiresSeconds,
    provider: "r2"
  };
}

/**
 * G487 — Local mock client download reference with explicit non-live truth label.
 * Never performs R2 IO and never returns storageKey.
 */
export function getPrivateStorageLocalMockDownloadReference(input: {
  storageKeyPresent?: boolean;
  exportUrl?: string | null;
}): PrivateStorageClientDownloadReference {
  const mock: LocalMockDownloadTruth = buildLocalMockDownloadTruth({
    downloadUrl: LOCAL_MOCK_DOWNLOAD_URL,
    exportUrl: input.exportUrl ?? null,
    storageKeyPresent: Boolean(input.storageKeyPresent)
  });

  return {
    downloadUrl: mock.downloadUrl,
    expiresSeconds: null,
    provider: "mock",
    truthLabel: mock.truthLabel,
    hasDocument: mock.hasDocument,
    liveProven: false
  };
}

/**
 * Disabled-safe client download boundary: when storage is not configured,
 * return a null-URL client reference labeled mocked (not live_signed).
 * Does not call R2 and does not echo storageKey.
 */
export function getPrivateStorageClientDownloadBoundary(input: {
  storageKey?: string | null;
  exportUrl?: string | null;
}): PrivateStorageClientDownloadReference | null {
  const key = input.storageKey?.trim() ?? "";
  const status = getPrivateStorageStatus();

  if (!key) {
    if (input.exportUrl?.trim()) {
      return {
        downloadUrl: null,
        expiresSeconds: null,
        provider: "mock",
        truthLabel: "export_url",
        hasDocument: true,
        liveProven: false
      };
    }
    return null;
  }

  if (!status.configured) {
    return getPrivateStorageLocalMockDownloadReference({
      storageKeyPresent: true,
      exportUrl: input.exportUrl ?? null
    });
  }

  // Configured path still does not auto-issue live signed URLs from this helper —
  // live issuance remains behind getPrivateStorageDownloadReference + owner gates.
  return {
    downloadUrl: null,
    expiresSeconds: null,
    provider: "r2",
    truthLabel: "future_placeholder",
    hasDocument: true,
    liveProven: false
  };
}

/**
 * G488 — Client-safe download failure payload (redacted).
 */
export function toPrivateStorageDownloadFailurePayload(raw: unknown): DownloadFailureClientError {
  return buildDownloadFailureClientError(raw);
}
