/**
 * Legacy tenant WordPress config sunset smoke.
 * Proves publication targets are the supported path and legacy POST is blocked.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const defaultLocalApiBaseUrl = "http://127.0.0.1:4000/api/v1";
const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? defaultLocalApiBaseUrl).replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][LEGACY_WP_SUNSET]";

const results = [];

function loadRepoEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  for (const rawLine of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadRepoEnv();

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

function makeSmokeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getErrorCode(response) {
  return response.body?.error?.code ?? null;
}

async function request(path, options = {}) {
  const headers = { Accept: "application/json" };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { status: response.status, body, text };
}

async function login() {
  const response = await request("/auth/login", {
    method: "POST",
    body: { email: adminEmail, password: adminPassword }
  });
  if (response.status !== 200 || response.body?.ok !== true) {
    throw new Error(`Admin login failed with HTTP ${response.status}.`);
  }
  const token = response.body?.data?.session?.token ?? response.body?.data?.token;
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Admin login did not return a session token.");
  }
  return token;
}

async function main() {
  console.log(`${smokeMarker} starting`);

  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    console.error("STOP: AUTH_SEED_TEST_PASSWORD is required.");
    process.exitCode = 1;
    return;
  }

  let createdClientId = null;
  let token = null;

  try {
    const health = await request("/health");
    record(
      "api health ready",
      health.status === 200 && health.body?.ok === true && health.body?.data?.database?.status === "ready",
      `${health.status}`
    );
    if (health.status !== 200) {
      process.exitCode = 1;
      return;
    }

    token = await login();
    record("admin login", true, "200");

    const clientResponse = await request("/clients", {
      method: "POST",
      token,
      body: {
        name: `${smokeMarker} ${makeSmokeId("client")}`,
        website: "https://legacy-wp-sunset.example.local",
        clientKind: "AGENCY_CLIENT",
        legalEntityName: "Legacy WP Sunset Entity LLC"
      }
    });
    record("create smoke client", clientResponse.status === 201 && clientResponse.body?.ok === true, `${clientResponse.status}`);
    if (clientResponse.status !== 201) {
      process.exitCode = 1;
      return;
    }

    createdClientId = clientResponse.body?.data?.client?.id;
    const targetUrl = "https://legacy-wp-sunset-target.example.local";
    const targetResponse = await request(`/clients/${createdClientId}/publication-targets`, {
      method: "POST",
      token,
      body: {
        label: `${smokeMarker} target`,
        siteUrl: targetUrl,
        isDefault: true
      }
    });
    record(
      "create publication target",
      targetResponse.status === 201 && targetResponse.body?.data?.publicationTarget?.siteUrl === targetUrl,
      `${targetResponse.status}`
    );

    const legacyGet = await request("/tenant/wordpress-config", { token });
    record(
      "legacy GET remains read-only",
      legacyGet.status === 200 && legacyGet.body?.meta?.readOnly === true && legacyGet.body?.meta?.sunset === true,
      `${legacyGet.status}`
    );

    const legacyPost = await request("/tenant/wordpress-config", {
      method: "POST",
      token,
      body: {
        siteUrl: targetUrl,
        siteSlug: "blocked",
        wordPressComSite: true
      }
    });
    record(
      "legacy POST blocked with WORDPRESS_CONFIG_DEPRECATED",
      legacyPost.status === 410 && getErrorCode(legacyPost) === "WORDPRESS_CONFIG_DEPRECATED",
      `${legacyPost.status} ${getErrorCode(legacyPost)}`
    );
  } catch (error) {
    record("legacy wordpress sunset smoke runtime", false, error instanceof Error ? error.message : String(error));
  } finally {
    if (createdClientId && token) {
      await request(`/clients/${createdClientId}/archive`, {
        method: "POST",
        token
      }).catch(() => undefined);
    }
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main();
