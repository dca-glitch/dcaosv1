/**
 * Post-MVP Block 39 — tenant module dry_run local probe.
 * Baseline pass in off mode; strict pass when API runs with TENANT_MODULE_ENFORCEMENT=dry_run.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][TENANT_MODULE_DRY_RUN_PROBE]";
const expectDryRun = (process.env.SMOKE_EXPECT_TENANT_MODULE_DRY_RUN ?? "").trim().toLowerCase() === "true";

const results = [];

function loadRepoEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
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
  const body = text ? JSON.parse(text) : null;
  return { status: response.status, body, text };
}

async function login() {
  const response = await request("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword }
  });
  if (response.status !== 200) {
    throw new Error(`Admin login failed with HTTP ${response.status}.`);
  }
  const token = response.body?.data?.session?.token ?? null;
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Admin login did not return a session token.");
  }
  return token;
}

async function ensureModuleEnabled(token, moduleKey) {
  const current = await request("/modules/current", { token });
  const moduleEntry = (current.body?.data?.modules ?? []).find((entry) => entry.key === moduleKey);
  if (moduleEntry?.enabled === true) {
    return true;
  }

  const enable = await request(`/modules/current/${moduleKey}/enable`, { method: "POST", token });
  return enable.status === 200;
}

async function main() {
  console.log(`${smokeMarker} starting`);

  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
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

    record("ensure ai-delivery enabled", await ensureModuleEnabled(token, "ai-delivery"), "ready");

    const disable = await request("/modules/current/ai-delivery/disable", { method: "POST", token });
    record("disable ai-delivery for probe", disable.status === 200, `${disable.status}`);

    const probe = await request("/ai-delivery-projects", { token });
    const allowed = probe.status === 200;
    const blocked =
      probe.status === 403 && probe.body?.error?.code === "MODULE_NOT_ENABLED";

    if (expectDryRun) {
      record(
        "dry_run probe allows disabled ai-delivery route",
        allowed,
        allowed ? "200" : `expected 200, got HTTP ${probe.status}`
      );
    } else if (blocked) {
      record(
        "probe detected enforce mode",
        false,
        "403 MODULE_NOT_ENABLED — restart API with TENANT_MODULE_ENFORCEMENT=off or dry_run for baseline probe"
      );
    } else if (allowed) {
      record(
        "baseline off/dry_run compatible allow path",
        true,
        "200 while module disabled (off default or dry_run)"
      );
      record(
        "dry_run strict probe deferred",
        true,
        "set TENANT_MODULE_ENFORCEMENT=dry_run + SMOKE_EXPECT_TENANT_MODULE_DRY_RUN=true for strict Gate 2 proof"
      );
    } else {
      record("disable ai-delivery route probe", false, `unexpected HTTP ${probe.status}`);
    }

    const enable = await request("/modules/current/ai-delivery/enable", { method: "POST", token });
    record("restore ai-delivery module", enable.status === 200, `${enable.status}`);

    const restored = await request("/ai-delivery-projects", { token });
    record("ai-delivery-projects after restore", restored.status === 200, `${restored.status}`);
  } catch (error) {
    record("tenant module dry_run probe runtime", false, error instanceof Error ? error.message : String(error));
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

  if (failed.length === 0) {
    console.log("PROVEN: Tenant module dry_run/off probe completed without leaving ai-delivery disabled.");
  } else {
    console.log("NOT PROVEN: one or more tenant module dry_run probe checks failed.");
  }

  process.exitCode = failed.length > 0 ? 1 : 0;
}

main();
