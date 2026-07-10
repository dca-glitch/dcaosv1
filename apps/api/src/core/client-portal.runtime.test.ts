import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertClientPortalPayloadHasNoForbiddenKeys,
  collectClientPortalForbiddenPayloadKeys
} from "./client-portal-error-safety";
import {
  isClientPortalFinalMonthlyReportStatus,
  isClientPortalVisibleDeliverableStatus,
  toClientPortalDeliverableSummary,
  toClientPortalMonthlyReportSummary
} from "./client-portal.runtime";

describe("client portal final delivery guards (G571/G572)", () => {
  it("allows only final deliverable statuses in client archive responses (G203/G572)", () => {
    assert.equal(isClientPortalVisibleDeliverableStatus("DELIVERED"), true);
    assert.equal(isClientPortalVisibleDeliverableStatus("ACCEPTED"), true);

    assert.equal(isClientPortalVisibleDeliverableStatus("DRAFT"), false);
    assert.equal(isClientPortalVisibleDeliverableStatus("PENDING_CLIENT_REVIEW"), false);
    assert.equal(isClientPortalVisibleDeliverableStatus("APPROVED_BY_CLIENT"), false);
    assert.equal(isClientPortalVisibleDeliverableStatus("ADMIN_REVIEW"), false);
  });

  it("allows only FINAL monthly reports in client archive responses (G203/G571)", () => {
    assert.equal(isClientPortalFinalMonthlyReportStatus("FINAL"), true);

    assert.equal(isClientPortalFinalMonthlyReportStatus("DRAFT"), false);
    assert.equal(isClientPortalFinalMonthlyReportStatus("IMPORTED"), false);
    assert.equal(isClientPortalFinalMonthlyReportStatus("APPROVED"), false);
    assert.equal(isClientPortalFinalMonthlyReportStatus("ARCHIVED"), false);
  });
});

const CLIENT_PORTAL_SERIALIZER_FORBIDDEN_KEYS = [
  "storageKey",
  "provider",
  "providerMetadata",
  "workflowRunId",
  "workflowRunStatus",
  "jobQueueStatus",
  "queueStatus",
  "auditLog",
  "auditLogs",
  "actualCostUsd",
  "estimatedCostUsd",
  "rawCost",
  "costRows",
  "adminSummaryNotes",
  "adminNotes",
  "executionLog",
  "releasePackageId",
  "miHandoffId"
] as const;

describe("client-portal.runtime — serializer audit (G199/G329)", () => {
  it("preserves deliverable exportUrl without exposing storageKey", () => {
    const summary = toClientPortalDeliverableSummary({
      id: "deliverable-1",
      aiDeliveryProjectId: "project-1",
      title: "Client deliverable",
      description: "Ready for client",
      deliveryType: "ARTICLE_DRAFT",
      status: "DELIVERED",
      exportUrl: "https://docs.example.com/export/client-deliverable",
      storageKey: "tenants/internal/private-object.pdf",
      isArchived: false,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    } as Parameters<typeof toClientPortalDeliverableSummary>[0] & { storageKey: string });

    const serialized = JSON.stringify(summary);
    assert.equal(summary.exportUrl, "https://docs.example.com/export/client-deliverable");
    assert.equal(serialized.includes("storageKey"), false);
    assert.equal(serialized.includes("tenants/internal/private-object.pdf"), false);
    assertClientPortalPayloadHasNoForbiddenKeys(summary);
  });

  it("turns monthly report storageKey into hasDocument only", () => {
    const summary = toClientPortalMonthlyReportSummary({
      id: "report-1",
      aiDeliveryProjectId: "project-1",
      title: "Monthly report",
      recommendationsText: "Approved summary",
      exportUrl: "https://docs.example.com/export/monthly-report",
      finalizedAt: new Date("2026-07-03T00:00:00.000Z"),
      storageKey: "tenants/internal/monthly-report.pdf",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    });

    const serialized = JSON.stringify(summary);
    assert.equal(summary.exportUrl, "https://docs.example.com/export/monthly-report");
    assert.equal(summary.hasDocument, true);
    assert.equal(summary.status, "FINAL");
    assert.equal(serialized.includes("storageKey"), false);
    assert.equal(serialized.includes("tenants/internal/monthly-report.pdf"), false);
    assertClientPortalPayloadHasNoForbiddenKeys(summary);
  });

  it("does not expose provider, status internals, storageKey, or cost fields on serializer output (G329)", () => {
    const deliverable = toClientPortalDeliverableSummary({
      id: "deliverable-2",
      aiDeliveryProjectId: "project-2",
      title: "Final article",
      description: "Client-visible",
      deliveryType: "ARTICLE_DRAFT",
      status: "ACCEPTED",
      exportUrl: "https://docs.example.com/export/final-article",
      isArchived: false,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    });

    const monthly = toClientPortalMonthlyReportSummary({
      id: "report-2",
      aiDeliveryProjectId: "project-2",
      title: "Final monthly",
      recommendationsText: null,
      exportUrl: null,
      finalizedAt: null,
      storageKey: null,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    });

    const pollutedAttempt = {
      ...deliverable,
      // Simulate accidental merge of internal fields — serializer output itself must stay clean.
      __internalProbe: {
        storageKey: "tenants/x/y",
        provider: "openai",
        providerMetadata: { model: "x" },
        workflowRunId: "run-1",
        workflowRunStatus: "RUNNING",
        jobQueueStatus: "queued",
        queueStatus: "waiting",
        auditLog: { id: "a0" },
        auditLogs: [{ id: "a1" }],
        actualCostUsd: 12.5,
        estimatedCostUsd: 9.1,
        rawCost: 12.5,
        costRows: [{ usd: 1 }],
        adminSummaryNotes: "do not show",
        adminNotes: "internal",
        executionLog: "step-1",
        releasePackageId: "rp-1",
        miHandoffId: "mi-1"
      }
    };

    assertClientPortalPayloadHasNoForbiddenKeys(deliverable);
    assertClientPortalPayloadHasNoForbiddenKeys(monthly);
    assert.equal(monthly.hasDocument, false);

    const leaked = collectClientPortalForbiddenPayloadKeys(pollutedAttempt);
    for (const key of CLIENT_PORTAL_SERIALIZER_FORBIDDEN_KEYS) {
      assert.ok(leaked.includes(key), `detector should flag ${key}`);
      assert.equal(Object.keys(deliverable).includes(key), false, `deliverable leaked ${key}`);
      assert.equal(Object.keys(monthly).includes(key), false, `monthly leaked ${key}`);
    }
  });
});
