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

async function createRevokeFixture(adminToken, adminUserId) {
  const projectName = `[SMOKE][CLIENT_PORTAL_REVOKE] ${makeSmokeId("project")}`;

  const client = requireOkData(
    "revoke smoke create client",
    await request("/clients", {
      method: "POST",
      token: adminToken,
      body: { name: `[SMOKE][CLIENT_PORTAL_REVOKE] ${makeSmokeId("client")}`, country: "United States" }
    })
  ).client;

  const project = requireOkData(
    "revoke smoke create ai delivery project",
    await request("/ai-delivery-projects", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: client.id,
        name: projectName,
        targetMonth: "2026-10"
      }
    })
  ).aiDeliveryProject;

  requireOkData(
    "revoke smoke link client access",
    await request(`/clients/${client.id}/users`, {
      method: "POST",
      token: adminToken,
      body: { userId: adminUserId }
    })
  );

  const visibleBeforeRevoke = await request("/client-portal/projects", { token: adminToken });
  record(
    "revoke smoke project visible before revoke",
    visibleBeforeRevoke.status === 200 &&
      (visibleBeforeRevoke.body?.data?.aiDeliveryProjects ?? []).some((entry) => entry.id === project.id),
    `${visibleBeforeRevoke.status}`
  );

  return { client, project, projectName, adminUserId };
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

  const fixture = await createRevokeFixture(adminToken, adminUserId);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/client-portal`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Client Portal" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByText(fixture.projectName, { exact: true }).waitFor({ state: "visible", timeout: 15000 });

    const portalSection = page.locator('section[aria-labelledby="client-portal-title"]');
    record(
      "revoke browser project visible before revoke",
      (await portalSection.locator("article.entity-card", { hasText: fixture.projectName }).count()) > 0,
      fixture.projectName
    );

    requireOkData(
      "revoke smoke archive client user access",
      await request(`/clients/${fixture.client.id}/users/${fixture.adminUserId}/archive`, {
        method: "POST",
        token: adminToken
      }),
      200
    );

    const afterRevokeProjects = await request("/client-portal/projects", { token: adminToken });
    record(
      "revoke smoke project hidden in portal API after revoke",
      afterRevokeProjects.status === 200 &&
        !(afterRevokeProjects.body?.data?.aiDeliveryProjects ?? []).some((entry) => entry.id === fixture.project.id),
      `${afterRevokeProjects.status}`
    );

    const afterRevokeDetail = await request(`/client-portal/projects/${fixture.project.id}`, { token: adminToken });
    record(
      "revoke smoke project detail blocked 404 after revoke",
      afterRevokeDetail.status === 404,
      `${afterRevokeDetail.status}`
    );

    await portalSection.getByRole("button", { name: "Refresh" }).click();
    await page.waitForFunction(
      (projectName) => !document.body.textContent?.includes(projectName),
      fixture.projectName,
      { timeout: 15000 }
    );

    record(
      "revoke browser project hidden after refresh",
      (await portalSection.locator("article.entity-card", { hasText: fixture.projectName }).count()) === 0,
      fixture.projectName
    );

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Client Portal shows linked project while ClientUserAccess is active.");
      console.log("PROVEN: Revoking ClientUserAccess hides the project from portal list and detail in browser + API.");
    } else {
      console.log("NOT PROVEN: one or more client access revoke browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL client access revoke browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
