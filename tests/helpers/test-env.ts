const DEFAULT_API_BASE = "http://127.0.0.1:4000/api/v1";
const DEFAULT_WEB_BASE = "http://127.0.0.1:5173";

export function getApiBaseUrl(): string {
  return process.env.MVP_SMOKE_API_BASE_URL ?? DEFAULT_API_BASE;
}

export function getWebBaseUrl(): string {
  return process.env.MVP_SMOKE_WEB_BASE_URL ?? DEFAULT_WEB_BASE;
}

export async function isApiReachable(baseUrl = getApiBaseUrl()): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/health`, {
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function isWebReachable(baseUrl = getWebBaseUrl()): Promise<boolean> {
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}

export function hasSeedPassword(): boolean {
  return typeof process.env.AUTH_SEED_TEST_PASSWORD === "string" &&
    process.env.AUTH_SEED_TEST_PASSWORD.length > 0;
}

export function getAdminEmail(): string {
  return process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
}
