/**
 * Monthly report metric field validation — pure helpers, no live Google.
 */

export type MonthlyReportMetricSourceKind =
  | "MANUAL"
  | "CSV_IMPORT"
  | "GA4"
  | "GSC"
  | "HYBRID"
  | "PLACEHOLDER"
  | "UNAVAILABLE";

export interface MonthlyReportMetricRowInput {
  source?: MonthlyReportMetricSourceKind | string | null;
  clicks?: number | null;
  impressions?: number | null;
  ctr?: number | null;
  position?: number | null;
  articleUrl?: string | null;
}

export interface MonthlyReportMetricValidationResult {
  ok: boolean;
  errors: string[];
  normalized: {
    source: string;
    clicks: number;
    impressions: number;
    ctr: number | null;
    position: number | null;
    articleUrl: string | null;
  } | null;
}

const ALLOWED_SOURCES = new Set<string>([
  "MANUAL",
  "CSV_IMPORT",
  "GA4",
  "GSC",
  "HYBRID",
  "PLACEHOLDER",
  "UNAVAILABLE"
]);

/**
 * Sanitize optional article URL: trim, reject javascript:/data: schemes,
 * strip control characters, and cap length. Empty becomes null.
 */
export function sanitizeMonthlyReportArticleUrl(value: string | null | undefined): {
  ok: boolean;
  articleUrl: string | null;
  error?: string;
} {
  if (value == null) {
    return { ok: true, articleUrl: null };
  }
  if (typeof value !== "string") {
    return { ok: false, articleUrl: null, error: "articleUrl must be a string when provided" };
  }

  const trimmed = value.trim().replace(/[\u0000-\u001f\u007f]/g, "");
  if (trimmed.length === 0) {
    return { ok: true, articleUrl: null };
  }

  if (trimmed.length > 2048) {
    return { ok: false, articleUrl: null, error: "articleUrl exceeds maximum length" };
  }

  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:")) {
    return { ok: false, articleUrl: null, error: "articleUrl scheme is not allowed" };
  }

  return { ok: true, articleUrl: trimmed };
}

export function validateMonthlyReportMetricRow(
  input: MonthlyReportMetricRowInput
): MonthlyReportMetricValidationResult {
  const errors: string[] = [];
  const source = typeof input.source === "string" ? input.source.trim().toUpperCase() : "";

  if (!source) {
    errors.push("source is required");
  } else if (!ALLOWED_SOURCES.has(source)) {
    errors.push(`source must be one of: ${[...ALLOWED_SOURCES].join(", ")}`);
  }

  const clicks = input.clicks;
  const impressions = input.impressions;

  if (clicks == null || typeof clicks !== "number" || Number.isNaN(clicks)) {
    errors.push("clicks must be a number");
  } else if (clicks < 0 || !Number.isFinite(clicks)) {
    errors.push("clicks must be non-negative");
  }

  if (impressions == null || typeof impressions !== "number" || Number.isNaN(impressions)) {
    errors.push("impressions must be a number");
  } else if (impressions < 0 || !Number.isFinite(impressions)) {
    errors.push("impressions must be non-negative");
  }

  let ctr: number | null = input.ctr ?? null;
  if (ctr != null) {
    if (typeof ctr !== "number" || Number.isNaN(ctr) || !Number.isFinite(ctr)) {
      errors.push("ctr must be a finite number when provided");
    } else if (ctr < 0 || ctr > 1) {
      errors.push("ctr must be between 0 and 1 inclusive");
    }
  }

  let position: number | null = input.position ?? null;
  if (position != null) {
    if (typeof position !== "number" || Number.isNaN(position) || !Number.isFinite(position)) {
      errors.push("position must be a finite number when provided");
    } else if (position < 1 || position > 100) {
      errors.push("position must be between 1 and 100 inclusive");
    }
  }

  const urlResult = sanitizeMonthlyReportArticleUrl(input.articleUrl);
  if (!urlResult.ok && urlResult.error) {
    errors.push(urlResult.error);
  }

  if (errors.length > 0) {
    return { ok: false, errors, normalized: null };
  }

  return {
    ok: true,
    errors: [],
    normalized: {
      source,
      clicks: clicks as number,
      impressions: impressions as number,
      ctr,
      position,
      articleUrl: urlResult.articleUrl
    }
  };
}
