/**
 * Monthly report approval-state wording — admin vs client truth labels.
 * Pure helper; no storage I/O, no live Google, no notification send.
 */

export type MonthlyReportApprovalStatus =
  | "DRAFT"
  | "ADMIN_REVIEW"
  | "FINAL"
  | "ARCHIVED"
  | "UNKNOWN";

export type MonthlyReportApprovalAudience = "client" | "admin";

export interface MonthlyReportApprovalStateInput {
  status?: string | null;
  isArchived?: boolean | null;
  audience?: MonthlyReportApprovalAudience | null;
}

export interface MonthlyReportApprovalState {
  status: MonthlyReportApprovalStatus;
  adminLabel: string;
  clientLabel: string;
  /** Client portal may list/detail only FINAL non-archived reports. */
  clientVisible: boolean;
  /** Admin may edit content while DRAFT or ADMIN_REVIEW. */
  adminEditable: boolean;
  /** FINAL is the only status that may use client-facing “available” wording. */
  clientAvailabilityWordingAllowed: boolean;
  errors: string[];
}

const KNOWN = new Set<string>(["DRAFT", "ADMIN_REVIEW", "FINAL", "ARCHIVED"]);

function normalizeStatus(raw: string | null | undefined, isArchived: boolean): MonthlyReportApprovalStatus {
  if (isArchived) {
    return "ARCHIVED";
  }
  const status = (raw ?? "").trim().toUpperCase();
  if (!status) {
    return "DRAFT";
  }
  if (KNOWN.has(status)) {
    return status as MonthlyReportApprovalStatus;
  }
  return "UNKNOWN";
}

const ADMIN_LABELS: Record<MonthlyReportApprovalStatus, string> = {
  DRAFT: "Draft — not client-visible",
  ADMIN_REVIEW: "Admin review — not client-visible",
  FINAL: "Final — client-visible when not archived",
  ARCHIVED: "Archived — hidden from client portal",
  UNKNOWN: "Unknown status — treat as not client-visible"
};

const CLIENT_LABELS: Record<MonthlyReportApprovalStatus, string> = {
  DRAFT: "Report not available",
  ADMIN_REVIEW: "Report not available",
  FINAL: "Monthly report available",
  ARCHIVED: "Report not available",
  UNKNOWN: "Report not available"
};

/**
 * Resolves truthful approval-state wording for monthly reports.
 * Client-facing “available” language is allowed only for FINAL (non-archived).
 */
export function resolveMonthlyReportApprovalState(
  input: MonthlyReportApprovalStateInput = {}
): MonthlyReportApprovalState {
  const errors: string[] = [];
  const isArchived = input.isArchived === true;
  const status = normalizeStatus(input.status, isArchived);

  if (status === "UNKNOWN") {
    errors.push("monthly report status is not a known approval state");
  }

  const clientVisible = status === "FINAL" && !isArchived;
  const adminEditable = status === "DRAFT" || status === "ADMIN_REVIEW";
  const clientAvailabilityWordingAllowed = clientVisible;

  // Audience hint: if caller asks for client wording on a non-visible status, keep safe labels
  // (already encoded in CLIENT_LABELS) and do not invent “available”.
  if (input.audience === "client" && !clientVisible) {
    // No extra error — absence is the product rule; wording stays “not available”.
  }

  return {
    status,
    adminLabel: ADMIN_LABELS[status],
    clientLabel: CLIENT_LABELS[status],
    clientVisible,
    adminEditable,
    clientAvailabilityWordingAllowed,
    errors
  };
}
