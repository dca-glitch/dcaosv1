import { chromium } from "@playwright/test";
import { seedPurivaDeliverySummaryFixture } from "./lib/puriva-delivery-summary-fixture.mjs";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

const forbiddenTokens = [
  "storageKey",
  "workflowRunId",
  "executionLog",
  "executionError",
  "tenantId",
  "prompt",
  "reviewNotes",
  "reviewerName",
  "draftBody",
  "sourceNote",
  "audienceSignals"
];

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

async function createFixture(adminToken, adminUserId) {
  const clientName = `[SMOKE][CLIENT_PORTAL_BROWSER] ${makeSmokeId("client")}`;
  const projectName = `[SMOKE][CLIENT_PORTAL_BROWSER] ${makeSmokeId("project")}`;
  const draftTitle = `[SMOKE][CLIENT_PORTAL_BROWSER] ${makeSmokeId("draft")}`;
  const articleImageTitle = `[SMOKE][CLIENT_PORTAL_BROWSER] ${makeSmokeId("image")}`;
  const finalDeliverableTitle = `[SMOKE][CLIENT_PORTAL_BROWSER] ${makeSmokeId("final")}`;
  const draftDeliverableTitle = `[SMOKE][CLIENT_PORTAL_BROWSER] ${makeSmokeId("draft-deliverable")}`;

  const createdClient = await request("/clients", {
    method: "POST",
    token: adminToken,
    body: { name: clientName, country: "United States" }
  });
  record("browser smoke create client", createdClient.status === 201 && createdClient.body?.ok === true, `${createdClient.status}`);
  if (createdClient.status !== 201 || createdClient.body?.ok !== true) {
    throw new Error("Client creation failed.");
  }

  const client = createdClient.body.data.client;
  const createdProject = await request("/ai-delivery-projects", {
    method: "POST",
    token: adminToken,
    body: {
      clientId: client.id,
      name: projectName,
      targetMonth: "2026-07"
    }
  });
  record(
    "browser smoke create ai delivery project",
    createdProject.status === 201 && createdProject.body?.ok === true,
    `${createdProject.status}`
  );
  if (createdProject.status !== 201 || createdProject.body?.ok !== true) {
    throw new Error("Project creation failed.");
  }

  const project = createdProject.body.data.aiDeliveryProject;
  const linkAccess = await request(`/clients/${client.id}/users`, {
    method: "POST",
    token: adminToken,
    body: { userId: adminUserId }
  });
  record("browser smoke link client access", linkAccess.status === 201 && linkAccess.body?.ok === true, `${linkAccess.status}`);
  if (linkAccess.status !== 201 || linkAccess.body?.ok !== true) {
    throw new Error("Client access link failed.");
  }

  const createdDraft = await request(`/ai-delivery-projects/${project.id}/content-drafts`, {
    method: "POST",
    token: adminToken,
    body: {
      title: draftTitle,
      draftBody: "Client portal browser proof fixture draft body.",
      status: "DRAFT"
    }
  });
  record(
    "browser smoke create content draft",
    createdDraft.status === 201 && createdDraft.body?.ok === true,
    `${createdDraft.status}`
  );
  if (createdDraft.status !== 201 || createdDraft.body?.ok !== true) {
    throw new Error("Content draft creation failed.");
  }

  const contentDraft = createdDraft.body.data.contentDraft;

  const createdArticleImage = await request(`/ai-delivery-projects/${project.id}/article-images`, {
    method: "POST",
    token: adminToken,
    body: {
      contentDraftId: contentDraft.id,
      title: articleImageTitle,
      prompt: "Browser proof article image prompt.",
      status: "APPROVED",
      notes: "Browser proof image fixture."
    }
  });
  record(
    "browser smoke create article image",
    createdArticleImage.status === 201 && createdArticleImage.body?.ok === true,
    `${createdArticleImage.status}`
  );
  if (createdArticleImage.status !== 201 || createdArticleImage.body?.ok !== true) {
    throw new Error("Article image creation failed.");
  }

  const articleImage = createdArticleImage.body.data.articleImage;

  const finalDeliverable = await request(`/ai-delivery-projects/${project.id}/deliverables`, {
    method: "POST",
    token: adminToken,
    body: {
      title: finalDeliverableTitle,
      deliveryType: "CONTENT_PACKAGE",
      status: "DELIVERED",
      articleImageId: articleImage.id
    }
  });
  record(
    "browser smoke create DELIVERED deliverable",
    finalDeliverable.status === 201 && finalDeliverable.body?.ok === true,
    `${finalDeliverable.status}`
  );
  if (finalDeliverable.status !== 201 || finalDeliverable.body?.ok !== true) {
    throw new Error("Final deliverable creation failed.");
  }

  const draftDeliverable = await request(`/ai-delivery-projects/${project.id}/deliverables`, {
    method: "POST",
    token: adminToken,
    body: {
      title: draftDeliverableTitle,
      deliveryType: "CONTENT_PACKAGE",
      status: "DRAFT"
    }
  });
  record(
    "browser smoke create DRAFT deliverable",
    draftDeliverable.status === 201 && draftDeliverable.body?.ok === true,
    `${draftDeliverable.status}`
  );
  if (draftDeliverable.status !== 201 || draftDeliverable.body?.ok !== true) {
    throw new Error("Draft deliverable creation failed.");
  }

  const deliveryHints = await seedPurivaDeliverySummaryFixture({
    request,
    requireOkData,
    record,
    makeSmokeId,
    adminToken,
    client,
    aiProject: project,
    labelPrefix: "[SMOKE][CLIENT_PORTAL_BROWSER]"
  });

  const catalogProductName = `[SMOKE][CLIENT_PORTAL_BROWSER] ${makeSmokeId("catalog")}`;
  const catalogProduct = requireOkData(
    "browser smoke create catalog product",
    await request(`/clients/${client.id}/catalog-products`, {
      method: "POST",
      token: adminToken,
      body: {
        name: catalogProductName,
        description: "Browser proof catalog product for inquiry-only flow.",
        priceLabel: "Rp 1",
        isVisibleInPortal: true
      }
    })
  ).catalogProduct;

  return {
    client,
    project,
    contentDraft,
    articleImage,
    finalDeliverable: finalDeliverable.body.data.deliverable,
    draftDeliverable: draftDeliverable.body.data.deliverable,
    deliveryHints,
    catalogProduct,
    catalogProductName
  };
}

