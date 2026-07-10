/**
 * Partial / disabled R2 config diagnostics — env key names and booleans only.
 * Never reads or returns secret values. Never performs bucket IO.
 */

import {
  getR2Config,
  getR2EnvPresence,
  R2_ENV_KEYS,
  R2_REQUIRED_ENV_KEYS,
  type R2ConfigReadinessLabel
} from "./r2.config";

export type R2PartialConfigDiagnostics = {
  readinessLabel: R2ConfigReadinessLabel;
  /** Always false: diagnostics are shape-only. */
  liveProven: false;
  /** Always false: no bucket IO is performed. */
  liveIoPerformed: false;
  configured: boolean;
  missingRequiredEnvKeys: Array<(typeof R2_REQUIRED_ENV_KEYS)[number]>;
  presentRequiredEnvKeys: Array<(typeof R2_REQUIRED_ENV_KEYS)[number]>;
  optionalEndpointPresent: boolean;
  optionalPublicBaseUrlPresent: boolean;
  /** True when zero required keys are present (fully disabled). */
  fullyDisabled: boolean;
  /** True when some but not all required keys are present. */
  partiallyConfigured: boolean;
};

/**
 * Boolean/name-only diagnostics for disabled and partial R2 env shapes.
 * Safe for logs and status docs — never includes credential values.
 */
export function getR2PartialConfigDiagnostics(): R2PartialConfigDiagnostics {
  const presence = getR2EnvPresence();
  const configured = Boolean(getR2Config());
  const missingRequiredEnvKeys = R2_REQUIRED_ENV_KEYS.filter((key) => !presence[key]);
  const presentRequiredEnvKeys = R2_REQUIRED_ENV_KEYS.filter((key) => presence[key]);
  const fullyDisabled = presentRequiredEnvKeys.length === 0;
  const partiallyConfigured = !configured && presentRequiredEnvKeys.length > 0;

  let readinessLabel: R2ConfigReadinessLabel;
  if (configured) {
    readinessLabel = "configured_shape_ok";
  } else if (partiallyConfigured) {
    readinessLabel = "missing_config";
  } else {
    readinessLabel = "disabled";
  }

  return {
    readinessLabel,
    liveProven: false,
    liveIoPerformed: false,
    configured,
    missingRequiredEnvKeys,
    presentRequiredEnvKeys,
    optionalEndpointPresent: presence[R2_ENV_KEYS.endpoint],
    optionalPublicBaseUrlPresent: presence[R2_ENV_KEYS.publicBaseUrl],
    fullyDisabled,
    partiallyConfigured
  };
}

/**
 * Disabled-state hardening: when R2 is not fully configured, uploads/downloads must fail closed.
 * Returns a stable label for status reporting without implying live proof.
 */
export function getR2DisabledStateLabel(): "disabled" | "missing_config" | "configured_shape_ok" {
  return getR2PartialConfigDiagnostics().readinessLabel;
}

export function isR2StorageFailClosed(): boolean {
  return !getR2PartialConfigDiagnostics().configured;
}
