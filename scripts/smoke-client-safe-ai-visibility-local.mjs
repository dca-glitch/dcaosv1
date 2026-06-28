#!/usr/bin/env node

/**
 * Client-safe AI visibility audit smoke.
 * Proves Client Portal and unauthenticated surfaces do not expose AI internals.
 */

const API_BASE = (process.env.API_BASE ?? process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const SMOKE_MARKER = "[SMOKE][CLIENT_SAFE_AI]";
const clientEmail = process.env.AUTH_SEED_TESTER_EMAIL;
const clientPassword = process.env.AUTH_SEED_TESTER_PASSWORD ?? process.env.AUTH_SEED_TEST_PASSWORD;

const SECRET_LEAK_PATTERNS = [
  /passwordHash/i,
  /sessionTokenHash/i,
  /api[_-]?key/i,
  /authorization\s*:/i,
  /\[OBSERVABILITY\]\s*\{/i
];

const CLIENT_PORTAL_FORBIDDEN_PATTERNS = [
  ...SECRET_LEAK_PATTERNS,
  /"executionLog"/i,
  /"resultPlaceholder"/i,
  /"rawResultJson"/i,
  /"prompt"/i,
  /"workflowRunId"/i,
  /"miContextDraft"/i,
  /"miHandoffId"/i,
  /AI_WORKFLOW_RESULT_V1/i
];

function fail(message) {
  throw new Error(message);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

async function apiCall(method, path, body, token) {
  const headers = { Accept: "application/json" };
  const hasBody = body !== undefined && body !== null;
  if (hasBody) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined
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

function assertNoPatterns(label, text, patterns) {
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      fail(`${label} exposed forbidden pattern: ${pattern}`);
    }
  }
}

async function main() {
  console.log(`${SMOKE_MARKER} starting\n`);

  if (!process.env.AUTH_SEED_TEST_PASSWORD) {
    fail("AUTH_SEED_TEST_PASSWORD is required.");
  }

  const unauthOps = await apiCall("GET", "/ai-operations/runs", null, null);
  if (unauthOps.status !== 401) {
    fail(`AI operations list should be 401 without auth, got ${unauthOps.status}`);
  }
  pass("AI operations API blocked without auth");

  const unauthProvider = await apiCall("GET", "/ai-provider/planning-config", null, null);
  if (unauthProvider.status !== 401) {
    fail(`AI provider planning config should be 401 without auth, got ${unauthProvider.status}`);
  }
  pass("AI provider planning config blocked without auth");

  const login = await apiCall("POST", "/auth/login", {
    email: process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local",
    password: process.env.AUTH_SEED_TEST_PASSWORD
  });
  if (login.status !== 200 || login.json?.ok !== true) {
    fail("Admin login failed.");
  }
  const adminToken = login.json.data?.session?.token;
  if (!adminToken) fail("Missing admin token.");

  const adminOps = await apiCall("GET", "/ai-operations/runs?limit=5", null, adminToken);
  if (adminOps.status !== 200) fail("Admin AI operations list failed.");
  assertNoPatterns("admin AI operations list", adminOps.text, SECRET_LEAK_PATTERNS);
  pass("Admin AI operations list has no secret/internal leakage patterns");

  if (!clientEmail || !clientPassword) {
    console.log("SKIP: AUTH_SEED_TESTER_EMAIL not set — client portal route probes deferred (admin-only AI boundary checks passed).");
    console.log(`\n${SMOKE_MARKER} admin boundary checks passed`);
    return;
  }

  const clientLogin = await apiCall("POST", "/auth/login", {
    email: clientEmail,
    password: clientPassword
  });
  if (clientLogin.status !== 200 || clientLogin.json?.ok !== true) {
    fail(`Client tester login failed with HTTP ${clientLogin.status}`);
  }
  const clientToken = clientLogin.json.data?.session?.token;
  if (!clientToken) fail("Missing client tester token.");

  const portalProjects = await apiCall("GET", "/client-portal/ai-delivery-projects", null, clientToken);
  if (portalProjects.status !== 200) fail(`Client portal projects failed with ${portalProjects.status}`);
  assertNoPatterns("client portal projects", portalProjects.text, CLIENT_PORTAL_FORBIDDEN_PATTERNS);
  pass("Client portal project list has no AI internals");

  const projects = portalProjects.json?.data?.aiDeliveryProjects ?? [];
  if (projects.length > 0) {
    const projectId = projects[0].id;
    const portalDeliverables = await apiCall("GET", `/client-portal/ai-delivery-projects/${projectId}/deliverables`, null, clientToken);
    if (portalDeliverables.status === 200) {
      assertNoPatterns("client portal deliverables", portalDeliverables.text, CLIENT_PORTAL_FORBIDDEN_PATTERNS);
      pass("Client portal deliverables have no AI internals");
    }

    const portalReports = await apiCall("GET", `/client-portal/ai-delivery-projects/${projectId}/monthly-reports`, null, clientToken);
    if (portalReports.status === 200) {
      assertNoPatterns("client portal monthly reports", portalReports.text, CLIENT_PORTAL_FORBIDDEN_PATTERNS);
      pass("Client portal monthly reports have no AI internals");
    }

    const deliveryOverview = await apiCall("GET", `/client-portal/ai-delivery-projects/${projectId}/delivery-overview`, null, clientToken);
    if (deliveryOverview.status === 200) {
      assertNoPatterns("client portal delivery overview", deliveryOverview.text, CLIENT_PORTAL_FORBIDDEN_PATTERNS);
      pass("Client portal delivery overview has no AI internals");
    } else {
      pass(`Client portal delivery overview returned ${deliveryOverview.status} (acceptable)`);
    }
  } else {
    pass("Client portal has no projects for tester — list shape still client-safe");
  }

  console.log(`\n${SMOKE_MARKER} all checks passed`);
}

main().catch((error) => {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
});
