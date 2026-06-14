import { AUTH_RUNTIME_ENV } from "./auth.constants";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_REQUEST_TIMEOUT_MS = 5000;

function isTurnstileEnabled(): boolean {
  return process.env[AUTH_RUNTIME_ENV.turnstileEnabled] === "true";
}

function getTurnstileSecretKey(): string {
  return process.env[AUTH_RUNTIME_ENV.turnstileSecretKey] ?? "";
}

async function postTurnstileVerification(
  secret: string,
  responseToken: string,
  remoteIp?: string
): Promise<boolean> {
  const body = new URLSearchParams({
    secret,
    response: responseToken
  });

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), TURNSTILE_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body,
      signal: abortController.signal
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as { success?: boolean };
    return payload.success === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function verifyTurnstileToken(
  turnstileToken: string,
  remoteIp?: string
): Promise<boolean> {
  if (!isTurnstileEnabled()) {
    return true;
  }

  if (!turnstileToken) {
    return false;
  }

  const secret = getTurnstileSecretKey();
  if (!secret) {
    return false;
  }

  return postTurnstileVerification(secret, turnstileToken, remoteIp);
}
