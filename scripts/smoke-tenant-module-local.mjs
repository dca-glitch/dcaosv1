/**
 * Architecture Block 6 — tenant module route map + entitlement smoke.
 * Proves route prefix resolution, seeded module enablement, and optional enforce-mode blocking.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const defaultLocalApiBaseUrl = "http://127.0.0.1:4000/api/v1";
const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? defaultLocalApiBaseUrl).replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][TENANT_MODULE]";
const expectEnforce =
  (process.env.SMOKE_EXPECT_TENANT_MODULE_ENFORCE ?? "").trim().toLowerCase() === "true";
const expectDryRun =
  (process.env.SMOKE_EXPECT_TENANT_MODULE_DRY_RUN ?? "").trim().toLowerCase() === "true";

const routeResolutionCases = [
  ["/clients", "core"],
  ["/clients/abc/publication-targets", "core"],
  ["/projects", "core"],
  ["/company-profile", "core"],
  ["/activity/audit-logs", "core"],
  ["/tenant/wordpress-config", "ai-delivery"],
  ["/ai-delivery/projects/demo/workflow-runs", "ai-delivery"],
  ["/ai-delivery-projects", "ai-delivery"],
  ["/market-intelligence/projects", "market-intelligence"],
  ["/market-intelligence-projects", "market-intelligence"],
  ["/invoices", "finance-lite"],
  ["/auth/login", null],
  ["/modules/current", null]
];

const requiredEnabledModules = ["core", "ai-delivery", "market-intelligence", "finance-lite", "user-settings"];

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

function findModule(modules, key) {
  return modules.find((entry) => entry.key === key) ?? null;
}

async function ensureModuleEnabled(token, moduleKey) {
  const currentResponse = await request("/modules/current", { token });
  const moduleEntry = findModule(currentResponse.body?.data?.modules ?? [], moduleKey);
  if (moduleEntry?.enabled === true) {
    return true;
  }

  const enableResponse = await request(`/modules/current/${moduleKey}/enable`, {
    method: "POST",
    token
  });
  return enableResponse.status === 200;
}

async function runRouteMapChecks() {
  const routeMapModule = await import("../apps/api/src/modules/tenant-module-route-map.ts");
  const { resolveModuleKeyForPath, TENANT_MODULE_ROUTE_MAP } = routeMapModule;

  record("route map non-empty", TENANT_MODULE_ROUTE_MAP.length >= 10, `count=${TENANT_MODULE_ROUTE_MAP.length}`);

  for (const [path, expectedModuleKey] of routeResolutionCases) {
    const resolved = resolveModuleKeyForPath(path);
    const ok = resolved === expectedModuleKey;
    record(`resolve ${path}`, ok, `expected=${expectedModuleKey ?? "null"} got=${resolved ?? "null"}`);
  }
}

async function runApiChecks() {
  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    throw new Error("AUTH_SEED_TEST_PASSWORD is required for tenant module smoke.");
  }

  const token = await login();
  record("admin login", true, "200");

  const catalogResponse = await request("/modules", { token });
  record("module catalog", catalogResponse.status === 200, `${catalogResponse.status}`);
  const catalogKeys = (catalogResponse.body?.data?.modules ?? []).map((entry) => entry.key);
  for (const moduleKey of ["ai-delivery", "market-intelligence"]) {
    record(`catalog includes ${moduleKey}`, catalogKeys.includes(moduleKey), catalogKeys.join(", "));
  }

  const currentResponse = await request("/modules/current", { token });
  record("modules/current", currentResponse.status === 200, `${currentResponse.status}`);

  for (const moduleKey of requiredEnabledModules) {
    const ensured = await ensureModuleEnabled(token, moduleKey);
    record(`ensure ${moduleKey} enabled`, ensured, ensured ? "ready" : "enable failed");
  }

  const refreshedResponse = await request("/modules/current", { token });
  const tenantModules = refreshedResponse.body?.data?.modules ?? [];

  for (const moduleKey of requiredEnabledModules) {
    const moduleEntry = findModule(tenantModules, moduleKey);
    record(
      `${moduleKey} enabled for active tenant`,
      moduleEntry?.enabled === true,
      moduleEntry ? `enabled=${moduleEntry.enabled}` : "missing"
    );
  }

  const aiProjectsBefore = await request("/ai-delivery-projects", { token });
  record("ai-delivery-projects baseline", aiProjectsBefore.status === 200, `${aiProjectsBefore.status}`);

  const disableResponse = await request("/modules/current/ai-delivery/disable", {
    method: "POST",
    token
  });
  record("disable ai-delivery module", disableResponse.status === 200, `${disableResponse.status}`);

  const aiProjectsAfterDisable = await request("/ai-delivery-projects", { token });
  const aiDeliveryBlocked =
    aiProjectsAfterDisable.status === 403 &&
    aiProjectsAfterDisable.body?.error?.code === "MODULE_NOT_ENABLED";
  const aiDeliveryAllowed = aiProjectsAfterDisable.status === 200;

  if (expectEnforce) {
    record(
      "enforce mode blocks disabled ai-delivery route",
      aiDeliveryBlocked,
      aiDeliveryBlocked ? "403 MODULE_NOT_ENABLED" : `expected 403, got HTTP ${aiProjectsAfterDisable.status}`
    );
  } else if (expectDryRun) {
    record(
      "dry_run mode allows disabled ai-delivery route",
      aiDeliveryAllowed,
      aiDeliveryAllowed ? "200 while dry_run logs would-block" : `expected 200, got HTTP ${aiProjectsAfterDisable.status}`
    );
  } else if (aiDeliveryBlocked) {
    record("enforce mode blocks disabled ai-delivery route", true, "403 MODULE_NOT_ENABLED");
  } else if (aiDeliveryAllowed) {
    record("off mode allows disabled ai-delivery route", true, "200 while enforcement disabled");
  } else {
    record(
      "disable ai-delivery route behavior",
      false,
      `unexpected HTTP ${aiProjectsAfterDisable.status}`
    );
  }

  if (expectEnforce) {
    const disableMiResponse = await request("/modules/current/market-intelligence/disable", {
      method: "POST",
      token
    });
    record("disable market-intelligence module", disableMiResponse.status === 200, `${disableMiResponse.status}`);

    const miProjectsAfterDisable = await request("/market-intelligence-projects", { token });
    const miBlocked =
      miProjectsAfterDisable.status === 403 &&
      miProjectsAfterDisable.body?.error?.code === "MODULE_NOT_ENABLED";
    record(
      "enforce mode blocks disabled market-intelligence route",
      miBlocked,
      miBlocked ? "403 MODULE_NOT_ENABLED" : `expected 403, got HTTP ${miProjectsAfterDisable.status}`
    );

    const enableMiResponse = await request("/modules/current/market-intelligence/enable", {
      method: "POST",
      token
    });
    record("re-enable market-intelligence module", enableMiResponse.status === 200, `${enableMiResponse.status}`);
  }

  const enableResponse = await request("/modules/current/ai-delivery/enable", {
    method: "POST",
    token
  });
  record("re-enable ai-delivery module", enableResponse.status === 200, `${enableResponse.status}`);

  const aiProjectsRestored = await request("/ai-delivery-projects", { token });
  record("ai-delivery-projects after re-enable", aiProjectsRestored.status === 200, `${aiProjectsRestored.status}`);
}

async function main() {
  console.log(`${smokeMarker} starting`);

  try {
    await runRouteMapChecks();
    await runApiChecks();
  } catch (error) {
    record("tenant module smoke runtime", false, error instanceof Error ? error.message : String(error));
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main();
