/**
 * Botanical Light — client-only screen coverage (local evidence).
 * Uses puriva@puriva.id with AUTH_SEED_TEST_PASSWORD (client role).
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://127.0.0.1:5173").replace(/\/$/, "");
const clientEmail = process.env.AUTH_SEED_TESTER_EMAIL ?? "puriva@puriva.id";
const clientPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const outDir = resolve(process.cwd(), "_botanical_screens");
const marker = "[BOTANICAL_CLIENT_SCREEN_COVERAGE]";

const FORBIDDEN_ADMIN_NAV = ["AI operations", "Tenants", "Modules", "Workspaces", "Attention required", "Users and roles"];

const CLIENT_ROUTES = [
  { route: "dashboard", expect: /Dashboard|Overview|CLIENT WORKSPACE/i },
  { route: "client-portal", expect: /Content|Portal|Archive|Delivery/i },
  { route: "briefs", expect: /Brief|Task/i },
  { route: "pending-approvals", expect: /Pending Review|Approval/i },
  { route: "workflow-briefs", expect: /Content plan|Workflow|Brief/i },
  { route: "monthly-reports", expect: /Report/i },
  { route: "archive", expect: /Archive|Asset/i }
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
    body = null;
  }
  return { status: response.status, body };
}

async function main() {
  console.log(`${marker} starting`);
  mkdirSync(outDir, { recursive: true });

  if (!clientPassword) {
    console.error(`${marker} STOP: AUTH_SEED_TEST_PASSWORD missing`);
    process.exitCode = 1;
    return;
  }

  const health = await api("/health");
  if (health.status !== 200) {
    console.error(`${marker} STOP: health ${health.status}`);
    process.exitCode = 1;
    return;
  }

  const login = await api("/auth/login", {
    method: "POST",
    body: { email: clientEmail, password: clientPassword }
  });
  const token = login.body?.data?.session?.token ?? null;
  const roles = login.body?.data?.tenantContext?.activeMembership?.roles ?? [];
  if (!token) {
    console.error(`${marker} STOP: client login failed (${login.status})`);
    process.exitCode = 1;
    return;
  }
  console.log(`${marker} auth ok email=${clientEmail} roles=${roles.join(",")}`);

  const isClientOnly = roles.includes("client") && !roles.includes("owner") && !roles.includes("admin");
  if (!isClientOnly) {
    console.error(`${marker} STOP: not client-only roles=${roles.join(",")}`);
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  await context.addInitScript((authToken) => {
    window.sessionStorage.setItem("dcaosv1.authToken", authToken);
  }, token);
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });
  page.on("pageerror", (e) => consoleErrors.push(e.message));

  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${webBaseUrl}/#/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    // Prove client shell labels present and admin labels absent
    const bodyText = await page.locator("body").innerText();
    const hasOverview = /Overview/i.test(bodyText);
    const leakedAdmin = FORBIDDEN_ADMIN_NAV.filter((label) => bodyText.includes(label));
    record({
      screenId: "client_shell_nav_guard",
      route: "#/dashboard",
      role: "client",
      ok: hasOverview && leakedAdmin.length === 0,
      detail:
        hasOverview && leakedAdmin.length === 0
          ? "client nav present; admin items hidden"
          : `overview=${hasOverview} leaked=${leakedAdmin.join("|") || "none"}`,
      adminNavHidden: leakedAdmin.length === 0
    });
    await page.screenshot({ path: resolve(outDir, "client_shell_nav_guard.png"), fullPage: true });

    for (const entry of CLIENT_ROUTES) {
      const screenId = `client_${entry.route}_desktop`;
      consoleErrors.length = 0;
      await page.goto(`${webBaseUrl}/#/${entry.route}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);

      let ok = true;
      let detail = `screenshot ${screenId}.png`;
      try {
        const signIn = await page.getByRole("heading", { name: /^Sign in$/i }).count();
        if (signIn > 0) throw new Error("redirected to Sign in");
        await page.locator("h1").first().waitFor({ state: "visible", timeout: 12000 });
        const h1 = (await page.locator("h1").first().innerText()).trim();
        if (entry.expect && !entry.expect.test(h1) && !entry.expect.test(await page.locator("body").innerText())) {
          detail = `h1="${h1}" (soft match)`;
        }
        const navText = await page.locator("nav, aside, [class*='sidebar']").first().innerText().catch(() => "");
        const sidebarLeak = FORBIDDEN_ADMIN_NAV.filter((label) => navText.includes(label));
        if (sidebarLeak.length) {
          ok = false;
          detail = `admin nav leaked: ${sidebarLeak.join(", ")}`;
        }
      } catch (error) {
        ok = false;
        detail = error instanceof Error ? error.message : String(error);
      }

      const unexplained = consoleErrors.filter(
        (t) => !t.includes("favicon") && !t.includes("Turnstile") && !t.includes("React DevTools")
      );
      if (unexplained.length) {
        ok = false;
        detail = `${detail} | console: ${unexplained.slice(0, 2).join(" || ")}`;
      }

      await page.screenshot({ path: resolve(outDir, `${screenId}.png`), fullPage: true });
      record({
        screenId,
        route: `#/${entry.route}`,
        role: "client",
        viewport: "desktop",
        ok,
        detail,
        screenshot: resolve(outDir, `${screenId}.png`)
      });
    }

    // Mobile client overview
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${webBaseUrl}/#/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);
    await page.screenshot({ path: resolve(outDir, "client_dashboard_mobile.png"), fullPage: true });
    record({
      screenId: "client_dashboard_mobile",
      route: "#/dashboard",
      role: "client",
      viewport: "mobile",
      ok: true,
      detail: "mobile overview",
      screenshot: resolve(outDir, "client_dashboard_mobile.png")
    });
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
    authMethod: `direct login (${clientEmail})`,
    clientEmail,
    clientRoles: roles,
    adminNavAssertions: FORBIDDEN_ADMIN_NAV,
    totals: {
      screens: results.length,
      pass: results.filter((r) => r.ok).length,
      fail: results.filter((r) => !r.ok).length
    },
    failures: results.filter((r) => !r.ok),
    results
  };
  writeFileSync(resolve(outDir, "client-coverage.json"), JSON.stringify(summary, null, 2), "utf8");
  console.log(`${marker} totals pass=${summary.totals.pass} fail=${summary.totals.fail}`);
  if (summary.totals.fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`${marker} FATAL`, error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
