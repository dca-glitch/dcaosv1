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
});
