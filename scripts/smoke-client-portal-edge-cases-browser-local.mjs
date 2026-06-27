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

async function createEdgeFixture(adminToken, adminUserId) {
  const clientName = `[SMOKE][CLIENT_PORTAL_EDGE] ${makeSmokeId("client")}`;
  const projectName = `[SMOKE][CLIENT_PORTAL_EDGE] ${makeSmokeId("project")}`;
  const deliverableTitle = `[SMOKE][CLIENT_PORTAL_EDGE] ${makeSmokeId("final")}`;

  const createdClient = requireOkData(
    "edge smoke create client",
    await request("/clients", {
      method: "POST",
      token: adminToken,
      body: { name: clientName, country: "United States" }
    })
  ).client;

  const createdProject = requireOkData(
    "edge smoke create ai delivery project",
    await request("/ai-delivery-projects", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: createdClient.id,
        name: projectName,
        targetMonth: "2026-08"
      }
    })
  ).aiDeliveryProject;

  requireOkData(
    "edge smoke link client access",
    await request(`/clients/${createdClient.id}/users`, {
      method: "POST",
      token: adminToken,
      body: { userId: adminUserId }
    })
  );

  const createdDraft = requireOkData(
    "edge smoke create content draft",
    await request(`/ai-delivery-projects/${createdProject.id}/content-drafts`, {
      method: "POST",
      token: adminToken,
      body: {
        title: `[SMOKE][CLIENT_PORTAL_EDGE] ${makeSmokeId("draft")}`,
        draftBody: "Edge case browser proof draft body.",
        status: "DRAFT"
      }
    })
  ).contentDraft;

  const createdArticleImage = requireOkData(
    "edge smoke create article image",
    await request(`/ai-delivery-projects/${createdProject.id}/article-images`, {
      method: "POST",
      token: adminToken,
      body: {
        contentDraftId: createdDraft.id,
        title: `[SMOKE][CLIENT_PORTAL_EDGE] ${makeSmokeId("image")}`,
        prompt: "Edge case browser proof image prompt.",
        status: "APPROVED",
        notes: "Edge case image fixture."
      }
    })
  ).articleImage;

  requireOkData(
    "edge smoke create DELIVERED deliverable",
    await request(`/ai-delivery-projects/${createdProject.id}/deliverables`, {
      method: "POST",
      token: adminToken,
      body: {
        title: deliverableTitle,
        deliveryType: "CONTENT_PACKAGE",
        status: "DELIVERED",
        articleImageId: createdArticleImage.id
      }
    })
  );

  const portalCatalog = await request(`/client-portal/projects/${createdProject.id}/catalog-products`, {
    token: adminToken
  });
  record(
    "edge smoke portal catalog products empty before browser",
    portalCatalog.status === 200 &&
      Array.isArray(portalCatalog.body?.data?.catalogProducts) &&
      portalCatalog.body.data.catalogProducts.length === 0,
    `${portalCatalog.body?.data?.catalogProducts?.length ?? "missing"}`
  );

  return {
    client: createdClient,
    project: createdProject,
    projectName,
    deliverableTitle
  };
}

async function main() {
  const passwordOk = requireEnv("AUTH_SEED_TEST_PASSWORD", adminPassword);
  if (!passwordOk) {
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
  const adminUserId = loginResponse.body?.data?.user?.id ?? null;
  record("admin login", loginResponse.status === 200 && typeof adminToken === "string", `${loginResponse.status}`);
  if (!adminToken || !adminUserId) {
    console.error("STOP: Admin login failed.");
    process.exitCode = 1;
    return;
  }

  const fixture = await createEdgeFixture(adminToken, adminUserId);

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

    await page.goto(`${webBaseUrl}/#/client-portal`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Client Portal" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByText(fixture.projectName, { exact: true }).waitFor({ state: "visible", timeout: 15000 });

    const portalSection = page.locator('section[aria-labelledby="client-portal-title"]');
    const projectCard = portalSection.locator("article.entity-card", { hasText: fixture.projectName }).first();
    await projectCard.getByRole("button", { name: /^(Open project|View|Open)$/ }).click();
    await portalSection.getByRole("heading", { name: "Product catalog inquiry", exact: true }).waitFor({
      state: "visible",
      timeout: 15000
    });

    await portalSection.getByRole("heading", { name: "No catalog products yet", exact: true }).waitFor({
      state: "visible",
      timeout: 15000
    });
    const catalogEmptyText = await portalSection.innerText();
    record(
      "empty catalog empty state renders",
      catalogEmptyText.includes("No catalog products yet") &&
        catalogEmptyText.includes("Your team can add skincare or service products"),
      "empty catalog copy visible"
    );
    record(
      "empty catalog hides inquiry submit button",
      (await portalSection.getByRole("button", { name: "Send product inquiry" }).count()) === 0,
      "submit button absent"
    );

    requireOkData(
      "edge smoke archive ai delivery project",
      await request(`/ai-delivery-projects/${fixture.project.id}/archive`, {
        method: "POST",
        token: adminToken
      }),
      200
    );

    const afterArchiveProjects = await request("/client-portal/projects", { token: adminToken });
    const afterArchiveList = afterArchiveProjects.body?.data?.aiDeliveryProjects ?? [];
    record(
      "archived project excluded from portal projects API",
      afterArchiveProjects.status === 200 &&
        !afterArchiveList.some((entry) => entry.id === fixture.project.id),
      `${afterArchiveList.length} projects`
    );

    const afterArchiveDetail = await request(`/client-portal/projects/${fixture.project.id}`, { token: adminToken });
    record(
      "archived project detail blocked 404",
      afterArchiveDetail.status === 404,
      `${afterArchiveDetail.status}`
    );

    await portalSection.getByRole("button", { name: "Refresh" }).click();
    await page.waitForResponse(
      (response) =>
        response.url().includes("/client-portal/projects") &&
        response.request().method() === "GET" &&
        response.status() === 200,
      { timeout: 30000 }
    );
    await portalSection.getByRole("button", { name: "Active", exact: true }).click();

    const projectSidebar = portalSection.locator("aside");
    const fixtureProjectCards = projectSidebar.locator("article.entity-card", { hasText: fixture.projectName });
    await page.waitForFunction(
      (projectName) => {
        const sidebar = document.querySelector('section[aria-labelledby="client-portal-title"] aside');
        return sidebar ? !sidebar.textContent?.includes(projectName) : false;
      },
      fixture.projectName,
      { timeout: 20000 }
    );

    record(
      "archived project hidden from active project list after refresh",
      (await fixtureProjectCards.count()) === 0,
      fixture.projectName
    );

    await portalSection.getByRole("button", { name: "Archived", exact: true }).click();
    const archivedSidebarCards = projectSidebar.locator("article.entity-card", { hasText: fixture.projectName });
    record(
      "archived filter does not expose archived project records",
      (await archivedSidebarCards.count()) === 0,
      "archived project still hidden"
    );

    record("browser console/page errors absent", consoleErrors.length === 0, consoleErrors.length ? consoleErrors.join(" | ") : "none");

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Client Portal renders empty catalog empty state without inquiry submit UI.");
      console.log("PROVEN: Archived AI delivery projects disappear from portal list and return 404 on detail.");
      console.log("PROVEN: Active and archived filters keep archived project records hidden after admin archive + refresh.");
    } else {
      console.log("NOT PROVEN: one or more client portal edge-case browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL client portal edge-case browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
