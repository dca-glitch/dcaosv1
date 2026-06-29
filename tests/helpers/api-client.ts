import { getApiBaseUrl } from "./test-env";

export type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
};

export async function apiRequest<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
    baseUrl?: string;
  } = {}
): Promise<{ status: number; body: ApiEnvelope<T> | null; text: string }> {
  const baseUrl = (options.baseUrl ?? getApiBaseUrl()).replace(/\/$/, "");
  const headers: Record<string, string> = { Accept: "application/json" };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  const body = text ? (JSON.parse(text) as ApiEnvelope<T>) : null;
  return { status: response.status, body, text };
}

export async function login(
  email: string,
  password: string,
  baseUrl?: string
): Promise<{ status: number; token: string | null; body: ApiEnvelope<{ session: { token: string } }> | null }> {
  const response = await apiRequest<{ session: { token: string } }>("/auth/login", {
    method: "POST",
    body: { email, password },
    baseUrl
  });

  const token = response.body?.ok ? response.body.data?.session.token ?? null : null;
  return { status: response.status, token, body: response.body };
}

export function responseHasSensitiveFields(text: string): boolean {
  return /passwordHash|sessionTokenHash|storageKey/i.test(text);
}
