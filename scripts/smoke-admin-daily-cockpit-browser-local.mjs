import { chromium } from "@playwright/test";

/**
 * Admin Daily Operations Cockpit shell smoke.
 * Proves the cockpit renders ready/review/blocked queues, a discoverable first-client path,
 * complete handoffs into WorkflowBriefs / AI Delivery / Monthly Reports / Client Portal archive /
 * Market Intelligence / Finance Lite, and explicit deferred/gated labeling. Read-only local proof;
 * does not claim staging/production readiness or exercise any live provider/WordPress/GA-GSC/R2 path.
 */

const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][ADMIN_DAILY_COCKPIT]";

const forbiddenTokens = ["storageKey", "OPENROUTER_API_KEY", "sk-or-", "passwordHash", "sessionTokenHash"];

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

async function request(path, options = {}) {
  const headers = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { status: response.status, body };
}

function containsForbiddenToken(text, token) {
  return text.toLowerCase().includes(token.toLowerCase());
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
  record("api health ready", health.status === 200 && health.body?.data?.database?.status === "ready", `${health.status}`);
  if (health.status !== 200) {
    process.exitCode = 1;
    return;
  }

  const loginResponse = await request("/auth/login", { method: "POST", body: { email: adminEmail, password: adminPassword } });
  const adminToken = loginResponse.body?.data?.session?.token ?? null;
  record("admin login", loginResponse.status === 200 && typeof adminToken === "string", `${loginResponse.status}`);
  if (!adminToken) {
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/admin-daily-cockpit`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const landedOnSetup =
      page.url().includes("#/setup") ||
      (await page.locator("#first-run-setup-title").count()) > 0;
    if (landedOnSetup) {
      throw new Error(
        "Authenticated browser landed on first-run setup (#/setup). Complete company profile and first client on the target environment before cockpit browser route proof, or use a workspace that already finished setup."
      );
    }
    await page.getByRole("heading", { name: "Daily Operations Cockpit" }).waitFor({ state: "visible", timeout: 15000 });
    record("cockpit shell loads", true, "heading visible");

    await page.getByRole("heading", { name: "Start here — first client" }).waitFor({ state: "visible", timeout: 15000 });
    record("first-client path discoverable", true, "Start here panel visible");
    await page.getByRole("button", { name: "Start with Workflow Briefs / AI SEO" }).waitFor({ state: "visible", timeout: 15000 });
    record("first-client start action visible", true, "Start with Workflow Briefs / AI SEO");

    await page.getByRole("heading", { name: "Status snapshot" }).waitFor({ state: "visible", timeout: 15000 });
    record("status snapshot visible", true, "ready/review/blocked metrics");

    for (const label of ["Ready now", "Needs review", "Blocked / waiting"]) {
      await page.getByRole("heading", { name: label }).waitFor({ state: "visible", timeout: 15000 });
      record(`queue section visible: ${label}`, true, label);
    }

    await page.getByRole("heading", { name: "Handoffs" }).waitFor({ state: "visible", timeout: 15000 });
    const handoffLabels = [
      "Open Workflow Briefs / AI SEO plan",
      "Open AI Delivery workspace",
      "Preview Monthly Reports (client-safe view)",
      "Preview Client Portal archive (client-safe, read-only)",
      "Open Market Intelligence",
      "Open Finance Lite (Invoices)",
      "Open full AI Operations console"
    ];
    for (const label of handoffLabels) {
      await page.getByRole("button", { name: label }).waitFor({ state: "visible", timeout: 15000 });
      record(`handoff button visible: ${label}`, true, label);
    }

    await page.getByRole("heading", { name: "Deferred / gated (not active locally)" }).waitFor({ state: "visible", timeout: 15000 });
    const deferredLabels = [
      "Staging deploy / environment proof",
      "Production deploy / readiness",
      "Live AI provider execution (OpenRouter)",
      "Live WordPress publish",
      "GA/GSC live sync",
      "R2 live bucket IO"
    ];
    for (const label of deferredLabels) {
      await page.getByRole("heading", { name: label }).waitFor({ state: "visible", timeout: 15000 });
      record(`deferred item labeled: ${label}`, true, label);
    }

    // Prove three representative handoffs actually navigate to the correct surface.
    await page.getByRole("button", { name: "Open Workflow Briefs / AI SEO plan" }).click();
    await page.getByRole("heading", { name: "Workflow Briefs" }).waitFor({ state: "visible", timeout: 15000 });
    record("handoff navigates: Workflow Briefs", true, "heading visible after click");

    await page.goto(`${webBaseUrl}/#/admin-daily-cockpit`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Daily Operations Cockpit" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("button", { name: "Open Market Intelligence" }).click();
    await page.locator("#market-intelligence-title").waitFor({ state: "visible", timeout: 15000 });
    record("handoff navigates: Market Intelligence", true, "heading visible after click");

    await page.goto(`${webBaseUrl}/#/admin-daily-cockpit`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Daily Operations Cockpit" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("button", { name: "Open Finance Lite (Invoices)" }).click();
    await page.getByRole("heading", { name: "Invoices" }).waitFor({ state: "visible", timeout: 15000 });
    record("handoff navigates: Finance Lite (Invoices)", true, "heading visible after click");

    await page.goto(`${webBaseUrl}/#/admin-daily-cockpit`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Daily Operations Cockpit" }).waitFor({ state: "visible", timeout: 15000 });
    const bodyText = await page.locator("body").innerText();
    const bodyHtml = await page.locator("body").innerHTML();
    const leaks = forbiddenTokens.filter(
      (token) => containsForbiddenToken(bodyText, token) || containsForbiddenToken(bodyHtml, token)
    );
    record("no secret-like values in cockpit DOM", leaks.length === 0, leaks.length ? leaks.join(", ") : "none");

    const relevantConsoleErrors = consoleErrors.filter(
      (message) => !/Failed to load resource: the server responded with a status of 404/i.test(message)
    );
    record("browser console/page errors absent", relevantConsoleErrors.length === 0, relevantConsoleErrors.length ? relevantConsoleErrors.join(" | ") : "none");

    const failed = results.filter((entry) => !entry.ok);
    console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);
    process.exitCode = failed.length > 0 ? 1 : 0;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL admin daily cockpit browser smoke runtime - ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