async function main() {
  const passwordOk = requireEnv("AUTH_SEED_TEST_PASSWORD", adminPassword);
  if (!passwordOk) {
    console.error("STOP: AUTH_SEED_TEST_PASSWORD is required.");
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
  record("admin user id present", typeof adminUserId === "string" && adminUserId.length > 0, adminUserId ? "present" : "missing");
  if (!adminToken || !adminUserId) {
    console.error("STOP: Admin login failed.");
    process.exitCode = 1;
    return;
  }

  const fixture = await createFixture(adminToken, adminUserId);

  const portalProjectsResponse = await request("/client-portal/projects", { token: adminToken });
  const portalProjectList = portalProjectsResponse.body?.data?.aiDeliveryProjects ?? [];
  const portalProjectEntry = portalProjectList.find((entry) => entry.id === fixture.project.id);
  record(
    "portal API lists fixture project",
    portalProjectsResponse.status === 200 &&
      portalProjectsResponse.body?.ok === true &&
      typeof portalProjectEntry?.id === "string",
    portalProjectEntry?.id ?? `${portalProjectsResponse.status}`
  );
  if (!portalProjectEntry) {
    console.error("STOP: Fixture project missing from /client-portal/projects before browser proof.");
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    const projectsResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/client-portal/projects") &&
        response.request().method() === "GET" &&
        response.status() === 200,
      { timeout: 30000 }
    );

    await page.goto(`${webBaseUrl}/#/client-portal`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Client Portal" }).waitFor({ state: "visible", timeout: 15000 });
    await projectsResponsePromise;

    const portalSection = page.locator('section[aria-labelledby="client-portal-title"]');
    const projectSidebar = portalSection.locator("aside");
    const projectCard = projectSidebar.locator("article.entity-card", { hasText: fixture.project.name }).first();
    await projectCard.scrollIntoViewIfNeeded();
    await projectCard.waitFor({ state: "visible", timeout: 30000 });
    const openProjectButton = projectCard.getByRole("button", { name: /^(Open project|View|Open)$/ });
    await openProjectButton.click();
    await portalSection.getByRole("heading", { name: "Final deliverables", exact: true }).waitFor({ state: "visible", timeout: 15000 });

    const portalText = await portalSection.innerText();
    const portalHtml = await portalSection.innerHTML();
    const renderedPortal = `${portalText}\n${portalHtml}`;

    record("client portal page loads", portalText.includes("Client Portal"), "heading visible");
    record(
      "authenticated session renders archive UI",
      portalText.includes(fixture.project.name) && portalText.includes("Archive"),
      fixture.project.name
    );
    record(
      "project archive area renders",
      portalText.includes("Selected project") && portalText.includes("Project details"),
      "selected project details visible"
    );
    record(
      "deliverables section renders final state",
      portalText.includes("Final deliverables") && portalText.includes(fixture.finalDeliverable.title) && !portalText.includes(fixture.draftDeliverable.title),
      fixture.finalDeliverable.title
    );

    record(
      "delivery overview section renders",
      portalText.includes("Delivery overview") && portalText.includes("AI SEO / content plan"),
      "MVP delivery overview visible"
    );
    record(
      "delivery overview shows market intelligence summary",
      typeof fixture.deliveryHints.marketSummary === "string" &&
        fixture.deliveryHints.marketSummary.length > 0 &&
        portalText.includes(fixture.deliveryHints.marketSummary.slice(0, 32)),
      fixture.deliveryHints.marketSummary ? "client-safe summary visible" : "missing summary"
    );
    record(
      "delivery overview shows recommended actions",
      portalText.includes("Recommended actions"),
      "recommended actions visible"
    );
    record(
      "delivery overview shows google docs export link",
      portalText.includes("Open Google Doc"),
      fixture.deliveryHints.googleExportUrl ?? "link"
    );
    record(
      "delivery overview shows website publishing handoff",
      portalText.includes("Website publishing handoff") &&
        (portalText.includes("PROVIDER_DISABLED") || portalText.includes("smoke-puriva.example.com")),
      fixture.deliveryHints.publishingStatus ?? "status"
    );

    await portalSection.getByRole("heading", { name: "Product catalog inquiry", exact: true }).waitFor({
      state: "visible",
      timeout: 15000
    });
    await portalSection.getByRole("heading", { name: fixture.catalogProductName, exact: true }).waitFor({
      state: "visible",
      timeout: 15000
    });

    const catalogPortalText = await portalSection.innerText();
    record(
      "product catalog inquiry section renders",
      catalogPortalText.includes("Product catalog inquiry") && catalogPortalText.includes(fixture.catalogProductName),
      fixture.catalogProductName
    );
    record(
      "product catalog shows inquiry-only disclaimer",
      catalogPortalText.includes("No cart, checkout, or payment"),
      "inquiry-only copy visible"
    );

    const inquiryMessage = `Browser smoke catalog inquiry ${makeSmokeId("msg")}`;
    await portalSection.getByLabel("Your name").fill("Browser Smoke Client");
    await portalSection.getByLabel("Email").fill("browser-smoke-catalog@example.com");
    await portalSection.getByLabel("Product (optional)").selectOption({ label: fixture.catalogProductName });
    await portalSection.getByLabel("Message").fill(inquiryMessage);

    const inquiryResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/client-portal/projects/${fixture.project.id}/catalog-inquiries`) &&
        response.request().method() === "POST"
    );
    await portalSection.getByRole("button", { name: "Send product inquiry" }).click();

    const inquiryResponse = await inquiryResponsePromise;
    const inquiryJson = await inquiryResponse.json();
    record(
      "catalog inquiry POST succeeds",
      inquiryResponse.status() === 201 && inquiryJson?.ok === true,
      `${inquiryResponse.status()}`
    );
    record(
      "catalog inquiry response includes inquiry id",
      typeof inquiryJson?.data?.catalogInquiry?.id === "string",
      inquiryJson?.data?.catalogInquiry?.id ?? "missing"
    );

    await portalSection
      .getByText("Inquiry submitted. Your team will follow up directly — no checkout or payment in this portal.")
      .waitFor({ state: "visible", timeout: 10000 });
    record("catalog inquiry success notice visible", true, "client-safe confirmation shown");

    const adminInquiries = await request(`/clients/${fixture.client.id}/catalog-inquiries`, { token: adminToken });
    const adminInquiryList = adminInquiries.body?.data?.catalogInquiries ?? [];
    record(
      "admin catalog inquiries include browser submission",
      adminInquiries.status === 200 &&
        adminInquiryList.some(
          (entry) => entry.message === inquiryMessage && entry.productName === fixture.catalogProductName
        ),
      inquiryMessage
    );

    const forbiddenHits = forbiddenTokens.filter((token) => containsForbiddenToken(renderedPortal, token));
    record(
      "forbidden internal fields absent from page body/html",
      forbiddenHits.length === 0,
      forbiddenHits.length ? forbiddenHits.join(", ") : "none"
    );

    record("browser console/page errors absent", consoleErrors.length === 0, consoleErrors.length ? consoleErrors.join(" | ") : "none");

    const downloadResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes(`/client-portal/projects/${fixture.project.id}/deliverables/${fixture.finalDeliverable.id}/download`) &&
        response.request().method() === "GET"
    );

    const finalDeliverableCard = page.locator("article.entity-card", { hasText: fixture.finalDeliverable.title }).first();
    await finalDeliverableCard.getByRole("button", { name: "Download" }).click();

    const downloadResponse = await downloadResponsePromise;
    const downloadJson = await downloadResponse.json();
    const downloadText = JSON.stringify(downloadJson);

    record(
      "safe download endpoint called",
      downloadResponse.status() === 200 && downloadResponse.url().includes("/download"),
      downloadResponse.url()
    );
    record(
      "download response hides storageKey",
      !downloadText.includes("storageKey"),
      downloadText.includes("storageKey") ? "storageKey leaked" : "storageKey absent"
    );
    record(
      "download action returned safe reference shape",
      downloadJson?.ok === true && Object.prototype.hasOwnProperty.call(downloadJson?.data ?? {}, "downloadReference"),
      downloadJson?.data?.downloadReference ? "downloadReference present" : "downloadReference null"
    );

    if (!downloadJson?.data?.downloadReference) {
      await page.getByText("Download not available yet.").waitFor({ state: "visible", timeout: 10000 });
      record("download notice shown for missing storage key", true, "downloadReference null");
    }

    const finalPortalRendered = `${await portalSection.innerText()}\n${await portalSection.innerHTML()}`;
    const finalForbiddenHits = forbiddenTokens.filter((token) => containsForbiddenToken(finalPortalRendered, token));
    record(
      "forbidden fields still absent after download",
      finalForbiddenHits.length === 0,
      finalForbiddenHits.length ? finalForbiddenHits.join(", ") : "none"
    );

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: authenticated client portal archive page loaded and selected project detail rendered without crashing.");
      console.log("PROVEN: final deliverables rendered with the DRAFT fixture hidden and only the final archive item visible.");
      console.log("PROVEN: delivery overview section rendered populated Puriva path (MI summary, Google Docs, publishing status).");
      console.log("PROVEN: product catalog inquiry form submitted in browser and persisted for admin review.");
      console.log("PROVEN: page body/HTML omitted storageKey and the other forbidden internal fields.");
      console.log("PROVEN: download action called the safe client-portal download endpoint and did not expose storageKey.");
    } else {
      console.log("NOT PROVEN: one or more client portal browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL client portal browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
