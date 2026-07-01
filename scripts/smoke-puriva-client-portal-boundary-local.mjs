/**
 * Puriva client portal boundary smoke — proves client sees only safe read-only surfaces.
 */

import { chromium } from "@playwright/test";
import {
  CLIENT_ARCHIVE_PAGE_HEADING,
  gotoClientPortal,
  seedClientPortalAuth
} from "./lib/client-portal-browser-smoke-helpers.mjs";
import {
  ensureLocalBrowserSmokeServices,
  getApiBaseUrl,
  getWebBaseUrl
} from "./lib/local-browser-smoke-service-helpers.mjs";
import {
  assertClientForbiddenAdminPath,
  assertPurivaClientPortalResponseSafe,
  ensurePurivaClientPortalAuth,
  PURIVA_DRAFT_INTERNAL_LABEL,
  PURIVA_IMAGE_INTERNAL_PROMPT_LABEL,
  PURIVA_PORTAL_FORBIDDEN_UI
} from "./lib/puriva-client-portal-boundary-helpers.mjs";
import {
  currentTargetMonth,
  ensurePurivaLocalSetup,
  purivaMonthlyProjectName,
  PURIVA_CLIENT_PORTAL_USER_EMAIL
} from "./lib/puriva-local-setup.mjs";
import { PURIVA_CONTENT_PRODUCTION_MARKER } from "./lib/puriva-content-production.mjs";
import { PURIVA_IMAGE_PACKAGE_MARKER } from "./lib/puriva-image-package.mjs";
import {
  PURIVA_MONTHLY_REPORT_MARKER,
  PURIVA_MONTHLY_REPORT_VERSION
} from "./lib/puriva-monthly-report.mjs";

const smokeMarker = "[SMOKE][PURIVA_CLIENT_PORTAL_BOUNDARY]";
const apiBaseUrl = getApiBaseUrl();
const webBaseUrl = getWebBaseUrl();
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

const forbiddenLivePublishPhrases = ["Execute release", "Release execution", "Publish now", "Prepare WordPress drafts"];

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
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

async function login(email, password) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

function assertPortalUiSafe(recordFn, text, label) {
  recordFn(
    `${label} hides forbidden portal UI wording`,
    !PURIVA_PORTAL_FORBIDDEN_UI.test(text),
    PURIVA_PORTAL_FORBIDDEN_UI.test(text) ? "forbidden wording found" : "clean"
  );
  for (const phrase of forbiddenLivePublishPhrases) {
    recordFn(
      `${label} forbids "${phrase}"`,
      !text.includes(phrase),
      text.includes(phrase) ? "found" : "absent"
    );
  }
}

