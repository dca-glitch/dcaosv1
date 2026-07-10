import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertClientPortalPayloadHasNoForbiddenKeys,
  collectClientPortalForbiddenPayloadKeys
} from "./client-portal-error-safety";
import {
  CLIENT_PORTAL_ARCHIVE_DELIVERABLE_STATUSES,
  CLIENT_PORTAL_ARCHIVE_MONTHLY_REPORT_STATUS,
  CLIENT_PORTAL_INTERNAL_DELIVERABLE_STATUSES,
  CLIENT_PORTAL_INTERNAL_MONTHLY_REPORT_STATUSES,
  assertClientPortalSerializerNoLeak,
  findClientPortalForbiddenSerializerKeys,
  isClientPortalArchiveDeliverableStatus,
  isClientPortalArchiveMonthlyReportStatus,
  isClientPortalInternalDeliverableStatus,
  listClientPortalForbiddenSerializerKeys,
  stripClientPortalForbiddenKeys,
  toClientPortalSafeDownloadReference
} from "./client-portal-serializer";
import {
  isClientPortalFinalMonthlyReportStatus,
  isClientPortalMonthlyReportVisible,
  isClientPortalVisibleDeliverableStatus,
  toClientPortalDeliverableSummary,
  toClientPortalMonthlyReportPerformanceSummary,
  toClientPortalMonthlyReportSummary
} from "./client-portal.runtime";

const FORBIDDEN_STORAGE_KEY = "tenants/acme/private/internal-object.pdf";

describe("client-portal-serializer — no-leak helpers (G565)", () => {
  it("lists the canonical forbidden serializer keys", () => {
    const keys = listClientPortalForbiddenSerializerKeys();
    for (const required of [
      "storageKey",
      "providerMetadata",
      "provider",
      "actualCostUsd",
      "estimatedCostUsd",
      "rawCost",
      "workflowRunId",
      "workflowRunStatus",
      "jobQueueStatus"
    ]) {
      assert.ok(keys.includes(required as (typeof keys)[number]), `missing ${required}`);
    }
  });

  it("strips forbidden keys from polluted objects without mutating allowed fields", () => {
    const polluted = {
      id: "d1",
      title: "Safe title",
      exportUrl: "https://docs.example.com/x",
      storageKey: FORBIDDEN_STORAGE_KEY,
      provider: "openai",
      providerMetadata: { model: "gpt" },
      actualCostUsd: 4.2,
      nested: {
        workflowRunId: "run-1",
        status: "DELIVERED"
      }
    };

    const cleaned = stripClientPortalForbiddenKeys(polluted);
    assert.equal(cleaned.id, "d1");
    assert.equal(cleaned.title, "Safe title");
    assert.equal(cleaned.exportUrl, "https://docs.example.com/x");
    assert.equal("storageKey" in cleaned, false);
    assert.equal("provider" in cleaned, false);
    assert.equal("providerMetadata" in cleaned, false);
    assert.equal("actualCostUsd" in cleaned, false);
    assert.equal("workflowRunId" in cleaned.nested, false);
    assert.equal(cleaned.nested.status, "DELIVERED");
    assertClientPortalPayloadHasNoForbiddenKeys(cleaned);
  });

  it("assertClientPortalSerializerNoLeak rejects raw storage fragments", () => {
    assert.throws(() =>
      assertClientPortalSerializerNoLeak(
        { title: "x", note: FORBIDDEN_STORAGE_KEY },
        { forbiddenRawFragments: [FORBIDDEN_STORAGE_KEY] }
      )
    );
  });
});

