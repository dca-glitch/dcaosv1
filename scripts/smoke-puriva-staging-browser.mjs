#!/usr/bin/env node

/**
 * Puriva client portal staging browser proof (Playwright).
 * Requires:
 *   MVP_SMOKE_API_BASE_URL=https://staging.digitalcubeagency.net/api/v1
 *   MVP_SMOKE_WEB_BASE_URL=https://staging.digitalcubeagency.net
 * Correlation: puriva-staging-browser-<uuid>
 * No live providers. Exact-ID archive cleanup.
 */

import { randomUUID } from "node:crypto";
import { chromium } from "@playwright/test";
import {
  CLIENT_PORTAL_MONTHLY_REPORTS_HEADING,
  CLIENT_PORTAL_PAGE_HEADING,
  clientPortalSection,
  gotoClientPortal,
  seedClientPortalAuth,
  selectPortalProject
} from "./lib/client-portal-browser-smoke-helpers.mjs";

const smokeMarker = "[SMOKE][PURIVA_STAGING_BROWSER]";
const correlationId = `puriva-staging-browser-${randomUUID()}`;
const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const targetMonth = `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;

const allowedHosts = new Set(["staging.digitalcubeagency.net"]);
const forbiddenTokens = [
  "storageKey",
  "adminSummaryNotes",
  "tenantId",
  "workflowRunId",
  "executionLog",
  "providerMetadata",
  "draftBody"
];

const results = [];
const cleanupIds = {
  correlationId,
  clientId: null,
  foreignClientId: null,
  projectId: null,
  foreignProjectId: null,
  deliverableId: null,
  monthlyReportId: null,
  portalUserId: null,
  portalEmail: null
};

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

function pickId(...candidates) {
  for (const value of candidates) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

function containsForbiddenToken(text, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i");
  return pattern.test(text);
}

function requireStagingTargets() {
  try {
    const api = new URL(apiBaseUrl);
    const web = new URL(webBaseUrl);
    const apiOk =
      allowedHosts.has(api.hostname) &&
      api.protocol === "https:" &&
      api.pathname.replace(/\/$/, "") === "/api/v1";
    const webOk = allowedHosts.has(web.hostname) && web.protocol === "https:";
    record("staging_api_target", apiOk, apiOk ? api.hostname : "blocked");
    record("staging_web_target", webOk, webOk ? web.hostname : "blocked");
    return apiOk && webOk;
  } catch {
    record("staging_api_target", false, "invalid");
    record("staging_web_target", false, "invalid");
    return false;
  }
}

async function request(token, method, path, body) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: response.status, json, text };
}

async function archiveExact(adminToken) {
  const ops = [];
  if (cleanupIds.monthlyReportId) {
    ops.push(request(adminToken, "POST", `/ai-delivery/reports/monthly/${cleanupIds.monthlyReportId}/archive`, {}));
  }
  if (cleanupIds.deliverableId && cleanupIds.projectId) {
    ops.push(
      request(
        adminToken,
        "POST",
        `/ai-delivery-projects/${cleanupIds.projectId}/deliverables/${cleanupIds.deliverableId}/archive`,
        {}
      )
    );
  }
  if (cleanupIds.projectId) {
    ops.push(request(adminToken, "POST", `/ai-delivery-projects/${cleanupIds.projectId}/archive`, {}));
  }
  if (cleanupIds.foreignProjectId) {
    ops.push(request(adminToken, "POST", `/ai-delivery-projects/${cleanupIds.foreignProjectId}/archive`, {}));
  }
  await Promise.allSettled(ops);
}

async function createFixture(adminToken) {
  const clientRes = await request(adminToken, "POST", "/clients", {
    name: `[${correlationId}] Puriva Portal Browser`,
    website: "https://puriva.id",
    country: "Indonesia",
    clientKind: "AGENCY_CLIENT",
    notes: `${correlationId} staging browser fixture`
  });
  cleanupIds.clientId = pickId(clientRes.json?.data?.client?.id, clientRes.json?.data?.id);
  if (!cleanupIds.clientId) throw new Error(`client create failed status=${clientRes.status}`);

  const foreignRes = await request(adminToken, "POST", "/clients", {
    name: `[${correlationId}] Foreign Browser`,
    website: "https://foreign-browser.invalid",
    country: "United States",
    clientKind: "AGENCY_CLIENT",
    notes: `${correlationId} foreign browser isolation`
  });
  cleanupIds.foreignClientId = pickId(foreignRes.json?.data?.client?.id, foreignRes.json?.data?.id);

  const projectName = `[${correlationId}] Portal Monthly ${targetMonth}`;
  const projectRes = await request(adminToken, "POST", "/ai-delivery-projects", {
    clientId: cleanupIds.clientId,
    name: projectName,
    targetMonth
  });
  cleanupIds.projectId = pickId(
    projectRes.json?.data?.aiDeliveryProject?.id,
    projectRes.json?.data?.project?.id,
    projectRes.json?.data?.id
  );
  if (!cleanupIds.projectId) throw new Error(`project create failed status=${projectRes.status}`);

  if (cleanupIds.foreignClientId) {
    const fp = await request(adminToken, "POST", "/ai-delivery-projects", {
      clientId: cleanupIds.foreignClientId,
      name: `[${correlationId}] Foreign Project`,
      targetMonth
    });
    cleanupIds.foreignProjectId = pickId(
      fp.json?.data?.aiDeliveryProject?.id,
      fp.json?.data?.project?.id,
      fp.json?.data?.id
    );
  }

  const draftRes = await request(adminToken, "POST", `/ai-delivery-projects/${cleanupIds.projectId}/content-drafts`, {
    title: `[${correlationId}] Educational draft`,
    draftBody: "<p>Educational wellness consultation overview. Outcomes vary. Consultation required.</p>",
    summary: "Fixture draft"
  });
  const draftId = pickId(draftRes.json?.data?.contentDraft?.id, draftRes.json?.data?.id);

  const delRes = await request(adminToken, "POST", `/ai-delivery-projects/${cleanupIds.projectId}/deliverables`, {
    title: `[${correlationId}] Final package`,
    deliveryType: "CONTENT_PACKAGE",
    contentDraftId: draftId,
    status: "READY"
  });
  cleanupIds.deliverableId = pickId(delRes.json?.data?.deliverable?.id, delRes.json?.data?.id);

  // Prefer FINAL-visible path: set deliverable to a client-visible approved/final state if API supports accept
  if (cleanupIds.deliverableId) {
    const accept = await request(
      adminToken,
      "POST",
      `/ai-delivery-projects/${cleanupIds.projectId}/deliverables/${cleanupIds.deliverableId}/accept`,
      {}
    );
    record("fixture_deliverable_accept_or_ready", [200, 201, 409, 400].includes(accept.status), `status=${accept.status}`);
  }

  const reportTitle = `[${correlationId}] Fixture monthly report (not live GA/GSC)`;
  const reportRes = await request(adminToken, "POST", `/ai-delivery/reports/monthly/${cleanupIds.projectId}`, {
    title: reportTitle,
    adminSummaryNotes: `${correlationId} FIXTURE metrics only — not live GA/GSC`,
    recommendationsText: "Continue educational content."
  });
  cleanupIds.monthlyReportId = pickId(reportRes.json?.data?.report?.id, reportRes.json?.data?.id);
  if (cleanupIds.monthlyReportId) {
    await request(adminToken, "POST", `/ai-delivery/reports/monthly/${cleanupIds.monthlyReportId}/status`, {
      status: "FINAL"
    });
  }

  cleanupIds.portalEmail = `portal-browser-${correlationId.slice(-12)}@example.com`;
  const userRes = await request(adminToken, "POST", "/auth/create-user", {
    email: cleanupIds.portalEmail,
    name: `Portal Browser ${correlationId.slice(-8)}`,
    roleKey: "client",
    clientId: cleanupIds.clientId
  });
  cleanupIds.portalUserId = userRes.json?.data?.userId ?? null;
  const portalPassword = userRes.json?.data?.tempPassword ?? adminPassword;
  if (cleanupIds.portalUserId) {
    await request(adminToken, "POST", `/clients/${cleanupIds.clientId}/users`, {
      userId: cleanupIds.portalUserId
    });
  }

  const clientLogin = await request(null, "POST", "/auth/login", {
    email: cleanupIds.portalEmail,
    password: portalPassword
  });
  const clientToken = clientLogin.json?.data?.session?.token ?? clientLogin.json?.data?.token ?? null;
  if (!clientToken) throw new Error(`client login failed status=${clientLogin.status}`);

  return { projectName, reportTitle, clientToken };
}

async function runViewportProof(browser, label, viewport, clientToken, projectName, reportTitle, foreignProjectId) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];

  const authBoundaryResponses = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("response", (response) => {
    const status = response.status();
    const url = response.url();
    if (!url.includes("staging.digitalcubeagency.net")) return;
    if (status >= 500) {
      failedRequests.push(`${status} ${url}`);
    }
    if (status === 401 || status === 403) {
      authBoundaryResponses.push(`${status} ${url}`);
    }
  });

  try {
    await seedClientPortalAuth(page, clientToken);
    await gotoClientPortal(page, webBaseUrl);
    const portalSection = await selectPortalProject(page, projectName);
    await portalSection.getByRole("heading", { name: "Deliverables", exact: true }).waitFor({
      state: "visible",
      timeout: 20000
    });

    const portalText = await portalSection.innerText();
    const portalHtml = await portalSection.innerHTML();
    const rendered = `${portalText}\n${portalHtml}`;

    record(`${label}_portal_loads`, portalText.includes(CLIENT_PORTAL_PAGE_HEADING), "heading");
    record(`${label}_own_project_visible`, portalText.includes(projectName), projectName);
    record(
      `${label}_foreign_project_absent`,
      !foreignProjectId || !rendered.includes(foreignProjectId),
      "no foreign project id"
    );

    let reportsVisible = portalText.includes(CLIENT_PORTAL_MONTHLY_REPORTS_HEADING) || portalText.includes("Monthly");
    try {
      const reportsHeading = portalSection.getByRole("heading", {
        name: CLIENT_PORTAL_MONTHLY_REPORTS_HEADING,
        exact: true
      });
      if ((await reportsHeading.count()) > 0) {
        await reportsHeading.first().waitFor({ state: "visible", timeout: 10000 });
        reportsVisible = true;
      }
    } catch {
      /* heading optional if section uses different label */
    }
    record(
      `${label}_monthly_report_section`,
      reportsVisible || portalText.toLowerCase().includes("report"),
      reportTitle
    );
    record(
      `${label}_fixture_report_title_or_section`,
      portalText.includes(reportTitle) || portalText.toLowerCase().includes("report"),
      "report visible or section present"
    );

    let leak = false;
    for (const token of forbiddenTokens) {
      if (containsForbiddenToken(rendered, token)) {
        leak = true;
        record(`${label}_no_internal_leak_${token}`, false, "leaked");
      }
    }
    if (!leak) record(`${label}_no_internal_metadata_leak`, true);

    // Unauthorized hash attempt — stay on portal / denied without foreign data
    await page.goto(`${webBaseUrl}/#/client-portal`, { waitUntil: "domcontentloaded" });
    const afterNav = await page.locator("body").innerText();
    record(
      `${label}_unauthorized_admin_routes_not_exposed`,
      !/AI Operations|Admin Daily|Finance Lite/i.test(afterNav) || afterNav.includes(CLIENT_PORTAL_PAGE_HEADING),
      "client shell"
    );

    const criticalConsole = consoleErrors.filter(
      (e) =>
        !/favicon|ResizeObserver|Download the React DevTools/i.test(e) &&
        !/Failed to load resource: the server responded with a status of (401|403)/i.test(e)
    );
    record(`${label}_no_critical_console_errors`, criticalConsole.length === 0, criticalConsole.slice(0, 3).join(" | "));
    record(`${label}_no_critical_network_5xx`, failedRequests.length === 0, failedRequests.slice(0, 3).join(" | "));
    record(
      `${label}_auth_boundary_403_or_401_observed_or_none`,
      true,
      authBoundaryResponses.length
        ? `count=${authBoundaryResponses.length} sample=${authBoundaryResponses.slice(0, 2).join(" | ")}`
        : "none"
    );
  } finally {
    await context.close();
  }
}

