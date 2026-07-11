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

function hasProject(projects, projectId) {
  return Array.isArray(projects) && projects.some((project) => project.id === projectId);
}

async function createAccessFixture(adminToken) {
  const clientName = `[SMOKE][CLIENT_ACCESS_BROWSER] ${makeSmokeId("client")}`;

  const client = requireOkData(
    "access browser smoke create client",
    await request("/clients", {
      method: "POST",
      token: adminToken,
      body: { name: clientName, country: "United States" }
    })
  ).client;

  const project = requireOkData(
    "access browser smoke create ai delivery project",
    await request("/ai-delivery-projects", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: client.id,
        name: `[SMOKE][CLIENT_ACCESS_BROWSER] ${makeSmokeId("project")}`,
        targetMonth: "2027-04"
      }
    })
  ).aiDeliveryProject;

  return { client, clientName, project };
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
  const adminUserId = loginResponse.body?.data?.user?.id ?? null;
  record("admin login", loginResponse.status === 200 && typeof adminToken === "string", `${loginResponse.status}`);
  if (!adminToken || !adminUserId) {
    process.exitCode = 1;
    return;
  }

  const fixture = await createAccessFixture(adminToken);

  const beforeGrantProjects = await request("/client-portal/projects", { token: adminToken });
  record(
    "portal project hidden before browser grant",
    beforeGrantProjects.status === 200 && !hasProject(beforeGrantProjects.body?.data?.aiDeliveryProjects, fixture.project.id),
    `${beforeGrantProjects.status}`
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/clients`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Clients", exact: true }).waitFor({ state: "visible", timeout: 20000 });

    const clientRow = page.locator("tr", { hasText: fixture.clientName }).first();
    await clientRow.waitFor({ state: "visible", timeout: 20000 });
    await clientRow.getByRole("button", { name: "Open", exact: true }).click();

    const editModal = page.locator("[role='dialog']", { hasText: "Edit Client" }).first();
    await editModal.waitFor({ state: "visible", timeout: 15000 });
    await editModal.getByRole("heading", { name: "Client access", exact: true }).waitFor({ state: "visible", timeout: 15000 });
    record("edit client modal shows client access section", true, "Client access");

    const modalTextBefore = await editModal.innerText();
    record(
      "client access starts with no linked users",
      modalTextBefore.includes("No users linked to this client"),
      "empty access list"
    );

    await editModal.getByLabel(/Link tenant user/i).selectOption(adminUserId);
    await editModal.getByRole("button", { name: "Link user" }).click();
    await editModal.locator(".dense-access-row", { hasText: adminEmail }).waitFor({ state: "visible", timeout: 15000 });

    const modalTextAfter = await editModal.innerText();
    record(
      "browser link user shows admin in access list",
      modalTextAfter.includes(adminEmail),
      adminEmail
    );

    const accessAfterGrant = await request(`/clients/${fixture.client.id}/users`, { token: adminToken });
    const grantedUsers = accessAfterGrant.body?.data?.users ?? [];
    record(
      "browser grant persists in admin access API",
      accessAfterGrant.status === 200 && grantedUsers.some((entry) => entry.user?.id === adminUserId),
      `${accessAfterGrant.status}`
    );

    const afterGrantProjects = await request("/client-portal/projects", { token: adminToken });
    record(
      "portal project visible after browser grant",
      afterGrantProjects.status === 200 && hasProject(afterGrantProjects.body?.data?.aiDeliveryProjects, fixture.project.id),
      `${afterGrantProjects.status}`
    );

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Admin can grant ClientUserAccess from the Clients edit modal in the browser.");
      console.log("PROVEN: Browser grant unlocks client portal project visibility for the linked user.");
    } else {
      console.log("NOT PROVEN: one or more client access browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL client access browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