describe("client-portal-serializer — internal status no-leak (G566)", () => {
  it("treats internal deliverable statuses as non-archive", () => {
    for (const status of CLIENT_PORTAL_INTERNAL_DELIVERABLE_STATUSES) {
      assert.equal(isClientPortalInternalDeliverableStatus(status), true);
      assert.equal(isClientPortalArchiveDeliverableStatus(status), false);
      assert.equal(isClientPortalVisibleDeliverableStatus(status), false);
    }
  });

  it("never serializes monthly report archive status as an internal status", () => {
    for (const status of CLIENT_PORTAL_INTERNAL_MONTHLY_REPORT_STATUSES) {
      assert.equal(isClientPortalArchiveMonthlyReportStatus(status), false);
      assert.equal(isClientPortalFinalMonthlyReportStatus(status), false);
    }

    const summary = toClientPortalMonthlyReportSummary({
      id: "r1",
      aiDeliveryProjectId: "p1",
      title: "Report",
      recommendationsText: null,
      exportUrl: null,
      finalizedAt: null,
      storageKey: null,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    });

    assert.equal(summary.status, CLIENT_PORTAL_ARCHIVE_MONTHLY_REPORT_STATUS);
    assert.equal(summary.status, "FINAL");
    assert.equal(JSON.stringify(summary).includes("DRAFT"), false);
    assert.equal(JSON.stringify(summary).includes("ADMIN_REVIEW"), false);
  });

  it("keeps performance summary free of snapshot status / notes / ids", () => {
    const performance = toClientPortalMonthlyReportPerformanceSummary({
      id: "snap-internal-1",
      targetMonth: "2026-06",
      sourceType: "GSC",
      status: "APPROVED",
      notes: "operator-only notes with workflowRunId=run-9",
      gscClicks: 10,
      gscImpressions: 100,
      gscAverageCtr: 0.1,
      gscAveragePosition: 4.2,
      ga4Sessions: null,
      ga4Users: null,
      ga4PageViews: null
    });

    const keys = Object.keys(performance);
    assert.equal(keys.includes("status"), false);
    assert.equal(keys.includes("notes"), false);
    assert.equal(keys.includes("id"), false);
    assertClientPortalSerializerNoLeak(performance, {
      forbiddenRawFragments: ["snap-internal-1", "workflowRunId=run-9"]
    });
  });
});

describe("client-portal-serializer — provider metadata no-leak (G567)", () => {
  it("detects provider and providerMetadata on polluted payloads", () => {
    const polluted = {
      deliverable: toClientPortalDeliverableSummary({
        id: "d1",
        aiDeliveryProjectId: "p1",
        title: "Article",
        description: null,
        deliveryType: "ARTICLE_DRAFT",
        status: "DELIVERED",
        exportUrl: null,
        isArchived: false,
        createdAt: new Date("2026-07-01T00:00:00.000Z"),
        updatedAt: new Date("2026-07-02T00:00:00.000Z")
      }),
      leak: {
        provider: "openrouter",
        providerMetadata: { model: "x", latencyMs: 12 }
      }
    };

    const found = findClientPortalForbiddenSerializerKeys(polluted);
    assert.ok(found.includes("provider"));
    assert.ok(found.includes("providerMetadata"));
    assertClientPortalPayloadHasNoForbiddenKeys(polluted.deliverable);
    assert.equal(Object.keys(polluted.deliverable).includes("provider"), false);
    assert.equal(Object.keys(polluted.deliverable).includes("providerMetadata"), false);
  });

  it("strips provider metadata while preserving client-safe fields", () => {
    const cleaned = stripClientPortalForbiddenKeys({
      title: "ok",
      provider: "openai",
      providerMetadata: { raw: true },
      status: "ACCEPTED"
    });
    assert.deepEqual(cleaned, { title: "ok", status: "ACCEPTED" });
  });
});

describe("client-portal-serializer — storageKey no-leak (G568)", () => {
  it("converts storageKey to hasDocument on monthly report summary", () => {
    const summary = toClientPortalMonthlyReportSummary({
      id: "r1",
      aiDeliveryProjectId: "p1",
      title: "Monthly",
      recommendationsText: null,
      exportUrl: "https://docs.example.com/monthly",
      finalizedAt: new Date("2026-07-03T00:00:00.000Z"),
      storageKey: FORBIDDEN_STORAGE_KEY,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    });

    assert.equal(summary.hasDocument, true);
    assert.equal("storageKey" in summary, false);
    assertClientPortalSerializerNoLeak(summary, {
      forbiddenRawFragments: [FORBIDDEN_STORAGE_KEY]
    });
  });

  it("builds download references without echoing storageKey", () => {
    const ref = toClientPortalSafeDownloadReference(
      FORBIDDEN_STORAGE_KEY,
      "https://signed.example.com/tmp?sig=abc",
      120
    );

    assert.deepEqual(ref, {
      downloadReference: {
        downloadUrl: "https://signed.example.com/tmp?sig=abc",
        expiresSeconds: 120
      }
    });
    assert.equal("storageKey" in ref, false);
    assert.equal("storageKey" in (ref.downloadReference as object), false);
    assertClientPortalSerializerNoLeak(ref, {
      forbiddenRawFragments: [FORBIDDEN_STORAGE_KEY]
    });
  });

  it("returns null downloadReference when storageKey is missing", () => {
    assert.deepEqual(toClientPortalSafeDownloadReference(null, "https://x", 60), {
      downloadReference: null
    });
    assert.deepEqual(toClientPortalSafeDownloadReference("  ", "https://x", 60), {
      downloadReference: null
    });
  });

  it("ignores storageKey on deliverable summary input", () => {
    const summary = toClientPortalDeliverableSummary({
      id: "d1",
      aiDeliveryProjectId: "p1",
      title: "Doc",
      description: null,
      deliveryType: "ARTICLE_DRAFT",
      status: "DELIVERED",
      exportUrl: "https://docs.example.com/doc",
      isArchived: false,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    } as Parameters<typeof toClientPortalDeliverableSummary>[0] & { storageKey: string });

    // Even if callers attach storageKey on the input object, output keys stay clean.
    const withProbe = {
      ...summary,
      storageKey: FORBIDDEN_STORAGE_KEY
    };
    const stripped = stripClientPortalForbiddenKeys(withProbe);
    assert.equal("storageKey" in stripped, false);
    assert.equal(stripped.exportUrl, "https://docs.example.com/doc");
  });
});

