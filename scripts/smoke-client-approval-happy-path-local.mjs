#!/usr/bin/env node

/**
 * Mega Block 2 — client approval happy-path + boundary smoke.
 * Proves pending approvals, ArticleApprovalEditor session, approve/reject/save, and client-safe responses.
 * Uses AUTH_SEED_TEST_PASSWORD; prefers AUTH_SEED_TESTER_EMAIL, falls back to puriva@puriva.id portal user.
 * Fail-closed by default: missing prerequisites or portal session → exit non-zero.
 * Set SMOKE_ALLOW_SKIP=true for discovery/demo mode only (SKIP exit 0).
 */

import { chromium } from "@playwright/test";
import { seedClientPortalAuth } from "./lib/client-portal-browser-smoke-helpers.mjs";
import {
  assertPurivaClientPortalResponseSafe,
  ensurePurivaClientPortalAuth
} from "./lib/puriva-client-portal-boundary-helpers.mjs";
import { PURIVA_CLIENT_PORTAL_USER_EMAIL } from "./lib/puriva-local-setup.mjs";
import {
  ensureLocalBrowserSmokeServices,
  getApiBaseUrl,
  getWebBaseUrl
} from "./lib/local-browser-smoke-service-helpers.mjs";

const apiBaseUrl = getApiBaseUrl();
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const portalPassword = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const clientEmailPreference = process.env.AUTH_SEED_TESTER_EMAIL ?? PURIVA_CLIENT_PORTAL_USER_EMAIL;
const allowSkip = process.env.SMOKE_ALLOW_SKIP === "true";
const smokeMarker = "[SMOKE][CLIENT_APPROVAL_HAPPY_PATH]";
const targetMonth = "2026-12";

const forbiddenResponsePatterns = [
  /storageKey/i,
  /miContextDraft/i,
  /miHandoffId/i,
  /workflowRunId/i,
  /executionLog/i,
  /adminSummaryNotes/i,
  /structuredInputJson/i,
  /openrouter/i,
  /providerMetadata/i
];

const forbiddenUiPatterns = [
  /storageKey/i,
  /workflowRunId/i,
  /executionLog/i,
  /Publication handoff/i,
  /Prepare WordPress drafts/i,
  /INTERNAL DRAFT SCAFFOLD/i,
  /INTERNAL ADMIN IMAGE PROMPT/i
];

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

async function resolveWebBaseUrl() {
  const candidates = [
    process.env.MVP_SMOKE_WEB_BASE_URL,
    process.env.WEB_BASE,
    "http://127.0.0.1:5173",
    "http://localhost:5173"
  ].filter(Boolean);

  for (let port = 5173; port <= 5195; port++) {
    candidates.push(`http://127.0.0.1:${port}`, `http://localhost:${port}`);
  }

  const seen = new Set();
  for (const candidate of candidates) {
    const normalized = candidate.replace(/\/$/, "");
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    try {
      const response = await fetch(`${normalized}/`, { method: "GET" });
      if (response.status >= 200 && response.status < 500) {
        return normalized;
      }
    } catch {
      // try next
    }
  }

  return getWebBaseUrl();
}

async function ensureClientAccess(adminToken, clientId, userId) {
  const accessList = await request(`/clients/${clientId}/users`, { token: adminToken });
  const hasAccess = (accessList.body?.data?.users ?? []).some((entry) => entry.user?.id === userId);
  if (hasAccess) {
    record("client access for fixture", true, "reused");
    return;
  }

  const grant = await request(`/clients/${clientId}/users`, {
    method: "POST",
    token: adminToken,
    body: { userId }
  });
  record("client access for fixture", grant.status === 201 && grant.body?.ok === true, `${grant.status}`);
  if (grant.status !== 201 || grant.body?.ok !== true) {
    throw new Error("Client access grant failed for approval fixture.");
  }
}

function makeSmokeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function request(path, options = {}) {
  const headers = { Accept: "application/json" };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body, text, ok: response.ok };
}

async function login(email, password) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

