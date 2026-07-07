/**
 * Post-MVP Block 53 — auth invite boundary browser proof.
 * Verifies invite/password-reset boundary proof on Team and Settings shells only.
 * Does not change auth behavior.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][AUTH_INVITE_BOUNDARY_BROWSER]";

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

    const authSummaryResponse = await request("/tenants/current/authorization-summary", { token });
    const authorization = authSummaryResponse.body?.data?.authorization ?? null;
    record(
      "authorization summary confirms invite flow disabled",
      authSummaryResponse.status === 200 && authorization?.inviteFlowEnabled === false,
      String(authorization?.inviteFlowEnabled)
    );
    record(
      "authorization summary confirms password reset flow disabled",
      authSummaryResponse.status === 200 && authorization?.passwordResetFlowEnabled === false,
      String(authorization?.passwordResetFlowEnabled)
    );

    await page.addInitScript((authToken) => {
      window.sessionStorage.setItem("dcaosv1.authToken", authToken);
    }, token);

    await page.goto(`${webBaseUrl}/#/team`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Members", exact: true }).waitFor({ state: "visible", timeout: 20000 });

    const teamDirectoryPanel = page.locator(".section-panel", {
      has: page.getByRole("heading", { name: "Member directory", exact: true })
    }).first();
    await teamDirectoryPanel.waitFor({ state: "visible", timeout: 15000 });
    const teamText = await teamDirectoryPanel.innerText();
    record(
      "team page renders member directory",
      teamText.toLowerCase().includes("user email") && teamText.toLowerCase().includes("role / access level"),
      "member directory table"
    );

    const teamInviteButtons = teamDirectoryPanel.getByRole("button", { name: /invite/i });
    record(
      "team page has no invite action buttons",
      (await teamInviteButtons.count()) === 0,
      `${await teamInviteButtons.count()} invite buttons`
    );

    const teamResetButtons = teamDirectoryPanel.getByRole("button", { name: /reset password/i });
    record(
      "team page exposes current admin reset-password action",
      (await teamResetButtons.count()) > 0,
      `${await teamResetButtons.count()} reset buttons`
    );

    await page.goto(`${webBaseUrl}/#/settings`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Settings", exact: true }).waitFor({ state: "visible", timeout: 20000 });

    const settingsBoundaryPanel = page.locator(".section-panel", {
      has: page.getByRole("heading", { name: "MVP shell boundary", exact: true })
    }).first();
    await settingsBoundaryPanel.waitFor({ state: "visible", timeout: 15000 });
    const settingsText = await settingsBoundaryPanel.innerText();
    record(
      "settings shell states invite flow out of scope",
      settingsText.toLowerCase().includes("invite") &&
        (settingsText.toLowerCase().includes("out of scope") || settingsText.toLowerCase().includes("remain")),
      "settings invite boundary copy"
    );
    record(
      "settings shell states password reset out of scope",
      settingsText.toLowerCase().includes("password reset") &&
        (settingsText.toLowerCase().includes("out of scope") || settingsText.toLowerCase().includes("remain")),
      "settings password reset boundary copy"
    );

    const inviteButtons = page.getByRole("button", { name: /invite/i });
    const resetButtons = page.getByRole("button", { name: /reset password/i });
    record(
      "settings page has no invite action buttons",
      (await inviteButtons.count()) === 0,
      `${await inviteButtons.count()} invite buttons`
    );
    record(
      "settings page has no password reset action buttons",
      (await resetButtons.count()) === 0,
      `${await resetButtons.count()} reset buttons`
    );

    const failed = results.filter((entry) => !entry.ok);
    console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

    if (failed.length === 0) {
      console.log("PROVEN: Team and Settings shells communicate deferred invite/password-reset boundaries without auth changes.");
    } else {
      console.log("NOT PROVEN: one or more auth invite boundary browser checks failed.");
    }

    process.exitCode = failed.length > 0 ? 1 : 0;
  } catch (error) {
    record("auth invite boundary browser smoke runtime", false, error instanceof Error ? error.message : String(error));
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
