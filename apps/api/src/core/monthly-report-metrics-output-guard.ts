/**
 * Monthly report output guards — client FINAL-only vs admin controlled exposure.
 * Pure serializers; no storage I/O, no live Google.
 */

export type MonthlyReportOutputAudience = "client" | "admin";

export interface MonthlyReportOutputGuardInput {
  status?: string | null;
  title?: string | null;
  recommendationsText?: string | null;
  adminSummaryNotes?: string | null;
  performanceNote?: string | null;
  deliveryHeadline?: string | null;
  storageKey?: string | null;
  oauthClientSecret?: string | null;
  refreshToken?: string | null;
  googleAccessToken?: string | null;
  internalSourceId?: string | null;
  snapshotSourceId?: string | null;
  jobStatus?: string | null;
  runStatus?: string | null;
  workflowRunId?: string | null;
  metricsTruthLabel?: string | null;
  clientSafePerformanceNote?: string | null;
}

export interface MonthlyReportClientOutput {
  status: "FINAL";
  title: string;
  recommendationsText: string;
  deliveryHeadline: string | null;
  performanceNote: string | null;
  metricsTruthLabel: string | null;
  hasDocument: boolean;
}

export interface MonthlyReportAdminOutput {
  status: string;
  title: string;
  recommendationsText: string;
  adminSummaryNotes: string | null;
  deliveryHeadline: string | null;
  performanceNote: string | null;
  metricsTruthLabel: string | null;
  hasDocument: boolean;
  internalSourceId: string | null;
  jobStatus: string | null;
  runStatus: string | null;
  workflowRunId: string | null;
}

export interface MonthlyReportOutputGuardResult {
  ok: boolean;
  audience: MonthlyReportOutputAudience;
  errors: string[];
  client: MonthlyReportClientOutput | null;
  admin: MonthlyReportAdminOutput | null;
}

const FORBIDDEN_CLIENT_KEYS = [
  "storageKey",
  "adminSummaryNotes",
  "oauthClientSecret",
  "refreshToken",
  "googleAccessToken",
  "internalSourceId",
  "snapshotSourceId",
  "jobStatus",
  "runStatus",
  "workflowRunId"
] as const;

function assertNoForbiddenKeys(payload: object, forbidden: readonly string[]): string[] {
  const keys = Object.keys(payload);
  return forbidden.filter((key) => keys.includes(key));
}

function assertNoSecretValues(serialized: string, input: MonthlyReportOutputGuardInput): string[] {
  const leaks: string[] = [];
  for (const value of [
    input.storageKey,
    input.oauthClientSecret,
    input.refreshToken,
    input.googleAccessToken
  ]) {
    if (typeof value === "string" && value.trim().length > 0 && serialized.includes(value)) {
      leaks.push("secret_or_storage_value_leaked");
    }
  }
  return [...new Set(leaks)];
}

export function buildMonthlyReportClientOutput(
  input: MonthlyReportOutputGuardInput
): MonthlyReportOutputGuardResult {
  const errors: string[] = [];
  const status = input.status?.trim() ?? "";

  if (status !== "FINAL") {
    errors.push("client monthly report output requires FINAL status");
  }

  if (errors.length > 0) {
    return { ok: false, audience: "client", errors, client: null, admin: null };
  }

  const client: MonthlyReportClientOutput = {
    status: "FINAL",
    title: (input.title ?? "").trim() || "Monthly report",
    recommendationsText: (input.recommendationsText ?? "").trim(),
    deliveryHeadline: input.deliveryHeadline?.trim() || null,
    performanceNote:
      input.clientSafePerformanceNote?.trim() ||
      input.performanceNote?.trim() ||
      null,
    metricsTruthLabel: input.metricsTruthLabel?.trim() || null,
    hasDocument: Boolean(input.storageKey && input.storageKey.trim().length > 0)
  };

  const forbiddenPresent = assertNoForbiddenKeys(client, FORBIDDEN_CLIENT_KEYS);
  if (forbiddenPresent.length > 0) {
    errors.push(`client payload must not include: ${forbiddenPresent.join(", ")}`);
  }

  if (input.adminSummaryNotes && JSON.stringify(client).includes(input.adminSummaryNotes)) {
    errors.push("client payload must not include adminSummaryNotes content");
  }

  const serialized = JSON.stringify(client);
  errors.push(...assertNoSecretValues(serialized, input));

  if (errors.length > 0) {
    return { ok: false, audience: "client", errors, client: null, admin: null };
  }

  return { ok: true, audience: "client", errors: [], client, admin: null };
}

export function buildMonthlyReportAdminOutput(
  input: MonthlyReportOutputGuardInput
): MonthlyReportOutputGuardResult {
  const errors: string[] = [];
  const status = (input.status?.trim() || "DRAFT").toUpperCase();

  const admin: MonthlyReportAdminOutput = {
    status,
    title: (input.title ?? "").trim() || "Monthly report",
    recommendationsText: (input.recommendationsText ?? "").trim(),
    adminSummaryNotes: input.adminSummaryNotes?.trim() || null,
    deliveryHeadline: input.deliveryHeadline?.trim() || null,
    performanceNote: input.performanceNote?.trim() || null,
    metricsTruthLabel: input.metricsTruthLabel?.trim() || null,
    hasDocument: Boolean(input.storageKey && input.storageKey.trim().length > 0),
    internalSourceId: input.internalSourceId?.trim() || input.snapshotSourceId?.trim() || null,
    jobStatus: input.jobStatus?.trim() || null,
    runStatus: input.runStatus?.trim() || null,
    workflowRunId: input.workflowRunId?.trim() || null
  };

  // Admin may see more metadata, but never raw storageKey or OAuth secrets.
  const forbiddenAdminKeys = ["storageKey", "oauthClientSecret", "refreshToken", "googleAccessToken"] as const;
  const forbiddenPresent = assertNoForbiddenKeys(admin, forbiddenAdminKeys);
  if (forbiddenPresent.length > 0) {
    errors.push(`admin payload must not include: ${forbiddenPresent.join(", ")}`);
  }

  const serialized = JSON.stringify(admin);
  errors.push(...assertNoSecretValues(serialized, input));

  if (errors.length > 0) {
    return { ok: false, audience: "admin", errors, client: null, admin: null };
  }

  return { ok: true, audience: "admin", errors: [], client: null, admin };
}
