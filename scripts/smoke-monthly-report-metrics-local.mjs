#!/usr/bin/env node

const API_BASE = process.env.API_BASE || "http://localhost:4000/api/v1";
const ADMIN_EMAIL = "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD || "";
const TARGET_MONTH = "2026-06";

const FORBIDDEN_FIELDS = [
  "storageKey",
  "tenantId",
  "workflowRunId",
  "executionLog",
  "executionError",
  "draftBody",
  "prompt",
  "reviewNotes",
  "reviewerName"
];

let passed = 0;
let failed = 0;

function pass(label) {
  console.log(`  ✅ PASS: ${label}`);
  passed++;
}

function fail(label, detail) {
  console.log(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
  failed++;
}

async function apiCall(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  return { status: response.status, ok: response.ok, json, text };
}

function containsForbiddenField(value, fieldName) {
  const text = JSON.stringify(value);
  return new RegExp(`(?:^|[^A-Za-z0-9_])${fieldName}(?:[^A-Za-z0-9_]|$)`).test(text);
}

function assertNoForbiddenFields(label, value) {
  const text = JSON.stringify(value);
  for (const field of FORBIDDEN_FIELDS) {
    if (containsForbiddenField(value, field)) {
      fail(label, `forbidden field present: ${field}`);
      return false;
    }
  }

  pass(`${label} omitted forbidden fields`);
  return true;
}

async function main() {
  console.log("🔍 Monthly Report Metrics smoke test\n");

  if (!ADMIN_PASSWORD) {
    throw new Error("AUTH_SEED_TEST_PASSWORD environment variable is required");
  }

  let token = "";
  let clientId = "";
  let projectId = "";
  let reportId = "";
  let snapshotId = "";

  console.log("Step 1: Admin login");
  {
    const { ok, json } = await apiCall("POST", "/auth/login", {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    token = json.data?.session?.token ?? "";
    if (ok && token) {
      pass("Admin login returned auth token");
    } else {
      fail("Admin login", JSON.stringify(json.error ?? json));
      throw new Error("Cannot continue without auth token");
    }
  }
  console.log();

  console.log("Step 2: Create client");
  {
    const { ok, json } = await apiCall("POST", "/clients", {
      name: "Smoke Metrics Client",
      email: "smoke-metrics@dca.local"
    }, token);
    clientId = json.data?.client?.id ?? "";
    if (ok && clientId) {
      pass(`Client created: ${clientId}`);
    } else {
      fail("Create client", JSON.stringify(json.error ?? json));
      throw new Error("Cannot continue without client");
    }
  }
  console.log();

  console.log("Step 3: Create AI Delivery project");
  {
    const { ok, json } = await apiCall("POST", "/ai-delivery-projects", {
      clientId,
      name: "Smoke Metrics Project",
      targetMonth: TARGET_MONTH
    }, token);
    projectId = json.data?.aiDeliveryProject?.id ?? "";
    if (ok && projectId) {
      pass(`Project created: ${projectId}`);
    } else {
      fail("Create project", JSON.stringify(json.error ?? json));
      throw new Error("Cannot continue without project");
    }
  }
  console.log();

  console.log("Step 4: Create monthly report");
  {
    const { ok, json } = await apiCall("POST", `/ai-delivery/reports/monthly/${projectId}`, {}, token);
    reportId = json.data?.report?.id ?? "";
    if (ok && reportId) {
      pass(`Monthly report created: ${reportId}`);
    } else {
      fail("Create monthly report", JSON.stringify(json.error ?? json));
      throw new Error("Cannot continue without monthly report");
    }
  }
  console.log();

  console.log("Step 5: Import monthly metrics snapshot");
  {
    const { ok, status, json } = await apiCall("POST", `/ai-delivery/reports/monthly/${reportId}/metrics/import`, {
      targetMonth: TARGET_MONTH,
      sourceType: "MANUAL",
      status: "IMPORTED",
      gscClicks: 42,
      gscImpressions: 420,
      gscAverageCtr: 10,
      gscAveragePosition: 7.5,
      ga4Sessions: 12,
      ga4Users: 8,
      ga4PageViews: 33,
      notes: "Smoke metrics snapshot"
    }, token);
    snapshotId = json.data?.snapshot?.id ?? "";
    if (ok && status === 201 && snapshotId) {
      pass(`Snapshot imported: ${snapshotId}`);
      assertNoForbiddenFields("import response", json);
    } else {
      fail("Import metrics snapshot", JSON.stringify(json.error ?? json));
      throw new Error("Cannot continue without metrics snapshot");
    }
  }
  console.log();

  console.log("Step 6: Approve monthly metrics snapshot");
  {
    const { ok, json } = await apiCall("POST", `/ai-delivery/reports/monthly/${reportId}/metrics/${snapshotId}/approve`, {}, token);
    if (ok && json.data?.snapshot?.status === "APPROVED") {
      pass("Snapshot approved");
      assertNoForbiddenFields("approve response", json);
    } else {
      fail("Approve metrics snapshot", JSON.stringify(json.error ?? json));
      throw new Error("Cannot continue without approved snapshot");
    }
  }
  console.log();

  console.log("Step 7: GET monthly metrics");
  {
    const { ok, status, json } = await apiCall("GET", `/ai-delivery/reports/monthly/${reportId}/metrics`, undefined, token);
    const metrics = json.data?.metrics;
    if (ok && status === 200 && metrics?.report?.id === reportId) {
      pass("Metrics endpoint returned report context");
    } else {
      fail("Metrics endpoint", JSON.stringify(json.error ?? json));
      throw new Error("Cannot continue without metrics response");
    }

    if (metrics?.snapshots?.length === 1 && metrics.snapshots[0].id === snapshotId) {
      pass("Metrics endpoint returned the imported snapshot");
    } else {
      fail("Metrics snapshots", JSON.stringify(metrics?.snapshots ?? []));
    }

    if (metrics?.computedTrendSummary?.dataStatus === "PARTIAL") {
      pass("Trend summary dataStatus = PARTIAL");
    } else {
      fail("Trend summary dataStatus", JSON.stringify(metrics?.computedTrendSummary ?? null));
    }

    assertNoForbiddenFields("metrics response", json);
  }
  console.log();

  console.log("Step 8: Archive monthly metrics snapshot");
  {
    const { ok, json } = await apiCall("POST", `/ai-delivery/reports/monthly/${reportId}/metrics/${snapshotId}/archive`, {}, token);
    if (ok && json.data?.snapshot?.status === "ARCHIVED") {
      pass("Snapshot archived");
      assertNoForbiddenFields("archive response", json);
    } else {
      fail("Archive metrics snapshot", JSON.stringify(json.error ?? json));
      throw new Error("Cannot continue without archived snapshot");
    }
  }
  console.log();

  console.log(`Summary: ${passed} PASS / ${failed} FAIL`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Fatal: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
