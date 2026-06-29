import { describe, expect, it } from "vitest";
import { formatApprovalDate, parseClientPortalHash } from "./client-portal-api";

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
