import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "OK" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

function requireEnv(name, value) {
  if (typeof value !== "string" || value.length === 0) {
    record(`env ${name}`, false, "missing");
    return false;
  }

  record(`env ${name}`, true, "present");
  return true;
}

async function request(path, options = {}) {
  const headers = { Accept: "application/json" };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
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

async function login(email, password) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

async function verifyMetricKeys(page, gridSelector, metricKeys) {
  const grid = page.locator(gridSelector).first();
  await grid.waitFor({ state: "visible", timeout: 15000 });

  for (const metricKey of metricKeys) {
    const card = grid.locator(`[data-metric="${metricKey}"]`).first();
    await card.waitFor({ state: "visible", timeout: 10000 });
    const cardText = await card.innerText();
    record(`${gridSelector} metric ${metricKey}`, cardText.trim().length > 0, metricKey);
  }
}

async function main() {
  if (!requireEnv("AUTH_SEED_TEST_PASSWORD", adminPassword)) {
    process.exitCode = 1;
    return;
  }

  const health = await request("/health");
  record(
    "api health ready",
    health.status === 200 && health.body?.ok === true && health.body?.data?.database?.status === "ready",
    `${health.status}`
  );
  if (health.status !== 200 || health.body?.data?.database?.status !== "ready") {
    process.exitCode = 1;
    return;
  }

  const loginResponse = await login(adminEmail, adminPassword);
  const adminToken = loginResponse.body?.data?.session?.token ?? null;
  record("admin login", loginResponse.status === 200 && typeof adminToken === "string", `${loginResponse.status}`);
  if (!adminToken) {
    process.exitCode = 1;
    return;
  }

  const membersResponse = await request("/tenants/current/members", { token: adminToken });
  const memberCount = membersResponse.body?.data?.members?.length ?? 0;
  record("team members API reachable", membersResponse.status === 200, `${memberCount} members`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/settings`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Settings", exact: true }).waitFor({ state: "visible", timeout: 20000 });
    await verifyMetricKeys(page, ".settings-shell-metrics", ["settings-profile", "settings-tenant", "settings-access"]);

    const settingsBoundary = page.getByRole("heading", { name: "MVP shell boundary", exact: true });
    await settingsBoundary.waitFor({ state: "visible", timeout: 10000 });
    record("settings shell boundary panel visible", true, "MVP shell boundary");

    const profileCard = page.locator('.settings-shell-metrics [data-metric="settings-profile"]').first();
    const profileText = await profileCard.innerText();
    record("settings profile metric shows admin email", profileText.includes(adminEmail), adminEmail);

    await page.goto(`${webBaseUrl}/#/team`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Members", exact: true }).waitFor({ state: "visible", timeout: 20000 });
    await verifyMetricKeys(page, ".team-shell-metrics", ["team-members", "team-roles", "team-access"]);

    const directoryPanel = page.getByRole("heading", { name: "Member directory", exact: true });
    await directoryPanel.waitFor({ state: "visible", timeout: 10000 });
    record("team member directory panel visible", true, "Member directory");

    if (memberCount > 0) {
      const memberRow = page.locator(".table-wrap tbody tr", { hasText: adminEmail }).first();
      await memberRow.waitFor({ state: "visible", timeout: 10000 });
      record("team directory lists seeded admin member", true, adminEmail);
    } else {
      record("team directory empty state", true, "no members from API");
    }

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Settings and Team read-only shells render metric cards and boundary panels in the browser.");
    } else {
      console.log("NOT PROVEN: one or more settings/team browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL settings team browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
