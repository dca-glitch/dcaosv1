/**
 * G481 — ExportUrl allowed vs storageKey forbidden matrix.
 * Pure policy table for private delivery / client portal surfaces.
 * No R2 IO. Never invents live signed URLs.
 */

export type ExportUrlMatrixAudience = "client" | "admin";

export type ExportUrlMatrixSurface =
  | "client_portal_deliverable_summary"
  | "client_portal_monthly_report_summary"
  | "client_portal_image_summary"
  | "client_portal_download_reference"
  | "admin_deliverable_summary"
  | "admin_monthly_report_summary"
  | "admin_image_summary"
  | "admin_download_reference";

export type ExportUrlMatrixField =
  | "exportUrl"
  | "downloadUrl"
  | "downloadReference"
  | "hasDocument"
  | "expiresSeconds"
  | "truthLabel"
  | "storageKey"
  | "documentStorageKey";

export type ExportUrlMatrixDecision = {
  surface: ExportUrlMatrixSurface;
  audience: ExportUrlMatrixAudience;
  field: ExportUrlMatrixField;
  allowed: boolean;
  reason: string;
};

const CLIENT_SURFACES: readonly ExportUrlMatrixSurface[] = [
  "client_portal_deliverable_summary",
  "client_portal_monthly_report_summary",
  "client_portal_image_summary",
  "client_portal_download_reference"
] as const;

const ADMIN_SURFACES: readonly ExportUrlMatrixSurface[] = [
  "admin_deliverable_summary",
  "admin_monthly_report_summary",
  "admin_image_summary",
  "admin_download_reference"
] as const;

/** Client: exportUrl / download URLs / hasDocument allowed; storageKey always forbidden. */
const CLIENT_FIELD_POLICY: Record<ExportUrlMatrixField, boolean> = {
  exportUrl: true,
  downloadUrl: true,
  downloadReference: true,
  hasDocument: true,
  expiresSeconds: true,
  truthLabel: true,
  storageKey: false,
  documentStorageKey: false
};

/** Admin: may include internal storage keys for operator tooling. */
const ADMIN_FIELD_POLICY: Record<ExportUrlMatrixField, boolean> = {
  exportUrl: true,
  downloadUrl: true,
  downloadReference: true,
  hasDocument: true,
  expiresSeconds: true,
  truthLabel: true,
  storageKey: true,
  documentStorageKey: true
};

const FIELD_REASONS: Record<ExportUrlMatrixField, { allowed: string; forbidden: string }> = {
  exportUrl: {
    allowed: "Client-safe operator-provided export URL may be returned.",
    forbidden: "exportUrl is not permitted on this surface."
  },
  downloadUrl: {
    allowed: "Temporary download URL may be returned when issued by a download reference.",
    forbidden: "downloadUrl is not permitted on this surface."
  },
  downloadReference: {
    allowed: "Signed or mock download reference object may be returned without storageKey.",
    forbidden: "downloadReference is not permitted on this surface."
  },
  hasDocument: {
    allowed: "Boolean document presence flag is client-safe.",
    forbidden: "hasDocument is not permitted on this surface."
  },
  expiresSeconds: {
    allowed: "Download expiry metadata is client-safe.",
    forbidden: "expiresSeconds is not permitted on this surface."
  },
  truthLabel: {
    allowed: "Truth labels distinguish mocked / export / live_signed URLs.",
    forbidden: "truthLabel is not permitted on this surface."
  },
  storageKey: {
    allowed: "Admin surfaces may include storageKey for operator tooling.",
    forbidden: "Client surfaces must never receive storageKey."
  },
  documentStorageKey: {
    allowed: "Admin surfaces may include documentStorageKey for operator tooling.",
    forbidden: "Client surfaces must never receive documentStorageKey."
  }
};

export const EXPORT_URL_ALLOWED_FIELDS = (
  Object.entries(CLIENT_FIELD_POLICY)
    .filter(([, allowed]) => allowed)
    .map(([field]) => field) as ExportUrlMatrixField[]
).sort();

export const STORAGE_KEY_FORBIDDEN_FIELDS = (
  Object.entries(CLIENT_FIELD_POLICY)
    .filter(([, allowed]) => !allowed)
    .map(([field]) => field) as ExportUrlMatrixField[]
).sort();

export function isExportUrlMatrixSurface(value: unknown): value is ExportUrlMatrixSurface {
  return (
    typeof value === "string" &&
    ([...CLIENT_SURFACES, ...ADMIN_SURFACES] as string[]).includes(value)
  );
}

export function audienceForExportUrlMatrixSurface(surface: ExportUrlMatrixSurface): ExportUrlMatrixAudience {
  return CLIENT_SURFACES.includes(surface) ? "client" : "admin";
}

export function evaluateExportUrlStorageKeyMatrix(
  surface: ExportUrlMatrixSurface,
  field: ExportUrlMatrixField
): ExportUrlMatrixDecision {
  const audience = audienceForExportUrlMatrixSurface(surface);
  const policy = audience === "client" ? CLIENT_FIELD_POLICY : ADMIN_FIELD_POLICY;
  const allowed = policy[field];
  const reasons = FIELD_REASONS[field];

  return {
    surface,
    audience,
    field,
    allowed,
    reason: allowed ? reasons.allowed : reasons.forbidden
  };
}

/**
 * Full matrix rows for docs/tests — stable order, no live IO.
 */
export function buildExportUrlStorageKeyMatrix(): ExportUrlMatrixDecision[] {
  const fields = Object.keys(CLIENT_FIELD_POLICY) as ExportUrlMatrixField[];
  const surfaces = [...CLIENT_SURFACES, ...ADMIN_SURFACES];
  const rows: ExportUrlMatrixDecision[] = [];

  for (const surface of surfaces) {
    for (const field of fields) {
      rows.push(evaluateExportUrlStorageKeyMatrix(surface, field));
    }
  }

  return rows;
}

/**
 * Asserts a payload respects the matrix for a client surface:
 * exportUrl may be present; storageKey / documentStorageKey must be absent.
 */
export function payloadRespectsExportUrlStorageKeyMatrix(
  surface: ExportUrlMatrixSurface,
  value: unknown
): { ok: boolean; violations: string[] } {
  const audience = audienceForExportUrlMatrixSurface(surface);
  const violations: string[] = [];

  if (!value || typeof value !== "object") {
    return { ok: true, violations: [] };
  }

  const walk = (node: unknown, path: string): void => {
    if (!node || typeof node !== "object") {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((entry, index) => walk(entry, `${path}[${index}]`));
      return;
    }
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      const field = key as ExportUrlMatrixField;
      if (field in CLIENT_FIELD_POLICY) {
        const decision = evaluateExportUrlStorageKeyMatrix(surface, field);
        if (!decision.allowed) {
          violations.push(`${path ? `${path}.` : ""}${key}: ${decision.reason}`);
        }
      }
      walk(child, path ? `${path}.${key}` : key);
    }
  };

  walk(value, "");

  if (audience === "client") {
    const serialized = JSON.stringify(value);
    if (/"storageKey"\s*:/.test(serialized) || /"documentStorageKey"\s*:/.test(serialized)) {
      violations.push("Serialized client payload must not include storageKey fields.");
    }
  }

  return { ok: violations.length === 0, violations };
}
