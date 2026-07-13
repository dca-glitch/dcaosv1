import { WORDPRESS_LIVE_HTTP_FROZEN } from "../services/wordpress.service";

export const AI_DELIVERY_BOUNDED_EXECUTION_ENV_KEYS = {
  target: "DCA_AI_DELIVERY_EXECUTION_TARGET",
  stagingWordPressHost: "DCA_AI_DELIVERY_STAGING_WORDPRESS_HOST",
  /**
   * Proof-CLI-only Stage B recipient override.
   * Never read by normal application email/notification paths.
   */
  proofOwnerRecipientEmail: "DCA_AI_DELIVERY_BOUNDED_PROOF_OWNER_RECIPIENT_EMAIL"
} as const;

const BOUNDED_PROOF_OWNER_RECIPIENT_PATTERN =
  /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const BOUNDED_PROOF_FORBIDDEN_RECIPIENT_TLDS = new Set(["local", "localhost"]);

export type BoundedExecutionExactScope = {
  tenantId: string;
  clientId: string;
  projectId: string;
  contentDraftId: string;
  publicationTargetId: string;
  initiatingUserId: string;
};

const ALLOWED_DATABASE_NAMES = new Set(["dcaosv1_staging"]);
const ALLOWED_DATABASE_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "dcaosv1-staging-postgres"
]);
const FORBIDDEN_HOST_FRAGMENTS = [
  "system.digitalcubeagency.net",
  "production",
  "prod",
  "live"
];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireExactTrue(env: NodeJS.ProcessEnv, key: string): void {
  if ((env[key] ?? "").trim() !== "true") {
    throw new Error(`${key} must equal true.`);
  }
}

function requireUuid(value: string, name: string): void {
  if (!UUID_PATTERN.test(value.trim())) {
    throw new Error(`${name} must be an exact UUID.`);
  }
}

function parseUrl(raw: string | undefined, name: string): URL {
  if (!raw?.trim()) {
    throw new Error(`${name} is required.`);
  }
  try {
    return new URL(raw);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }
}

function assertNonProductionHost(hostname: string, name: string): void {
  const host = hostname.trim().toLowerCase();
  if (!host || FORBIDDEN_HOST_FRAGMENTS.some((fragment) => host.includes(fragment))) {
    throw new Error(`${name} must not use a production-shaped hostname.`);
  }
}

export function assertBoundedExecutionExactScope(scope: BoundedExecutionExactScope): void {
  requireUuid(scope.tenantId, "tenantId");
  requireUuid(scope.clientId, "clientId");
  requireUuid(scope.projectId, "projectId");
  requireUuid(scope.contentDraftId, "contentDraftId");
  requireUuid(scope.publicationTargetId, "publicationTargetId");
  requireUuid(scope.initiatingUserId, "initiatingUserId");
}

export function assertBoundedStagingDatabaseGuard(
  env: NodeJS.ProcessEnv = process.env
): void {
  if ((env.NODE_ENV ?? "").trim().toLowerCase() === "production") {
    throw new Error("NODE_ENV=production is refused by the staging execution bridge.");
  }
  if ((env[AI_DELIVERY_BOUNDED_EXECUTION_ENV_KEYS.target] ?? "").trim() !== "staging") {
    throw new Error("DCA_AI_DELIVERY_EXECUTION_TARGET must equal staging.");
  }

  const databaseUrl = parseUrl(env.DATABASE_URL, "DATABASE_URL");
  if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
    throw new Error("DATABASE_URL must use PostgreSQL.");
  }
  const host = databaseUrl.hostname.toLowerCase();
  const databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\/+/, "")).toLowerCase();
  assertNonProductionHost(host, "DATABASE_URL");
  if (!ALLOWED_DATABASE_HOSTS.has(host)) {
    throw new Error("DATABASE_URL host is not approved for staging execution.");
  }
  if (!ALLOWED_DATABASE_NAMES.has(databaseName)) {
    throw new Error("DATABASE_URL database name is not the approved staging database.");
  }
}

