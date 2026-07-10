/**
 * Recommendation input policy for monthly reports — no live AI calls.
 */

export type MonthlyReportRecommendationOrigin =
  | "metrics_based"
  | "manual_admin"
  | "ai_drafted"
  | "placeholder";

export interface MonthlyReportRecommendationInput {
  origin?: MonthlyReportRecommendationOrigin | string | null;
  text?: string | null;
  metricsTruth?: "manual" | "placeholder" | "csv" | "live" | "unavailable" | null;
  adminAuthored?: boolean | null;
  aiDraftAllowed?: boolean | null;
  liveAiExecuted?: boolean | null;
}

export interface MonthlyReportRecommendationPolicyResult {
  ok: boolean;
  origin: MonthlyReportRecommendationOrigin | null;
  clientSafe: boolean;
  requiresAdminReview: boolean;
  liveAiBlocked: boolean;
  errors: string[];
  adminLabel: string;
  clientLabel: string;
}

const ORIGINS = new Set<MonthlyReportRecommendationOrigin>([
  "metrics_based",
  "manual_admin",
  "ai_drafted",
  "placeholder"
]);

export function resolveMonthlyReportRecommendationPolicy(
  input: MonthlyReportRecommendationInput
): MonthlyReportRecommendationPolicyResult {
  const errors: string[] = [];
  const rawOrigin = typeof input.origin === "string" ? input.origin.trim().toLowerCase() : "";
  const origin = ORIGINS.has(rawOrigin as MonthlyReportRecommendationOrigin)
    ? (rawOrigin as MonthlyReportRecommendationOrigin)
    : null;

  if (!origin) {
    errors.push("recommendation origin is required");
  }

  const text = typeof input.text === "string" ? input.text.trim() : "";
  if (!text) {
    errors.push("recommendation text is required");
  }

  // Hard rule: no live AI execution in this lane.
  if (input.liveAiExecuted === true) {
    errors.push("live AI execution is not allowed for monthly report recommendations");
  }

  if (origin === "ai_drafted" && input.aiDraftAllowed !== true) {
    errors.push("AI-drafted recommendations require explicit aiDraftAllowed=true (draft-only, no live AI)");
  }

  if (origin === "metrics_based") {
    const truth = input.metricsTruth ?? null;
    if (!truth || truth === "unavailable" || truth === "placeholder") {
      errors.push("metrics-based recommendations require non-placeholder approved metrics truth");
    }
  }

  if (origin === "manual_admin" && input.adminAuthored !== true) {
    errors.push("manual_admin recommendations require adminAuthored=true");
  }

  const liveAiBlocked = true;
  const requiresAdminReview = origin === "ai_drafted" || origin === "metrics_based";
  const clientSafe = origin === "manual_admin" || origin === "metrics_based" || origin === "placeholder";

  if (errors.length > 0) {
    return {
      ok: false,
      origin,
      clientSafe: false,
      requiresAdminReview: true,
      liveAiBlocked,
      errors,
      adminLabel: "recommendation input rejected",
      clientLabel: "Recommendation unavailable"
    };
  }

  const labels: Record<MonthlyReportRecommendationOrigin, { admin: string; client: string }> = {
    metrics_based: {
      admin: "metrics-based recommendation (admin review required)",
      client: "Recommendation based on approved metrics"
    },
    manual_admin: {
      admin: "manual admin-authored recommendation",
      client: "Operator recommendation"
    },
    ai_drafted: {
      admin: "AI-drafted recommendation (draft only; no live AI executed)",
      client: "Draft recommendation pending admin review"
    },
    placeholder: {
      admin: "placeholder recommendation scaffold",
      client: "Planning recommendation (placeholder)"
    }
  };

  return {
    ok: true,
    origin,
    clientSafe,
    requiresAdminReview,
    liveAiBlocked,
    errors: [],
    adminLabel: labels[origin!].admin,
    clientLabel: labels[origin!].client
  };
}
