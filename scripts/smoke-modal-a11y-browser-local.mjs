import { chromium } from "@playwright/test";

/**
 * Narrow Modal a11y / behavior smoke against a live local admin CRM modal (Tasks).
 * Does not mutate durable business records beyond opening/canceling the editor.
 */
const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://127.0.0.1:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][MODAL_A11Y_BROWSER]";

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
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { status: response.status, body };
}

async function login() {
  const response = await request("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword },
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

async function openTaskModal(page) {
  await page.goto(`${webBaseUrl}/#/tasks`, { waitUntil: "domcontentloaded" });
  const addButton = page.getByRole("button", { name: /Add Task|New Task|Create Task/i }).first();
  await addButton.click({ timeout: 15000 });
  const dialog = page.getByRole("dialog").last();
  await dialog.waitFor({ state: "visible", timeout: 10000 });
  return dialog;
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
    health.status === 200 && health.body?.ok === true,
    `${health.status}`,
  );
  if (health.status !== 200) {
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("pageerror", (err) => consoleErrors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  try {
    const token = await login();
    record("admin login", true, "200");

    await page.goto(`${webBaseUrl}/#/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/#\/(?!login)/, { timeout: 20000 });
    await page.evaluate((sessionToken) => {
      window.sessionStorage.setItem("dcaosv1.authToken", sessionToken);
    }, token);

    // Mobile-ish viewport first
    await page.setViewportSize({ width: 390, height: 844 });
    let dialog = await openTaskModal(page);
    record("mobile modal opens", await dialog.isVisible());

    const labelled = await dialog.getAttribute("aria-labelledby");
    record("aria-labelledby present", typeof labelled === "string" && labelled.length > 0, labelled ?? "missing");
    record("aria-modal true", (await dialog.getAttribute("aria-modal")) === "true");

    await page.waitForTimeout(50);
    const focusInside = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-modal="true"]');
      return Boolean(d && d.contains(document.activeElement));
    });
    record("initial focus inside dialog", focusInside);

    const overflowLocked = await page.evaluate(() => document.body.style.overflow === "hidden");
    record("body scroll locked", overflowLocked);

    await page.keyboard.press("Tab");
    const tabStaysInside = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"][aria-modal="true"]');
      return Boolean(d && d.contains(document.activeElement));
    });
    record("Tab remains inside dialog", tabStaysInside);

    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
    record("Escape closes dialog", (await page.getByRole("dialog").count()) === 0);

    // Desktop reopen + close button + focus return
    await page.setViewportSize({ width: 1280, height: 800 });
    const trigger = page.getByRole("button", { name: /Add Task|New Task|Create Task/i }).first();
    await trigger.focus();
    dialog = await openTaskModal(page);
    record("desktop modal opens", await dialog.isVisible());

    await dialog.getByRole("button", { name: /Close modal|Close/i }).first().click();
    await page.waitForTimeout(100);
    record("close button closes dialog", (await page.getByRole("dialog").count()) === 0);

    dialog = await openTaskModal(page);
    const backdrop = dialog.locator("xpath=..");
    await backdrop.click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(100);
    record("backdrop click closes dialog", (await page.getByRole("dialog").count()) === 0);

    record("no page console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));
  } catch (err) {
    record("modal browser smoke", false, err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    process.exitCode = 1;
    console.log(`${smokeMarker} FAIL ${failed.length}/${results.length}`);
  } else {
    console.log(`${smokeMarker} PASS ${results.length}/${results.length}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
