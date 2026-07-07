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

function projectListItem(page, projectName) {
  return page.locator(".cf-project-list .cf-project-item", { hasText: projectName }).first();
}

async function createFilterFixture(adminToken, adminUserId) {
  const projectName = `[SMOKE][CLIENT_PORTAL_FILTER] ${makeSmokeId("project")}`;

  const client = requireOkData(
    "filter smoke create client",
    await request("/clients", {
      method: "POST",
      token: adminToken,
      body: { name: `[SMOKE][CLIENT_PORTAL_FILTER] ${makeSmokeId("client")}`, country: "United States" }
    })
  ).client;

  const project = requireOkData(
    "filter smoke create ai delivery project",
    await request("/ai-delivery-projects", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: client.id,
        name: projectName,
        targetMonth: "2027-01"
      }
    })
  ).aiDeliveryProject;

  requireOkData(
    "filter smoke link client access",
    await request(`/clients/${client.id}/users`, {
      method: "POST",
      token: adminToken,
      body: { userId: adminUserId }
    })
  );

  return { client, project, projectName };
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

  const fixture = await createFilterFixture(adminToken, adminUserId);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/client-portal`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Your archive" }).waitFor({ state: "visible", timeout: 15000 });

    const portalRoot = page.locator("body");
    const projectCard = projectListItem(page, fixture.projectName);
    await projectCard.waitFor({ state: "visible", timeout: 20000 });

    record(
      "active filter shows linked project",
      (await projectCard.count()) > 0,
      fixture.projectName
    );

    await portalRoot.getByRole("button", { name: "All", exact: true }).click();
    await projectCard.waitFor({ state: "visible", timeout: 15000 });
    record(
      "all filter keeps active project visible",
      (await projectCard.count()) > 0,
      fixture.projectName
    );

    await portalRoot.getByRole("button", { name: "Archived", exact: true }).click();
    record(
      "archived filter hides active-only project",
      (await projectCard.count()) === 0,
      "project hidden on archived filter"
    );

    requireOkData(
      "filter smoke archive ai delivery project",
      await request(`/ai-delivery-projects/${fixture.project.id}/archive`, {
        method: "POST",
        token: adminToken
      }),
      200
    );

    const afterArchiveProjects = await request("/client-portal/projects", { token: adminToken });
    record(
      "archived project removed from portal projects API",
      afterArchiveProjects.status === 200 &&
        !(afterArchiveProjects.body?.data?.aiDeliveryProjects ?? []).some((entry) => entry.id === fixture.project.id),
      `${afterArchiveProjects.status}`
    );

    await portalRoot.getByRole("button", { name: "Refresh" }).click();
    await page.waitForFunction(
      (projectName) => !document.body.textContent?.includes(projectName),
      fixture.projectName,
      { timeout: 15000 }
    );

    await portalRoot.getByRole("button", { name: "Active", exact: true }).click();
    record(
      "active filter hides archived project after refresh",
      (await projectCard.count()) === 0,
      fixture.projectName
    );

    await portalRoot.getByRole("button", { name: "All", exact: true }).click();
    record(
      "all filter still hides archived project after refresh",
      (await projectCard.count()) === 0,
      fixture.projectName
    );

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Client Portal project filters switch safely for active/all/archived views.");
      console.log("PROVEN: Archived projects disappear from all portal filters after admin archive + refresh.");
    } else {
      console.log("NOT PROVEN: one or more client portal project filter checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL client portal project filter browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
