/**
 * Post-MVP Block 57 — read-only API closeout probe.
 * Verifies tenant-scoped read-only endpoints added in Post-MVP Blocks 38, 40, 43, 48 without secrets.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][POST_MVP_READONLY_APIS]";

const forbiddenPatterns = [/-----BEGIN/i, /passwordHash/i, /sessionTokenHash/i, /sk-or-/i, /re_[A-Za-z0-9]{10,}/];

const results = [];

function loadRepoEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadRepoEnv();

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

function responseLeaksSecrets(text) {
  return forbiddenPatterns.some((pattern) => pattern.test(text));
}

async function request(path, options = {}) {
  const headers = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { status: response.status, body, text };
}

async function login() {
  const response = await request("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword }
  });
  if (response.status !== 200) throw new Error(`Admin login failed with HTTP ${response.status}.`);
  const token = response.body?.data?.session?.token ?? null;
  if (!token) throw new Error("Admin login did not return a session token.");
  return token;
}

async function probeReadOnly(name, path, token, validate) {
  const response = await request(path, { token });
  record(`${name} reachable`, response.status === 200 && response.body?.ok === true, `${response.status}`);
  record(`${name} hides secrets`, !responseLeaksSecrets(response.text), "safe response");
  if (response.status === 200 && response.body?.ok === true) {
    record(`${name} payload shape`, validate(response.body?.data), "valid");
  }
}

async function main() {
  console.log(`${smokeMarker} starting`);

  if (!adminPassword) {
    record("env AUTH_SEED_TEST_PASSWORD", false, "missing");
    process.exitCode = 1;
    return;
  }
  record("env AUTH_SEED_TEST_PASSWORD", true, "present");

  const health = await request("/health");
  record(
    "api health ready",
    health.status === 200 && health.body?.ok === true && health.body?.data?.database?.status === "ready",
    `${health.status}`
  );
  if (health.status !== 200) {
    process.exitCode = 1;
    return;
  }

  try {
    const token = await login();
    record("admin login", true, "200");

    await probeReadOnly("email outbox", "/notifications/email-logs?limit=3", token, (data) =>
      typeof data?.outbox?.sendingEnabled === "boolean" && Array.isArray(data?.emailLogs)
    );

    await probeReadOnly("ai provider planning config", "/ai-provider/planning-config", token, (data) =>
      (data?.planning?.textGateway === "local" || data?.planning?.textGateway === "openrouter") &&
      typeof data?.planning?.hasOpenRouterApiKey === "boolean"
    );

    await probeReadOnly("google drive export config", "/integrations/google-drive/export-config", token, (data) =>
      typeof data?.exportConfig?.liveExportConfigured === "boolean" &&
      typeof data?.exportConfig?.exportEnabledFlag === "boolean"
    );

    await probeReadOnly("tenant authorization summary", "/tenants/current/authorization-summary", token, (data) =>
      Array.isArray(data?.authorization?.roles) &&
      Array.isArray(data?.authorization?.effectivePermissions) &&
      data?.authorization?.inviteFlowEnabled === false &&
      data?.authorization?.passwordResetFlowEnabled === false
    );
  } catch (error) {
    record("post-mvp readonly apis runtime", false, error instanceof Error ? error.message : String(error));
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

  if (failed.length === 0) {
    console.log("PROVEN: Post-MVP read-only API endpoints remain reachable, shaped, and secret-safe.");
  } else {
    console.log("NOT PROVEN: one or more Post-MVP read-only API checks failed.");
  }

  process.exitCode = failed.length > 0 ? 1 : 0;
}

main();
