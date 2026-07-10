export type EmailProvider = "local" | "resend";

export interface EmailProviderConfig {
  provider: EmailProvider;
  fromAddress: string;
  replyTo: string;
  hasResendApiKey: boolean;
}

export interface EmailProviderSafetyShape extends EmailProviderConfig {
  /** True only when Resend is selected, a key is present, and live send is explicitly authorized. */
  sendingEnabled: boolean;
  /** Inverse of sendingEnabled — default and safe local posture. */
  localNoSend: boolean;
  /** True when Resend+key are configured; owner live proof / authorization still required. */
  liveProofRequired: boolean;
  /** True when Resend+key are present but EMAIL_LIVE_SEND_AUTHORIZED is not true (G505 / G515). */
  liveSendDeferred: boolean;
  /** Explicit owner authorization flag presence (never implies a send occurred). */
  liveSendAuthorized: boolean;
}

const DEFAULT_EMAIL_PROVIDER: EmailProvider = "local";
const DEFAULT_EMAIL_FROM_ADDRESS = "no-reply@notifications.digitalcubeagency.net";
const DEFAULT_EMAIL_REPLY_TO = "admin@digitalcubeagency.net";

function readEnvString(key: string): string | null {
  const value = process.env[key]?.trim();
  return value ? value : null;
}

function readEmailProvider(): EmailProvider {
  const provider = readEnvString("EMAIL_PROVIDER")?.toLowerCase();

  if (provider === "resend") {
    return "resend";
  }

  return DEFAULT_EMAIL_PROVIDER;
}

function readLiveSendAuthorized(): boolean {
  return readEnvString("EMAIL_LIVE_SEND_AUTHORIZED")?.toLowerCase() === "true";
}

export function getEmailProviderConfig(): EmailProviderConfig {
  return {
    provider: readEmailProvider(),
    fromAddress: readEnvString("EMAIL_FROM_ADDRESS") ?? DEFAULT_EMAIL_FROM_ADDRESS,
    replyTo: readEnvString("EMAIL_REPLY_TO") ?? DEFAULT_EMAIL_REPLY_TO,
    hasResendApiKey: Boolean(readEnvString("RESEND_API_KEY"))
  };
}

/**
 * G505 — disabled / missing / live-deferred safety shape.
 * Never serializes secret values. Key presence is boolean-only.
 */
export function getEmailProviderSafetyShape(): EmailProviderSafetyShape {
  const config = getEmailProviderConfig();
  const liveSendAuthorized = readLiveSendAuthorized();
  const configuredForLive = config.provider === "resend" && config.hasResendApiKey;
  const sendingEnabled = configuredForLive && liveSendAuthorized;

  return {
    ...config,
    sendingEnabled,
    localNoSend: !sendingEnabled,
    liveProofRequired: configuredForLive,
    liveSendDeferred: configuredForLive && !liveSendAuthorized,
    liveSendAuthorized
  };
}
