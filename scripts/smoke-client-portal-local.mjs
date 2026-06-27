// Focused smoke for Client Portal Block 1 — client-safe read-only project + deliverable archive.
// Tests: unauthenticated 401, access guard (ClientUserAccess), status filter (DELIVERED/ACCEPTED only),
// download endpoint (storageKey not exposed, DRAFT blocked), cross-tenant blocking.

import { seedPurivaDeliverySummaryFixture } from "./lib/puriva-delivery-summary-fixture.mjs";

const defaultLocalApiBaseUrl = "http://127.0.0.1:4000/api/v1";
const apiBaseUrl = process.env.MVP_SMOKE_API_BASE_URL ?? defaultLocalApiBaseUrl;
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const testerEmail = process.env.AUTH_SEED_TESTER_EMAIL;
const testerPassword = process.env.AUTH_SEED_TESTER_PASSWORD;

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  const status = ok ? "PASS" : "FAIL";
  console.log(`${status} ${name}${detail ? ` - ${detail}` : ""}`);
}

function requireEnv(name, value) {
  if (typeof value !== "string" || value.length === 0) {
    record(`env ${name}`, false, "missing");
    return false;
  }
  record(`env ${name}`, true, "present");
  return true;
}

function getErrorCode(response) {
  return response.body?.error?.code ?? "";
}

function responseHasSensitiveFields(response) {
  return /passwordHash|sessionTokenHash/i.test(response.text);
}

// Stricter check for client portal responses: storageKey must never appear.
function clientPortalResponseHasSensitiveFields(response) {
  return /passwordHash|sessionTokenHash|storageKey/i.test(response.text);
}

