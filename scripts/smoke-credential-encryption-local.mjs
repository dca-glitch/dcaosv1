/**
 * Architecture Block 4 — publication target credential encryption smoke.
 * Proves credential status, guarded save when encryption is off, and roundtrip when master key is configured.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const defaultLocalApiBaseUrl = "http://127.0.0.1:4000/api/v1";
const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? defaultLocalApiBaseUrl).replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][CREDENTIAL_ENCRYPTION]";

const forbiddenPatterns = [
  /applicationPassword/i,
  /passwordHash/i,
  /ciphertext/i,
  /"iv"/i,
  /authTag/i
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

  const token = await login();
  record("admin login", true, "200");

  const encryptionConfiguredLocally = Boolean(process.env.CREDENTIAL_ENCRYPTION_MASTER_KEY?.trim());
  if (encryptionConfiguredLocally) {
    record("local CREDENTIAL_ENCRYPTION_MASTER_KEY present in .env", true, "present");
  } else {
    console.log("NOTE: CREDENTIAL_ENCRYPTION_MASTER_KEY missing in .env — running guarded-save path only.");
  }

  const clientName = `${smokeMarker} ${makeSmokeId("client")}`;
  const targetLabel = `${smokeMarker} target`;
  const targetUrl = "https://smoke-credential-encryption.example.local";
  const testPassword = `smoke-app-password-${makeSmokeId("secret")}`;

  const createdClient = await request("/clients", {
    method: "POST",
    token,
    body: {
      name: clientName,
      website: "https://smoke-credential.example.local",
      clientKind: "AGENCY_CLIENT",
      legalEntityName: "Smoke Credential Entity LLC"
    }
  });
  record("create smoke client", createdClient.status === 201 && createdClient.body?.ok === true, `${createdClient.status}`);
  if (createdClient.status !== 201) {
    process.exitCode = 1;
    return;
  }

  const clientId = createdClient.body?.data?.client?.id;
  const createdTarget = await request(`/clients/${clientId}/publication-targets`, {
    method: "POST",
    token,
    body: { label: targetLabel, siteUrl: targetUrl, isDefault: true }
  });
  record("create publication target", createdTarget.status === 201 && createdTarget.body?.ok === true, `${createdTarget.status}`);
  if (createdTarget.status !== 201) {
    process.exitCode = 1;
    return;
  }

  const publicationTargetId = createdTarget.body?.data?.publicationTarget?.id;
  const statusBefore = await request(
    `/clients/${clientId}/publication-targets/${publicationTargetId}/credentials`,
    { token }
  );
  record(
    "credential status before save",
    statusBefore.status === 200 &&
      statusBefore.body?.ok === true &&
      statusBefore.body?.data?.configured === false,
    `${statusBefore.status}`
  );
  record(
    "credential status response hides secrets",
    !responseLeaksSecrets(statusBefore.text),
    responseLeaksSecrets(statusBefore.text) ? "forbidden field leaked" : "clean"
  );

  const encryptionAvailableFromApi = Boolean(statusBefore.body?.data?.encryptionAvailable);

  const saveAttempt = await request(`/clients/${clientId}/publication-targets/${publicationTargetId}/credentials`, {
    method: "POST",
    token,
    body: { applicationPassword: testPassword }
  });

  if (encryptionAvailableFromApi) {
    record(
      "save encrypted credentials",
      saveAttempt.status === 200 && saveAttempt.body?.ok === true && saveAttempt.body?.data?.configured === true,
      `${saveAttempt.status}`
    );
    record(
      "save response hides secrets",
      !responseLeaksSecrets(saveAttempt.text) && !saveAttempt.text.includes(testPassword),
      saveAttempt.text.includes(testPassword) ? "plaintext leaked" : "clean"
    );

    const statusAfterSave = await request(
      `/clients/${clientId}/publication-targets/${publicationTargetId}/credentials`,
      { token }
    );
    record(
      "credential status after save",
      statusAfterSave.status === 200 && statusAfterSave.body?.data?.configured === true,
      `${statusAfterSave.status}`
    );

    const deleteResponse = await request(
      `/clients/${clientId}/publication-targets/${publicationTargetId}/credentials`,
      { method: "DELETE", token }
    );
    record(
      "delete credentials",
      deleteResponse.status === 200 && deleteResponse.body?.data?.configured === false,
      `${deleteResponse.status}`
    );
  } else {
    record(
      "save rejected when encryption unavailable",
      saveAttempt.status === 400 && saveAttempt.body?.ok === false,
      `${saveAttempt.status}`
    );
    record(
      "rejected save response hides secrets",
      !responseLeaksSecrets(saveAttempt.text) && !saveAttempt.text.includes(testPassword),
      "clean"
    );
    console.log(
      "NOTE: Set CREDENTIAL_ENCRYPTION_MASTER_KEY in .env and restart API to run full encrypt/save/delete roundtrip."
    );
  }

  const failed = results.filter((entry) => !entry.ok);
  if (failed.length > 0) {
    console.error(`STOP: ${failed.length} credential encryption check(s) failed.`);
    process.exitCode = 1;
    return;
  }

  console.log(
    encryptionAvailableFromApi
      ? "PROVEN: encrypted credential save/status/delete roundtrip with secret-safe API responses."
      : "PROVEN: credential endpoints fail closed when encryption master key is unavailable."
  );
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : "Credential encryption smoke failed."}`);
  process.exitCode = 1;
});
