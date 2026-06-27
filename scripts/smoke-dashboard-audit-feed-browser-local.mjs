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

function formatAuditActionLabel(action) {
  return action
    .replace(/[.:]/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|\s)\S/g, (segment) => segment.toUpperCase());
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

async function ensureRecentAuditEvent(adminToken) {
  let auditResponse = await request("/activity/audit-logs?limit=5", { token: adminToken });
  record(
    "audit logs API reachable",
    auditResponse.status === 200 && auditResponse.body?.ok === true,
    `${auditResponse.status}`
  );

  if (auditResponse.status !== 200 || auditResponse.body?.ok !== true) {
    throw new Error("Audit logs API did not return success.");
  }

  let auditLogs = auditResponse.body?.data?.auditLogs ?? [];
  if (auditLogs.length > 0) {
    record("audit logs already populated", true, `${auditLogs.length} events`);
    return auditLogs;
  }

  const disableResponse = await request("/modules/current/finance-lite/disable", {
    method: "POST",
    token: adminToken,
    body: {}
  });
  record("seed audit via module disable", disableResponse.status === 200, `${disableResponse.status}`);

  const enableResponse = await request("/modules/current/finance-lite/enable", {
    method: "POST",
    token: adminToken,
    body: {}
  });
  record("restore finance-lite module", enableResponse.status === 200, `${enableResponse.status}`);

  auditResponse = await request("/activity/audit-logs?limit=5", { token: adminToken });
  auditLogs = auditResponse.body?.data?.auditLogs ?? [];
  record("audit logs populated after module toggle", auditLogs.length > 0, `${auditLogs.length} events`);

  if (auditLogs.length === 0) {
    throw new Error("Could not seed audit events for dashboard browser proof.");
  }

  return auditLogs;
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
  record("admin login", loginResponse.status === 200 && typeof adminToken === "string", `${loginResponse.status}`);
  if (!adminToken) {
    process.exitCode = 1;
    return;
  }

  const auditLogs = await ensureRecentAuditEvent(adminToken);
  const expectedLabels = auditLogs.slice(0, 5).map((entry) => formatAuditActionLabel(entry.action));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/dashboard`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Dashboard", exact: true }).waitFor({ state: "visible", timeout: 20000 });

    const metricGrid = page.locator(".dashboard-command-metrics").first();
    await metricGrid.waitFor({ state: "visible", timeout: 15000 });

    const expectedMetricKeys = ["signed-in", "active-tenant", "role-coverage", "workspace-state"];
    for (const metricKey of expectedMetricKeys) {
      const metricCard = metricGrid.locator(`[data-metric="${metricKey}"]`).first();
      await metricCard.waitFor({ state: "visible", timeout: 10000 });
      const cardText = await metricCard.innerText();
      record(`dashboard metric card ${metricKey}`, cardText.trim().length > 0, metricKey);
    }

    const signedInCard = metricGrid.locator('[data-metric="signed-in"]').first();
    const signedInText = await signedInCard.innerText();
    record(
      "dashboard signed-in metric shows admin email helper",
      signedInText.includes(adminEmail),
      adminEmail
    );

    const activityPanel = page.locator(".section-panel", { has: page.getByRole("heading", { name: "Recent Activity", exact: true }) }).first();
    await activityPanel.waitFor({ state: "visible", timeout: 15000 });
    record("dashboard recent activity panel visible", true, "Recent Activity");

    const feedItems = activityPanel.locator(".audit-feed-item");
    await feedItems.first().waitFor({ state: "visible", timeout: 15000 });
    const feedCount = await feedItems.count();
    record(
      "audit feed item count matches API slice",
      feedCount === expectedLabels.length,
      `ui=${feedCount} api=${expectedLabels.length}`
    );

    const firstLabel = expectedLabels[0];
    const firstItemText = await feedItems.first().innerText();
    record(
      "first audit feed item shows formatted action label",
      firstItemText.includes(firstLabel),
      firstLabel
    );

    const actorBadge = feedItems.first().locator(".status-badge");
    await actorBadge.waitFor({ state: "visible", timeout: 10000 });
    const badgeText = (await actorBadge.innerText()).trim();
    record(
      "audit feed item shows actor badge",
      badgeText === "User" || badgeText === "System",
      badgeText
    );

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Dashboard read-only audit feed renders tenant-scoped events in the browser.");
    } else {
      console.log("NOT PROVEN: one or more dashboard audit feed browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL dashboard audit feed browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
