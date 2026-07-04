#!/usr/bin/env node

/**
 * MI Mega Block 1 — core execution foundation smoke.
 * Proves admin findings/summaries, tenant isolation, client boundary, no provider calls.
 */

const API_BASE = (process.env.API_BASE ?? process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const CLIENT_EMAIL = process.env.AUTH_SEED_TESTER_EMAIL;
const CLIENT_PASSWORD = process.env.AUTH_SEED_TESTER_PASSWORD ?? process.env.AUTH_SEED_TEST_PASSWORD;
const SMOKE_MARKER = "[SMOKE][MI_CORE_EXECUTION]";

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

async function request(path, options = {}) {
  const headers = { Accept: "application/json" };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  return { status: response.status, body, text };
}

async function expectFailure(method, path, body, token) {
  const response = await request(path, { method, body, token });
  if (response.status >= 200 && response.status < 300) {
    throw new Error(`Expected failure for ${method} ${path}, got ${response.status}`);
  }
  return response.status;
}

async function main() {
  console.log(`${SMOKE_MARKER} starting\n`);

  if (!ADMIN_PASSWORD) {
    record("env AUTH_SEED_TEST_PASSWORD", false, "missing");
    process.exit(1);
  }
  record("env AUTH_SEED_TEST_PASSWORD", true, "present");

  const health = await request("/health");
  record("api health", health.status === 200 && health.body?.ok === true, `${health.status}`);
  if (health.status !== 200) {
    process.exit(1);
  }

  const login = await request("/auth/login", {
    method: "POST",
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  });
  const adminToken = login.body?.data?.session?.token;
  if (!adminToken) {
    record("admin login", false, "no token");
    process.exit(1);
  }
  record("admin login", true);

  const clientRes = await request("/clients", {
    method: "POST",
    body: {
      name: `[SMOKE][MI_CORE] ${Date.now()}`,
      country: "United States",
      clientKind: "AGENCY_CLIENT"
    },
    token: adminToken
  });
  const clientId = clientRes.body?.data?.client?.id;
  if (!clientId) {
    record("create smoke client", false);
    process.exit(1);
  }
  record("create smoke client", true, clientId);

  const projectRes = await request("/market-intelligence-projects", {
    method: "POST",
    body: {
      title: `[SMOKE][MI_CORE] ${Date.now()}`,
      clientId,
      targetMonth: "2026-07",
      keywords: "core execution",
      niche: "B2B SaaS",
      status: "ACTIVE"
    },
    token: adminToken
  });
  const projectId = projectRes.body?.data?.project?.id;
  if (!projectId) {
    record("create MI project", false, JSON.stringify(projectRes.body));
    process.exit(1);
  }
  record("create MI workspace/project", true, projectId);

  const projectBRes = await request("/market-intelligence-projects", {
    method: "POST",
    body: { title: `[SMOKE][MI_CORE_B] ${Date.now()}`, clientId, status: "ACTIVE" },
    token: adminToken
  });
  const projectBId = projectBRes.body?.data?.project?.id;
  if (!projectBId) {
    record("create isolation project B", false);
    process.exit(1);
  }

  const sourceRes = await request(`/market-intelligence-projects/${projectId}/sources`, {
    method: "POST",
    body: {
      title: "Competitor pricing page",
      sourceType: "COMPETITOR",
      sourceUrl: "https://example.com/pricing",
      sourceNotes: "Manual admin note"
    },
    token: adminToken
  });
  const sourceId = sourceRes.body?.data?.source?.id;
  record("add source", Boolean(sourceId), sourceId ?? "");
  if (!sourceId) process.exit(1);

  const findingRes = await request(`/market-intelligence-projects/${projectId}/findings`, {
    method: "POST",
    body: {
      findingCategory: "COMPETITOR",
      findingText: "Competitor undercuts on starter tier pricing.",
      priority: "HIGH",
      sourceId
    },
    token: adminToken
  });
  const findingId = findingRes.body?.data?.finding?.id;
  record("add finding", Boolean(findingId), findingId ?? "");
  if (!findingId) process.exit(1);

  const previewRes = await request(`/market-intelligence-projects/${projectId}/summaries/generate`, {
    method: "POST",
    body: { persist: false },
    token: adminToken
  });
  const previewText = previewRes.body?.data?.preview?.summaryText ?? "";
  const integrationVersion = previewRes.body?.data?.preview?.integrationContext?.version ?? "";
  record(
    "deterministic summary preview",
    previewRes.status === 200 && previewText.includes("admin draft / internal") && integrationVersion === "MI_SUMMARY_V1",
    integrationVersion
  );
  if (!previewText.includes("No live provider")) {
    record("no provider marker in preview", false);
    process.exit(1);
  }
  record("no provider marker in preview", true);

  const saveRes = await request(`/market-intelligence-projects/${projectId}/summaries/generate`, {
    method: "POST",
    body: { persist: true },
    token: adminToken
  });
  const summaryId = saveRes.body?.data?.summary?.id;
  record("save generated summary", Boolean(summaryId), summaryId ?? "");
  if (!summaryId) process.exit(1);

  const finalizeRes = await request(`/market-intelligence-projects/${projectId}/summaries/${summaryId}/finalize`, {
    method: "POST",
    token: adminToken
  });
  record(
    "finalize summary",
    finalizeRes.body?.data?.summary?.status === "FINALIZED",
    finalizeRes.body?.data?.summary?.status ?? ""
  );

  const crossFindingStatus = await expectFailure(
    "PUT",
    `/market-intelligence-projects/${projectBId}/findings/${findingId}`,
    { findingText: "should fail" },
    adminToken
  );
  record("tenant/project isolation on finding update", crossFindingStatus >= 400 && crossFindingStatus < 500, `${crossFindingStatus}`);

  const crossSummaryStatus = await expectFailure(
    "POST",
    `/market-intelligence-projects/${projectBId}/summaries/${summaryId}/finalize`,
    {},
    adminToken
  );
  record("tenant/project isolation on summary finalize", crossSummaryStatus >= 400 && crossSummaryStatus < 500, `${crossSummaryStatus}`);

  if (CLIENT_EMAIL && CLIENT_PASSWORD) {
    const clientLogin = await request("/auth/login", {
      method: "POST",
      body: { email: CLIENT_EMAIL, password: CLIENT_PASSWORD }
    });
    const clientToken = clientLogin.body?.data?.session?.token;
    if (clientToken) {
      const blockedProjects = await expectFailure("GET", "/market-intelligence-projects", undefined, clientToken);
      record("client cannot list MI projects", blockedProjects === 403, `${blockedProjects}`);
      const blockedFindings = await expectFailure(
        "GET",
        `/market-intelligence-projects/${projectId}/findings`,
        undefined,
        clientToken
      );
      record("client cannot list MI findings", blockedFindings === 403, `${blockedFindings}`);
      const blockedSummaries = await expectFailure(
        "GET",
        `/market-intelligence-projects/${projectId}/summaries`,
        undefined,
        clientToken
      );
      record("client cannot list MI summaries", blockedSummaries === 403, `${blockedSummaries}`);
    } else {
      record("client login for boundary", false, "no token");
    }
  } else {
    record("client boundary", true, "SKIPPED: AUTH_SEED_TESTER_EMAIL not set");
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`\n${SMOKE_MARKER} complete: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`${SMOKE_MARKER} fatal:`, error instanceof Error ? error.message : String(error));
  process.exit(1);
});
