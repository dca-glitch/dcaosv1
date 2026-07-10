import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isClientPortalFinalMonthlyReportStatus,
  isClientPortalVisibleDeliverableStatus,
  toClientPortalDeliverableSummary,
  toClientPortalMonthlyReportSummary
} from "./client-portal.runtime";

describe("client portal final delivery guards", () => {
  it("allows only final deliverable statuses in client archive responses", () => {
    assert.equal(isClientPortalVisibleDeliverableStatus("DELIVERED"), true);
    assert.equal(isClientPortalVisibleDeliverableStatus("ACCEPTED"), true);

    assert.equal(isClientPortalVisibleDeliverableStatus("DRAFT"), false);
    assert.equal(isClientPortalVisibleDeliverableStatus("PENDING_CLIENT_REVIEW"), false);
    assert.equal(isClientPortalVisibleDeliverableStatus("APPROVED_BY_CLIENT"), false);
    assert.equal(isClientPortalVisibleDeliverableStatus("ADMIN_REVIEW"), false);
  });

  it("allows only FINAL monthly reports in client archive responses", () => {
    assert.equal(isClientPortalFinalMonthlyReportStatus("FINAL"), true);

    assert.equal(isClientPortalFinalMonthlyReportStatus("DRAFT"), false);
    assert.equal(isClientPortalFinalMonthlyReportStatus("IMPORTED"), false);
    assert.equal(isClientPortalFinalMonthlyReportStatus("APPROVED"), false);
    assert.equal(isClientPortalFinalMonthlyReportStatus("ARCHIVED"), false);
  });
});

describe("client-portal.runtime — client-safe storage serialization", () => {
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
    assert.equal(serialized.includes("storageKey"), false);
    assert.equal(serialized.includes("tenants/internal/monthly-report.pdf"), false);
  });
});
