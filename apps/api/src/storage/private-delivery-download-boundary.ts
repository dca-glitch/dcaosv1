/**
 * Private delivery / download boundary helpers (G485–G489).
 * Design + pure helpers only — no R2 IO, no secrets, no live signed URLs.
 */

import {
  CLIENT_ALLOWED_STORAGE_FIELDS,
  CLIENT_FORBIDDEN_STORAGE_FIELDS,
  ADMIN_STORAGE_FIELDS
} from "./admin-vs-client-storage-field-policy";
import {
  assertNonLiveClientSafeUrlLabel,
  buildClientSafeStorageUrlPayload,
  type ClientSafeUrlTruthLabel
} from "./client-safe-storage-url-policy";
import {
  containsUnsafeStorageErrorContent,
  redactStorageErrorMessage,
  type RedactedStorageError
} from "./storage-error-redaction";
import { assertNoStorageKeyLeak } from "./storage-key-boundary";

/** G485 — Admin-only private fields inventory (presence flags / names only). */
export const ADMIN_ONLY_PRIVATE_STORAGE_FIELDS = [
  "storageKey",
  "documentStorageKey"
] as const;

export type AdminOnlyPrivateStorageField = (typeof ADMIN_ONLY_PRIVATE_STORAGE_FIELDS)[number];

export type AdminPrivateFieldInventoryEntry = {
  field: AdminOnlyPrivateStorageField;
  audience: "admin";
  clientForbidden: true;
  purpose: string;
  /** Never include raw values in inventory snapshots. */
  valueExposed: false;
};

export const ADMIN_PRIVATE_FIELD_INVENTORY: readonly AdminPrivateFieldInventoryEntry[] = [
  {
    field: "storageKey",
    audience: "admin",
    clientForbidden: true,
    purpose: "Internal object key for private R2 / future signed download issuance.",
    valueExposed: false
  },
  {
    field: "documentStorageKey",
    audience: "admin",
    clientForbidden: true,
    purpose: "Finance/admin document key; download via signed reference only.",
    valueExposed: false
  }
] as const;

export function listAdminOnlyPrivateStorageFields(): readonly AdminOnlyPrivateStorageField[] {
  return ADMIN_ONLY_PRIVATE_STORAGE_FIELDS;
}

export function isAdminOnlyPrivateStorageField(field: string): boolean {
  return (ADMIN_ONLY_PRIVATE_STORAGE_FIELDS as readonly string[]).includes(field);
}

export function toAdminPrivateFieldInventorySnapshot(): {
  fields: readonly AdminOnlyPrivateStorageField[];
  clientForbiddenFields: readonly string[];
  clientAllowedFields: readonly string[];
  adminMayInclude: readonly string[];
  liveProven: false;
} {
  return {
    fields: ADMIN_ONLY_PRIVATE_STORAGE_FIELDS,
    clientForbiddenFields: CLIENT_FORBIDDEN_STORAGE_FIELDS,
    clientAllowedFields: CLIENT_ALLOWED_STORAGE_FIELDS,
    adminMayInclude: ADMIN_STORAGE_FIELDS,
    liveProven: false
  };
}

/** G486 — Client-safe download future proof stages (planning labels only). */
export type ClientSafeDownloadProofStage =
  | "local_mock_download"
  | "export_url_only"
  | "disabled_safe_null_reference"
  | "future_signed_url_issuance"
  | "future_live_bucket_proof";

export type ClientSafeDownloadProofStagePlan = {
  stage: ClientSafeDownloadProofStage;
  label: string;
  liveIoAllowed: boolean;
  /** Building a stage plan never performs IO. */
  liveIoPerformed: false;
  claimsLiveBucketProof: false;
  clientSafe: boolean;
  truthLabel: ClientSafeUrlTruthLabel;
  purpose: string;
};

const DOWNLOAD_PROOF_STAGE_PLANS: Record<ClientSafeDownloadProofStage, Omit<ClientSafeDownloadProofStagePlan, "stage">> =
  {
    local_mock_download: {
      label: "Local mock download",
      liveIoAllowed: false,
      liveIoPerformed: false,
      claimsLiveBucketProof: false,
      clientSafe: true,
      truthLabel: "mocked",
      purpose: "Exercise client-safe download payload shape with mocked URLs only."
    },
    export_url_only: {
      label: "Export URL only",
      liveIoAllowed: false,
      liveIoPerformed: false,
      claimsLiveBucketProof: false,
      clientSafe: true,
      truthLabel: "export_url",
      purpose: "Return operator-provided exportUrl without issuing signed storage URLs."
    },
    disabled_safe_null_reference: {
      label: "Disabled-safe null reference",
      liveIoAllowed: false,
      liveIoPerformed: false,
      claimsLiveBucketProof: false,
      clientSafe: true,
      truthLabel: "mocked",
      purpose: "When private storage is disabled, return null download reference without leaking keys."
    },
    future_signed_url_issuance: {
      label: "Future signed URL issuance",
      liveIoAllowed: false,
      liveIoPerformed: false,
      claimsLiveBucketProof: false,
      clientSafe: true,
      truthLabel: "future_placeholder",
      purpose: "Plan owner-approved signed URL issuance; do not execute in this lane."
    },
    future_live_bucket_proof: {
      label: "Future live bucket proof",
      liveIoAllowed: false,
      liveIoPerformed: false,
      claimsLiveBucketProof: false,
      clientSafe: true,
      truthLabel: "future_placeholder",
      purpose: "Deferred real R2 signed-URL proof; requires separate owner gate and cleanup plan."
    }
  };

export const CLIENT_SAFE_DOWNLOAD_PROOF_STAGES = Object.keys(
  DOWNLOAD_PROOF_STAGE_PLANS
) as ClientSafeDownloadProofStage[];

