/**
 * Puriva staging Operating Pack constants — config only.
 * Does not call live providers, mutate production, or write credentials.
 * Preferred staging WordPress host is explicit (fail-closed; no first-returned property).
 */

export const PURIVA_STAGING_OPERATING_PACK_VERSION = "PURIVA_STAGING_OPERATING_PACK_V1";

/** Preferred staging publication target — must match owner-approved staging WP host. */
export const PURIVA_STAGING_PUBLICATION_TARGET = {
  label: "Puriva WordPress staging (draft only)",
  siteUrl: "https://purivastaging.digitalcubeagency.net",
  siteSlug: "puriva-staging",
  isDefault: true,
  draftOnly: true,
  livePublish: false
};

export const PURIVA_STAGING_ALLOWED_WP_HOSTS = Object.freeze([
  "purivastaging.digitalcubeagency.net"
]);

/** Monthly AI cap — same as shared pack; tracking + estimated hard stop. */
export const PURIVA_STAGING_MONTHLY_AI_CAP_USD = 100;

/**
 * GA4 / GSC owner mapping placeholders — live access WITHDRAWN.
 * Env IDs may still be recorded for archival mapping; never select the first Google property returned.
 */
export const PURIVA_ANALYTICS_OWNER_GATE = {
  ga4PropertyIdEnv: "PURIVA_GA4_PROPERTY_ID",
  gscSitePropertyEnv: "PURIVA_GSC_SITE_PROPERTY",
  liveAccess: "WITHDRAWN",
  rule: "Live GA4/GSC WITHDRAWN by owner; explicit IDs are archival only and never unlock live sync."
};

export function normalizeHostname(website) {
  if (!website || typeof website !== "string") {
    return null;
  }
  try {
    const withProtocol = /^https?:\/\//i.test(website) ? website : `https://${website}`;
    return new URL(withProtocol).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Fail closed unless the publication target host is the preferred staging WP host
 * or an explicitly allowlisted host.
 */
export function assertPurivaStagingWordpressHost(siteUrl, { allowlist = PURIVA_STAGING_ALLOWED_WP_HOSTS } = {}) {
  const host = normalizeHostname(siteUrl);
  if (!host) {
    return { ok: false, reason: "MISSING_SITE_URL", host: null };
  }
  if (!allowlist.includes(host)) {
    return {
      ok: false,
      reason: "STAGING_WP_HOST_MISMATCH",
      host,
      expected: [...allowlist]
    };
  }
  return { ok: true, reason: null, host };
}

/**
 * Analytics mapping — archival IDs only; live access WITHDRAWN.
 */
export function resolvePurivaAnalyticsMapping(env = process.env) {
  const ga4PropertyId = String(env.PURIVA_GA4_PROPERTY_ID ?? "").trim();
  const gscSiteProperty = String(env.PURIVA_GSC_SITE_PROPERTY ?? "").trim();
  if (!ga4PropertyId || !gscSiteProperty) {
    return {
      ok: false,
      status: "MISSING_OWNER_IDS",
      ga4PropertyId: ga4PropertyId || null,
      gscSiteProperty: gscSiteProperty || null,
      liveAccess: "WITHDRAWN"
    };
  }
  return {
    ok: true,
    status: "CONFIGURED_IDS_ONLY",
    ga4PropertyId,
    gscSiteProperty,
    liveAccess: "WITHDRAWN"
  };
}

export function buildPurivaStagingOperatingPackSummary() {
  return {
    version: PURIVA_STAGING_OPERATING_PACK_VERSION,
    publicationTarget: PURIVA_STAGING_PUBLICATION_TARGET,
    monthlyAiCapUsd: PURIVA_STAGING_MONTHLY_AI_CAP_USD,
    analyticsOwnerGate: PURIVA_ANALYTICS_OWNER_GATE,
    budgetTracking: "PROVEN_VIA_LEDGER",
    budgetHardEnforcement: "ESTIMATED_SPEND_ONLY",
    wordpressDraftOnly: true,
    productionMutation: false
  };
}
