import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][MI_OPERATOR_BROWSER]";

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
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

async function login() {
  const response = await request("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword }
  });
  if (response.status !== 200) {
    throw new Error(`Admin login failed with HTTP ${response.status}.`);
  }
  const token = response.body?.data?.session?.token ?? null;
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Admin login did not return a session token.");
  }
  return token;
}

async function main() {
  console.log(`${smokeMarker} starting`);

  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    record("env AUTH_SEED_TEST_PASSWORD", false, "missing");
    process.exitCode = 1;
    return;
  }
  record("env AUTH_SEED_TEST_PASSWORD", true, "present");

  const health = await request("/health");
  record(
    "api health ready",
    health.status === 200 && health.body?.ok === true && health.body?.data?.database?.status === "ready",
    `${health.status}`
  );
  if (health.status !== 200) {
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const token = await login();
    record("admin login", true, "200");

    const client = (
      await request("/clients", {
        method: "POST",
        token,
        body: { name: `${smokeMarker} ${makeSmokeId("client")}`, country: "United States", website: "https://smoke-mi.example.com" }
      })
    ).body?.data?.client;

    if (!client?.id) {
      throw new Error("Client fixture create failed.");
    }

    const projectTitle = `${smokeMarker} ${makeSmokeId("project")}`;
    const project = (
      await request("/market-intelligence-projects", {
        method: "POST",
        token,
        body: {
          title: projectTitle,
          description: "Operator browser smoke fixture",
          clientId: client.id,
          targetMonth: "2027-10",
          keywords: "smoke, operator",
          niche: "QA",
          status: "ACTIVE"
        }
      })
    ).body?.data?.project;

    if (!project?.id) {
      throw new Error("Market Intelligence project fixture create failed.");
    }

    await request(`/market-intelligence-projects/${project.id}/sources`, {
      method: "POST",
      token,
      body: {
        title: `${smokeMarker} source`,
        sourceUrl: "https://example.com/smoke-mi-source",
        sourceNotes: "Operator browser fixture source"
      }
    });

    record("mi api fixture seeded", true, project.id);

    await page.addInitScript((authToken) => {
      window.sessionStorage.setItem("dcaosv1.authToken", authToken);
    }, token);

    await page.goto(`${webBaseUrl}/#/ai-market-intelligence`, { waitUntil: "domcontentloaded" });
    await page.locator("#market-intelligence-title").waitFor({ state: "visible", timeout: 20000 });
    record("mi page header renders", true, "#/ai-market-intelligence");

    const queueAside = page.locator("aside.entity-card").first();
    await queueAside.getByRole("heading", { name: "Research queue" }).waitFor({ state: "visible", timeout: 10000 });
    record("mi research queue sidebar renders", true, "Research queue");

    const projectCard = queueAside.locator("article.dense-record", { hasText: projectTitle }).first();
    await projectCard.waitFor({ state: "visible", timeout: 15000 });
    await projectCard.click();

    await page.getByRole("heading", { name: "Operator workflow", exact: true }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Research sources", exact: true }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Research findings", exact: true }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Research runs", exact: true }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Market insights", exact: true }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "MI summary", exact: true }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Internal handoffs", exact: true }).waitFor({ state: "visible", timeout: 15000 });
    record("mi operator workflow sections render", true, "7 panels");

    const metricGrid = page.locator(".summary-grid.metric-grid").first();
    await metricGrid.waitFor({ state: "visible", timeout: 10000 });
    for (const label of ["Sources", "Findings", "Runs", "Insights", "Summaries", "Handoffs"]) {
      const card = metricGrid.locator(".card-elevated", { hasText: label }).first();
      await card.waitFor({ state: "visible", timeout: 10000 });
      record(`mi metric card ${label}`, true, label);
    }

    const sourcesPanel = page.getByRole("heading", { name: "Research sources", exact: true }).locator("xpath=ancestor::section[1]");
    await sourcesPanel.getByText(`${smokeMarker} source`).waitFor({ state: "visible", timeout: 10000 });
    record("mi seeded source visible in panel", true, "fixture source");

    const workflowPanel = page.getByRole("heading", { name: "Operator workflow", exact: true }).locator("xpath=ancestor::section[1]");
    const workflowText = await workflowPanel.innerText();
    record(
      "mi operator workflow marks seeded sources step done",
      workflowText.includes("Add research sources") && workflowText.toLowerCase().includes("done"),
      "sources step"
    );

    const failed = results.filter((entry) => !entry.ok);
    console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

    if (failed.length === 0) {
      console.log("PROVEN: Market Intelligence operator workflow renders queue, metrics, and seeded project panels in the browser.");
    } else {
      console.log("NOT PROVEN: one or more MI operator browser checks failed.");
    }

    process.exitCode = failed.length > 0 ? 1 : 0;
  } catch (error) {
    record("mi operator browser smoke runtime", false, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`${smokeMarker} fatal - ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
