import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assessPurivaMedicalCompliance } from "./puriva-medical-compliance.mjs";
import {
  buildPurivaWorkflowBriefStructuredInput,
  PURIVA_REQUIRED_SERVICE_CATEGORY_IDS,
  PURIVA_SERVICE_TAXONOMY_VERSION
} from "./puriva-service-taxonomy.mjs";

const miJsonPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/api/src/core/puriva-market-intelligence.json"
);

export const PURIVA_MARKET_INTELLIGENCE_VERSION = "PURIVA_MARKET_INTELLIGENCE_V1";
export const PURIVA_MARKET_INTELLIGENCE_KIND = "puriva_market_intelligence_seed";
export const PURIVA_MI_SETUP_MARKER = "[PURIVA_LOCAL_SETUP]";

export { PURIVA_REQUIRED_SERVICE_CATEGORY_IDS };

let cachedSeed = null;

export function getPurivaMarketIntelligenceSeed() {
  if (!cachedSeed) {
    cachedSeed = JSON.parse(readFileSync(miJsonPath, "utf8"));
  }
  return cachedSeed;
}

export function purivaMarketIntelligenceProjectTitle(targetMonth) {
  return `${PURIVA_MI_SETUP_MARKER} Market Intelligence — ${targetMonth}`;
}

export function buildPurivaMarketIntelligenceProjectSeed({ clientId, clientName, targetMonth }) {
  const seed = getPurivaMarketIntelligenceSeed();
  const structured = buildPurivaWorkflowBriefStructuredInput();
  const categories = structured.serviceCategories ?? [];

  return {
    clientId,
    title: purivaMarketIntelligenceProjectTitle(targetMonth),
    description: `${seed.seedLabel} Puriva MI scaffold for ${targetMonth}.`,
    keywords: categories
      .flatMap((category) => category.contentClusters)
      .slice(0, 6)
      .join(", "),
    competitors: seed.competitorPlaceholders.map((entry) => entry.name).join("; "),
    niche: "Bali licensed aesthetic clinic",
    productServiceFocus: "Educational SEO/MI planning context only",
    targetClientName: clientName,
    targetMonth,
    status: "ACTIVE"
  };
}

function buildServiceCategorySummary(category) {
  const researchSummary = [
    `Operator-reviewed placeholder research for ${category.label}.`,
    `Focus clusters: ${category.contentClusters.slice(0, 3).join("; ")}.`,
    "Educational positioning only; individual outcomes require licensed assessment."
  ].join(" ");

  const complianceAssessment = assessPurivaMedicalCompliance({
    text: researchSummary,
    categoryId: category.id
  });

  return {
    categoryId: category.id,
    categoryLabel: category.label,
    audienceSegments: category.audienceSegments,
    searchIntentGroups: category.searchIntentGroups,
    contentClusters: category.contentClusters,
    researchSummary,
    recommendedContentTypes: category.recommendedContentTypes,
    complianceFlags: category.complianceFlags,
    complianceAssessment: {
      severity: complianceAssessment.severity,
      action: complianceAssessment.action,
      aggregateFlags: complianceAssessment.aggregateFlags,
      reviewerNotes: complianceAssessment.reviewerNotes,
      guidanceNotes: complianceAssessment.guidanceNotes
    }
  };
}

export function buildPurivaMarketIntelligenceContext() {
  const seed = getPurivaMarketIntelligenceSeed();
  const structured = buildPurivaWorkflowBriefStructuredInput();
  const categories = structured.serviceCategories ?? [];
  const audienceSegments = structured.audienceSegments ?? [];
  const serviceCategorySummaries = categories.map(buildServiceCategorySummary);

  const complianceAnnotations = [
    ...new Set([
      ...seed.verificationRequiredNotes,
      ...serviceCategorySummaries.flatMap((summary) => summary.complianceAssessment.guidanceNotes),
      ...categories.flatMap((category) => category.complianceNotes)
    ])
  ];

  return {
    version: PURIVA_MARKET_INTELLIGENCE_VERSION,
    kind: PURIVA_MARKET_INTELLIGENCE_KIND,
    seedLabel: seed.seedLabel,
    clientDomain: seed.clientDomain,
    market: seed.market,
    audienceSegments,
    competitorPlaceholders: seed.competitorPlaceholders,
    searchIntentMapping: categories.map((category) => ({
      serviceCategoryId: category.id,
      searchIntentGroups: category.searchIntentGroups,
      contentClusters: category.contentClusters
    })),
    contentGapCategories: seed.contentGapCategories,
    serviceCategorySummaries,
    verificationRequiredNotes: seed.verificationRequiredNotes,
    complianceAnnotations
  };
}

export function buildPurivaWorkflowBriefFoundationInput() {
  return {
    ...buildPurivaWorkflowBriefStructuredInput(),
    marketIntelligence: buildPurivaMarketIntelligenceContext()
  };
}

export function isPurivaMarketIntelligenceBriefAttachment(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return value.kind === PURIVA_MARKET_INTELLIGENCE_KIND && value.version === PURIVA_MARKET_INTELLIGENCE_VERSION;
}

