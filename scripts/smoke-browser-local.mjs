import { chromium } from "@playwright/test";

const apiHealthUrl = "http://localhost:4000/api/v1/health";
const webUrl = "http://localhost:5173/";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") {
    consoleErrors.push(message.text());
  }
});

page.on("pageerror", (error) => {
  consoleErrors.push(error.message);
});

try {
  const healthResponse = await fetch(apiHealthUrl);
  if (!healthResponse.ok) {
    fail(`API health check failed with HTTP ${healthResponse.status}.`);
  }

  const healthJson = await healthResponse.json();
  if (!healthJson?.ok || healthJson?.data?.database?.status !== "ready") {
    fail("API health payload did not report a ready database.");
  }

  await page.goto(webUrl, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Sign In" }).waitFor({ state: "visible", timeout: 15000 });
  await page.getByLabel("Email").waitFor({ state: "visible", timeout: 15000 });
  await page.getByLabel("Password").waitFor({ state: "visible", timeout: 15000 });

  if (consoleErrors.length > 0) {
    fail(`Browser console errors detected: ${consoleErrors.join(" | ")}`);
  }

  console.log("PASS: Browser smoke completed.");
} catch (error) {
  if (error instanceof Error) {
    fail(error.message);
  }

  fail("Browser smoke failed.");
} finally {
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
}
