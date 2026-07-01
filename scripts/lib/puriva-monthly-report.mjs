import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assessPurivaMedicalCompliance } from "./puriva-medical-compliance.mjs";
import {
  buildPurivaContentProductionContext,
  PURIVA_CONTENT_PRODUCTION_VERSION
} from "./puriva-content-production.mjs";
import {
  buildPurivaImagePackageContext,
  PURIVA_IMAGE_PACKAGE_VERSION
} from "./puriva-image-package.mjs";
import {
  buildPurivaMarketIntelligenceContext,
  PURIVA_MARKET_INTELLIGENCE_VERSION
} from "./puriva-market-intelligence.mjs";
import {
  buildPurivaSeoPlanContext,
  PURIVA_SEO_PLAN_VERSION
} from "./puriva-seo-plan.mjs";

const monthlyReportJsonPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../apps/api/src/core/puriva-monthly-report.json"
);

export const PURIVA_MONTHLY_REPORT_VERSION = "PURIVA_MONTHLY_REPORT_V1";
export const PURIVA_MONTHLY_REPORT_KIND = "puriva_monthly_report_seed";
export const PURIVA_MONTHLY_REPORT_MARKER = "[PURIVA_LOCAL_SETUP] PURIVA_MONTHLY_REPORT_V1";

let cachedSeed = null;

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

export function getPurivaMonthlyReportSeed() {
  if (!cachedSeed) {
    cachedSeed = JSON.parse(readFileSync(monthlyReportJsonPath, "utf8"));
  }
  return cachedSeed;
}

export function purivaMonthlyReportTitle(targetMonth) {
  return `${PURIVA_MONTHLY_REPORT_MARKER} Puriva monthly report scaffold — ${targetMonth}`;
}

function collectBlockers(seoPlan, contentProduction, imagePackage) {
  const medicalReviewBlockers = [];
  const verificationBlockers = [];

  for (const item of seoPlan.items) {
    if (item.medicalReviewRequired) {
      medicalReviewBlockers.push({
        id: `seo:${item.id}`,
        title: item.title,
        reason: "SEO planning item requires medical review before client-facing release.",
        source: "seo_plan"
      });
    }
    if (item.verificationRequired) {
      verificationBlockers.push({
        id: `seo:${item.id}`,
        title: item.title,
        reason: "SEO planning item includes verification-required trust or facility claims.",
        source: "seo_plan"
      });
    }
  }

  for (const scaffold of contentProduction.draftScaffolds) {
    if (scaffold.medicalReviewRequired) {
      medicalReviewBlockers.push({
        id: `draft:${scaffold.seoPlanItemId}`,
        title: scaffold.title,
        reason: "Draft scaffold remains internal until medical review clears.",
        source: "content_production"
      });
    }
    if (scaffold.verificationRequired) {
      verificationBlockers.push({
        id: `draft:${scaffold.seoPlanItemId}`,
        title: scaffold.title,
        reason: "Draft scaffold includes verification-required claims.",
        source: "content_production"
      });
    }
  }

  for (const pkg of imagePackage.imagePackages) {
    if (pkg.medicalReviewRequired) {
      medicalReviewBlockers.push({
        id: `image:${pkg.seoPlanItemId}`,
        title: pkg.targetKeyword,
        reason: "Image prompt scaffold requires medical review before any generation or client use.",
        source: "image_package"
      });
    }
    if (pkg.verificationRequired) {
      verificationBlockers.push({
        id: `image:${pkg.seoPlanItemId}`,
        title: pkg.targetKeyword,
        reason: "Image prompt scaffold includes verification-required visual trust topics.",
        source: "image_package"
      });
    }
  }

  return { medicalReviewBlockers, verificationBlockers };
}

function resolveFinalReleaseState(medicalReviewBlockerCount, verificationBlockerCount) {
  if (medicalReviewBlockerCount > 0) {
    return "awaiting_medical_review";
  }
  if (verificationBlockerCount > 0) {
    return "awaiting_verification";
  }
  return "foundation_scaffold_only";
}

