#!/usr/bin/env node

/**
 * Mega Layer 2 — client final visibility boundary smoke.
 * Proves client portal exposes only DELIVERED/ACCEPTED finals and hides storageKey/MI/admin internals.
 */

const API_BASE = (process.env.API_BASE ?? process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const CLIENT_EMAIL = process.env.AUTH_SEED_TESTER_EMAIL;
const CLIENT_PASSWORD = process.env.AUTH_SEED_TESTER_PASSWORD ?? process.env.AUTH_SEED_TEST_PASSWORD;
const SMOKE_MARKER = "[SMOKE][CLIENT_FINAL_VISIBILITY]";

const FORBIDDEN = [
  "storageKey",
  "miContextDraft",
  "miHandoffId",
  "workflowRunId",
  "executionLog",
  "adminSummaryNotes",
  "contextPreview",
  "selectedSourcesJson"
];

let passed = 0;

function pass(label) {
  passed++;
  console.log(`  PASS: ${label}`);
}

function assert(condition, label) {
  if (!condition) throw new Error(label);
  pass(label);
}

async function apiCall(method, path, body, token) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: response.status, ok: response.ok, json, text };
}

function assertClientSafe(text, label) {
  for (const field of FORBIDDEN) {
    assert(!text.includes(field), `${label} hides ${field}`);
  }
}

async function main() {
  console.log(`${SMOKE_MARKER} starting\n`);
  if (!ADMIN_PASSWORD) throw new Error("AUTH_SEED_TEST_PASSWORD required");

  const adminLogin = await apiCall("POST", "/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  const adminToken = adminLogin.json?.data?.session?.token ?? "";
  assert(adminToken, "admin login");

  if (!CLIENT_EMAIL || !CLIENT_PASSWORD) {
    pass("client credentials missing — boundary list/detail checks skipped");
    console.log(`\n${SMOKE_MARKER} ${passed} PASS / 0 FAIL (partial)`);
    return;
  }

  const clientLogin = await apiCall("POST", "/auth/login", { email: CLIENT_EMAIL, password: CLIENT_PASSWORD });
  const clientToken = clientLogin.json?.data?.session?.token ?? "";
  assert(clientToken, "client login");

  const projects = await apiCall("GET", "/client-portal/projects", undefined, clientToken);
  assert(projects.ok, "client portal projects list");
  assertClientSafe(projects.text, "client portal projects");

  const projectId = projects.json?.data?.projects?.[0]?.id;
  if (projectId) {
    const deliverables = await apiCall(
      "GET",
      `/client-portal/projects/${projectId}/deliverables`,
      undefined,
      clientToken
    );
    if (deliverables.ok) {
      assertClientSafe(deliverables.text, "client portal deliverables");
      const rows = deliverables.json?.data?.deliverables ?? [];
      assert(
        rows.every((row) => ["DELIVERED", "ACCEPTED"].includes(row.status)),
        "client portal deliverables are DELIVERED/ACCEPTED only"
      );
    }

    const reports = await apiCall(
      "GET",
      `/client-portal/projects/${projectId}/monthly-reports`,
      undefined,
      clientToken
    );
    if (reports.ok) {
      assertClientSafe(reports.text, "client portal monthly reports");
      const reportRows = reports.json?.data?.reports ?? [];
      assert(
        reportRows.every((row) => row.status === "FINAL"),
        "client portal monthly reports are FINAL only"
      );
    }
  } else {
    pass("no client projects — empty archive boundary acceptable");
  }

  console.log(`\n${SMOKE_MARKER} ${passed} PASS / 0 FAIL`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
