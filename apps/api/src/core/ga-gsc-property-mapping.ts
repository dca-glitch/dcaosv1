/**
 * G519 — GA4 property mapping contract (pure validation; no live Google).
 */

export const GA4_PROPERTY_ID_PATTERN = /^properties\/\d+$/;

export const GA4_PROPERTY_MAPPING_REQUIRED_FIELDS = [
  "tenantId",
  "aiDeliveryProjectId",
  "clientDomain",
  "ga4PropertyId",
  "reportingTimezone"
] as const;

export type Ga4PropertyMappingField = (typeof GA4_PROPERTY_MAPPING_REQUIRED_FIELDS)[number];

export interface Ga4PropertyMappingInput {
  tenantId?: string | null;
  aiDeliveryProjectId?: string | null;
  clientDomain?: string | null;
  ga4PropertyId?: string | null;
  reportingTimezone?: string | null;
  /** Optional human label — never a secret. */
  ga4PropertyDisplayName?: string | null;
}

export interface Ga4PropertyMappingValidation {
  ok: boolean;
  missingFields: Ga4PropertyMappingField[];
  invalidGa4PropertyId: boolean;
  normalized: {
    tenantId: string;
    aiDeliveryProjectId: string;
    clientDomain: string;
    ga4PropertyId: string;
    reportingTimezone: string;
    ga4PropertyDisplayName: string | null;
  } | null;
  liveSyncDeferred: true;
  secretFieldsAllowed: false;
}

function trimOrEmpty(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidGa4PropertyId(value: string): boolean {
  return GA4_PROPERTY_ID_PATTERN.test(value.trim());
}

export function validateGa4PropertyMapping(input: Ga4PropertyMappingInput): Ga4PropertyMappingValidation {
  const tenantId = trimOrEmpty(input.tenantId);
  const aiDeliveryProjectId = trimOrEmpty(input.aiDeliveryProjectId);
  const clientDomain = trimOrEmpty(input.clientDomain);
  const ga4PropertyId = trimOrEmpty(input.ga4PropertyId);
  const reportingTimezone = trimOrEmpty(input.reportingTimezone);
  const ga4PropertyDisplayName = trimOrEmpty(input.ga4PropertyDisplayName) || null;

  const values: Record<Ga4PropertyMappingField, string> = {
    tenantId,
    aiDeliveryProjectId,
    clientDomain,
    ga4PropertyId,
    reportingTimezone
  };

  const missingFields = GA4_PROPERTY_MAPPING_REQUIRED_FIELDS.filter((field) => !values[field]);
  const invalidGa4PropertyId = ga4PropertyId.length > 0 && !isValidGa4PropertyId(ga4PropertyId);
  const ok = missingFields.length === 0 && !invalidGa4PropertyId;

  return {
    ok,
    missingFields,
    invalidGa4PropertyId,
    normalized: ok
      ? {
          tenantId,
          aiDeliveryProjectId,
          clientDomain,
          ga4PropertyId,
          reportingTimezone,
          ga4PropertyDisplayName
        }
      : null,
    liveSyncDeferred: true,
    secretFieldsAllowed: false
  };
}