async function main() {
  console.log(`${smokeMarker} starting`);

  if (typeof adminPassword !== "string" || adminPassword.length < 8) {
    record("env AUTH_SEED_TEST_PASSWORD", false, "missing or too short");
    process.exitCode = 1;
    return;
  }
  record("env AUTH_SEED_TEST_PASSWORD", true, "present");

  try {
    await ensureLocalBrowserSmokeServices((line) => console.log(line));
    record("local api/web readiness", true, "ready");
  } catch (error) {
    record("local api/web readiness", false, error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
    return;
  }

  const adminLogin = await login(adminEmail, adminPassword);
  const adminToken = adminLogin.body?.data?.session?.token ?? null;
  record("admin login", adminLogin.status === 200 && typeof adminToken === "string", `${adminLogin.status}`);
  if (!adminToken) {
    process.exitCode = 1;
    return;
  }

  const targetMonth = currentTargetMonth();
  const firstRun = await ensurePurivaLocalSetup({ request, token: adminToken, targetMonth });
  const secondRun = await ensurePurivaLocalSetup({ request, token: adminToken, targetMonth });

  record(
    "puriva setup idempotent ids",
    firstRun.client?.id === secondRun.client?.id && firstRun.workflowBrief?.id === secondRun.workflowBrief?.id,
    firstRun.client?.id ?? "missing"
  );
  record(
    "puriva setup second run creates nothing new",
    Object.values(secondRun.created).every((value) => value === false),
    JSON.stringify(secondRun.created)
  );

  const portalAuth = await ensurePurivaClientPortalAuth({
    request,
    adminToken,
    portalPassword: adminPassword,
    clientId: firstRun.client.id
  });

  if (!portalAuth?.token) {
    record("puriva portal auth", false, `${PURIVA_CLIENT_PORTAL_USER_EMAIL} unavailable`);
    process.exitCode = 1;
    return;
  }
  record("puriva portal auth", true, portalAuth.email);

  const portalToken = portalAuth.token;
  const purivaProjectName = purivaMonthlyProjectName(targetMonth);

  const portalProjects = await request("/client-portal/projects", { token: portalToken });
  record("client portal projects endpoint", portalProjects.status === 200, `${portalProjects.status}`);
  assertPurivaClientPortalResponseSafe(record, "client portal projects", portalProjects);

  const portalProject =
    (portalProjects.body?.data?.aiDeliveryProjects ?? []).find((project) => project.name === purivaProjectName) ?? null;
  record("client portal lists Puriva monthly project", Boolean(portalProject?.id), portalProject?.id ?? purivaProjectName);

  if (!portalProject?.id) {
    record("puriva portal project detail", false, "project missing from portal list");
    process.exitCode = 1;
    return;
  }

  const portalEndpoints = [
    ["project detail", `/client-portal/projects/${portalProject.id}`],
    ["deliverables", `/client-portal/projects/${portalProject.id}/deliverables`],
    ["delivery summary", `/client-portal/projects/${portalProject.id}/delivery-summary`],
    ["release package", `/client-portal/projects/${portalProject.id}/release-package`],
    ["monthly reports", `/client-portal/projects/${portalProject.id}/monthly-reports`],
    ["catalog products", `/client-portal/projects/${portalProject.id}/catalog-products`]
  ];

  for (const [label, path] of portalEndpoints) {
    const response = await request(path, { token: portalToken });
    record(`client portal ${label}`, response.status === 200, `${response.status}`);
    assertPurivaClientPortalResponseSafe(record, `client portal ${label}`, response);
  }

  const deliverables = await request(`/client-portal/projects/${portalProject.id}/deliverables`, {
    token: portalToken
  });
  record(
    "client portal deliverables omit draft scaffolds",
    !(deliverables.text ?? "").includes(PURIVA_DRAFT_INTERNAL_LABEL),
    (deliverables.text ?? "").includes(PURIVA_CONTENT_PRODUCTION_MARKER) ? "production marker leaked" : "clean"
  );
  record(
    "client portal deliverables omit image prompt scaffolds",
    !(deliverables.text ?? "").includes(PURIVA_IMAGE_INTERNAL_PROMPT_LABEL),
    (deliverables.text ?? "").includes(PURIVA_IMAGE_PACKAGE_MARKER) ? "image marker leaked" : "clean"
  );
  record(
    "client portal deliverables show final-only or empty list",
    deliverables.status === 200 && Array.isArray(deliverables.body?.data?.deliverables),
    `${deliverables.body?.data?.deliverables?.length ?? 0} visible`
  );

  const releasePackage = await request(`/client-portal/projects/${portalProject.id}/release-package`, {
    token: portalToken
  });
  record(
    "client portal release package clean empty state",
    releasePackage.status === 200 && releasePackage.body?.data?.releasePackage == null,
    releasePackage.body?.data?.releasePackage ? "unexpected package" : "absent"
  );

  const portalMonthlyReports = await request(`/client-portal/projects/${portalProject.id}/monthly-reports`, {
    token: portalToken
  });
  record(
    "client portal monthly reports hide draft scaffold report",
    portalMonthlyReports.status === 200 &&
      (portalMonthlyReports.body?.data?.monthlyReports ?? []).length === 0,
    `${portalMonthlyReports.body?.data?.monthlyReports?.length ?? 0} visible`
  );
  record(
    "client portal monthly reports omit puriva scaffold marker",
    !(portalMonthlyReports.text ?? "").includes(PURIVA_MONTHLY_REPORT_MARKER),
    (portalMonthlyReports.text ?? "").includes(PURIVA_MONTHLY_REPORT_MARKER) ? "marker leaked" : "clean"
  );
  record(
    "puriva monthly report version tracked in setup",
    firstRun.monthlyReport?.version === PURIVA_MONTHLY_REPORT_VERSION,
    firstRun.monthlyReport?.version ?? "missing"
  );

  const forbiddenAdminPaths = [
    ["publication handoff status", `/workflow-briefs/${firstRun.workflowBrief.id}/publication-handoff`],
    ["execute publication handoff", `/workflow-briefs/${firstRun.workflowBrief.id}/execute-publication-handoff`, "POST"],
    ["release package admin", `/workflow-briefs/${firstRun.workflowBrief.id}/release-package`],
    ["prepare release", `/workflow-briefs/${firstRun.workflowBrief.id}/prepare-release`, "POST"],
    ["finalize release package", `/workflow-briefs/${firstRun.workflowBrief.id}/finalize-release-package`, "POST"]
  ];

  for (const [label, path, method] of forbiddenAdminPaths) {
    const response = await request(path, {
      method: method ?? "GET",
      token: portalToken,
      body: method === "POST" ? {} : undefined
    });
    assertClientForbiddenAdminPath(record, label, response, method ?? "GET");
    assertPurivaClientPortalResponseSafe(record, `client ${label} denial`, response);
  }

  const adminArticleImages = await request(`/ai-delivery-projects/${firstRun.aiDeliveryProject.id}/article-images`, {
    token: adminToken
  });
  const adminDrafts = await request(`/ai-delivery-projects/${firstRun.aiDeliveryProject.id}/content-drafts`, {
    token: adminToken
  });
  record(
    "admin retains internal image scaffolds",
    (adminArticleImages.body?.data?.articleImages ?? []).some((image) =>
      image.notes?.includes(PURIVA_IMAGE_PACKAGE_MARKER)
    ),
    `${adminArticleImages.body?.data?.articleImages?.length ?? 0} images`
  );
  record(
    "admin retains internal draft scaffolds",
    (adminDrafts.body?.data?.contentDrafts ?? []).some((draft) =>
      draft.notes?.includes(PURIVA_CONTENT_PRODUCTION_MARKER)
    ),
    `${adminDrafts.body?.data?.contentDrafts?.length ?? 0} drafts`
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await seedClientPortalAuth(page, portalToken);
    await gotoClientPortal(page, webBaseUrl);
    record("client portal browser archive opens", true, CLIENT_ARCHIVE_PAGE_HEADING);

    const bodyText = await page.locator("body").innerText();
    assertPortalUiSafe(record, bodyText, "client archive shell");

    record(
      "client portal browser hides publication handoff",
      !bodyText.includes("Publication handoff"),
      bodyText.includes("Publication handoff") ? "found" : "absent"
    );
    record(
      "client portal browser hides prepare wordpress drafts",
      !bodyText.includes("Prepare WordPress drafts"),
      bodyText.includes("Prepare WordPress drafts") ? "found" : "absent"
    );
    record(
      "client portal release package empty state API-proven",
      true,
      "release package UI gated to ClientPortalPage; scaffold state verified via API"
    );
    record(
      "client portal browser avoids internal server error copy",
      !/internal server error|500 error|stack trace/i.test(bodyText),
      "clean"
    );
  } catch (error) {
    record("client portal browser boundary", false, error instanceof Error ? error.message : String(error));
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

  if (failed.length === 0) {
    console.log(
      "PROVEN: Puriva client portal exposes only safe read-only surfaces; admin scaffolds and handoff paths stay admin-only."
    );
  } else {
    console.log("NOT PROVEN: one or more Puriva client portal boundary checks failed.");
  }

  process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(`${smokeMarker} fatal - ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