export function workflowBriefFoundationMatches(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return (
    value.kind === "puriva_service_taxonomy" &&
    value.version === PURIVA_SERVICE_TAXONOMY_VERSION &&
    isPurivaMarketIntelligenceBriefAttachment(value.marketIntelligence)
  );
}

const UNSAFE_APPROVED_PHRASES = [
  "guaranteed",
  "guarantee",
  "cure",
  "cures",
  "permanent result",
  "permanent results",
  "universally suitable",
  "works for everyone",
  "best hospital",
  "official partner hospital"
];

function collectApprovedConclusionText(context) {
  return [
    context.seedLabel,
    context.market,
    ...context.competitorPlaceholders.flatMap((entry) => [entry.name, entry.notes]),
    ...context.contentGapCategories.flatMap((entry) => [entry.label, entry.description]),
    ...context.serviceCategorySummaries.map((entry) => entry.researchSummary),
    ...context.verificationRequiredNotes
  ].join("\n");
}

export function findUnsafeApprovedPhrasesInMarketIntelligence(context = buildPurivaMarketIntelligenceContext()) {
  const haystack = collectApprovedConclusionText(context).toLowerCase();

  return UNSAFE_APPROVED_PHRASES.filter((phrase) => {
    if (phrase === "guarantee" && haystack.includes("guaranteed")) {
      return false;
    }
    return haystack.includes(phrase.toLowerCase());
  });
}

export function validatePurivaMarketIntelligenceContext(context = buildPurivaMarketIntelligenceContext()) {
  const errors = [];

  if (context.version !== PURIVA_MARKET_INTELLIGENCE_VERSION) {
    errors.push(`Unexpected MI version: ${context.version}`);
  }

  if (context.audienceSegments.length < 2) {
    errors.push("Expected both Puriva audience segments in MI context");
  }

  const summaryIds = new Set(context.serviceCategorySummaries.map((entry) => entry.categoryId));
  for (const requiredId of PURIVA_REQUIRED_SERVICE_CATEGORY_IDS) {
    if (!summaryIds.has(requiredId)) {
      errors.push(`Missing service category summary: ${requiredId}`);
    }
  }

  for (const summary of context.serviceCategorySummaries) {
    if (summary.complianceFlags.length === 0) {
      errors.push(`Missing compliance flags on summary ${summary.categoryId}`);
    }
  }

  if (!context.verificationRequiredNotes.some((note) => /requir(e|es) verification/i.test(note))) {
    errors.push("Missing verification-required notes");
  }

  const unsafe = findUnsafeApprovedPhrasesInMarketIntelligence(context);
  if (unsafe.length > 0) {
    errors.push(`Unsafe approved phrases: ${unsafe.join(", ")}`);
  }

  return { ok: errors.length === 0, errors };
}