describe("client-portal-serializer — raw cost no-leak (G569)", () => {
  it("flags actualCostUsd, estimatedCostUsd, rawCost, and costRows", () => {
    const polluted = {
      ok: true,
      meta: {
        actualCostUsd: 1.25,
        estimatedCostUsd: 0.9,
        rawCost: 1.25,
        costRows: [{ usd: 1.25, provider: "openai" }]
      }
    };

    const found = collectClientPortalForbiddenPayloadKeys(polluted).sort();
    assert.deepEqual(found, ["actualCostUsd", "costRows", "estimatedCostUsd", "provider", "rawCost"]);
    assert.throws(() => assertClientPortalSerializerNoLeak(polluted));

    const cleaned = stripClientPortalForbiddenKeys(polluted);
    assert.deepEqual(cleaned, { ok: true, meta: {} });
    assertClientPortalSerializerNoLeak(cleaned);
  });

  it("keeps deliverable and monthly serializers free of cost keys", () => {
    const deliverable = toClientPortalDeliverableSummary({
      id: "d2",
      aiDeliveryProjectId: "p2",
      title: "Final",
      description: null,
      deliveryType: "ARTICLE_DRAFT",
      status: "ACCEPTED",
      exportUrl: null,
      isArchived: false,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    });
    const monthly = toClientPortalMonthlyReportSummary({
      id: "r2",
      aiDeliveryProjectId: "p2",
      title: "Final monthly",
      recommendationsText: null,
      exportUrl: null,
      finalizedAt: null,
      storageKey: null,
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      updatedAt: new Date("2026-07-02T00:00:00.000Z")
    });

    for (const key of ["actualCostUsd", "estimatedCostUsd", "rawCost", "costRows"]) {
      assert.equal(Object.keys(deliverable).includes(key), false);
      assert.equal(Object.keys(monthly).includes(key), false);
    }
  });
});

describe("client-portal-serializer — FINAL-only monthly + archive final-only (G571/G572)", () => {
  it("allows only FINAL non-archived monthly reports", () => {
    assert.equal(isClientPortalMonthlyReportVisible({ status: "FINAL", isArchived: false }), true);
    assert.equal(isClientPortalMonthlyReportVisible({ status: "FINAL", isArchived: true }), false);
    assert.equal(isClientPortalMonthlyReportVisible({ status: "DRAFT", isArchived: false }), false);
    assert.equal(isClientPortalMonthlyReportVisible({ status: "APPROVED", isArchived: false }), false);
    assert.equal(isClientPortalArchiveMonthlyReportStatus("FINAL"), true);
  });

  it("allows only DELIVERED/ACCEPTED archive deliverables", () => {
    assert.deepEqual([...CLIENT_PORTAL_ARCHIVE_DELIVERABLE_STATUSES], ["DELIVERED", "ACCEPTED"]);
    assert.equal(isClientPortalArchiveDeliverableStatus("DELIVERED"), true);
    assert.equal(isClientPortalArchiveDeliverableStatus("ACCEPTED"), true);
    assert.equal(isClientPortalArchiveDeliverableStatus("PENDING_CLIENT_REVIEW"), false);
    assert.equal(isClientPortalVisibleDeliverableStatus("DRAFT"), false);
  });
});