export function buildPurivaMonthlyReportContext(targetMonth, deps = {}) {
  const seed = getPurivaMonthlyReportSeed();
  const seoPlan = deps.seoPlan ?? buildPurivaSeoPlanContext(targetMonth);
  const contentProduction =
    deps.contentProduction ?? buildPurivaContentProductionContext(targetMonth, seoPlan);
  const imagePackage = deps.imagePackage ?? buildPurivaImagePackageContext(targetMonth, contentProduction);
  const marketIntelligence = deps.marketIntelligence ?? buildPurivaMarketIntelligenceContext();

  const { medicalReviewBlockers, verificationBlockers } = collectBlockers(
    seoPlan,
    contentProduction,
    imagePackage
  );

  const imageConceptCount = imagePackage.imagePackages.reduce(
    (sum, pkg) => sum + pkg.concepts.length,
    0
  );

  const deliveryStatus = {
    plannedSeoItemCount: seoPlan.items.length,
    draftScaffoldCount: contentProduction.draftScaffolds.length,
    imagePackageCount: imagePackage.imagePackages.length,
    imageConceptCount,
    medicalReviewBlockerCount: medicalReviewBlockers.length,
    verificationBlockerCount: verificationBlockers.length,
    finalReleaseState: resolveFinalReleaseState(
      medicalReviewBlockers.length,
      verificationBlockers.length
    ),
    medicalReviewBlockers,
    verificationBlockers,
    releaseStateNotes: [...seed.releaseStateNotes]
  };

  const nextMonthRecommendations = seed.recommendationTemplates.map((template) => ({
    ...template,
    rationale: `${template.rationale} MI version ${marketIntelligence.version}; SEO items ${seoPlan.items.length}.`
  }));

  return {
    version: PURIVA_MONTHLY_REPORT_VERSION,
    kind: PURIVA_MONTHLY_REPORT_KIND,
    seedLabel: seed.seedLabel,
    targetMonth,
    clientDomain: seed.clientDomain,
    market: seed.market,
    seoPlanVersion: seoPlan.version,
    contentProductionVersion: contentProduction.version,
    imagePackageVersion: imagePackage.version,
    marketIntelligenceVersion: marketIntelligence.version,
    deliveryStatus,
    nextMonthRecommendations,
    verificationRequiredNotes: [...seed.verificationRequiredNotes],
    metricsFixtureNote: seed.metricsFixtureNote
  };
}

function collectClientFacingReportText(context) {
  return [
    context.seedLabel,
    ...context.nextMonthRecommendations.flatMap((entry) => [
      entry.theme,
      entry.recommendation,
      entry.rationale
    ]),
    ...context.verificationRequiredNotes,
    buildPurivaMonthlyReportClientRecommendationsText(context)
  ].join("\n");
}

export function findUnsafeApprovedPhrasesInMonthlyReport(
  context = buildPurivaMonthlyReportContext("2026-01")
) {
  const haystack = collectClientFacingReportText(context).toLowerCase();
  return UNSAFE_APPROVED_PHRASES.filter((phrase) => {
    if (phrase === "guarantee" && haystack.includes("guaranteed")) {
      return false;
    }
    return haystack.includes(phrase.toLowerCase());
  });
}

