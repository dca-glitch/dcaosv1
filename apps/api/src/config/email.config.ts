export type EmailProvider = "local" | "resend";

export interface EmailProviderConfig {
  provider: EmailProvider;
  fromAddress: string;
  replyTo: string;
  hasResendApiKey: boolean;
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

export function getEmailProviderConfig(): EmailProviderConfig {
  return {
    provider: readEmailProvider(),
    fromAddress: readEnvString("EMAIL_FROM_ADDRESS") ?? DEFAULT_EMAIL_FROM_ADDRESS,
    replyTo: readEnvString("EMAIL_REPLY_TO") ?? DEFAULT_EMAIL_REPLY_TO,
    hasResendApiKey: Boolean(readEnvString("RESEND_API_KEY"))
  };
}