export function isClientSafeDownloadProofStage(value: unknown): value is ClientSafeDownloadProofStage {
  return (
    typeof value === "string" &&
    (CLIENT_SAFE_DOWNLOAD_PROOF_STAGES as readonly string[]).includes(value)
  );
}

export function buildClientSafeDownloadProofStagePlan(
  stage: ClientSafeDownloadProofStage
): ClientSafeDownloadProofStagePlan {
  const plan = DOWNLOAD_PROOF_STAGE_PLANS[stage];
  return {
    stage,
    ...plan
  };
}

export function listClientSafeDownloadProofStagePlans(): ClientSafeDownloadProofStagePlan[] {
  return CLIENT_SAFE_DOWNLOAD_PROOF_STAGES.map(buildClientSafeDownloadProofStagePlan);
}

/** G487 — Local mock download truth labels. */
export type LocalMockDownloadTruth = {
  truthLabel: "mocked";
  downloadUrl: string | null;
  exportUrl: string | null;
  hasDocument: boolean;
  liveProven: false;
  mayImplyLiveSignedUrl: false;
};

export function buildLocalMockDownloadTruth(input: {
  downloadUrl?: string | null;
  exportUrl?: string | null;
  storageKeyPresent?: boolean;
}): LocalMockDownloadTruth {
  const payload = buildClientSafeStorageUrlPayload({
    downloadUrl: input.downloadUrl ?? "https://mock.local/private-delivery/fixture",
    exportUrl: input.exportUrl ?? null,
    storageKey: input.storageKeyPresent ? "tenants/mock/internal-only.pdf" : null,
    truthLabel: "mocked"
  });

  const nonLive = assertNonLiveClientSafeUrlLabel("mocked");
  if (!nonLive.ok) {
    throw new Error(nonLive.reason);
  }

  assertNoStorageKeyLeak(payload);

  return {
    truthLabel: "mocked",
    downloadUrl: payload.downloadUrl,
    exportUrl: payload.exportUrl,
    hasDocument: payload.hasDocument,
    liveProven: false,
    mayImplyLiveSignedUrl: false
  };
}

/** G488 — Error payload redaction for download failures. */
export type DownloadFailureClientError = {
  error: {
    code: "DOWNLOAD_FAILED";
    message: string;
  };
  redacted: true;
  liveProven: false;
  /** Never include storageKey on download failure payloads. */
  storageKeyExposed: false;
};

export function buildDownloadFailureClientError(raw: unknown): DownloadFailureClientError {
  const redacted: RedactedStorageError = redactStorageErrorMessage(
    raw,
    "Download failed. Please try again or contact support."
  );

  if (containsUnsafeStorageErrorContent(redacted.message)) {
    return {
      error: {
        code: "DOWNLOAD_FAILED",
        message: "Download failed. Please try again or contact support."
      },
      redacted: true,
      liveProven: false,
      storageKeyExposed: false
    };
  }

  return {
    error: {
      code: "DOWNLOAD_FAILED",
      message: redacted.message
    },
    redacted: true,
    liveProven: false,
    storageKeyExposed: false
  };
}

/** G489 — Audit-safe download metadata design (no raw keys / secrets). */
export type AuditSafeDownloadMetadata = {
  event: "private_delivery_download";
  audience: "client" | "admin";
  entityType: "deliverable" | "monthly_report" | "image_asset" | "generic_document";
  entityId: string;
  tenantIdHash: string;
  hasDocument: boolean;
  truthLabel: ClientSafeUrlTruthLabel;
  expiresSeconds: number | null;
  outcome: "issued" | "denied" | "disabled" | "failed";
  /** Always false for design helper — not live proof. */
  liveProven: false;
  storageKeyPresent: boolean;
};

export type AuditSafeDownloadMetadataInput = {
  audience: "client" | "admin";
  entityType: AuditSafeDownloadMetadata["entityType"];
  entityId: string;
  /** Opaque tenant identifier hash or slug hash — never a secret. */
  tenantIdHash: string;
  hasDocument: boolean;
  truthLabel: ClientSafeUrlTruthLabel;
  expiresSeconds?: number | null;
  outcome: AuditSafeDownloadMetadata["outcome"];
  storageKeyPresent?: boolean;
};

/**
 * Builds audit-safe download metadata. Rejects inputs that attempt to pass storageKey.
 */
export function buildAuditSafeDownloadMetadata(
  input: AuditSafeDownloadMetadataInput & { storageKey?: unknown }
): AuditSafeDownloadMetadata {
  if ("storageKey" in input && input.storageKey !== undefined) {
    throw new Error("Audit-safe download metadata must not include storageKey.");
  }

  const metadata: AuditSafeDownloadMetadata = {
    event: "private_delivery_download",
    audience: input.audience,
    entityType: input.entityType,
    entityId: input.entityId,
    tenantIdHash: input.tenantIdHash,
    hasDocument: input.hasDocument,
    truthLabel: input.truthLabel,
    expiresSeconds: input.expiresSeconds ?? null,
    outcome: input.outcome,
    liveProven: false,
    storageKeyPresent: Boolean(input.storageKeyPresent)
  };

  assertNoStorageKeyLeak(metadata);
  return metadata;
}

export function isAuditSafeDownloadMetadata(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  if ("storageKey" in value && (value as { storageKey?: unknown }).storageKey !== undefined) {
    return false;
  }
  try {
    assertNoStorageKeyLeak(value);
  } catch {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    record.event === "private_delivery_download" &&
    record.liveProven === false &&
    typeof record.entityId === "string" &&
    typeof record.tenantIdHash === "string"
  );
}
