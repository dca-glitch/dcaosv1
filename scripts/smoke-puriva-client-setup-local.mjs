import { chromium } from "@playwright/test";
import {
  currentTargetMonth,
  ensurePurivaLocalSetup,
  isPurivaClient,
  normalizeHostname,
  purivaMonthlyProjectName,
  PURIVA_PROFILE,
  PURIVA_PUBLICATION_TARGET,
  PURIVA_SETUP_MARKER,
  PURIVA_WORKFLOW_BRIEF_TITLE,
  responseHasSecrets
} from "./lib/puriva-local-setup.mjs";
import {
  buildPurivaImagePackageContext,
  findUnsafeVisualPhrasesInImagePackage,
  isPurivaImagePackageBriefAttachment,
  PURIVA_IMAGE_INTERNAL_PROMPT_LABEL,
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
  buildPurivaManualMetricsContext,
  consumePurivaApprovedManualMetricsSnapshot,
  findUnsafePerformanceClaimsInManualMetrics,
  manualMetricsSnapshotHasPurivaMarker,
  parsePurivaManualMetricsEmbed,
  PURIVA_MANUAL_METRICS_MARKER,
  PURIVA_MANUAL_METRICS_VERSION,
  validatePurivaManualMetricsContext
} from "./lib/puriva-manual-metrics.mjs";
import {
  buildPurivaContentProductionContext,
  findUnsafeApprovedPhrasesInContentProduction,
  isPurivaContentProductionBriefAttachment,
  PURIVA_CONTENT_PRODUCTION_MARKER,
  PURIVA_CONTENT_PRODUCTION_VERSION,
  PURIVA_DRAFT_INTERNAL_LABEL,
  validatePurivaContentProductionContext
} from "./lib/puriva-content-production.mjs";
import {
  buildPurivaSeoPlanContext,
  findUnsafeApprovedPhrasesInSeoPlan,
  isPurivaSeoPlanBriefAttachment,
  PURIVA_SEO_PLAN_MARKER,
  PURIVA_SEO_PLAN_VERSION,
  purivaSeoPlanScopeNotes,
  validatePurivaSeoPlanContext
} from "./lib/puriva-seo-plan.mjs";
import {
  buildPurivaMarketIntelligenceContext,
  findUnsafeApprovedPhrasesInMarketIntelligence,
  isPurivaMarketIntelligenceBriefAttachment,
  PURIVA_MARKET_INTELLIGENCE_VERSION,
  purivaMarketIntelligenceProjectTitle,
  validatePurivaMarketIntelligenceContext
} from "./lib/puriva-market-intelligence.mjs";
import {
  getPurivaServiceTaxonomy,
  PURIVA_HIGH_RISK_CATEGORY_IDS,
  PURIVA_REQUIRED_SERVICE_CATEGORY_IDS,
  PURIVA_SERVICE_TAXONOMY_VERSION,
  validatePurivaServiceTaxonomy,
  findForbiddenPromotionalPhrases
} from "./lib/puriva-service-taxonomy.mjs";
import {
  ensureLocalBrowserSmokeServices,
  getApiBaseUrl,
  getWebBaseUrl
} from "./lib/local-browser-smoke-service-helpers.mjs";

const apiBaseUrl = getApiBaseUrl();
const webBaseUrl = getWebBaseUrl();
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

const forbiddenActionPhrases = ["Execute release", "Release execution", "Publish now"];

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

function idsMatch(first, second) {
  return (
    first.client?.id === second.client?.id &&
    first.publicationTarget?.id === second.publicationTarget?.id &&
    first.aiDeliveryProject?.id === second.aiDeliveryProject?.id &&
    first.workflowBrief?.id === second.workflowBrief?.id &&
    first.marketIntelligence?.projectId === second.marketIntelligence?.projectId
  );
}