function assertResponseSafe(label, response) {
  for (const pattern of forbiddenResponsePatterns) {
    record(`${label} hides ${pattern}`, !pattern.test(response.text ?? ""), pattern.test(response.text ?? "") ? "leaked" : "clean");
  }
}

function assertUiSafe(label, text) {
  for (const pattern of forbiddenUiPatterns) {
    record(`${label} hides ${pattern}`, !pattern.test(text ?? ""), pattern.test(text ?? "") ? "leaked" : "clean");
  }
}

async function ensureModuleEnabled(token, moduleKey) {
  const current = await request("/modules/current", { token });
  const entry = current.body?.data?.modules?.find((module) => module.key === moduleKey);
  if (entry?.enabled === true) return true;
  const enable = await request(`/modules/current/${moduleKey}/enable`, { method: "POST", body: {}, token });
  return enable.status === 200 && enable.body?.ok === true;
}

async function assertClientReviewDeferred(adminToken, projectId) {
  const deferredPlan = await request(`/ai-delivery-projects/${projectId}/content-plan/client-review`, {
    token: adminToken
  });
  const planCode = deferredPlan.body?.error?.code ?? null;
  record(
    "content plan client-review returns CLIENT_REVIEW_DEFERRED",
    deferredPlan.status === 403 && planCode === "CLIENT_REVIEW_DEFERRED",
    `HTTP ${deferredPlan.status}${planCode ? ` ${planCode}` : ""}`
  );

  const deferredDraft = await request(`/ai-delivery-projects/${projectId}/content-drafts/client-review`, {
    token: adminToken
  });
  const draftCode = deferredDraft.body?.error?.code ?? null;
  record(
    "content draft client-review returns CLIENT_REVIEW_DEFERRED",
    deferredDraft.status === 403 && draftCode === "CLIENT_REVIEW_DEFERRED",
    `HTTP ${deferredDraft.status}${draftCode ? ` ${draftCode}` : ""}`
  );
}

async function createApprovalFixture(adminToken, suffix) {
  const smokeId = makeSmokeId(suffix);
  const clientResponse = await request("/clients", {
    method: "POST",
    token: adminToken,
    body: { name: `${smokeMarker} ${smokeId}`, email: `${smokeId}@dca.local` }
  });
  const clientId = clientResponse.body?.data?.client?.id ?? null;
  record(`fixture ${suffix} client create`, clientResponse.status === 201 && Boolean(clientId), `${clientResponse.status}`);
  if (!clientId) {
    throw new Error(`Fixture ${suffix}: client create failed.`);
  }

  const projectResponse = await request("/ai-delivery-projects", {
    method: "POST",
    token: adminToken,
    body: {
      clientId,
      name: `${smokeMarker} ${smokeId}`,
      targetMonth
    }
  });
  const projectId = projectResponse.body?.data?.aiDeliveryProject?.id ?? null;
  record(`fixture ${suffix} project create`, projectResponse.status === 201 && Boolean(projectId), `${projectResponse.status}`);
  if (!projectId) {
    throw new Error(`Fixture ${suffix}: project create failed.`);
  }

  const draftResponse = await request(`/ai-delivery-projects/${projectId}/content-drafts`, {
    method: "POST",
    token: adminToken,
    body: {
      title: `${smokeMarker} draft ${smokeId}`,
      draftBody: `Smoke approval body ${smokeId}.`
    }
  });
  const contentDraftId = draftResponse.body?.data?.contentDraft?.id ?? null;
  record(`fixture ${suffix} content draft create`, draftResponse.ok && Boolean(contentDraftId), `${draftResponse.status}`);
  if (!contentDraftId) {
    throw new Error(`Fixture ${suffix}: content draft create failed.`);
  }

  const deliverableResponse = await request(`/ai-delivery-projects/${projectId}/deliverables`, {
    method: "POST",
    token: adminToken,
    body: {
      title: `${smokeMarker} article ${smokeId}`,
      description: "Client approval happy-path fixture.",
      deliveryType: "CONTENT_PACKAGE",
      status: "DRAFT",
      contentDraftId
    }
  });
  const deliverableId = deliverableResponse.body?.data?.deliverable?.id ?? null;
  record(`fixture ${suffix} deliverable create`, deliverableResponse.ok && Boolean(deliverableId), `${deliverableResponse.status}`);
  if (!deliverableId) {
    throw new Error(`Fixture ${suffix}: deliverable create failed.`);
  }

  return { clientId, projectId, contentDraftId, deliverableId, smokeId };
}

