#!/usr/bin/env node

/**
 * Monthly Report Market Intelligence context focused smoke test.
 *
 * Proves the admin-only monthly report MI context lifecycle:
 * - Admin login
 * - Create AI Delivery project and deterministic MI handoff fixture
 * - Apply READY handoff to the AI Delivery project
 * - Create/fetch monthly report for the same AI Delivery project
 * - Apply handoff to monthly report MI context
 * - GET context and verify miHandoffId, miContextDraft, and deterministic draft content
 * - Update miContextDraft
 * - Verify Client Portal monthly report response does not expose internal MI context
 * - Remove context and verify internal fields clear
 */

const API_BASE = process.env.API_BASE || process.env.MVP_SMOKE_API_BASE_URL || "http://localhost:4000/api/v1";
const ADMIN_EMAIL = process.env.AUTH_SEED_TEST_EMAIL || "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD || "";

const TARGET_MONTH = "2026-08";

let passed = 0;

function pass(label) {
  passed++;
  console.log(`  ✅ PASS: ${label}`);
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

  const response = await fetch(`${API_BASE.replace(/\/$/, "")}${path}`, {
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

function makeSmokeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildExpectedMiContextDraft(handoff) {
  const lines = [`# Market Intelligence report context: ${handoff.title}`];
  if (handoff.marketSummary) {
    lines.push(`\n## Market Summary\n${handoff.marketSummary}`);
  }
  const fmtList = (label, value) => {
    if (!value) return;
    const items = Array.isArray(value) ? value : (typeof value === "object" ? Object.values(value) : []);
    if (items.length > 0) {
      lines.push(`\n## ${label}\n${items.map((item) => `- ${String(item)}`).join("\n")}`);
    }
  };
  fmtList("Audience Signals", handoff.audienceSignals);
  fmtList("Opportunities", handoff.opportunities);
  fmtList("Risks", handoff.risks);
  fmtList("Recommended Actions", handoff.recommendedActions);
  if (handoff.sourceNote) {
    lines.push(`\n## Source Note\n${handoff.sourceNote}`);
  }
  return lines.join("");
}

function assertClientPortalDoesNotExposeMiContext(portalJson, handoff, updatedDraft) {
  const responseText = JSON.stringify(portalJson);
  const forbiddenTokens = [
    "miHandoffId",
    "miContextDraft",
    "miHandoff",
    "handoff",
    "marketSummary",
    "audienceSignals",
    "opportunities",
    "risks",
    "recommendedActions",
    "sourceNote"
  ];

  for (const token of forbiddenTokens) {
    assert(!responseText.includes(`"${token}"`), `Client Portal monthly report omits internal token ${token}`);
  }

  const rawValues = [
    updatedDraft,
    handoff.marketSummary,
    handoff.sourceNote,
    ...(Array.isArray(handoff.audienceSignals) ? handoff.audienceSignals : []),
    ...(Array.isArray(handoff.opportunities) ? handoff.opportunities : []),
    ...(Array.isArray(handoff.risks) ? handoff.risks : []),
    ...(Array.isArray(handoff.recommendedActions) ? handoff.recommendedActions : [])
  ].filter((value) => typeof value === "string" && value.length > 0);

  for (const value of rawValues) {
    assert(!responseText.includes(value), "Client Portal monthly report omits raw MI handoff/draft content");
  }
}

async function ensureModuleEnabled(token, moduleKey) {
  const current = await apiCall("GET", "/modules/current", undefined, token);
  const entry = current.json?.data?.modules?.find((module) => module.key === moduleKey);
  if (entry?.enabled === true) {
    return true;
  }

  const enable = await apiCall("POST", `/modules/current/${moduleKey}/enable`, {}, token);
  return enable.status === 200 && enable.json?.ok === true;
}

async function main() {
  console.log("🔍 Monthly Report Market Intelligence context smoke test\n");

  if (!ADMIN_PASSWORD) {
    throw new Error("AUTH_SEED_TEST_PASSWORD environment variable is required");
  }

  console.log("Step 1: Admin login");
  const login = await apiCall("POST", "/auth/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  const token = login.json?.data?.session?.token ?? "";
  const adminUserId = login.json?.data?.user?.id ?? "";
  assert(login.ok && token.length > 0, "Admin auth works using existing smoke login pattern", `status=${login.status}`);
  assert(adminUserId.length > 0, "Admin user id available for Client Portal access fixture");
  assert(await ensureModuleEnabled(token, "ai-delivery"), "ai-delivery module enabled for smoke tenant");
  assert(await ensureModuleEnabled(token, "market-intelligence"), "market-intelligence module enabled for smoke tenant");
  console.log();

  console.log("Step 2: Create client and AI Delivery project");
  const smokeId = makeSmokeId("monthly-mi-context");
  const client = await apiCall("POST", "/clients", {
    name: `[SMOKE][MONTHLY_MI_CONTEXT] ${smokeId}`,
    email: `${smokeId}@dca.local`
  }, token);
  const clientId = client.json?.data?.client?.id ?? "";
  assert(client.status === 201 && clientId, "Client created", `status=${client.status}`);

  const aiProject = await apiCall("POST", "/ai-delivery-projects", {
    clientId,
    name: `[SMOKE][MONTHLY_MI_CONTEXT] ${smokeId}`,
    targetMonth: TARGET_MONTH
  }, token);
  const aiDeliveryProjectId = aiProject.json?.data?.aiDeliveryProject?.id ?? "";
  assert(aiProject.status === 201 && aiDeliveryProjectId, "AI Delivery project created", `status=${aiProject.status}`);

  const linkAccess = await apiCall("POST", `/clients/${clientId}/users`, { userId: adminUserId }, token);
  assert(linkAccess.status === 201 || linkAccess.status === 200, "Client Portal access linked for admin smoke user", `status=${linkAccess.status}`);
  console.log();

  console.log("Step 3: Create MI project, approved insight, and READY handoff");
  const miProject = await apiCall("POST", "/market-intelligence-projects", {
    title: `[SMOKE][MONTHLY_MI_CONTEXT] ${smokeId}`,
    description: "Focused monthly report MI context smoke fixture",
    keywords: "AI reporting, client retention, local SEO",
    competitors: "Example Competitor A, Example Competitor B",
    niche: "B2B SaaS client reporting",
    productServiceFocus: "monthly report Market Intelligence context",
    clientId,
    targetMonth: TARGET_MONTH,
    status: "ACTIVE"
  }, token);
  const miProjectId = miProject.json?.data?.project?.id ?? "";
  assert(miProject.status === 201 && miProjectId, "MI project created", `status=${miProject.status}`);

  for (const source of [
    { title: "Smoke Competitor Blog", sourceType: "BLOG", sourceUrl: "https://competitor.example.com/blog", sourceNotes: "Competitive positioning" },
    { title: "Smoke Industry Report", sourceType: "REPORT", sourceUrl: "https://reports.example.com/market", sourceNotes: "Market trend evidence" }
  ]) {
    const createdSource = await apiCall("POST", `/market-intelligence-projects/${miProjectId}/sources`, source, token);
    assert(createdSource.status === 201 && createdSource.json?.data?.source?.id, `MI source created: ${source.title}`, `status=${createdSource.status}`);
  }

  const run = await apiCall("POST", `/market-intelligence-projects/${miProjectId}/research-runs`, { status: "PENDING" }, token);
  const runId = run.json?.data?.researchRun?.id ?? "";
  assert(run.status === 201 && runId, "MI research run created", `status=${run.status}`);

  const executed = await apiCall("POST", `/market-intelligence-projects/${miProjectId}/research-runs/${runId}/execute`, {}, token);
  assert(executed.ok && executed.json?.data?.researchRun?.status === "EXECUTED", "MI research run executed deterministically", `status=${executed.status}`);

  const insights = await apiCall("GET", `/market-intelligence-projects/${miProjectId}/insights`, undefined, token);
  const generatedInsight = insights.json?.data?.insights?.find((insight) => insight.title?.startsWith("Generated Insight"));
  assert(insights.ok && generatedInsight?.id, "Generated MI insight found", `status=${insights.status}`);

  const approved = await apiCall("PUT", `/market-intelligence-projects/${miProjectId}/insights/${generatedInsight.id}`, {
    status: "APPROVED",
    reviewerNotes: "Approved for monthly report MI context smoke."
  }, token);
  assert(approved.ok && approved.json?.data?.insight?.status === "APPROVED", "MI insight approved", `status=${approved.status}`);

  const prepared = await apiCall("POST", `/market-intelligence-projects/${miProjectId}/handoffs/prepare`, {
    insightId: generatedInsight.id
  }, token);
  const draftHandoff = prepared.json?.data?.handoff ?? null;
  assert(prepared.status === 201 || prepared.ok, "MI handoff prepared from approved insight", `status=${prepared.status}`);
  assert(draftHandoff?.id && draftHandoff.handoffStatus === "DRAFT", "Prepared handoff starts as DRAFT");

  const ready = await apiCall("PUT", `/market-intelligence-projects/${miProjectId}/handoffs/${draftHandoff.id}/status`, {
    handoffStatus: "READY"
  }, token);
  const handoff = ready.json?.data?.handoff ?? null;
  assert(ready.ok && handoff?.handoffStatus === "READY", "MI handoff marked READY", `status=${ready.status}`);
  console.log();

  console.log("Step 4: Link/apply handoff to AI Delivery project");
  const applyToProject = await apiCall("POST", `/ai-delivery/projects/${aiDeliveryProjectId}/market-intelligence-context/apply`, {
    handoffId: handoff.id
  }, token);
  const projectHandoffs = applyToProject.json?.data?.handoffs ?? [];
  const linkedHandoff = projectHandoffs.find((item) => item.id === handoff.id);
  assert(applyToProject.ok && linkedHandoff?.aiDeliveryProjectId === aiDeliveryProjectId, "Handoff applied to same AI Delivery project", `status=${applyToProject.status}`);
  console.log();

  console.log("Step 5: Create and fetch monthly report for same AI Delivery project");
  const createdReport = await apiCall("POST", `/ai-delivery/reports/monthly/${aiDeliveryProjectId}`, {
    title: "Smoke Monthly Report MI Context",
    recommendationsText: "Baseline recommendations before MI context."
  }, token);
  const reportId = createdReport.json?.data?.report?.id ?? "";
  assert(createdReport.status === 201 && reportId, "Monthly report created for AI Delivery project", `status=${createdReport.status}`);

  const fetchedReport = await apiCall("GET", `/ai-delivery/reports/monthly/${aiDeliveryProjectId}`, undefined, token);
  assert(fetchedReport.ok && fetchedReport.json?.data?.report?.id === reportId, "Monthly report fetched for same AI Delivery project", `status=${fetchedReport.status}`);
  console.log();

  console.log("Step 6: Apply handoff to monthly report MI context");
  const applyToReport = await apiCall("POST", `/ai-delivery/reports/monthly/${reportId}/mi-context/apply`, {
    handoffId: handoff.id
  }, token);
  const appliedContext = applyToReport.json?.data ?? null;
  const expectedDraft = buildExpectedMiContextDraft(appliedContext?.handoff ?? handoff);
  assert(applyToReport.ok && appliedContext?.miHandoffId === handoff.id, "Monthly report MI context apply stores miHandoffId", `status=${applyToReport.status}`);
  assert(appliedContext?.miContextDraft === expectedDraft, "Monthly report MI context apply stores deterministic draft content");

  const getContext = await apiCall("GET", `/ai-delivery/reports/monthly/${reportId}/mi-context`, undefined, token);
  const context = getContext.json?.data ?? null;
  assert(getContext.ok && context?.miHandoffId === handoff.id, "GET monthly report MI context returns miHandoffId", `status=${getContext.status}`);
  assert(context?.miContextDraft === expectedDraft, "GET monthly report MI context returns deterministic miContextDraft");
  assert(context?.miContextDraft.includes("# Market Intelligence report context:"), "Deterministic draft includes report context heading");
  assert(context?.miContextDraft.includes("## Audience Signals"), "Deterministic draft includes audience signals section");
  assert(context?.miContextDraft.includes("## Recommended Actions"), "Deterministic draft includes recommended actions section");
  console.log();

  console.log("Step 7: Update miContextDraft");
  const updatedDraft = `${expectedDraft}\n\n## Admin Edit\nSmoke edited MI context draft.`;
  const updated = await apiCall("POST", `/ai-delivery/reports/monthly/${reportId}/mi-context/draft`, {
    miContextDraft: updatedDraft
  }, token);
  assert(updated.ok && updated.json?.data?.miHandoffId === handoff.id, "Monthly report MI draft update preserves miHandoffId", `status=${updated.status}`);
  assert(updated.json?.data?.miContextDraft === updatedDraft, "Monthly report MI draft update persists edited draft");
  console.log();

  console.log("Step 8: Client Portal monthly report exposure guard");
  const toReview = await apiCall("POST", `/ai-delivery/reports/monthly/${reportId}/status`, { status: "ADMIN_REVIEW" }, token);
  assert(toReview.ok && toReview.json?.data?.report?.status === "ADMIN_REVIEW", "Monthly report advanced to ADMIN_REVIEW for portal fixture", `status=${toReview.status}`);
  const toFinal = await apiCall("POST", `/ai-delivery/reports/monthly/${reportId}/status`, { status: "FINAL" }, token);
  assert(toFinal.ok && toFinal.json?.data?.report?.status === "FINAL", "Monthly report advanced to FINAL for portal fixture", `status=${toFinal.status}`);

  const portalReports = await apiCall("GET", `/client-portal/projects/${aiDeliveryProjectId}/monthly-reports`, undefined, token);
  const monthlyReports = portalReports.json?.data?.monthlyReports ?? [];
  const portalReport = monthlyReports.find((report) => report.id === reportId);
  assert(portalReports.ok && portalReport, "Client Portal monthly report path returns FINAL report", `status=${portalReports.status}`);
  assertClientPortalDoesNotExposeMiContext(portalReports.json, appliedContext.handoff, updatedDraft);
  console.log();

  console.log("Step 9: Remove monthly report MI context");
  const removed = await apiCall("POST", `/ai-delivery/reports/monthly/${reportId}/mi-context/remove`, {}, token);
  assert(removed.ok && removed.json?.data?.miHandoffId === null, "Monthly report MI context remove clears miHandoffId", `status=${removed.status}`);
  assert(removed.json?.data?.miContextDraft === null, "Monthly report MI context remove clears miContextDraft");
  assert(removed.json?.data?.handoff === null, "Monthly report MI context remove clears handoff response");

  const afterRemove = await apiCall("GET", `/ai-delivery/reports/monthly/${reportId}/mi-context`, undefined, token);
  assert(afterRemove.ok && afterRemove.json?.data?.miHandoffId === null, "GET after remove shows miHandoffId clear", `status=${afterRemove.status}`);
  assert(afterRemove.json?.data?.miContextDraft === null, "GET after remove shows miContextDraft clear");
  console.log();

  console.log("─────────────────────────────────────────────");
  console.log(`Monthly Report MI context smoke: ${passed} PASS / 0 FAIL`);
}

main().catch((error) => {
  console.error(`❌ Smoke test failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});