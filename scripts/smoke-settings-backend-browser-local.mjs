/**
 * Post-MVP Block 50 — settings backend browser proof.
 * Verifies tenant settings API and matching tenant name in the Settings metric card.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][SETTINGS_BACKEND_BROWSER]";

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

    const settingsResponse = await request("/tenants/current/settings", { token });
    const tenantName = settingsResponse.body?.data?.tenant?.name ?? null;
    const tenantSlug = settingsResponse.body?.data?.tenant?.slug ?? null;
    record(
      "tenant settings API reachable",
      settingsResponse.status === 200 && settingsResponse.body?.ok === true,
      `${settingsResponse.status}`
    );
    record(
      "tenant settings API returns tenant name",
      typeof tenantName === "string" && tenantName.length > 0,
      tenantName ?? "missing"
    );

    await page.addInitScript((authToken) => {
      window.sessionStorage.setItem("dcaosv1.authToken", authToken);
    }, token);

    await page.goto(`${webBaseUrl}/#/settings`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Settings", exact: true }).waitFor({ state: "visible", timeout: 20000 });
    record("settings page header renders", true, "#/settings");

    const tenantMetricCard = page.locator('.settings-shell-metrics [data-metric="settings-tenant"]').first();
    await tenantMetricCard.waitFor({ state: "visible", timeout: 15000 });
    const tenantMetricText = await tenantMetricCard.innerText();
    record(
      "settings tenant metric card shows API tenant name",
      tenantName ? tenantMetricText.includes(tenantName) : false,
      tenantName ?? "missing"
    );
    record(
      "settings tenant metric card shows API tenant slug helper",
      tenantSlug ? tenantMetricText.includes(tenantSlug) : tenantMetricText.includes("read-only context"),
      tenantSlug ?? "slug helper"
    );

    const failed = results.filter((entry) => !entry.ok);
    console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

    if (failed.length === 0) {
      console.log("PROVEN: Settings tenant metric card reflects /tenants/current/settings API data.");
    } else {
      console.log("NOT PROVEN: one or more settings backend browser checks failed.");
    }

    process.exitCode = failed.length > 0 ? 1 : 0;
  } catch (error) {
    record("settings backend browser smoke runtime", false, error instanceof Error ? error.message : String(error));
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