async function proveWorkflowBriefBrowserSelection(page, token, briefTitle) {
  await page.addInitScript((authToken) => {
    window.sessionStorage.setItem("dcaosv1.authToken", authToken);
  }, token);

  await page.goto(`${webBaseUrl}/#/workflow-briefs`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Workflow Briefs", exact: true }).waitFor({ state: "visible", timeout: 20000 });

  const briefButton = page.getByRole("button", { name: briefTitle });
  await briefButton.waitFor({ state: "visible", timeout: 20000 });
  await briefButton.click();

  await page.getByRole("heading", { name: briefTitle, exact: true }).waitFor({ state: "visible", timeout: 20000 });
  const mainText = await page.locator("main").innerText();
  record("browser selects Puriva workflow brief", mainText.includes("Puriva"), "brief detail visible");

  for (const phrase of forbiddenActionPhrases) {
    record(`browser forbids "${phrase}"`, !mainText.includes(phrase), mainText.includes(phrase) ? "found" : "absent");
  }
}

async function main() {
  console.log(`${PURIVA_SETUP_MARKER} smoke starting`);

  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    record("env AUTH_SEED_TEST_PASSWORD", false, "missing");
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

  const loginResponse = await login(adminEmail, adminPassword);
  const token = loginResponse.body?.data?.session?.token ?? null;
  record("admin login", loginResponse.status === 200 && typeof token === "string", `${loginResponse.status}`);
  if (!token) {
    process.exitCode = 1;
    return;
  }

  const targetMonth = currentTargetMonth();
  const firstRun = await ensurePurivaLocalSetup({ request, token, targetMonth });
  const secondRun = await ensurePurivaLocalSetup({ request, token, targetMonth });

  record("idempotent client id", idsMatch(firstRun, secondRun), firstRun.client?.id ?? "missing");
  record(
    "second run creates nothing new",
    Object.values(secondRun.created).every((value) => value === false),
    JSON.stringify(secondRun.created)
  );

  const taxonomyValidation = validatePurivaServiceTaxonomy();
  record("puriva service taxonomy validates", taxonomyValidation.ok, taxonomyValidation.errors.join("; ") || "ok");

  const taxonomy = getPurivaServiceTaxonomy();
  record(
    "puriva taxonomy includes all service categories",
    PURIVA_REQUIRED_SERVICE_CATEGORY_IDS.every((id) => taxonomy.serviceCategories.some((category) => category.id === id)),
    `${taxonomy.serviceCategories.length} categories`
  );

  for (const category of taxonomy.serviceCategories) {
    record(
      `taxonomy category ${category.id} has planning fields`,
      category.audienceSegments.length > 0 &&
        category.searchIntentGroups.length > 0 &&
        category.recommendedContentTypes.length > 0 &&
        category.contentClusters.length > 0,
      category.id
    );
  }

  for (const highRiskId of PURIVA_HIGH_RISK_CATEGORY_IDS) {
    const category = taxonomy.serviceCategories.find((entry) => entry.id === highRiskId);
    record(
      `high-risk category ${highRiskId} has compliance flags`,
      Boolean(
        category?.complianceFlags.includes("medical_claim_risk") &&
          category?.complianceFlags.includes("licensed_provider_required")
      ),
      category?.complianceFlags.join(", ") ?? "missing"
    );
  }

  record(
    "taxonomy avoids forbidden promotional phrases",
    findForbiddenPromotionalPhrases().length === 0,
    findForbiddenPromotionalPhrases().join(", ") || "clean"
  );

  const miValidation = validatePurivaMarketIntelligenceContext();
  record("puriva market intelligence validates", miValidation.ok, miValidation.errors.join("; ") || "ok");

  const miContext = buildPurivaMarketIntelligenceContext();
  record(
    "puriva mi includes all service categories",
    PURIVA_REQUIRED_SERVICE_CATEGORY_IDS.every((id) =>
      miContext.serviceCategorySummaries.some((summary) => summary.categoryId === id)
    ),
    `${miContext.serviceCategorySummaries.length} summaries`
  );
  record(
    "puriva mi includes both audience segments",
    miContext.audienceSegments.some((segment) => segment.id === "local_clients") &&
      miContext.audienceSegments.some((segment) => segment.id === "international_medical_tourists"),
    `${miContext.audienceSegments.length} segments`
  );
  record(
    "puriva mi attaches compliance flags",
    miContext.serviceCategorySummaries.every((summary) => summary.complianceFlags.length > 0),
    "all summaries flagged"
  );
  record(
    "puriva mi verification-required notes present",
    miContext.verificationRequiredNotes.some((note) => /requir(e|es) verification/i.test(note)),
    `${miContext.verificationRequiredNotes.length} notes`
  );
  record(
    "puriva mi avoids unsafe approved phrases",
    findUnsafeApprovedPhrasesInMarketIntelligence(miContext).length === 0,
    findUnsafeApprovedPhrasesInMarketIntelligence(miContext).join(", ") || "clean"
  );

  const seoValidation = validatePurivaSeoPlanContext(buildPurivaSeoPlanContext(targetMonth));
  record("puriva seo plan validates", seoValidation.ok, seoValidation.errors.join("; ") || "ok");

  const seoContext = buildPurivaSeoPlanContext(targetMonth);
  record(
    "puriva seo plan includes all service categories",
    PURIVA_REQUIRED_SERVICE_CATEGORY_IDS.every((id) => seoContext.items.some((item) => item.serviceCategoryId === id)),
    `${seoContext.items.length} items`
  );
  record(
    "puriva seo plan includes both audience segments",
    new Set(seoContext.items.flatMap((item) => item.audienceSegments)).has("local_clients") &&
      new Set(seoContext.items.flatMap((item) => item.audienceSegments)).has("international_medical_tourists"),
    `${seoContext.audienceSegments.length} taxonomy segments`
  );
  record(
    "puriva seo plan items have intent type and priority",
    seoContext.items.every((item) => item.searchIntent && item.contentType && item.priority),
    "all items complete"
  );
  for (const highRiskId of PURIVA_HIGH_RISK_CATEGORY_IDS) {
    const highRiskItems = seoContext.items.filter((item) => item.serviceCategoryId === highRiskId);
    record(
      `seo high-risk category ${highRiskId} requires medical review`,
      highRiskItems.length > 0 && highRiskItems.every((item) => item.medicalReviewRequired),
      `${highRiskItems.length} items`
    );
  }
  record(
    "puriva seo verification topics flagged",
    seoContext.items.some((item) => item.verificationRequired),
    `${seoContext.items.filter((item) => item.verificationRequired).length} items`
  );
  record(
    "puriva seo avoids unsafe approved phrases",
    findUnsafeApprovedPhrasesInSeoPlan(seoContext).length === 0,
    findUnsafeApprovedPhrasesInSeoPlan(seoContext).join(", ") || "clean"
  );

  const productionValidation = validatePurivaContentProductionContext(
    buildPurivaContentProductionContext(targetMonth, seoContext)
  );
  record("puriva content production validates", productionValidation.ok, productionValidation.errors.join("; ") || "ok");

  const productionContext = buildPurivaContentProductionContext(targetMonth, seoContext);
  record(
    "puriva content production covers seo plan items",
    productionContext.draftScaffolds.length === seoContext.items.length,
    `${productionContext.draftScaffolds.length} scaffolds`
  );
  record(
    "puriva draft scaffolds include outline sections",
    productionContext.draftScaffolds.every(
      (scaffold) => scaffold.outlineSections.length > 0 && scaffold.searchIntent && scaffold.contentType
    ),
    "all scaffolds complete"
  );
  for (const highRiskId of PURIVA_HIGH_RISK_CATEGORY_IDS) {
    const highRiskScaffolds = productionContext.draftScaffolds.filter(
      (scaffold) => scaffold.serviceCategoryId === highRiskId
    );
    record(
      `content production high-risk ${highRiskId} requires medical review`,
      highRiskScaffolds.length > 0 && highRiskScaffolds.every((scaffold) => scaffold.medicalReviewRequired),
      `${highRiskScaffolds.length} scaffolds`
    );
  }
  record(
    "puriva draft scaffolds marked internal only",
    productionContext.draftScaffolds.every((scaffold) => scaffold.draftBrief.includes(PURIVA_DRAFT_INTERNAL_LABEL)),
    PURIVA_DRAFT_INTERNAL_LABEL
  );
  record(
    "puriva content production avoids unsafe approved phrases",
    findUnsafeApprovedPhrasesInContentProduction(productionContext).length === 0,
    findUnsafeApprovedPhrasesInContentProduction(productionContext).join(", ") || "clean"
  );

  const imagePackageValidation = validatePurivaImagePackageContext(
    buildPurivaImagePackageContext(targetMonth, productionContext)
  );
  record("puriva image package validates", imagePackageValidation.ok, imagePackageValidation.errors.join("; ") || "ok");

  const imagePackageContext = buildPurivaImagePackageContext(targetMonth, productionContext);
  record(
    "puriva image package covers content items",
    imagePackageContext.imagePackages.length === productionContext.draftScaffolds.length,
    `${imagePackageContext.imagePackages.length} packages`
  );
  record(
    "puriva image concepts per package",
    imagePackageContext.imagePackages.every((pkg) => pkg.concepts.length === 3),
    `${imagePackageContext.imagePackages.reduce((sum, pkg) => sum + pkg.concepts.length, 0)} concepts`
  );
  for (const highRiskId of PURIVA_HIGH_RISK_CATEGORY_IDS) {
    const highRiskPackages = imagePackageContext.imagePackages.filter(
      (pkg) => pkg.serviceCategoryId === highRiskId
    );
    record(
      `image package high-risk ${highRiskId} requires medical review`,
      highRiskPackages.length > 0 && highRiskPackages.every((pkg) => pkg.medicalReviewRequired),
      `${highRiskPackages.length} packages`
    );
  }
  record(
    "puriva image prompts marked internal admin only",
    imagePackageContext.imagePackages.every((pkg) =>
      pkg.concepts.every((concept) => concept.promptScaffold.includes(PURIVA_IMAGE_INTERNAL_PROMPT_LABEL))
    ),
    PURIVA_IMAGE_INTERNAL_PROMPT_LABEL
  );
  record(
    "puriva image package blocks final-ready gating",
    imagePackageContext.imagePackages.every(
      (pkg) => pkg.finalReadyGating.allowed === false && pkg.finalReadyGating.reasons.length > 0
    ),
    "scaffold only"
  );
  record(
    "puriva image package avoids unsafe visual phrases",
    findUnsafeVisualPhrasesInImagePackage(imagePackageContext).length === 0,
    findUnsafeVisualPhrasesInImagePackage(imagePackageContext).join(", ") || "clean"
  );

  const briefDetail = await request(`/workflow-briefs/${firstRun.workflowBrief.id}`, { token });
  const structuredInput = briefDetail.body?.data?.structuredInputJson ?? null;
  record(
    "workflow brief exposes Puriva image package structured input",
    workflowBriefImagePackageMatches(structuredInput, targetMonth),
    structuredInput?.version ?? "missing"
  );
  record(
    "workflow brief taxonomy version",
    structuredInput?.version === PURIVA_SERVICE_TAXONOMY_VERSION,
    structuredInput?.version ?? "missing"
  );
  record(
    "workflow brief market intelligence attachment",
    isPurivaMarketIntelligenceBriefAttachment(structuredInput?.marketIntelligence),
    structuredInput?.marketIntelligence?.version ?? "missing"
  );
  record(
    "workflow brief taxonomy category count",
    Array.isArray(structuredInput?.serviceCategories) &&
      structuredInput.serviceCategories.length === PURIVA_REQUIRED_SERVICE_CATEGORY_IDS.length,
    `${structuredInput?.serviceCategories?.length ?? 0}`
  );
  record(
    "workflow brief mi service summary count",
    structuredInput?.marketIntelligence?.serviceCategorySummaries?.length === PURIVA_REQUIRED_SERVICE_CATEGORY_IDS.length,
    `${structuredInput?.marketIntelligence?.serviceCategorySummaries?.length ?? 0}`
  );
  record(
    "workflow brief seo plan attachment",
    isPurivaSeoPlanBriefAttachment(structuredInput?.seoPlan),
    structuredInput?.seoPlan?.version ?? "missing"
  );
  record(
    "workflow brief seo plan version",
    structuredInput?.seoPlan?.version === PURIVA_SEO_PLAN_VERSION,
    structuredInput?.seoPlan?.version ?? "missing"
  );
  record(
    "workflow brief seo plan item count",
    structuredInput?.seoPlan?.items?.length === seoContext.items.length,
    `${structuredInput?.seoPlan?.items?.length ?? 0}`
  );
  record(
    "workflow brief content production attachment",
    isPurivaContentProductionBriefAttachment(structuredInput?.contentProduction),
    structuredInput?.contentProduction?.version ?? "missing"
  );
  record(
    "workflow brief content production scaffold count",
    structuredInput?.contentProduction?.draftScaffolds?.length === productionContext.draftScaffolds.length,
    `${structuredInput?.contentProduction?.draftScaffolds?.length ?? 0}`
  );
  record(
    "workflow brief image package attachment",
    isPurivaImagePackageBriefAttachment(structuredInput?.imagePackage),
    structuredInput?.imagePackage?.version ?? "missing"
  );
  record(
    "workflow brief image package version",
    structuredInput?.imagePackage?.version === PURIVA_IMAGE_PACKAGE_VERSION,
    structuredInput?.imagePackage?.version ?? "missing"
  );
  record(
    "workflow brief image package count",
    structuredInput?.imagePackage?.imagePackages?.length === imagePackageContext.imagePackages.length,
    `${structuredInput?.imagePackage?.imagePackages?.length ?? 0}`
  );

  const contentDraftsResponse = await request(`/ai-delivery-projects/${firstRun.aiDeliveryProject.id}/content-drafts`, {
    token
  });
  const contentDrafts = contentDraftsResponse.body?.data?.contentDrafts ?? [];
  record(
    "ai delivery content draft scaffolds seeded",
    contentDrafts.filter((draft) => draft.notes?.includes(PURIVA_CONTENT_PRODUCTION_MARKER)).length >=
      productionContext.draftScaffolds.length,
    `${contentDrafts.length} drafts`
  );
  record(
    "ai delivery content drafts remain internal draft status",
    contentDrafts
      .filter((draft) => draft.notes?.includes(PURIVA_CONTENT_PRODUCTION_MARKER))
      .every((draft) => draft.status === "DRAFT"),
    "DRAFT only"
  );
  record(
    "ai delivery content draft bodies marked internal scaffold",
    contentDrafts
      .filter((draft) => draft.notes?.includes(PURIVA_CONTENT_PRODUCTION_MARKER))
      .every((draft) => typeof draft.draftBody === "string" && draft.draftBody.includes(PURIVA_DRAFT_INTERNAL_LABEL)),
    PURIVA_DRAFT_INTERNAL_LABEL
  );

  const articleImagesResponse = await request(
    `/ai-delivery-projects/${firstRun.aiDeliveryProject.id}/article-images`,
    { token }
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
    "ai delivery image package records remain draft scaffold",
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
    "ai delivery image records have no generated assets",
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
    "puriva monthly report includes planned outputs",
    monthlyReportContext.deliveryStatus.plannedSeoItemCount > 0 &&
      monthlyReportContext.deliveryStatus.draftScaffoldCount > 0 &&
      monthlyReportContext.deliveryStatus.imagePackageCount > 0,
    `seo=${monthlyReportContext.deliveryStatus.plannedSeoItemCount}`
  );
  record(
    "puriva monthly report includes medical review blockers",
    monthlyReportContext.deliveryStatus.medicalReviewBlockerCount > 0,
    `${monthlyReportContext.deliveryStatus.medicalReviewBlockerCount}`
  );
  record(
    "puriva monthly report includes verification blockers",
    monthlyReportContext.deliveryStatus.verificationBlockerCount > 0,
    `${monthlyReportContext.deliveryStatus.verificationBlockerCount}`
  );
  record(
    "puriva monthly report recommendations are compliance-safe",
    findUnsafeApprovedPhrasesInMonthlyReport(monthlyReportContext).length === 0,
    "clean"
  );
  record(
    "puriva monthly report seeded via local setup",
    Boolean(firstRun.monthlyReport?.reportId) && firstRun.monthlyReport.version === PURIVA_MONTHLY_REPORT_VERSION,
    firstRun.monthlyReport?.reportId ?? "missing"
  );
  record(
    "puriva monthly report remains draft for client boundary",
    firstRun.monthlyReport?.status === "DRAFT",
    firstRun.monthlyReport?.status ?? "missing"
  );

  const adminMonthlyReport = await request(`/ai-delivery/reports/monthly/${firstRun.aiDeliveryProject.id}`, {
    token
  });
  const adminReport = adminMonthlyReport.body?.data?.report ?? null;
  record(
    "admin monthly report exposes scaffold marker",
    monthlyReportHasPurivaMarker(adminReport ?? {}),
    PURIVA_MONTHLY_REPORT_MARKER
  );
  record(
    "admin monthly report hides credential fields",
    !responseHasSecrets(adminMonthlyReport.text ?? ""),
    "safe fields"
  );

  const manualMetricsContext = buildPurivaManualMetricsContext(targetMonth);
  const manualMetricsValidation = validatePurivaManualMetricsContext(manualMetricsContext);
  record(
    "puriva manual metrics validates",
    manualMetricsValidation.ok,
    manualMetricsValidation.errors.join("; ") || "ok"
  );
  record(
    "puriva manual metrics per-page placeholders match seo items",
    manualMetricsContext.itemMetrics.length === firstRun.monthlyReport?.plannedSeoItemCount,
    `${manualMetricsContext.itemMetrics.length} items`
  );
  record(
    "puriva manual metrics totals remain zero placeholder",
    manualMetricsContext.totals.placeholderOnly === true && manualMetricsContext.totals.gscClicks === 0,
    "zero totals"
  );
  record(
    "puriva manual metrics avoid real-performance claims",
    findUnsafePerformanceClaimsInManualMetrics(manualMetricsContext).length === 0,
    "clean"
  );

  const adminMetrics = await request(`/ai-delivery/reports/monthly/${firstRun.monthlyReport.reportId}/metrics`, {
    token
  });
  const approvedSnapshot =
    (adminMetrics.body?.data?.metrics?.snapshots ?? []).find((snapshot) => snapshot.status === "APPROVED") ?? null;
  record(
    "puriva manual metrics snapshot imported and approved",
    Boolean(approvedSnapshot?.id) && approvedSnapshot.sourceType === "MANUAL",
    approvedSnapshot?.status ?? "missing"
  );
  record(
    "puriva manual metrics snapshot notes marked placeholder",
    manualMetricsSnapshotHasPurivaMarker(approvedSnapshot?.notes),
    PURIVA_MANUAL_METRICS_MARKER
  );
  const parsedManualMetrics = parsePurivaManualMetricsEmbed(approvedSnapshot?.notes ?? "");
  record(
    "puriva manual metrics embed parses per-item placeholders",
    parsedManualMetrics?.itemMetrics.length === manualMetricsContext.itemMetrics.length,
    `${parsedManualMetrics?.itemMetrics.length ?? 0} parsed`
  );
  const consumedMetrics = consumePurivaApprovedManualMetricsSnapshot(approvedSnapshot);
  record(
    "puriva monthly report consumes approved manual metrics only",
    consumedMetrics?.clientSafeSummary?.placeholderOnly === true,
    consumedMetrics?.clientSafeSummary?.disclaimer?.slice(0, 48) ?? "missing"
  );
  record(
    "puriva setup tracks manual metrics version",
    firstRun.monthlyReport?.manualMetricsPlaceholderOnly === true,
    PURIVA_MANUAL_METRICS_VERSION
  );

  record(
    "puriva seo scope notes attached to ai delivery project",
    typeof firstRun.seoPlan?.scopeNotes === "string" && firstRun.seoPlan.scopeNotes.includes(PURIVA_SEO_PLAN_MARKER),
    firstRun.seoPlan?.version ?? "missing"
  );

  const projectsResponse = await request("/ai-delivery-projects", { token });
  const refreshedProject = (projectsResponse.body?.data?.aiDeliveryProjects ?? []).find(
    (entry) => entry.id === firstRun.aiDeliveryProject.id
  );
  record(
    "ai delivery project planned scope notes include seo marker",
    refreshedProject?.plannedContentScopeNotes?.includes(PURIVA_SEO_PLAN_MARKER) === true,
    purivaSeoPlanScopeNotes(targetMonth).slice(0, 48)
  );

  const contentPlanResponse = await request(`/ai-delivery-projects/${firstRun.aiDeliveryProject.id}/content-plan`, {
    token
  });
  const contentPlanItems = contentPlanResponse.body?.data?.contentPlan?.items ?? [];
  record(
    "ai delivery content plan seeded from seo plan",
    contentPlanItems.filter((item) => item.notes?.includes(PURIVA_SEO_PLAN_MARKER)).length >= seoContext.items.length,
    `${contentPlanItems.length} items`
  );

  record(
    "puriva mi project seeded",
    firstRun.marketIntelligence?.projectTitle === purivaMarketIntelligenceProjectTitle(targetMonth),
    firstRun.marketIntelligence?.projectId ?? "missing"
  );
  record(
    "puriva mi handoff linked to ai delivery project",
    typeof firstRun.marketIntelligence?.handoffId === "string",
    firstRun.marketIntelligence?.handoffStatus ?? "missing"
  );

  const miContextResponse = await request(
    `/ai-delivery/projects/${firstRun.aiDeliveryProject.id}/market-intelligence-context`,
    { token }
  );
  const linkedHandoffs = miContextResponse.body?.data?.handoffs ?? [];
  record(
    "ai delivery project has applied mi handoff",
    linkedHandoffs.some((entry) => entry.id === firstRun.marketIntelligence?.handoffId),
    `${linkedHandoffs.length} linked`
  );

  record("Puriva client profile name", firstRun.client?.name === PURIVA_PROFILE.name, firstRun.client?.name ?? "missing");
  record(
    "Puriva client website metadata",
    normalizeHostname(firstRun.client?.website) === "puriva.id",
    firstRun.client?.website ?? "missing"
  );
  record(
    "Puriva client country metadata",
    firstRun.client?.country === PURIVA_PROFILE.country,
    firstRun.client?.country ?? "missing"
  );

  record(
    "publication target placeholder site",
    normalizeHostname(firstRun.publicationTarget?.siteUrl) === "puriva.id",
    firstRun.publicationTarget?.siteUrl ?? "missing"
  );
  record(
    "publication target draft-prep label",
    firstRun.publicationTarget?.label === PURIVA_PUBLICATION_TARGET.label,
    firstRun.publicationTarget?.label ?? "missing"
  );

  const credentialStatus = await request(
    `/clients/${firstRun.client.id}/publication-targets/${firstRun.publicationTarget.id}/credentials`,
    { token }
  );
  record(
    "publication target has no stored credentials",
    credentialStatus.status === 200 &&
      credentialStatus.body?.data?.configured === false &&
      !responseHasSecrets(credentialStatus.text),
    `${credentialStatus.status}`
  );

  record(
    "monthly ai delivery project exists",
    firstRun.aiDeliveryProject?.name === purivaMonthlyProjectName(targetMonth),
    firstRun.aiDeliveryProject?.name ?? "missing"
  );
  record(
    "workflow brief linked to Puriva client",
    firstRun.workflowBrief?.clientId === firstRun.client.id,
    firstRun.workflowBrief?.id ?? "missing"
  );

  const handoffStatus = await request(`/workflow-briefs/${firstRun.workflowBrief.id}/publication-handoff`, { token });
  record(
    "workflow brief publication handoff mode is draft prep",
    handoffStatus.body?.data?.executionMode === "PREPARE_WORDPRESS_DRAFT",
    handoffStatus.body?.data?.executionMode ?? "missing"
  );
  record(
    "workflow brief sees Puriva publication target",
    handoffStatus.body?.data?.publicationTargetAvailable === true,
    `${handoffStatus.body?.data?.publicationTargetAvailable}`
  );
  record("workflow handoff response hides secrets", !responseHasSecrets(handoffStatus.text), "safe fields");

  const clientsResponse = await request("/clients", { token });
  const purivaMatches = (clientsResponse.body?.data?.clients ?? []).filter((client) => isPurivaClient(client));
  record("single Puriva client record", purivaMatches.length === 1, `${purivaMatches.length} matches`);

  if (firstRun.clientAccess) {
    record("client access mapping present", firstRun.clientAccess.clientId === firstRun.client.id, "linked");
    const portalProjects = await request("/client-portal/projects", { token });
    record(
      "client portal API remains reachable for admin smoke context",
      portalProjects.status === 200,
      `${portalProjects.status}`
    );
  } else {
    record("client access mapping", true, `skipped - ${firstRun.skipped.join("; ") || "portal user absent"}`);
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await proveWorkflowBriefBrowserSelection(page, token, PURIVA_WORKFLOW_BRIEF_TITLE);
  } catch (error) {
    record("browser workflow brief selection", false, error instanceof Error ? error.message : String(error));
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${PURIVA_SETUP_MARKER} smoke finished - ${results.length - failed.length}/${results.length} passed`);

  if (failed.length === 0) {
    console.log(
      "PROVEN: Puriva local client setup is idempotent with taxonomy + MI + SEO + content production + image package + monthly report scaffolds, without credentials or live publish."
    );
  } else {
    console.log("NOT PROVEN: one or more Puriva client setup checks failed.");
  }

  process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(`${PURIVA_SETUP_MARKER} smoke fatal - ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
