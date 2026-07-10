/**
 * G520 — GSC site URL mapping contract (pure validation; no live Google).
 */

export const GSC_SITE_URL_MAPPING_REQUIRED_FIELDS = [
  "tenantId",
  "aiDeliveryProjectId",
  "clientDomain",
  "gscSiteUrl",
  "reportingTimezone"
] as const;

export type GscSiteUrlMappingField = (typeof GSC_SITE_URL_MAPPING_REQUIRED_FIELDS)[number];

export type GscSiteUrlKind = "sc_domain" | "url_prefix" | "invalid";

export interface GscSiteUrlMappingInput {
  tenantId?: string | null;
  aiDeliveryProjectId?: string | null;
  clientDomain?: string | null;
  gscSiteUrl?: string | null;
  reportingTimezone?: string | null;
}

export interface GscSiteUrlMappingValidation {
  ok: boolean;
  missingFields: GscSiteUrlMappingField[];
  siteUrlKind: GscSiteUrlKind;
  domainMatchesClient: boolean | null;
  normalized: {
    tenantId: string;
    aiDeliveryProjectId: string;
    clientDomain: string;
    gscSiteUrl: string;
    reportingTimezone: string;
    siteUrlKind: Exclude<GscSiteUrlKind, "invalid">;
  } | null;
  liveSyncDeferred: true;
  secretFieldsAllowed: false;
}

function trimOrEmpty(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .replace(/^www\./, "");
}

export function classifyGscSiteUrl(gscSiteUrl: string): GscSiteUrlKind {
  const value = gscSiteUrl.trim();
  if (/^sc-domain:[a-z0-9.-]+$/i.test(value)) {
    return "sc_domain";
  }
  if (/^https:\/\/.+/i.test(value)) {
    return "url_prefix";
  }
  return "invalid";
}

export function extractGscSiteDomain(gscSiteUrl: string): string | null {
  const kind = classifyGscSiteUrl(gscSiteUrl);
  const value = gscSiteUrl.trim();
  if (kind === "sc_domain") {
    return normalizeDomain(value.slice("sc-domain:".length));
  }
  if (kind === "url_prefix") {
    try {
      return normalizeDomain(new URL(value).hostname);
    } catch {
      return null;
    }
  }
  return null;
}

export function validateGscSiteUrlMapping(input: GscSiteUrlMappingInput): GscSiteUrlMappingValidation {
  const tenantId = trimOrEmpty(input.tenantId);
  const aiDeliveryProjectId = trimOrEmpty(input.aiDeliveryProjectId);
  const clientDomain = trimOrEmpty(input.clientDomain);
  const gscSiteUrl = trimOrEmpty(input.gscSiteUrl);
  const reportingTimezone = trimOrEmpty(input.reportingTimezone);

  const values: Record<GscSiteUrlMappingField, string> = {
    tenantId,
    aiDeliveryProjectId,
    clientDomain,
    gscSiteUrl,
    reportingTimezone
  };

  const missingFields = GSC_SITE_URL_MAPPING_REQUIRED_FIELDS.filter((field) => !values[field]);
  const siteUrlKind = gscSiteUrl ? classifyGscSiteUrl(gscSiteUrl) : "invalid";
  const siteDomain = gscSiteUrl ? extractGscSiteDomain(gscSiteUrl) : null;
  const clientNormalized = clientDomain ? normalizeDomain(clientDomain) : "";
  const domainMatchesClient =
    siteDomain && clientNormalized ? siteDomain === clientNormalized || siteDomain.endsWith(`.${clientNormalized}`) : null;

  const ok =
    missingFields.length === 0 &&
    siteUrlKind !== "invalid" &&
    domainMatchesClient !== false;

  return {
    ok,
    missingFields,
    siteUrlKind,
    domainMatchesClient,
    normalized:
      ok
        ? {
            tenantId,
            aiDeliveryProjectId,
            clientDomain,
            gscSiteUrl,
            reportingTimezone,
            siteUrlKind
          }
        : null,
    liveSyncDeferred: true,
    secretFieldsAllowed: false
  };
}
