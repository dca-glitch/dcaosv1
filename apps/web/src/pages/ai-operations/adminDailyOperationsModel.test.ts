import { describe, expect, it } from "vitest";
import type { AiOperationsRunListItem } from "@dca-os-v1/shared";
import {
  buildAgencyActivity,
  buildAgencyHealth,
  buildAgencyOpsMetrics,
  generateDailyActions,
  normalizeRunStatus,
} from "./adminDailyOperationsModel";

function makeRun(overrides: Partial<AiOperationsRunListItem>): AiOperationsRunListItem {
  return {
    id: overrides.id ?? "run-1",
    shortId: overrides.shortId ?? "ABC123",
    workflowKind: "ai_delivery_workflow_run",
    aiDeliveryProjectId: null,
    miProjectId: null,
    projectName: overrides.projectName ?? "Project A",
    clientId: overrides.clientId ?? "client-1",
    clientName: overrides.clientName ?? "Client A",
    linkedProjectId: null,
    linkedProjectName: null,
    targetMonth: null,
    workflowType: overrides.workflowType ?? "seo_plan",
    status: overrides.status ?? "READY",
    createdAt: overrides.createdAt ?? "2026-07-10T10:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-07-10T10:00:00.000Z",
    startedAt: null,
    finishedAt: null,
    executedAt: overrides.executedAt ?? "2026-07-10T10:00:00.000Z",
    gateway: null,
    providerMode: null,
    isDeterministic: null,
    liveProviderCalled: null,
    model: null,
    outputType: overrides.outputType ?? "plan",
    contextStatus: "unknown",
    approximateInputTokens: overrides.approximateInputTokens ?? 0,
    maxOutputTokens: null,
    budgetPolicy: null,
    safeError: null,
    executionError: null,
    resultVersion: null,
    resultType: null,
    titlePreview: null,
    linkedInsightId: null,
    linkedInsightStatus: null,
    linkedHandoffStatus: null,
  };
}

describe("adminDailyOperationsModel", () => {
  it("normalizes uppercase API statuses", () => {
    expect(normalizeRunStatus("FAILED")).toBe("failed");
    expect(normalizeRunStatus("REVIEW")).toBe("in_review");
    expect(normalizeRunStatus("READY")).toBe("ready");
    expect(normalizeRunStatus("IN_PROGRESS")).toBe("in_progress");
    expect(normalizeRunStatus("COMPLETED")).toBe("completed");
  });

  it("builds ring KPI counts from live run statuses without inventing overdue", () => {
    const metrics = buildAgencyOpsMetrics([
      makeRun({ id: "1", status: "READY" }),
      makeRun({ id: "2", status: "REVIEW" }),
      makeRun({ id: "3", status: "FAILED" }),
      makeRun({ id: "4", status: "IN_PROGRESS" }),
      makeRun({ id: "5", status: "COMPLETED", executedAt: new Date().toISOString() }),
    ]);
    expect(metrics.ready).toBe(1);
    expect(metrics.inReview).toBe(2);
    expect(metrics.inProgress).toBe(1);
    expect(metrics.completed).toBe(1);
    expect(metrics.overdue).toBe(0);
    expect(metrics.blocked).toBe(0);
  });

  it("queues ready/review/blocked actions with priority order", () => {
    const actions = generateDailyActions([
      makeRun({ id: "f", shortId: "FAIL1", status: "FAILED" }),
      makeRun({ id: "r", shortId: "RDY1", status: "READY" }),
      makeRun({ id: "b", shortId: "BLK1", status: "BLOCKED" }),
    ]);
    expect(actions[0]?.category).toBe("review");
    expect(actions[0]?.priority).toBe("critical");
    expect(actions.some((a) => a.category === "approval")).toBe(true);
    expect(actions.some((a) => a.category === "blocked")).toBe(true);
  });

  it("derives agency health from existing client/project fields", () => {
    const health = buildAgencyHealth([
      makeRun({ id: "1", clientName: "Acme", projectName: "P1" }),
      makeRun({ id: "2", clientName: "Acme", projectName: "P2" }),
      makeRun({ id: "3", clientName: "Beta", projectName: "P3" }),
    ]);
    expect(health.clientCount).toBe(2);
    expect(health.projectCount).toBe(3);
    expect(health.overdueCount).toBe(0);
  });

  it("builds activity from run timestamps without fabricating events", () => {
    const activity = buildAgencyActivity([
      makeRun({
        id: "old",
        shortId: "OLD1",
        status: "COMPLETED",
        executedAt: "2026-07-01T10:00:00.000Z",
      }),
      makeRun({
        id: "new",
        shortId: "NEW1",
        status: "REVIEW",
        executedAt: "2026-07-09T10:00:00.000Z",
      }),
    ]);
    expect(activity[0]?.projectRef).toBe("NEW1");
    expect(activity[0]?.title).toContain("In Review");
  });
});
