#!/usr/bin/env node

/**
 * Block 5A — client-role API boundary smoke.
 * Proves client-role users are denied generic admin/internal tenant GET routes in core.ts.
 * Client-safe namespace remains /client-portal/* only.
 */

import { ensurePurivaClientPortalAuth } from "./lib/puriva-client-portal-boundary-helpers.mjs";
import { PURIVA_CLIENT_PORTAL_USER_EMAIL } from "./lib/puriva-local-setup.mjs";

const API_BASE = (process.env.API_BASE ?? process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const ADMIN_EMAIL = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const CLIENT_EMAIL = process.env.AUTH_SEED_TESTER_EMAIL ?? PURIVA_CLIENT_PORTAL_USER_EMAIL;
const CLIENT_PASSWORD = process.env.AUTH_SEED_TESTER_PASSWORD ?? process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const PLACEHOLDER_ID = "00000000-0000-0000-0000-000000000001";
const SMOKE_MARKER = "[SMOKE][CLIENT_ROLE_API_BOUNDARY]";

const FORBIDDEN_PATTERNS = [/sk-or-[a-z0-9]{8,}/i, /passwordHash/i, /sessionTokenHash/i, /-----BEGIN/i];

/** Generic admin/internal GET routes that must deny client-role callers. */
const PROTECTED_GENERIC_ROUTES = [
  ["GET /company-profile", "/company-profile"],
  ["GET /clients", "/clients"],
  ["GET /clients/:id", `/clients/${PLACEHOLDER_ID}`],
  ["GET /projects", "/projects"],
  ["GET /projects/:id", `/projects/${PLACEHOLDER_ID}`],
  ["GET /tasks", "/tasks"],
  ["GET /tasks/:id", `/tasks/${PLACEHOLDER_ID}`],
  ["GET /invoices", "/invoices"],
  ["GET /invoice-items", "/invoice-items"],
  ["GET /invoices/:id", `/invoices/${PLACEHOLDER_ID}`],
  ["GET /invoices/:id/document/download", `/invoices/${PLACEHOLDER_ID}/document/download`],
  ["GET /credit-notes/:id/document/download", `/credit-notes/${PLACEHOLDER_ID}/document/download`],
  ["GET /recurring-invoices", "/recurring-invoices"],
  ["GET /recurring-invoices/:id", `/recurring-invoices/${PLACEHOLDER_ID}`],
  ["GET /vendors", "/vendors"],
  ["GET /bills", "/bills"],
  ["GET /bills/:id/document/download", `/bills/${PLACEHOLDER_ID}/document/download`]
];

const ADMIN_LIST_ROUTES = [
  ["GET /clients", "/clients"],
  ["GET /projects", "/projects"],
  ["GET /invoices", "/invoices"],
  ["GET /vendors", "/vendors"],
  ["GET /bills", "/bills"]
];

const CLIENT_SAFE_ROUTES = [
  ["GET /client-portal/projects", "/client-portal/projects"]
];

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
  if (!CLIENT_PASSWORD) {
    fail("AUTH_SEED_TEST_PASSWORD (or AUTH_SEED_TESTER_PASSWORD) is required for client login");
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

  for (const [label, path] of PROTECTED_GENERIC_ROUTES) {
    const response = await apiCall("GET", path, undefined, clientToken);
    assert(
      response.status === 401 || response.status === 403,
      `client denied ${label}`,
      `status=${response.status}`
    );
    assert(
      !FORBIDDEN_PATTERNS.some((pattern) => pattern.test(response.text)),
      `client ${label} response hides secrets`,
      `status=${response.status}`
    );
  }

  for (const [label, path] of ADMIN_LIST_ROUTES) {
    const response = await apiCall("GET", path, undefined, adminToken);
    assert(
      response.ok,
      `admin allowed ${label}`,
      `status=${response.status}`
    );
    assert(
      !FORBIDDEN_PATTERNS.some((pattern) => pattern.test(response.text)),
      `admin ${label} response hides secrets`,
      `status=${response.status}`
    );
  }

  for (const [label, path] of CLIENT_SAFE_ROUTES) {
    const response = await apiCall("GET", path, undefined, clientToken);
    assert(
      response.ok,
      `client allowed ${label}`,
      `status=${response.status}`
    );
  }

  console.log(`\n${SMOKE_MARKER} ${passed} PASS / 0 FAIL`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
