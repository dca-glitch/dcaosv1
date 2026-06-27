import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeDraftTitle = "Smoke content draft browser gate";

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

function makeSmokeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function requireOkData(name, response, expectedStatus = 200) {
  const ok = response.status === expectedStatus && response.body?.ok === true;
  record(name, ok, `${response.status}`);
  if (!ok) {
    throw new Error(`${name} failed with HTTP ${response.status}.`);
  }
  return response.body.data;
}

async function createContentDraftReviewFixture(adminToken, adminUserId) {
  const client = requireOkData(
    "content draft review create client",
    await request("/clients", {
      method: "POST",
      token: adminToken,
      body: { name: `[SMOKE][CONTENT_DRAFT_REVIEW] ${makeSmokeId("client")}`, country: "United States" }
    }),
    201
  ).client;

  const project = requireOkData(
    "content draft review create ai delivery project",
    await request("/ai-delivery-projects", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: client.id,
        name: `[SMOKE][CONTENT_DRAFT_REVIEW] ${makeSmokeId("project")}`,
        targetMonth: "2027-06"
      }
    }),
    201
  ).aiDeliveryProject;

  requireOkData(
    "content draft review grant client access",
    await request(`/clients/${client.id}/users`, {
      method: "POST",
      token: adminToken,
      body: { userId: adminUserId }
    }),
    201
  );

  requireOkData(
    "content draft review create content plan",
    await request(`/ai-delivery-projects/${project.id}/content-plan`, {
      method: "POST",
      token: adminToken,
      body: { items: [] }
    }),
    201
  );

  const contentPlan = requireOkData(
    "content draft review update content plan items",
    await request(`/ai-delivery-projects/${project.id}/content-plan`, {
      method: "PUT",
      token: adminToken,
      body: {
        items: [
          {
            title: "Smoke draft plan item",
            targetKeyword: "content draft browser gate",
            contentType: "article",
            notes: "Linked plan item for draft review browser gate.",
            sortOrder: 1
          }
        ]
      }
    })
  ).contentPlan;

  const planItemId = contentPlan?.items?.[0]?.id;
  if (!planItemId) {
    throw new Error("Content plan item id missing for draft review fixture.");
  }

  const draft = requireOkData(
    "content draft review create draft",
    await request(`/ai-delivery-projects/${project.id}/content-drafts`, {
      method: "POST",
      token: adminToken,
      body: {
        contentPlanItemId: planItemId,
        title: smokeDraftTitle,
        slug: "smoke-content-draft-browser-gate",
        draftBody: "Browser gate draft body for client review shell.",
        status: "DRAFT",
        notes: "Post-MVP Block 35 fixture."
      }
    }),
    201
  ).contentDraft;

  const reviewReady = requireOkData(
    "content draft review request client review",
    await request(`/ai-delivery-projects/${project.id}/content-drafts/${draft.id}/request-client-review`, {
      method: "POST",
      token: adminToken
    })
  ).contentDraft;

  record(
    "content draft review fixture status ready",
    reviewReady?.status === "READY_FOR_REVIEW",
    reviewReady?.status ?? "missing"
  );

  requireOkData(
    "content draft review client review API",
    await request(`/ai-delivery-projects/${project.id}/content-drafts/client-review`, { token: adminToken })
  );

  return { projectId: project.id };
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

  const fixture = await createContentDraftReviewFixture(adminToken, adminUserId);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/content-draft-review`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Content Draft Review", exact: true }).waitFor({ state: "visible", timeout: 20000 });

    const openPanel = page.getByRole("heading", { name: "Open draft review", exact: true });
    await openPanel.waitFor({ state: "visible", timeout: 10000 });
    record("content draft review open panel visible", true, "Open draft review");

    await page.getByLabel("AI Delivery project ID").fill(fixture.projectId);
    await page.getByRole("button", { name: "Load content drafts" }).click();

    const draftsPanel = page.getByRole("heading", { name: "Reviewable drafts", exact: true });
    await draftsPanel.waitFor({ state: "visible", timeout: 20000 });

    const draftCard = page.locator(".entity-card", { hasText: smokeDraftTitle }).first();
    await draftCard.waitFor({ state: "visible", timeout: 20000 });
    record("content draft review card visible", true, smokeDraftTitle);

    const draftText = await draftCard.innerText();
    record(
      "content draft review shows draft body",
      draftText.includes("Browser gate draft body for client review shell."),
      "draft body"
    );
    record(
      "content draft review shows client actions",
      draftText.includes("Approve draft") && draftText.includes("Request changes"),
      "actions"
    );

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Client-safe content draft review shell loads reviewable drafts in the browser.");
    } else {
      console.log("NOT PROVEN: one or more content draft review browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL content draft review browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
