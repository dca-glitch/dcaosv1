/**
 * Architecture Block 5 — WordPress publish local gate smoke.
 * Proves publication target credentials + env gate reach the WordPress HTTP path and write PublicationLog entries.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const defaultLocalApiBaseUrl = "http://127.0.0.1:4000/api/v1";
const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? defaultLocalApiBaseUrl).replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const expectPublishEnabled =
  (process.env.SMOKE_EXPECT_WORDPRESS_PUBLISH_ENABLED ?? "").trim().toLowerCase() === "true";
const smokeMarker = "[SMOKE][WP_PUBLISH]";

const forbiddenPatterns = [/applicationPassword/i, /passwordHash/i, /ciphertext/i, /"iv"/i, /authTag/i];
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
  return forbiddenPatterns.some((pattern) => pattern.test(text));
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
  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    console.error("STOP: AUTH_SEED_TEST_PASSWORD is required.");
    process.exitCode = 1;
    return;
  }

  if (!process.env.CREDENTIAL_ENCRYPTION_MASTER_KEY?.trim()) {
    console.error("STOP: CREDENTIAL_ENCRYPTION_MASTER_KEY is required in .env and API must be restarted.");
    process.exitCode = 1;
    return;
  }

  let createdClientId = null;
  let token = null;
  let lastPublishStatus = null;

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
        website: "https://smoke-wp-publish.example.local",
        clientKind: "AGENCY_CLIENT",
        legalEntityName: "Smoke WP Publish Entity LLC"
      }
    });
    record("create smoke client", clientResponse.status === 201 && clientResponse.body?.ok === true, `${clientResponse.status}`);
    if (clientResponse.status !== 201) {
      process.exitCode = 1;
      return;
    }

    createdClientId = clientResponse.body?.data?.client?.id;
    const targetUrl = "https://smoke-wp-publish-target.example.local";
    const targetResponse = await request(`/clients/${createdClientId}/publication-targets`, {
      method: "POST",
      token,
      body: {
        label: `${smokeMarker} target`,
        siteUrl: targetUrl,
        isDefault: true
      }
    });
    record("create publication target", targetResponse.status === 201, `${targetResponse.status}`);
    const publicationTargetId = targetResponse.body?.data?.publicationTarget?.id;
    if (!publicationTargetId) {
      process.exitCode = 1;
      return;
    }

    const credentialStatus = await request(
      `/clients/${createdClientId}/publication-targets/${publicationTargetId}/credentials`,
      { token }
    );
    record(
      "encryption available for credentials",
      credentialStatus.status === 200 && credentialStatus.body?.data?.encryptionAvailable === true,
      `${credentialStatus.status}`
    );

    const testPassword = `smoke-app-password-${makeSmokeId("secret")}`;
    const saveCredentials = await request(
      `/clients/${createdClientId}/publication-targets/${publicationTargetId}/credentials`,
      {
        method: "POST",
        token,
        body: { applicationPassword: testPassword }
      }
    );
    record(
      "save encrypted credentials",
      saveCredentials.status === 200 && saveCredentials.body?.data?.configured === true,
      `${saveCredentials.status}`
    );
    record(
      "credential save hides secrets",
      !responseLeaksSecrets(saveCredentials.text) && !saveCredentials.text.includes(testPassword),
      "clean"
    );

    const projectResponse = await request("/ai-delivery-projects", {
      method: "POST",
      token,
      body: {
        clientId: createdClientId,
        name: `${smokeMarker} ${makeSmokeId("project")}`,
        targetMonth: "2026-07"
      }
    });
    record("create ai delivery project", projectResponse.status === 201, `${projectResponse.status}`);
    const projectId = projectResponse.body?.data?.aiDeliveryProject?.id;
    if (!projectId) {
      process.exitCode = 1;
      return;
    }

    const deliverableResponse = await request(`/ai-delivery-projects/${projectId}/deliverables`, {
      method: "POST",
      token,
      body: {
        title: `${smokeMarker} deliverable`,
        description: "Smoke WordPress publish body content.",
        deliveryType: "CONTENT_PACKAGE",
        status: "DRAFT"
      }
    });
    record("create deliverable", deliverableResponse.status === 201, `${deliverableResponse.status}`);
    const deliverableId = deliverableResponse.body?.data?.deliverable?.id;
    if (!deliverableId) {
      process.exitCode = 1;
      return;
    }

    const publishResponse = await request(
      `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/publish-wordpress`,
      {
        method: "POST",
        token,
        body: { publicationTargetId }
      }
    );
    record(
      "publish-wordpress endpoint",
      publishResponse.status === 200 && publishResponse.body?.ok === true,
      `${publishResponse.status}`
    );
    record(
      "publish response hides secrets",
      !responseLeaksSecrets(publishResponse.text) && !publishResponse.text.includes(testPassword),
      "clean"
    );

    const publishResult = publishResponse.body?.data?.publishResult;
    const publishStatus = publishResult?.status ?? "missing";
    lastPublishStatus = publishStatus;

    if (expectPublishEnabled) {
      record(
        "publish gate open (not provider_disabled)",
        publishStatus !== "provider_disabled",
        publishStatus
      );
      record(
        "publish attempted external call (error or published)",
        publishStatus === "error" || publishStatus === "published",
        publishStatus
      );
    } else {
      record(
        "publish gate closed or open",
        publishStatus === "provider_disabled" || publishStatus === "error" || publishStatus === "published",
        publishStatus
      );
      if (publishStatus === "provider_disabled") {
        console.log("NOTE: WORDPRESS_PUBLISH_ENABLED is off on the running API (expected default local gate).");
      }
    }

    const logsResponse = await request(`/clients/${createdClientId}/publication-logs`, { token });
    record("publication logs list", logsResponse.status === 200 && logsResponse.body?.ok === true, `${logsResponse.status}`);
    const logs = logsResponse.body?.data?.publicationLogs ?? [];
    const publishLog = Array.isArray(logs)
      ? logs.find((entry) => entry.deliverableId === deliverableId && entry.action === "PUBLISH_WORDPRESS")
      : null;
    record(
      "publication log entry for publish",
      Boolean(publishLog),
      publishLog?.status ?? "missing"
    );
    record(
      "publication logs hide secrets",
      !responseLeaksSecrets(logsResponse.text),
      "clean"
    );
  } catch (error) {
    record("wordpress publish smoke runtime", false, error instanceof Error ? error.message : String(error));
  } finally {
    if (createdClientId && token) {
      await request(`/clients/${createdClientId}/archive`, { method: "POST", token }).catch(() => undefined);
    }
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) {
    process.exitCode = 1;
  } else if (expectPublishEnabled) {
    console.log("PROVEN: WordPress publish gate open — credentials + env reached HTTP attempt and PublicationLog.");
  } else if (lastPublishStatus === "provider_disabled") {
    console.log("PROVEN: WordPress publish fail-closed when WORDPRESS_PUBLISH_ENABLED is off.");
  } else {
    console.log("PROVEN: WordPress publish path exercised with PublicationLog (gate may be open locally).");
  }
}

main();
