/**
 * Monthly report export/download truth labels — hasDocument vs exportUrl vs storageKey.
 * Pure helper; never serializes storageKey or OAuth secrets.
 */

export type MonthlyReportExportAudience = "client" | "admin";

export type MonthlyReportExportTruthKind =
  | "no_document"
  | "document_present_no_client_url"
  | "client_safe_export_url"
  | "admin_document_only";

export interface MonthlyReportExportTruthInput {
  audience: MonthlyReportExportAudience;
  hasDocument?: boolean | null;
  exportUrl?: string | null;
  /** Presence flag only — never pass the raw storage key value into serializers. */
  storageKeyPresent?: boolean | null;
  reportStatus?: string | null;
}

export interface MonthlyReportExportTruth {
  kind: MonthlyReportExportTruthKind;
  hasDocument: boolean;
  exportUrl: string | null;
  adminLabel: string;
  clientLabel: string;
  /** Client payloads must never include storageKey; this is always false for client views. */
  storageKeyExposed: false;
  clientSafe: boolean;
  errors: string[];
}

function isHttpExportUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Resolves truthful export/download labels without exposing storageKey.
 * Client may receive exportUrl only when present and http(s); hasDocument is a boolean only.
 */
export function resolveMonthlyReportExportTruth(
  input: MonthlyReportExportTruthInput
): MonthlyReportExportTruth {
  const errors: string[] = [];
  const hasDocument =
    input.hasDocument === true || input.storageKeyPresent === true;
  const rawExport = typeof input.exportUrl === "string" ? input.exportUrl.trim() : "";
  const exportUrl = rawExport.length > 0 ? rawExport : null;

  if (exportUrl && !isHttpExportUrl(exportUrl)) {
    errors.push("exportUrl must be an http(s) URL when provided");
  }

  if (input.audience === "client") {
    const status = (input.reportStatus ?? "").trim().toUpperCase();
    if (status && status !== "FINAL") {
      errors.push("client export truth requires FINAL report status when status is provided");
    }
  }

  if (errors.length > 0) {
    return {
      kind: "no_document",
      hasDocument: false,
      exportUrl: null,
      adminLabel: "export truth rejected",
      clientLabel: "Document unavailable",
      storageKeyExposed: false,
      clientSafe: false,
      errors
    };
  }

  if (!hasDocument && !exportUrl) {
    return {
      kind: "no_document",
      hasDocument: false,
      exportUrl: null,
      adminLabel: "no monthly report document generated",
      clientLabel: "Document not available",
      storageKeyExposed: false,
      clientSafe: true,
      errors: []
    };
  }

  if (input.audience === "client") {
    if (exportUrl) {
      return {
        kind: "client_safe_export_url",
        hasDocument: true,
        exportUrl,
        adminLabel: "client-safe export URL present (storageKey internal)",
        clientLabel: "Download available",
        storageKeyExposed: false,
        clientSafe: true,
        errors: []
      };
    }

    return {
      kind: "document_present_no_client_url",
      hasDocument: true,
      exportUrl: null,
      adminLabel: "document present; no client exportUrl yet",
      clientLabel: "Document on file",
      storageKeyExposed: false,
      clientSafe: true,
      errors: []
    };
  }

  // Admin audience
  if (hasDocument && !exportUrl) {
    return {
      kind: "admin_document_only",
      hasDocument: true,
      exportUrl: null,
      adminLabel: "admin document present (storageKey not serialized)",
      clientLabel: "Document on file",
      storageKeyExposed: false,
      clientSafe: true,
      errors: []
    };
  }

  return {
    kind: exportUrl ? "client_safe_export_url" : "admin_document_only",
    hasDocument: true,
    exportUrl,
    adminLabel: exportUrl
      ? "admin export URL present (storageKey not serialized)"
      : "admin document present (storageKey not serialized)",
    clientLabel: exportUrl ? "Download available" : "Document on file",
    storageKeyExposed: false,
    clientSafe: true,
    errors: []
  };
}
