import { chromium } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CLIENT_PORTAL_DELIVERY_SUMMARY_HEADING,
  gotoClientPortal,
  seedClientPortalAuth,
  clientPortalSection
} from "./lib/client-portal-browser-smoke-helpers.mjs";
import { seedPurivaDeliverySummaryFixture } from "./lib/puriva-delivery-summary-fixture.mjs";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

const forbiddenTokens = ["storageKey", "workflowRunId", "executionLog", "tenantId", "prompt", "sourceNote", "audienceSignals"];

const results = [];
const artifactStamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const screenshotPath = join(tmpdir(), `smoke-client-portal-populated-delivery-browser-${artifactStamp}.png`);
const domTextPath = join(tmpdir(), `smoke-client-portal-populated-delivery-browser-${artifactStamp}.txt`);

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

function containsForbiddenToken(text, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i");
  return pattern.test(text);
}

async function capturePortalProof(page, portalSection, projectName) {
  const portalSectionCount = await portalSection.count();
  const bodyText = await page.locator("body").innerText();
  const detailColumn = page.locator(".portal-detail-column");
  const detailText = (await detailColumn.count()) > 0 ? await detailColumn.innerText() : "";
  const sectionText = portalSectionCount > 0 ? await portalSection.innerText() : "";

  record("populated smoke selected project visible in body", bodyText.includes(projectName), projectName);
  record("populated smoke delivery summary heading visible anywhere", bodyText.includes(CLIENT_PORTAL_DELIVERY_SUMMARY_HEADING), CLIENT_PORTAL_DELIVERY_SUMMARY_HEADING);
  record("populated smoke client portal section wrapper is present", portalSectionCount === 1, `count=${portalSectionCount}`);
  record(
    "populated smoke current populated overview copy visible",
    detailText.includes(projectName) &&
      detailText.includes("Work completed") &&
      detailText.includes("Market insights") &&
      detailText.includes("Next steps:") &&
      detailText.includes("Website handoff") &&
      detailText.includes("Final file links"),
    "Work completed / Market insights / Next steps / Website handoff / Final file links"
  );

  await writeFile(domTextPath, `BODY TEXT\n${bodyText}\n\nDETAIL COLUMN TEXT\n${detailText}\n`, "utf8");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`DOM_TEXT_PATH=${domTextPath}`);
  console.log(`SCREENSHOT_PATH=${screenshotPath}`);

  return detailText;
}

