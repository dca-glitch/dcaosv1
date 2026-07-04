#!/usr/bin/env node

/**
 * Mega Layer 2 — delivery handoff readiness smoke.
 * Proves extended revenue-chain checklist, WordPress draft prep guards, private asset warnings, client-safe finals.
 * No live WordPress publish. No provider calls.
 */

const API_BASE = (process.env.API_BASE ?? process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const CLIENT_EMAIL = process.env.AUTH_SEED_TESTER_EMAIL;
const CLIENT_PASSWORD = process.env.AUTH_SEED_TESTER_PASSWORD ?? process.env.AUTH_SEED_TEST_PASSWORD;
const SMOKE_MARKER = "[SMOKE][DELIVERY_HANDOFF]";
const TARGET_MONTH = "2026-11";

const FORBIDDEN_CLIENT_PATTERNS = [
  /storageKey/i,
  /miContextDraft/i,
  /miHandoffId/i,
  /workflowRunId/i,
  /executionLog/i,
  /adminSummaryNotes/i,
  /openrouter/i
];

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
  return response;
}

async function ensureModuleEnabled(token, moduleKey) {
  const current = await apiCall("GET", "/modules/current", undefined, token);
  const entry = current.json?.data?.modules?.find((module) => module.key === moduleKey);
  if (entry?.enabled === true) return true;
  const enable = await apiCall("POST", `/modules/current/${moduleKey}/enable`, {}, token);
  return enable.status === 200 && enable.json?.ok === true;
}

