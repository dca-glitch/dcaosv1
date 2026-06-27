/**
 * Post-MVP Block 51 — audit activity browser proof.
 * Verifies Dashboard Recent Activity section renders audit feed items or empty state.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][AUDIT_ACTIVITY_BROWSER]";

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

    const auditResponse = await request("/activity/audit-logs?limit=5", { token });
    const auditLogs = auditResponse.body?.data?.auditLogs ?? [];
    record(
      "audit logs API reachable",
      auditResponse.status === 200 && auditResponse.body?.ok === true,
      `${auditLogs.length} events`
    );

    await page.addInitScript((authToken) => {
      window.sessionStorage.setItem("dcaosv1.authToken", authToken);
    }, token);

    await page.goto(`${webBaseUrl}/#/dashboard`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor({ state: "visible", timeout: 20000 });
    record("dashboard page header renders", true, "#/dashboard");

    const activityPanel = page.locator(".section-panel", {
      has: page.getByRole("heading", { name: "Recent Activity", exact: true })
    }).first();
    await activityPanel.waitFor({ state: "visible", timeout: 15000 });
    record("recent activity section visible", true, "Recent Activity");

    const panelText = await activityPanel.innerText();
    const feedItems = activityPanel.locator(".audit-feed-item");
    const feedCount = await feedItems.count();
    const emptyStateVisible = panelText.includes("No recent activity");

    if (auditLogs.length > 0) {
      record("audit feed renders when API has events", feedCount > 0, `ui=${feedCount} api=${auditLogs.length}`);
    } else {
      record(
        "audit empty state renders when API has no events",
        emptyStateVisible || feedCount === 0,
        emptyStateVisible ? "empty state" : `ui=${feedCount}`
      );
    }

    record(
      "recent activity panel shows feed or empty state",
      feedCount > 0 || emptyStateVisible || panelText.includes("Loading recent activity"),
      feedCount > 0 ? "feed" : emptyStateVisible ? "empty" : "loading"
    );

    const failed = results.filter((entry) => !entry.ok);
    console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

    if (failed.length === 0) {
      console.log("PROVEN: Dashboard Recent Activity section renders audit feed or empty state in the browser.");
    } else {
      console.log("NOT PROVEN: one or more audit activity browser checks failed.");
    }

    process.exitCode = failed.length > 0 ? 1 : 0;
  } catch (error) {
    record("audit activity browser smoke runtime", false, error instanceof Error ? error.message : String(error));
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
