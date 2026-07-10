import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMonthlyReportAdminOutput,
  buildMonthlyReportClientOutput
} from "./monthly-report-metrics-output-guard";

describe("monthly-report-metrics-output-guard", () => {
  const secrets = {
    storageKey: "private/reports/abc-storage-key",
    oauthClientSecret: "oauth-secret-value-xyz",
    refreshToken: "refresh-token-value-xyz",
    googleAccessToken: "access-token-value-xyz",
    internalSourceId: "src_internal_99",
    snapshotSourceId: "snap_src_88",
    jobStatus: "RUNNING",
    runStatus: "QUEUED",
    workflowRunId: "run_123",
    adminSummaryNotes: "INTERNAL ADMIN NOTES — do not show client"
  };

  it("G176: client output is FINAL-only and strips admin/internal fields", () => {
    const blocked = buildMonthlyReportClientOutput({
      status: "DRAFT",
      title: "Report",
      recommendationsText: "Recs",
      ...secrets
    });
    assert.equal(blocked.ok, false);
    assert.ok(blocked.errors.some((e) => /FINAL/i.test(e)));

    const ok = buildMonthlyReportClientOutput({
      status: "FINAL",
      title: "Puriva monthly delivery summary — 2026-06",
      recommendationsText: "Client-safe recommendations",
      deliveryHeadline: "Planning progress",
      clientSafePerformanceNote: "Placeholder metrics for local proof",
      metricsTruthLabel: "Metrics from approved manual snapshot",
      ...secrets
    });

    assert.equal(ok.ok, true, ok.errors.join("; "));
    assert.ok(ok.client);
    assert.equal(ok.client.status, "FINAL");
    assert.equal(ok.client.hasDocument, true);
    assert.equal("storageKey" in ok.client, false);
    assert.equal("adminSummaryNotes" in ok.client, false);
    assert.equal("internalSourceId" in ok.client, false);
    assert.equal("jobStatus" in ok.client, false);
    assert.equal("runStatus" in ok.client, false);
    assert.equal("workflowRunId" in ok.client, false);

    const serialized = JSON.stringify(ok.client);
    assert.equal(serialized.includes(secrets.storageKey), false);
    assert.equal(serialized.includes(secrets.adminSummaryNotes), false);
    assert.equal(serialized.includes(secrets.oauthClientSecret), false);
    assert.equal(serialized.includes(secrets.refreshToken), false);
    assert.equal(serialized.includes(secrets.internalSourceId), false);
    assert.equal(serialized.includes(secrets.jobStatus), false);
  });

  it("G177: admin output may include internal metadata but never secrets/storageKey", () => {
    const ok = buildMonthlyReportAdminOutput({
      status: "ADMIN_REVIEW",
      title: "Admin report title",
      recommendationsText: "Recs",
      performanceNote: "Admin performance note",
      metricsTruthLabel: "MANUAL placeholder snapshot",
      ...secrets
    });

    assert.equal(ok.ok, true, ok.errors.join("; "));
    assert.ok(ok.admin);
    assert.equal(ok.admin.status, "ADMIN_REVIEW");
    assert.equal(ok.admin.adminSummaryNotes, secrets.adminSummaryNotes);
    assert.equal(ok.admin.internalSourceId, secrets.internalSourceId);
    assert.equal(ok.admin.jobStatus, secrets.jobStatus);
    assert.equal(ok.admin.runStatus, secrets.runStatus);
    assert.equal(ok.admin.workflowRunId, secrets.workflowRunId);
    assert.equal(ok.admin.hasDocument, true);
    assert.equal("storageKey" in ok.admin, false);
    assert.equal("oauthClientSecret" in ok.admin, false);
    assert.equal("refreshToken" in ok.admin, false);

    const serialized = JSON.stringify(ok.admin);
    assert.equal(serialized.includes(secrets.storageKey), false);
    assert.equal(serialized.includes(secrets.oauthClientSecret), false);
    assert.equal(serialized.includes(secrets.refreshToken), false);
    assert.equal(serialized.includes(secrets.googleAccessToken), false);
  });

  it("G280: client output rejects ADMIN_REVIEW and strips snapshotSourceId", () => {
    const blocked = buildMonthlyReportClientOutput({
      status: "ADMIN_REVIEW",
      title: "Almost ready",
      recommendationsText: "Recs",
      ...secrets
    });
    assert.equal(blocked.ok, false);
    assert.equal(blocked.client, null);

    const ok = buildMonthlyReportClientOutput({
      ...secrets,
      status: "FINAL",
      title: "Client title",
      recommendationsText: "Safe recs",
      metricsTruthLabel: "Metrics unavailable",
      snapshotSourceId: "snap_should_not_leak"
    });
    assert.equal(ok.ok, true, ok.errors.join("; "));
    assert.equal("snapshotSourceId" in (ok.client ?? {}), false);
    assert.equal(JSON.stringify(ok.client).includes("snap_should_not_leak"), false);
    assert.equal(ok.client?.metricsTruthLabel, "Metrics unavailable");
  });

  it("G281: admin DRAFT default and hasDocument false without storageKey", () => {
    const ok = buildMonthlyReportAdminOutput({
      title: "Untitled",
      recommendationsText: ""
    });
    assert.equal(ok.ok, true, ok.errors.join("; "));
    assert.equal(ok.admin?.status, "DRAFT");
    assert.equal(ok.admin?.hasDocument, false);
    assert.equal(ok.admin?.internalSourceId, null);
  });

  it("G529: client FINAL-only matrix rejects DRAFT/ADMIN_REVIEW/ARCHIVED/empty", () => {
    for (const status of ["DRAFT", "ADMIN_REVIEW", "ARCHIVED", "", "  ", "PENDING"]) {
      const blocked = buildMonthlyReportClientOutput({
        status,
        title: "T",
        recommendationsText: "R",
        ...secrets
      });
      assert.equal(blocked.ok, false, `expected reject for status=${JSON.stringify(status)}`);
      assert.equal(blocked.client, null);
      assert.ok(blocked.errors.some((e) => /FINAL/i.test(e)));
    }

    const finalOk = buildMonthlyReportClientOutput({
      status: "FINAL",
      title: "June summary",
      recommendationsText: "Keep cadence",
      metricsTruthLabel: "Placeholder metrics for local proof",
      ...secrets
    });
    assert.equal(finalOk.ok, true, finalOk.errors.join("; "));
    assert.equal(finalOk.client?.status, "FINAL");
    assert.equal(finalOk.audience, "client");
  });

  it("G529: client payload never leaks googleAccessToken or refreshToken values", () => {
    const ok = buildMonthlyReportClientOutput({
      status: "FINAL",
      title: "Safe",
      recommendationsText: "Safe",
      ...secrets
    });
    assert.equal(ok.ok, true, ok.errors.join("; "));
    const serialized = JSON.stringify(ok.client);
    assert.equal(serialized.includes(secrets.googleAccessToken), false);
    assert.equal(serialized.includes(secrets.refreshToken), false);
    assert.equal(serialized.includes(secrets.oauthClientSecret), false);
    assert.equal(serialized.includes(secrets.snapshotSourceId), false);
  });

  it("G530: admin output redacts storageKey and OAuth secrets across statuses", () => {
    for (const status of ["DRAFT", "ADMIN_REVIEW", "FINAL", "ARCHIVED"]) {
      const ok = buildMonthlyReportAdminOutput({
        status,
        title: "Admin view",
        recommendationsText: "Internal recs",
        ...secrets
      });
      assert.equal(ok.ok, true, ok.errors.join("; "));
      assert.ok(ok.admin);
      assert.equal(ok.admin.status, status);
      assert.equal("storageKey" in ok.admin, false);
      assert.equal("oauthClientSecret" in ok.admin, false);
      assert.equal("refreshToken" in ok.admin, false);
      assert.equal("googleAccessToken" in ok.admin, false);
      const serialized = JSON.stringify(ok.admin);
      assert.equal(serialized.includes(secrets.storageKey), false);
      assert.equal(serialized.includes(secrets.oauthClientSecret), false);
      assert.equal(serialized.includes(secrets.refreshToken), false);
      assert.equal(serialized.includes(secrets.googleAccessToken), false);
      // Admin may retain internal metadata
      assert.equal(ok.admin.adminSummaryNotes, secrets.adminSummaryNotes);
      assert.equal(ok.admin.hasDocument, true);
    }
  });

  it("G530: admin falls back to snapshotSourceId when internalSourceId absent", () => {
    const ok = buildMonthlyReportAdminOutput({
      status: "DRAFT",
      title: "T",
      recommendationsText: "R",
      snapshotSourceId: "snap_only_77"
    });
    assert.equal(ok.ok, true, ok.errors.join("; "));
    assert.equal(ok.admin?.internalSourceId, "snap_only_77");
    assert.equal("snapshotSourceId" in (ok.admin ?? {}), false);
  });
});