export async function ensurePurivaMarketIntelligenceApiSeed({
  request,
  token,
  client,
  aiDeliveryProject,
  targetMonth,
  log = () => {}
}) {
  const seed = getPurivaMarketIntelligenceSeed();
  const title = purivaMarketIntelligenceProjectTitle(targetMonth);
  const created = { miProject: false, sources: false, handoffApplied: false };

  const projectsResponse = await request("/market-intelligence-projects", { token });
  if (projectsResponse.status !== 200 || projectsResponse.body?.ok !== true) {
    throw new Error(`MI project list failed with HTTP ${projectsResponse.status}.`);
  }

  let miProject =
    (projectsResponse.body?.data?.projects ?? []).find(
      (entry) => entry.clientId === client.id && entry.title === title && entry.isArchived !== true
    ) ?? null;

  if (!miProject) {
    const createResponse = await request("/market-intelligence-projects", {
      method: "POST",
      token,
      body: buildPurivaMarketIntelligenceProjectSeed({
        clientId: client.id,
        clientName: client.name,
        targetMonth
      })
    });
    if (createResponse.status !== 201 || createResponse.body?.ok !== true) {
      throw new Error(`Puriva MI project create failed with HTTP ${createResponse.status}.`);
    }
    miProject = createResponse.body.data?.project ?? null;
    created.miProject = true;
    log(`created mi project: ${miProject?.id ?? "missing"}`);
  } else {
    log(`reused mi project: ${miProject.id}`);
  }

  if (!miProject?.id) {
    throw new Error("Puriva MI project id missing after ensure.");
  }

  const sourcesResponse = await request(`/market-intelligence-projects/${miProject.id}/sources`, { token });
  const existingSources = sourcesResponse.body?.data?.sources ?? [];
  if (existingSources.length < seed.competitorPlaceholders.length) {
    for (const placeholder of seed.competitorPlaceholders) {
      const alreadyExists = existingSources.some((entry) => entry.sourceUrl === placeholder.sourceUrl);
      if (alreadyExists) {
        continue;
      }
      const sourceResponse = await request(`/market-intelligence-projects/${miProject.id}/sources`, {
        method: "POST",
        token,
        body: {
          title: placeholder.name,
          sourceType: placeholder.sourceType,
          sourceUrl: placeholder.sourceUrl,
          sourceNotes: placeholder.notes
        }
      });
      if (sourceResponse.status !== 201 || sourceResponse.body?.ok !== true) {
        throw new Error(`Puriva MI source create failed with HTTP ${sourceResponse.status}.`);
      }
      created.sources = true;
    }
    log("ensured mi placeholder sources");
  } else {
    log("reused mi placeholder sources");
  }

  const runsResponse = await request(`/market-intelligence-projects/${miProject.id}/research-runs`, { token });
  let executedRun = (runsResponse.body?.data?.researchRuns ?? []).find((entry) => entry.status === "EXECUTED") ?? null;

  if (!executedRun) {
    const createRunResponse = await request(`/market-intelligence-projects/${miProject.id}/research-runs`, {
      method: "POST",
      token,
      body: { status: "PENDING" }
    });
    const runId = createRunResponse.body?.data?.researchRun?.id;
    if (!runId) {
      throw new Error("Puriva MI research run create failed.");
    }
    const executeResponse = await request(
      `/market-intelligence-projects/${miProject.id}/research-runs/${runId}/execute`,
      {
        method: "POST",
        token,
        body: {}
      }
    );
    if (executeResponse.status !== 200 || executeResponse.body?.ok !== true) {
      throw new Error(`Puriva MI research run execute failed with HTTP ${executeResponse.status}.`);
    }
    executedRun = executeResponse.body.data?.researchRun ?? null;
    log(`executed mi research run: ${runId}`);
  } else {
    log(`reused mi research run: ${executedRun.id}`);
  }

  const insightsResponse = await request(`/market-intelligence-projects/${miProject.id}/insights`, { token });
  const generatedInsight = (insightsResponse.body?.data?.insights ?? []).find(
    (insight) => typeof insight.title === "string" && insight.title.startsWith("Generated Insight")
  );
  if (!generatedInsight?.id) {
    throw new Error("Puriva MI generated insight not found after execute.");
  }

  if (generatedInsight.status !== "APPROVED") {
    const approveResponse = await request(
      `/market-intelligence-projects/${miProject.id}/insights/${generatedInsight.id}`,
      {
        method: "PUT",
        token,
        body: {
          status: "APPROVED",
          reviewerNotes: "Approved local Puriva MI seed placeholder for operator-reviewed planning context."
        }
      }
    );
    if (approveResponse.status !== 200 || approveResponse.body?.ok !== true) {
      throw new Error(`Puriva MI insight approve failed with HTTP ${approveResponse.status}.`);
    }
    log(`approved mi insight: ${generatedInsight.id}`);
  } else {
    log(`reused approved mi insight: ${generatedInsight.id}`);
  }

  const handoffsResponse = await request(`/market-intelligence-projects/${miProject.id}/handoffs`, { token });
  let handoff =
    (handoffsResponse.body?.data?.handoffs ?? []).find((entry) => entry.insightId === generatedInsight.id) ?? null;

  if (!handoff) {
    const prepareResponse = await request(`/market-intelligence-projects/${miProject.id}/handoffs/prepare`, {
      method: "POST",
      token,
      body: { insightId: generatedInsight.id }
    });
    handoff = prepareResponse.body?.data?.handoff ?? null;
    if (!handoff?.id) {
      throw new Error("Puriva MI handoff prepare failed.");
    }
    log(`prepared mi handoff: ${handoff.id}`);
  } else {
    log(`reused mi handoff: ${handoff.id}`);
  }

  if (handoff.handoffStatus !== "READY" && handoff.handoffStatus !== "APPLIED") {
    const readyResponse = await request(`/market-intelligence-projects/${miProject.id}/handoffs/${handoff.id}/status`, {
      method: "PUT",
      token,
      body: { handoffStatus: "READY" }
    });
    if (readyResponse.status !== 200 || readyResponse.body?.ok !== true) {
      throw new Error(`Puriva MI handoff ready failed with HTTP ${readyResponse.status}.`);
    }
    handoff = readyResponse.body.data?.handoff ?? handoff;
    log(`marked mi handoff ready: ${handoff.id}`);
  }

  const miContextResponse = await request(
    `/ai-delivery/projects/${aiDeliveryProject.id}/market-intelligence-context`,
    { token }
  );
  const linkedHandoffs = miContextResponse.body?.data?.handoffs ?? [];
  const alreadyLinked = linkedHandoffs.some((entry) => entry.id === handoff.id);

  if (!alreadyLinked) {
    const applyResponse = await request(
      `/ai-delivery/projects/${aiDeliveryProject.id}/market-intelligence-context/apply`,
      {
        method: "POST",
        token,
        body: { handoffId: handoff.id }
      }
    );
    if (applyResponse.status !== 200 || applyResponse.body?.ok !== true) {
      throw new Error(`Puriva MI handoff apply failed with HTTP ${applyResponse.status}.`);
    }
    created.handoffApplied = true;
    log(`applied mi handoff to ai project: ${handoff.id}`);
  } else {
    log(`reused mi handoff on ai project: ${handoff.id}`);
  }

  return {
    miProject,
    handoff,
    created,
    context: buildPurivaMarketIntelligenceContext()
  };
}
