#!/usr/bin/env node

/**
 * MI Mega Block 2 — summary delivery integration smoke.
 * Proves finalized MI_SUMMARY_V1 apply paths, boundaries, and no provider calls.
 */

const API_BASE = (process.env.API_BASE ?? process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const CLIENT_EMAIL = process.env.AUTH_SEED_TESTER_EMAIL;
const CLIENT_PASSWORD = process.env.AUTH_SEED_TESTER_PASSWORD ?? process.env.AUTH_SEED_TEST_PASSWORD;
const SMOKE_MARKER = "[SMOKE][MI_SUMMARY_DELIVERY]";
const TARGET_MONTH = "2026-09";

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

  const smokeId = `mi-summary-delivery-${Date.now()}`;
  const client = await apiCall("POST", "/clients", {
    name: `${SMOKE_MARKER} ${smokeId}`,
    email: `${smokeId}@dca.local`
  }, adminToken);
  const clientId = client.json?.data?.client?.id ?? "";
  assert(client.status === 201 && clientId, "client created");

  const aiProject = await apiCall("POST", "/ai-delivery-projects", {
    clientId,
    name: `${SMOKE_MARKER} delivery ${smokeId}`,
    targetMonth: TARGET_MONTH
  }, adminToken);
  const aiDeliveryProjectId = aiProject.json?.data?.aiDeliveryProject?.id ?? "";
  assert(aiProject.status === 201 && aiDeliveryProjectId, "AI Delivery project created");

  const miProject = await apiCall("POST", "/market-intelligence-projects", {
    title: `${SMOKE_MARKER} ${smokeId}`,
    clientId,
    targetMonth: TARGET_MONTH,
    status: "ACTIVE",
    keywords: "smoke, integration",
    competitors: "Example Co"
  }, adminToken);
  const miProjectId = miProject.json?.data?.project?.id ?? "";
  assert(miProject.status === 201 && miProjectId, "MI project created");

  await apiCall("POST", `/market-intelligence-projects/${miProjectId}/sources`, {
    title: "Smoke source",
    sourceType: "BLOG",
    sourceNotes: "fixture"
  }, adminToken);

  await apiCall("POST", `/market-intelligence-projects/${miProjectId}/findings`, {
    projectId: miProjectId,
    findingCategory: "COMPETITOR",
    findingText: "Competitor launched new offer",
    priority: "HIGH"
  }, adminToken);

  const generated = await apiCall(
    "POST",
    `/market-intelligence-projects/${miProjectId}/summaries/generate`,
    { persist: true },
    adminToken
  );
  const draftSummaryId = generated.json?.data?.summary?.id ?? "";
  assert(generated.ok && draftSummaryId, "MI summary generated and persisted");
  assert(
    generated.json?.data?.summary?.integrationContext?.version === "MI_SUMMARY_V1",
    "integrationContext version MI_SUMMARY_V1"
  );

  const finalize = await apiCall(
    "POST",
    `/market-intelligence-projects/${miProjectId}/summaries/${draftSummaryId}/finalize`,
    {},
    adminToken
  );
  const finalizedSummaryId = finalize.json?.data?.summary?.id ?? draftSummaryId;
  assert(finalize.ok && finalize.json?.data?.summary?.status === "FINALIZED", "MI summary finalized");

  const draftOnly = await apiCall(
    "POST",
    `/market-intelligence-projects/${miProjectId}/summaries/generate`,
    { persist: true },
    adminToken
  );
  const draftSummaryId2 = draftOnly.json?.data?.summary?.id ?? "";
  assert(draftOnly.ok && draftOnly.json?.data?.summary?.status === "DRAFT", "second MI summary remains draft");
  const draftApplyBlocked = await expectFailure(
    "POST",
    `/ai-delivery/projects/${aiDeliveryProjectId}/mi-summary-context/apply`,
    { summaryId: draftSummaryId2 },
    adminToken
  );
  assert(draftApplyBlocked >= 400, "non-finalized MI summary blocked");

  const applyDelivery = await apiCall(
    "POST",
    `/ai-delivery/projects/${aiDeliveryProjectId}/mi-summary-context/apply`,
    { summaryId: finalizedSummaryId },
    adminToken
  );
  assert(applyDelivery.ok && (applyDelivery.json?.data?.summaries?.length ?? 0) > 0, "summary applied to AI Delivery context");

  const listContext = await apiCall("GET", `/ai-delivery/projects/${aiDeliveryProjectId}/mi-summary-context`, undefined, adminToken);
  assert(
    listContext.ok && listContext.json?.data?.summaries?.some((item) => item.id === finalizedSummaryId),
    "linked summary visible in delivery context list"
  );

  const applyBrief = await apiCall(
    "POST",
    `/ai-delivery/projects/${aiDeliveryProjectId}/mi-summaries/${finalizedSummaryId}/apply-to-brief`,
    {},
    adminToken
  );
  assert(applyBrief.ok && applyBrief.json?.data?.brief?.notes?.includes("Market Intelligence summary applied"), "summary appended to brief notes");

  const applySeo = await apiCall(
    "POST",
    `/ai-delivery/projects/${aiDeliveryProjectId}/mi-summaries/${finalizedSummaryId}/apply-to-seo`,
    {},
    adminToken
  );
  const seoNotes = applySeo.json?.data?.aiDeliveryProject?.plannedContentScopeNotes ?? "";
  assert(applySeo.ok && seoNotes.includes("Market Intelligence input"), "summary appended to SEO planning notes");

  const report = await apiCall("POST", `/ai-delivery/reports/monthly/${aiDeliveryProjectId}`, {
    title: "Smoke MI summary report",
    recommendationsText: "Baseline recommendations."
  }, adminToken);
  const reportId = report.json?.data?.report?.id ?? "";
  assert(report.status === 201 && reportId, "monthly report created");

  const applyReport = await apiCall(
    "POST",
    `/ai-delivery/reports/monthly/${reportId}/mi-context/apply`,
    { summaryId: finalizedSummaryId },
    adminToken
  );
  assert(applyReport.ok && applyReport.json?.data?.miSummaryId === finalizedSummaryId, "summary applied to monthly report");
  assert(
    applyReport.json?.data?.miContextDraft?.includes("Market Intelligence summary context"),
    "monthly report miContextDraft populated deterministically"
  );
  const reportAfter = await apiCall("GET", `/ai-delivery/reports/monthly/${aiDeliveryProjectId}`, undefined, adminToken);
  assert(
    reportAfter.json?.data?.report?.recommendationsText?.includes("Next month recommendations"),
    "monthly report recommendations include MI block"
  );

  if (CLIENT_EMAIL && CLIENT_PASSWORD) {
    const clientLogin = await apiCall("POST", "/auth/login", { email: CLIENT_EMAIL, password: CLIENT_PASSWORD });
    const clientToken = clientLogin.json?.data?.session?.token ?? "";
    if (clientToken) {
      await expectFailure(
        "POST",
        `/ai-delivery/projects/${aiDeliveryProjectId}/mi-summary-context/apply`,
        { summaryId: finalizedSummaryId },
        clientToken
      );
      pass("client cannot apply MI summary to delivery");
      await expectFailure(
        "GET",
        `/ai-delivery/projects/${aiDeliveryProjectId}/mi-summary-context`,
        undefined,
        clientToken
      );
      pass("client cannot list MI summary delivery context");
    }
  } else {
    pass("client boundary skipped (no client tester credentials)");
  }

  const otherClient = await apiCall("POST", "/clients", {
    name: `${SMOKE_MARKER} other ${smokeId}`,
    email: `other-${smokeId}@dca.local`
  }, adminToken);
  const otherClientId = otherClient.json?.data?.client?.id ?? "";
  const otherProject = await apiCall("POST", "/ai-delivery-projects", {
    clientId: otherClientId,
    name: `${SMOKE_MARKER} other delivery`,
    targetMonth: TARGET_MONTH
  }, adminToken);
  const otherDeliveryId = otherProject.json?.data?.aiDeliveryProject?.id ?? "";
  const tenantIsolation = await expectFailure(
    "POST",
    `/ai-delivery/projects/${otherDeliveryId}/mi-summary-context/apply`,
    { summaryId: finalizedSummaryId },
    adminToken
  );
  assert(tenantIsolation >= 400, "client mismatch blocks MI summary apply");

  assert(!applyDelivery.text.includes("openrouter"), "no provider marker in delivery apply response");
  assert(!applySeo.text.includes("openrouter"), "no provider marker in SEO apply response");

  console.log(`\n${SMOKE_MARKER} ${passed} PASS / 0 FAIL`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
