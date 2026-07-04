#!/usr/bin/env node

/**
 * MI Mega Block 2 browser QA — admin apply flow and linked context visibility.
 */

import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][MI_SUMMARY_BROWSER]";

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
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
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  return { status: response.status, ok: response.ok, body, text };
}

async function main() {
  if (!adminPassword) {
    record("env AUTH_SEED_TEST_PASSWORD", false, "missing");
    process.exit(1);
  }

  const login = await request("/auth/login", { method: "POST", body: { email: adminEmail, password: adminPassword } });
  const token = login.body?.data?.session?.token ?? "";
  record("admin login readable", login.ok && token.length > 0);

  const smokeId = `${Date.now()}`;
  const client = await request("/clients", {
    method: "POST",
    token,
    body: { name: `${smokeMarker} ${smokeId}`, email: `${smokeId}@dca.local` }
  });
  const clientId = client.body?.data?.client?.id ?? "";

  const aiProject = await request("/ai-delivery-projects", {
    method: "POST",
    token,
    body: { clientId, name: `${smokeMarker} delivery`, targetMonth: "2026-10" }
  });
  const aiDeliveryProjectId = aiProject.body?.data?.aiDeliveryProject?.id ?? "";

  const miProject = await request("/market-intelligence-projects", {
    method: "POST",
    token,
    body: {
      title: `${smokeMarker} project ${smokeId}`,
      clientId,
      targetMonth: "2026-10",
      status: "ACTIVE",
      keywords: "browser smoke"
    }
  });
  const miProjectId = miProject.body?.data?.project?.id ?? "";

  await request(`/market-intelligence-projects/${miProjectId}/sources`, {
    method: "POST",
    token,
    body: { title: "Browser smoke source", sourceType: "BLOG" }
  });

  const generated = await request(`/market-intelligence-projects/${miProjectId}/summaries/generate`, {
    method: "POST",
    token,
    body: { persist: true }
  });
  const summaryId = generated.body?.data?.summary?.id ?? "";
  await request(`/market-intelligence-projects/${miProjectId}/summaries/${summaryId}/finalize`, { method: "POST", token }, {});

  const report = await request(`/ai-delivery/reports/monthly/${aiDeliveryProjectId}`, {
    method: "POST",
    token,
    body: { title: "Browser smoke report", recommendationsText: "Baseline." }
  });
  const reportId = report.body?.data?.report?.id ?? "";

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  try {
    await page.addInitScript((authToken) => {
      window.sessionStorage.setItem("dcaosv1.authToken", authToken);
    }, token);

    await page.goto(`${webBaseUrl}/#/ai-market-intelligence`, { waitUntil: "domcontentloaded" });
    await page.locator("#market-intelligence-title").waitFor({ state: "visible", timeout: 20000 });
    record("admin opens Market Intelligence", true);

    const projectCard = page.locator("article.dense-record", { hasText: `${smokeMarker} project` }).first();
    await projectCard.waitFor({ state: "visible", timeout: 15000 });
    await projectCard.click();

    await page.getByRole("button", { name: "Apply to delivery" }).first().waitFor({ state: "visible", timeout: 15000 });
    record("finalized summary visible with apply action", true);

    await page.getByRole("button", { name: "Apply to delivery" }).first().click();
    const targetSelect = page.locator('select').filter({ has: page.locator(`option[value="${aiDeliveryProjectId}"]`) }).first();
    await targetSelect.waitFor({ state: "visible", timeout: 15000 });
    await targetSelect.selectOption(aiDeliveryProjectId);
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await page.getByText("Linked to AI Delivery").first().waitFor({ state: "visible", timeout: 15000 });
    record("apply summary to AI Delivery from MI page", true);

    await page.goto(`${webBaseUrl}/#/ai-delivery`, { waitUntil: "networkidle" });
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("heading", { name: /AI Delivery/i }).first().waitFor({ state: "visible", timeout: 20000 });

    const escapedName = `${smokeMarker} delivery`.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const deliveryButton = page.getByRole("button", { name: new RegExp(escapedName) }).first();
    await deliveryButton.waitFor({ state: "visible", timeout: 20000 });
    await deliveryButton.click();

    await page.getByRole("button", { name: "MI context" }).first().click();
    await page.getByRole("heading", { name: "Applied MI summaries" }).waitFor({ state: "visible", timeout: 15000 });
    record("AI Delivery shows linked MI summary reference", true);
    await page.getByRole("button", { name: "Close" }).first().click();

    await request(`/ai-delivery/reports/monthly/${reportId}/mi-context/apply`, {
      method: "POST",
      token,
      body: { summaryId }
    });

    await page.getByRole("button", { name: "Monthly report" }).first().click();
    await page.getByRole("heading", { name: "Market Intelligence context" }).waitFor({ state: "visible", timeout: 20000 });
    await page.getByText("Linked MI summary").waitFor({ state: "visible", timeout: 15000 });
    record("Monthly Report panel shows applied MI summary source", true);

    const portal = await request(`/client-portal/projects/${aiDeliveryProjectId}/monthly-reports`, { token });
    const portalText = JSON.stringify(portal.body ?? {});
    record(
      "client portal omits raw MI summary internals",
      !portalText.includes("miSummaryId") && !portalText.includes("miContextDraft"),
      "portal guard"
    );

    const criticalErrors = consoleErrors.filter((entry) => !entry.includes("favicon"));
    record("no critical console errors", criticalErrors.length === 0, criticalErrors.slice(0, 2).join(" | ") || "clean");
  } catch (error) {
    record("browser runtime", false, error instanceof Error ? error.message : String(error));
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} ${results.length - failed.length}/${results.length} passed`);
  process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
