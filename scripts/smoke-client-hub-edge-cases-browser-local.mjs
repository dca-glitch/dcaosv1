/**
 * Phase F Block 60 — Client Hub + PublicationTarget edge-case browser gate.
 */

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
  return { status: response.status, body, text };
}

async function main() {
  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    console.error("STOP: AUTH_SEED_TEST_PASSWORD is required.");
    process.exitCode = 1;
    return;
  }

  const loginResponse = await request("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword }
  });
  const adminToken = loginResponse.body?.data?.session?.token ?? null;
  record("admin login", loginResponse.status === 200 && typeof adminToken === "string", `${loginResponse.status}`);
  if (!adminToken) {
    process.exitCode = 1;
    return;
  }

  const clientName = `[SMOKE][CLIENT_HUB_EDGE] ${makeSmokeId("client")}`;
  const createClient = await request("/clients", {
    method: "POST",
    token: adminToken,
    body: {
      name: clientName,
      website: "https://edge-case.example.com",
      clientKind: "AGENCY_CLIENT"
    }
  });
  const clientId = createClient.body?.data?.client?.id ?? null;
  record("create client via API", createClient.status === 201 && Boolean(clientId), clientId ?? "missing");
  if (!clientId) {
    process.exitCode = 1;
    return;
  }

  const legacyGet = await request("/tenant/wordpress-config", { token: adminToken });
  record(
    "legacy tenant wordpress GET read-only",
    legacyGet.status === 200 && legacyGet.body?.ok === true,
    `${legacyGet.status}`
  );

  const legacyPost = await request("/tenant/wordpress-config", {
    method: "POST",
    token: adminToken,
    body: { siteUrl: "https://legacy.example.com", applicationPassword: "should-not-save" }
  });
  record(
    "legacy tenant wordpress POST sunset",
    legacyPost.status === 410 && legacyPost.body?.error?.code === "WORDPRESS_CONFIG_DEPRECATED",
    `${legacyPost.status}`
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/clients`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Clients", exact: true }).waitFor({ state: "visible", timeout: 20000 });

    const clientCard = page.locator("article.entity-card.dense-record", { hasText: clientName }).first();
    await clientCard.waitFor({ state: "visible", timeout: 15000 });
    await clientCard.getByRole("button", { name: "Open hub" }).click();
    await page.getByText("Client Operating Hub").waitFor({ state: "visible", timeout: 15000 });

    const emptyHubText = await page.locator(".page-stack").innerText();
    record(
      "empty publication targets state",
      emptyHubText.includes("No publication targets") &&
        emptyHubText.includes("Legacy tenant-level WordPress config"),
      "empty + legacy note"
    );
    record(
      "credentials hint before target exists",
      emptyHubText.includes("Add a publication target before saving WordPress credentials"),
      "credential guard"
    );
    record(
      "add target form visible for active client",
      (await page.getByRole("button", { name: "Add publication target" }).count()) === 1,
      "form present"
    );

    await request(`/clients/${clientId}/archive`, { method: "POST", token: adminToken });

    await page.getByRole("button", { name: "Back to clients" }).click();
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Clients", exact: true }).waitFor({ state: "visible", timeout: 20000 });
    await page.getByRole("button", { name: "Archived" }).click();
    const archivedCard = page.locator("article.entity-card.dense-record", { hasText: clientName }).first();
    await archivedCard.waitFor({ state: "visible", timeout: 15000 });
    await archivedCard.getByRole("button", { name: "Open hub" }).click();
    await page.getByRole("heading", { name: clientName }).waitFor({ state: "visible", timeout: 15000 });

    const archivedHubText = await page.locator(".page-stack").innerText();
    record(
      "archived client hub banner",
      archivedHubText.includes("This client is") && archivedHubText.includes("archived"),
      "archived banner"
    );
    record(
      "archived client hides add target form",
      (await page.getByRole("button", { name: "Add publication target" }).count()) === 0,
      "form hidden"
    );
    record(
      "archived client credentials read-only note",
      archivedHubText.includes("Archived client") && archivedHubText.includes("read-only"),
      "credentials read-only"
    );

    const failed = results.filter((entry) => !entry.ok);
    if (failed.length > 0) {
      console.error(`\nSTOP: ${failed.length} edge-case check(s) failed.`);
      process.exitCode = 1;
      return;
    }

    console.log("\nPROVEN: Client Hub edge cases — empty targets, legacy WP sunset, archived read-only hub.");
  } catch (error) {
    console.error(`FAIL: ${error instanceof Error ? error.message : "Browser QA failed."}`);
    process.exitCode = 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

await main();
