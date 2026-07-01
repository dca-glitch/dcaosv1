/**
 * Puriva monthly report v1 — deterministic local report scaffolding.
 * Aggregates planning/delivery status without live GA/GSC, provider calls, or client scaffold exposure.
 */

import monthlyReportSeedData from "./puriva-monthly-report.json";
import {
  buildPurivaContentProductionContext,
  PURIVA_CONTENT_PRODUCTION_VERSION,
  type PurivaContentProductionContext
} from "./puriva-content-production";
import {
  buildPurivaImagePackageContext,
  PURIVA_IMAGE_PACKAGE_VERSION,
  type PurivaImagePackageContext
} from "./puriva-image-package";
import {
  buildPurivaMarketIntelligenceContext,
  PURIVA_MARKET_INTELLIGENCE_VERSION,
  type PurivaMarketIntelligenceContext
} from "./puriva-market-intelligence";
import { assessPurivaMedicalCompliance } from "./puriva-medical-compliance";
import {
  buildPurivaSeoPlanContext,
  PURIVA_SEO_PLAN_VERSION,
  type PurivaSeoPlanContext
} from "./puriva-seo-plan";

export const PURIVA_MONTHLY_REPORT_VERSION = "PURIVA_MONTHLY_REPORT_V1";

export const PURIVA_MONTHLY_REPORT_KIND = "puriva_monthly_report_seed";

export const PURIVA_MONTHLY_REPORT_MARKER = "[PURIVA_LOCAL_SETUP] PURIVA_MONTHLY_REPORT_V1";

export type PurivaMonthlyReportFinalReleaseState =
  | "foundation_scaffold_only"
  | "release_prep_blocked"
  | "awaiting_medical_review"
  | "awaiting_verification";

export type PurivaMonthlyReportBlocker = {
  id: string;
  title: string;
  reason: string;
  source: "seo_plan" | "content_production" | "image_package";
};

export type PurivaMonthlyReportDeliveryStatus = {
  plannedSeoItemCount: number;
  draftScaffoldCount: number;
  imagePackageCount: number;
  imageConceptCount: number;
  medicalReviewBlockerCount: number;
  verificationBlockerCount: number;
  finalReleaseState: PurivaMonthlyReportFinalReleaseState;
  medicalReviewBlockers: PurivaMonthlyReportBlocker[];
  verificationBlockers: PurivaMonthlyReportBlocker[];
  releaseStateNotes: string[];
};

export type PurivaMonthlyReportRecommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  theme: string;
  recommendation: string;
  rationale: string;
  verificationRequired: boolean;
};

export type PurivaMonthlyReportContext = {
  version: typeof PURIVA_MONTHLY_REPORT_VERSION;
  kind: typeof PURIVA_MONTHLY_REPORT_KIND;
  seedLabel: string;
  targetMonth: string;
  clientDomain: string;
  market: string;
  seoPlanVersion: typeof PURIVA_SEO_PLAN_VERSION;
  contentProductionVersion: typeof PURIVA_CONTENT_PRODUCTION_VERSION;
  imagePackageVersion: typeof PURIVA_IMAGE_PACKAGE_VERSION;
  marketIntelligenceVersion: typeof PURIVA_MARKET_INTELLIGENCE_VERSION;
  deliveryStatus: PurivaMonthlyReportDeliveryStatus;
  nextMonthRecommendations: PurivaMonthlyReportRecommendation[];
  verificationRequiredNotes: string[];
  metricsFixtureNote: string;
};

export type PurivaMonthlyReportClientSafeSummary = {
  targetMonth: string;
  title: string;
  recommendationsText: string;
  deliveryHeadline: string;
  performanceNote: string;
};

export type PurivaMonthlyReportMetricsFixture = {
  targetMonth: string;
  sourceType: "MANUAL";
  status: "IMPORTED";
  gscClicks: number;
  gscImpressions: number;
  gscAverageCtr: number;
  gscAveragePosition: number;
  ga4Sessions: number;
  ga4Users: number;
  ga4PageViews: number;
  notes: string;
};

type RecommendationTemplate = PurivaMonthlyReportRecommendation;

