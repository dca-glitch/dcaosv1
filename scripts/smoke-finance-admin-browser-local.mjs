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

  const invoicesApi = await request("/invoices", { token: adminToken });
  record("finance invoices API reachable", invoicesApi.status === 200 && invoicesApi.body?.ok === true, `${invoicesApi.status}`);

  const billsApi = await request("/bills", { token: adminToken });
  record("finance bills API reachable", billsApi.status === 200 && billsApi.body?.ok === true, `${billsApi.status}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/invoices`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Invoices", exact: true }).waitFor({ state: "visible", timeout: 20000 });
    record(
      "invoices admin shell shows finance eyebrow",
      await page.locator("#invoices-title").locator("xpath=ancestor::section[1]").getByText("Finance", { exact: true }).isVisible(),
      "Finance"
    );
    const invoicesText = await page.locator("#invoices-title").locator("xpath=ancestor::section[1]").innerText();
    record(
      "invoices admin shell shows create or empty state",
      invoicesText.includes("Add Invoice") || invoicesText.includes("No invoices"),
      "shell"
    );

    await page.goto(`${webBaseUrl}/#/bills`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Bills", exact: true }).waitFor({ state: "visible", timeout: 20000 });
    record(
      "bills admin shell shows expenses eyebrow",
      await page.locator("#bills-title").locator("xpath=ancestor::section[1]").getByText("Expenses", { exact: true }).isVisible(),
      "Expenses"
    );
    const billsText = await page.locator("#bills-title").locator("xpath=ancestor::section[1]").innerText();
    record(
      "bills admin shell shows create or empty state",
      billsText.includes("Add Bill") || billsText.includes("Add Vendor") || billsText.includes("No bills"),
      "shell"
    );

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Finance admin Invoices and Bills shells render in the browser without errors.");
    } else {
      console.log("NOT PROVEN: one or more finance admin browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL finance admin browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
