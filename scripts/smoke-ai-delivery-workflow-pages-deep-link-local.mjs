/**
 * Local-only proof: AI Delivery workflow pages via deep links + viewports.
 * Seeds a disposable project, then exercises every migrated hash route at 1440/768/390.
 * Does not touch staging/production. Does not commit.
 */
import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://127.0.0.1:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[LOCAL][BOTANICAL_WORKFLOW_PAGES]";
const viewports = [
  { name: "1440", width: 1440, height: 900 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 }
];

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
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
  if (response.status !== 200) {
    throw new Error(`Admin login failed with HTTP ${response.status}.`);
  }
  const token = response.body?.data?.session?.token ?? null;
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Admin login did not return a session token.");
  }
  return token;
}

async function ensureSeed(token) {
  const client = (
    await request("/clients", {
      method: "POST",
      token,
      body: { name: `${smokeMarker} ${makeSmokeId("client")}`, country: "United States" }
    })
  ).body?.data?.client;
  if (!client?.id) {
    throw new Error("Client seed create failed.");
  }

  const projectName = `${smokeMarker} ${makeSmokeId("project")}`;
  const project = (
    await request("/ai-delivery-projects", {
      method: "POST",
      token,
      body: {
        clientId: client.id,
        name: projectName,
        targetMonth: "2027-10",
        plannedContentScopeNotes: `${smokeMarker} proof seed`
      }
    })
  ).body?.data?.aiDeliveryProject;
  if (!project?.id) {
    throw new Error("AI Delivery project seed create failed.");
  }

  // Best-effort related fixtures so pages have something to render besides empty states.
  await request(`/ai-delivery-projects/${project.id}/content-drafts`, {
    method: "POST",
    token,
    body: {
      title: `${smokeMarker} draft`,
      draftBody: "Local botanical workflow page proof draft body.",
      status: "DRAFT",
      notes: smokeMarker
    }
  }).catch(() => null);

  await request(`/ai-delivery/projects/${project.id}/workflow-runs`, {
    method: "POST",
    token,
    body: {
      status: "DRAFT",
      adminNotes: `${smokeMarker} run`,
      resultPlaceholder: ""
    }
  }).catch(() => null);

  return { client, project, projectName };
}

async function pageOverflowX(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return Math.max(doc.scrollWidth, body?.scrollWidth ?? 0) > Math.ceil(window.innerWidth) + 1;
  });
}

async function assertAuthenticatedShell(page) {
  const password = page.locator('input[type="password"]');
  if (await password.isVisible().catch(() => false)) {
    return false;
  }
  // Authenticated app shell always exposes the product nav brand.
  const brand = page.getByText("DCA OS Lite", { exact: true }).first();
  return brand.isVisible().catch(() => false);
}

async function gotoHash(page, hash) {
  await page.goto(`${webBaseUrl}/${hash}`, { waitUntil: "domcontentloaded" });
}

async function waitForHeading(page, name, timeout = 20000) {
  await page.getByRole("heading", { name }).first().waitFor({ state: "visible", timeout });
}

async function clickBack(page) {
  await page.getByRole("button", { name: "Back to AI Delivery" }).first().click();
  await waitForHeading(page, "AI Delivery Projects");
  const hash = await page.evaluate(() => window.location.hash);
  if (hash !== "#/ai-delivery") {
    throw new Error(`Expected hub hash #/ai-delivery after Back, got ${hash}`);
  }
}

async function proveRoute(page, { label, hash, heading, viewportName }) {
  await gotoHash(page, hash);
  await waitForHeading(page, heading);
  if (!(await assertAuthenticatedShell(page))) {
    throw new Error("login/password form still visible after goto");
  }
  const region = page.locator("section.workflow-page").first();
  await region.waitFor({ state: "visible", timeout: 15000 });
  const overflow = await pageOverflowX(page);
  if (overflow) {
    throw new Error("page-level horizontal overflow");
  }
  const back = page.getByRole("button", { name: "Back to AI Delivery" }).first();
  await back.waitFor({ state: "visible", timeout: 10000 });
  const box = await back.boundingBox();
  if (box && (box.height < 40 || box.width < 40)) {
    throw new Error(`Back control too small: ${Math.round(box.width)}x${Math.round(box.height)}`);
  }
  record(`${viewportName} ${label}`, true, hash);
}

