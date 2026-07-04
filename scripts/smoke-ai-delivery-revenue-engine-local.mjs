#!/usr/bin/env node

/**
 * AI Delivery Revenue Engine Mega Layer 1 smoke.
 * Proves deterministic delivery chain: MI summary → workflow context → content plan → draft → readiness → monthly report.
 * No live provider calls.
 */

const API_BASE = (process.env.API_BASE ?? process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const CLIENT_EMAIL = process.env.AUTH_SEED_TESTER_EMAIL;
const CLIENT_PASSWORD = process.env.AUTH_SEED_TESTER_PASSWORD ?? process.env.AUTH_SEED_TEST_PASSWORD;
const SMOKE_MARKER = "[SMOKE][AI_DELIVERY_REVENUE_ENGINE]";
const TARGET_MONTH = "2026-10";

let passed = 0;

function pass(label) {
  passed++;
  console.log(`  PASS: ${label}`);
}

function assert(condition, label, detail = "") {
  if (!condition) {
    throw new Error(`${label}${detail ? ` — ${detail}` : ""}`);
  }
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

async function expectFailure(method, path, body, token) {
  const response = await apiCall(method, path, body, token);
  if (response.status >= 200 && response.status < 300) {
    throw new Error(`Expected failure for ${method} ${path}, got ${response.status}`);
  }
  return response.status;
}

async function ensureModuleEnabled(token, moduleKey) {
  const current = await apiCall("GET", "/modules/current", undefined, token);
  const entry = current.json?.data?.modules?.find((module) => module.key === moduleKey);
  if (entry?.enabled === true) return true;
  const enable = await apiCall("POST", `/modules/current/${moduleKey}/enable`, {}, token);
  return enable.status === 200 && enable.json?.ok === true;
}

async function main() {
  console.log(`${SMOKE_MARKER} starting\n`);

  if (!ADMIN_PASSWORD) {
    throw new Error("AUTH_SEED_TEST_PASSWORD environment variable is required");
  }

  const login = await apiCall("POST", "/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  const adminToken = login.json?.data?.session?.token ?? "";
  assert(login.ok && adminToken, "admin login");

  assert(await ensureModuleEnabled(adminToken, "ai-delivery"), "ai-delivery module enabled");
  assert(await ensureModuleEnabled(adminToken, "market-intelligence"), "market-intelligence module enabled");

  const smokeId = `revenue-engine-${Date.now()}`;
  const client = await apiCall("POST", "/clients", {
    name: `${SMOKE_MARKER} ${smokeId}`,
    email: `${smokeId}@dca.local`
  }, adminToken);
  const clientId = client.json?.data?.client?.id ?? "";
  assert(client.status === 201 && clientId, "client created");

  const aiProject = await apiCall("POST", "/ai-delivery-projects", {
    clientId,
    name: `${SMOKE_MARKER} ${smokeId}`,
    targetMonth: TARGET_MONTH
  }, adminToken);
  const aiDeliveryProjectId = aiProject.json?.data?.aiDeliveryProject?.id ?? "";
  assert(aiProject.status === 201 && aiDeliveryProjectId, "AI Delivery project created");

  const brief = await apiCall("GET", `/ai-delivery-projects/${aiDeliveryProjectId}/brief`, undefined, adminToken);
  assert(brief.ok && brief.json?.data?.brief?.id, "brief exists for project");

  const miProject = await apiCall("POST", "/market-intelligence-projects", {
    title: `${SMOKE_MARKER} ${smokeId}`,
    clientId,
    targetMonth: TARGET_MONTH,
    status: "ACTIVE",
    keywords: "revenue, deterministic",
    competitors: "Fixture Co"
  }, adminToken);
  const miProjectId = miProject.json?.data?.project?.id ?? "";
  assert(miProject.status === 201 && miProjectId, "MI project created");

  await apiCall("POST", `/market-intelligence-projects/${miProjectId}/findings`, {
    projectId: miProjectId,
    findingCategory: "AUDIENCE",
    findingText: "Audience asks about monthly SEO planning and conversion topics",
    priority: "HIGH"
  }, adminToken);

  const generated = await apiCall(
    "POST",
    `/market-intelligence-projects/${miProjectId}/summaries/generate`,
    { persist: true },
    adminToken
  );
  const draftSummaryId = generated.json?.data?.summary?.id ?? "";
  assert(generated.ok && draftSummaryId, "MI summary generated");
  assert(generated.json?.data?.summary?.integrationContext?.version === "MI_SUMMARY_V1", "MI_SUMMARY_V1 integration context");

  const finalize = await apiCall(
    "POST",
    `/market-intelligence-projects/${miProjectId}/summaries/${draftSummaryId}/finalize`,
    {},
    adminToken
  );
  const finalizedSummaryId = finalize.json?.data?.summary?.id ?? draftSummaryId;
  assert(finalize.ok && finalize.json?.data?.summary?.status === "FINALIZED", "MI summary finalized");

  const applyDelivery = await apiCall(
    "POST",
    `/ai-delivery/projects/${aiDeliveryProjectId}/mi-summary-context/apply`,
    { summaryId: finalizedSummaryId },
    adminToken
  );
  assert(applyDelivery.ok, "finalized MI summary linked to delivery project");

  const workflowRun = await apiCall(
    "POST",
    `/ai-delivery/projects/${aiDeliveryProjectId}/workflow-runs`,
    {
      title: `${SMOKE_MARKER} content plan run`,
      adminNotes: "[generate-content-plan] Revenue engine deterministic plan path"
    },
    adminToken
  );
  const workflowRunId = workflowRun.json?.data?.workflowRun?.id ?? "";
  assert(workflowRun.ok && workflowRunId, "workflow run created");

  const executePlan = await apiCall(
    "POST",
    `/ai-delivery/projects/${aiDeliveryProjectId}/workflow-runs/${workflowRunId}/execute`,
    {},
    adminToken
  );
  assert(executePlan.ok, "workflow content plan execute succeeded");
  const executionLog = executePlan.json?.data?.workflowRun?.executionLog ?? "";
  assert(
    executionLog.includes("MI_SUMMARY_V1") || executionLog.includes("finalized MI"),
    "workflow execution log includes MI summary context"
  );
  assert(!executionLog.toLowerCase().includes("openrouter"), "no provider call in workflow execution log");

  const contentPlan = await apiCall("GET", `/ai-delivery-projects/${aiDeliveryProjectId}/content-plan`, undefined, adminToken);
  const planItems = contentPlan.json?.data?.contentPlan?.items ?? [];
  assert(contentPlan.ok && planItems.length > 0, "content plan items generated");
  assert(
    planItems.some((item) => (item.notes ?? "").includes("[mi-summary-ref:") || (item.notes ?? "").includes("MI strategy")),
    "content plan item notes include MI-derived planning context"
  );

  const readiness = await apiCall(
    "GET",
    `/ai-delivery/projects/${aiDeliveryProjectId}/revenue-chain-readiness`,
    undefined,
    adminToken
  );
  assert(readiness.ok && readiness.json?.data?.checks?.length > 0, "revenue chain readiness returned");
  const readinessChecks = readiness.json?.data?.checks ?? [];
  assert(
    readinessChecks.some((check) => check.key === "mi_context" && check.status === "ready"),
    "readiness shows linked MI context"
  );
  assert(
    readinessChecks.some((check) => check.key === "content_plan"),
    "readiness includes content plan check"
  );

  const draftRun = await apiCall(
    "POST",
    `/ai-delivery/projects/${aiDeliveryProjectId}/workflow-runs`,
    {
      title: `${SMOKE_MARKER} draft run`,
      adminNotes: "Deterministic draft generation smoke"
    },
    adminToken
  );
  const draftRunId = draftRun.json?.data?.workflowRun?.id ?? "";
  const firstPlanItemId = planItems[0]?.id ?? "";
  assert(draftRun.ok && draftRunId && firstPlanItemId, "draft workflow run and plan item available");

  const executeDraft = await apiCall(
    "POST",
    `/ai-delivery/projects/${aiDeliveryProjectId}/workflow-runs/${draftRunId}/execute`,
    { contentPlanItemId: firstPlanItemId },
    adminToken
  );
  assert(executeDraft.ok, "deterministic draft workflow execute succeeded");
  const draftLog = executeDraft.json?.data?.workflowRun?.executionLog ?? "";
  assert(
    draftLog.includes("MI_SUMMARY_V1") || draftLog.includes("finalized MI") || draftLog.includes("Market Intelligence"),
    "draft execution reflects linked MI/context"
  );

  const drafts = await apiCall("GET", `/ai-delivery-projects/${aiDeliveryProjectId}/content-drafts`, undefined, adminToken);
  const draftRows = drafts.json?.data?.contentDrafts ?? [];
  assert(drafts.ok && draftRows.length > 0, "content drafts exist after deterministic generation");

  const report = await apiCall("POST", `/ai-delivery/reports/monthly/${aiDeliveryProjectId}`, {
    title: `${SMOKE_MARKER} monthly report`,
    recommendationsText: "Baseline."
  }, adminToken);
  const reportId = report.json?.data?.report?.id ?? "";
  assert(report.status === 201 && reportId, "monthly report created");

  await apiCall(
    "POST",
    `/ai-delivery/reports/monthly/${reportId}/mi-context/apply`,
    { summaryId: finalizedSummaryId },
    adminToken
  );

  const recommendations = await apiCall(
    "POST",
    `/ai-delivery/reports/monthly/${reportId}/generate-recommendations`,
    {},
    adminToken
  );
  const recommendationsText = recommendations.json?.data?.report?.recommendationsText ?? "";
  assert(recommendations.ok, "monthly report recommendations generated deterministically");
  assert(
    recommendationsText.includes("No live provider calls") || recommendationsText.includes("deterministic"),
    "recommendations labeled deterministic/admin-only"
  );
  assert(
    recommendationsText.includes("MI") || recommendationsText.includes("Market Intelligence") || recommendationsText.includes("Content plan"),
    "recommendations include MI/delivery output path"
  );

  if (CLIENT_EMAIL && CLIENT_PASSWORD) {
    const clientLogin = await apiCall("POST", "/auth/login", { email: CLIENT_EMAIL, password: CLIENT_PASSWORD });
    const clientToken = clientLogin.json?.data?.session?.token ?? "";
    if (clientToken) {
      await expectFailure(
        "GET",
        `/ai-delivery/projects/${aiDeliveryProjectId}/revenue-chain-readiness`,
        undefined,
        clientToken
      );
      pass("client cannot access revenue chain readiness admin endpoint");
      await expectFailure(
        "GET",
        `/ai-delivery/projects/${aiDeliveryProjectId}/mi-summary-context`,
        undefined,
        clientToken
      );
      pass("client cannot list raw MI summary admin context");
    }
  } else {
    pass("client boundary skipped (no client tester credentials)");
  }

  assert(!executePlan.text.toLowerCase().includes("openrouter"), "no provider marker in plan execute response");
  assert(!recommendations.text.toLowerCase().includes("openrouter"), "no provider marker in recommendations response");

  console.log(`\n${SMOKE_MARKER} ${passed} PASS / 0 FAIL`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
