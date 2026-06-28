import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][AI_OPERATIONS_BROWSER]";

const results = [];

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

    await page.goto(`${webBaseUrl}/#/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/#\/dashboard/, { timeout: 20000 });
    record("web login", true, "dashboard");

    await page.goto(`${webBaseUrl}/#/ai-operations`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1", { timeout: 15000 });
    await page.waitForSelector(".data-table, .empty-state-panel", { timeout: 15000 });
    const heading = await page.locator("h1").first().textContent();
    record(
      "AI Operations page loads",
      (heading ?? "").includes("AI Operations Console"),
      heading ?? ""
    );

    const emptyOrTableVisible = await page.locator(".data-table, .empty-state-panel").first().isVisible();
    record("list or empty state visible", emptyOrTableVisible, emptyOrTableVisible ? "ok" : "missing");

    await page.fill('input[placeholder*="Run id"]', "zzz-no-match-smoke");
    const noMatchVisible = await page.locator(".empty-state-panel").first().isVisible();
    record("client-side search safe", noMatchVisible, noMatchVisible ? "empty state" : "table");

    await page.fill('input[placeholder*="Run id"]', "");
    const reviewButton = page.locator('button:has-text("Review")').first();
    if (await reviewButton.isVisible()) {
      await reviewButton.click();
      await page.waitForSelector(".modal, [role='dialog']", { timeout: 10000 });
      const modalVisible = await page.locator(".modal, [role='dialog']").first().isVisible();
      record("detail modal opens", modalVisible, modalVisible ? "open" : "missing");
      await page.keyboard.press("Escape");
    } else {
      record("detail modal opens", true, "skipped — no runs to review");
    }

    const clientPortalNav = page.locator('a:has-text("AI Operations")');
    record("AI Operations not client-only nav", await clientPortalNav.count() > 0, "admin nav present");

    const portalOnlyCheck = await request("/ai-operations/runs", { token });
    record(
      "AI operations API admin accessible",
      portalOnlyCheck.status === 200 && portalOnlyCheck.body?.ok === true,
      `${portalOnlyCheck.status}`
    );
  } catch (error) {
    record("browser flow", false, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }

  const failed = results.filter((entry) => !entry.ok).length;
  if (failed > 0) {
    process.exitCode = 1;
  }
  console.log(`\n${smokeMarker} finished with ${failed} failure(s)`);
}

main();
