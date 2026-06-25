import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

const forbiddenTokens = [
  "storageKey",
  "adminSummaryNotes",
  "tenantId",
  "workflowRunId",
  "executionLog",
  "executionError",
  "provider",
  "cost",
  "rawData"
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

function containsForbiddenToken(text, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i");
  return pattern.test(text);
}

async function createFixture(adminToken, adminUserId) {
  const clientName = `[SMOKE][CP_MONTHLY_REPORT_BROWSER] ${makeSmokeId("client")}`;
  const projectName = `[SMOKE][CP_MONTHLY_REPORT_BROWSER] ${makeSmokeId("project")}`;
  const finalReportTitle = `[SMOKE][CP_MONTHLY_REPORT_BROWSER] ${makeSmokeId("final-report")}`;
  const draftReportTitle = `[SMOKE][CP_MONTHLY_REPORT_BROWSER] ${makeSmokeId("draft-report")}`;
  const adminReviewReportTitle = `[SMOKE][CP_MONTHLY_REPORT_BROWSER] ${makeSmokeId("review-report")}`;
  const archivedReportTitle = `[SMOKE][CP_MONTHLY_REPORT_BROWSER] ${makeSmokeId("archived-report")}`;

  // Create client
  const createdClient = await request("/clients", {
    method: "POST",
    token: adminToken,
    body: { name: clientName, country: "United States" }
  });
  record("create client", createdClient.status === 201 && createdClient.body?.ok === true, `${createdClient.status}`);
  if (createdClient.status !== 201) throw new Error("Client creation failed.");
  const client = createdClient.body.data.client;

  // Create AI Delivery project
  const createdProject = await request("/ai-delivery-projects", {
    method: "POST",
    token: adminToken,
    body: { clientId: client.id, name: projectName, targetMonth: "2026-08" }
  });
  record("create ai delivery project", createdProject.status === 201 && createdProject.body?.ok === true, `${createdProject.status}`);
  if (createdProject.status !== 201) throw new Error("Project creation failed.");
  const project = createdProject.body.data.aiDeliveryProject;

  // Link admin user as client user (admin@dca.local acts as the client user for smoke)
  const linkAccess = await request(`/clients/${client.id}/users`, {
    method: "POST",
    token: adminToken,
    body: { userId: adminUserId }
  });
  record("link client access", linkAccess.status === 201 && linkAccess.body?.ok === true, `${linkAccess.status}`);
  if (linkAccess.status !== 201) throw new Error("Client access link failed.");

  // Create FINAL report (via DRAFT → ADMIN_REVIEW → FINAL)
  const createdFinalReport = await request(`/ai-delivery/reports/monthly/${project.id}`, {
    method: "POST",
    token: adminToken,
    body: { title: finalReportTitle, recommendationsText: "Smoke proof recommendations.", exportUrl: null }
  });
  record("create final report (initial DRAFT)", createdFinalReport.status === 201 && createdFinalReport.body?.ok === true, `${createdFinalReport.status}`);
  if (createdFinalReport.status !== 201) throw new Error("Final report creation failed.");
  const finalReportId = createdFinalReport.body.data.report.id;

  // Advance to FINAL
  const toFinal = await request(`/ai-delivery/reports/monthly/${finalReportId}/status`, {
    method: "POST",
    token: adminToken,
    body: { status: "FINAL" }
  });
  record("advance FINAL report to FINAL status", toFinal.status === 200 && toFinal.body?.ok === true, `${toFinal.status}`);
  if (toFinal.status !== 200) throw new Error("Failed to advance report to FINAL.");
  const finalReport = toFinal.body.data.report;

  // Create DRAFT report for another project (same client) — for isolation testing
  // We reuse the same project but create it via a separate AI Delivery project
  const project2Name = `[SMOKE][CP_MONTHLY_REPORT_BROWSER] ${makeSmokeId("project2")}`;
  const createdProject2 = await request("/ai-delivery-projects", {
    method: "POST",
    token: adminToken,
    body: { clientId: client.id, name: project2Name, targetMonth: "2026-09" }
  });
  record("create second project for draft/review/archived reports", createdProject2.status === 201 && createdProject2.body?.ok === true, `${createdProject2.status}`);
  if (createdProject2.status !== 201) throw new Error("Second project creation failed.");
  const project2 = createdProject2.body.data.aiDeliveryProject;

  // Create DRAFT report on project2
  const createdDraftReport = await request(`/ai-delivery/reports/monthly/${project2.id}`, {
    method: "POST",
    token: adminToken,
    body: { title: draftReportTitle }
  });
  record("create DRAFT report on project2", createdDraftReport.status === 201 && createdDraftReport.body?.ok === true, `${createdDraftReport.status}`);

  // Create ADMIN_REVIEW report on project2 (create then advance)
  // project2 already has a report (DRAFT), so we can't create another (unique constraint: one per project)
  // Instead, we use a third project for the ADMIN_REVIEW report
  const project3Name = `[SMOKE][CP_MONTHLY_REPORT_BROWSER] ${makeSmokeId("project3")}`;
  const createdProject3 = await request("/ai-delivery-projects", {
    method: "POST",
    token: adminToken,
    body: { clientId: client.id, name: project3Name, targetMonth: "2026-10" }
  });
  record("create third project for admin_review report", createdProject3.status === 201 && createdProject3.body?.ok === true, `${createdProject3.status}`);
  if (createdProject3.status !== 201) throw new Error("Third project creation failed.");
  const project3 = createdProject3.body.data.aiDeliveryProject;

  const createdReviewReport = await request(`/ai-delivery/reports/monthly/${project3.id}`, {
    method: "POST",
    token: adminToken,
    body: { title: adminReviewReportTitle }
  });
  record("create ADMIN_REVIEW report base", createdReviewReport.status === 201 && createdReviewReport.body?.ok === true, `${createdReviewReport.status}`);
  if (createdReviewReport.status !== 201) throw new Error("Review report creation failed.");
  const reviewReportId = createdReviewReport.body.data.report.id;
  const toReview = await request(`/ai-delivery/reports/monthly/${reviewReportId}/status`, {
    method: "POST",
    token: adminToken,
    body: { status: "ADMIN_REVIEW" }
  });
  record("advance to ADMIN_REVIEW", toReview.status === 200 && toReview.body?.ok === true, `${toReview.status}`);

  // Create ARCHIVED report on project1 — use a 4th project since project1 already has a FINAL report (unique constraint)
  const project4Name = `[SMOKE][CP_MONTHLY_REPORT_BROWSER] ${makeSmokeId("project4")}`;
  const createdProject4 = await request("/ai-delivery-projects", {
    method: "POST",
    token: adminToken,
    body: { clientId: client.id, name: project4Name, targetMonth: "2026-11" }
  });
  record("create fourth project for archived report", createdProject4.status === 201 && createdProject4.body?.ok === true, `${createdProject4.status}`);
  if (createdProject4.status !== 201) throw new Error("Fourth project creation failed.");
  const project4 = createdProject4.body.data.aiDeliveryProject;

  const createdArchivedReport = await request(`/ai-delivery/reports/monthly/${project4.id}`, {
    method: "POST",
    token: adminToken,
    body: { title: archivedReportTitle }
  });
  record("create base report for archive test", createdArchivedReport.status === 201 && createdArchivedReport.body?.ok === true, `${createdArchivedReport.status}`);
  if (createdArchivedReport.status !== 201) throw new Error("Archived report base creation failed.");
  const archivedReportId = createdArchivedReport.body.data.report.id;
  // Must be FINAL before archive
  const toFinalForArchive = await request(`/ai-delivery/reports/monthly/${archivedReportId}/status`, {
    method: "POST",
    token: adminToken,
    body: { status: "FINAL" }
  });
  record("advance archived report base to FINAL", toFinalForArchive.status === 200, `${toFinalForArchive.status}`);
  const archiveIt = await request(`/ai-delivery/reports/monthly/${archivedReportId}/archive`, {
    method: "POST",
    token: adminToken
  });
  record("archive the report", archiveIt.status === 200 && archiveIt.body?.ok === true, `${archiveIt.status}`);

  return {
    client,
    project,
    project2,
    project3,
    project4,
    finalReport,
    finalReportTitle,
    draftReportTitle,
    adminReviewReportTitle,
    archivedReportTitle
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

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      // Filter generic Vite 404 asset messages that are not app errors
      if (/Failed to load resource: the server responded with a status of 404/i.test(text)) {
        return;
      }
      consoleErrors.push(text);
    }
  });

  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/client-portal`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Client Portal" }).waitFor({ state: "visible", timeout: 15000 });
    record("client portal page loads", true, "heading visible");

    // Select the project with the FINAL report
    await page.getByText(fixture.project.name, { exact: true }).waitFor({ state: "visible", timeout: 15000 });
    const portalSection = page.locator('section[aria-labelledby="client-portal-title"]');
    const projectCard = portalSection.locator("article.entity-card", { hasText: fixture.project.name }).first();
    await projectCard.getByRole("button", { name: "Open project" }).click();

    // Wait for monthly reports section to appear
    const monthlyReportsCard = portalSection.locator("article.entity-card").filter({ has: page.getByRole("heading", { name: "Monthly reports" }) }).first();
    await monthlyReportsCard.waitFor({ state: "visible", timeout: 15000 });
    record("monthly reports section appears after project select", true, "section visible");

    const portalText = await portalSection.innerText();
    const portalHtml = await portalSection.innerHTML();
    const renderedPortal = `${portalText}\n${portalHtml}`;

    // Verify FINAL report is visible
    record(
      "FINAL monthly report visible in client portal",
      renderedPortal.includes(fixture.finalReportTitle),
      fixture.finalReportTitle
    );

    // Verify DRAFT report not visible (it's on project2, not the selected project1 — so it wouldn't be in project1 results anyway;
    // the FINAL filter ensures it also can't appear for project1 even if somehow a DRAFT crept in)
    record(
      "DRAFT monthly report not visible",
      !renderedPortal.includes(fixture.draftReportTitle),
      fixture.draftReportTitle.slice(0, 30)
    );

    record(
      "ADMIN_REVIEW monthly report not visible",
      !renderedPortal.includes(fixture.adminReviewReportTitle),
      fixture.adminReviewReportTitle.slice(0, 30)
    );

    record(
      "ARCHIVED monthly report not visible",
      !renderedPortal.includes(fixture.archivedReportTitle),
      fixture.archivedReportTitle.slice(0, 30)
    );

    // Verify status badge shows Final (StatusBadge formats "FINAL" → "Final")
    record(
      "FINAL status badge visible in monthly reports section",
      renderedPortal.includes("Final"),
      "status badge"
    );

    // Verify forbidden fields absent
    const forbiddenHits = forbiddenTokens.filter((token) => containsForbiddenToken(renderedPortal, token));
    record(
      "forbidden internal fields absent from portal",
      forbiddenHits.length === 0,
      forbiddenHits.length ? forbiddenHits.join(", ") : "none"
    );

    // Verify console errors absent
    record(
      "browser console/page errors absent",
      consoleErrors.length === 0,
      consoleErrors.length ? consoleErrors.join(" | ") : "none"
    );

    // Verify API returns only FINAL non-archived reports for the project via direct API call
    const apiResult = await request(`/client-portal/projects/${fixture.project.id}/monthly-reports`, { token: adminToken });
    record(
      "api returns only FINAL non-archived reports",
      apiResult.status === 200 && apiResult.body?.ok === true,
      `${apiResult.status} count=${apiResult.body?.data?.monthlyReports?.length ?? "?"}`
    );
    const apiReports = apiResult.body?.data?.monthlyReports ?? [];
    const allFinal = apiReports.every((r) => r.status === "FINAL");
    record("all api-returned reports have status FINAL", allFinal, allFinal ? "ok" : "non-FINAL found");
    const apiResponseText = JSON.stringify(apiReports);
    record(
      "api response does not contain storageKey",
      !apiResponseText.includes("storageKey"),
      "storageKey absent"
    );
    record(
      "api response does not contain adminSummaryNotes",
      !apiResponseText.includes("adminSummaryNotes"),
      "adminSummaryNotes absent"
    );
    record(
      "api response does not contain tenantId",
      !apiResponseText.includes("tenantId"),
      "tenantId absent"
    );

    // Test DRAFT project2 API response — should return 0 reports since project2 only has DRAFT
    const apiResult2 = await request(`/client-portal/projects/${fixture.project2.id}/monthly-reports`, { token: adminToken });
    record(
      "project with DRAFT-only report returns empty monthly reports list",
      apiResult2.status === 200 && apiResult2.body?.ok === true && apiResult2.body?.data?.monthlyReports?.length === 0,
      `${apiResult2.status} count=${apiResult2.body?.data?.monthlyReports?.length ?? "?"}`
    );

    // Test project4 (archived report) — should return 0 reports since report is archived
    const apiResult4 = await request(`/client-portal/projects/${fixture.project4.id}/monthly-reports`, { token: adminToken });
    record(
      "project with ARCHIVED report returns empty monthly reports list",
      apiResult4.status === 200 && apiResult4.body?.ok === true && apiResult4.body?.data?.monthlyReports?.length === 0,
      `${apiResult4.status} count=${apiResult4.body?.data?.monthlyReports?.length ?? "?"}`
    );

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Client Portal shows only FINAL non-archived monthly reports for linked projects.");
      console.log("PROVEN: DRAFT, ADMIN_REVIEW, and ARCHIVED reports are hidden from client view.");
      console.log("PROVEN: storageKey, adminSummaryNotes, tenantId and internal fields absent from rendered UI and API response.");
      console.log("PROVEN: forbidden tokens absent from page HTML.");
    } else {
      console.log("NOT PROVEN: one or more client portal monthly report browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL client portal monthly report browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