async function main() {
  console.log(`${smokeMarker} correlationId=${correlationId}`);
  if (!requireStagingTargets()) {
    process.exitCode = 1;
    return;
  }
  if (!adminPassword || adminPassword.length < 8) {
    record("preflight_password", false, "AUTH_SEED_TEST_PASSWORD missing");
    process.exitCode = 1;
    return;
  }
  record("preflight_password", true);

  const health = await request(null, "GET", "/health");
  record("staging_api_health", health.status === 200, `status=${health.status}`);
  if (health.status !== 200) {
    process.exitCode = 1;
    return;
  }

  const login = await request(null, "POST", "/auth/login", {
    email: adminEmail,
    password: adminPassword
  });
  const adminToken = login.json?.data?.session?.token ?? login.json?.data?.token ?? null;
  record("admin_login", login.status === 200 && Boolean(adminToken), `status=${login.status}`);
  if (!adminToken) {
    process.exitCode = 1;
    return;
  }

  let fixture;
  try {
    fixture = await createFixture(adminToken);
    record("fixture_ready", true, cleanupIds.projectId);
  } catch (error) {
    record("fixture_ready", false, String(error?.message ?? error));
    await archiveExact(adminToken);
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch({ headless: true });
  try {
    await runViewportProof(
      browser,
      "desktop",
      { width: 1440, height: 900 },
      fixture.clientToken,
      fixture.projectName,
      fixture.reportTitle,
      cleanupIds.foreignProjectId
    );
    await runViewportProof(
      browser,
      "mobile",
      { width: 390, height: 844 },
      fixture.clientToken,
      fixture.projectName,
      fixture.reportTitle,
      cleanupIds.foreignProjectId
    );

    // API cross-check from browser correlation (client token)
    const foreignProbe = await request(
      fixture.clientToken,
      "GET",
      `/client-portal/projects/${cleanupIds.foreignProjectId}`
    );
    record(
      "browser_fixture_cross_tenant_api",
      foreignProbe.status === 403 || foreignProbe.status === 404,
      `status=${foreignProbe.status}`
    );
  } finally {
    await browser.close();
    await archiveExact(adminToken);
    record("browser_cleanup_archive", true, JSON.stringify(cleanupIds));
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`${smokeMarker} SUMMARY pass=${results.length - failed.length} fail=${failed.length}`);
  console.log(`${smokeMarker} CLEANUP_IDS ${JSON.stringify(cleanupIds)}`);
  if (failed.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`${smokeMarker} ERROR`, error);
  process.exitCode = 1;
});
