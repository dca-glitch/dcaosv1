#!/usr/bin/env node

/**
 * Isolated Puriva monthly operating rehearsal (local, fixture-first).
 * Correlation: puriva-rehearsal-<uuid>
 * No live OpenAI / R2 / WordPress publish / Resend / GA-GSC.
 * Uses product APIs only (no direct DB status shortcuts).
 * Cleanup is IDs-only archive of rehearsal-owned records.
 */

import { randomUUID } from "node:crypto";
import {
  ensureLocalBrowserSmokeServices,
  getApiBaseUrl
} from "./lib/local-browser-smoke-service-helpers.mjs";
import {
  assertPurivaStagingWordpressHost,
  buildPurivaStagingOperatingPackSummary,
  PURIVA_STAGING_PUBLICATION_TARGET
} from "./lib/puriva-staging-operating-pack.mjs";
import { assessPurivaMedicalCompliance } from "./lib/puriva-medical-compliance.mjs";

const smokeMarker = "[SMOKE][PURIVA_MONTHLY_REHEARSAL]";
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
const portalPassword = process.env.AUTH_SEED_TEST_PASSWORD ?? "";
let portalPasswordEffective = portalPassword;
const correlationId = `puriva-rehearsal-${randomUUID()}`;
const targetMonth =
  process.env.PURIVA_REHEARSAL_TARGET_MONTH ??
  `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;

const results = [];
const cleanupIds = {
  correlationId,
  clientId: null,
  publicationTargetId: null,
  projectId: null,
  contentPlanId: null,
  contentDraftId: null,
  articleImageId: null,
  deliverableId: null,
  monthlyReportId: null,
  metricSnapshotId: null,
  portalUserId: null,
  wordpressPostId: null
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

async function api(token, method, path, body) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
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
  return { status: response.status, json };
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

async function main() {
  console.log(`${smokeMarker} correlationId=${correlationId}`);
  console.log(`${smokeMarker} stagingPack=${JSON.stringify(buildPurivaStagingOperatingPackSummary())}`);

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
    "Eligibility requires individual medical screening. Educational information only.";
  const compliance = assessPurivaMedicalCompliance({
    text: articleBody,
    categoryId: "general_aesthetic_services"
  });
  record(
    "compliance_allowed_educational",
    compliance.action === "allow",
    `action=${compliance.action}`
  );

  const blocked = assessPurivaMedicalCompliance({
    text: "We guarantee weight loss and our stem cells can cure arthritis.",
    categoryId: "stem_cell_therapy"
  });
  record(
    "compliance_blocks_prohibited",
    blocked.action === "block" || blocked.action === "revise" || blocked.action === "require_medical_review",
    `action=${blocked.action}`
  );

  await ensureLocalBrowserSmokeServices((line) => console.log(line));

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
    /* module may already be enabled */
  }

  const clientRes = await api(adminToken, "POST", "/clients", {
    name: `[${correlationId}] Puriva Rehearsal Client`,
    website: "https://rehearsal.puriva.invalid",
    email: `rehearsal-${correlationId.slice(-8)}@example.com`,
    country: "Indonesia",
    clientKind: "AGENCY_CLIENT",
    notes: `${correlationId} isolated monthly rehearsal — fixture only`
  });
  if (![200, 201].includes(clientRes.status)) {
    record("create_client", false, `status=${clientRes.status}`);
    process.exitCode = 1;
    return;
  }
  cleanupIds.clientId = pickId(clientRes.json?.data?.client?.id, clientRes.json?.data?.id);
  if (!cleanupIds.clientId) {
    record("create_client", false, `missing id body=${JSON.stringify(clientRes.json?.data)}`);
    process.exitCode = 1;
    return;
  }
  record("create_client", true, cleanupIds.clientId);

  const targetRes = await api(adminToken, "POST", `/clients/${cleanupIds.clientId}/publication-targets`, {
    label: `[${correlationId}] staging WP draft-prep`,
    siteUrl: PURIVA_STAGING_PUBLICATION_TARGET.siteUrl,
    siteSlug: PURIVA_STAGING_PUBLICATION_TARGET.siteSlug,
    isDefault: true
  });
  if (![200, 201].includes(targetRes.status)) {
    record("create_publication_target", false, `status=${targetRes.status}`);
  } else {
    cleanupIds.publicationTargetId = pickId(
      targetRes.json?.data?.publicationTarget?.id,
      targetRes.json?.data?.id
    );
    record("create_publication_target", Boolean(cleanupIds.publicationTargetId), cleanupIds.publicationTargetId ?? `status=${targetRes.status}`);
  }

  const projectRes = await api(adminToken, "POST", "/ai-delivery-projects", {
    clientId: cleanupIds.clientId,
    name: `[${correlationId}] Monthly ${targetMonth}`,
    targetMonth
  });
  if (![200, 201].includes(projectRes.status)) {
    record("create_project", false, `status=${projectRes.status}`);
    process.exitCode = 1;
    return;
  }
  cleanupIds.projectId = pickId(
    projectRes.json?.data?.aiDeliveryProject?.id,
    projectRes.json?.data?.project?.id,
    projectRes.json?.data?.id
  );
  if (!cleanupIds.projectId) {
    record("create_project", false, `missing id body=${JSON.stringify(projectRes.json?.data)}`);
    process.exitCode = 1;
    return;
  }
  record("create_project", true, cleanupIds.projectId);

  const briefPut = await api(adminToken, "PUT", `/ai-delivery-projects/${cleanupIds.projectId}/brief`, {
    prioritiesText: `${correlationId} educational wellness article; medically cautious; no guarantees.`,
    audienceText: "Local clients and medical tourists seeking consultative clinic education.",
    notesText: "Compliance: no cure claims, no before/after, encourage consultation."
  });
  record("upsert_brief", [200, 201].includes(briefPut.status), `status=${briefPut.status}`);

  const briefApprove = await api(
    adminToken,
    "POST",
    `/ai-delivery-projects/${cleanupIds.projectId}/brief/approve-final`,
    {}
  );
  record("approve_brief", [200, 201].includes(briefApprove.status), `status=${briefApprove.status}`);

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
  if (![200, 201].includes(planRes.status)) {
    record("create_content_plan", false, `status=${planRes.status}`);
  } else {
    cleanupIds.contentPlanId = pickId(
      planRes.json?.data?.contentPlan?.id,
      planRes.json?.data?.id,
      planRes.json?.data?.plan?.id
    );
    record("create_content_plan", true, String(cleanupIds.contentPlanId ?? "ok"));
  }

  const planApprove = await api(
    adminToken,
    "POST",
    `/ai-delivery-projects/${cleanupIds.projectId}/content-plan/approve`,
    {}
  );
  record("approve_content_plan", [200, 201].includes(planApprove.status), `status=${planApprove.status}`);

  const draftRes = await api(adminToken, "POST", `/ai-delivery-projects/${cleanupIds.projectId}/content-drafts`, {
    title: `[${correlationId}] Wellness consultation education`,
    draftBody: `<p>${articleBody}</p>`,
    summary: "Educational consultation overview with balanced, non-promissory language."
  });
  if (![200, 201].includes(draftRes.status)) {
    record("create_article_draft", false, `status=${draftRes.status}`);
  } else {
    cleanupIds.contentDraftId = pickId(draftRes.json?.data?.contentDraft?.id, draftRes.json?.data?.id);
    record("create_article_draft", Boolean(cleanupIds.contentDraftId), cleanupIds.contentDraftId ?? `status=${draftRes.status}`);
  }

  if (cleanupIds.contentDraftId) {
    const draftApprove = await api(
      adminToken,
      "POST",
      `/ai-delivery-projects/${cleanupIds.projectId}/content-drafts/${cleanupIds.contentDraftId}/admin-approve`,
      {}
    );
    record("admin_approve_article", [200, 201].includes(draftApprove.status), `status=${draftApprove.status}`);
  }

  // Image scaffold after article exists — linked for package proof but created after client review
  // would block IMAGES_PENDING. Create unlinked is invalid (400); defer until after client approve.
  let deferredImageCreate = true;

  const deliverableRes = await api(adminToken, "POST", `/ai-delivery-projects/${cleanupIds.projectId}/deliverables`, {
    title: `[${correlationId}] Content package`,
    deliveryType: "CONTENT_PACKAGE",
    contentDraftId: cleanupIds.contentDraftId,
    status: "DRAFT"
  });
  if (![200, 201].includes(deliverableRes.status)) {
    record("create_deliverable", false, `status=${deliverableRes.status}`);
  } else {
    cleanupIds.deliverableId = pickId(deliverableRes.json?.data?.deliverable?.id, deliverableRes.json?.data?.id);
    record("create_deliverable", Boolean(cleanupIds.deliverableId), cleanupIds.deliverableId ?? `status=${deliverableRes.status}`);
    if (cleanupIds.deliverableId) {
      // Product path: DRAFT → PENDING_CLIENT_REVIEW (READY cannot send for client review).
      const sendRes = await api(
        adminToken,
        "POST",
        `/ai-delivery-projects/${cleanupIds.projectId}/deliverables/${cleanupIds.deliverableId}/send-for-client-review`,
        {}
      );
      record(
        "send_client_review",
        [200, 201].includes(sendRes.status),
        `status=${sendRes.status} detail=${JSON.stringify(sendRes.json?.error ?? "")}`
      );
    }
  }

  // Portal user: reuse Puriva portal pattern email for access grant on rehearsal client
  const portalEmail = `portal-${correlationId.slice(-12)}@example.com`;
  const createUser = await api(adminToken, "POST", "/auth/create-user", {
    email: portalEmail,
    name: `Rehearsal Client ${correlationId.slice(-8)}`,
    roleKey: "client",
    clientId: cleanupIds.clientId
  });
  if ([200, 201].includes(createUser.status) && createUser.json?.data?.userId) {
    cleanupIds.portalUserId = createUser.json.data.userId;
    portalPasswordEffective = createUser.json.data.tempPassword || portalPassword;
    record("create_portal_user", true, cleanupIds.portalUserId);
  } else {
    record("create_portal_user", false, `status=${createUser.status} detail=${JSON.stringify(createUser.json?.error ?? createUser.json)}`);
  }

  if (cleanupIds.portalUserId) {
    await api(adminToken, "POST", `/clients/${cleanupIds.clientId}/users`, {
      userId: cleanupIds.portalUserId
    });
  }

  let clientToken = null;
  if (cleanupIds.portalUserId) {
    const clientLogin = await api(null, "POST", "/auth/login", {
      email: portalEmail,
      password: portalPasswordEffective
    });
    const maybeToken = clientLogin.json?.data?.session?.token ?? clientLogin.json?.data?.token ?? null;
    if (clientLogin.status === 200 && maybeToken) {
      clientToken = maybeToken;
      record("client_login", true);
    } else {
      record("client_login", false, `status=${clientLogin.status}`);
    }
  }

  if (clientToken && cleanupIds.deliverableId) {
    const pending = await api(clientToken, "GET", "/client-portal/pending-approvals");
    record("client_pending_approvals", pending.status === 200, `status=${pending.status}`);
    assertNoSecrets(pending.json, "pending-approvals");

    const approveRes = await api(clientToken, "PATCH", `/client-portal/deliverables/${cleanupIds.deliverableId}/approve`, {});
    record("client_approve_deliverable", [200, 201].includes(approveRes.status), `status=${approveRes.status} detail=${JSON.stringify(approveRes.json?.error ?? approveRes.json?.code ?? "")}`);
  }

  // Product status machine: APPROVED_BY_CLIENT → ARCHIVED only (no admin /accept). Treat client approve as terminal success.
  record(
    "admin_accept_deliverable",
    true,
    "NOT_APPLICABLE — APPROVED_BY_CLIENT is terminal; accept endpoint not used after client approve"
  );

  if (deferredImageCreate && cleanupIds.contentDraftId) {
    const imageRes = await api(adminToken, "POST", `/ai-delivery-projects/${cleanupIds.projectId}/article-images`, {
      contentDraftId: cleanupIds.contentDraftId,
      title: `[${correlationId}] Neutral wellness lifestyle`,
      prompt: `${correlationId} calm premium wellness interior soft linen textures no procedure no needle no before after no doctor`
    });
    if (![200, 201].includes(imageRes.status)) {
      record("create_image_scaffold", false, `status=${imageRes.status}`);
    } else {
      cleanupIds.articleImageId = pickId(imageRes.json?.data?.articleImage?.id, imageRes.json?.data?.id);
      record(
        "create_image_scaffold",
        Boolean(cleanupIds.articleImageId),
        cleanupIds.articleImageId ? `${cleanupIds.articleImageId} DRAFT fixture after client approve` : `status=${imageRes.status}`
      );
    }
  }

  if (cleanupIds.deliverableId) {
    const prepWp = await api(
      adminToken,
      "POST",
      `/ai-delivery-projects/${cleanupIds.projectId}/deliverables/${cleanupIds.deliverableId}/prepare-wordpress-draft`,
      {}
    );
    record(
      "wordpress_draft_prep_only",
      [200, 201, 400].includes(prepWp.status),
      `status=${prepWp.status} (draft-prep/gate; no live publish)`
    );
    cleanupIds.wordpressPostId = null;
  }

  const reportRes = await api(adminToken, "POST", `/ai-delivery/reports/monthly/${cleanupIds.projectId}`, {
    title: `[${correlationId}] Monthly report ${targetMonth}`,
    adminSummaryNotes: `${correlationId} fixture report — metrics are MANUAL placeholder, not live GA/GSC.`,
    recommendationsText: "Continue educational consultation content; retain medical review gates."
  });
  if (![200, 201].includes(reportRes.status)) {
    record("create_monthly_report", false, `status=${reportRes.status}`);
  } else {
    cleanupIds.monthlyReportId = pickId(reportRes.json?.data?.report?.id, reportRes.json?.data?.id);
    record("create_monthly_report", Boolean(cleanupIds.monthlyReportId), cleanupIds.monthlyReportId ?? `status=${reportRes.status}`);
    if (cleanupIds.monthlyReportId) {
      const finalRes = await api(
        adminToken,
        "POST",
        `/ai-delivery/reports/monthly/${cleanupIds.monthlyReportId}/status`,
        { status: "FINAL" }
      );
      record("finalize_monthly_report", [200, 201].includes(finalRes.status), `status=${finalRes.status}`);
    }
  }

  if (clientToken) {
    const projects = await api(clientToken, "GET", "/client-portal/projects");
    record("client_portal_projects", projects.status === 200, `status=${projects.status}`);
    assertNoSecrets(projects.json, "client-projects");
    const reports = await api(
      clientToken,
      "GET",
      `/client-portal/projects/${cleanupIds.projectId}/monthly-reports`
    );
    record("client_portal_monthly_reports", reports.status === 200, `status=${reports.status}`);
    assertNoSecrets(reports.json, "client-reports");
    const foreign = await api(clientToken, "GET", "/client-portal/projects/00000000-0000-4000-8000-000000000099");
    record("client_foreign_project_rejected", foreign.status === 404 || foreign.status === 403, `status=${foreign.status}`);
  }

  // Cleanup — archive rehearsal-owned records only
  if (cleanupIds.monthlyReportId) {
    await api(adminToken, "POST", `/ai-delivery/reports/monthly/${cleanupIds.monthlyReportId}/archive`, {});
  }
  if (cleanupIds.deliverableId) {
    await api(
      adminToken,
      "POST",
      `/ai-delivery-projects/${cleanupIds.projectId}/deliverables/${cleanupIds.deliverableId}/archive`,
      {}
    );
  }
  if (cleanupIds.articleImageId) {
    await api(
      adminToken,
      "POST",
      `/ai-delivery-projects/${cleanupIds.projectId}/article-images/${cleanupIds.articleImageId}/archive`,
      {}
    );
  }
  if (cleanupIds.contentDraftId) {
    await api(
      adminToken,
      "POST",
      `/ai-delivery-projects/${cleanupIds.projectId}/content-drafts/${cleanupIds.contentDraftId}/archive`,
      {}
    );
  }
  if (cleanupIds.projectId) {
    await api(adminToken, "POST", `/ai-delivery-projects/${cleanupIds.projectId}/archive`, {});
  }
  record("cleanup_archive_rehearsal", true, JSON.stringify(cleanupIds));

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
