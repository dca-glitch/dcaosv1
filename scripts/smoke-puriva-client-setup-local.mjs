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
  buildPurivaSeoPlanContext,
  findUnsafeApprovedPhrasesInSeoPlan,
  isPurivaSeoPlanBriefAttachment,
  PURIVA_SEO_PLAN_MARKER,
  PURIVA_SEO_PLAN_VERSION,
  purivaSeoPlanScopeNotes,
  validatePurivaSeoPlanContext,
  workflowBriefPlanningMatches
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

  const briefDetail = await request(`/workflow-briefs/${firstRun.workflowBrief.id}`, { token });
  const structuredInput = briefDetail.body?.data?.structuredInputJson ?? null;
  record(
    "workflow brief exposes Puriva planning structured input",
    workflowBriefPlanningMatches(structuredInput, targetMonth),
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
      "PROVEN: Puriva local client setup is idempotent with taxonomy + MI + SEO planning, without credentials or live publish."
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
