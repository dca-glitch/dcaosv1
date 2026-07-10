export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
  publicBaseUrl: string | null;
}

export const R2_ENV_KEYS = {
  accountId: "R2_ACCOUNT_ID",
  accessKeyId: "R2_ACCESS_KEY_ID",
  secretAccessKey: "R2_SECRET_ACCESS_KEY",
  bucketName: "R2_BUCKET_NAME",
  endpoint: "R2_ENDPOINT",
  publicBaseUrl: "R2_PUBLIC_BASE_URL"
} as const;

export const R2_REQUIRED_ENV_KEYS = [
  R2_ENV_KEYS.accountId,
  R2_ENV_KEYS.accessKeyId,
  R2_ENV_KEYS.secretAccessKey,
  R2_ENV_KEYS.bucketName
] as const;

function readEnvString(key: string): string | null {
  const value = process.env[key]?.trim();
  return value ? value : null;
}

export function getR2EnvPresence() {
  return {
    [R2_ENV_KEYS.accountId]: Boolean(readEnvString(R2_ENV_KEYS.accountId)),
    [R2_ENV_KEYS.accessKeyId]: Boolean(readEnvString(R2_ENV_KEYS.accessKeyId)),
    [R2_ENV_KEYS.secretAccessKey]: Boolean(readEnvString(R2_ENV_KEYS.secretAccessKey)),
    [R2_ENV_KEYS.bucketName]: Boolean(readEnvString(R2_ENV_KEYS.bucketName)),
    [R2_ENV_KEYS.endpoint]: Boolean(readEnvString(R2_ENV_KEYS.endpoint)),
    [R2_ENV_KEYS.publicBaseUrl]: Boolean(readEnvString(R2_ENV_KEYS.publicBaseUrl))
  };
}

export function getR2Config(): R2Config | null {
  const accountId = readEnvString(R2_ENV_KEYS.accountId);
  const accessKeyId = readEnvString(R2_ENV_KEYS.accessKeyId);
  const secretAccessKey = readEnvString(R2_ENV_KEYS.secretAccessKey);
  const bucketName = readEnvString(R2_ENV_KEYS.bucketName);

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  const configuredEndpoint = readEnvString(R2_ENV_KEYS.endpoint);
  const endpoint = configuredEndpoint ?? `https://${accountId}.r2.cloudflarestorage.com`;

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint: endpoint.replace(/\/+$/, ""),
    publicBaseUrl: readEnvString(R2_ENV_KEYS.publicBaseUrl)?.replace(/\/+$/, "") ?? null
  };
}

/**
 * Config-shape readiness labels for R2. Shape-only — never implies live bucket proof.
 */
export type R2ConfigReadinessLabel = "disabled" | "missing_config" | "configured_shape_ok";

export type R2ConfigRedactedSummary = {
  readinessLabel: R2ConfigReadinessLabel;
  /** Always false: reading env shape is not live R2 proof. */
  liveProven: false;
  presence: ReturnType<typeof getR2EnvPresence>;
  /** Boolean-only: whether endpoint/bucket keys are present (never values). */
  endpointPresent: boolean;
  bucketPresent: boolean;
  accessKeyIdPresent: boolean;
  secretAccessKeyPresent: boolean;
};

/**
 * Redacted R2 config summary for logs/tests/status docs.
 * Never includes access key ID, secret, account id, bucket name, or endpoint values.
 */
export function getR2ConfigRedactedSummary(): R2ConfigRedactedSummary {
  const presence = getR2EnvPresence();
  const configured = Boolean(getR2Config());
  const anyRequiredPresent = R2_REQUIRED_ENV_KEYS.some((key) => presence[key]);

  let readinessLabel: R2ConfigReadinessLabel;
  if (configured) {
    readinessLabel = "configured_shape_ok";
  } else if (anyRequiredPresent) {
    readinessLabel = "missing_config";
  } else {
    readinessLabel = "disabled";
  }

  return {
    readinessLabel,
    liveProven: false,
    presence,
    endpointPresent: presence[R2_ENV_KEYS.endpoint],
    bucketPresent: presence[R2_ENV_KEYS.bucketName],
    accessKeyIdPresent: presence[R2_ENV_KEYS.accessKeyId],
    secretAccessKeyPresent: presence[R2_ENV_KEYS.secretAccessKey]
  };
}

/**
 * Snapshot-friendly redacted summary for tests/docs — stable keys, never secret values.
 */
export function toR2ConfigRedactedSummarySnapshot(
  summary: R2ConfigRedactedSummary = getR2ConfigRedactedSummary()
): {
  readinessLabel: R2ConfigReadinessLabel;
  liveProven: false;
  endpointPresent: boolean;
  bucketPresent: boolean;
  accessKeyIdPresent: boolean;
  secretAccessKeyPresent: boolean;
  accountIdPresent: boolean;
  publicBaseUrlPresent: boolean;
  requiredKeysPresentCount: number;
  allRequiredPresent: boolean;
} {
  const requiredKeysPresentCount = R2_REQUIRED_ENV_KEYS.filter((key) => summary.presence[key]).length;
  return {
    readinessLabel: summary.readinessLabel,
    liveProven: false,
    endpointPresent: summary.endpointPresent,
    bucketPresent: summary.bucketPresent,
    accessKeyIdPresent: summary.accessKeyIdPresent,
    secretAccessKeyPresent: summary.secretAccessKeyPresent,
    accountIdPresent: summary.presence[R2_ENV_KEYS.accountId],
    publicBaseUrlPresent: summary.presence[R2_ENV_KEYS.publicBaseUrl],
    requiredKeysPresentCount,
    allRequiredPresent: requiredKeysPresentCount === R2_REQUIRED_ENV_KEYS.length
  };
}
