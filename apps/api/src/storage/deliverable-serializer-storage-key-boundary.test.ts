import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toClientPortalDeliverableSummary } from "../core/client-portal.runtime";
import { payloadRespectsClientStorageFieldPolicy } from "./admin-vs-client-storage-field-policy";
import {
  evaluateExportUrlStorageKeyMatrix,
  payloadRespectsExportUrlStorageKeyMatrix
} from "./export-url-storage-key-matrix";
import { assertNoStorageKeyLeak, toStorageKeyBoundarySnapshot } from "./storage-key-boundary";

/**
 * G153 / G240 / G483 — Deliverable serializer storageKey leak boundary.
 * Exercises the exported client-portal deliverable serializer (read-only import).
 * Admin `toAiDeliveryDeliverableSummary` in core.runtime.ts is not exported; see main-agent note.
 */
describe("deliverable-serializer-storage-key-boundary (G153 / G240 / G483)", () => {
  it("preserves exportUrl and never leaks storageKey from client deliverable summary", () => {
    const forbiddenKey = "tenants/acme/years/2026/projects/p1/months/07/documents/deliverable.pdf";
    const summary = toClientPortalDeliverableSummary({
      id: "deliverable-boundary-1",
      aiDeliveryProjectId: "project-boundary-1",
      title: "Boundary deliverable",
      description: "Client-visible package",
      deliveryType: "CONTENT_PACKAGE",
      status: "DELIVERED",
      exportUrl: "https://docs.example.com/export/boundary-deliverable",
      isArchived: false,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    });

    // Even if a caller somehow attached storageKey on the input object, output must stay clean.
    const pollutedInput = {
      ...summary,
      // re-run through serializer with an extra field on a structurally compatible object
    };
    void pollutedInput;

    const fromPolluted = toClientPortalDeliverableSummary({
      id: "deliverable-boundary-2",
      aiDeliveryProjectId: "project-boundary-1",
      title: "Boundary deliverable 2",
      description: null,
      deliveryType: "ARTICLE_DRAFT",
      status: "ACCEPTED",
      exportUrl: "https://docs.example.com/export/boundary-2",
      isArchived: false,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z"),
      storageKey: forbiddenKey
    } as Parameters<typeof toClientPortalDeliverableSummary>[0] & { storageKey: string });

    assert.equal(fromPolluted.exportUrl, "https://docs.example.com/export/boundary-2");
    assert.equal("storageKey" in fromPolluted, false);
    assertNoStorageKeyLeak(fromPolluted, { forbiddenStorageKey: forbiddenKey });
    assert.equal(payloadRespectsClientStorageFieldPolicy(fromPolluted), true);
    assert.deepEqual(toStorageKeyBoundarySnapshot(fromPolluted, forbiddenKey), {
      hasStorageKeyField: false,
      hasDocumentStorageKeyField: false,
      containsForbiddenKeyValue: false,
      forbiddenFieldPathCount: 0,
      liveProven: false
    });
  });

  it("allows null exportUrl without inventing storageKey", () => {
    const summary = toClientPortalDeliverableSummary({
      id: "deliverable-boundary-3",
      aiDeliveryProjectId: "project-boundary-1",
      title: "No export yet",
      description: null,
      deliveryType: "OTHER",
      status: "DELIVERED",
      exportUrl: null,
      isArchived: false,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    });

    assert.equal(summary.exportUrl, null);
    assertNoStorageKeyLeak(summary);
  });

  it("keeps DRAFT and ACCEPTED client summaries free of storageKey (G240)", () => {
    for (const status of ["DRAFT", "IN_REVIEW", "DELIVERED", "ACCEPTED"] as const) {
      const forbiddenKey = `tenants/acme/documents/${status.toLowerCase()}.pdf`;
      const summary = toClientPortalDeliverableSummary({
        id: `deliverable-${status}`,
        aiDeliveryProjectId: "project-boundary-1",
        title: status,
        description: null,
        deliveryType: "OTHER",
        status,
        exportUrl: status === "DRAFT" ? null : "https://docs.example.com/export/x",
        isArchived: false,
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
        updatedAt: new Date("2026-07-02T00:00:00.000Z"),
        storageKey: forbiddenKey
      } as Parameters<typeof toClientPortalDeliverableSummary>[0] & { storageKey: string });

      assertNoStorageKeyLeak(summary, { forbiddenStorageKey: forbiddenKey });
      assert.equal(payloadRespectsClientStorageFieldPolicy(summary), true);
    }
  });

  it("proves client-safe deliverable exportUrl output without storageKey (G483)", () => {
    const forbiddenKey = "tenants/acme/years/2026/documents/g483-deliverable.pdf";
    const summary = toClientPortalDeliverableSummary({
      id: "deliverable-g483",
      aiDeliveryProjectId: "project-boundary-1",
      title: "G483 deliverable",
      description: "Client package",
      deliveryType: "CONTENT_PACKAGE",
      status: "DELIVERED",
      exportUrl: "https://docs.example.com/export/g483-deliverable",
      isArchived: false,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z"),
      storageKey: forbiddenKey
    } as Parameters<typeof toClientPortalDeliverableSummary>[0] & { storageKey: string });

    assert.equal(
      evaluateExportUrlStorageKeyMatrix("client_portal_deliverable_summary", "exportUrl").allowed,
      true
    );
    assert.equal(
      evaluateExportUrlStorageKeyMatrix("client_portal_deliverable_summary", "storageKey").allowed,
      false
    );
    assert.equal(summary.exportUrl, "https://docs.example.com/export/g483-deliverable");
    assert.equal("storageKey" in summary, false);
    assert.equal(
      payloadRespectsExportUrlStorageKeyMatrix("client_portal_deliverable_summary", summary).ok,
      true
    );
    assert.equal(payloadRespectsClientStorageFieldPolicy(summary), true);
    assertNoStorageKeyLeak(summary, { forbiddenStorageKey: forbiddenKey });
  });
});
