import { describe, expect, it } from "vitest";
import {
  containsForbiddenClientStatusLeak,
  toBriefStatusPresentation,
  isClientPortalStatusVisible,
  toClientBriefStatusLabel,
  toClientPortalStatusLabel
} from "./client-portal-status";
import {
  buildClientDashboardAttentionItems,
  buildClientDashboardKpis,
  formatClientBriefArticleSummary,
  selectRecentClientBriefs
} from "./client-dashboard-model";
import {
  DEFAULT_APPROVAL_CHECKLIST,
  createEmptyApprovalChecklistState,
  isApprovalChecklistComplete
} from "./approval-checklist";

describe("toClientPortalStatusLabel", () => {
  it("maps client-safe portal enums", () => {
    expect(toClientPortalStatusLabel("PENDING_CLIENT_REVIEW")).toBe("Needs your review");
    expect(toClientPortalStatusLabel("DELIVERED")).toBe("Delivered");
    expect(toClientPortalStatusLabel("FINAL")).toBe("Complete");
    expect(toClientPortalStatusLabel("ACTIVE")).toBe("Active");
    expect(toClientPortalStatusLabel("ARCHIVED")).toBe("Archived");
  });

  it("hides incomplete and internal statuses", () => {
    expect(toClientPortalStatusLabel("DRAFT")).toBeNull();
    expect(toClientPortalStatusLabel("IN_PROGRESS")).toBeNull();
    expect(toClientPortalStatusLabel("BLOCKED")).toBeNull();
    expect(toClientPortalStatusLabel("FAILED")).toBeNull();
    expect(toClientPortalStatusLabel("CHANGES_REQUESTED")).toBeNull();
    expect(toClientPortalStatusLabel("workflowRunId-abc")).toBeNull();
  });

  it("never returns forbidden admin fragments as labels", () => {
    const candidates = [
      "BLOCKED",
      "FAILED",
      "CHANGES_REQUESTED",
      "OPENROUTER_RUNNING",
      "tokenCount=12",
      "providerName=openai"
    ];
    for (const status of candidates) {
      const label = toClientPortalStatusLabel(status);
      expect(label).toBeNull();
      expect(isClientPortalStatusVisible(status)).toBe(false);
    }
  });
});

describe("containsForbiddenClientStatusLeak", () => {
  it("detects admin metadata fragments", () => {
    expect(containsForbiddenClientStatusLeak("blocked")).toBe(true);
    expect(containsForbiddenClientStatusLeak("changes_requested")).toBe(true);
    expect(containsForbiddenClientStatusLeak("workflowRunId")).toBe(true);
    expect(containsForbiddenClientStatusLeak("tokenCount")).toBe(true);
    expect(containsForbiddenClientStatusLeak("Needs your review")).toBe(false);
    expect(containsForbiddenClientStatusLeak("Approved")).toBe(false);
  });
});

describe("toClientBriefStatusLabel", () => {
  it("uses calm client language", () => {
    expect(toClientBriefStatusLabel("AWAITING_CLIENT").label).toBe("Awaiting your input");
    expect(toClientBriefStatusLabel("SUBMITTED").label).toBe("Submitted");
  });
});

describe("toBriefStatusPresentation", () => {
  it("shares admin and client brief semantics", () => {
    expect(toBriefStatusPresentation("AWAITING_CLIENT", "admin")).toEqual({
      label: "Sent to Client",
      tone: "info",
    });
    expect(toBriefStatusPresentation("AWAITING_CLIENT", "client")).toEqual({
      label: "Awaiting your input",
      tone: "info",
    });
    expect(toBriefStatusPresentation("DRAFT", "admin")).toEqual({
      label: "Draft",
      tone: "warning",
    });
  });
});

describe("client dashboard model", () => {
  const briefs = [
    {
      id: "b2",
      title: "Newer brief",
      status: "AWAITING_CLIENT" as const,
      createdAt: "2026-06-02T00:00:00.000Z",
      hubCount: 1,
      geoSeoCount: 0,
      lifestyleCount: 0,
      otherCount: 0
    },
    {
      id: "b1",
      title: "Older brief",
      status: "SUBMITTED" as const,
      createdAt: "2026-06-01T00:00:00.000Z",
      hubCount: 0,
      geoSeoCount: 2,
      lifestyleCount: 1,
      otherCount: 0
    }
  ];

  it("builds KPIs from real counts only", () => {
    expect(buildClientDashboardKpis(briefs, 3)).toEqual({
      briefCount: 2,
      awaitingApprovalCount: 3,
      awaitingBriefCount: 1,
      submittedBriefCount: 1
    });
  });

  it("builds attention items with approval first", () => {
    const items = buildClientDashboardAttentionItems(briefs, 2);
    expect(items[0]?.kind).toBe("approval");
    expect(items[0]?.urgent).toBe(true);
    expect(items.some((item) => item.kind === "brief")).toBe(true);
  });

  it("selects recent briefs by date", () => {
    expect(selectRecentClientBriefs(briefs, 1).map((brief) => brief.id)).toEqual(["b2"]);
  });

  it("formats article summary without inventing counts", () => {
    expect(formatClientBriefArticleSummary(briefs[1]!)).toBe("Geo SEO ×2 · Lifestyle ×1");
    expect(
      formatClientBriefArticleSummary({
        ...briefs[0]!,
        hubCount: 0
      })
    ).toBeNull();
  });
});

describe("approval checklist", () => {
  it("starts incomplete and completes when all checked", () => {
    const empty = createEmptyApprovalChecklistState();
    expect(isApprovalChecklistComplete(empty)).toBe(false);

    const complete = Object.fromEntries(DEFAULT_APPROVAL_CHECKLIST.map((item) => [item.id, true]));
    expect(isApprovalChecklistComplete(complete)).toBe(true);
  });

  it("requires every default item", () => {
    expect(DEFAULT_APPROVAL_CHECKLIST).toHaveLength(5);
    const partial = createEmptyApprovalChecklistState();
    partial.tone = true;
    partial.claims = true;
    expect(isApprovalChecklistComplete(partial)).toBe(false);
  });
});
