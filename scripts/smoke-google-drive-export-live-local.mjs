/**
 * Post-MVP Block 43 — Google Drive export config + guarded export local proof.
 * Baseline pass when live export is not configured; optional strict pass when Google Drive credentials are present.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][GOOGLE_DRIVE_EXPORT_LIVE]";
const expectGoogleDriveLive = (process.env.SMOKE_EXPECT_GOOGLE_DRIVE_LIVE ?? "").trim().toLowerCase() === "true";

const exportForbiddenFields = [
  "storageKey",
  "workflowRunId",
  "executionLog",
  "executionError",
  "tenantId",
  "prompt",
  "reviewNotes",
  "reviewerName",
  "draftBody",
  "privateKey",
  "serviceAccountEmail"
];

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

function responseLeaksSecrets(text) {
  if (/-----BEGIN/i.test(text)) return true;
  if (/passwordHash/i.test(text)) return true;
  if (/sessionTokenHash/i.test(text)) return true;
  if (/"GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"\s*:\s*"[^"]{8,}/i.test(text)) return true;
  if (/"GOOGLE_SERVICE_ACCOUNT_EMAIL"\s*:\s*"[^"]+@[^"]+"/i.test(text)) return true;
  return false;
}

function containsForbiddenField(value, fieldName) {
  const text = JSON.stringify(value ?? {});
  const pattern = new RegExp(`(?:^|[^A-Za-z0-9_])${fieldName}(?:[^A-Za-z0-9_]|$)`);
  return pattern.test(text);
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
  if (response.status !== 200) {
    throw new Error(`Admin login failed with HTTP ${response.status}.`);
  }
  const token = response.body?.data?.session?.token ?? null;
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Admin login did not return a session token.");
  }
  return token;
}

async function main() {
  console.log(`${smokeMarker} starting`);

  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    record("env AUTH_SEED_TEST_PASSWORD", false, "missing");
    process.exitCode = 1;
    return;
  }
  record("env AUTH_SEED_TEST_PASSWORD", true, "present");

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

  try {
    const token = await login();
    record("admin login", true, "200");

    const exportConfigResponse = await request("/integrations/google-drive/export-config", { token });
    record(
      "google drive export config reachable",
      exportConfigResponse.status === 200 && exportConfigResponse.body?.ok === true,
      `${exportConfigResponse.status}`
    );
    record(
      "google drive export config hides secrets",
      !responseLeaksSecrets(exportConfigResponse.text),
      responseLeaksSecrets(exportConfigResponse.text) ? "secret pattern detected" : "safe response"
    );

    const exportConfig = exportConfigResponse.body?.data?.exportConfig ?? null;
    record(
      "google drive export config returns liveExportConfigured boolean",
      typeof exportConfig?.liveExportConfigured === "boolean",
      String(exportConfig?.liveExportConfigured)
    );
    record(
      "google drive export config returns exportEnabledFlag boolean",
      typeof exportConfig?.exportEnabledFlag === "boolean",
      String(exportConfig?.exportEnabledFlag)
    );
    record(
      "google drive export config returns envPresence object",
      exportConfig?.envPresence !== null && typeof exportConfig?.envPresence === "object",
      "envPresence"
    );

    if (expectGoogleDriveLive) {
      record(
        "strict google drive live export configured",
        exportConfig?.liveExportConfigured === true,
        String(exportConfig?.liveExportConfigured)
      );
    } else {
      record(
        "baseline live export not configured",
        exportConfig?.liveExportConfigured === false,
        String(exportConfig?.liveExportConfigured)
      );
    }

    const client = (
      await request("/clients", {
        method: "POST",
        token,
        body: { name: `${smokeMarker} ${makeSmokeId("client")}`, country: "United States" }
      })
    ).body?.data?.client;

    if (!client?.id) {
      throw new Error("Client fixture create failed.");
    }

    const projectResponse = await request("/ai-delivery-projects", {
      method: "POST",
      token,
      body: {
        clientId: client.id,
        name: `${smokeMarker} ${makeSmokeId("project")}`,
        targetMonth: "2027-11"
      }
    });
    record("ai delivery project fixture create", projectResponse.status === 201, `${projectResponse.status}`);
    const projectId = projectResponse.body?.data?.aiDeliveryProject?.id ?? null;
    if (!projectId) {
      throw new Error("AI Delivery project fixture did not return an id.");
    }

    const deliverableResponse = await request(`/ai-delivery-projects/${projectId}/deliverables`, {
      method: "POST",
      token,
      body: {
        title: `${smokeMarker} ${makeSmokeId("deliverable")}`,
        description: "Google Drive export live smoke deliverable.",
        status: "DRAFT"
      }
    });
    record("deliverable fixture create", deliverableResponse.status === 201, `${deliverableResponse.status}`);
    const deliverableId = deliverableResponse.body?.data?.deliverable?.id ?? null;
    if (!deliverableId) {
      throw new Error("Deliverable fixture did not return an id.");
    }

    const unauthExport = await request(
      `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/export-google-doc`,
      { method: "POST", body: {} }
    );
    record("export endpoint requires auth", unauthExport.status === 401, `${unauthExport.status}`);

    const exportResponse = await request(
      `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/export-google-doc`,
      { method: "POST", token, body: {} }
    );
    const exportData = exportResponse.body?.data ?? null;
    record(
      "export endpoint responds with data",
      exportData !== null && typeof exportData === "object",
      `${exportResponse.status}`
    );

    if (expectGoogleDriveLive) {
      record(
        "strict export may return exported status",
        exportData?.providerStatus === "exported" || exportData?.providerStatus === "provider_disabled",
        exportData?.providerStatus ?? "missing"
      );
    } else {
      const disabledStatuses = ["provider_disabled", "provider_not_configured"];
      record(
        "baseline export returns provider disabled",
        disabledStatuses.includes(exportData?.providerStatus),
        exportData?.providerStatus ?? "missing"
      );
    }

    record(
      "export response deliverableId matches fixture",
      exportData?.deliverableId === deliverableId,
      exportData?.deliverableId ?? "missing"
    );
    record(
      "export response hasGoogleDocExport is boolean",
      typeof exportData?.hasGoogleDocExport === "boolean",
      String(exportData?.hasGoogleDocExport)
    );

    const forbiddenHits = exportForbiddenFields.filter((field) => containsForbiddenField(exportData, field));
    record(
      "export response omits forbidden internal fields",
      forbiddenHits.length === 0,
      forbiddenHits.length ? forbiddenHits.join(", ") : "none"
    );
    record(
      "export response hides PEM material",
      !/-----BEGIN/.test(exportResponse.text),
      "no PEM"
    );
  } catch (error) {
    record("google drive export live smoke runtime", false, error instanceof Error ? error.message : String(error));
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

  if (failed.length === 0) {
    console.log("PROVEN: Google Drive export config is secret-safe and export endpoint stays guarded locally by default.");
  } else {
    console.log("NOT PROVEN: one or more Google Drive export live checks failed.");
  }

  process.exitCode = failed.length > 0 ? 1 : 0;
}

main();
