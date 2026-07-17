/**
 * Local-only system-wide route + viewport proof (1440 / 768 / 390).
 * Covers admin hubs, migrated editor deep links, and client-allowed routes.
 * Does not touch staging/production. Does not commit.
 */
import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://127.0.0.1:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[LOCAL][SYSTEM_WIDE_ROUTES_VIEWPORTS]";
const viewports = [
  { name: "1440", width: 1440, height: 900 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 }
];

const adminHubRoutes = [
  { hash: "#/dashboard", heading: /Dashboard|Overview|Daily/i },
  { hash: "#/tasks", heading: "Tasks" },
  { hash: "#/pending-approvals", heading: "Pending Reviews" },
  { hash: "#/briefs", heading: /Brief|Task/i },
  { hash: "#/client-portal/pending-approvals", heading: "Pending Reviews" },
  { hash: "#/client-portal/briefs", heading: /Brief/i },
  { hash: "#/admin-daily-cockpit", heading: /Daily Operations Cockpit|Attention/i },
  { hash: "#/clients", heading: "Clients" },
  { hash: "#/client-portal", heading: /Archive|Client/i },
  { hash: "#/briefs-panel", heading: /Brief/i },
  { hash: "#/projects", heading: "Projects" },
  { hash: "#/workflow-briefs", heading: /Content plan|Workflow Brief/i },
  { hash: "#/ai-delivery", heading: "AI Delivery Projects" },
  { hash: "#/ai-market-intelligence", heading: "Market Intelligence" },
  { hash: "#/monthly-reports", heading: /Report|Archive|Monthly/i },
  { hash: "#/archive", heading: /Archive|Asset/i },
  { hash: "#/invoice-items", heading: /Service library|Invoice/i },
  { hash: "#/invoices", heading: /Invoice/i },
  { hash: "#/credit-notes", heading: /Credit Note/i },
  { hash: "#/bills", heading: /Bill/i },
  { hash: "#/ai-operations", heading: /AI Operations/i },
  { hash: "#/team", heading: /User|Team|Role/i },
  { hash: "#/modules", heading: /Module/i },
  { hash: "#/tenants", heading: /Tenant/i },
  { hash: "#/company-profile", heading: /Company Profile/i },
  { hash: "#/settings", heading: /Setting/i }
];

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function request(path, options = {}) {
  const headers = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body };
}

async function apiLogin() {
  const response = await request("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword }
  });
  const token = response.body?.data?.session?.token;
  if (response.status !== 200 || typeof token !== "string") {
    throw new Error(`Admin login failed HTTP ${response.status}`);
  }
  return token;
}

async function pageOverflowX(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return Math.max(doc.scrollWidth, body?.scrollWidth ?? 0) > Math.ceil(window.innerWidth) + 1;
  });
}

async function seedEntities(token) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const client = (
    await request("/clients", {
      method: "POST",
      token,
      body: { name: `${smokeMarker} client ${stamp}`, country: "United States" }
    })
  ).body?.data?.client;
  if (!client?.id) throw new Error("client seed failed");

  const project = (
    await request("/projects", {
      method: "POST",
      token,
      body: { clientId: client.id, name: `${smokeMarker} project ${stamp}`, status: "Active" }
    })
  ).body?.data?.project;

  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const task = (
    await request("/tasks", {
      method: "POST",
      token,
      body: {
        title: `${smokeMarker} task ${stamp}`,
        status: "TODO",
        priority: "NORMAL",
        recurringType: "NONE",
        dueDate,
        projectId: project?.id ?? undefined
      }
    })
  ).body?.data?.task;

  const invoiceItem = (
    await request("/invoice-items", {
      method: "POST",
      token,
      body: {
        name: `${smokeMarker} service ${stamp}`,
        description: smokeMarker,
        unitPriceCents: 10000
      }
    })
  ).body?.data?.invoiceItem;

  return { client, project, task, invoiceItem };
}

