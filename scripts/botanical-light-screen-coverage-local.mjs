/**
 * Botanical Light — local screen coverage crawler (dev-only evidence).
 * Authenticates as admin via API token + sessionStorage init script,
 * visits registered hash routes, asserts shell content (not login),
 * captures screenshots under _botanical_screens/.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://127.0.0.1:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const outDir = resolve(process.cwd(), "_botanical_screens");
const marker = "[BOTANICAL_SCREEN_COVERAGE]";

const ADMIN_ROUTES = [
  { route: "dashboard", expect: /Dashboard|Overview|Command center|Daily/i },
  { route: "tasks", expect: /^Tasks$/i },
  { route: "pending-approvals", expect: /Pending Review/i },
  { route: "admin-daily-cockpit", expect: /Daily Operations|Attention|Cockpit/i },
  { route: "clients", expect: /Clients|Workspaces/i },
  { route: "client-portal", expect: /Portal|Archive|Content/i },
  { route: "briefs-panel", expect: /Brief/i },
  { route: "projects", expect: /Projects/i },
  { route: "workflow-briefs", expect: /Content plan|Workflow|Brief/i },
  { route: "ai-delivery", expect: /AI Delivery|Delivery/i },
  { route: "ai-market-intelligence", expect: /Market Intelligence|Analytics|Research/i },
  { route: "monthly-reports", expect: /Report/i },
  { route: "archive", expect: /Archive|Asset/i },
  { route: "invoice-items", expect: /Service|Invoice item|Library/i },
  { route: "invoices", expect: /Invoice/i },
  { route: "credit-notes", expect: /Credit/i },
  { route: "bills", expect: /Bill/i },
  { route: "ai-operations", expect: /AI operation|Operations|Orchestrator/i },
  { route: "team", expect: /Team|User|Role/i },
  { route: "modules", expect: /Module/i },
  { route: "tenants", expect: /Tenant/i },
  { route: "company-profile", expect: /Company/i },
  { route: "settings", expect: /Setting/i },
  { route: "design-system", expect: /Design system/i }
];

const VIEWPORTS = [
  { id: "desktop", width: 1440, height: 900 },
  { id: "tablet", width: 768, height: 1024 },
  { id: "mobile", width: 390, height: 844 }
];

const LAYOUT_FAMILY = [
  "dashboard",
  "tasks",
  "clients",
  "projects",
  "ai-delivery",
  "monthly-reports",
  "settings",
  "admin-daily-cockpit",
  "client-portal"
];

const results = [];

function record(row) {
  results.push(row);
  console.log(`${row.ok ? "PASS" : "FAIL"} ${row.screenId} — ${row.detail}`);
}

async function api(path, options = {}) {
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
    body = { raw: text.slice(0, 200) };
  }
  return { status: response.status, body };
}

function sanitize(name) {
  return name.replace(/[^a-z0-9_-]+/gi, "_");
}

async function assertAuthenticated(page) {
  const signIn = await page.getByRole("heading", { name: /^Sign in$/i }).count();
  if (signIn > 0) {
    throw new Error("Still on Sign in — session not applied");
  }
}

async function captureAuthenticated(page, route, expect, viewport, role, consoleErrors, networkFails) {
  const screenId = `${role}_${sanitize(route)}_${viewport.id}`;
  consoleErrors.length = 0;
  networkFails.length = 0;

  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(`${webBaseUrl}/#/${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);

  let ok = true;
  let detail = `screenshot ${screenId}.png`;
  try {
    await assertAuthenticated(page);
    if (expect) {
      await page.getByRole("heading", { name: expect }).first().waitFor({ state: "visible", timeout: 12000 });
    }
  } catch (error) {
    ok = false;
    detail = error instanceof Error ? error.message : String(error);
  }

  const shotPath = resolve(outDir, `${screenId}.png`);
  await page.screenshot({ path: shotPath, fullPage: true });

  const unexplainedConsole = consoleErrors.filter(
    (t) =>
      !t.includes("Download the React DevTools") &&
      !t.includes("favicon") &&
      !t.includes("Turnstile") &&
      !t.includes("[vite]")
  );

  if (unexplainedConsole.length > 0) {
    ok = false;
    detail = `${detail} | console: ${unexplainedConsole.slice(0, 3).join(" || ")}`;
  }

  record({
    screenId,
    route: `#/${route}`,
    role,
    viewport: viewport.id,
    ok,
    consoleErrors: unexplainedConsole.slice(0, 8),
    networkFails: networkFails.slice(0, 8),
    screenshot: shotPath,
    detail
  });
}

async function main() {
  console.log(`${marker} starting`);
  mkdirSync(outDir, { recursive: true });

  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    console.error(`${marker} STOP: AUTH_SEED_TEST_PASSWORD missing`);
    process.exitCode = 1;
    return;
  }

  const health = await api("/health");
  if (health.status !== 200 || health.body?.data?.database?.status !== "ready") {
    console.error(`${marker} STOP: API health not ready (${health.status})`);
    process.exitCode = 1;
    return;
  }

  const login = await api("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword }
  });
  const token = login.body?.data?.session?.token ?? null;
  if (!token) {
    console.error(`${marker} STOP: admin login failed (${login.status})`);
    process.exitCode = 1;
    return;
  }

  const me = await api("/auth/me", { token });
  if (me.status !== 200) {
    console.error(`${marker} STOP: /auth/me failed (${me.status})`);
    process.exitCode = 1;
    return;
  }
  console.log(`${marker} auth ok role=${me.body?.data?.user?.role ?? me.body?.data?.role ?? "unknown"}`);

  const browser = await chromium.launch({ headless: true });

  // Visitor login screenshot (no auth)
  {
    const visitor = await browser.newContext();
    const page = await visitor.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${webBaseUrl}/#/login`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: /^Sign in$/i }).waitFor({ state: "visible", timeout: 15000 });
    await page.screenshot({ path: resolve(outDir, "visitor_login_desktop.png"), fullPage: true });
    record({
      screenId: "visitor_login_desktop",
      route: "#/login",
      role: "visitor",
      viewport: "desktop",
      ok: true,
      detail: "login screenshot",
      screenshot: resolve(outDir, "visitor_login_desktop.png")
    });
    await visitor.close();
  }

  // Authenticated admin context — init script BEFORE any navigation
  const context = await browser.newContext();
  await context.addInitScript((authToken) => {
    window.sessionStorage.setItem("dcaosv1.authToken", authToken);
  }, token);

  const page = await context.newPage();
  const consoleErrors = [];
  const networkFails = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400) networkFails.push(`${response.status()} ${response.url()}`);
  });

  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${webBaseUrl}/#/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const onSetup =
      page.url().includes("#/setup") || (await page.locator("#first-run-setup-title").count()) > 0;
    if (onSetup) {
      console.error(`${marker} STOP: landed on first-run setup`);
      process.exitCode = 1;
      return;
    }

    await assertAuthenticated(page);
    console.log(`${marker} dashboard shell authenticated`);

    for (const entry of ADMIN_ROUTES) {
      await captureAuthenticated(page, entry.route, entry.expect, VIEWPORTS[0], "admin", consoleErrors, networkFails);
    }

    for (const viewport of VIEWPORTS.slice(1)) {
      for (const route of LAYOUT_FAMILY) {
        const expect = ADMIN_ROUTES.find((r) => r.route === route)?.expect;
        await captureAuthenticated(page, route, expect, viewport, "admin", consoleErrors, networkFails);
      }
    }

    // Mobile nav
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${webBaseUrl}/#/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    const menuBtn = page.locator("button").filter({ hasText: /menu|nav/i }).first();
    const ariaMenu = page.getByRole("button", { name: /open navigation|menu|sidebar/i }).first();
    const opener = (await ariaMenu.count()) ? ariaMenu : menuBtn;
    if (await opener.count()) {
      await opener.click().catch(() => {});
      await page.waitForTimeout(400);
      await page.screenshot({ path: resolve(outDir, "admin_mobile_nav_open.png"), fullPage: true });
      record({
        screenId: "admin_mobile_nav_open",
        route: "#/dashboard",
        role: "admin",
        viewport: "mobile",
        ok: true,
        detail: "mobile nav open",
        screenshot: resolve(outDir, "admin_mobile_nav_open.png")
      });
      await page.keyboard.press("Escape").catch(() => {});
    }

    // Collapsed sidebar
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${webBaseUrl}/#/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const collapseBtn = page.getByRole("button", { name: /collapse|expand sidebar|toggle sidebar/i }).first();
    if (await collapseBtn.count()) {
      await collapseBtn.click().catch(() => {});
      await page.waitForTimeout(350);
      await page.screenshot({ path: resolve(outDir, "admin_sidebar_collapsed.png"), fullPage: true });
      record({
        screenId: "admin_sidebar_collapsed",
        route: "#/dashboard",
        role: "admin",
        viewport: "desktop",
        ok: true,
        detail: "collapsed sidebar",
        screenshot: resolve(outDir, "admin_sidebar_collapsed.png")
      });
    }
  } catch (error) {
    console.error(`${marker} FATAL`, error instanceof Error ? error.message : error);
    await page.screenshot({ path: resolve(outDir, "admin_auth_failure.png"), fullPage: true }).catch(() => {});
    process.exitCode = 1;
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  const summary = {
    marker,
    generatedAt: new Date().toISOString(),
    webBaseUrl,
    apiHealth: health.status,
    totals: {
      screens: results.length,
      pass: results.filter((r) => r.ok).length,
      fail: results.filter((r) => !r.ok).length
    },
    failures: results.filter((r) => !r.ok),
    results
  };

  writeFileSync(resolve(outDir, "coverage-summary.json"), JSON.stringify(summary, null, 2), "utf8");
  console.log(`${marker} totals pass=${summary.totals.pass} fail=${summary.totals.fail} screens=${summary.totals.screens}`);
  if (summary.totals.fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`${marker} FATAL`, error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
