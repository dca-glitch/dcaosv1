/**
 * Post-MVP Block 47 — monthly metrics import browser proof.
 * Seeds report + metrics via API, then verifies snapshot metrics UI in the Monthly Report modal.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][MONTHLY_METRICS_IMPORT_BROWSER]";
const targetMonth = "2027-12";

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

function makeSmokeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

async function ensureMonthlyReportMenuOpen(projectCard) {
  const monthlyReportButton = projectCard.getByRole("button", { name: "Monthly Report" });
  if (!(await monthlyReportButton.isVisible())) {
    await projectCard.locator("summary", { hasText: "More" }).click();
  }
}

async function openMonthlyReportModal(page, projectName, reportId) {
  await page.getByRole("button", { name: "All", exact: true }).click();
  const projectOption = page
    .locator('ul[aria-label="AI delivery projects"] button.brief-select-item', { hasText: projectName })
    .first();
  await projectOption.scrollIntoViewIfNeeded();
  await projectOption.waitFor({ state: "visible", timeout: 30000 });
  await projectOption.click();
  await page.getByRole("heading", { name: projectName }).waitFor({ state: "visible", timeout: 30000 });
  const metricsResponsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(`/ai-delivery/reports/monthly/${reportId}/metrics`) &&
      response.request().method() === "GET" &&
      response.status() === 200,
    { timeout: 30000 }
  );
  await page.getByRole("button", { name: "Monthly report", exact: true }).click();
  await page
    .getByRole("heading", {
      name: new RegExp(`Monthly Report\\s+—\\s+${projectName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
    })
    .waitFor({ state: "visible", timeout: 30000 });
  await metricsResponsePromise;
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

    const projectName = `${smokeMarker} ${makeSmokeId("project")}`;
    const clientResponse = await request("/clients", {
      method: "POST",
      token,
      body: { name: `${smokeMarker} ${makeSmokeId("client")}`, country: "United States" }
    });
    record("create smoke client", clientResponse.status === 201 && clientResponse.body?.ok === true, `${clientResponse.status}`);
    const clientId = clientResponse.body?.data?.client?.id;
    if (!clientId) {
      throw new Error("Client fixture create failed.");
    }

    const projectResponse = await request("/ai-delivery-projects", {
      method: "POST",
      token,
      body: { clientId, name: projectName, targetMonth }
    });
    record("create ai delivery project", projectResponse.status === 201 && projectResponse.body?.ok === true, `${projectResponse.status}`);
    const projectId = projectResponse.body?.data?.aiDeliveryProject?.id;
    if (!projectId) {
      throw new Error("Project fixture create failed.");
    }

    const reportResponse = await request(`/ai-delivery/reports/monthly/${projectId}`, {
      method: "POST",
      token,
      body: {}
    });
    record("create monthly report", reportResponse.status === 201 && reportResponse.body?.ok === true, `${reportResponse.status}`);
    const reportId = reportResponse.body?.data?.report?.id;
    if (!reportId) {
      throw new Error("Monthly report fixture create failed.");
    }

    const importResponse = await request(`/ai-delivery/reports/monthly/${reportId}/metrics/import`, {
      method: "POST",
      token,
      body: {
        targetMonth,
        sourceType: "MANUAL",
        status: "IMPORTED",
        gscClicks: 55,
        gscImpressions: 550,
        gscAverageCtr: 10,
        gscAveragePosition: 6.2,
        ga4Sessions: 21,
        ga4Users: 14,
        ga4PageViews: 48,
        notes: `${smokeMarker} snapshot`
      }
    });
    record(
      "import snapshot metrics via API",
      importResponse.status === 201 && Boolean(importResponse.body?.data?.snapshot?.id),
      `${importResponse.status}`
    );

    await page.addInitScript((authToken) => {
      window.sessionStorage.setItem("dcaosv1.authToken", authToken);
    }, token);

    const projectsResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/ai-delivery-projects") &&
        response.request().method() === "GET" &&
        response.status() === 200,
      { timeout: 45000 }
    );

    await page.goto(`${webBaseUrl}/#/ai-delivery`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "AI Delivery Projects" }).waitFor({ state: "visible", timeout: 20000 });
    await projectsResponsePromise;
    record("ai delivery page loads", true, "#/ai-delivery");

    await openMonthlyReportModal(page, projectName, reportId);
    record("monthly report modal opens", true, projectName);

    const modalPanel = page.locator('[role="dialog"]', { hasText: `Monthly Report — ${projectName}` }).first();
    await modalPanel.getByRole("heading", { name: "GA/GSC Metrics" }).waitFor({ state: "visible", timeout: 15000 });
    record("snapshot metrics section visible", true, "GA/GSC Metrics section");

    const importButton = modalPanel.getByRole("button", { name: "Import snapshot metrics" });
    await importButton.waitFor({ state: "visible", timeout: 15000 });
    record("import snapshot metrics button visible", true, "Import snapshot metrics");

    const modalText = await modalPanel.innerText();
    record(
      "imported snapshot count reflected in modal",
      modalText.includes("1 snapshot") || modalText.includes("Imported snapshots"),
      "metrics loaded"
    );

    const failed = results.filter((entry) => !entry.ok);
    console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

    if (failed.length === 0) {
      console.log("PROVEN: Monthly Report modal renders snapshot metrics import UI with API-seeded report context.");
    } else {
      console.log("NOT PROVEN: one or more monthly metrics import browser checks failed.");
    }

    process.exitCode = failed.length > 0 ? 1 : 0;
  } catch (error) {
    record("monthly metrics import browser smoke runtime", false, error instanceof Error ? error.message : String(error));
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
