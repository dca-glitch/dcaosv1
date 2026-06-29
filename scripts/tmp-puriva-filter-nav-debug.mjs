import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const apiBaseUrl = "http://127.0.0.1:4000/api/v1";
const webBaseUrl = "http://localhost:5173";
const purivaUserId = "6f7f3037-b59c-465e-9d3e-4c6e1295920a";
const purivaEmail = "hellostarwalker@gmail.com";
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const outDir = join(process.cwd(), "scripts", ".tmp-debug-output");

function loadEnvFile() {
  try {
    const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([^#=]+?)=(.*)$/);
      if (!match) continue;
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvFile();

if (!adminPassword) {
  console.error("AUTH_SEED_TEST_PASSWORD is required.");
  process.exit(1);
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
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

const adminLogin = await api("/auth/login", {
  method: "POST",
  body: { email: adminEmail, password: adminPassword }
});
if (!adminLogin.body?.ok) {
  console.error("Admin login failed", adminLogin.status, adminLogin.body?.error?.code);
  process.exit(1);
}

const adminToken = adminLogin.body.data.session.token;
const reset = await api(`/auth/reset-password/${purivaUserId}`, {
  method: "POST",
  token: adminToken
});
if (!reset.body?.ok) {
  console.error("Password reset failed", reset.status, reset.body?.error?.code);
  process.exit(1);
}

const tempPassword = reset.body.data.tempPassword;
const debugLogs = [];
const allConsoleLogs = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("console", (msg) => {
  const text = msg.text();
  allConsoleLogs.push(`[${msg.type()}] ${text}`);
  if (text.includes("DEBUG filterNavigationByRole")) {
    debugLogs.push(text);
  }
});

await page.goto(`${webBaseUrl}/#/login`, { waitUntil: "domcontentloaded" });
await page.fill('input[name="email"]', purivaEmail);
await page.fill('input[name="password"]', tempPassword);
await page.click('button[type="submit"]');
await page.waitForTimeout(4000);

const forceChangeCount = await page.locator('input[autocomplete="new-password"], input[name="newPassword"]').count();
if (forceChangeCount > 0) {
  const passwordInputs = page.locator('input[type="password"]');
  const count = await passwordInputs.count();
  if (count >= 2) {
    await passwordInputs.nth(0).fill(tempPassword);
    await passwordInputs.nth(1).fill(tempPassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
  }
}

await page.waitForTimeout(2000);
await page.click("nav a, .sidebar a, aside a, .sidebar-nav a").catch(() => {});
await page.waitForTimeout(1500);

mkdirSync(outDir, { recursive: true });

const uniqueDebugLogs = [...new Set(debugLogs)];
console.log("\n=== DEBUG filterNavigationByRole logs ===");
if (uniqueDebugLogs.length === 0) {
  console.log("(none captured)");
  console.log("\nLast 20 console lines:");
  for (const line of allConsoleLogs.slice(-20)) {
    console.log(line);
  }
} else {
  for (const line of uniqueDebugLogs) {
    console.log(line);
  }
}

const logHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>DevTools Console — DEBUG filterNavigationByRole</title>
<style>
  body { margin: 0; background: #1e1e1e; color: #d4d4d4; font: 13px/1.4 Consolas, "Courier New", monospace; }
  .bar { background: #252526; border-bottom: 1px solid #333; padding: 8px 12px; font-family: Segoe UI, sans-serif; font-size: 12px; color: #ccc; }
  .console { padding: 12px 16px; white-space: pre-wrap; word-break: break-word; }
  .line { margin-bottom: 8px; }
  .prefix { color: #569cd6; }
  .text { color: #ce9178; }
</style>
</head>
<body>
  <div class="bar">DevTools → Console (Puriva user: ${purivaEmail})</div>
  <div class="console">${uniqueDebugLogs.length === 0 ? "<div class='line'>(no DEBUG filterNavigationByRole log captured)</div>" : uniqueDebugLogs.map((line) => `<div class="line"><span class="prefix">DEBUG</span> <span class="text">${line.replace(/</g, "&lt;")}</span></div>`).join("")}</div>
</body>
</html>`;

const htmlPath = join(outDir, "puriva-debug-console.html");
writeFileSync(htmlPath, logHtml, "utf8");

const screenshotPage = await browser.newPage();
await screenshotPage.setViewportSize({ width: 1100, height: 420 });
await screenshotPage.goto(`file:///${htmlPath.replace(/\\/g, "/")}`);
const screenshotPath = join(outDir, "puriva-debug-filterNavigationByRole.png");
await screenshotPage.screenshot({ path: screenshotPath, fullPage: true });
await screenshotPage.close();

console.log("\nScreenshot saved:", screenshotPath);

await browser.close();
