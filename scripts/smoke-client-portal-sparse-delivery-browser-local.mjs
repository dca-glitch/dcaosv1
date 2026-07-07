import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

const forbiddenTokens = ["storageKey", "workflowRunId", "executionLog", "tenantId", "prompt", "sourceNote"];

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

function containsForbiddenToken(text, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i");
  return pattern.test(text);
}

async function createSparseFixture(adminToken, adminUserId) {
  const projectName = `[SMOKE][CLIENT_PORTAL_SPARSE] ${makeSmokeId("project")}`;

  const client = requireOkData(
    "sparse smoke create client",
    await request("/clients", {
      method: "POST",
      token: adminToken,
      body: { name: `[SMOKE][CLIENT_PORTAL_SPARSE] ${makeSmokeId("client")}`, country: "United States" }
    })
  ).client;

  const project = requireOkData(
    "sparse smoke create ai delivery project",
    await request("/ai-delivery-projects", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: client.id,
        name: projectName,
        targetMonth: "2026-09"
      }
    })
  ).aiDeliveryProject;

  requireOkData(
    "sparse smoke link client access",
    await request(`/clients/${client.id}/users`, {
      method: "POST",
      token: adminToken,
      body: { userId: adminUserId }
    })
  );

  const draft = requireOkData(
    "sparse smoke create content draft",
    await request(`/ai-delivery-projects/${project.id}/content-drafts`, {
      method: "POST",
      token: adminToken,
      body: {
        title: `[SMOKE][CLIENT_PORTAL_SPARSE] ${makeSmokeId("draft")}`,
        draftBody: "Sparse delivery overview browser proof.",
        status: "DRAFT"
      }
    })
  ).contentDraft;

  const image = requireOkData(
    "sparse smoke create article image",
    await request(`/ai-delivery-projects/${project.id}/article-images`, {
      method: "POST",
      token: adminToken,
      body: {
        contentDraftId: draft.id,
        title: `[SMOKE][CLIENT_PORTAL_SPARSE] ${makeSmokeId("image")}`,
        prompt: "Sparse delivery image prompt.",
        status: "APPROVED"
      }
    })
  ).articleImage;

  requireOkData(
    "sparse smoke create DELIVERED deliverable without export",
    await request(`/ai-delivery-projects/${project.id}/deliverables`, {
      method: "POST",
      token: adminToken,
      body: {
        title: `[SMOKE][CLIENT_PORTAL_SPARSE] ${makeSmokeId("final")}`,
        deliveryType: "CONTENT_PACKAGE",
        status: "DELIVERED",
        articleImageId: image.id
      }
    })
  );

  const deliverySummary = await request(`/client-portal/projects/${project.id}/delivery-summary`, { token: adminToken });
  const summary = deliverySummary.body?.data?.deliverySummary ?? null;
  record(
    "sparse smoke delivery summary API is client-safe and unpopulated",
    deliverySummary.status === 200 &&
      summary?.marketIntelligence === null &&
      Array.isArray(summary?.googleDocsExports) &&
      summary.googleDocsExports.length === 0 &&
      summary?.websitePublishing === null,
    "sparse summary shape"
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

  const fixture = await createSparseFixture(adminToken, adminUserId);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/client-portal`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Your archive" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByText(fixture.projectName, { exact: true }).waitFor({ state: "visible", timeout: 15000 });

    const portalRoot = page.locator("body");
    await projectListItem(page, fixture.projectName).click();
    await portalRoot.getByRole("heading", { name: "Work completed", exact: true }).waitFor({ state: "visible", timeout: 15000 });

    const overviewText = await portalRoot.innerText();
    const overviewHtml = await portalRoot.innerHTML();
    const renderedOverview = `${overviewText}\n${overviewHtml}`;

    record(
      "sparse delivery overview section renders",
      overviewText.includes("Work completed") && overviewText.includes("Content plan"),
      "overview visible"
    );
    record(
      "sparse delivery overview shows no market summary yet",
      overviewText.includes("No market insights available yet."),
      "mi placeholder visible"
    );
    record(
      "sparse delivery overview shows no content plan yet",
      overviewText.includes("No content plan yet"),
      "seo placeholder visible"
    );
    record(
      "sparse delivery overview shows no google docs exports yet",
      overviewText.includes("No final file links are available yet."),
      "export placeholder visible"
    );
    record(
      "sparse delivery overview hides open google doc link",
      !overviewText.includes("Open final file"),
      "no export link"
    );
    record(
      "sparse delivery overview shows publishing placeholder",
      overviewText.includes("No handoff updates yet") || overviewText.includes("Website handoff updates will appear here"),
      "publishing placeholder visible"
    );

    const forbiddenHits = forbiddenTokens.filter((token) => containsForbiddenToken(renderedOverview, token));
    record(
      "sparse delivery overview hides forbidden internal fields",
      forbiddenHits.length === 0,
      forbiddenHits.length ? forbiddenHits.join(", ") : "none"
    );

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Client Portal renders sparse delivery overview placeholders before Puriva handoff data exists.");
      console.log("PROVEN: Sparse overview hides internal workflow fields and export links.");
    } else {
      console.log("NOT PROVEN: one or more sparse delivery overview browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL sparse delivery browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
