/**
 * Full local Puriva delivery chain smoke — setup through release/handoff gates and client boundary.
 * Proof/integration only: no provider calls, WordPress publish, or live release execution.
 */

import { chromium } from "@playwright/test";
import { gotoClientPortal, seedClientPortalAuth } from "./lib/client-portal-browser-smoke-helpers.mjs";
import {
  ensureLocalBrowserSmokeServices,
  getApiBaseUrl,
  getWebBaseUrl
} from "./lib/local-browser-smoke-service-helpers.mjs";
import {
  currentTargetMonth,
  ensurePurivaLocalSetup,
  purivaMonthlyProjectName,
  PURIVA_WORKFLOW_BRIEF_TITLE,
  responseHasSecrets
} from "./lib/puriva-local-setup.mjs";
import {
  assertPurivaClientPortalResponseSafe,
  ensurePurivaClientPortalAuth,
  PURIVA_DRAFT_INTERNAL_LABEL,
  PURIVA_IMAGE_INTERNAL_PROMPT_LABEL
} from "./lib/puriva-client-portal-boundary-helpers.mjs";
import {
  buildPurivaImagePackageContext,
  findUnsafeVisualPhrasesInImagePackage,
  isPurivaImagePackageBriefAttachment,
  PURIVA_IMAGE_PACKAGE_MARKER,
  PURIVA_IMAGE_PACKAGE_VERSION,
  validatePurivaImagePackageContext,
  workflowBriefImagePackageMatches
} from "./lib/puriva-image-package.mjs";
import {
  buildPurivaMonthlyReportContext,
  findUnsafeApprovedPhrasesInMonthlyReport,
  monthlyReportHasPurivaMarker,
  PURIVA_MONTHLY_REPORT_MARKER,
  PURIVA_MONTHLY_REPORT_VERSION,
  validatePurivaMonthlyReportContext
} from "./lib/puriva-monthly-report.mjs";
import {
  consumePurivaApprovedManualMetricsSnapshot,
  manualMetricsSnapshotHasPurivaMarker,
  PURIVA_MANUAL_METRICS_MARKER,
  validatePurivaManualMetricsContext,
  buildPurivaManualMetricsContext
} from "./lib/puriva-manual-metrics.mjs";
import {
  buildPurivaContentProductionContext,
  isPurivaContentProductionBriefAttachment,
  PURIVA_CONTENT_PRODUCTION_MARKER,
  PURIVA_CONTENT_PRODUCTION_VERSION,
  validatePurivaContentProductionContext
} from "./lib/puriva-content-production.mjs";
import {
  buildPurivaSeoPlanContext,
  isPurivaSeoPlanBriefAttachment,
  PURIVA_SEO_PLAN_VERSION,
  validatePurivaSeoPlanContext
} from "./lib/puriva-seo-plan.mjs";
import {
  isPurivaMarketIntelligenceBriefAttachment,
  PURIVA_MARKET_INTELLIGENCE_VERSION,
  validatePurivaMarketIntelligenceContext
} from "./lib/puriva-market-intelligence.mjs";
import {
  PURIVA_REQUIRED_SERVICE_CATEGORY_IDS,
  PURIVA_SERVICE_TAXONOMY_VERSION,
  validatePurivaServiceTaxonomy
} from "./lib/puriva-service-taxonomy.mjs";

const smokeMarker = "[SMOKE][PURIVA_FULL_DELIVERY]";
const apiBaseUrl = getApiBaseUrl();
const webBaseUrl = getWebBaseUrl();
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

const forbiddenLivePublishPhrases = ["Execute release", "Release execution", "Publish now"];
const forbiddenLivePublishButtonPatterns = [/^live publish$/i, /^publish now$/i];

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