function deliverySummaryResponseHasForbiddenInternals(response) {
  return /sourceNote|audienceSignals|"risks"|workflowRunId|executionLog|insightId|passwordHash|sessionTokenHash|storageKey/i.test(
    response.text
  );
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

function requireOkData(name, response, expectedStatus = 201) {
  const ok = response.status === expectedStatus && response.body?.ok === true && !responseHasSensitiveFields(response);
  record(name, ok, `${response.status}`);
  if (!ok) {
    throw new Error(`${name} failed with HTTP ${response.status}.`);
  }
  return response.body.data;
}

function makeSmokeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function main() {
  const passwordOk = requireEnv("AUTH_SEED_TEST_PASSWORD", adminPassword);
  if (!passwordOk) {
    console.error("STOP: AUTH_SEED_TEST_PASSWORD is required.");
    process.exitCode = 1;
    return;
  }

  // ── 1. Unauthenticated access must return 401 ──────────────────────────────
  const unauthedProjects = await request("/client-portal/projects");
  record(
    "client portal projects unauthenticated 401",
    unauthedProjects.status === 401 && getErrorCode(unauthedProjects) === "AUTH_UNAUTHORIZED",
    `${unauthedProjects.status} ${getErrorCode(unauthedProjects)}`
  );

  // ── 2. Admin login ─────────────────────────────────────────────────────────
  const loginResponse = await login(adminEmail, adminPassword);
  const adminToken = loginResponse.body?.data?.session?.token ?? null;
  record("admin login", loginResponse.status === 200 && typeof adminToken === "string", `${loginResponse.status}`);
  if (!adminToken) {
    console.error("STOP: Admin login failed.");
    process.exitCode = 1;
    return;
  }

  // ── 3. Admin with no ClientUserAccess sees empty list ──────────────────────
  // (Admin may have pre-existing ClientUserAccess from prior runs — we verify the endpoint returns 200.
  //  The "empty list" guarantee is only meaningful for a fresh admin account.)
  const emptyProjectsResp = await request("/client-portal/projects", { token: adminToken });
  record(
    "client portal projects authenticated returns 200",
    emptyProjectsResp.status === 200 && emptyProjectsResp.body?.ok === true,
    `${emptyProjectsResp.status}`
  );
  const initialProjects = emptyProjectsResp.body?.data?.aiDeliveryProjects ?? null;
  record(
    "client portal projects returns array",
    Array.isArray(initialProjects),
    Array.isArray(initialProjects) ? `count=${initialProjects.length}` : "not an array"
  );
  record(
    "client portal projects no storageKey in list",
    !clientPortalResponseHasSensitiveFields(emptyProjectsResp),
    "storageKey absent"
  );

  // ── 4. Create test fixtures: client + AI delivery project + DRAFT deliverable ──
  const smokeClientName = `[SMOKE][CLIENT_PORTAL] ${makeSmokeId("client")}`;
  const smokeProjectName = `[SMOKE][CLIENT_PORTAL] ${makeSmokeId("project")}`;

  const createdClient = requireOkData(
    "client portal smoke create client",
    await request("/clients", {
      method: "POST",
      token: adminToken,
      body: { name: smokeClientName, country: "United States" }
    })
  ).client;

  const createdAiProject = requireOkData(
    "client portal smoke create ai delivery project",
    await request("/ai-delivery-projects", {
      method: "POST",
      token: adminToken,
      body: {
        clientId: createdClient.id,
        name: smokeProjectName,
        targetMonth: "2026-07"
      }
    })
  ).aiDeliveryProject;

  // Create a DRAFT deliverable — DRAFT must NOT appear in the client portal deliverables list.
  const createdDraftDeliverable = requireOkData(
    "client portal smoke create DRAFT deliverable",
    await request(`/ai-delivery-projects/${createdAiProject.id}/deliverables`, {
      method: "POST",
      token: adminToken,
      body: {
        title: `[SMOKE][CLIENT_PORTAL] DRAFT deliverable ${makeSmokeId("d")}`,
        deliveryType: "CONTENT_PACKAGE",
        status: "DRAFT"
      }
    })
  ).deliverable;

  // ── 5. Before linking: admin should NOT see the project via client portal ──
  // (Admin has no ClientUserAccess for this new client yet.)
  const beforeLinkProjects = await request("/client-portal/projects", { token: adminToken });
  const beforeLinkProjectList = beforeLinkProjects.body?.data?.aiDeliveryProjects ?? [];
  const projectVisibleBeforeLink = beforeLinkProjectList.some((p) => p.id === createdAiProject.id);
  record(
    "client portal project not visible before ClientUserAccess",
    !projectVisibleBeforeLink,
    projectVisibleBeforeLink ? "project visible before link (unexpected)" : "correctly hidden"
  );

  // Project detail should return 404 before access is granted.
  const beforeLinkDetail = await request(`/client-portal/projects/${createdAiProject.id}`, { token: adminToken });
  record(
    "client portal project detail 404 before ClientUserAccess",
    beforeLinkDetail.status === 404,
    `${beforeLinkDetail.status}`
  );

  // Deliverables endpoint should return 404 before access is granted.
  const beforeLinkDeliverables = await request(
    `/client-portal/projects/${createdAiProject.id}/deliverables`,
    { token: adminToken }
  );
  record(
    "client portal deliverables 404 before ClientUserAccess",
    beforeLinkDeliverables.status === 404,
    `${beforeLinkDeliverables.status}`
  );

  // ── 6. Link admin to the client ────────────────────────────────────────────
  const adminUserId = loginResponse.body?.data?.user?.id ?? null;
  if (!adminUserId) {
    record("client portal get admin user id", false, "missing from login response");
    throw new Error("Admin user id missing from login response.");
  }

  requireOkData(
    "client portal smoke link admin to client",
    await request(`/clients/${createdClient.id}/users`, {
      method: "POST",
      token: adminToken,
      body: { userId: adminUserId }
    })
  );

  // ── 7. After linking: admin sees the project ───────────────────────────────
  const afterLinkProjects = await request("/client-portal/projects", { token: adminToken });
  const afterLinkProjectList = afterLinkProjects.body?.data?.aiDeliveryProjects ?? [];
  const projectVisibleAfterLink = afterLinkProjectList.some((p) => p.id === createdAiProject.id);
  record(
    "client portal project visible after ClientUserAccess",
    projectVisibleAfterLink,
    projectVisibleAfterLink ? "project visible" : "project not visible (unexpected)"
  );
  record(
    "client portal projects list no storageKey",
    !clientPortalResponseHasSensitiveFields(afterLinkProjects),
    "storageKey absent"
  );

  // ── 8. Project detail accessible after linking ────────────────────────────
  const afterLinkDetail = await request(`/client-portal/projects/${createdAiProject.id}`, { token: adminToken });
  record(
    "client portal project detail 200 after ClientUserAccess",
    afterLinkDetail.status === 200 && afterLinkDetail.body?.ok === true,
    `${afterLinkDetail.status}`
  );
  const detailProject = afterLinkDetail.body?.data?.aiDeliveryProject ?? null;
  record(
    "client portal project detail has correct id",
    detailProject?.id === createdAiProject.id,
    detailProject?.id ?? "null"
  );
  record(
    "client portal project detail no storageKey",
    !clientPortalResponseHasSensitiveFields(afterLinkDetail),
    "storageKey absent"
  );

  // ── 8b. Delivery summary accessible after linking ─────────────────────────
  const deliverySummary = await request(
    `/client-portal/projects/${createdAiProject.id}/delivery-summary`,
    { token: adminToken }
  );
  record(
    "client portal delivery summary 200 after ClientUserAccess",
    deliverySummary.status === 200 && deliverySummary.body?.ok === true,
    `${deliverySummary.status}`
  );
  record(
    "client portal delivery summary has deliverySummary object",
    typeof deliverySummary.body?.data?.deliverySummary === "object" &&
      deliverySummary.body?.data?.deliverySummary !== null,
    "deliverySummary present"
  );
  record(
    "client portal delivery summary no storageKey",
    !clientPortalResponseHasSensitiveFields(deliverySummary),
    "storageKey absent"
  );
  const sparseSummary = deliverySummary.body?.data?.deliverySummary ?? null;
  record(
    "client portal sparse delivery summary has no market intelligence yet",
    deliverySummary.status === 200 && sparseSummary?.marketIntelligence === null,
    sparseSummary?.marketIntelligence ? "unexpected mi summary" : "mi null"
  );
  record(
    "client portal sparse delivery summary has no google docs exports yet",
    deliverySummary.status === 200 &&
      Array.isArray(sparseSummary?.googleDocsExports) &&
      sparseSummary.googleDocsExports.length === 0,
    `${sparseSummary?.googleDocsExports?.length ?? "missing"}`
  );
  record(
    "client portal sparse delivery summary has no website publishing yet",
    deliverySummary.status === 200 && sparseSummary?.websitePublishing === null,
    sparseSummary?.websitePublishing?.status ?? "null"
  );

  // ── 8c. Puriva delivery path fixture (MI summary, Google Doc export, publishing status) ──
  await seedPurivaDeliverySummaryFixture({
    request,
    requireOkData,
    record,
    makeSmokeId,
    adminToken,
    client: createdClient,
    aiProject: createdAiProject
  });

  const populatedDeliverySummary = await request(
    `/client-portal/projects/${createdAiProject.id}/delivery-summary`,
    { token: adminToken }
  );
  const summary = populatedDeliverySummary.body?.data?.deliverySummary ?? null;
  record(
    "puriva delivery summary includes market intelligence summary",
    populatedDeliverySummary.status === 200 &&
      typeof summary?.marketIntelligence?.marketSummary === "string" &&
      summary.marketIntelligence.marketSummary.length > 0,
    summary?.marketIntelligence?.marketSummary ? "present" : "missing"
  );
  record(
    "puriva delivery summary includes recommended actions",
    Array.isArray(summary?.marketIntelligence?.recommendedActions) &&
      summary.marketIntelligence.recommendedActions.length > 0,
    `${summary?.marketIntelligence?.recommendedActions?.length ?? 0}`
  );
  record(
    "puriva delivery summary includes google docs export",
    Array.isArray(summary?.googleDocsExports) && summary.googleDocsExports.length > 0,
    `${summary?.googleDocsExports?.length ?? 0}`
  );
  record(
    "puriva delivery summary includes website publishing status",
    typeof summary?.websitePublishing?.status === "string" && summary.websitePublishing.status.length > 0,
    summary?.websitePublishing?.status ?? "missing"
  );
  record(
    "puriva delivery summary hides internal mi fields",
    !deliverySummaryResponseHasForbiddenInternals(populatedDeliverySummary),
    "forbidden internals absent"
  );

  const createdCatalogProduct = requireOkData(
    "create catalog product",
    await request(`/clients/${createdClient.id}/catalog-products`, {
      token: adminToken,
      method: "POST",
      body: {
        name: "Smoke Catalog Product",
        description: "Inquiry-only smoke product",
        priceLabel: "Rp 1",
        isVisibleInPortal: true
      }
    })
  ).catalogProduct;

  const portalCatalog = await request(
    `/client-portal/projects/${createdAiProject.id}/catalog-products`,
    { token: adminToken }
  );
  record(
    "client portal catalog products 200 after ClientUserAccess",
    portalCatalog.status === 200 && portalCatalog.body?.ok === true,
    `${portalCatalog.status}`
  );
  record(
    "client portal catalog includes smoke product",
    (portalCatalog.body?.data?.catalogProducts ?? []).some((item) => item.id === createdCatalogProduct.id),
    createdCatalogProduct.id
  );

  const catalogInquiry = requireOkData(
    "submit catalog inquiry",
    await request(`/client-portal/projects/${createdAiProject.id}/catalog-inquiries`, {
      token: adminToken,
      method: "POST",
      body: {
        productId: createdCatalogProduct.id,
        contactName: "Smoke Client",
        contactEmail: "client@example.com",
        message: "Smoke inquiry only"
      }
    })
  ).catalogInquiry;
  record(
    "client portal catalog inquiry created",
    typeof catalogInquiry?.id === "string",
    catalogInquiry?.id ?? "null"
  );

  const createdMonthlyReport = requireOkData(
    "create monthly report",
    await request(`/ai-delivery/reports/monthly/${createdAiProject.id}`, {
      method: "POST",
      token: adminToken,
      body: {
        title: `[SMOKE][CLIENT_PORTAL] ${makeSmokeId("final-report")}`,
        recommendationsText: "Smoke final client view recommendations."
      }
    })
  ).report;

  requireOkData(
    "client portal smoke finalize monthly report",
    await request(`/ai-delivery/reports/monthly/${createdMonthlyReport.id}/status`, {
      method: "POST",
      token: adminToken,
      body: { status: "FINAL" }
    }),
    200
  );

  const monthlyReportsList = await request(
    `/client-portal/projects/${createdAiProject.id}/monthly-reports`,
    { token: adminToken }
  );
  record(
    "client portal monthly reports list 200",
    monthlyReportsList.status === 200 && monthlyReportsList.body?.ok === true,
    `${monthlyReportsList.status}`
  );
  record(
    "client portal monthly reports list includes FINAL report",
    (monthlyReportsList.body?.data?.monthlyReports ?? []).some((report) => report.id === createdMonthlyReport.id),
    createdMonthlyReport.id
  );

  const monthlyReportDetail = await request(
    `/client-portal/projects/${createdAiProject.id}/monthly-reports/${createdMonthlyReport.id}`,
    { token: adminToken }
  );
  record(
    "client portal monthly report detail 200",
    monthlyReportDetail.status === 200 && monthlyReportDetail.body?.ok === true,
    `${monthlyReportDetail.status}`
  );
  record(
    "client portal monthly report detail includes workSummary",
    typeof monthlyReportDetail.body?.data?.workSummary === "object" &&
      monthlyReportDetail.body?.data?.workSummary !== null,
    "workSummary present"
  );
  record(
    "client portal monthly report detail includes recommendations",
    monthlyReportDetail.body?.data?.monthlyReport?.recommendationsText === "Smoke final client view recommendations.",
    "recommendations present"
  );
  record(
    "client portal monthly report detail no adminSummaryNotes",
    !JSON.stringify(monthlyReportDetail.body?.data ?? {}).includes("adminSummaryNotes"),
    "adminSummaryNotes absent"
  );
  record(
    "client portal monthly report detail no importedByUserId",
    !JSON.stringify(monthlyReportDetail.body?.data ?? {}).includes("importedByUserId"),
    "importedByUserId absent"
  );

  // ── 9. Deliverables list: DRAFT excluded — proves DELIVERED/ACCEPTED filter ──
  const afterLinkDeliverables = await request(
    `/client-portal/projects/${createdAiProject.id}/deliverables`,
    { token: adminToken }
  );
  record(
    "client portal deliverables 200 after ClientUserAccess",
    afterLinkDeliverables.status === 200 && afterLinkDeliverables.body?.ok === true,
    `${afterLinkDeliverables.status}`
  );
  const deliverablesList = afterLinkDeliverables.body?.data?.deliverables ?? null;
  record(
    "client portal deliverables returns array",
    Array.isArray(deliverablesList),
    Array.isArray(deliverablesList) ? `count=${deliverablesList.length}` : "not an array"
  );
  // DRAFT deliverable must not appear — proves status filter is active.
  const draftVisible = Array.isArray(deliverablesList) && deliverablesList.some(
    (d) => d.id === createdDraftDeliverable.id
  );
  record(
    "client portal DRAFT deliverable excluded from list",
    !draftVisible,
    draftVisible ? "DRAFT visible (unexpected)" : "DRAFT correctly excluded"
  );
  // No storageKey in any deliverable.
  record(
    "client portal deliverables no storageKey",
    !clientPortalResponseHasSensitiveFields(afterLinkDeliverables),
    "storageKey absent"
  );

  // ── 10. Download endpoint: DRAFT deliverable returns 404 ──────────────────
  const draftDownload = await request(
    `/client-portal/projects/${createdAiProject.id}/deliverables/${createdDraftDeliverable.id}/download`,
    { token: adminToken }
  );
  record(
    "client portal download DRAFT deliverable blocked 404",
    draftDownload.status === 404,
    `${draftDownload.status}`
  );
  record(
    "client portal download DRAFT response no storageKey",
    !clientPortalResponseHasSensitiveFields(draftDownload),
    "storageKey absent"
  );

  // ── 11. Cross-project access guard: random ID returns 404 ─────────────────
  const fakeProjectId = "00000000-0000-0000-0000-000000000000";
  const crossProjectDetail = await request(`/client-portal/projects/${fakeProjectId}`, { token: adminToken });
  record(
    "client portal fake project id returns 404",
    crossProjectDetail.status === 404,
    `${crossProjectDetail.status}`
  );
  const crossProjectDeliverables = await request(
    `/client-portal/projects/${fakeProjectId}/deliverables`,
    { token: adminToken }
  );
  record(
    "client portal fake project deliverables returns 404",
    crossProjectDeliverables.status === 404,
    `${crossProjectDeliverables.status}`
  );

  // ── 11b. Archived AI delivery project hidden from client portal ───────────
  requireOkData(
    "client portal archive ai delivery project",
    await request(`/ai-delivery-projects/${createdAiProject.id}/archive`, {
      method: "POST",
      token: adminToken
    }),
    200
  );

  const archivedProjectsList = await request("/client-portal/projects", { token: adminToken });
  const archivedProjects = archivedProjectsList.body?.data?.aiDeliveryProjects ?? [];
  record(
    "client portal archived project excluded from projects list",
    archivedProjectsList.status === 200 &&
      !archivedProjects.some((project) => project.id === createdAiProject.id),
    `${archivedProjects.length} projects`
  );

  const archivedProjectDetail = await request(`/client-portal/projects/${createdAiProject.id}`, { token: adminToken });
  record(
    "client portal archived project detail returns 404",
    archivedProjectDetail.status === 404,
    `${archivedProjectDetail.status}`
  );

  const archivedProjectDeliverables = await request(
    `/client-portal/projects/${createdAiProject.id}/deliverables`,
    { token: adminToken }
  );
  record(
    "client portal archived project deliverables returns 404",
    archivedProjectDeliverables.status === 404,
    `${archivedProjectDeliverables.status}`
  );

  const archivedProjectCatalog = await request(
    `/client-portal/projects/${createdAiProject.id}/catalog-products`,
    { token: adminToken }
  );
  record(
    "client portal archived project catalog products returns 404",
    archivedProjectCatalog.status === 404,
    `${archivedProjectCatalog.status}`
  );

  // ── 12. Optional: cross-tenant proof using second-tenant tester fixture ────
  if (testerEmail && testerPassword) {
    const testerLogin = await login(testerEmail, testerPassword);
    const testerToken = testerLogin.body?.data?.session?.token ?? null;
    record(
      "client portal cross-tenant tester login",
      testerLogin.status === 200 && typeof testerToken === "string",
      `${testerLogin.status}`
    );

    if (testerToken) {
      // Tester is in Tenant B. The AI delivery project belongs to Tenant A (admin).
      // Tester must not see Tenant A's project via the client portal.
      const testerProjects = await request("/client-portal/projects", { token: testerToken });
      const testerProjectList = testerProjects.body?.data?.aiDeliveryProjects ?? [];
      const tenantAProjectVisible = testerProjectList.some((p) => p.id === createdAiProject.id);
      record(
        "client portal cross-tenant project not visible to other-tenant tester",
        !tenantAProjectVisible,
        tenantAProjectVisible ? "Tenant A project visible to Tenant B (FAIL)" : "correctly blocked"
      );

      const testerDetail = await request(`/client-portal/projects/${createdAiProject.id}`, { token: testerToken });
      record(
        "client portal cross-tenant project detail blocked 404",
        testerDetail.status === 404,
        `${testerDetail.status}`
      );

      const testerDeliverables = await request(
        `/client-portal/projects/${createdAiProject.id}/deliverables`,
        { token: testerToken }
      );
      record(
        "client portal cross-tenant deliverables blocked 404",
        testerDeliverables.status === 404,
        `${testerDeliverables.status}`
      );
    }
  } else {
    record("client portal cross-tenant checks", true, "skipped - set AUTH_SEED_TESTER_EMAIL/PASSWORD on a second tenant to enable");
  }

  if (results.some((r) => !r.ok)) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`FAIL client portal smoke runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
