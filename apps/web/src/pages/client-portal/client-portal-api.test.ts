import { describe, expect, it } from "vitest";
import {
  formatApprovalDate,
  parseClientPortalHash,
  toClientPortalUiSafeErrorMessage,
  type DeliverableForApproval,
  type PendingApprovalSummary
} from "./client-portal-api";

describe("parseClientPortalHash", () => {
  it("parses archive as default view", () => {
    expect(parseClientPortalHash("#/client-portal")).toEqual({ view: "archive" });
    expect(parseClientPortalHash("#client-portal")).toEqual({ view: "archive" });
  });

  it("parses pending approvals route", () => {
    expect(parseClientPortalHash("#/client-portal/pending-approvals")).toEqual({
      view: "pending-approvals"
    });
  });

  it("parses briefs route", () => {
    expect(parseClientPortalHash("#/client-portal/briefs")).toEqual({ view: "briefs" });
  });

  it("parses deliverable approval route", () => {
    expect(parseClientPortalHash("#/client-portal/deliverables/abc-123/approve")).toEqual({
      view: "approve",
      deliverableId: "abc-123"
    });
  });
});

describe("formatApprovalDate", () => {
  it("formats valid ISO dates", () => {
    const formatted = formatApprovalDate("2026-06-15T12:00:00.000Z");
    expect(formatted).toMatch(/2026/);
  });

  it("falls back to date prefix for invalid values", () => {
    expect(formatApprovalDate("not-a-date-value-here")).toBe("not-a-date");
  });
});

describe("toClientPortalUiSafeErrorMessage (G204/G344/G570)", () => {
  it("keeps short safe messages", () => {
    expect(toClientPortalUiSafeErrorMessage("Monthly report not found.")).toBe(
      "Monthly report not found."
    );
  });

  it("replaces messages that leak storage keys or stacks", () => {
    expect(
      toClientPortalUiSafeErrorMessage(
        "Failed storageKey=tenants/acme/file.pdf at Object.open (runtime.ts:1:1)"
      )
    ).toBe("Request could not be completed.");
  });

  it("replaces provider and workflow internals in UI errors", () => {
    expect(toClientPortalUiSafeErrorMessage("providerMetadata=openai failed")).toBe(
      "Request could not be completed."
    );
    expect(toClientPortalUiSafeErrorMessage("provider=openai failed")).toBe(
      "Request could not be completed."
    );
    expect(toClientPortalUiSafeErrorMessage("workflowRunId=run-1 failed")).toBe(
      "Request could not be completed."
    );
    expect(toClientPortalUiSafeErrorMessage("workflowRunStatus=FAILED")).toBe(
      "Request could not be completed."
    );
  });

  it("replaces raw cost markers in UI errors (G569)", () => {
    expect(toClientPortalUiSafeErrorMessage("actualCostUsd=12.5 billed")).toBe(
      "Request could not be completed."
    );
    expect(toClientPortalUiSafeErrorMessage("estimatedCostUsd=9.1")).toBe(
      "Request could not be completed."
    );
    expect(toClientPortalUiSafeErrorMessage("rawCost leaked")).toBe(
      "Request could not be completed."
    );
  });

  it("replaces oversized UI messages", () => {
    expect(toClientPortalUiSafeErrorMessage("x".repeat(241))).toBe("Request could not be completed.");
  });
});

describe("client portal web types stay free of forbidden field names (G344)", () => {
  it("documents pending approval and approval detail shapes without storage/provider/cost keys", () => {
    const pending: PendingApprovalSummary = {
      id: "d1",
      title: "Article",
      status: "PENDING_CLIENT_REVIEW",
      projectId: "p1",
      projectName: "Project",
      clientId: "c1",
      clientName: "Client",
      createdAt: "2026-07-01T00:00:00.000Z"
    };
    const detail: DeliverableForApproval = {
      id: "d2",
      title: "Article",
      description: null,
      tags: [],
      category: null,
      scheduledPublishAt: null,
      status: "PENDING_CLIENT_REVIEW",
      bodyContent: "Body",
      projectId: "p1",
      projectName: "Project",
      clientId: "c1",
      clientName: null,
      createdAt: "2026-07-01T00:00:00.000Z",
      images: []
    };

    const pendingKeys = Object.keys(pending);
    const detailKeys = Object.keys(detail);
    for (const forbidden of [
      "storageKey",
      "provider",
      "providerMetadata",
      "actualCostUsd",
      "estimatedCostUsd",
      "workflowRunId",
      "adminSummaryNotes"
    ]) {
      expect(pendingKeys).not.toContain(forbidden);
      expect(detailKeys).not.toContain(forbidden);
    }
  });
});