type MonthlyReportSeedConfig = {
  version: typeof PURIVA_MONTHLY_REPORT_VERSION;
  seedLabel: string;
  clientDomain: string;
  market: string;
  verificationRequiredNotes: string[];
  releaseStateNotes: string[];
  metricsFixtureNote: string;
  recommendationTemplates: RecommendationTemplate[];
};

const monthlyReportSeed = monthlyReportSeedData as MonthlyReportSeedConfig;

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

export function getPurivaMonthlyReportSeed(): MonthlyReportSeedConfig {
  return monthlyReportSeed;
}

export function purivaMonthlyReportTitle(targetMonth: string): string {
  return `${PURIVA_MONTHLY_REPORT_MARKER} Puriva monthly report scaffold — ${targetMonth}`;
}

function collectBlockers(
  seoPlan: PurivaSeoPlanContext,
  contentProduction: PurivaContentProductionContext,
  imagePackage: PurivaImagePackageContext
): {
  medicalReviewBlockers: PurivaMonthlyReportBlocker[];
  verificationBlockers: PurivaMonthlyReportBlocker[];
} {
  const medicalReviewBlockers: PurivaMonthlyReportBlocker[] = [];
  const verificationBlockers: PurivaMonthlyReportBlocker[] = [];

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

function resolveFinalReleaseState(
  medicalReviewBlockerCount: number,
  verificationBlockerCount: number
): PurivaMonthlyReportFinalReleaseState {
  if (medicalReviewBlockerCount > 0) {
    return "awaiting_medical_review";
  }
  if (verificationBlockerCount > 0) {
    return "awaiting_verification";
  }
  return "foundation_scaffold_only";
}

export function buildPurivaMonthlyReportContext(
  targetMonth: string,
  deps: {
    seoPlan?: PurivaSeoPlanContext;
    contentProduction?: PurivaContentProductionContext;
    imagePackage?: PurivaImagePackageContext;
    marketIntelligence?: PurivaMarketIntelligenceContext;
  } = {}
): PurivaMonthlyReportContext {
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

  const deliveryStatus: PurivaMonthlyReportDeliveryStatus = {
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

function collectClientFacingReportText(context: PurivaMonthlyReportContext): string {
  return [
    context.seedLabel,
    ...context.nextMonthRecommendations.flatMap((entry) => [
      entry.theme,
      entry.recommendation,
      entry.rationale
    ]),
    ...context.verificationRequiredNotes,
    buildPurivaMonthlyReportClientSafeSummary(context).recommendationsText
  ].join("\n");
}

export function findUnsafeApprovedPhrasesInMonthlyReport(
  context: PurivaMonthlyReportContext = buildPurivaMonthlyReportContext("2026-01")
): string[] {
  const haystack = collectClientFacingReportText(context).toLowerCase();
  return UNSAFE_APPROVED_PHRASES.filter((phrase) => {
    if (phrase === "guarantee" && haystack.includes("guaranteed")) {
      return false;
    }
    return haystack.includes(phrase.toLowerCase());
  });
}

export function validatePurivaMonthlyReportContext(
  context: PurivaMonthlyReportContext = buildPurivaMonthlyReportContext("2026-01")
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

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

export function buildPurivaMonthlyReportAdminSummaryNotes(
  context: PurivaMonthlyReportContext
): string {
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

export function buildPurivaMonthlyReportClientSafeSummary(
  context: PurivaMonthlyReportContext
): PurivaMonthlyReportClientSafeSummary {
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

export function buildPurivaMonthlyReportClientRecommendationsText(
  context: PurivaMonthlyReportContext
): string {
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

export function buildPurivaMonthlyReportMetricsFixture(
  targetMonth: string
): PurivaMonthlyReportMetricsFixture {
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

export function monthlyReportHasPurivaMarker(value: {
  title?: string | null;
  adminSummaryNotes?: string | null;
}): boolean {
  const title = value.title ?? "";
  const notes = value.adminSummaryNotes ?? "";
  return title.includes(PURIVA_MONTHLY_REPORT_MARKER) || notes.includes(PURIVA_MONTHLY_REPORT_MARKER);
}

export function monthlyReportMetricsHasPurivaMarker(notes: string | null | undefined): boolean {
  return typeof notes === "string" && notes.includes(PURIVA_MONTHLY_REPORT_MARKER);
}