async function proveViewport(browser, token, project, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height }
  });
  await context.addInitScript((authToken) => {
    window.sessionStorage.setItem("dcaosv1.authToken", authToken);
  }, token);
  const page = await context.newPage();
  try {
    const pid = project.id;
    const routes = [
      { label: "hub", hash: "#/ai-delivery", heading: "AI Delivery Projects", isHub: true },
      { label: "create", hash: "#/ai-delivery/new", heading: "Add AI Delivery" },
      { label: "edit", hash: `#/ai-delivery/p/${pid}/edit`, heading: "Edit AI Delivery" },
      { label: "brief", hash: `#/ai-delivery/p/${pid}/brief`, heading: "AI Delivery Brief" },
      { label: "content-plan", hash: `#/ai-delivery/p/${pid}/content-plan`, heading: "Monthly SEO / Content Plan" },
      { label: "research", hash: `#/ai-delivery/p/${pid}/research`, heading: "Research / Sources" },
      { label: "content-drafts", hash: `#/ai-delivery/p/${pid}/content-drafts`, heading: "AI Content Production" },
      { label: "deliverables", hash: `#/ai-delivery/p/${pid}/deliverables`, heading: "Deliverables" },
      { label: "article-images", hash: `#/ai-delivery/p/${pid}/article-images`, heading: "Image Production Planning" },
      { label: "workflow-runs", hash: `#/ai-delivery/p/${pid}/workflow-runs`, heading: "Workflow Runs" },
      {
        label: "monthly-report",
        hash: `#/ai-delivery/p/${pid}/monthly-report`,
        heading: new RegExp(`^Monthly Report`)
      },
      { label: "knowledge", hash: `#/ai-delivery/p/${pid}/knowledge`, heading: "AI Knowledge & Context Preview" },
      { label: "mi-context", hash: `#/ai-delivery/p/${pid}/mi-context`, heading: "Market Intelligence Context" }
    ];

    // Hub first
    await gotoHash(page, "#/ai-delivery");
    await waitForHeading(page, "AI Delivery Projects");
    if (!(await assertAuthenticatedShell(page))) {
      throw new Error("hub: login/password form still visible");
    }
    record(`${viewport.name} hub`, true, "#/ai-delivery");

    // Direct deep links + Back for each workflow page
    for (const route of routes) {
      if (route.isHub) continue;
      try {
        if (typeof route.heading === "string") {
          await proveRoute(page, {
            label: route.label,
            hash: route.hash,
            heading: route.heading,
            viewportName: viewport.name
          });
        } else {
          await gotoHash(page, route.hash);
          await page.getByRole("heading", { name: route.heading }).first().waitFor({ state: "visible", timeout: 20000 });
          if (!(await assertAuthenticatedShell(page))) {
            throw new Error("login/password form still visible after goto");
          }
          await page.locator("section.workflow-page").first().waitFor({ state: "visible", timeout: 15000 });
          if (await pageOverflowX(page)) {
            throw new Error("page-level horizontal overflow");
          }
          record(`${viewport.name} ${route.label}`, true, route.hash);
        }
        await clickBack(page);
        record(`${viewport.name} ${route.label} Back`, true, "#/ai-delivery");
      } catch (error) {
        record(
          `${viewport.name} ${route.label}`,
          false,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Browser back/forward across two panels
    try {
      await gotoHash(page, `#/ai-delivery/p/${pid}/brief`);
      await waitForHeading(page, "AI Delivery Brief");
      await gotoHash(page, `#/ai-delivery/p/${pid}/deliverables`);
      await waitForHeading(page, "Deliverables");
      await page.goBack();
      await waitForHeading(page, "AI Delivery Brief");
      const backHash = await page.evaluate(() => window.location.hash);
      if (!backHash.endsWith("/brief")) {
        throw new Error(`back hash expected .../brief got ${backHash}`);
      }
      await page.goForward();
      await waitForHeading(page, "Deliverables");
      const fwdHash = await page.evaluate(() => window.location.hash);
      if (!fwdHash.endsWith("/deliverables")) {
        throw new Error(`forward hash expected .../deliverables got ${fwdHash}`);
      }
      // Exclusive: only one workflow page region
      const regionCount = await page.locator("section.workflow-page").count();
      if (regionCount !== 1) {
        throw new Error(`expected 1 workflow-page region, got ${regionCount}`);
      }
      record(`${viewport.name} history back/forward exclusive`, true, "brief↔deliverables");
    } catch (error) {
      record(
        `${viewport.name} history back/forward exclusive`,
        false,
        error instanceof Error ? error.message : String(error)
      );
    }

    // Hub must not show workflow page chrome
    await gotoHash(page, "#/ai-delivery");
    await waitForHeading(page, "AI Delivery Projects");
    const hubWorkflow = await page.locator("section.workflow-page").count();
    record(`${viewport.name} hub hides workflow shell`, hubWorkflow === 0, `regions=${hubWorkflow}`);
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
  const ready = health.status === 200 && health.body?.ok === true;
  record("api health", ready, `${health.status}`);
  if (!ready) {
    process.exitCode = 1;
    return;
  }

  let browser;
  try {
    const token = await apiLogin();
    record("admin login", true, "200");
    const seed = await ensureSeed(token);
    record("local seed project", true, seed.project.id);

    browser = await chromium.launch({ headless: true });
    for (const viewport of viewports) {
      await proveViewport(browser, token, seed.project, viewport);
    }
  } catch (error) {
    record("runtime", false, error instanceof Error ? error.message : String(error));
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished — ${results.length - failed.length}/${results.length} passed`);
  if (failed.length === 0) {
    console.log("PROVEN: all AI Delivery workflow deep links at 1440/768/390 with Back and history.");
  } else {
    console.log("NOT PROVEN: failures:");
    for (const entry of failed) {
      console.log(`  - ${entry.name}: ${entry.detail}`);
    }
  }
  process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(`${smokeMarker} fatal — ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
