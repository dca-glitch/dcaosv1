import { describe, expect, it } from "vitest";
import type { AiOperationsRunListItem } from "@dca-os-v1/shared";
import {
  AI_OPS_PAGE_SIZE,
  buildRunsCsv,
  buildStatusSummaryItems,
  contextStatusLabel,
  escapeCsvCell,
  filterAiOperationsRuns,
  formatAiOpsLabel,
  formatAiOpsTimestamp,
  hasRunError,
  paginateItems,
  parseAiOperationsRunIdFromHash,
  selectErrorLogRuns,
  summarizeContextUsage
} from "./aiOperationsModel";

function makeRun(overrides: Partial<AiOperationsRunListItem> = {}): AiOperationsRunListItem {
  return {
    id: "run-1",
    shortId: "run-1",
    workflowKind: "ai_delivery_workflow_run",
    aiDeliveryProjectId: "proj-1",
    miProjectId: null,
    projectName: "Alpha",
    clientId: "client-1",
    clientName: "Acme",
    linkedProjectId: null,
    linkedProjectName: null,
    targetMonth: "2026-07",
    workflowType: "content_plan_draft",
    status: "COMPLETED",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    startedAt: null,
    finishedAt: null,
    executedAt: "2026-07-01T12:00:00.000Z",
    gateway: "local",
    providerMode: "deterministic",
    isDeterministic: true,
    liveProviderCalled: false,
    model: "local-model",
    outputType: "content_plan_draft",
    contextStatus: "used",
    approximateInputTokens: 100,
    maxOutputTokens: 500,
    budgetPolicy: "default",
    safeError: null,
    executionError: null,
    resultVersion: "AI_WORKFLOW_RESULT_V1",
    resultType: "content_plan_draft",
    titlePreview: "Plan preview",
    linkedInsightId: null,
    linkedInsightStatus: null,
    linkedHandoffStatus: null,
    ...overrides
  };
}

describe("escapeCsvCell / buildRunsCsv", () => {
  it("escapes commas and quotes", () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it("builds a CSV with safe headers and no secret columns", () => {
    const csv = buildRunsCsv([makeRun({ id: "abc", shortId: "abc" })]);
    expect(csv.startsWith("run_id,short_id,source,")).toBe(true);
    expect(csv).toContain("abc");
    expect(csv.toLowerCase()).not.toContain("api_key");
    expect(csv.toLowerCase()).not.toContain("authorization");
    expect(csv).toContain("live_provider_called");
  });
});

describe("format helpers", () => {
  it("formats timestamps and labels", () => {
    expect(formatAiOpsTimestamp(null)).toBe("Not recorded");
    expect(formatAiOpsTimestamp("not-a-date")).toBe("not-a-date");
    expect(formatAiOpsLabel("content_plan_draft")).toBe("content plan draft");
    expect(formatAiOpsLabel("  ")).toBe("Unknown");
  });

  it("maps context status labels", () => {
    expect(contextStatusLabel("used")).toBe("Context used");
    expect(contextStatusLabel("skipped")).toBe("Context skipped");
    expect(contextStatusLabel("not_loaded")).toBe("Context not loaded");
    expect(contextStatusLabel("unknown")).toBe("Context unknown");
  });
});

describe("filterAiOperationsRuns", () => {
  const runs = [
    makeRun({ id: "1", shortId: "aaa", status: "COMPLETED", gateway: "local", workflowKind: "ai_delivery_workflow_run" }),
    makeRun({
      id: "2",
      shortId: "bbb",
      status: "FAILED",
      gateway: "openrouter",
      workflowKind: "market_intelligence_research_run",
      projectName: "Beta",
      outputType: "mi_research",
      workflowType: "mi_research"
    })
  ];

  it("filters by status, source, gateway, output type, and search", () => {
    expect(
      filterAiOperationsRuns(runs, {
        search: "",
        statusFilter: "FAILED",
        sourceFilter: "ALL",
        gatewayFilter: "ALL",
        outputTypeFilter: "ALL"
      })
    ).toHaveLength(1);

    expect(
      filterAiOperationsRuns(runs, {
        search: "beta",
        statusFilter: "ALL",
        sourceFilter: "market_intelligence_research_run",
        gatewayFilter: "openrouter",
        outputTypeFilter: "mi_research"
      }).map((run) => run.id)
    ).toEqual(["2"]);
  });
});

describe("paginateItems", () => {
  it("slices client-side pages and clamps page bounds", () => {
    const items = Array.from({ length: 45 }, (_, index) => index + 1);
    const first = paginateItems(items, 1, AI_OPS_PAGE_SIZE);
    expect(first.items).toEqual(items.slice(0, 20));
    expect(first.totalPages).toBe(3);

    const last = paginateItems(items, 99, AI_OPS_PAGE_SIZE);
    expect(last.page).toBe(3);
    expect(last.items).toEqual(items.slice(40, 45));

    const empty = paginateItems([], 2, AI_OPS_PAGE_SIZE);
    expect(empty).toEqual({ items: [], page: 1, perPage: 20, total: 0, totalPages: 0 });
  });
});

describe("context usage + error log", () => {
  it("summarizes context usage and token estimates from existing fields", () => {
    const summary = summarizeContextUsage([
      makeRun({ contextStatus: "used", approximateInputTokens: 10 }),
      makeRun({ id: "2", contextStatus: "skipped", approximateInputTokens: null }),
      makeRun({ id: "3", contextStatus: "not_loaded", approximateInputTokens: 5 }),
      makeRun({ id: "4", contextStatus: "unknown", approximateInputTokens: 2, safeError: "boom" })
    ]);
    expect(summary).toEqual({
      used: 1,
      skipped: 1,
      notLoaded: 1,
      unknown: 1,
      runsWithTokenEstimate: 3,
      approximateInputTokensSum: 17,
      runsWithErrors: 1
    });
  });

  it("selects error-log runs from safe/execution errors only", () => {
    const runs = [
      makeRun({ id: "ok" }),
      makeRun({ id: "safe", safeError: "safe fail" }),
      makeRun({ id: "exec", executionError: "exec fail" }),
      makeRun({ id: "blank", safeError: "   " })
    ];
    expect(hasRunError(runs[0]!)).toBe(false);
    expect(selectErrorLogRuns(runs).map((run) => run.id)).toEqual(["safe", "exec"]);
  });

  it("builds status summary items sorted by status", () => {
    expect(
      buildStatusSummaryItems([
        makeRun({ status: "FAILED" }),
        makeRun({ id: "2", status: "COMPLETED" }),
        makeRun({ id: "3", status: "COMPLETED" })
      ])
    ).toEqual([
      { key: "COMPLETED", label: "COMPLETED", count: 2 },
      { key: "FAILED", label: "FAILED", count: 1 }
    ]);
  });
});

describe("parseAiOperationsRunIdFromHash", () => {
  it("reads runId from ai-operations deep links", () => {
    expect(parseAiOperationsRunIdFromHash("#/ai-operations?runId=abc-123")).toBe("abc-123");
    expect(parseAiOperationsRunIdFromHash("#/ai-operations")).toBeNull();
    expect(parseAiOperationsRunIdFromHash("")).toBeNull();
  });
});
