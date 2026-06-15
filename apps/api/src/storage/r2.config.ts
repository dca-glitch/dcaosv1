export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
  publicBaseUrl: string | null;
}

const R2_ENV_KEYS = {
  accountId: "R2_ACCOUNT_ID",
  accessKeyId: "R2_ACCESS_KEY_ID",
  secretAccessKey: "R2_SECRET_ACCESS_KEY",
  bucketName: "R2_BUCKET_NAME",
  endpoint: "R2_ENDPOINT",
  publicBaseUrl: "R2_PUBLIC_BASE_URL"
} as const;

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
