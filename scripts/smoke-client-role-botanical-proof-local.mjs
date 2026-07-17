/**
 * Local-only Client-role session proof + Botanical Light compliance.
 * Uses genuine client login (puriva@puriva.id or AUTH_SEED_TESTER_*).
 * One browser context for all viewports; token via initScript (no silent re-login).
 * Each viewport resizes then re-enters #/dashboard from the same authenticated session.
 */
import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://127.0.0.1:5173").replace(/\/$/, "");
const clientEmail = process.env.AUTH_SEED_TESTER_EMAIL ?? "puriva@puriva.id";
const clientPassword = process.env.AUTH_SEED_TESTER_PASSWORD ?? process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[LOCAL][CLIENT_ROLE_BOTANICAL]";
const enableAdminSeed = process.env.CLIENT_ROLE_BOTANICAL_SEED === "1";
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

const viewports = [
  { name: "1440", width: 1440, height: 900 },
  { name: "768", width: 768, height: 1024 },
  { name: "390", width: 390, height: 844 }
];

const clientRoutes = [
  { hash: "#/dashboard", heading: /Overview|Dashboard|CLIENT WORKSPACE|Required attention/i },
  { hash: "#/client-portal", heading: /Content|Archive|Delivery|Portal/i },
  { hash: "#/briefs", heading: /Brief|Task/i },
  { hash: "#/pending-approvals", heading: /Pending Review/i },
  { hash: "#/workflow-briefs", heading: /Content plan|Workflow|Brief/i },
  { hash: "#/monthly-reports", heading: /Report|Archive|Monthly/i },
  { hash: "#/archive", heading: /Archive|Asset/i },
  { hash: "#/client-portal/pending-approvals", heading: /Pending Review/i },
  { hash: "#/client-portal/briefs", heading: /Brief|Task/i }
];

const forbiddenAdminHashes = [
  "#/clients",
  "#/clients/new",
  "#/projects/new",
  "#/tasks/new",
  "#/invoices/new",
  "#/ai-delivery/new",
  "#/ai-operations",
  "#/tenants",
  "#/modules",
  "#/team",
  "#/settings",
  "#/company-profile",
  "#/bills/new",
  "#/credit-notes/new",
  "#/invoice-items/new",
  "#/admin-daily-cockpit",
  "#/ai-market-intelligence"
];

const forbiddenNavLabels = [
  "AI operations",
  "Tenants",
  "Modules",
  "Users and roles",
  "Attention required",
  "Workspaces",
  "Invoices",
  "AI Delivery"
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

function normalizeHex(value) {
  if (!value) return "";
  const v = String(value).trim().toLowerCase();
  if (v.startsWith("#") && v.length === 4) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  const rgb = v.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) {
    const hex = (n) => Number(n).toString(16).padStart(2, "0");
    return `#${hex(rgb[1])}${hex(rgb[2])}${hex(rgb[3])}`;
  }
  return v;
}

async function pageOverflowX(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return Math.max(doc.scrollWidth, body?.scrollWidth ?? 0) > Math.ceil(window.innerWidth) + 1;
  });
}

async function assertNotLogin(page) {
  if (page.url().includes("#/login")) throw new Error("landed on login");
  if ((await page.getByRole("heading", { name: /^Sign in$/i }).count()) > 0) {
    throw new Error("Sign in heading visible");
  }
}

async function waitForAuthenticatedShell(page, timeoutMs = 30000) {
  await page.getByText("DCA OS Lite", { exact: true }).first().waitFor({ state: "visible", timeout: timeoutMs });
  await assertNotLogin(page);
  await page.getByRole("heading", { name: /Overview|Dashboard|Required attention|CLIENT WORKSPACE/i }).first().waitFor({
    state: "visible",
    timeout: timeoutMs
  });
}