export function assertBoundedStagingLiveExecutionGuards(input: {
  env?: NodeJS.ProcessEnv;
  scope: BoundedExecutionExactScope;
  wordpressSiteUrl: string;
  retryCount: number;
  fallbackUsed: boolean;
}): void {
  const env = input.env ?? process.env;
  assertBoundedStagingDatabaseGuard(env);
  assertBoundedExecutionExactScope(input.scope);

  requireExactTrue(env, "IMAGE_GENERATION_ENABLED");
  requireExactTrue(env, "IMAGE_GENERATION_LIVE_CALLS_ALLOWED");
  requireExactTrue(env, "WORDPRESS_DRAFT_LIVE_ENABLED");
  requireExactTrue(env, "WORDPRESS_DRAFT_LIVE_CALLS_ALLOWED");
  requireExactTrue(env, "EMAIL_LIVE_SEND_AUTHORIZED");

  if (!WORDPRESS_LIVE_HTTP_FROZEN) {
    throw new Error("Generic WordPress publishing must remain frozen.");
  }
  if ((env.WORDPRESS_PUBLISH_ENABLED ?? "").trim().toLowerCase() === "true") {
    throw new Error("WORDPRESS_PUBLISH_ENABLED must remain disabled.");
  }
  if ((env.IMAGE_GENERATION_PROVIDER ?? "").trim().toLowerCase() !== "openai") {
    throw new Error("IMAGE_GENERATION_PROVIDER must equal openai.");
  }
  if ((env.EMAIL_PROVIDER ?? "").trim().toLowerCase() !== "resend") {
    throw new Error("EMAIL_PROVIDER must equal resend.");
  }
  if (!(env.IMAGE_GENERATION_API_KEY ?? "").trim()) {
    throw new Error("Image provider credential presence is required.");
  }
  if (!(env.RESEND_API_KEY ?? "").trim()) {
    throw new Error("Email provider credential presence is required.");
  }
  for (const key of [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME"
  ]) {
    if (!(env[key] ?? "").trim()) {
      throw new Error(`${key} presence is required.`);
    }
  }

  const siteUrl = parseUrl(input.wordpressSiteUrl, "WordPress site URL");
  assertNonProductionHost(siteUrl.hostname, "WordPress site URL");
  const allowedWordPressHost = (
    env[AI_DELIVERY_BOUNDED_EXECUTION_ENV_KEYS.stagingWordPressHost] ?? ""
  )
    .trim()
    .toLowerCase();
  if (!allowedWordPressHost || siteUrl.hostname.toLowerCase() !== allowedWordPressHost) {
    throw new Error("WordPress hostname must exactly match the approved staging hostname.");
  }
  if (input.retryCount !== 0) {
    throw new Error("retryCount must remain zero.");
  }
  if (input.fallbackUsed !== false) {
    throw new Error("fallbackUsed must remain false.");
  }
}

/**
 * Proof-CLI-only Stage B recipient. Rejects empty, malformed, and *.local addresses.
 * Does not read User.email and is not used by normal application email paths.
 */
export function assertValidBoundedProofOwnerRecipientEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (!email) {
    throw new Error("Bounded proof owner recipient email is required.");
  }
  if (!BOUNDED_PROOF_OWNER_RECIPIENT_PATTERN.test(email)) {
    throw new Error("Bounded proof owner recipient email must be a valid email address.");
  }
  const domain = email.split("@")[1] ?? "";
  const tld = domain.split(".").at(-1) ?? "";
  if (!domain || domain === "localhost" || BOUNDED_PROOF_FORBIDDEN_RECIPIENT_TLDS.has(tld)) {
    throw new Error("Bounded proof owner recipient email must not use a .local or localhost domain.");
  }
  return email;
}

/**
 * Resolve an explicit proof-only override from CLI flag and/or proof-only env var.
 * Returns null when neither is supplied (caller decides whether that is required).
 * CLI value wins over env when both are present.
 */
export function resolveBoundedProofOwnerRecipientOverride(input: {
  cliValue?: string | null;
  env?: NodeJS.ProcessEnv;
}): string | null {
  const env = input.env ?? process.env;
  const fromCli = (input.cliValue ?? "").trim();
  const fromEnv = (
    env[AI_DELIVERY_BOUNDED_EXECUTION_ENV_KEYS.proofOwnerRecipientEmail] ?? ""
  ).trim();
  const raw = fromCli || fromEnv;
  if (!raw) {
    return null;
  }
  return assertValidBoundedProofOwnerRecipientEmail(raw);
}

/** Redact local-part for proof logs; keep domain for operator confirmation. */
export function redactBoundedProofOwnerRecipientEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) {
    return "[REDACTED_EMAIL]";
  }
  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const visible = local.slice(0, Math.min(1, local.length));
  return `${visible}***@${domain}`;
}