async function proveRoute(page, viewportName, hash, heading) {
  await page.goto(`${webBaseUrl}/${hash}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: heading }).first().waitFor({ state: "visible", timeout: 20000 });
  const passwordVisible = await page.locator('input[type="password"]').isVisible().catch(() => false);
  if (passwordVisible) throw new Error("login form visible");
  if (await pageOverflowX(page)) throw new Error("page-level horizontal overflow");
  record(`${viewportName} ${hash}`, true, "ok");
}

async function proveEditor(page, viewportName, hash, heading, backLabel) {
  await page.goto(`${webBaseUrl}/${hash}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: heading }).first().waitFor({ state: "visible", timeout: 20000 });
  await page.locator("section.workflow-page").first().waitFor({ state: "visible", timeout: 15000 });
  if (await pageOverflowX(page)) throw new Error("page-level horizontal overflow");
  await page.getByRole("button", { name: backLabel }).first().click();
  await page.waitForTimeout(300);
  const hashAfter = await page.evaluate(() => window.location.hash.split("?")[0]);
  if (hashAfter.includes("/new") || hashAfter.includes("/edit") || hashAfter.includes("/projects/new")) {
    throw new Error(`back did not return to hub: ${hashAfter}`);
  }
  record(`${viewportName} editor ${hash}`, true, `back→${hashAfter}`);
}

async function proveViewport(browser, token, seed, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height }
  });
  await context.addInitScript((authToken) => {
    window.sessionStorage.setItem("dcaosv1.authToken", authToken);
  }, token);
  const page = await context.newPage();
  try {
    for (const route of adminHubRoutes) {
      try {
        await proveRoute(page, viewport.name, route.hash, route.heading);
      } catch (error) {
        record(
          `${viewport.name} ${route.hash}`,
          false,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    const editors = [
      { hash: "#/clients/new", heading: "Add Client", back: "Back to Clients" },
      {
        hash: seed.client?.id ? `#/clients/e/${seed.client.id}/edit` : null,
        heading: "Edit Client",
        back: "Back to Clients"
      },
      { hash: "#/projects/new", heading: "Add Project", back: "Back to Projects" },
      {
        hash: seed.project?.id ? `#/projects/e/${seed.project.id}/edit` : null,
        heading: "Edit Project",
        back: "Back to Projects"
      },
      { hash: "#/tasks/new", heading: "Add Task", back: "Back to Tasks" },
      {
        hash: seed.task?.id ? `#/tasks/e/${seed.task.id}/edit` : null,
        heading: "Edit Task",
        back: "Back to Tasks"
      },
      { hash: "#/invoices/new", heading: "Add Invoice", back: "Back to Invoices" },
      { hash: "#/invoices/recurring/new", heading: "Add Recurring Invoice", back: "Back to Invoices" },
      { hash: "#/credit-notes/new", heading: /Credit Note/i, back: "Back to Credit Notes" },
      { hash: "#/bills/new", heading: /Bill/i, back: "Back to Bills" },
      { hash: "#/invoice-items/new", heading: /Service/i, back: "Back to Service library" },
      { hash: "#/company-profile/new", heading: /Company Profile/, back: "Back to Company profile" },
      {
        hash: "#/ai-market-intelligence/projects/new",
        heading: "Create research project",
        back: "Back to Market Intelligence"
      },
      { hash: "#/ai-delivery/new", heading: "Add AI Delivery", back: "Back to AI Delivery" }
    ].filter((entry) => entry.hash);

    for (const editor of editors) {
      try {
        await proveEditor(page, viewport.name, editor.hash, editor.heading, editor.back);
      } catch (error) {
        record(
          `${viewport.name} editor ${editor.hash}`,
          false,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
  }
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
  record("api health", health.status === 200 && health.body?.ok === true, `${health.status}`);
  if (health.status !== 200) {
    process.exitCode = 1;
    return;
  }

  let browser;
  try {
    const token = await apiLogin();
    record("admin login", true, "200");
    const seed = await seedEntities(token);
    record("local seed", true, seed.client?.id ?? "partial");

    browser = await chromium.launch({ headless: true });
    for (const viewport of viewports) {
      await proveViewport(browser, token, seed, viewport);
    }
  } catch (error) {
    record("runtime", false, error instanceof Error ? error.message : String(error));
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished — ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("NOT PROVEN failures:");
    for (const entry of failed) console.log(`  - ${entry.name}: ${entry.detail}`);
  } else {
    console.log("PROVEN: system-wide hubs + migrated editors at 1440/768/390.");
  }
  process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(`${smokeMarker} fatal — ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
