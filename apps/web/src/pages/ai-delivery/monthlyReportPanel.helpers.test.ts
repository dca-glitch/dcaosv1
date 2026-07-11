import { describe, expect, it } from "vitest";
import {
  buildMetricsShellCopy,
  buildReportShellCopy,
  formatDate,
  formatDeliveryType,
  formatLastUpdatedMeta,
  formatMetricDecimal,
  formatMetricInteger,
  formatPeriodMeta,
  formatReportStatus,
  isSafeExternalUrl,
  isWorkflowStepComplete,
  isWorkflowStepCurrent,
  parseMetricInput,
  resolveWorkflowStepKey
} from "./monthlyReportPanel.helpers";

describe("monthlyReportPanel.helpers", () => {
  it("formats report status labels for the draft → review → final path", () => {
    expect(formatReportStatus("DRAFT")).toBe("Draft");
    expect(formatReportStatus("ADMIN_REVIEW")).toBe("Admin review");
    expect(formatReportStatus("FINAL")).toBe("Final");
    expect(formatReportStatus("ARCHIVED")).toBe("Archived");
    expect(formatReportStatus(null)).toBe("No status");
  });

  it("builds shell copy with FINAL client-portal hint and deferred GA/GSC wording", () => {
    const draft = buildReportShellCopy({
      status: "DRAFT",
      isArchived: false,
      title: null,
      hasDocument: false,
      exportUrl: null,
      projectName: "Acme SEO"
    });
    expect(draft.status).toBe("Draft");
    expect(draft.headline).toBe("Acme SEO monthly report");
    expect(draft.visibilityState).toBe("Internal working copy");
    expect(draft.actionHint).toContain("Client Portal shows the report only after FINAL");

    const finalCopy = buildReportShellCopy({
      status: "FINAL",
      isArchived: false,
      title: "June wrap",
      hasDocument: true,
      exportUrl: "https://docs.example.com/report",
      projectName: "Acme SEO"
    });
    expect(finalCopy.status).toBe("Final");
    expect(finalCopy.headline).toBe("June wrap");
    expect(finalCopy.documentState).toBe("Document attached");
    expect(finalCopy.handoffState).toBe("Handoff URL set");
    expect(finalCopy.visibilityState).toBe("Client-safe when FINAL");
    expect(finalCopy.actionHint).toContain("Live GA/GSC sync remains deferred");

    const archived = buildReportShellCopy({
      status: "FINAL",
      isArchived: true,
      title: "June wrap",
      hasDocument: true,
      exportUrl: null,
      projectName: "Acme SEO"
    });
    expect(archived.status).toBe("Archived");
    expect(archived.actionHint).toBe("Restore to resume edits.");
  });

  it("builds metrics shell copy without inventing readiness beyond dataStatus", () => {
    expect(buildMetricsShellCopy({ dataStatus: "NO_DATA", snapshotCount: 0, trendMonthCount: 0 }).trendHint).toContain(
      "No approved snapshot data yet"
    );
    expect(buildMetricsShellCopy({ dataStatus: "PARTIAL", snapshotCount: 1, trendMonthCount: 1 }).trendHint).toContain(
      "partial"
    );
    expect(buildMetricsShellCopy({ dataStatus: "READY", snapshotCount: 3, trendMonthCount: 3 }).trendHint).toContain(
      "ready from approved snapshots"
    );
  });

  it("resolves workflow step keys and completion for draft → review → final", () => {
    expect(resolveWorkflowStepKey("DRAFT", false)).toBe("DRAFT");
    expect(resolveWorkflowStepKey("ADMIN_REVIEW", false)).toBe("ADMIN_REVIEW");
    expect(resolveWorkflowStepKey("FINAL", false)).toBe("FINAL");
    expect(resolveWorkflowStepKey("FINAL", true)).toBe("ARCHIVED");

    expect(isWorkflowStepCurrent("DRAFT", "DRAFT")).toBe(true);
    expect(isWorkflowStepComplete("DRAFT", "ADMIN_REVIEW")).toBe(true);
    expect(isWorkflowStepComplete("ADMIN_REVIEW", "DRAFT")).toBe(false);
    expect(isWorkflowStepComplete("FINAL", "ARCHIVED")).toBe(true);
  });

  it("exposes period and last-updated only when data exists", () => {
    expect(formatPeriodMeta("2026-06")).toBe("2026-06");
    expect(formatPeriodMeta("  ")).toBeNull();
    expect(formatPeriodMeta(null)).toBeNull();

    expect(formatLastUpdatedMeta(null)).toBeNull();
    expect(formatLastUpdatedMeta("not-a-date")).toBeNull();
    expect(formatLastUpdatedMeta("2026-06-15T12:00:00.000Z")).toEqual(expect.any(String));
  });

  it("formats metrics and delivery helpers safely", () => {
    expect(formatMetricInteger(1200)).toMatch(/1/);
    expect(formatMetricInteger(null)).toBe("—");
    expect(formatMetricDecimal(1.234)).toMatch(/1/);
    expect(formatMetricDecimal(undefined)).toBe("—");
    expect(parseMetricInput("")).toBeUndefined();
    expect(parseMetricInput("12.5")).toBe(12.5);
    expect(parseMetricInput("x")).toBeUndefined();
    expect(formatDeliveryType("CONTENT_ARTICLE")).toBe("Content Article");
    expect(isSafeExternalUrl("https://example.com")).toBe(true);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
    expect(formatDate(null)).toBe("N/A");
  });
});
