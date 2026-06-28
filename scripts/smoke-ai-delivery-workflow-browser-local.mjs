import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][AI_DELIVERY_WORKFLOW_BROWSER]";

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
        body: { name: `${smokeMarker} ${makeSmokeId("client")}`, country: "United States" }
      })
    ).body?.data?.client;

    if (!client?.id) {
      throw new Error("Client fixture create failed.");
    }

    const projectName = `${smokeMarker} ${makeSmokeId("project")}`;
    const project = (
      await request("/ai-delivery-projects", {
        method: "POST",
        token,
        body: {
          clientId: client.id,
          name: projectName,
          targetMonth: "2027-11"
        }
      })
    ).body?.data?.aiDeliveryProject;

    if (!project?.id) {
      throw new Error("AI Delivery project fixture create failed.");
    }

    const createdRun = (
      await request(`/ai-delivery/projects/${project.id}/workflow-runs`, {
        method: "POST",
        token,
        body: {
          status: "DRAFT",
          adminNotes: `${smokeMarker} browser matrix fixture`,
          resultPlaceholder: ""
        }
      })
    ).body?.data?.workflowRun;

    if (!createdRun?.id) {
      throw new Error("Workflow run fixture create failed.");
    }

    const executed = (
      await request(`/ai-delivery/projects/${project.id}/workflow-runs/${createdRun.id}/execute`, {
        method: "POST",
        token
      })
    ).body?.data?.workflowRun;

    record(
      "api workflow execute fixture persisted",
      executed?.status === "REVIEW" && executed?.resultPlaceholder?.includes("Gateway: local") === true,
      executed?.status ?? "missing"
    );

    await page.addInitScript((authToken) => {
      window.sessionStorage.setItem("dcaosv1.authToken", authToken);
    }, token);

    await page.goto(`${webBaseUrl}/#/ai-delivery`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "AI Delivery Projects" }).waitFor({ state: "visible", timeout: 20000 });
    await page.getByText("Operator summary").first().waitFor({ state: "visible", timeout: 15000 });
    record("ai delivery page shell renders", true, "#/ai-delivery");

    const projectCard = page.locator("article.entity-card").filter({ hasText: projectName }).first();
    await projectCard.waitFor({ state: "visible", timeout: 15000 });
    await projectCard.getByText("Admin workflow order").waitFor({ state: "visible", timeout: 10000 });
    record("ai delivery seeded project card renders", true, projectName);

    await projectCard.locator("summary").filter({ hasText: "More" }).click();
    await projectCard.locator(".row-action-menu-label").filter({ hasText: "Planning" }).waitFor({ state: "visible", timeout: 10000 });
    await projectCard.locator(".row-action-menu-label").filter({ hasText: "Packaging" }).waitFor({ state: "visible", timeout: 10000 });
    record("ai delivery grouped workflow navigation renders", true, "More menu");

    await projectCard.getByRole("button", { name: "Workflow runs" }).click();
    const workflowRunsDialog = page.getByRole("dialog", { name: "Workflow Runs" });
    await workflowRunsDialog.waitFor({ state: "visible", timeout: 15000 });
    await workflowRunsDialog.getByRole("heading", { name: "Existing workflow runs" }).waitFor({ state: "visible", timeout: 15000 });
    await workflowRunsDialog.locator("dt", { hasText: "Execution log" }).first().waitFor({ state: "visible", timeout: 15000 });
    record("workflow runs modal renders execution details", true, "Workflow Runs");

    const dialogText = await workflowRunsDialog.innerText();
    const gatewayValue = await workflowRunsDialog.locator("dt", { hasText: "Gateway" }).first().locator("xpath=following-sibling::dd[1]").innerText();
    const executionLogValue = await workflowRunsDialog.locator("dt", { hasText: "Execution log" }).first().locator("xpath=following-sibling::dd[1]").innerText();
    record(
      "workflow runs modal shows local gateway execution context",
      gatewayValue.toLowerCase().includes("local") ||
        executionLogValue.toLowerCase().includes("local") ||
        executionLogValue.toLowerCase().includes("deterministic") ||
        executionLogValue.toLowerCase().includes("stub execution"),
      `${gatewayValue} / log=${executionLogValue.slice(0, 60)}`
    );
    record(
      "workflow runs modal includes execution log section",
      dialogText.includes("Execution log"),
      "execution log"
    );

    await page.getByRole("button", { name: "Close" }).first().click();

    await projectCard.getByRole("button", { name: "Open" }).click();
    const contentPlanDialog = page.getByRole("dialog", { name: "Monthly SEO / Content Plan" });
    await contentPlanDialog.waitFor({ state: "visible", timeout: 15000 });
    await contentPlanDialog.getByRole("heading", { name: "AI SEO workflow shell", exact: true }).waitFor({ state: "visible", timeout: 15000 });
    await contentPlanDialog.locator("h3", { hasText: "Flow summary" }).waitFor({ state: "visible", timeout: 15000 });
    record("content plan modal renders approval shell", true, "AI SEO workflow shell");

    await contentPlanDialog.getByRole("button", { name: "Close" }).first().click();
    await contentPlanDialog.waitFor({ state: "hidden", timeout: 10000 });

    const failed = results.filter((entry) => !entry.ok);
    console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

    if (failed.length === 0) {
      console.log("PROVEN: AI Delivery workflow browser matrix renders operator shell, workflow runs, and content plan panels.");
    } else {
      console.log("NOT PROVEN: one or more AI Delivery workflow browser checks failed.");
    }

    process.exitCode = failed.length > 0 ? 1 : 0;
  } catch (error) {
    record("ai delivery workflow browser smoke runtime", false, error instanceof Error ? error.message : String(error));
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
