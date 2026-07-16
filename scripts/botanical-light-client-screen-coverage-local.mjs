/**
 * Botanical Light — client-shell screen coverage (dev-only evidence).
 * Authenticates as client-only role via existing APIs, visits client hash routes,
 * asserts admin nav is absent, captures desktop screenshots under _botanical_screens/.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
import { ensurePurivaClientPortalAuth } from "./lib/puriva-client-portal-boundary-helpers.mjs";
import {
  isPurivaClient,
  PURIVA_CLIENT_PORTAL_USER_EMAIL,
  ensurePurivaLocalSetup
} from "./lib/puriva-local-setup.mjs";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://127.0.0.1:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const clientEmail = process.env.AUTH_SEED_TESTER_EMAIL ?? PURIVA_CLIENT_PORTAL_USER_EMAIL;
const clientPassword = process.env.AUTH_SEED_TESTER_PASSWORD ?? process.env.AUTH_SEED_TEST_PASSWORD;
const outDir = resolve(process.cwd(), "_botanical_screens");
const marker = "[BOTANICAL_CLIENT_SCREEN_COVERAGE]";

const CLIENT_ROUTES = [
  { route: "dashboard", expect: /^Dashboard$/i },
  { route: "client-portal", expect: /Your archive/i },
  { route: "briefs", expect: /^Briefs$/i },
  { route: "pending-approvals", expect: /Pending Reviews/i },
  { route: "workflow-briefs", expect: /Production Plan Review/i },
  { route: "monthly-reports", expect: /Your archive/i },
  { route: "archive", expect: /^Archive$/i }
];

const CLIENT_NAV_LABELS = ["Overview", "Content", "Tasks", "Approvals", "Content plans", "Reports", "Assets"];

const FORBIDDEN_ADMIN_NAV = [
  { label: "AI operations", view: "ai-operations" },
  { label: "Tenants", view: "tenants" },
  { label: "Modules", view: "modules" },
  { label: "Settings", view: "settings" }
];

const results = [];
let authMethod = "unknown";

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
  return { status: response.status, body, text };
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

async function assertClientNav(page) {
  const nav = page.locator("#shell-primary-nav");
  await nav.waitFor({ state: "visible", timeout: 15000 });

  for (const label of CLIENT_NAV_LABELS) {
    const link = nav.getByRole("link", { name: label, exact: true });
    if ((await link.count()) === 0) {
      throw new Error(`Missing client nav link: ${label}`);
    }
  }

  for (const forbidden of FORBIDDEN_ADMIN_NAV) {
    const link = nav.getByRole("link", { name: forbidden.label, exact: true });
    if ((await link.count()) > 0) {
      throw new Error(`Forbidden admin nav visible: ${forbidden.label}`);
    }
    const hrefLink = nav.locator(`a[href="#/${forbidden.view}"]`);
    if ((await hrefLink.count()) > 0) {
      throw new Error(`Forbidden admin nav href visible: #/${forbidden.view}`);
    }
  }

  const brandSubtitle = page.locator(".shell-brand small");
  const subtitleText = (await brandSubtitle.textContent())?.trim() ?? "";
  if (subtitleText !== "Client workspace") {
    throw new Error(`Expected sidebar subtitle "Client workspace", got "${subtitleText}"`);
  }
}

async function captureClientRoute(page, entry, consoleErrors, networkFails) {
  const screenId = `client_${sanitize(entry.route)}_desktop`;
  consoleErrors.length = 0;
  networkFails.length = 0;

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${webBaseUrl}/#/${entry.route}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Log out/i }).waitFor({ state: "visible", timeout: 20000 });
  await page.waitForTimeout(1800);

  let ok = true;
  let detail = `screenshot ${screenId}.png`;
  try {
    await assertAuthenticated(page);
    await assertClientNav(page);
    await page.getByRole("heading", { name: entry.expect }).first().waitFor({ state: "visible", timeout: 15000 });
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
    route: `#/${entry.route}`,
    role: "client",
    viewport: "desktop",
    ok,
    adminNavHidden: ok,
    consoleErrors: unexplainedConsole.slice(0, 8),
    networkFails: networkFails.slice(0, 8),
    screenshot: shotPath,
    detail
  });
}

async function resolveClientAuth(adminToken) {
  const request = (path, options = {}) =>
    api(path, { method: options.method, body: options.body, token: options.token });

  const directLogin = await request("/auth/login", {
    method: "POST",
    body: { email: clientEmail, password: clientPassword }
  });
  const directToken = directLogin.body?.data?.session?.token ?? null;
  if (directLogin.status === 200 && directToken) {
    authMethod = `direct login (${clientEmail})`;
    return { token: directToken, email: clientEmail };
  }

  const clientsResponse = await request("/clients", { token: adminToken });
  const clients = clientsResponse.body?.data?.clients ?? [];
  const purivaClient = clients.find((client) => isPurivaClient(client)) ?? null;

  if (purivaClient?.id) {
    try {
      await ensurePurivaLocalSetup({
        request,
        token: adminToken,
        log: (line) => console.log(`${marker} setup: ${line}`)
      });
    } catch (error) {
      console.log(`${marker} setup skipped: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const ensured = await ensurePurivaClientPortalAuth({
    request,
    adminToken,
    portalPassword: clientPassword,
    clientId: purivaClient?.id ?? null,
    email: clientEmail,
    log: (line) => console.log(`${marker} ensure: ${line}`)
  });

  if (!ensured?.token) {
    return null;
  }

  authMethod = `ensurePurivaClientPortalAuth (${ensured.email})`;
  return { token: ensured.token, email: ensured.email };
}

async function main() {
  console.log(`${marker} starting`);
  mkdirSync(outDir, { recursive: true });

  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    console.error(`${marker} BLOCKED: AUTH_SEED_TEST_PASSWORD missing`);
    writeFileSync(
      resolve(outDir, "client-coverage.json"),
      JSON.stringify(
        {
          marker,
          blocked: true,
          reason: "AUTH_SEED_TEST_PASSWORD missing",
          generatedAt: new Date().toISOString()
        },
        null,
        2
      ),
      "utf8"
    );
    process.exitCode = 1;
    return;
  }

  if (typeof clientPassword !== "string" || clientPassword.length === 0) {
    console.error(`${marker} BLOCKED: client password env missing`);
    writeFileSync(
      resolve(outDir, "client-coverage.json"),
      JSON.stringify(
        {
          marker,
          blocked: true,
          reason: "AUTH_SEED_TEST_PASSWORD (or AUTH_SEED_TESTER_PASSWORD) missing for client login",
          generatedAt: new Date().toISOString()
        },
        null,
        2
      ),
      "utf8"
    );
    process.exitCode = 1;
    return;
  }

  const health = await api("/health");
  if (health.status !== 200 || health.body?.data?.database?.status !== "ready") {
    console.error(`${marker} BLOCKED: API health not ready (${health.status})`);
    writeFileSync(
      resolve(outDir, "client-coverage.json"),
      JSON.stringify(
        {
          marker,
          blocked: true,
          reason: `API health not ready (HTTP ${health.status})`,
          generatedAt: new Date().toISOString()
        },
        null,
        2
      ),
      "utf8"
    );
    process.exitCode = 1;
    return;
  }

  const adminLogin = await api("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword }
  });
  const adminToken = adminLogin.body?.data?.session?.token ?? null;
  if (!adminToken) {
    console.error(`${marker} BLOCKED: admin login failed (${adminLogin.status})`);
    writeFileSync(
      resolve(outDir, "client-coverage.json"),
      JSON.stringify(
        {
          marker,
          blocked: true,
          reason: `admin login failed (HTTP ${adminLogin.status})`,
          generatedAt: new Date().toISOString()
        },
        null,
        2
      ),
      "utf8"
    );
    process.exitCode = 1;
    return;
  }

  const clientAuth = await resolveClientAuth(adminToken);
  if (!clientAuth?.token) {
    console.error(`${marker} BLOCKED: could not obtain client-only auth for ${clientEmail}`);
    writeFileSync(
      resolve(outDir, "client-coverage.json"),
      JSON.stringify(
        {
          marker,
          blocked: true,
          reason: `client auth unavailable for ${clientEmail} after /auth/login and ensurePurivaClientPortalAuth`,
          clientEmail,
          generatedAt: new Date().toISOString()
        },
        null,
        2
      ),
      "utf8"
    );
    process.exitCode = 1;
    return;
  }

  const me = await api("/auth/me", { token: clientAuth.token });
  const roles = me.body?.data?.tenantContext?.roles ?? [];
  console.log(`${marker} client auth ok method=${authMethod} roles=${JSON.stringify(roles)}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript((authToken) => {
    window.sessionStorage.setItem("dcaosv1.authToken", authToken);
  }, clientAuth.token);

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
    await assertAuthenticated(page);

    const onSetup =
      page.url().includes("#/setup") || (await page.locator("#first-run-setup-title").count()) > 0;
    if (onSetup) {
      throw new Error("Client landed on first-run setup (unexpected for client role)");
    }

    for (const entry of CLIENT_ROUTES) {
      await captureClientRoute(page, entry, consoleErrors, networkFails);
    }
  } catch (error) {
    console.error(`${marker} FATAL`, error instanceof Error ? error.message : error);
    await page.screenshot({ path: resolve(outDir, "client_auth_failure.png"), fullPage: true }).catch(() => {});
    record({
      screenId: "client_auth_failure",
      route: "#/dashboard",
      role: "client",
      viewport: "desktop",
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
      screenshot: resolve(outDir, "client_auth_failure.png")
    });
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
    authMethod,
    clientEmail: clientAuth.email,
    clientRoles: roles,
    adminNavAssertions: FORBIDDEN_ADMIN_NAV.map((item) => item.label),
    clientRoutes: CLIENT_ROUTES.map((item) => item.route),
    totals: {
      screens: results.length,
      pass: results.filter((r) => r.ok).length,
      fail: results.filter((r) => !r.ok).length
    },
    failures: results.filter((r) => !r.ok),
    results
  };

  writeFileSync(resolve(outDir, "client-coverage.json"), JSON.stringify(summary, null, 2), "utf8");
  console.log(
    `${marker} totals pass=${summary.totals.pass} fail=${summary.totals.fail} screens=${summary.totals.screens} auth=${authMethod}`
  );
  if (summary.totals.fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`${marker} FATAL`, error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