async function createPopulatedFixture(adminToken, adminUserId) {
  const projectName = `[SMOKE][CLIENT_PORTAL_POPULATED] ${makeSmokeId("project")}`;

  const client = requireOkData(
    "populated smoke create client",
    await request("/clients", {
      method: "POST",
      token: adminToken,
      body: { name: `[SMOKE][CLIENT_PORTAL_POPULATED] ${makeSmokeId("client")}`, country: "United States" }
    })
  ).client;

  const project = requireOkData(
    "populated smoke create ai delivery project",
    await request("/ai-delivery-projects", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: client.id,
        name: projectName,
        targetMonth: "2027-05"
      }
    })
  ).aiDeliveryProject;

  requireOkData(
    "populated smoke link client access",
    await request(`/clients/${client.id}/users`, {
      method: "POST",
      token: adminToken,
      body: { userId: adminUserId }
    })
  );

  const draft = requireOkData(
    "populated smoke create content draft",
    await request(`/ai-delivery-projects/${project.id}/content-drafts`, {
      method: "POST",
      token: adminToken,
      body: {
        title: `[SMOKE][CLIENT_PORTAL_POPULATED] ${makeSmokeId("draft")}`,
        draftBody: "Populated delivery overview browser proof.",
        status: "DRAFT"
      }
    })
  ).contentDraft;

  const image = requireOkData(
    "populated smoke create article image",
    await request(`/ai-delivery-projects/${project.id}/article-images`, {
      method: "POST",
      token: adminToken,
      body: {
        contentDraftId: draft.id,
        title: `[SMOKE][CLIENT_PORTAL_POPULATED] ${makeSmokeId("image")}`,
        prompt: "Populated delivery image prompt.",
        status: "APPROVED"
      }
    })
  ).articleImage;

  requireOkData(
    "populated smoke create DELIVERED deliverable",
    await request(`/ai-delivery-projects/${project.id}/deliverables`, {
      method: "POST",
      token: adminToken,
      body: {
        title: `[SMOKE][CLIENT_PORTAL_POPULATED] ${makeSmokeId("final")}`,
        deliveryType: "CONTENT_PACKAGE",
        status: "DELIVERED",
        articleImageId: image.id
      }
    })
  );

  const deliveryHints = await seedPurivaDeliverySummaryFixture({
    request,
    requireOkData,
    record,
    makeSmokeId,
    adminToken,
    client,
    aiProject: project,
    labelPrefix: "[SMOKE][CLIENT_PORTAL_POPULATED]"
  });

  const deliverySummary = await request(`/client-portal/projects/${project.id}/delivery-summary`, { token: adminToken });
  const summary = deliverySummary.body?.data?.deliverySummary ?? null;
  record(
    "populated smoke delivery summary API is populated",
    deliverySummary.status === 200 &&
      typeof summary?.marketIntelligence?.marketSummary === "string" &&
      summary.marketIntelligence.marketSummary.length > 0 &&
      Array.isArray(summary?.googleDocsExports) &&
      summary.googleDocsExports.length > 0 &&
      summary?.websitePublishing,
    "populated summary shape"
  );

  return { project, projectName, deliveryHints };
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

  const fixture = await createPopulatedFixture(adminToken, adminUserId);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await seedClientPortalAuth(page, adminToken);
    await gotoClientPortal(page, webBaseUrl);

    const portalSection = clientPortalSection(page);
    const projectCard = portalSection.locator(".cf-project-list .cf-project-item", { hasText: fixture.projectName }).first();
    await projectCard.waitFor({ state: "visible", timeout: 20000 });
    const selectedBeforeClick = ((await projectCard.getAttribute("class")) ?? "").includes("is-selected");
    if (!selectedBeforeClick) {
      await projectCard.click();
    }
    const selectedProjectCard = portalSection.locator(".cf-project-list .cf-project-item.is-selected", {
      hasText: fixture.projectName
    }).first();
    const detailColumn = page.locator(".portal-detail-column");

    try {
      await selectedProjectCard.waitFor({ state: "visible", timeout: 15000 });
      record("populated smoke project selected in portal sidebar", true, fixture.projectName);

      await page.waitForFunction(
        ({ projectName }) => {
          const detailColumn = document.querySelector(".portal-detail-column");
          const detailText = detailColumn?.innerText ?? "";
          return detailText.includes(projectName) &&
            detailText.includes("Work completed") &&
            detailText.includes("Market insights") &&
            detailText.includes("Website handoff") &&
            !detailText.includes("Loading project archive") &&
            !detailText.includes("Loading delivery summary");
        },
        { projectName: fixture.projectName },
        { timeout: 30000 }
      );
      record("populated smoke selected project detail rendered", true, fixture.projectName);
    } catch (error) {
      record(
        "populated smoke selected project detail rendered",
        false,
        error instanceof Error ? error.message : "selection/detail wait failed"
      );
      const selectedClass = (await selectedProjectCard.getAttribute("class").catch(() => null)) ?? "missing";
      const detailText = (await detailColumn.count()) > 0 ? await detailColumn.innerText().catch(() => "") : "";
      await writeFile(
        domTextPath,
        [
          `PROJECT_NAME\n${fixture.projectName}`,
          `SELECTED_CARD_CLASS\n${selectedClass}`,
          `DETAIL_COLUMN_TEXT\n${detailText}`,
          `BODY TEXT\n${await page.locator("body").innerText().catch(() => "")}`
        ].join("\n\n"),
        "utf8"
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`DOM_TEXT_PATH=${domTextPath}`);
      console.log(`SCREENSHOT_PATH=${screenshotPath}`);
      throw error;
    }
    const overviewText = await capturePortalProof(page, portalSection, fixture.projectName);
    const overviewHtml = await portalSection.innerHTML();
    const renderedOverview = `${overviewText}\n${overviewHtml}`;

    record(
      "populated delivery summary section renders",
      overviewText.includes(CLIENT_PORTAL_DELIVERY_SUMMARY_HEADING) && overviewText.includes("Work completed"),
      "summary visible"
    );
    record(
      "populated delivery overview shows market intelligence summary",
      typeof fixture.deliveryHints.marketSummary === "string" &&
        fixture.deliveryHints.marketSummary.length > 0 &&
        overviewText.includes(fixture.deliveryHints.marketSummary.slice(0, 32)),
      "client-safe summary visible"
    );
    record(
      "populated delivery overview shows recommended actions",
      overviewText.includes("Next steps:"),
      "recommended actions visible"
    );
    record(
      "populated delivery summary shows google docs export link",
      overviewText.includes("Open final file"),
      fixture.deliveryHints.googleExportUrl ?? "link"
    );
    record(
      "populated delivery summary shows website publishing status",
      overviewText.includes("Website handoff") &&
        (overviewText.includes("PROVIDER_DISABLED") || overviewText.includes("smoke-puriva.example.com")),
      fixture.deliveryHints.publishingStatus ?? "status"
    );

    const forbiddenHits = forbiddenTokens.filter((token) => containsForbiddenToken(renderedOverview, token));
    record(
      "populated delivery overview hides forbidden internal fields",
      forbiddenHits.length === 0,
      forbiddenHits.length ? forbiddenHits.join(", ") : "none"
    );

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Client Portal renders populated Puriva delivery overview after handoff seed.");
      console.log("PROVEN: Populated overview shows MI summary, Google Docs link, and publishing handoff without internal fields.");
    } else {
      console.log("NOT PROVEN: one or more populated delivery overview browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL populated delivery browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
