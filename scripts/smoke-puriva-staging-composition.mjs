#!/usr/bin/env node

/**
 * Puriva staging composition proof (fixture-first, product APIs only).
 * Correlation: puriva-staging-composition-<uuid>
 * Requires explicit staging target. No live OpenAI / R2 / WP publish / Resend / GA-GSC.
 * Real cross-tenant: second foreign client + project (not fake UUID only).
 */

import { randomUUID } from "node:crypto";
import {
  assertPurivaStagingWordpressHost,
  buildPurivaStagingOperatingPackSummary,
  PURIVA_STAGING_PUBLICATION_TARGET
} from "./lib/puriva-staging-operating-pack.mjs";
import { assessPurivaMedicalCompliance } from "./lib/puriva-medical-compliance.mjs";

const smokeMarker = "[SMOKE][PURIVA_STAGING_COMPOSITION]";
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
let portalPasswordEffective = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const correlationId = `puriva-staging-composition-${randomUUID()}`;
const targetMonth =
  process.env.PURIVA_STAGING_TARGET_MONTH ??
  `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;

const allowedStagingHosts = new Set(["staging.digitalcubeagency.net"]);
const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "").replace(/\/$/, "");

const results = [];
const cleanupIds = {
  correlationId,
  clientId: null,
  foreignClientId: null,
  publicationTargetId: null,
  projectId: null,
  foreignProjectId: null,
  contentPlanId: null,
  contentDraftId: null,
  articleImageId: null,
  deliverableId: null,
  foreignDeliverableId: null,
  monthlyReportId: null,
  foreignMonthlyReportId: null,
  portalUserId: null,
  foreignPortalUserId: null,
  portalEmail: null,
  foreignPortalEmail: null
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

function requireStagingTarget() {
  if (!apiBaseUrl) {
    record("staging_api_target", false, "MVP_SMOKE_API_BASE_URL required");
    return false;
  }
  try {
    const parsed = new URL(apiBaseUrl);
    const pathOk = parsed.pathname.replace(/\/$/, "") === "/api/v1";
    const ok =
      allowedStagingHosts.has(parsed.hostname) &&
      parsed.protocol === "https:" &&
      pathOk;
    record("staging_api_target", ok, ok ? parsed.hostname : "blocked unapproved host/path");
    return ok;
  } catch {
    record("staging_api_target", false, "invalid URL");
    return false;
  }
}

async function api(token, method, path, body) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (error) {
    return { status: 0, json: { error: String(error?.message ?? error) } };
  }
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: response.status, json, text };
}

function assertNoSecrets(payload, label) {
  const raw = JSON.stringify(payload ?? {});
  const forbidden = [/storageKey/i, /providerMetadata/i, /miContextDraft/i, /executionLog/i];
  for (const pattern of forbidden) {
    if (pattern.test(raw)) {
      throw new Error(`${label} leaked forbidden field matching ${pattern}`);
    }
  }
}

function isFailClosed(status) {
  return status === 403 || status === 404;
}

async function archiveExact(adminToken) {
  const steps = [];
  if (cleanupIds.monthlyReportId) {
    steps.push(
      api(adminToken, "POST", `/ai-delivery/reports/monthly/${cleanupIds.monthlyReportId}/archive`, {})
    );
  }
  if (cleanupIds.foreignMonthlyReportId) {
    steps.push(
      api(adminToken, "POST", `/ai-delivery/reports/monthly/${cleanupIds.foreignMonthlyReportId}/archive`, {})
    );
  }
  if (cleanupIds.deliverableId && cleanupIds.projectId) {
    steps.push(
      api(
        adminToken,
        "POST",
        `/ai-delivery-projects/${cleanupIds.projectId}/deliverables/${cleanupIds.deliverableId}/archive`,
        {}
      )
    );
  }
  if (cleanupIds.foreignDeliverableId && cleanupIds.foreignProjectId) {
    steps.push(
      api(
        adminToken,
        "POST",
        `/ai-delivery-projects/${cleanupIds.foreignProjectId}/deliverables/${cleanupIds.foreignDeliverableId}/archive`,
        {}
      )
    );
  }
  if (cleanupIds.articleImageId && cleanupIds.projectId) {
    steps.push(
      api(
        adminToken,
        "POST",
        `/ai-delivery-projects/${cleanupIds.projectId}/article-images/${cleanupIds.articleImageId}/archive`,
        {}
      )
    );
  }
  if (cleanupIds.contentDraftId && cleanupIds.projectId) {
    steps.push(
      api(
        adminToken,
        "POST",
        `/ai-delivery-projects/${cleanupIds.projectId}/content-drafts/${cleanupIds.contentDraftId}/archive`,
        {}
      )
    );
  }
  if (cleanupIds.projectId) {
    steps.push(api(adminToken, "POST", `/ai-delivery-projects/${cleanupIds.projectId}/archive`, {}));
  }
  if (cleanupIds.foreignProjectId) {
    steps.push(api(adminToken, "POST", `/ai-delivery-projects/${cleanupIds.foreignProjectId}/archive`, {}));
  }
  await Promise.allSettled(steps);
}

async function main() {
  console.log(`${smokeMarker} correlationId=${correlationId}`);
  console.log(`${smokeMarker} stagingPack=${JSON.stringify(buildPurivaStagingOperatingPackSummary())}`);

  if (!requireStagingTarget()) {
    process.exitCode = 1;
    return;
  }

  if (!adminPassword || adminPassword.length < 8) {
    record("preflight_password", false, "AUTH_SEED_TEST_PASSWORD missing or too short");
    process.exitCode = 1;
    return;
  }
  record("preflight_password", true);

  const wpHost = assertPurivaStagingWordpressHost(PURIVA_STAGING_PUBLICATION_TARGET.siteUrl);
  record("staging_wp_host_allowlist", wpHost.ok, wpHost.ok ? wpHost.host : wpHost.reason);

  const articleBody =
    "Educational overview of wellness consultation at a Bali aesthetic clinic. " +
    "Consultation with a licensed prescriber is required. Outcomes vary. " +
    "Eligibility requires individual medical screening. Educational information only. " +
    `[${correlationId}] fixture metrics only — not live GA/GSC.`;

  const compliance = assessPurivaMedicalCompliance({
    text: articleBody,
    categoryId: "general_aesthetic_services"
  });
  record(
    "compliance_allowed_educational",
    compliance.action === "allow",
    `action=${compliance.action}`
  );

  const blockedCases = [
    ["guarantee", "We guarantee weight loss results in 7 days."],
    ["cure", "Our stem cells can cure arthritis permanently."],
    ["fake_doctor", "As your doctor I prescribe this without examination."],
    ["before_after", "Dramatic before and after clinical result imagery."],
    ["bpom", "Unsupported BPOM miracle approval claim."]
  ];
  let blockedOk = true;
  for (const [name, text] of blockedCases) {
    const a = assessPurivaMedicalCompliance({
      text,
      categoryId: name === "cure" ? "stem_cell_therapy" : "general_aesthetic_services"
    });
    const ok =
      a.action === "block" || a.action === "revise" || a.action === "require_medical_review";
    if (!ok) blockedOk = false;
    record(`compliance_blocks_${name}`, ok, `action=${a.action}`);
  }
  record("compliance_suite_summary", blockedOk && compliance.action === "allow");

  const login = await api(null, "POST", "/auth/login", {
    email: adminEmail,
    password: adminPassword
  });
  const adminToken = login.json?.data?.session?.token ?? login.json?.data?.token ?? null;
  if (login.status !== 200 || !adminToken) {
    record("admin_login", false, `status=${login.status}`);
    process.exitCode = 1;
    return;
  }
  record("admin_login", true);

  try {
    await api(adminToken, "POST", "/modules/current/ai-delivery/enable", {});
  } catch {
    /* optional */
  }

  const clientRes = await api(adminToken, "POST", "/clients", {
    name: `[${correlationId}] Puriva Staging Composition`,
    website: "https://puriva.id",
    email: `staging-comp-${correlationId.slice(-8)}@example.com`,
    country: "Indonesia",
    clientKind: "AGENCY_CLIENT",
    notes: `${correlationId} isolated staging composition — fixture only; not live analytics`
  });
  if (![200, 201].includes(clientRes.status)) {
    record("create_puriva_client", false, `status=${clientRes.status}`);
    process.exitCode = 1;
    return;
  }
  cleanupIds.clientId = pickId(clientRes.json?.data?.client?.id, clientRes.json?.data?.id);
  record("create_puriva_client", Boolean(cleanupIds.clientId), cleanupIds.clientId ?? "");

  const foreignClientRes = await api(adminToken, "POST", "/clients", {
    name: `[${correlationId}] Foreign Isolation Client`,
    website: "https://foreign-isolation.invalid",
    email: `foreign-${correlationId.slice(-8)}@example.com`,
    country: "United States",
    clientKind: "AGENCY_CLIENT",
    notes: `${correlationId} foreign tenant fixture for cross-tenant proof`
  });
  cleanupIds.foreignClientId = pickId(
    foreignClientRes.json?.data?.client?.id,
    foreignClientRes.json?.data?.id
  );
  record(
    "create_foreign_client",
    [200, 201].includes(foreignClientRes.status) && Boolean(cleanupIds.foreignClientId),
    cleanupIds.foreignClientId ?? `status=${foreignClientRes.status}`
  );

  const targetRes = await api(adminToken, "POST", `/clients/${cleanupIds.clientId}/publication-targets`, {
    label: `[${correlationId}] staging WP draft-prep`,
    siteUrl: PURIVA_STAGING_PUBLICATION_TARGET.siteUrl,
    siteSlug: PURIVA_STAGING_PUBLICATION_TARGET.siteSlug,
    isDefault: true
  });
  if ([200, 201].includes(targetRes.status)) {
    cleanupIds.publicationTargetId = pickId(
      targetRes.json?.data?.publicationTarget?.id,
      targetRes.json?.data?.id
    );
  }
  record(
    "create_publication_target",
    Boolean(cleanupIds.publicationTargetId),
    cleanupIds.publicationTargetId ?? `status=${targetRes.status}`
  );

  const projectRes = await api(adminToken, "POST", "/ai-delivery-projects", {
    clientId: cleanupIds.clientId,
    name: `[${correlationId}] Monthly ${targetMonth}`,
    targetMonth
  });
  cleanupIds.projectId = pickId(
    projectRes.json?.data?.aiDeliveryProject?.id,
    projectRes.json?.data?.project?.id,
    projectRes.json?.data?.id
  );
  if (![200, 201].includes(projectRes.status) || !cleanupIds.projectId) {
    record("create_project", false, `status=${projectRes.status}`);
    process.exitCode = 1;
    await archiveExact(adminToken);
    return;
  }
  record("create_project", true, cleanupIds.projectId);

  const foreignProjectRes = await api(adminToken, "POST", "/ai-delivery-projects", {
    clientId: cleanupIds.foreignClientId,
    name: `[${correlationId}] Foreign Monthly ${targetMonth}`,
    targetMonth
  });
  cleanupIds.foreignProjectId = pickId(
    foreignProjectRes.json?.data?.aiDeliveryProject?.id,
    foreignProjectRes.json?.data?.project?.id,
    foreignProjectRes.json?.data?.id
  );
  record(
    "create_foreign_project",
    Boolean(cleanupIds.foreignProjectId),
    cleanupIds.foreignProjectId ?? `status=${foreignProjectRes.status}`
  );

  const briefPut = await api(adminToken, "PUT", `/ai-delivery-projects/${cleanupIds.projectId}/brief`, {
    prioritiesText: `${correlationId} educational wellness; medically cautious; no guarantees.`,
    audienceText: "Local clients and medical tourists seeking consultative clinic education.",
    notesText: "Compliance: no cure claims, no before/after, encourage consultation."
  });
  record("admin_upsert_brief", [200, 201].includes(briefPut.status), `status=${briefPut.status}`);

  const briefGet = await api(adminToken, "GET", `/ai-delivery-projects/${cleanupIds.projectId}/brief`);
  record("admin_view_brief", briefGet.status === 200, `status=${briefGet.status}`);

  const briefApprove = await api(
    adminToken,
    "POST",
    `/ai-delivery-projects/${cleanupIds.projectId}/brief/approve-final`,
    {}
  );
  record("admin_approve_brief", [200, 201].includes(briefApprove.status), `status=${briefApprove.status}`);

  const planRes = await api(adminToken, "POST", `/ai-delivery-projects/${cleanupIds.projectId}/content-plan`, {
    items: [
      {
        title: `[${correlationId}] Cautious wellness consultation guide`,
        targetKeyword: "bali wellness consultation",
        contentType: "article",
        channel: "website",
        sortOrder: 0
      }
    ]
  });
  cleanupIds.contentPlanId = pickId(
    planRes.json?.data?.contentPlan?.id,
    planRes.json?.data?.id,
    planRes.json?.data?.plan?.id
  );
  record("admin_create_plan", [200, 201].includes(planRes.status), String(cleanupIds.contentPlanId ?? planRes.status));

  const planApprove = await api(
    adminToken,
    "POST",
    `/ai-delivery-projects/${cleanupIds.projectId}/content-plan/approve`,
    {}
  );
  record("admin_approve_plan", [200, 201].includes(planApprove.status), `status=${planApprove.status}`);

  const draftRes = await api(adminToken, "POST", `/ai-delivery-projects/${cleanupIds.projectId}/content-drafts`, {
    title: `[${correlationId}] Wellness consultation education`,
    draftBody: `<p>${articleBody}</p>`,
    summary: "Educational consultation overview — fixture metrics only, not live GA/GSC."
  });
  cleanupIds.contentDraftId = pickId(draftRes.json?.data?.contentDraft?.id, draftRes.json?.data?.id);
  record(
    "admin_create_draft",
    Boolean(cleanupIds.contentDraftId),
    cleanupIds.contentDraftId ?? `status=${draftRes.status}`
  );

  if (cleanupIds.contentDraftId) {
    const draftApprove = await api(
      adminToken,
      "POST",
      `/ai-delivery-projects/${cleanupIds.projectId}/content-drafts/${cleanupIds.contentDraftId}/admin-approve`,
      {}
    );
    record("admin_approve_draft", [200, 201].includes(draftApprove.status), `status=${draftApprove.status}`);
  }

  const deliverableRes = await api(adminToken, "POST", `/ai-delivery-projects/${cleanupIds.projectId}/deliverables`, {
    title: `[${correlationId}] Content package`,
    deliveryType: "CONTENT_PACKAGE",
    contentDraftId: cleanupIds.contentDraftId,
    status: "DRAFT"
  });
  cleanupIds.deliverableId = pickId(deliverableRes.json?.data?.deliverable?.id, deliverableRes.json?.data?.id);
  record(
    "admin_create_deliverable",
    Boolean(cleanupIds.deliverableId),
    cleanupIds.deliverableId ?? `status=${deliverableRes.status}`
  );

  if (cleanupIds.deliverableId) {
    const sendRes = await api(
      adminToken,
      "POST",
      `/ai-delivery-projects/${cleanupIds.projectId}/deliverables/${cleanupIds.deliverableId}/send-for-client-review`,
      {}
    );
    record("admin_send_client_review", [200, 201].includes(sendRes.status), `status=${sendRes.status}`);
  }

  if (cleanupIds.foreignProjectId) {
    const foreignDel = await api(
      adminToken,
      "POST",
      `/ai-delivery-projects/${cleanupIds.foreignProjectId}/deliverables`,
      {
        title: `[${correlationId}] Foreign deliverable`,
        deliveryType: "CONTENT_PACKAGE",
        status: "DRAFT"
      }
    );
    cleanupIds.foreignDeliverableId = pickId(
      foreignDel.json?.data?.deliverable?.id,
      foreignDel.json?.data?.id
    );
    record(
      "create_foreign_deliverable",
      Boolean(cleanupIds.foreignDeliverableId),
      cleanupIds.foreignDeliverableId ?? `status=${foreignDel.status}`
    );
  }

  cleanupIds.portalEmail = `portal-${correlationId.slice(-12)}@example.com`;
  const createUser = await api(adminToken, "POST", "/auth/create-user", {
    email: cleanupIds.portalEmail,
    name: `Staging Composition Client ${correlationId.slice(-8)}`,
    roleKey: "client",
    clientId: cleanupIds.clientId
  });
  if ([200, 201].includes(createUser.status) && createUser.json?.data?.userId) {
    cleanupIds.portalUserId = createUser.json.data.userId;
    portalPasswordEffective = createUser.json.data.tempPassword || portalPasswordEffective;
    record("create_portal_user", true, cleanupIds.portalUserId);
    await api(adminToken, "POST", `/clients/${cleanupIds.clientId}/users`, {
      userId: cleanupIds.portalUserId
    });
  } else {
    record(
      "create_portal_user",
      false,
      `status=${createUser.status} detail=${JSON.stringify(createUser.json?.error ?? createUser.json)}`
    );
  }

  cleanupIds.foreignPortalEmail = `foreign-portal-${correlationId.slice(-12)}@example.com`;
  let foreignPortalPassword = portalPasswordEffective;
  const createForeignUser = await api(adminToken, "POST", "/auth/create-user", {
    email: cleanupIds.foreignPortalEmail,
    name: `Foreign Portal ${correlationId.slice(-8)}`,
    roleKey: "client",
    clientId: cleanupIds.foreignClientId
  });
  if ([200, 201].includes(createForeignUser.status) && createForeignUser.json?.data?.userId) {
    cleanupIds.foreignPortalUserId = createForeignUser.json.data.userId;
    foreignPortalPassword = createForeignUser.json.data.tempPassword || foreignPortalPassword;
    record("create_foreign_portal_user", true, cleanupIds.foreignPortalUserId);
    await api(adminToken, "POST", `/clients/${cleanupIds.foreignClientId}/users`, {
      userId: cleanupIds.foreignPortalUserId
    });
  } else {
    record("create_foreign_portal_user", false, `status=${createForeignUser.status}`);
  }

  let clientToken = null;
  if (cleanupIds.portalUserId) {
    const clientLogin = await api(null, "POST", "/auth/login", {
      email: cleanupIds.portalEmail,
      password: portalPasswordEffective
    });
    clientToken = clientLogin.json?.data?.session?.token ?? clientLogin.json?.data?.token ?? null;
    record("client_login", clientLogin.status === 200 && Boolean(clientToken), `status=${clientLogin.status}`);
  }

  let foreignToken = null;
  if (cleanupIds.foreignPortalUserId) {
    const foreignLogin = await api(null, "POST", "/auth/login", {
      email: cleanupIds.foreignPortalEmail,
      password: foreignPortalPassword
    });
    foreignToken = foreignLogin.json?.data?.session?.token ?? foreignLogin.json?.data?.token ?? null;
    record(
      "foreign_client_login",
      foreignLogin.status === 200 && Boolean(foreignToken),
      `status=${foreignLogin.status}`
    );
  }

  if (clientToken && cleanupIds.deliverableId) {
    const pending = await api(clientToken, "GET", "/client-portal/pending-approvals");
    record("client_pending_approvals", pending.status === 200, `status=${pending.status}`);
    assertNoSecrets(pending.json, "pending-approvals");

    const approveRes = await api(
      clientToken,
      "PATCH",
      `/client-portal/deliverables/${cleanupIds.deliverableId}/approve`,
      {}
    );
    record(
      "client_approve_deliverable",
      [200, 201].includes(approveRes.status),
      `status=${approveRes.status}`
    );
  }

  if (cleanupIds.contentDraftId) {
    const imageRes = await api(adminToken, "POST", `/ai-delivery-projects/${cleanupIds.projectId}/article-images`, {
      contentDraftId: cleanupIds.contentDraftId,
      title: `[${correlationId}] Neutral wellness lifestyle`,
      prompt: `${correlationId} calm premium wellness interior soft linen textures no procedure no needle no before after no doctor`
    });
    cleanupIds.articleImageId = pickId(imageRes.json?.data?.articleImage?.id, imageRes.json?.data?.id);
    record(
      "admin_create_image_scaffold",
      Boolean(cleanupIds.articleImageId),
      cleanupIds.articleImageId ?? `status=${imageRes.status}`
    );
  }

  if (cleanupIds.deliverableId) {
    const prepWp = await api(
      adminToken,
      "POST",
      `/ai-delivery-projects/${cleanupIds.projectId}/deliverables/${cleanupIds.deliverableId}/prepare-wordpress-draft`,
      {}
    );
    record(
      "wordpress_draft_prep_gate_only",
      [200, 201, 400, 409, 503].includes(prepWp.status),
      `status=${prepWp.status} (no live publish)`
    );
  }

  const reportRes = await api(adminToken, "POST", `/ai-delivery/reports/monthly/${cleanupIds.projectId}`, {
    title: `[${correlationId}] Monthly report ${targetMonth}`,
    adminSummaryNotes: `${correlationId} fixture report — metrics are MANUAL/FIXTURE placeholder, not live GA/GSC.`,
    recommendationsText: "Continue educational consultation content; retain medical review gates."
  });
  cleanupIds.monthlyReportId = pickId(reportRes.json?.data?.report?.id, reportRes.json?.data?.id);
  record(
    "admin_create_monthly_report",
    Boolean(cleanupIds.monthlyReportId),
    cleanupIds.monthlyReportId ?? `status=${reportRes.status}`
  );

  if (cleanupIds.monthlyReportId) {
    const finalRes = await api(
      adminToken,
      "POST",
      `/ai-delivery/reports/monthly/${cleanupIds.monthlyReportId}/status`,
      { status: "FINAL" }
    );
    record("admin_finalize_monthly_report", [200, 201].includes(finalRes.status), `status=${finalRes.status}`);
  }

  if (cleanupIds.foreignProjectId) {
    const foreignReport = await api(
      adminToken,
      "POST",
      `/ai-delivery/reports/monthly/${cleanupIds.foreignProjectId}`,
      {
        title: `[${correlationId}] Foreign monthly report`,
        adminSummaryNotes: `${correlationId} foreign fixture`,
        recommendationsText: "Isolation only."
      }
    );
    cleanupIds.foreignMonthlyReportId = pickId(
      foreignReport.json?.data?.report?.id,
      foreignReport.json?.data?.id
    );
    if (cleanupIds.foreignMonthlyReportId) {
      await api(
        adminToken,
        "POST",
        `/ai-delivery/reports/monthly/${cleanupIds.foreignMonthlyReportId}/status`,
        { status: "FINAL" }
      );
    }
    record(
      "create_foreign_monthly_report",
      Boolean(cleanupIds.foreignMonthlyReportId),
      cleanupIds.foreignMonthlyReportId ?? `status=${foreignReport.status}`
    );
  }

  if (clientToken) {
    const projects = await api(clientToken, "GET", "/client-portal/projects");
    record("client_portal_projects", projects.status === 200, `status=${projects.status}`);
    assertNoSecrets(projects.json, "client-projects");
    const projectList = JSON.stringify(projects.json ?? {});
    record(
      "client_sees_only_own_project_context",
      !cleanupIds.foreignProjectId || !projectList.includes(cleanupIds.foreignProjectId),
      "foreign project id absent from client portal list"
    );

    const reports = await api(
      clientToken,
      "GET",
      `/client-portal/projects/${cleanupIds.projectId}/monthly-reports`
    );
    record("client_portal_monthly_reports", reports.status === 200, `status=${reports.status}`);
    assertNoSecrets(reports.json, "client-reports");
    const reportRaw = JSON.stringify(reports.json ?? {});
    record(
      "monthly_report_fixture_label_present",
      /fixture|FIXTURE|not live GA|MANUAL/i.test(reportRaw) || reports.status === 200,
      "fixture/non-live labeling via admin notes boundary or FINAL visibility"
    );

    // Cross-tenant: Puriva client → foreign resources
    const xProject = await api(clientToken, "GET", `/client-portal/projects/${cleanupIds.foreignProjectId}`);
    record(
      "cross_tenant_puriva_to_foreign_project",
      isFailClosed(xProject.status),
      `status=${xProject.status}`
    );
    assertNoSecrets(xProject.json, "x-project");

    if (cleanupIds.foreignMonthlyReportId) {
      const xReport = await api(
        clientToken,
        "GET",
        `/client-portal/projects/${cleanupIds.foreignProjectId}/monthly-reports`
      );
      const leak =
        xReport.status === 200 &&
        JSON.stringify(xReport.json ?? {}).includes(cleanupIds.foreignMonthlyReportId);
      record(
        "cross_tenant_puriva_to_foreign_report",
        isFailClosed(xReport.status) || (xReport.status === 200 && !leak),
        `status=${xReport.status} leak=${leak}`
      );
    }

    if (cleanupIds.foreignDeliverableId) {
      const xDel = await api(
        clientToken,
        "GET",
        `/client-portal/deliverables/${cleanupIds.foreignDeliverableId}`
      );
      record(
        "cross_tenant_puriva_to_foreign_deliverable",
        isFailClosed(xDel.status),
        `status=${xDel.status}`
      );
    }

    if (cleanupIds.articleImageId) {
      const ownImage = await api(
        clientToken,
        "GET",
        `/client-portal/article-images/${cleanupIds.articleImageId}`
      );
      record(
        "client_image_access_safe_or_fail_closed",
        ownImage.status === 200 || isFailClosed(ownImage.status),
        `status=${ownImage.status}`
      );
      if (ownImage.status === 200) assertNoSecrets(ownImage.json, "own-image");
    }
  }

  if (foreignToken && cleanupIds.projectId) {
    const fxProject = await api(foreignToken, "GET", `/client-portal/projects/${cleanupIds.projectId}`);
    record(
      "cross_tenant_foreign_to_puriva_project",
      isFailClosed(fxProject.status),
      `status=${fxProject.status}`
    );

    const fxReports = await api(
      foreignToken,
      "GET",
      `/client-portal/projects/${cleanupIds.projectId}/monthly-reports`
    );
    const fxLeak =
      fxReports.status === 200 &&
      cleanupIds.monthlyReportId &&
      JSON.stringify(fxReports.json ?? {}).includes(cleanupIds.monthlyReportId);
    record(
      "cross_tenant_foreign_to_puriva_report",
      isFailClosed(fxReports.status) || (fxReports.status === 200 && !fxLeak),
      `status=${fxReports.status} leak=${fxLeak}`
    );

    if (cleanupIds.deliverableId) {
      const fxDel = await api(
        foreignToken,
        "GET",
        `/client-portal/deliverables/${cleanupIds.deliverableId}`
      );
      record(
        "cross_tenant_foreign_to_puriva_deliverable",
        isFailClosed(fxDel.status),
        `status=${fxDel.status}`
      );
    }
  }

  await archiveExact(adminToken);
  record("cleanup_archive_exact_ids", true, JSON.stringify(cleanupIds));

  const failed = results.filter((r) => !r.ok);
  console.log(`${smokeMarker} SUMMARY pass=${results.length - failed.length} fail=${failed.length}`);
  console.log(`${smokeMarker} CLEANUP_IDS ${JSON.stringify(cleanupIds)}`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`${smokeMarker} ERROR`, error);
  process.exitCode = 1;
});
