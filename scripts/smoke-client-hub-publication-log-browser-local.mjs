import { chromium } from "@playwright/test";
import { seedPurivaDeliverySummaryFixture } from "./lib/puriva-delivery-summary-fixture.mjs";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

const forbiddenPatterns = [/applicationPassword/i, /passwordHash/i, /ciphertext/i, /"iv"/i, /authTag/i];

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

function makeSmokeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function requireOkData(name, response, expectedStatus = 201) {
  const ok = response.status === expectedStatus && response.body?.ok === true;
  record(name, ok, `${response.status}`);
  if (!ok) {
    throw new Error(`${name} failed with HTTP ${response.status}.`);
  }
  return response.body.data;
}

function responseLeaksSecrets(text) {
  return forbiddenPatterns.some((pattern) => pattern.test(text));
}

async function createPublicationLogFixture(adminToken) {
  const clientName = `[SMOKE][CLIENT_HUB_PUBLOG] ${makeSmokeId("client")}`;

  const client = requireOkData(
    "publog smoke create client",
    await request("/clients", {
      method: "POST",
      token: adminToken,
      body: {
        name: clientName,
        country: "United States",
        website: "https://smoke-client-hub-publog.example.com"
      }
    })
  ).client;

  const project = requireOkData(
    "publog smoke create ai delivery project",
    await request("/ai-delivery-projects", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: client.id,
        name: `[SMOKE][CLIENT_HUB_PUBLOG] ${makeSmokeId("project")}`,
        targetMonth: "2027-02"
      }
    })
  ).aiDeliveryProject;

  const deliveryHints = await seedPurivaDeliverySummaryFixture({
    request,
    requireOkData,
    record,
    makeSmokeId,
    adminToken,
    client,
    aiProject: project,
    labelPrefix: "[SMOKE][CLIENT_HUB_PUBLOG]"
  });

  const logsResponse = await request(`/clients/${client.id}/publication-logs`, { token: adminToken });
  const logs = logsResponse.body?.data?.publicationLogs ?? [];
  const publishLog = logs.find((entry) => entry.action === "PUBLISH_WORDPRESS");

  record(
    "publog smoke admin publication logs include publish attempt",
    logsResponse.status === 200 && Boolean(publishLog),
    publishLog?.status ?? "missing"
  );
  record(
    "publog smoke publication logs hide secrets",
    !responseLeaksSecrets(logsResponse.text),
    "clean"
  );

  return {
    client,
    clientName,
    publishStatus: publishLog?.status ?? deliveryHints.publishingStatus ?? "missing",
    siteHost: "smoke-puriva.example.com"
  };
}

async function main() {
  const passwordOk = requireEnv("AUTH_SEED_TEST_PASSWORD", adminPassword);
  if (!passwordOk) {
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

  const fixture = await createPublicationLogFixture(adminToken);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/clients`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Clients", exact: true }).waitFor({ state: "visible", timeout: 15000 });

    const clientCard = page.locator("article.entity-card.dense-record", { hasText: fixture.clientName }).first();
    await clientCard.waitFor({ state: "visible", timeout: 20000 });
    await clientCard.getByRole("button", { name: "Open hub" }).click();

    await page.getByRole("heading", { name: fixture.clientName, exact: true }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Publication log", exact: true }).waitFor({ state: "visible", timeout: 15000 });

    const hubText = await page.locator(".page-stack").innerText();
    record(
      "client hub publication log section renders publish event",
      hubText.includes("Publication log") &&
        hubText.includes("PUBLISH_WORDPRESS") &&
        hubText.includes(fixture.siteHost),
      fixture.publishStatus
    );
    record(
      "client hub publication log shows client-safe status",
      hubText.includes(fixture.publishStatus) || hubText.includes("PROVIDER_DISABLED") || hubText.includes("provider_disabled"),
      fixture.publishStatus
    );
    record(
      "client hub publication log hides credential secrets",
      !responseLeaksSecrets(hubText),
      "clean"
    );

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Client Hub publication log renders WordPress publish attempts for operator review.");
      console.log("PROVEN: Publication log UI stays client-safe and omits credential material.");
    } else {
      console.log("NOT PROVEN: one or more client hub publication log browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL client hub publication log browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