async function sendForClientReview(adminToken, projectId, deliverableId) {
  const response = await request(
    `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/send-for-client-review`,
    { method: "POST", token: adminToken }
  );
  const status = response.body?.data?.deliverable?.status ?? null;
  record(
    "admin send-for-client-review",
    response.status === 200 && response.body?.ok === true && status === "PENDING_CLIENT_REVIEW",
    `${response.status}${status ? ` ${status}` : ""}`
  );
  if (response.status !== 200 || status !== "PENDING_CLIENT_REVIEW") {
    throw new Error("send-for-client-review failed.");
  }
}

async function resolveClientSession(adminToken, clientId) {
  if (typeof portalPassword !== "string" || portalPassword.length < 8) {
    return { skip: true, reason: "AUTH_SEED_TEST_PASSWORD missing or too short" };
  }

  const auth = await ensurePurivaClientPortalAuth({
    request,
    adminToken,
    portalPassword,
    clientId,
    email: clientEmailPreference,
    log: (message) => console.log(`  note: ${message}`)
  });

  if (!auth?.token) {
    const reason =
      process.env.AUTH_SEED_TESTER_EMAIL ?
        "AUTH_SEED_TESTER_EMAIL set but client portal user could not be ensured"
      : "puriva portal user unavailable and AUTH_SEED_TESTER_EMAIL unset";
    return { skip: true, reason };
  }

  const pendingProbe = await request("/client-portal/pending-approvals", { token: auth.token });
  if (pendingProbe.status === 403) {
    return {
      skip: true,
      reason: "resolved login is owner/admin — client approval session required (use client role user)"
    };
  }

  record("client portal session established", pendingProbe.status === 200, `${clientEmailPreference}`);
  return { token: auth.token, email: auth.email, userId: auth.userId };
}

function summarizeAndExit(exitCode = 0) {
  const failed = results.filter((entry) => !entry.ok);
  console.log(`\n${smokeMarker} ${results.length - failed.length} PASS / ${failed.length} FAIL`);
  if (failed.length > 0) {
    for (const entry of failed) {
      console.error(`  FAIL ${entry.name}${entry.detail ? ` - ${entry.detail}` : ""}`);
    }
    process.exitCode = 1;
    return;
  }
  process.exitCode = exitCode;
}

