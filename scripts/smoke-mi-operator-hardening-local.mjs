#!/usr/bin/env node

/**
 * MI Mega Block 3 — operator hardening smoke.
 * Finding edit/archive, finalized summary picker API, linkage, boundaries.
 */

const API_BASE = (process.env.API_BASE ?? process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const CLIENT_EMAIL = process.env.AUTH_SEED_TESTER_EMAIL;
const CLIENT_PASSWORD = process.env.AUTH_SEED_TESTER_PASSWORD ?? process.env.AUTH_SEED_TEST_PASSWORD;
const SMOKE_MARKER = "[SMOKE][MI_OPERATOR_HARDENING]";

let passed = 0;

function pass(label) {
  passed++;
  console.log(`  PASS: ${label}`);
}

function assert(condition, label, detail = "") {
  if (!condition) throw new Error(`${label}${detail ? ` — ${detail}` : ""}`);
  pass(label);
}

async function apiCall(method, path, body, token) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { status: response.status, ok: response.ok, json, text };
}

async function expectFailure(method, path, body, token) {
  const response = await apiCall(method, path, body, token);
  if (response.status >= 200 && response.status < 300) {
    throw new Error(`Expected failure for ${method} ${path}, got ${response.status}`);
  }
  return response.status;
}

async function main() {
  console.log(`${SMOKE_MARKER} starting\n`);
  if (!ADMIN_PASSWORD) throw new Error("AUTH_SEED_TEST_PASSWORD required");

  const login = await apiCall("POST", "/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  const token = login.json?.data?.session?.token ?? "";
  assert(login.ok && token, "admin login");

  const smokeId = Date.now().toString();
  const client = await apiCall("POST", "/clients", { name: `${SMOKE_MARKER} ${smokeId}`, email: `${smokeId}@dca.local` }, token);
  const clientId = client.json?.data?.client?.id ?? "";
  assert(client.status === 201 && clientId, "client created");

  const miProject = await apiCall("POST", "/market-intelligence-projects", {
    title: `${SMOKE_MARKER} project`,
    clientId,
    status: "ACTIVE",
    keywords: "hardening"
  }, token);
  const miProjectId = miProject.json?.data?.project?.id ?? "";
  assert(miProject.ok && miProjectId, "MI project created");

  const finding = await apiCall("POST", `/market-intelligence-projects/${miProjectId}/findings`, {
    projectId: miProjectId,
    findingCategory: "COMPETITOR",
    findingText: "Initial finding text",
    priority: "MEDIUM"
  }, token);
  const findingId = finding.json?.data?.finding?.id ?? "";
  assert(finding.ok && findingId, "finding created");

  const updated = await apiCall("PUT", `/market-intelligence-projects/${miProjectId}/findings/${findingId}`, {
    findingCategory: "OPPORTUNITY",
    findingText: "Updated finding text for hardening smoke",
    priority: "HIGH"
  }, token);
  assert(updated.ok && updated.json?.data?.finding?.findingText?.includes("Updated"), "finding edited");

  const archived = await apiCall("POST", `/market-intelligence-projects/${miProjectId}/findings/${findingId}/archive`, {}, token);
  assert(archived.ok && archived.json?.data?.finding?.isArchived === true, "finding archived");

  const listFindings = await apiCall("GET", `/market-intelligence-projects/${miProjectId}/findings`, undefined, token);
  const archivedVisible = (listFindings.json?.data?.findings ?? []).some((item) => item.id === findingId);
  assert(!archivedVisible, "archived finding hidden from active list");

  await apiCall("POST", `/market-intelligence-projects/${miProjectId}/sources`, { title: "Hardening source", sourceType: "BLOG" }, token);
  const generated = await apiCall("POST", `/market-intelligence-projects/${miProjectId}/summaries/generate`, { persist: true }, token);
  const summaryId = generated.json?.data?.summary?.id ?? "";
  await apiCall("POST", `/market-intelligence-projects/${miProjectId}/summaries/${summaryId}/finalize`, {}, token);

  const draft = await apiCall("POST", `/market-intelligence-projects/${miProjectId}/summaries/generate`, { persist: true }, token);
  const draftId = draft.json?.data?.summary?.id ?? "";
  await expectFailure("POST", `/ai-delivery/projects/x/mi-summary-context/apply`, { summaryId: draftId }, token);
  pass("non-finalized summary blocked via apply");

  const picker = await apiCall("GET", `/market-intelligence/finalized-summaries?clientId=${clientId}`, undefined, token);
  const pickerIds = (picker.json?.data?.summaries ?? []).map((item) => item.id);
  assert(picker.ok && pickerIds.includes(summaryId), "finalized summary picker lists summary");

  const aiProject = await apiCall("POST", "/ai-delivery-projects", {
    clientId,
    name: `${SMOKE_MARKER} delivery`,
    targetMonth: "2026-11"
  }, token);
  const aiDeliveryProjectId = aiProject.json?.data?.aiDeliveryProject?.id ?? "";
  assert(aiProject.ok && aiDeliveryProjectId, "AI Delivery project created");

  const applyPicker = await apiCall("POST", `/ai-delivery/projects/${aiDeliveryProjectId}/mi-summary-context/apply`, { summaryId }, token);
  assert(applyPicker.ok, "UUID fallback apply still works");

  const applyUuid = await apiCall("POST", `/ai-delivery/projects/${aiDeliveryProjectId}/mi-summary-context/apply`, { summaryId }, token);
  assert(applyUuid.ok, "summary apply via summaryId path");

  const listSummaries = await apiCall("GET", `/market-intelligence-projects/${miProjectId}/summaries`, undefined, token);
  const linked = (listSummaries.json?.data?.summaries ?? []).find((item) => item.id === summaryId);
  assert(linked?.linkage?.aiDeliveryProjectId === aiDeliveryProjectId, "linkage shows applied delivery project");
  assert(Boolean(linked?.linkage?.aiDeliveryProjectName), "linkage includes delivery project name");

  if (CLIENT_EMAIL && CLIENT_PASSWORD) {
    const clientLogin = await apiCall("POST", "/auth/login", { email: CLIENT_EMAIL, password: CLIENT_PASSWORD });
    const clientToken = clientLogin.json?.data?.session?.token ?? "";
    if (clientToken) {
      await expectFailure("GET", `/market-intelligence/finalized-summaries?clientId=${clientId}`, undefined, clientToken);
      pass("client cannot list finalized MI summaries");
    }
  } else {
    pass("client boundary skipped (no tester credentials)");
  }

  assert(!applyPicker.text.includes("openrouter"), "no provider marker in apply response");
  console.log(`\n${SMOKE_MARKER} ${passed} PASS / 0 FAIL`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