function responseForbiddenForClient(text) {
  return FORBIDDEN_CLIENT_PATTERNS.some((pattern) => pattern.test(text));
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

  const smokeId = `handoff-${Date.now()}`;
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

  const readinessEmpty = await apiCall(
    "GET",
    `/ai-delivery/projects/${aiDeliveryProjectId}/revenue-chain-readiness`,
    undefined,
    adminToken
  );
  const checks = readinessEmpty.json?.data?.checks ?? [];
  assert(readinessEmpty.ok && checks.length > 0, "revenue-chain readiness returns checklist");
  assert(
    checks.some((check) => check.key === "private_assets"),
    "readiness includes private_assets check"
  );
  assert(
    checks.some((check) => check.key === "wordpress_handoff"),
    "readiness includes wordpress_handoff check"
  );
  assert(
    checks.some((check) => check.key === "client_portal_visibility"),
    "readiness includes client_portal_visibility check"
  );

  const pubTarget = await apiCall("POST", `/clients/${clientId}/publication-targets`, {
    label: `${SMOKE_MARKER} site`,
    siteUrl: "https://example-smoke.invalid",
    isDefault: true
  }, adminToken);
  const publicationTargetId = pubTarget.json?.data?.publicationTarget?.id ?? "";
  assert(pubTarget.ok && publicationTargetId, "publication target created");

  const draft = await apiCall("POST", `/ai-delivery-projects/${aiDeliveryProjectId}/content-drafts`, {
    title: `${SMOKE_MARKER} draft`,
    draftBody: "Smoke draft body for WordPress prep."
  }, adminToken);
  const contentDraftId = draft.json?.data?.contentDraft?.id ?? "";
  assert(draft.ok && contentDraftId, "content draft created", `status=${draft.status} body=${draft.text.slice(0, 200)}`);

  const approvedDraft = await apiCall(
    "POST",
    `/ai-delivery-projects/${aiDeliveryProjectId}/content-drafts/${contentDraftId}/admin-approve`,
    {},
    adminToken
  );
  assert(
    approvedDraft.ok && approvedDraft.json?.data?.contentDraft?.status === "APPROVED",
    "content draft admin-approved",
    `status=${approvedDraft.status}`
  );

  const deliverable = await apiCall("POST", `/ai-delivery-projects/${aiDeliveryProjectId}/deliverables`, {
    title: `${SMOKE_MARKER} package`,
    description: "Smoke deliverable description for WordPress prep.",
    deliveryType: "CONTENT_PACKAGE",
    status: "DRAFT",
    contentDraftId
  }, adminToken);
  const deliverableId = deliverable.json?.data?.deliverable?.id ?? "";
  assert(deliverable.ok && deliverableId, "deliverable created");

  const prepMissingTarget = await expectFailure(
    "POST",
    `/ai-delivery-projects/${aiDeliveryProjectId}/deliverables/${deliverableId}/prepare-wordpress-draft`,
    { publicationTargetId: "00000000-0000-0000-0000-000000000099" },
    adminToken
  );
  assert(prepMissingTarget.status === 409 || prepMissingTarget.status === 404, "invalid publication target blocked for WP prep");

  const prep = await apiCall(
    "POST",
    `/ai-delivery-projects/${aiDeliveryProjectId}/deliverables/${deliverableId}/prepare-wordpress-draft`,
    { publicationTargetId },
    adminToken
  );
  const prepared = prep.json?.data?.wordpressDraft;
  assert(prep.ok && prepared?.status === "PREPARED", "WordPress draft prep succeeds locally");
  assert(prepared?.slug && prepared?.postStatus === "draft", "prepared draft includes slug and draft mode");
  assert(
    prepared?.publishGateStatus === "disabled" || prepared?.publishGateStatus === "credentials_missing",
    "publish gate reports disabled or credentials_missing locally"
  );
  assert(!prep.text.toLowerCase().includes("openrouter"), "no provider marker in WP prep response");

  const publish = await apiCall(
    "POST",
    `/ai-delivery-projects/${aiDeliveryProjectId}/deliverables/${deliverableId}/publish-wordpress`,
    { publicationTargetId },
    adminToken
  );
  const publishStatus = publish.json?.data?.publishResult?.status ?? "";
  assert(
    publish.ok && (publishStatus === "provider_disabled" || publishStatus === "error"),
    "live publish remains disabled-safe"
  );
  assert(!publish.text.toLowerCase().includes("openrouter"), "no provider marker in WP publish response");

  const readinessAfter = await apiCall(
    "GET",
    `/ai-delivery/projects/${aiDeliveryProjectId}/revenue-chain-readiness`,
    undefined,
    adminToken
  );
  const afterChecks = readinessAfter.json?.data?.checks ?? [];
  const wpCheck = afterChecks.find((check) => check.key === "wordpress_handoff");
  assert(wpCheck && wpCheck.detail.includes("Prepared draft log entries: 1"), "readiness reflects WordPress prep log");

  const markDelivered = await apiCall(
    "PUT",
    `/ai-delivery-projects/${aiDeliveryProjectId}/deliverables/${deliverableId}`,
    {
      title: `${SMOKE_MARKER} package`,
      description: "Smoke deliverable description for WordPress prep.",
      deliveryType: "CONTENT_PACKAGE",
      status: "DELIVERED",
      contentDraftId,
      exportUrl: "https://docs.google.com/document/d/smoke-example/edit"
    },
    adminToken
  );
  assert(markDelivered.ok, "deliverable marked DELIVERED with exportUrl");

  if (CLIENT_EMAIL && CLIENT_PASSWORD) {
    const clientLogin = await apiCall("POST", "/auth/login", { email: CLIENT_EMAIL, password: CLIENT_PASSWORD });
    const clientToken = clientLogin.json?.data?.session?.token ?? "";
    if (clientToken) {
      const portalList = await apiCall("GET", "/client-portal/projects", undefined, clientToken);
      assert(!responseForbiddenForClient(portalList.text), "client portal projects omit forbidden internals");

      const pending = await apiCall("GET", "/client-portal/pending-approvals", undefined, clientToken);
      assert(
        pending.ok || pending.status === 404,
        "pending approvals route reachable or explicitly absent for client"
      );
      if (pending.ok) {
        assert(!responseForbiddenForClient(pending.text), "pending approvals response is client-safe");
        pass("approval happy-path list probe (client credentials present)");
      }

      await expectFailure(
        "GET",
        `/ai-delivery/projects/${aiDeliveryProjectId}/revenue-chain-readiness`,
        undefined,
        clientToken
      );
      pass("client cannot access admin handoff readiness");
    }
  } else {
    pass("approval happy-path skipped (no AUTH_SEED_TESTER_EMAIL / client password)");
  }

  console.log(`\n${SMOKE_MARKER} ${passed} PASS / 0 FAIL`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