export function validatePurivaMonthlyReportContext(context = buildPurivaMonthlyReportContext("2026-01")) {
  const errors = [];

  if (context.version !== PURIVA_MONTHLY_REPORT_VERSION) {
    errors.push(`Unexpected monthly report version: ${context.version}`);
  }

  if (context.deliveryStatus.plannedSeoItemCount === 0) {
    errors.push("Missing planned SEO items in delivery status");
  }

  if (context.deliveryStatus.draftScaffoldCount !== context.deliveryStatus.plannedSeoItemCount) {
    errors.push("Draft scaffold count must match planned SEO items");
  }

  if (context.deliveryStatus.imagePackageCount !== context.deliveryStatus.draftScaffoldCount) {
    errors.push("Image package count must match draft scaffold count");
  }

  if (context.deliveryStatus.medicalReviewBlockerCount === 0) {
    errors.push("Expected medical review blockers for Puriva foundation scaffold");
  }

  if (context.deliveryStatus.verificationBlockerCount === 0) {
    errors.push("Expected verification blockers for Puriva foundation scaffold");
  }

  if (context.nextMonthRecommendations.length < 3) {
    errors.push("Expected at least three next-month recommendations");
  }

  if (!context.verificationRequiredNotes.some((note) => /requir(e|es) verification/i.test(note))) {
    errors.push("Missing verification-required notes");
  }

  const unsafe = findUnsafeApprovedPhrasesInMonthlyReport(context);
  if (unsafe.length > 0) {
    errors.push(`Unsafe approved phrases: ${unsafe.join(", ")}`);
  }

  for (const entry of context.nextMonthRecommendations) {
    const assessment = assessPurivaMedicalCompliance({ text: entry.recommendation });
    if (assessment.action === "block") {
      errors.push(`Blocked recommendation copy for ${entry.id}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function buildPurivaMonthlyReportAdminSummaryNotes(context) {
  const status = context.deliveryStatus;
  const blockerLines = [
    ...status.medicalReviewBlockers.slice(0, 4).map((entry) => `- [medical] ${entry.title}: ${entry.reason}`),
    ...status.verificationBlockers.slice(0, 4).map((entry) => `- [verification] ${entry.title}: ${entry.reason}`)
  ];

  return [
    PURIVA_MONTHLY_REPORT_MARKER,
    context.seedLabel,
    `Target month: ${context.targetMonth}`,
    `Delivery status: SEO ${status.plannedSeoItemCount}, drafts ${status.draftScaffoldCount}, image packages ${status.imagePackageCount}, concepts ${status.imageConceptCount}`,
    `Final release state: ${status.finalReleaseState}`,
    `Medical review blockers: ${status.medicalReviewBlockerCount}`,
    `Verification blockers: ${status.verificationBlockerCount}`,
    ...status.releaseStateNotes.map((note) => `Release note: ${note}`),
    "Internal blocker sample:",
    ...blockerLines,
    "Admin-only scaffold context — not for client portal."
  ].join("\n");
}

export function buildPurivaMonthlyReportClientRecommendationsText(context) {
  const status = context.deliveryStatus;
  const recommendationLines = context.nextMonthRecommendations.map(
    (entry) =>
      `• ${entry.recommendation}${entry.verificationRequired ? " (verification required before publication)" : ""}`
  );

  return [
    `Monthly planning summary for ${context.targetMonth} (${context.market}).`,
    `This report describes planning and review status only. It is not approved treatment advice or a substitute for in-clinic medical consultation.`,
    `Delivery status: ${status.plannedSeoItemCount} planned SEO topics, ${status.draftScaffoldCount} internal draft scaffolds in review pipeline, ${status.imagePackageCount} visual planning packages.`,
    `Review gates: ${status.medicalReviewBlockerCount} items require medical review; ${status.verificationBlockerCount} items require operator verification before trust or facility claims.`,
    `Final release: not available for client distribution until admin review and FINAL report approval.`,
    "",
    "Next-month recommendations:",
    ...recommendationLines,
    "",
    ...context.verificationRequiredNotes.slice(0, 2)
  ].join("\n");
}

export function buildPurivaMonthlyReportClientSafeSummary(context) {
  const status = context.deliveryStatus;
  const recommendationsText = buildPurivaMonthlyReportClientRecommendationsText(context);

  return {
    targetMonth: context.targetMonth,
    title: `Puriva monthly delivery summary — ${context.targetMonth}`,
    recommendationsText,
    deliveryHeadline: `Planning progress for ${context.targetMonth}: ${status.plannedSeoItemCount} SEO items in foundation planning; final client release not yet available.`,
    performanceNote:
      "Performance metrics in this report use operator-approved manual snapshots when present; live analytics integration is deferred."
  };
}

export function buildPurivaMonthlyReportMetricsFixture(targetMonth) {
  const seed = getPurivaMonthlyReportSeed();
  return {
    targetMonth,
    sourceType: "MANUAL",
    status: "IMPORTED",
    gscClicks: 0,
    gscImpressions: 0,
    gscAverageCtr: 0,
    gscAveragePosition: 0,
    ga4Sessions: 0,
    ga4Users: 0,
    ga4PageViews: 0,
    notes: `${PURIVA_MONTHLY_REPORT_MARKER} ${seed.metricsFixtureNote}`
  };
}

export function monthlyReportHasPurivaMarker(value) {
  const title = value.title ?? "";
  const notes = value.adminSummaryNotes ?? "";
  return title.includes(PURIVA_MONTHLY_REPORT_MARKER) || notes.includes(PURIVA_MONTHLY_REPORT_MARKER);
}

export function monthlyReportMetricsHasPurivaMarker(notes) {
  return typeof notes === "string" && notes.includes(PURIVA_MONTHLY_REPORT_MARKER);
}

function metricsSnapshotHasPurivaMarker(snapshots) {
  return snapshots.some((snapshot) => monthlyReportMetricsHasPurivaMarker(snapshot.notes));
}

export async function ensurePurivaMonthlyReportApiSeed({
  request,
  token,
  aiDeliveryProject,
  targetMonth,
  marketIntelligenceHandoffId = null,
  log = () => {}
}) {
  const context = buildPurivaMonthlyReportContext(targetMonth);
  const validation = validatePurivaMonthlyReportContext(context);
  if (!validation.ok) {
    throw new Error(`Puriva monthly report invalid: ${validation.errors.join("; ")}`);
  }

  const clientSummary = buildPurivaMonthlyReportClientSafeSummary(context);
  const adminSummaryNotes = buildPurivaMonthlyReportAdminSummaryNotes(context);
  const created = { report: false, metrics: false, metricsApproved: false, miContextApplied: false };

  let reportResponse = await request(`/ai-delivery/reports/monthly/${aiDeliveryProject.id}`, { token });
  let report = reportResponse.body?.data?.report ?? null;

  if (!report?.id) {
    const createResponse = await request(`/ai-delivery/reports/monthly/${aiDeliveryProject.id}`, {
      method: "POST",
      token,
      body: {
        title: purivaMonthlyReportTitle(targetMonth),
        adminSummaryNotes,
        recommendationsText: clientSummary.recommendationsText
      }
    });
    if (createResponse.status !== 201 || !createResponse.body?.data?.report?.id) {
      throw new Error(`Puriva monthly report create failed with HTTP ${createResponse.status}.`);
    }
    report = createResponse.body.data.report;
    created.report = true;
    log("created puriva monthly report scaffold");
  } else if (!monthlyReportHasPurivaMarker(report)) {
    const updateResponse = await request(`/ai-delivery/reports/monthly/${report.id}/update`, {
      method: "PUT",
      token,
      body: {
        title: purivaMonthlyReportTitle(targetMonth),
        adminSummaryNotes,
        recommendationsText: clientSummary.recommendationsText
      }
    });
    if (updateResponse.status !== 200 || updateResponse.body?.ok !== true) {
      throw new Error(`Puriva monthly report update failed with HTTP ${updateResponse.status}.`);
    }
    report = updateResponse.body.data.report ?? report;
    created.report = true;
    log("updated puriva monthly report scaffold metadata");
  } else {
    log("reused puriva monthly report scaffold");
  }

  if (marketIntelligenceHandoffId && !report.miHandoffId) {
    const miContextResponse = await request(`/ai-delivery/reports/monthly/${report.id}/mi-context/apply`, {
      method: "POST",
      token,
      body: { handoffId: marketIntelligenceHandoffId }
    });
    if (miContextResponse.status === 200 && miContextResponse.body?.ok === true) {
      created.miContextApplied = true;
      log("applied MI context to monthly report (admin-only)");
      const refreshed = await request(`/ai-delivery/reports/monthly/${aiDeliveryProject.id}`, { token });
      report = refreshed.body?.data?.report ?? report;
    }
  } else if (report.miHandoffId) {
    log("reused puriva monthly report MI context");
  }

  const metricsResponse = await request(`/ai-delivery/reports/monthly/${report.id}/metrics`, { token });
  const snapshots = metricsResponse.body?.data?.metrics?.snapshots ?? [];

  if (!metricsSnapshotHasPurivaMarker(snapshots)) {
    const fixture = buildPurivaMonthlyReportMetricsFixture(targetMonth);
    const importResponse = await request(`/ai-delivery/reports/monthly/${report.id}/metrics/import`, {
      method: "POST",
      token,
      body: fixture
    });
    const snapshotId = importResponse.body?.data?.snapshot?.id ?? null;
    if (importResponse.status !== 201 || !snapshotId) {
      throw new Error(`Puriva monthly report metrics import failed with HTTP ${importResponse.status}.`);
    }
    created.metrics = true;
    log("imported puriva monthly report placeholder metrics");

    const approveResponse = await request(
      `/ai-delivery/reports/monthly/${report.id}/metrics/${snapshotId}/approve`,
      { method: "POST", token }
    );
    if (approveResponse.status !== 200 || approveResponse.body?.data?.snapshot?.status !== "APPROVED") {
      throw new Error(`Puriva monthly report metrics approve failed with HTTP ${approveResponse.status}.`);
    }
    created.metricsApproved = true;
    log("approved puriva monthly report placeholder metrics");
  } else {
    log("reused puriva monthly report metrics snapshot");
  }

  return {
    context,
    report,
    created
  };
}
