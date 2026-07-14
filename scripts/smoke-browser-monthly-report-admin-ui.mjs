import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

const forbiddenTokens = [
  "storageKey",
  "tenantId",
  "workflowRunId",
  "executionLog",
  "executionError",
  "prompt",
  "styleNotes",
  "provider",
  "cost"
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

function makeSmokeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function containsForbiddenToken(text, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i");
  return pattern.test(text);
}

async function waitForReportStatusBadge(modalPanel, label) {
  await modalPanel.locator(".ds-badge", { hasText: label }).first().waitFor({ state: "visible", timeout: 15000 });
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
  return { status: response.status, body };
}

async function login(email, password) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

async function createFixture(token) {
  const clientName = `[SMOKE][MONTHLY_REPORT_UI] ${makeSmokeId("client")}`;
  const projectNamePrimary = `[SMOKE][MONTHLY_REPORT_UI] ${makeSmokeId("project-a")}`;
  const projectNameSecondary = `[SMOKE][MONTHLY_REPORT_UI] ${makeSmokeId("project-b")}`;

  const clientResponse = await request("/clients", {
    method: "POST",
    token,
    body: { name: clientName, country: "United States" }
  });
  record("create smoke client", clientResponse.status === 201 && clientResponse.body?.ok === true, `${clientResponse.status}`);
  if (clientResponse.status !== 201 || clientResponse.body?.ok !== true) {
    throw new Error("Fixture setup failed at client creation.");
  }

  const client = clientResponse.body.data.client;
  const primaryProjectResponse = await request("/ai-delivery-projects", {
    method: "POST",
    token,
    body: {
      clientId: client.id,
      name: projectNamePrimary,
      targetMonth: "2026-07"
    }
  });
  record(
    "create primary ai-delivery project",
    primaryProjectResponse.status === 201 && primaryProjectResponse.body?.ok === true,
    `${primaryProjectResponse.status}`
  );
  if (primaryProjectResponse.status !== 201 || primaryProjectResponse.body?.ok !== true) {
    throw new Error("Fixture setup failed at primary project creation.");
  }

  const secondaryProjectResponse = await request("/ai-delivery-projects", {
    method: "POST",
    token,
    body: {
      clientId: client.id,
      name: projectNameSecondary,
      targetMonth: "2026-08"
    }
  });
  record(
    "create secondary ai-delivery project",
    secondaryProjectResponse.status === 201 && secondaryProjectResponse.body?.ok === true,
    `${secondaryProjectResponse.status}`
  );
  if (secondaryProjectResponse.status !== 201 || secondaryProjectResponse.body?.ok !== true) {
    throw new Error("Fixture setup failed at secondary project creation.");
  }

  // Create one final deliverable path for computed summary visibility.
  const draftResponse = await request(`/ai-delivery-projects/${primaryProjectResponse.body.data.aiDeliveryProject.id}/content-drafts`, {
    method: "POST",
    token,
    body: {
      title: `[SMOKE][MONTHLY_REPORT_UI] ${makeSmokeId("draft")}`,
      draftBody: "Monthly report browser smoke draft body.",
      status: "DRAFT"
    }
  });
  record("create primary draft", draftResponse.status === 201 && draftResponse.body?.ok === true, `${draftResponse.status}`);
  if (draftResponse.status !== 201 || draftResponse.body?.ok !== true) {
    throw new Error("Fixture setup failed at content draft creation.");
  }

  const imageResponse = await request(`/ai-delivery-projects/${primaryProjectResponse.body.data.aiDeliveryProject.id}/article-images`, {
    method: "POST",
    token,
    body: {
      contentDraftId: draftResponse.body.data.contentDraft.id,
      title: `[SMOKE][MONTHLY_REPORT_UI] ${makeSmokeId("image")}`,
      prompt: "Monthly report browser smoke image prompt.",
      status: "APPROVED"
    }
  });
  record("create primary approved image", imageResponse.status === 201 && imageResponse.body?.ok === true, `${imageResponse.status}`);
  if (imageResponse.status !== 201 || imageResponse.body?.ok !== true) {
    throw new Error("Fixture setup failed at article image creation.");
  }

  const primaryProjectId = primaryProjectResponse.body.data.aiDeliveryProject.id;
  const draftDeliverableResponse = await request(`/ai-delivery-projects/${primaryProjectId}/deliverables`, {
    method: "POST",
    token,
    body: {
      title: `[SMOKE][MONTHLY_REPORT_UI] ${makeSmokeId("deliverable-final")}`,
      deliveryType: "CONTENT_PACKAGE",
      status: "DRAFT",
      articleImageId: imageResponse.body.data.articleImage.id,
      exportUrl: "https://docs.example.com/monthly-report-smoke"
    }
  });
  record(
    "create primary DRAFT deliverable",
    draftDeliverableResponse.status === 201 &&
      draftDeliverableResponse.body?.ok === true &&
      draftDeliverableResponse.body?.data?.deliverable?.status === "DRAFT" &&
      typeof draftDeliverableResponse.body?.data?.deliverable?.id === "string",
    `${draftDeliverableResponse.status}/${draftDeliverableResponse.body?.data?.deliverable?.status ?? "missing"}`
  );
  if (
    draftDeliverableResponse.status !== 201 ||
    draftDeliverableResponse.body?.ok !== true ||
    draftDeliverableResponse.body?.data?.deliverable?.status !== "DRAFT" ||
    typeof draftDeliverableResponse.body?.data?.deliverable?.id !== "string"
  ) {
    throw new Error("Fixture setup failed at primary DRAFT deliverable creation.");
  }

  const draftDeliverableId = draftDeliverableResponse.body.data.deliverable.id;

  const readyDeliverableResponse = await request(
    `/ai-delivery-projects/${primaryProjectId}/deliverables/${draftDeliverableId}/mark-ready`,
    {
      method: "POST",
      token,
      body: {}
    }
  );
  record(
    "mark primary deliverable READY",
    readyDeliverableResponse.status === 200 &&
      readyDeliverableResponse.body?.ok === true &&
      readyDeliverableResponse.body?.data?.deliverable?.status === "READY",
    `${readyDeliverableResponse.status}/${readyDeliverableResponse.body?.data?.deliverable?.status ?? "missing"}`
  );
  if (
    readyDeliverableResponse.status !== 200 ||
    readyDeliverableResponse.body?.ok !== true ||
    readyDeliverableResponse.body?.data?.deliverable?.status !== "READY"
  ) {
    const readyCode = readyDeliverableResponse.body?.error?.code ?? "none";
    const readyMessage = readyDeliverableResponse.body?.error?.message ?? readyDeliverableResponse.text;
    throw new Error(`Fixture setup failed at mark-ready (${readyCode}): ${readyMessage}`);
  }

  const acceptedDeliverableResponse = await request(
    `/ai-delivery-projects/${primaryProjectId}/deliverables/${draftDeliverableId}/accept`,
    {
      method: "POST",
      token,
      body: {}
    }
  );
  record(
    "accept primary deliverable",
    acceptedDeliverableResponse.status === 200 &&
      acceptedDeliverableResponse.body?.ok === true &&
      acceptedDeliverableResponse.body?.data?.deliverable?.status === "ACCEPTED",
    `${acceptedDeliverableResponse.status}/${acceptedDeliverableResponse.body?.data?.deliverable?.status ?? "missing"}`
  );
  if (
    acceptedDeliverableResponse.status !== 200 ||
    acceptedDeliverableResponse.body?.ok !== true ||
    acceptedDeliverableResponse.body?.data?.deliverable?.status !== "ACCEPTED"
  ) {
    const acceptCode = acceptedDeliverableResponse.body?.error?.code ?? "none";
    const acceptMessage = acceptedDeliverableResponse.body?.error?.message ?? acceptedDeliverableResponse.text;
    throw new Error(`Fixture setup failed at accept (${acceptCode}): ${acceptMessage}`);
  }

  return {
    clientName: client.name,
    primaryProject: primaryProjectResponse.body.data.aiDeliveryProject,
    secondaryProject: secondaryProjectResponse.body.data.aiDeliveryProject,
    finalDeliverable: acceptedDeliverableResponse.body.data.deliverable
  };
}

function getMonthlyReportDialog(page, projectName) {
  const escapedProjectName = projectName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return page.getByRole("dialog", { name: new RegExp(`Monthly Report\\s+—\\s+${escapedProjectName}`) });
}

async function selectProjectInPicker(page, projectName) {
  const projectListItem = page.locator("button.brief-select-item").filter({ hasText: projectName }).first();
  await projectListItem.waitFor({ state: "visible", timeout: 15000 });
  await projectListItem.click();
  return projectListItem;
}

async function openMonthlyReportModal(page, projectName) {
  await selectProjectInPicker(page, projectName);
  const workspaceSection = page.locator(".ai-delivery-workspace-stack");
  const monthlyReportButton = workspaceSection.getByRole("button", { name: "Monthly report" });
  await monthlyReportButton.waitFor({ state: "visible", timeout: 15000 });
  await monthlyReportButton.click();
  await getMonthlyReportDialog(page, projectName).waitFor({ state: "visible", timeout: 15000 });
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
  record("admin login", loginResponse.status === 200 && typeof adminToken === "string", `${loginResponse.status}`);
  if (!adminToken) {
    console.error("STOP: Admin login failed.");
    process.exitCode = 1;
    return;
  }

  const fixture = await createFixture(adminToken);
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

  const smokeTitle = `[SMOKE][MONTHLY_REPORT_UI] ${makeSmokeId("title")}`;
  const smokeAdminNotes = `[SMOKE][MONTHLY_REPORT_UI] ${makeSmokeId("admin-notes")}`;
  const smokeRecommendations = `[SMOKE][MONTHLY_REPORT_UI] ${makeSmokeId("recommendations")}`;
  const smokeExportUrl = "https://docs.example.com/monthly-report-admin-ui-smoke";

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/ai-delivery`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "AI Delivery Projects" }).waitFor({ state: "visible", timeout: 15000 });

    record("ai delivery page loads", true, "heading visible");
    const primaryProjectListItem = await selectProjectInPicker(page, fixture.primaryProject.name);

    const listItemText = await primaryProjectListItem.innerText();
    record("project picker item shows project name", listItemText.includes(fixture.primaryProject.name), fixture.primaryProject.name);
    const workspaceSection = page.locator(".ai-delivery-workspace-stack");
    await workspaceSection.waitFor({ state: "visible", timeout: 15000 });
    record(
      "workspace shows Monthly report section",
      await workspaceSection.getByRole("heading", { name: "Monthly report" }).isVisible(),
      fixture.primaryProject.name
    );
    record(
      "workspace shows Monthly report button",
      await workspaceSection.getByRole("button", { name: "Monthly report" }).isVisible(),
      fixture.primaryProject.name
    );

    await openMonthlyReportModal(page, fixture.primaryProject.name);
    record("monthly report modal opens", true, fixture.primaryProject.name);

    const modalPanel = getMonthlyReportDialog(page, fixture.primaryProject.name);
    const summaryPanel = modalPanel.locator(".monthly-report-summary-panel");
    await summaryPanel.getByRole("heading", { name: "Computed Monthly Summary" }).waitFor({ state: "visible", timeout: 15000 });
    record("computed summary section visible", true, "Computed Monthly Summary");
    await summaryPanel.locator('[aria-label="Monthly report snapshot metrics"]').waitFor({ state: "visible", timeout: 15000 });

    const modalText = await summaryPanel.innerText();
    record("summary shows project/client/month", modalText.includes(fixture.primaryProject.name) && modalText.includes(fixture.clientName), "header values");
    record(
      "summary shows totals or empty state",
      modalText.includes("Final deliverables") || modalText.includes("No final deliverables yet for this project."),
      "totals area"
    );
    record(
      "summary shows deferred GA/GSC and trends",
      modalText.includes("GA/GSC metrics") && modalText.includes("12-month trends") && modalText.includes("Deferred"),
      "deferred labels"
    );

    const createButton = modalPanel.getByRole("button", { name: "Create Monthly Report" });
    if (await createButton.isVisible()) {
      await createButton.click();
      await modalPanel.getByText("Monthly report created.").waitFor({ state: "visible", timeout: 15000 });
      record("create monthly report via UI", true, "created from modal");
    } else {
      record("create monthly report via UI", true, "existing report loaded");
    }

    await waitForReportStatusBadge(modalPanel, "Draft");
    record("DRAFT status visible", true, "Draft badge");

    await modalPanel.getByLabel(/^Report title/i).fill(smokeTitle);
    await modalPanel.getByLabel(/^Admin summary notes/i).fill(smokeAdminNotes);
    await modalPanel.getByLabel(/^Recommendations/i).fill(smokeRecommendations);
    await modalPanel.getByLabel(/^Export \/ handoff URL/i).fill(smokeExportUrl);
    await modalPanel.getByRole("button", { name: "Save report" }).click();
    await modalPanel.getByText("Report saved.").waitFor({ state: "visible", timeout: 15000 });
    record("save monthly report edits", true, "save confirmation");

    record("title persisted in form", (await modalPanel.getByLabel(/^Report title/i).inputValue()) === smokeTitle, smokeTitle);
    record(
      "adminSummaryNotes persisted in form",
      (await modalPanel.getByLabel(/^Admin summary notes/i).inputValue()) === smokeAdminNotes,
      "admin notes"
    );
    record(
      "recommendationsText persisted in form",
      (await modalPanel.getByLabel(/^Recommendations/i).inputValue()) === smokeRecommendations,
      "recommendations"
    );
    record("exportUrl persisted in form", (await modalPanel.getByLabel(/^Export \/ handoff URL/i).inputValue()) === smokeExportUrl, smokeExportUrl);

    await modalPanel.getByRole("button", { name: "Move to Admin Review" }).click();
    await waitForReportStatusBadge(modalPanel, "Admin review");
    record("status DRAFT -> ADMIN_REVIEW", true, "Admin review");

    await modalPanel.getByRole("button", { name: "Finalize" }).click();
    await waitForReportStatusBadge(modalPanel, "Final");
    await modalPanel.getByText("Finalized").first().waitFor({ state: "visible", timeout: 15000 });
    record("status ADMIN_REVIEW -> FINAL", true, "Final + finalizedAt visible");

    await modalPanel.getByRole("button", { name: "Archive" }).click();
    await waitForReportStatusBadge(modalPanel, "Archived");
    record("status FINAL -> ARCHIVED", true, "Archived");

    await modalPanel.getByRole("button", { name: "Restore" }).click();
    await waitForReportStatusBadge(modalPanel, "Draft");
    record("restore archived report", true, "Restored to Draft");

    await modalPanel.getByRole("button", { name: "Close" }).first().click();
    await page.getByRole("heading", { name: "AI Delivery Projects" }).waitFor({ state: "visible", timeout: 15000 });
    record("modal closes cleanly", true, fixture.primaryProject.name);

    await openMonthlyReportModal(page, fixture.primaryProject.name);
    const reopenedPanel = getMonthlyReportDialog(page, fixture.primaryProject.name);
    await reopenedPanel.getByLabel(/^Report title/i).waitFor({ state: "visible", timeout: 15000 });
    const reopenedTitle = await reopenedPanel.getByLabel(/^Report title/i).inputValue();
    record("same-project reopen reloads saved state", reopenedTitle === smokeTitle, reopenedTitle);

    await reopenedPanel.getByRole("button", { name: "Close" }).first().click();
    await openMonthlyReportModal(page, fixture.secondaryProject.name);
    const secondPanel = getMonthlyReportDialog(page, fixture.secondaryProject.name);
    const secondPanelText = await secondPanel.innerText();
    const staleLeak = secondPanelText.includes(smokeTitle) || secondPanelText.includes(smokeAdminNotes) || secondPanelText.includes(smokeRecommendations);
    record("no stale report state leak across projects", !staleLeak, fixture.secondaryProject.name);

    const renderedModal = `${await secondPanel.innerText()}\n${await secondPanel.innerHTML()}`;
    const forbiddenHits = forbiddenTokens.filter((token) => containsForbiddenToken(renderedModal, token));
    record(
      "forbidden UI fields absent from modal body/html",
      forbiddenHits.length === 0,
      forbiddenHits.length ? forbiddenHits.join(", ") : "none"
    );

    const relevantConsoleErrors = consoleErrors.filter(
      (message) => !/Failed to load resource: the server responded with a status of 404/i.test(message)
    );
    record(
      "browser console/page errors absent",
      relevantConsoleErrors.length === 0,
      relevantConsoleErrors.length ? relevantConsoleErrors.join(" | ") : "none"
    );

    await secondPanel.getByRole("button", { name: "Close" }).first().click();
    const allPassed = results.every((item) => item.ok);
    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL monthly report admin UI browser smoke runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
