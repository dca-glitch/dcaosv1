import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

function makeSmokeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
  return { status: response.status, body };
}

async function login(email, password) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

async function main() {
  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    console.error("STOP: AUTH_SEED_TEST_PASSWORD is required.");
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
  record("admin login (api)", loginResponse.status === 200 && typeof adminToken === "string", `${loginResponse.status}`);
  if (!adminToken) {
    process.exitCode = 1;
    return;
  }

  const clientName = `[SMOKE][CLIENT_DOMAIN_UI] ${makeSmokeId("client")}`;
  const projectTitle = `[SMOKE][CLIENT_DOMAIN_UI] ${makeSmokeId("mi")}`;
  const targetLabel = `Smoke target ${makeSmokeId("target")}`;
  const targetUrl = "https://smoke-client-domain.example.com";
  const website = "https://smoke-client-domain.example.com";

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
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/dashboard`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: /Dashboard|Operations/i }).first().waitFor({ state: "visible", timeout: 20000 });
    record("dashboard loads after auth", true, "heading visible");

    await page.goto(`${webBaseUrl}/#/clients`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Clients", exact: true }).waitFor({ state: "visible", timeout: 15000 });
    record("clients page loads", true, "#/clients");

    await page.getByRole("button", { name: "Add Client" }).click();
    const clientModal = page.locator(".modal-panel", { hasText: "Add Client" }).first();
    await clientModal.waitFor({ state: "visible", timeout: 10000 });

    await clientModal.getByLabel(/Client name/i).fill(clientName);
    await clientModal.getByLabel(/Website/i).fill(website);
    await clientModal.getByLabel(/Client kind/i).selectOption("AGENCY_CLIENT");
    await clientModal.getByLabel(/Legal entity name/i).fill("Smoke Legal Entity LLC");
    await clientModal.getByRole("button", { name: "Create client" }).first().click();
    await page.getByText("Client created.", { exact: true }).waitFor({ state: "visible", timeout: 15000 });
    record("create client via UI", true, clientName);

    const clientCard = page.locator("article.entity-card.dense-record", { hasText: clientName }).first();
    await clientCard.waitFor({ state: "visible", timeout: 15000 });
    record("client card visible in list", true, clientName);

    await page.getByRole("button", { name: "Agency" }).click();
    record("agency kind filter clickable", await clientCard.isVisible(), "Agency filter");

    await clientCard.getByRole("button", { name: "Open hub" }).click();
    await page.getByText("Client Operating Hub").waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: clientName }).waitFor({ state: "visible", timeout: 10000 });
    record("client hub opens", true, clientName);

    const hubWebsite = page.locator("section, div").filter({ hasText: "Website" }).first();
    const hubText = await page.locator(".page-stack").innerText();
    record("hub shows website", hubText.includes(website), website);

    await page.getByLabel(/^Label$/).fill(targetLabel);
    await page.getByLabel(/^Site URL$/).fill(targetUrl);
    await page.getByRole("button", { name: "Add publication target" }).click();
    await page.locator("li", { hasText: targetLabel }).waitFor({ state: "visible", timeout: 15000 });
    record("publication target added in hub", true, targetLabel);

    await page.goto(`${webBaseUrl}/#/ai-market-intelligence`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Market Intelligence" }).waitFor({ state: "visible", timeout: 15000 });
    record("market intelligence page loads", true, "#/ai-market-intelligence");

    await page.getByRole("button", { name: "New research project" }).click();
    const miModal = page.locator(".modal-panel", { hasText: "Create research project" }).first();
    await miModal.waitFor({ state: "visible", timeout: 10000 });

    await miModal.getByLabel(/Project name/i).fill(projectTitle);
    await miModal.locator("select").first().selectOption({ label: `${clientName} (${website})` });
    await miModal.getByRole("button", { name: "Create project" }).click();

    await page.locator("h3", { hasText: projectTitle }).first().waitFor({ state: "visible", timeout: 15000 });
    const projectCard = page.locator("article.dense-record", { hasText: projectTitle }).first();
    const projectText = await projectCard.innerText();
    record("mi project created via UI", projectText.includes(projectTitle), projectTitle);
    record("mi project shows linked client name", projectText.includes(clientName), clientName);

    await page.goto(`${webBaseUrl}/#/invoices`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Invoices" }).waitFor({ state: "visible", timeout: 15000 });
    record("invoices page loads (sanity)", true, "#/invoices");

    const ignoredConsolePatterns = [/favicon/i, /turnstile/i];
    const relevantConsoleErrors = consoleErrors.filter(
      (message) => !ignoredConsolePatterns.some((pattern) => pattern.test(message))
    );
    record("no relevant browser console errors", relevantConsoleErrors.length === 0, relevantConsoleErrors.join(" | ") || "clean");

    const failed = results.filter((entry) => !entry.ok);
    if (failed.length > 0) {
      console.error(`\nSTOP: ${failed.length} browser QA check(s) failed.`);
      process.exitCode = 1;
      return;
    }

    console.log("\nPROVEN: Client domain browser QA — Clients, Client Hub, publication target, MI client picker.");
  } catch (error) {
    console.error(`FAIL: ${error instanceof Error ? error.message : "Browser QA failed."}`);
    process.exitCode = 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

await main();
