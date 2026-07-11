/**
 * Post-MVP Block 48 — roles and permissions browser proof.
 * Verifies authorization summary API and Team shell role coverage + deferred invite boundary copy.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][ROLES_PERMISSIONS_BROWSER]";

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

    const authSummaryResponse = await request("/tenants/current/authorization-summary", { token });
    const authorization = authSummaryResponse.body?.data?.authorization ?? null;
    record(
      "authorization summary API reachable",
      authSummaryResponse.status === 200 && authSummaryResponse.body?.ok === true,
      `${authSummaryResponse.status}`
    );
    record(
      "authorization summary returns roles array",
      Array.isArray(authorization?.roles),
      `${authorization?.roles?.length ?? 0} roles`
    );
    record(
      "authorization summary returns effectivePermissions array",
      Array.isArray(authorization?.effectivePermissions),
      `${authorization?.effectivePermissions?.length ?? 0} permissions`
    );
    record(
      "authorization summary invite flow disabled",
      authorization?.inviteFlowEnabled === false,
      String(authorization?.inviteFlowEnabled)
    );
    record(
      "authorization summary password reset flow disabled",
      authorization?.passwordResetFlowEnabled === false,
      String(authorization?.passwordResetFlowEnabled)
    );

    await page.addInitScript((authToken) => {
      window.sessionStorage.setItem("dcaosv1.authToken", authToken);
    }, token);

    await page.goto(`${webBaseUrl}/#/team`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Members", exact: true }).waitFor({ state: "visible", timeout: 20000 });
    record("team page header renders", true, "#/team");

    const roleCoverageCard = page.locator('.team-shell-metrics [data-metric="team-roles"]').first();
    await roleCoverageCard.waitFor({ state: "visible", timeout: 15000 });
    const roleCoverageText = await roleCoverageCard.innerText();
    const normalizedRoleCoverageText = roleCoverageText.toLowerCase();
    record("team role coverage metric visible", normalizedRoleCoverageText.includes("role coverage"), "team-roles");

    const expectedRoleLabel = authorization?.roles?.length
      ? authorization.roles.join(", ")
      : null;
    if (expectedRoleLabel) {
      const expectedPrimaryRole = expectedRoleLabel.split(", ")[0].toLowerCase();
      record(
        "team role coverage metric reflects API roles",
        normalizedRoleCoverageText.includes(expectedPrimaryRole),
        expectedRoleLabel
      );
    } else {
      record("team role coverage metric shows none state", roleCoverageText.includes("None"), "no roles");
    }

    const directoryPanel = page.locator(".section-panel", {
      has: page.getByRole("heading", { name: "Member directory", exact: true })
    }).first();
    await directoryPanel.waitFor({ state: "visible", timeout: 15000 });
    const directoryText = await directoryPanel.innerText();
    record(
      "member directory shows deferred invite boundary copy",
      !directoryText.toLowerCase().includes("invite") && directoryText.includes("Reset password"),
      "no invite action; password reset action visible"
    );

    const failed = results.filter((entry) => !entry.ok);
    console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

    if (failed.length === 0) {
      console.log("PROVEN: Team shell role coverage and deferred invite boundary align with authorization summary API.");
    } else {
      console.log("NOT PROVEN: one or more roles/permissions browser checks failed.");
    }

    process.exitCode = failed.length > 0 ? 1 : 0;
  } catch (error) {
    record("roles permissions browser smoke runtime", false, error instanceof Error ? error.message : String(error));
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
