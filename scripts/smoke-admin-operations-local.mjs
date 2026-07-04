#!/usr/bin/env node

/**
 * Block 2 — admin operations summary smoke.
 * Proves admin can read operational summary; client cannot access admin diagnostics.
 * Fail-closed: client boundary proof is required (no SKIP-as-PASS).
 */

import { ensurePurivaClientPortalAuth } from "./lib/puriva-client-portal-boundary-helpers.mjs";
import { PURIVA_CLIENT_PORTAL_USER_EMAIL } from "./lib/puriva-local-setup.mjs";

const API_BASE = (process.env.API_BASE ?? process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const CLIENT_EMAIL = process.env.AUTH_SEED_TESTER_EMAIL ?? process.env.AUTH_SEED_CLIENT_EMAIL ?? PURIVA_CLIENT_PORTAL_USER_EMAIL;
const CLIENT_PASSWORD = process.env.AUTH_SEED_TESTER_PASSWORD ?? process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const SMOKE_MARKER = "[SMOKE][ADMIN_OPERATIONS]";

const FORBIDDEN_PATTERNS = [/sk-or-[a-z0-9]{8,}/i, /passwordHash/i, /sessionTokenHash/i, /-----BEGIN/i];

let passed = 0;

function pass(label, detail = "") {
  passed++;
  console.log(`  PASS: ${label}${detail ? ` — ${detail}` : ""}`);
}

function fail(label, detail = "") {
  throw new Error(`${label}${detail ? ` — ${detail}` : ""}`);
}

function assert(condition, label, detail = "") {
  if (!condition) {
    fail(label, detail);
  }
  pass(label, detail);
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

async function login(email, password) {
  const response = await apiCall("POST", "/auth/login", { email, password });
  const token = response.json?.data?.session?.token ?? "";
  return { response, token };
}

async function main() {
  console.log(`${SMOKE_MARKER} starting\n`);

  if (!ADMIN_PASSWORD) {
    fail("AUTH_SEED_TEST_PASSWORD is required");
  }

  const health = await apiCall("GET", "/health");
  assert(
    health.ok && health.json?.data?.database?.status === "ready",
    "api health ready",
    `status=${health.status}`
  );

  const adminLogin = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  const adminToken = adminLogin.token;
  assert(adminLogin.response.ok && adminToken, "admin login");

  const summary = await apiCall("GET", "/admin/operations/summary", undefined, adminToken);
  const summaryBody = summary.json?.data?.summary;
  assert(summary.ok && summaryBody, "admin operations summary reachable");

  assert(Array.isArray(summaryBody.recoveryHints) && summaryBody.recoveryHints.length >= 5, "recovery hints present");
  assert(summaryBody.closeoutGuidance?.status === "manual_run_required", "closeout is manual-run only");
  assert(summaryBody.readOnly === true, "summary marked read-only");
  assert(Array.isArray(summaryBody.externalIntegrations?.categories) && summaryBody.externalIntegrations.categories.length === 4, "integrations readiness embedded");
  assert(summaryBody.database?.status === "ready", "database readiness included");
  assert(!FORBIDDEN_PATTERNS.some((pattern) => pattern.test(summary.text)), "summary hides secret values");

  const integrations = await apiCall("GET", "/integrations/readiness", undefined, adminToken);
  assert(integrations.ok, "integrations readiness still admin-reachable");

  if (!CLIENT_PASSWORD) {
    fail("AUTH_SEED_TEST_PASSWORD (or AUTH_SEED_TESTER_PASSWORD) is required for client boundary proof");
  }

  let clientToken = null;
  const directClientLogin = await login(CLIENT_EMAIL, CLIENT_PASSWORD);
  if (directClientLogin.token) {
    clientToken = directClientLogin.token;
    pass("client login", CLIENT_EMAIL);
  } else {
    const ensured = await ensurePurivaClientPortalAuth({
      request: (path, options = {}) => apiCall(options.method ?? "GET", path, options.body, options.token),
      adminToken,
      portalPassword: CLIENT_PASSWORD,
      clientId: null,
      log: (line) => console.log(`  INFO: ${line}`)
    });
    if (!ensured?.token) {
      fail("client portal auth unavailable", `could not authenticate ${CLIENT_EMAIL}`);
    }
    clientToken = ensured.token;
    pass("client login via ensurePurivaClientPortalAuth", CLIENT_EMAIL);
  }

  const clientSummary = await apiCall("GET", "/admin/operations/summary", undefined, clientToken);
  assert(
    clientSummary.status === 401 || clientSummary.status === 403,
    "client blocked from admin operations summary",
    `status=${clientSummary.status}`
  );
  assert(
    !clientSummary.ok,
    "client must not receive 2xx on admin operations summary",
    `status=${clientSummary.status}`
  );

  const clientIntegrations = await apiCall("GET", "/integrations/readiness", undefined, clientToken);
  assert(
    clientIntegrations.status === 401 || clientIntegrations.status === 403,
    "client blocked from integrations readiness",
    `status=${clientIntegrations.status}`
  );
  assert(
    !clientIntegrations.ok,
    "client must not receive 2xx on integrations readiness",
    `status=${clientIntegrations.status}`
  );

  pass("client diagnostics boundary");

  console.log(`\n${SMOKE_MARKER} ${passed} PASS / 0 FAIL`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