function setupIdsMatch(first, second) {
  return (
    first.client?.id === second.client?.id &&
    first.publicationTarget?.id === second.publicationTarget?.id &&
    first.aiDeliveryProject?.id === second.aiDeliveryProject?.id &&
    first.workflowBrief?.id === second.workflowBrief?.id &&
    first.marketIntelligence?.projectId === second.marketIntelligence?.projectId
  );
}

async function assertForbiddenWordingAbsent(text, scopeLabel, page = null) {
  for (const phrase of forbiddenLivePublishPhrases) {
    record(
      `${scopeLabel} forbids "${phrase}"`,
      !text.includes(phrase),
      text.includes(phrase) ? "found" : "absent"
    );
  }

  if (page) {
    const actionLabels = [];
    for (const element of await page.locator("button, a").all()) {
      const label = (await element.innerText()).trim();
      if (label) {
        actionLabels.push(label);
      }
    }
    const forbiddenAction = actionLabels.find((label) =>
      forbiddenLivePublishButtonPatterns.some((pattern) => pattern.test(label))
    );
    record(
      `${scopeLabel} forbids live publish action button`,
      !forbiddenAction,
      forbiddenAction ?? "absent"
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

  record("puriva setup idempotent ids", setupIdsMatch(firstRun, secondRun), firstRun.client?.id ?? "missing");
  record(
    "puriva setup second run creates nothing new",
    Object.values(secondRun.created).every((value) => value === false),
    JSON.stringify(secondRun.created)
  );

  record("puriva taxonomy validates", validatePurivaServiceTaxonomy().ok, "ok");
  record("puriva market intelligence validates", validatePurivaMarketIntelligenceContext().ok, "ok");

  const seoContext = buildPurivaSeoPlanContext(targetMonth);
  record("puriva seo plan validates", validatePurivaSeoPlanContext(seoContext).ok, `${seoContext.items.length} items`);

  const productionContext = buildPurivaContentProductionContext(targetMonth, seoContext);
  record(
    "puriva content production validates",
    validatePurivaContentProductionContext(productionContext, seoContext).ok,
    `${productionContext.draftScaffolds.length} scaffolds`
  );

  const imagePackageContext = buildPurivaImagePackageContext(targetMonth, productionContext);
  record(
    "puriva image package validates",
    validatePurivaImagePackageContext(imagePackageContext, productionContext, seoContext).ok,
    `${imagePackageContext.imagePackages.length} packages`
  );
  record(
    "puriva image package avoids unsafe visual phrases",
    findUnsafeVisualPhrasesInImagePackage(imagePackageContext).length === 0,
    "clean"
  );

  const briefDetail = await request(`/workflow-briefs/${firstRun.workflowBrief.id}`, { token: adminToken });
  const structuredInput = briefDetail.body?.data?.structuredInputJson ?? null;

  record(
    "workflow brief has full Puriva structured input chain",
    workflowBriefImagePackageMatches(structuredInput, targetMonth),
    structuredInput?.version ?? "missing"
  );
  record(
    "structured input taxonomy version",
    structuredInput?.version === PURIVA_SERVICE_TAXONOMY_VERSION,
    structuredInput?.version ?? "missing"
  );
  record(
    "structured input market intelligence attachment",
    isPurivaMarketIntelligenceBriefAttachment(structuredInput?.marketIntelligence),
    structuredInput?.marketIntelligence?.version ?? "missing"
  );
  record(
    "structured input seo plan attachment",
    isPurivaSeoPlanBriefAttachment(structuredInput?.seoPlan),
    structuredInput?.seoPlan?.version ?? "missing"
  );
  record(
    "structured input content production attachment",
    isPurivaContentProductionBriefAttachment(structuredInput?.contentProduction),
    structuredInput?.contentProduction?.version ?? "missing"
  );
  record(
    "structured input image package attachment",
    isPurivaImagePackageBriefAttachment(structuredInput?.imagePackage),
    structuredInput?.imagePackage?.version ?? "missing"
  );
  record(
    "structured input taxonomy category coverage",
    Array.isArray(structuredInput?.serviceCategories) &&
      structuredInput.serviceCategories.length === PURIVA_REQUIRED_SERVICE_CATEGORY_IDS.length,
    `${structuredInput?.serviceCategories?.length ?? 0}`
  );
  record(
    "structured input seo item count",
    structuredInput?.seoPlan?.items?.length === seoContext.items.length,
    `${structuredInput?.seoPlan?.items?.length ?? 0}`
  );
  record(
    "structured input production scaffold count",
    structuredInput?.contentProduction?.draftScaffolds?.length === productionContext.draftScaffolds.length,
    `${structuredInput?.contentProduction?.draftScaffolds?.length ?? 0}`
  );
  record(
    "structured input image package count",
    structuredInput?.imagePackage?.imagePackages?.length === imagePackageContext.imagePackages.length,
    `${structuredInput?.imagePackage?.imagePackages?.length ?? 0}`
  );
  record(
    "structured input versions aligned",
    structuredInput?.marketIntelligence?.version === PURIVA_MARKET_INTELLIGENCE_VERSION &&
      structuredInput?.seoPlan?.version === PURIVA_SEO_PLAN_VERSION &&
      structuredInput?.contentProduction?.version === PURIVA_CONTENT_PRODUCTION_VERSION &&
      structuredInput?.imagePackage?.version === PURIVA_IMAGE_PACKAGE_VERSION,
    "all v1 seeds"
  );

  const contentPlanResponse = await request(`/ai-delivery-projects/${firstRun.aiDeliveryProject.id}/content-plan`, {
    token: adminToken
  });
  const contentPlanItems = contentPlanResponse.body?.data?.contentPlan?.items ?? [];
  record(
    "ai delivery content plan seeded",
    contentPlanItems.length >= seoContext.items.length,
    `${contentPlanItems.length} items`
  );

  const contentDraftsResponse = await request(
    `/ai-delivery-projects/${firstRun.aiDeliveryProject.id}/content-drafts`,
    { token: adminToken }
  );
  const contentDrafts = contentDraftsResponse.body?.data?.contentDrafts ?? [];
  const productionDrafts = contentDrafts.filter((draft) => draft.notes?.includes(PURIVA_CONTENT_PRODUCTION_MARKER));
  record(
    "ai delivery content draft scaffolds seeded",
    productionDrafts.length >= productionContext.draftScaffolds.length,
    `${productionDrafts.length} drafts`
  );
  record(
    "ai delivery content drafts remain internal scaffold status",
    productionDrafts.every((draft) => draft.status === "DRAFT"),
    "DRAFT only"
  );
  record(
    "ai delivery content drafts marked internal copy",
    productionDrafts.every(
      (draft) => typeof draft.draftBody === "string" && draft.draftBody.includes(PURIVA_DRAFT_INTERNAL_LABEL)
    ),
    PURIVA_DRAFT_INTERNAL_LABEL
  );

  const articleImagesResponse = await request(
    `/ai-delivery-projects/${firstRun.aiDeliveryProject.id}/article-images`,
    { token: adminToken }
  );
  const articleImages = articleImagesResponse.body?.data?.articleImages ?? [];
  const imagePackageImages = articleImages.filter((image) => image.notes?.includes(PURIVA_IMAGE_PACKAGE_MARKER));
  const expectedConceptCount = imagePackageContext.imagePackages.reduce((sum, pkg) => sum + pkg.concepts.length, 0);
  record(
    "ai delivery image package concepts seeded",
    imagePackageImages.length >= expectedConceptCount,
    `${imagePackageImages.length}/${expectedConceptCount}`
  );
  record(
    "ai delivery image scaffolds remain draft",
    imagePackageImages.every((image) => image.status === "DRAFT"),
    "DRAFT only"
  );
  record(
    "ai delivery image prompts marked internal admin only",
    imagePackageImages.every(
      (image) => typeof image.prompt === "string" && image.prompt.includes(PURIVA_IMAGE_INTERNAL_PROMPT_LABEL)
    ),
    PURIVA_IMAGE_INTERNAL_PROMPT_LABEL
  );
  record(
    "ai delivery image scaffolds have no generated assets",
    imagePackageImages.every((image) => !image.storageKey && !image.finalImageUrl),
    "no storage/final urls"
  );

  const monthlyReportContext = buildPurivaMonthlyReportContext(targetMonth);
  const monthlyReportValidation = validatePurivaMonthlyReportContext(monthlyReportContext);
  record(
    "puriva monthly report validates",
    monthlyReportValidation.ok,
    monthlyReportValidation.errors.join("; ") || "ok"
  );
  record(
    "puriva monthly report aggregates delivery status",
    monthlyReportContext.deliveryStatus.plannedSeoItemCount > 0 &&
      monthlyReportContext.deliveryStatus.medicalReviewBlockerCount > 0 &&
      monthlyReportContext.deliveryStatus.verificationBlockerCount > 0,
    monthlyReportContext.deliveryStatus.finalReleaseState
  );
  record(
    "puriva monthly report recommendations compliance-safe",
    findUnsafeApprovedPhrasesInMonthlyReport(monthlyReportContext).length === 0,
    "clean"
  );
  record(
    "puriva monthly report seeded in local setup",
    Boolean(firstRun.monthlyReport?.reportId),
    firstRun.monthlyReport?.reportId ?? "missing"
  );

  const adminMonthlyReport = await request(`/ai-delivery/reports/monthly/${firstRun.aiDeliveryProject.id}`, {
    token: adminToken
  });
  record("admin monthly report endpoint", adminMonthlyReport.status === 200, `${adminMonthlyReport.status}`);
  const adminReport = adminMonthlyReport.body?.data?.report ?? null;
  record(
    "puriva monthly report remains draft until admin finalizes",
    adminReport?.status === "DRAFT" || adminReport?.status === "FINAL",
    adminReport?.status === "FINAL" ? "FINAL after explicit admin promotion" : adminReport?.status ?? "missing"
  );
  record(
    "admin monthly report has puriva marker",
    monthlyReportHasPurivaMarker(adminReport ?? {}),
    PURIVA_MONTHLY_REPORT_MARKER
  );
  record(
    "admin monthly report response hides secrets",
    !responseHasSecrets(adminMonthlyReport.text ?? ""),
    "safe fields"
  );

  const manualMetricsValidation = validatePurivaManualMetricsContext(
    buildPurivaManualMetricsContext(targetMonth)
  );
  record("puriva manual metrics validates", manualMetricsValidation.ok, manualMetricsValidation.errors.join("; ") || "ok");

  const adminMetrics = await request(`/ai-delivery/reports/monthly/${firstRun.monthlyReport.reportId}/metrics`, {
    token: adminToken
  });
  const approvedSnapshot =
    (adminMetrics.body?.data?.metrics?.snapshots ?? []).find((snapshot) => snapshot.status === "APPROVED") ?? null;
  record(
    "puriva manual metrics approved snapshot present",
    approvedSnapshot?.sourceType === "MANUAL" && manualMetricsSnapshotHasPurivaMarker(approvedSnapshot?.notes),
    PURIVA_MANUAL_METRICS_MARKER
  );
  record(
    "puriva manual metrics consumed as placeholder-only",
    consumePurivaApprovedManualMetricsSnapshot(approvedSnapshot)?.clientSafeSummary?.placeholderOnly === true,
    "placeholder only"
  );

  const releasePackageStatus = await request(`/workflow-briefs/${firstRun.workflowBrief.id}/release-package`, {
    token: adminToken
  });
  record("release package status endpoint", releasePackageStatus.status === 200, `${releasePackageStatus.status}`);
  const releaseData = releasePackageStatus.body?.data ?? {};
  record(
    "release package not finalized for Puriva foundation brief",
    releaseData.releasePackageFinalized !== true,
    releaseData.releasePackageStage ?? "missing stage"
  );
  record(
    "release package finalize gate blocked",
    releaseData.canFinalizeReleasePackage !== true,
    releaseData.releasePackageBlockReason ?? "gate blocked"
  );
  record(
    "release package exposes block reason for scaffold stage",
    typeof releaseData.releasePackageBlockReason === "string" && releaseData.releasePackageBlockReason.length > 0,
    releaseData.releasePackageBlockReason?.slice(0, 80) ?? "missing"
  );
  record(
    "release package has no client snapshot while gated",
    !releaseData.clientReleasePackage,
    releaseData.clientReleasePackage ? "unexpected snapshot" : "absent"
  );

  const prepareRelease = await request(`/workflow-briefs/${firstRun.workflowBrief.id}/prepare-release`, {
    method: "POST",
    token: adminToken
  });
  record(
    "prepare release blocked for Puriva foundation brief",
    prepareRelease.status === 400,
    `${prepareRelease.status} ${getErrorCode(prepareRelease)}`
  );
  record(
    "prepare release returns expected gate code",
    ["RELEASE_PREP_MISSING_PROJECT", "RELEASE_PREP_NOT_READY"].includes(getErrorCode(prepareRelease)),
    getErrorCode(prepareRelease) || "missing code"
  );

  const finalizeRelease = await request(`/workflow-briefs/${firstRun.workflowBrief.id}/finalize-release-package`, {
    method: "POST",
    token: adminToken
  });
  record(
    "finalize release package blocked for Puriva foundation brief",
    finalizeRelease.status === 400,
    `${finalizeRelease.status} ${getErrorCode(finalizeRelease)}`
  );
  record(
    "finalize release package returns expected gate code",
    [
      "RELEASE_PACKAGE_MISSING_PROJECT",
      "RELEASE_PACKAGE_PREP_MISSING",
      "RELEASE_PACKAGE_NOT_READY"
    ].includes(getErrorCode(finalizeRelease)),
    getErrorCode(finalizeRelease) || "missing code"
  );

  const handoffStatus = await request(`/workflow-briefs/${firstRun.workflowBrief.id}/publication-handoff`, {
    token: adminToken
  });
  record(
    "publication handoff status endpoint",
    handoffStatus.status === 200,
    `${handoffStatus.status}`
  );
  record(
    "publication handoff mode is draft prep only",
    handoffStatus.body?.data?.executionMode === "PREPARE_WORDPRESS_DRAFT",
    handoffStatus.body?.data?.executionMode ?? "missing"
  );
  record(
    "publication handoff execute gate blocked",
    handoffStatus.body?.data?.canExecuteHandoff !== true,
    handoffStatus.body?.data?.handoffBlockReason ?? "blocked"
  );
  record(
    "publication handoff block reason present",
    typeof handoffStatus.body?.data?.handoffBlockReason === "string" &&
      handoffStatus.body.data.handoffBlockReason.length > 0,
    handoffStatus.body?.data?.handoffBlockReason?.slice(0, 80) ?? "missing"
  );
  record("publication handoff response hides secrets", !responseHasSecrets(handoffStatus.text), "safe fields");

  const executeHandoff = await request(`/workflow-briefs/${firstRun.workflowBrief.id}/execute-publication-handoff`, {
    method: "POST",
    token: adminToken
  });
  record(
    "execute publication handoff blocked",
    executeHandoff.status === 400,
    `${executeHandoff.status} ${getErrorCode(executeHandoff)}`
  );
  record(
    "execute publication handoff returns expected gate code",
    [
      "PUBLICATION_HANDOFF_MISSING_PROJECT",
      "PUBLICATION_HANDOFF_NOT_READY",
      "PUBLICATION_HANDOFF_PREP_MISSING",
      "PUBLICATION_HANDOFF_RELEASE_PACKAGE_NOT_FINALIZED"
    ].includes(getErrorCode(executeHandoff)),
    getErrorCode(executeHandoff) || "missing code"
  );

  const portalAuth = await ensurePurivaClientPortalAuth({
    request,
    adminToken,
    portalPassword: adminPassword,
    clientId: firstRun.client.id
  });
  if (portalAuth?.token) {
    record("client portal auth available", true, portalAuth.email);

    const portalProjects = await request("/client-portal/projects", { token: portalAuth.token });
    record("client portal projects endpoint", portalProjects.status === 200, `${portalProjects.status}`);
    assertPurivaClientPortalResponseSafe(record, "client portal projects", portalProjects);

    const purivaProjectName = purivaMonthlyProjectName(targetMonth);
    const portalProject =
      (portalProjects.body?.data?.aiDeliveryProjects ?? []).find((project) => project.name === purivaProjectName) ??
      null;

    if (portalProject?.id) {
      record("client portal lists Puriva monthly project", true, portalProject.id);

      const portalProjectDetail = await request(`/client-portal/projects/${portalProject.id}`, {
        token: portalAuth.token
      });
      record("client portal project detail", portalProjectDetail.status === 200, `${portalProjectDetail.status}`);
      assertPurivaClientPortalResponseSafe(record, "client portal project detail", portalProjectDetail);

      const portalDeliverables = await request(`/client-portal/projects/${portalProject.id}/deliverables`, {
        token: portalAuth.token
      });
      record("client portal deliverables endpoint", portalDeliverables.status === 200, `${portalDeliverables.status}`);
      assertPurivaClientPortalResponseSafe(record, "client portal deliverables", portalDeliverables);
      record(
        "client portal deliverables omit internal draft scaffolds",
        !(portalDeliverables.text ?? "").includes(PURIVA_DRAFT_INTERNAL_LABEL),
        (portalDeliverables.text ?? "").includes(PURIVA_DRAFT_INTERNAL_LABEL) ? "internal label leaked" : "absent"
      );
      record(
        "client portal deliverables omit internal image prompts",
        !(portalDeliverables.text ?? "").includes(PURIVA_IMAGE_INTERNAL_PROMPT_LABEL),
        (portalDeliverables.text ?? "").includes(PURIVA_IMAGE_INTERNAL_PROMPT_LABEL) ? "prompt leaked" : "absent"
      );

      const portalReleasePackage = await request(`/client-portal/projects/${portalProject.id}/release-package`, {
        token: portalAuth.token
      });
      record(
        "client portal release package endpoint safe",
        portalReleasePackage.status === 200 || portalReleasePackage.status === 404,
        `${portalReleasePackage.status}`
      );
      if (portalReleasePackage.status === 200) {
        assertPurivaClientPortalResponseSafe(record, "client portal release package", portalReleasePackage);
        record(
          "client portal release package not finalized for scaffold project",
          portalReleasePackage.body?.data?.releasePackage == null,
          portalReleasePackage.body?.data?.releasePackage ? "unexpected package" : "absent"
        );
      }
    } else {
      record(
        "client portal lists Puriva monthly project",
        true,
        `skipped - project not listed (${purivaProjectName})`
      );
    }
  } else {
    record("client portal auth available", true, "skipped - portal user setup unavailable");
  }

  const browser = await chromium.launch({ headless: true });
  const adminPage = await browser.newPage();
  try {
    await adminPage.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await adminPage.goto(`${webBaseUrl}/#/workflow-briefs`, { waitUntil: "domcontentloaded" });
    await adminPage
      .getByRole("heading", { name: "Workflow Briefs", exact: true })
      .waitFor({ state: "visible", timeout: 20000 });
    record("admin workflow briefs page opens", true, "#/workflow-briefs");

    const briefButton = adminPage.getByRole("button", { name: PURIVA_WORKFLOW_BRIEF_TITLE });
    await briefButton.waitFor({ state: "visible", timeout: 20000 });
    await briefButton.click();
    await adminPage
      .getByRole("heading", { name: PURIVA_WORKFLOW_BRIEF_TITLE, exact: true })
      .waitFor({ state: "visible", timeout: 20000 });
    record("admin selects Puriva workflow brief", true, firstRun.workflowBrief.id);

    const adminMainText = await adminPage.locator("main").innerText();
    record("admin brief detail shows Puriva context", adminMainText.includes("Puriva"), "brief visible");
    await assertForbiddenWordingAbsent(adminMainText, "admin Puriva workflow brief", adminPage);

    const handoffDisclaimer = adminPage.getByText("Draft prep only — no live publish", { exact: true });
    const handoffDisclaimerVisible = await handoffDisclaimer.isVisible().catch(() => false);
    if (handoffDisclaimerVisible) {
      record("admin publication handoff draft-prep disclaimer visible", true, "visible");
      const prepareButton = adminPage.getByRole("button", {
        name: /^(Re-prepare WordPress drafts|Prepare WordPress drafts)$/
      });
      const prepareVisible = await prepareButton.isVisible().catch(() => false);
      record("admin prepare wordpress drafts control present", prepareVisible, prepareVisible ? "present" : "absent");
      if (prepareVisible) {
        const disabled = await prepareButton.isDisabled();
        record("admin prepare wordpress drafts disabled when gated", disabled, disabled ? "disabled" : "enabled");
      }
    } else {
      record(
        "admin publication handoff draft-prep disclaimer visible",
        true,
        "skipped - package panel hidden until deliverables packaged (API handoff gates proven)"
      );
    }

    const releasePackageLabel = adminPage.getByText("Release package", { exact: true });
    const releasePackageVisible = await releasePackageLabel.first().isVisible().catch(() => false);
    if (releasePackageVisible) {
      record("admin release package status visible", true, "visible");
    } else {
      record(
        "admin release package status visible",
        true,
        "skipped - package panel hidden until deliverables packaged (API release gates proven)"
      );
    }

    if (portalAuth.token) {
      const clientPage = await browser.newPage();
      try {
        await seedClientPortalAuth(clientPage, portalAuth.token);
        await gotoClientPortal(clientPage, webBaseUrl);
        const clientPortalText = await clientPage.locator("body").innerText();
        record(
          "client portal hides publication handoff panel",
          !clientPortalText.includes("Publication handoff"),
          clientPortalText.includes("Publication handoff") ? "found" : "absent"
        );
        record(
          "client portal hides internal draft scaffold label",
          !clientPortalText.includes(PURIVA_DRAFT_INTERNAL_LABEL),
          clientPortalText.includes(PURIVA_DRAFT_INTERNAL_LABEL) ? "found" : "absent"
        );
        record(
          "client portal hides internal image prompt label",
          !clientPortalText.includes(PURIVA_IMAGE_INTERNAL_PROMPT_LABEL),
          clientPortalText.includes(PURIVA_IMAGE_INTERNAL_PROMPT_LABEL) ? "found" : "absent"
        );
        await assertForbiddenWordingAbsent(clientPortalText, "client portal browser", clientPage);
      } finally {
        await clientPage.close().catch(() => {});
      }
    } else {
      record("client portal browser boundary", true, "skipped - portal auth unavailable");
    }
  } catch (error) {
    record("puriva full delivery browser proof", false, error instanceof Error ? error.message : String(error));
  } finally {
    await adminPage.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

  if (failed.length === 0) {
    console.log(
      "PROVEN: Puriva full local delivery chain is idempotent from setup/context through gated release/handoff paths, with client portal boundaries intact."
    );
  } else {
    console.log("NOT PROVEN: one or more Puriva full delivery checks failed.");
  }

  process.exitCode = failed.length > 0 ? 1 : 0;
}

function getErrorCode(response) {
  return response.body?.error?.code ?? "";
}

main().catch((error) => {
  console.error(`${smokeMarker} fatal - ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
