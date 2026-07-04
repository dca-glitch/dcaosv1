/**
 * MI Mega Block 2 — deterministic integration of finalized MI_SUMMARY_V1 records.
 * No live provider calls.
 */

import {
  MI_SUMMARY_INTEGRATION_KIND,
  MI_SUMMARY_INTEGRATION_VERSION
} from "./market-intelligence-summary.execution";

export type MiSummaryApplyRecord = {
  id: string;
  projectId: string;
  clientId: string | null;
  title: string;
  summaryText: string;
  status: string;
  sourceNotes: string | null;
  integrationContext: unknown;
  isArchived: boolean;
  finalizedAt: Date | null;
  aiDeliveryProjectId?: string | null;
  appliedAt?: Date | null;
};

export function parseMiSummaryIntegrationContext(
  value: unknown
): { version: string; kind: string } | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const version = typeof record.version === "string" ? record.version : "";
  const kind = typeof record.kind === "string" ? record.kind : "";
  if (!version || !kind) {
    return null;
  }
  return { version, kind };
}

export function isFinalizedMiSummaryV1(summary: MiSummaryApplyRecord): boolean {
  if (summary.isArchived || summary.status !== "FINALIZED") {
    return false;
  }
  const ctx = parseMiSummaryIntegrationContext(summary.integrationContext);
  return (
    ctx?.version === MI_SUMMARY_INTEGRATION_VERSION &&
    ctx?.kind === MI_SUMMARY_INTEGRATION_KIND
  );
}

export function buildMiSummaryContextDraft(summary: Pick<MiSummaryApplyRecord, "title" | "summaryText" | "sourceNotes">): string {
  const lines = [
    `# Market Intelligence summary context: ${summary.title}`,
    "",
    "## Summary",
    summary.summaryText
  ];
  if (summary.sourceNotes?.trim()) {
    lines.push("", "## Source notes", summary.sourceNotes.trim());
  }
  lines.push(
    "",
    "## Integration note",
    "Applied from finalized MI_SUMMARY_V1 admin summary. Review before client-facing recommendations."
  );
  return lines.join("\n");
}

export function buildAiDeliveryBriefNotesFromMiSummary(
  summary: Pick<MiSummaryApplyRecord, "id" | "title" | "summaryText" | "sourceNotes">
): string {
  const sections = [
    `Market Intelligence summary applied: ${summary.title}`,
    `Summary ID: ${summary.id}`,
    summary.summaryText,
    summary.sourceNotes ? `Source notes: ${summary.sourceNotes}` : null
  ].filter(Boolean) as string[];
  return sections.join("\n\n");
}

export function buildMiSummarySeoPlanningNotes(
  summary: Pick<MiSummaryApplyRecord, "id" | "title" | "summaryText">
): string {
  return [
    "## Market Intelligence input",
    `Reference: ${summary.title} (${summary.id})`,
    summary.summaryText
  ].join("\n\n");
}

export function buildMiSummaryRecommendationsAppend(
  summary: Pick<MiSummaryApplyRecord, "title" | "summaryText">
): string {
  return [
    "## Next month recommendations (from Market Intelligence)",
    `Source: ${summary.title}`,
    summary.summaryText
  ].join("\n\n");
}