async function main() {
  console.log(`${smokeMarker} starting\n`);

  if (!adminPassword) {
    throw new Error("AUTH_SEED_TEST_PASSWORD required.");
  }

  const adminLogin = await login(adminEmail, adminPassword);
  const adminToken = adminLogin.body?.data?.session?.token ?? null;
  record("admin login", adminLogin.status === 200 && Boolean(adminToken), `${adminLogin.status}`);
  if (!adminToken) {
    process.exitCode = 1;
    return;
  }

  record("client email preference", true, clientEmailPreference);
  if (!process.env.AUTH_SEED_TESTER_EMAIL) {
    record("AUTH_SEED_TESTER_EMAIL", true, "unset — using puriva@puriva.id fallback when available");
  }

  record("ai-delivery module enabled", await ensureModuleEnabled(adminToken, "ai-delivery"), "ai-delivery");

  const approveFixture = await createApprovalFixture(adminToken, "approve");
  const clientSession = await resolveClientSession(adminToken, approveFixture.clientId);
  if (clientSession.skip) {
    if (allowSkip) {
      record("client approval happy path", true, `SKIP — ${clientSession.reason}`);
      console.log(`\n${smokeMarker} SKIP — ${clientSession.reason}`);
      return;
    }
    record("client approval happy path", false, clientSession.reason);
    console.error(`\n${smokeMarker} FAIL — ${clientSession.reason}`);
    process.exitCode = 1;
    return;
  }

  const { token: clientToken, userId: clientUserId } = clientSession;
  await ensureClientAccess(adminToken, approveFixture.clientId, clientUserId);

  await sendForClientReview(adminToken, approveFixture.projectId, approveFixture.deliverableId);
  await assertClientReviewDeferred(adminToken, approveFixture.projectId);

  const adminForApproval = await request(
    `/client-portal/deliverables/${approveFixture.deliverableId}/for-approval`,
    { token: adminToken }
  );
  record("admin blocked from for-approval", adminForApproval.status === 403, `${adminForApproval.status}`);

  const pendingBefore = await request("/client-portal/pending-approvals", { token: clientToken });
  const pendingIds = (pendingBefore.body?.data?.pendingApprovals ?? []).map((item) => item.id);
  record(
    "client pending approvals lists fixture",
    pendingBefore.status === 200 && pendingIds.includes(approveFixture.deliverableId),
    `count=${pendingIds.length}`
  );
  assertResponseSafe("pending-approvals", pendingBefore);
  assertPurivaClientPortalResponseSafe(record, "pending-approvals", pendingBefore);

  const forApproval = await request(
    `/client-portal/deliverables/${approveFixture.deliverableId}/for-approval`,
    { token: clientToken }
  );
  record("client for-approval loads", forApproval.status === 200 && forApproval.body?.ok === true, `${forApproval.status}`);
  assertResponseSafe("for-approval", forApproval);
  assertPurivaClientPortalResponseSafe(record, "for-approval", forApproval);

  const patchedBody = `${smokeMarker} edited body ${approveFixture.smokeId}`;
  const bodyPatch = await request(`/client-portal/deliverables/${approveFixture.deliverableId}/body`, {
    method: "PATCH",
    token: clientToken,
    body: { bodyContent: patchedBody }
  });
  record(
    "client patch article body",
    bodyPatch.status === 200 && bodyPatch.body?.data?.deliverable?.bodyContent === patchedBody,
    `${bodyPatch.status}`
  );

  const rejectDraftResponse = await request(`/ai-delivery-projects/${approveFixture.projectId}/content-drafts`, {
    method: "POST",
    token: adminToken,
    body: {
      title: `${smokeMarker} reject draft`,
      draftBody: "Reject path smoke body."
    }
  });
  const rejectContentDraftId = rejectDraftResponse.body?.data?.contentDraft?.id ?? null;
  if (!rejectContentDraftId) {
    throw new Error("Reject-path content draft create failed.");
  }

  const rejectDeliverableResponse = await request(`/ai-delivery-projects/${approveFixture.projectId}/deliverables`, {
    method: "POST",
    token: adminToken,
    body: {
      title: `${smokeMarker} reject ${makeSmokeId("reject")}`,
      description: "Client reject path fixture.",
      deliveryType: "CONTENT_PACKAGE",
      status: "DRAFT",
      contentDraftId: rejectContentDraftId
    }
  });
  const rejectDeliverableId = rejectDeliverableResponse.body?.data?.deliverable?.id ?? null;
  record(
    "reject-path deliverable create",
    rejectDeliverableResponse.ok && Boolean(rejectDeliverableId),
    `${rejectDeliverableResponse.status}`
  );
  if (!rejectDeliverableId) {
    throw new Error("Reject-path deliverable create failed.");
  }

  await sendForClientReview(adminToken, approveFixture.projectId, rejectDeliverableId);
  const rejectReason = `${smokeMarker} needs revision`;
  const rejectResponse = await request(`/client-portal/deliverables/${rejectDeliverableId}/reject`, {
    method: "PATCH",
    token: clientToken,
    body: { rejectionReason: rejectReason }
  });
  const rejectStatus = rejectResponse.body?.data?.deliverable?.status ?? null;
  record(
    "client reject article",
    rejectResponse.status === 200 && rejectStatus === "DRAFT",
    `${rejectResponse.status}${rejectStatus ? ` ${rejectStatus}` : ""}`
  );

  try {
    await ensureLocalBrowserSmokeServices((line) => console.log(line));
    record("local api/web readiness", true, "ready");
  } catch (error) {
    record("local api/web readiness", false, error instanceof Error ? error.message : String(error));
    summarizeAndExit(1);
    return;
  }

  const webBaseUrl = await resolveWebBaseUrl();
  record("resolved web base url", true, webBaseUrl);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  try {
    await seedClientPortalAuth(page, clientToken);
    await page.goto(`${webBaseUrl}/#/client-portal/pending-approvals`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Pending Approvals", exact: true }).waitFor({ state: "visible", timeout: 30000 });
    record("browser pending approvals page", true, "#/client-portal/pending-approvals");

    const fixtureRecord = page.locator(".cf-record", { hasText: approveFixture.smokeId }).first();
    await fixtureRecord.waitFor({ state: "visible", timeout: 20000 });
    await fixtureRecord.getByRole("button", { name: "Review" }).click();

    await page.getByRole("heading", { name: "Article Body", exact: true }).waitFor({ state: "visible", timeout: 30000 });
    record("browser article body editor visible", true, "Article Body");

    await page.getByRole("button", { name: "Save & Continue" }).waitFor({ state: "visible", timeout: 10000 });
    await page.getByRole("button", { name: "Approve Article" }).waitFor({ state: "visible", timeout: 10000 });
    await page.getByRole("button", { name: "Reject Article" }).waitFor({ state: "visible", timeout: 10000 });
    record("browser approval footer actions visible", true, "Save & Continue / Approve / Reject");

    const bodyField = page.locator("#article-body-content");
    await bodyField.waitFor({ state: "visible", timeout: 10000 });
    const browserBody = `${smokeMarker} browser save ${approveFixture.smokeId}`;
    await bodyField.fill(browserBody);
    await page.waitForTimeout(1200);
    let savedBody = (
      await request(`/client-portal/deliverables/${approveFixture.deliverableId}/for-approval`, {
        token: clientToken
      })
    ).body?.data?.deliverable?.bodyContent;
    if (savedBody !== browserBody) {
      await page.getByRole("button", { name: "Save & Continue" }).click();
      await page.waitForTimeout(1500);
      savedBody = (
        await request(`/client-portal/deliverables/${approveFixture.deliverableId}/for-approval`, {
          token: clientToken
        })
      ).body?.data?.deliverable?.bodyContent;
    }
    record(
      "browser save & continue",
      savedBody === browserBody,
      savedBody === browserBody ? "body persisted" : "body mismatch"
    );

    const pageText = await page.locator("body").innerText();
    assertUiSafe("browser article approval editor", pageText);

    await page.getByRole("button", { name: "Approve Article" }).click();
    await page.getByRole("heading", { name: "Approve this article?", exact: true }).waitFor({ state: "visible", timeout: 10000 });
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    await page.getByRole("heading", { name: "Pending Approvals", exact: true }).waitFor({ state: "visible", timeout: 30000 });
    record("browser approve redirects to pending approvals", true, "redirect");

    const afterApproveText = await page.locator("body").innerText();
    record(
      "browser post-approve hides fixture title",
      !afterApproveText.includes(approveFixture.smokeId) || afterApproveText.includes("All caught up"),
      "pending list updated"
    );
  } finally {
    await browser.close().catch(() => {});
  }

  const criticalConsoleErrors = consoleErrors.filter(
    (line) => !/favicon|Failed to load resource.*404|Failed to load resource.*403/i.test(line)
  );
  record("browser no critical console errors", criticalConsoleErrors.length === 0, criticalConsoleErrors[0] ?? "clean");

  const approvedCheck = await request(
    `/client-portal/deliverables/${approveFixture.deliverableId}/for-approval`,
    { token: clientToken }
  );
  record(
    "approved deliverable no longer in client for-approval",
    approvedCheck.status === 404 || approvedCheck.status === 403 || approvedCheck.status === 409,
    `${approvedCheck.status}`
  );

  summarizeAndExit(0);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
