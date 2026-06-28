#!/usr/bin/env node

/**
 * AI Operations Console v1 — focused local API smoke.
 * Deterministic path only; no live provider secrets required.
 */

const API_BASE = process.env.API_BASE || "http://127.0.0.1:4000/api/v1";
const ADMIN_EMAIL = process.env.AUTH_SEED_TEST_EMAIL || "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD || "";
const SMOKE_MARKER = "[SMOKE][AI_OPERATIONS]";

function fail(message) {
  throw new Error(message);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function responseHasSensitiveFields(text) {
  return /passwordHash|sessionTokenHash|api[_-]?key|authorization/i.test(text);
}

async function apiCall(method, path, body, token) {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  return { status: response.status, json, text };
}

function requireOk(name, response) {
  if (![200, 201].includes(response.status) || response.json?.ok !== true) {
    fail(`${name} failed with HTTP ${response.status}`);
  }
  if (responseHasSensitiveFields(response.text)) {
    fail(`${name} exposed sensitive fields.`);
  }
  return response.json.data;
}

async function main() {
  console.log(`${SMOKE_MARKER} starting\n`);

  if (!ADMIN_PASSWORD) {
    fail("AUTH_SEED_TEST_PASSWORD is required.");
  }

  const login = requireOk("Admin login", await apiCall("POST", "/auth/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  }, null));
  const token = login.session?.token;
  if (!token) fail("Missing auth token.");
  pass("Admin login successful");

  const unauthList = await apiCall("GET", "/ai-operations/runs", null, null);
  if (unauthList.status !== 401) {
    fail(`Unauthenticated list should return 401, got ${unauthList.status}`);
  }
  pass("Unauthenticated AI operations list blocked");

  const emptyList = requireOk("AI operations runs list", await apiCall("GET", "/ai-operations/runs?limit=10", null, token));
  if (!Array.isArray(emptyList?.runs)) {
    fail("AI operations runs list did not return runs array.");
  }
  pass(`AI operations runs list returned ${emptyList.runs.length} run(s)`);

  const client = requireOk("Create smoke client", await apiCall("POST", "/clients", {
    name: `${SMOKE_MARKER} Client ${Date.now()}`,
    country: "United States",
    clientKind: "AGENCY_CLIENT"
  }, token));
  const clientId = client.client?.id;
  if (!clientId) fail("Missing client id.");

  const project = requireOk("Create AI Delivery project", await apiCall("POST", "/ai-delivery-projects", {
    clientId,
    name: `${SMOKE_MARKER} Project ${Date.now()}`,
    targetMonth: "2026-09",
    plannedContentScopeNotes: SMOKE_MARKER
  }, token));
  const projectId = project.aiDeliveryProject?.id;
  if (!projectId) fail("Missing AI Delivery project id.");

  requireOk("Save brief draft", await apiCall("PUT", `/ai-delivery-projects/${projectId}/brief`, {
    status: "DRAFT",
    notes: `${SMOKE_MARKER} brief`
  }, token));

  const createdRun = requireOk("Create workflow run", await apiCall("POST", `/ai-delivery/projects/${projectId}/workflow-runs`, {
    status: "DRAFT",
    adminNotes: `${SMOKE_MARKER} summary proof`,
    resultPlaceholder: ""
  }, token));
  const runId = createdRun.workflowRun?.id;
  if (!runId) fail("Missing workflow run id.");

  const executed = requireOk("Execute workflow run", await apiCall("POST", `/ai-delivery/projects/${projectId}/workflow-runs/${runId}/execute`, {}, token));
  if (!executed.workflowRun || executed.workflowRun.status !== "REVIEW") {
    fail("Workflow execution did not reach REVIEW.");
  }
  pass("Workflow run executed on deterministic path");

  const malformedUpdate = requireOk("Seed malformed placeholder", await apiCall("PUT", `/ai-delivery/projects/${projectId}/workflow-runs/${runId}`, {
    status: "REVIEW",
    resultPlaceholder: "{not-valid-json"
  }, token));
  if (!malformedUpdate.workflowRun) {
    fail("Malformed placeholder update failed.");
  }
  pass("Malformed placeholder tolerated on update");

  const listed = requireOk("List AI operations runs after execution", await apiCall("GET", "/ai-operations/runs?limit=50", null, token));
  const listedRun = listed.runs.find((entry) => entry.id === runId);
  if (!listedRun) {
    fail("Executed workflow run missing from AI operations list.");
  }
  if (!listedRun.projectName || listedRun.gateway !== "local") {
    fail("AI operations list item missing expected project/gateway metadata.");
  }
  pass("AI operations list includes executed run with gateway metadata");

  const detail = requireOk("AI operations run detail", await apiCall("GET", `/ai-operations/runs/${runId}`, null, token));
  if (!detail.run || detail.run.id !== runId) {
    fail("AI operations run detail missing run payload.");
  }
  if (detail.run.resultSummary !== null && typeof detail.run.resultSummary !== "object") {
    fail("Malformed result summary should be null-safe.");
  }
  if (!detail.run.executionLogPreview) {
    fail("AI operations run detail missing execution log preview.");
  }
  pass("AI operations run detail returns parsed summaries safely");

  const notFound = await apiCall("GET", "/ai-operations/runs/not-a-real-run-id", null, token);
  if (notFound.status !== 404) {
    fail(`Missing run detail should return 404, got ${notFound.status}`);
  }
  pass("Missing AI operations run returns 404");

  const filtered = requireOk("Gateway filter", await apiCall("GET", "/ai-operations/runs?gateway=local&limit=20", null, token));
  if (!filtered.runs.every((entry) => (entry.gateway ?? "").toLowerCase() === "local")) {
    fail("Gateway filter did not constrain results.");
  }
  pass("Gateway filter works");

  const miProject = requireOk("Create MI project", await apiCall("POST", "/market-intelligence-projects", {
    title: `${SMOKE_MARKER} MI Project ${Date.now()}`,
    clientId,
    targetMonth: "2026-09",
    keywords: "smoke,test",
    niche: "operator QA"
  }, token));
  const miProjectId = miProject.project?.id;
  if (!miProjectId) fail("Missing MI project id.");

  const miRunCreated = requireOk("Create MI research run", await apiCall("POST", `/market-intelligence-projects/${miProjectId}/research-runs`, {
    status: "PENDING"
  }, token));
  const miRunId = miRunCreated.researchRun?.id;
  if (!miRunId) fail("Missing MI research run id.");

  requireOk("Execute MI research run", await apiCall("POST", `/market-intelligence-projects/${miProjectId}/research-runs/${miRunId}/execute`, {}, token));
  pass("MI research run executed on deterministic path");

  const miListed = requireOk("List AI operations MI runs", await apiCall("GET", "/ai-operations/runs?workflowKind=market_intelligence_research_run&limit=20", null, token));
  const miListedRun = miListed.runs.find((entry) => entry.id === miRunId);
  if (!miListedRun) {
    fail("Executed MI research run missing from AI operations list.");
  }
  if (miListedRun.workflowKind !== "market_intelligence_research_run") {
    fail("MI run missing expected workflowKind.");
  }
  if (miListedRun.gateway !== "local" || miListedRun.isDeterministic !== true) {
    fail("MI run missing expected local/deterministic metadata.");
  }
  pass("AI operations list includes MI research run");

  const miDetail = requireOk("AI operations MI run detail", await apiCall("GET", `/ai-operations/runs/${miRunId}`, null, token));
  if (!miDetail.run || miDetail.run.workflowKind !== "market_intelligence_research_run") {
    fail("AI operations MI run detail missing expected payload.");
  }
  pass("AI operations MI run detail returns safely");

  console.log(`\n${SMOKE_MARKER} all checks passed`);
}

main().catch((error) => {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
});
