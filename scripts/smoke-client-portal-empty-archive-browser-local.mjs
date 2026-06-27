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

async function createEmptyArchiveFixture(adminToken, adminUserId) {
  const projectName = `[SMOKE][CLIENT_PORTAL_EMPTY_ARCHIVE] ${makeSmokeId("project")}`;
  const draftDeliverableTitle = `[SMOKE][CLIENT_PORTAL_EMPTY_ARCHIVE] ${makeSmokeId("draft-deliverable")}`;
  const draftReportTitle = `[SMOKE][CLIENT_PORTAL_EMPTY_ARCHIVE] ${makeSmokeId("draft-report")}`;

  const client = requireOkData(
    "empty archive smoke create client",
    await request("/clients", {
      method: "POST",
      token: adminToken,
      body: { name: `[SMOKE][CLIENT_PORTAL_EMPTY_ARCHIVE] ${makeSmokeId("client")}`, country: "United States" }
    })
  ).client;

  const project = requireOkData(
    "empty archive smoke create ai delivery project",
    await request("/ai-delivery-projects", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: client.id,
        name: projectName,
        targetMonth: "2026-11"
      }
    })
  ).aiDeliveryProject;

  requireOkData(
    "empty archive smoke link client access",
    await request(`/clients/${client.id}/users`, {
      method: "POST",
      token: adminToken,
      body: { userId: adminUserId }
    })
  );

  requireOkData(
    "empty archive smoke create DRAFT deliverable",
    await request(`/ai-delivery-projects/${project.id}/deliverables`, {
      method: "POST",
      token: adminToken,
      body: {
        title: draftDeliverableTitle,
        deliveryType: "CONTENT_PACKAGE",
        status: "DRAFT"
      }
    })
  );

  requireOkData(
    "empty archive smoke create DRAFT monthly report",
    await request(`/ai-delivery/reports/monthly/${project.id}`, {
      method: "POST",
      token: adminToken,
      body: {
        title: draftReportTitle,
        recommendationsText: "Draft-only monthly report must stay hidden from client portal."
      }
    })
  );

  const portalDeliverables = await request(`/client-portal/projects/${project.id}/deliverables`, { token: adminToken });
  record(
    "empty archive portal deliverables API excludes DRAFT",
    portalDeliverables.status === 200 &&
      Array.isArray(portalDeliverables.body?.data?.deliverables) &&
      portalDeliverables.body.data.deliverables.length === 0,
    `${portalDeliverables.body?.data?.deliverables?.length ?? "?"}`
  );

  const portalReports = await request(`/client-portal/projects/${project.id}/monthly-reports`, { token: adminToken });
  record(
    "empty archive portal monthly reports API excludes DRAFT",
    portalReports.status === 200 &&
      Array.isArray(portalReports.body?.data?.monthlyReports) &&
      portalReports.body.data.monthlyReports.length === 0,
    `${portalReports.body?.data?.monthlyReports?.length ?? "?"}`
  );

  return { project, projectName, draftDeliverableTitle, draftReportTitle };
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

  const fixture = await createEmptyArchiveFixture(adminToken, adminUserId);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/client-portal`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Client Portal" }).waitFor({ state: "visible", timeout: 15000 });

    const portalSection = page.locator('section[aria-labelledby="client-portal-title"]');
    await portalSection.locator("article.entity-card", { hasText: fixture.projectName }).first().waitFor({
      state: "visible",
      timeout: 15000
    });
    await portalSection.locator("article.entity-card", { hasText: fixture.projectName }).first().getByRole("button", { name: /^(Open project|View|Open)$/ }).click();
    await portalSection.getByRole("heading", { name: "No final deliverables yet", exact: true }).waitFor({
      state: "visible",
      timeout: 20000
    });

    const archiveText = await portalSection.innerText();
    record(
      "empty final deliverables empty state renders",
      archiveText.includes("No final deliverables yet") &&
        archiveText.includes("Final deliverables appear here once they are marked DELIVERED or ACCEPTED."),
      "deliverables empty state"
    );
    record(
      "DRAFT deliverable hidden from client portal UI",
      !archiveText.includes(fixture.draftDeliverableTitle),
      fixture.draftDeliverableTitle
    );

    await portalSection.getByRole("heading", { name: "No finalized reports yet", exact: true }).waitFor({
      state: "visible",
      timeout: 20000
    });

    const monthlyText = await portalSection.innerText();
    record(
      "empty monthly reports empty state renders",
      monthlyText.includes("No finalized reports yet") &&
        monthlyText.includes("Finalized monthly reports appear here once the admin marks them FINAL."),
      "monthly reports empty state"
    );
    record(
      "DRAFT monthly report hidden from client portal UI",
      !monthlyText.includes(fixture.draftReportTitle),
      fixture.draftReportTitle
    );

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Client Portal shows empty final deliverables state while DRAFT records stay hidden.");
      console.log("PROVEN: Client Portal shows empty finalized monthly reports state while DRAFT reports stay hidden.");
    } else {
      console.log("NOT PROVEN: one or more empty archive browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL empty archive browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