/** Wait until client identity endpoints are healthy (honest RATE_LIMITED wait). */
async function waitForClientApiReady(token, attempts = 30) {
  for (let i = 0; i < attempts; i += 1) {
    const me = await request("/auth/me", { token });
    if (me.status === 200 && me.body?.ok === true) {
      return { ok: true, detail: "auth/me 200" };
    }
    if (me.body?.error?.code === "RATE_LIMITED" || me.status === 429) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    if (me.body?.error?.code === "AUTH_UNAUTHORIZED" || me.status === 401) {
      return { ok: false, detail: `auth expired status=${me.status}` };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return { ok: false, detail: "auth/me not ready (rate limit or auth failure)" };
}

async function loginClient() {
  const clientLogin = await request("/auth/login", {
    method: "POST",
    body: { email: clientEmail, password: clientPassword }
  });
  const clientToken = clientLogin.body?.data?.session?.token;
  const clientRoles = clientLogin.body?.data?.tenantContext?.activeMembership?.roles ?? [];
  const isClientOnly =
    clientRoles.includes("client") && !clientRoles.includes("owner") && !clientRoles.includes("admin");
  if (clientLogin.status !== 200 || !clientToken || !isClientOnly) {
    throw new Error(`client login failed status=${clientLogin.status} roles=${clientRoles.join(",")}`);
  }
  return { clientToken, clientRoles };
}

async function maybeSeedTaggedProject() {
  if (!enableAdminSeed) {
    record("seed tagged AI Delivery project", true, "skipped (set CLIENT_ROLE_BOTANICAL_SEED=1 to enable)");
    return;
  }
  if (!adminPassword) {
    record("seed tagged AI Delivery project", true, "admin password missing; skipped");
    return;
  }
  const adminLogin = await request("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword }
  });
  if (adminLogin.status !== 200 || !adminLogin.body?.data?.session?.token) {
    record(
      "seed tagged AI Delivery project",
      true,
      `admin soft-skip status=${adminLogin.status} code=${adminLogin.body?.error?.code ?? "n/a"}`
    );
    return;
  }
  const adminToken = adminLogin.body.data.session.token;
  const clientsRes = await request("/clients", { token: adminToken });
  const clients = clientsRes.body?.data?.clients ?? [];
  const puriva = clients.find((c) => /puriva/i.test(c.name || ""));
  if (!puriva?.id) {
    record("seed tagged AI Delivery project", true, "Puriva client not in admin list; skipped");
    return;
  }
  const created = await request("/ai-delivery-projects", {
    method: "POST",
    token: adminToken,
    body: {
      clientId: puriva.id,
      name: `${smokeMarker} project ${Date.now()}`,
      targetMonth: "2027-09",
      plannedContentScopeNotes: smokeMarker
    }
  });
  const seeded = Boolean(created.body?.data?.aiDeliveryProject?.id);
  record(
    "seed tagged AI Delivery project",
    true,
    seeded
      ? created.body.data.aiDeliveryProject.id
      : `soft-skip status=${created.status} code=${created.body?.error?.code ?? "n/a"}`
  );
}

async function proveViewport(page, token, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });

  const ready = await waitForClientApiReady(token);
  record(`${viewport.name} api ready`, ready.ok, ready.detail);
  if (!ready.ok) {
    return;
  }

  try {
    await page.goto(`${webBaseUrl}/#/dashboard`, { waitUntil: "domcontentloaded" });
    await waitForAuthenticatedShell(page, 35000);
  } catch (error) {
    record(
      `${viewport.name} authenticated shell`,
      false,
      error instanceof Error ? error.message : String(error)
    );
    return;
  }

  const tokens = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    const get = (name) => (styles.getPropertyValue(name) || "").trim().toLowerCase();
    return {
      page: get("--ds-surface-page"),
      panel: get("--ds-surface-panel"),
      cta: get("--ds-accent-cta"),
      indigo: get("--ds-accent-indigo"),
      font: getComputedStyle(document.body).fontFamily.toLowerCase(),
      radiusControl: get("--ds-radius-control")
    };
  });
  const botanicalOk =
    normalizeHex(tokens.page) === "#e9e9e4" &&
    normalizeHex(tokens.panel) === "#f1f1ed" &&
    normalizeHex(tokens.cta) === "#30343b" &&
    normalizeHex(tokens.indigo) === "#3730a3" &&
    tokens.font.includes("plus jakarta sans") &&
    tokens.radiusControl.includes("3");
  record(
    `${viewport.name} botanical tokens`,
    botanicalOk,
    `page=${tokens.page} panel=${tokens.panel} cta=${tokens.cta} indigo=${tokens.indigo}`
  );

  const navText = await page.locator("aside, nav").first().innerText().catch(() => "");
  const leaked = forbiddenNavLabels.filter((label) => navText.includes(label));
  record(`${viewport.name} client nav guard`, leaked.length === 0, leaked.join(",") || "clean");

  for (const route of clientRoutes) {
    try {
      await page.goto(`${webBaseUrl}/${route.hash}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(400);
      await assertNotLogin(page);
      await page.getByRole("heading", { name: route.heading }).first().waitFor({ state: "visible", timeout: 20000 });
      if (await pageOverflowX(page)) throw new Error("page-level horizontal overflow");
      record(`${viewport.name} ${route.hash}`, true, "ok");
    } catch (error) {
      record(`${viewport.name} ${route.hash}`, false, error instanceof Error ? error.message : String(error));
    }
  }

  // Refresh — same token in sessionStorage; no re-login.
  try {
    await page.goto(`${webBaseUrl}/#/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForAuthenticatedShell(page, 35000);
    record(`${viewport.name} refresh #/dashboard`, true, "ok");
  } catch (error) {
    record(`${viewport.name} refresh #/dashboard`, false, error instanceof Error ? error.message : String(error));
  }

  // Back/forward without re-authentication.
  try {
    await page.goto(`${webBaseUrl}/#/briefs`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: /Brief|Task/i }).first().waitFor({ state: "visible", timeout: 15000 });
    await page.goto(`${webBaseUrl}/#/pending-approvals`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: /Pending Review/i }).first().waitFor({ state: "visible", timeout: 15000 });
    await page.goBack();
    await page.waitForTimeout(400);
    await page.getByRole("heading", { name: /Brief|Task/i }).first().waitFor({ state: "visible", timeout: 15000 });
    const backHash = await page.evaluate(() => window.location.hash.split("?")[0]);
    if (!backHash.includes("briefs")) throw new Error(`back hash ${backHash}`);
    await page.goForward();
    await page.waitForTimeout(400);
    await page.getByRole("heading", { name: /Pending Review/i }).first().waitFor({ state: "visible", timeout: 15000 });
    await assertNotLogin(page);
    record(`${viewport.name} history back/forward`, true, "briefs↔pending-approvals");
  } catch (error) {
    record(`${viewport.name} history back/forward`, false, error instanceof Error ? error.message : String(error));
  }

  for (const hash of forbiddenAdminHashes) {
    try {
      await page.goto(`${webBaseUrl}/${hash}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(300);
      await assertNotLogin(page);
      const landed = await page.evaluate(() => window.location.hash.split("?")[0]);
      const stillOnForbidden = landed === hash || landed.startsWith(`${hash}/`);
      if (stillOnForbidden) throw new Error(`still on forbidden ${landed}`);
      record(`${viewport.name} deny ${hash}`, true, `→ ${landed}`);
    } catch (error) {
      record(`${viewport.name} deny ${hash}`, false, error instanceof Error ? error.message : String(error));
    }
  }
}

async function main() {
  console.log(`${smokeMarker} starting`);
  if (!clientPassword) {
    record("env AUTH_SEED_TEST_PASSWORD", false, "missing");
    process.exitCode = 1;
    return;
  }
  record("env AUTH_SEED_TEST_PASSWORD", true, "present");
  record("client email", true, clientEmail);

  const health = await request("/health");
  record("api health", health.status === 200 && health.body?.ok === true, `${health.status}`);
  if (health.status !== 200) {
    process.exitCode = 1;
    return;
  }

  let clientToken;
  try {
    const login = await loginClient();
    clientToken = login.clientToken;
    record("client-role login", true, `roles=${login.clientRoles.join(",")}`);
  } catch (error) {
    record("client-role login", false, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  await maybeSeedTaggedProject();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: viewports[0].width, height: viewports[0].height }
  });
  await context.addInitScript((authToken) => {
    window.sessionStorage.setItem("dcaosv1.authToken", authToken);
  }, clientToken);
  const page = await context.newPage();

  try {
    for (const viewport of viewports) {
      await proveViewport(page, clientToken, viewport);
      await new Promise((r) => setTimeout(r, 1000));
    }
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished — ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.log("NOT PROVEN:");
    for (const entry of failed) console.log(`  - ${entry.name}: ${entry.detail}`);
  } else {
    console.log("PROVEN: Client-role routes + Botanical tokens + admin denial at 1440/768/390.");
  }
  process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(`${smokeMarker} fatal — ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
