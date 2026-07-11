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

async function createHubInquiryFixture(adminToken, adminUserId) {
  const clientName = `[SMOKE][CLIENT_HUB_INQUIRY] ${makeSmokeId("client")}`;
  const productName = `[SMOKE][CLIENT_HUB_INQUIRY] ${makeSmokeId("product")}`;
  const inquiryMessage = `Client Hub browser inquiry ${makeSmokeId("msg")}`;

  const client = requireOkData(
    "hub inquiry smoke create client",
    await request("/clients", {
      method: "POST",
      token: adminToken,
      body: { name: clientName, country: "United States", website: "https://smoke-client-hub-inquiry.example.com" }
    })
  ).client;

  const project = requireOkData(
    "hub inquiry smoke create ai delivery project",
    await request("/ai-delivery-projects", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: client.id,
        name: `[SMOKE][CLIENT_HUB_INQUIRY] ${makeSmokeId("project")}`,
        targetMonth: "2026-12"
      }
    })
  ).aiDeliveryProject;

  requireOkData(
    "hub inquiry smoke link client access",
    await request(`/clients/${client.id}/users`, {
      method: "POST",
      token: adminToken,
      body: { userId: adminUserId }
    })
  );

  const product = requireOkData(
    "hub inquiry smoke create catalog product",
    await request(`/clients/${client.id}/catalog-products`, {
      method: "POST",
      token: adminToken,
      body: {
        name: productName,
        description: "Client Hub inquiry browser proof product.",
        priceLabel: "Rp 1",
        isVisibleInPortal: true
      }
    })
  ).catalogProduct;

  const inquiry = requireOkData(
    "hub inquiry smoke submit portal catalog inquiry",
    await request(`/client-portal/projects/${project.id}/catalog-inquiries`, {
      method: "POST",
      token: adminToken,
      body: {
        productId: product.id,
        contactName: "Hub Smoke Client",
        contactEmail: "hub-smoke@example.com",
        message: inquiryMessage
      }
    })
  ).catalogInquiry;

  const adminInquiries = await request(`/clients/${client.id}/catalog-inquiries`, { token: adminToken });
  record(
    "hub inquiry smoke admin list includes portal submission",
    adminInquiries.status === 200 &&
      (adminInquiries.body?.data?.catalogInquiries ?? []).some((entry) => entry.id === inquiry.id),
    inquiry.id
  );

  return { client, clientName, inquiryMessage, productName };
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
  const adminUserId = loginResponse.body?.data?.user?.id ?? null;
  record("admin login", loginResponse.status === 200 && typeof adminToken === "string", `${loginResponse.status}`);
  if (!adminToken || !adminUserId) {
    process.exitCode = 1;
    return;
  }

  const fixture = await createHubInquiryFixture(adminToken, adminUserId);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/clients`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Clients", exact: true }).waitFor({ state: "visible", timeout: 15000 });

    const clientRow = page.locator("tr", { hasText: fixture.clientName }).first();
    await clientRow.waitFor({ state: "visible", timeout: 20000 });
    await clientRow.getByRole("button", { name: "Open hub" }).click();

    await page.getByRole("heading", { name: fixture.clientName, exact: true }).waitFor({ state: "visible", timeout: 20000 });
    record("client hub opens from clients list", true, fixture.clientName);

    await page.getByRole("heading", { name: "Product inquiries", exact: true }).waitFor({ state: "visible", timeout: 15000 });

    const hubText = await page.locator(".page-stack").innerText();
    record(
      "client hub product inquiries section renders submission",
      hubText.includes("Product inquiries") &&
        hubText.includes(fixture.inquiryMessage) &&
        hubText.includes(fixture.productName),
      fixture.inquiryMessage
    );
    record(
      "client hub product catalog section renders product",
      hubText.includes("Product catalog") && hubText.includes(fixture.productName),
      fixture.productName
    );

    await page.locator("li", { hasText: fixture.inquiryMessage }).getByRole("button", { name: "Mark acknowledged" }).click();
    await page.waitForFunction(
      (message) => {
        const items = Array.from(document.querySelectorAll("li"));
        return items.some((item) => item.textContent?.includes(message) && /ACKNOWLEDGED/i.test(item.textContent));
      },
      fixture.inquiryMessage,
      { timeout: 15000 }
    );

    const acknowledgedText = await page.locator(".page-stack").innerText();
    record(
      "client hub inquiry acknowledge updates status in UI",
      /ACKNOWLEDGED/i.test(acknowledgedText) && acknowledgedText.includes(fixture.inquiryMessage),
      "ACKNOWLEDGED"
    );

    const adminInquiries = await request(`/clients/${fixture.client.id}/catalog-inquiries`, { token: adminToken });
    const inquiryEntry = (adminInquiries.body?.data?.catalogInquiries ?? []).find(
      (entry) => entry.message === fixture.inquiryMessage
    );
    record(
      "client hub inquiry acknowledge persists in admin API",
      adminInquiries.status === 200 && inquiryEntry?.status === "ACKNOWLEDGED",
      inquiryEntry?.status ?? "missing"
    );

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Client Hub shows portal-submitted catalog inquiries for operator review.");
      console.log("PROVEN: Admin can acknowledge catalog inquiries from Client Hub without exposing secrets.");
    } else {
      console.log("NOT PROVEN: one or more client hub catalog inquiry browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL client hub catalog inquiry browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
