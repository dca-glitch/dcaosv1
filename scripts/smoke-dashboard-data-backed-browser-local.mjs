/**
 * Post-MVP Block 52 — dashboard data-backed browser proof.
 * Compares dashboard metric cards with /auth/me and /tenants/current/authorization-summary API data.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][DASHBOARD_DATA_BACKED_BROWSER]";

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

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const token = await login();
    record("admin login", true, "200");

    const meResponse = await request("/auth/me", { token });
    const meUser = meResponse.body?.data?.user ?? null;
    const activeMembership = meResponse.body?.data?.tenantContext?.activeMembership ?? null;
    record(
      "auth me API reachable",
      meResponse.status === 200 && meResponse.body?.ok === true,
      `${meResponse.status}`
    );

    const authSummaryResponse = await request("/tenants/current/authorization-summary", { token });
    const authorization = authSummaryResponse.body?.data?.authorization ?? null;
    record(
      "authorization summary API reachable",
      authSummaryResponse.status === 200 && authSummaryResponse.body?.ok === true,
      `${authSummaryResponse.status}`
    );

    const tenantsResponse = await request("/tenants", { token });
    const activeTenantName = tenantsResponse.body?.data?.currentTenant?.tenant?.name ?? null;
    record(
      "tenants API reachable for active tenant name",
      tenantsResponse.status === 200 && typeof activeTenantName === "string" && activeTenantName.length > 0,
      activeTenantName ?? "missing"
    );

    const expectedSignedIn = meUser?.name || meUser?.email || "";
    const expectedRoles = authorization?.roles ?? [];
    const expectedRoleCoverage = expectedRoles.length ? expectedRoles.join(", ") : "None";

    await page.addInitScript((authToken) => {
      window.sessionStorage.setItem("dcaosv1.authToken", authToken);
    }, token);

    await page.goto(`${webBaseUrl}/#/dashboard`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor({ state: "visible", timeout: 20000 });
    record("dashboard page header renders", true, "#/dashboard");

    const metricGrid = page.locator(".dashboard-command-metrics").first();
    await metricGrid.waitFor({ state: "visible", timeout: 15000 });

    const signedInCard = metricGrid.locator('[data-metric="signed-in"]').first();
    await signedInCard.waitFor({ state: "visible", timeout: 10000 });
    const signedInText = await signedInCard.innerText();
    record(
      "signed-in metric matches auth me user",
      expectedSignedIn ? signedInText.includes(expectedSignedIn) : signedInText.includes(adminEmail),
      expectedSignedIn || adminEmail
    );
    record(
      "signed-in metric helper shows auth me email",
      meUser?.email ? signedInText.includes(meUser.email) : signedInText.includes(adminEmail),
      meUser?.email ?? adminEmail
    );

    const activeTenantCard = metricGrid.locator('[data-metric="active-tenant"]').first();
    await activeTenantCard.waitFor({ state: "visible", timeout: 10000 });
    const activeTenantText = await activeTenantCard.innerText();
    record(
      "active-tenant metric matches tenants API name",
      activeTenantName ? activeTenantText.includes(activeTenantName) : false,
      activeTenantName ?? "missing"
    );
    record(
      "active-tenant metric reflects active membership presence",
      activeMembership ? !activeTenantText.includes("No tenant") : activeTenantText.includes("No tenant"),
      activeMembership ? "membership active" : "no membership"
    );

    const roleCoverageCard = metricGrid.locator('[data-metric="role-coverage"]').first();
    await roleCoverageCard.waitFor({ state: "visible", timeout: 10000 });
    const roleCoverageText = await roleCoverageCard.innerText();
    record(
      "role-coverage metric matches authorization summary roles",
      expectedRoles.length
        ? expectedRoles.every((role) => roleCoverageText.includes(role))
        : roleCoverageText.includes("None"),
      expectedRoleCoverage
    );
    record(
      "role-coverage helper mentions effective permissions count",
      roleCoverageText.includes(`${authorization?.effectivePermissions?.length ?? 0} effective permissions`),
      `${authorization?.effectivePermissions?.length ?? 0} permissions`
    );

    const failed = results.filter((entry) => !entry.ok);
    console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

    if (failed.length === 0) {
      console.log("PROVEN: Dashboard command metrics align with auth/me and authorization-summary API data.");
    } else {
      console.log("NOT PROVEN: one or more dashboard data-backed browser checks failed.");
    }

    process.exitCode = failed.length > 0 ? 1 : 0;
  } catch (error) {
    record("dashboard data-backed browser smoke runtime", false, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`${smokeMarker} fatal - ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
