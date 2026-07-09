/**
 * Before/after asset retention policy contract (G56).
 * Destructive cleanup jobs remain deferred — contract only.
 */

export const BEFORE_AFTER_RETENTION_POLICY_VERSION = "BEFORE_AFTER_RETENTION_V1";

/** Max retention for final before/after export assets (days). */
export const BEFORE_AFTER_FINAL_EXPORT_MAX_RETENTION_DAYS = 60;

export type BeforeAfterAssetPhase = "original" | "working" | "final_export";

export type BeforeAfterRetentionDisposition = "temporary" | "retained_until_expiry" | "metadata_only";

export interface BeforeAfterRetentionRule {
  phase: BeforeAfterAssetPhase;
  disposition: BeforeAfterRetentionDisposition;
  maxRetentionDays: number | null;
  notes: string;
}

export const BEFORE_AFTER_RETENTION_RULES: BeforeAfterRetentionRule[] = [
  {
    phase: "original",
    disposition: "temporary",
    maxRetentionDays: null,
    notes: "Client-provided originals are temporary; not retained after processing."
  },
  {
    phase: "working",
    disposition: "temporary",
    maxRetentionDays: null,
    notes: "Working/intermediate files are temporary."
  },
  {
    phase: "final_export",
    disposition: "retained_until_expiry",
    maxRetentionDays: BEFORE_AFTER_FINAL_EXPORT_MAX_RETENTION_DAYS,
    notes: "Final export retained max 60 days; metadata may remain after deletion."
  }
];
