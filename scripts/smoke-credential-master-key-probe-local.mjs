/**
 * Post-MVP Block 44 — credential master key focused probe.
 * Baseline pass when encryption is off or when encryptionAvailable is reported by the API.
 * Optional strict pass when SMOKE_EXPECT_CREDENTIAL_MASTER_KEY=true requires encrypt roundtrip.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][CREDENTIAL_MASTER_KEY_PROBE]";
const expectMasterKey = (process.env.SMOKE_EXPECT_CREDENTIAL_MASTER_KEY ?? "").trim().toLowerCase() === "true";

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

    const encryptionConfiguredLocally = Boolean(process.env.CREDENTIAL_ENCRYPTION_MASTER_KEY?.trim());
    record(
      "local CREDENTIAL_ENCRYPTION_MASTER_KEY probe",
      true,
      encryptionConfiguredLocally ? "present in env" : "absent in env"
    );

    const createdClient = await request("/clients", {
      method: "POST",
      token,
      body: {
        name: `${smokeMarker} ${makeSmokeId("client")}`,
        website: "https://smoke-master-key-probe.example.local",
        clientKind: "AGENCY_CLIENT"
      }
    });
    record("create smoke client", createdClient.status === 201 && createdClient.body?.ok === true, `${createdClient.status}`);
    const clientId = createdClient.body?.data?.client?.id;
    if (!clientId) {
      throw new Error("Client fixture create failed.");
    }

    const createdTarget = await request(`/clients/${clientId}/publication-targets`, {
      method: "POST",
      token,
      body: {
        label: `${smokeMarker} target`,
        siteUrl: "https://smoke-master-key-probe.example.local",
        isDefault: true
      }
    });
    record("create publication target", createdTarget.status === 201 && createdTarget.body?.ok === true, `${createdTarget.status}`);
    const publicationTargetId = createdTarget.body?.data?.publicationTarget?.id;
    if (!publicationTargetId) {
      throw new Error("Publication target fixture create failed.");
    }

    const statusProbe = await request(
      `/clients/${clientId}/publication-targets/${publicationTargetId}/credentials`,
      { token }
    );
    record(
      "credential status probe reachable",
      statusProbe.status === 200 && statusProbe.body?.ok === true,
      `${statusProbe.status}`
    );
    record(
      "credential status probe hides secrets",
      !responseLeaksSecrets(statusProbe.text),
      responseLeaksSecrets(statusProbe.text) ? "forbidden field leaked" : "clean"
    );
    record(
      "credential status reports configured boolean",
      typeof statusProbe.body?.data?.configured === "boolean",
      String(statusProbe.body?.data?.configured)
    );
    record(
      "credential status reports encryptionAvailable boolean",
      typeof statusProbe.body?.data?.encryptionAvailable === "boolean",
      String(statusProbe.body?.data?.encryptionAvailable)
    );

    const encryptionAvailableFromApi = Boolean(statusProbe.body?.data?.encryptionAvailable);
    const testPassword = `smoke-app-password-${makeSmokeId("secret")}`;

    const saveAttempt = await request(
      `/clients/${clientId}/publication-targets/${publicationTargetId}/credentials`,
      {
        method: "POST",
        token,
        body: { applicationPassword: testPassword }
      }
    );

    if (encryptionAvailableFromApi) {
      record(
        "encrypt roundtrip save succeeds",
        saveAttempt.status === 200 && saveAttempt.body?.ok === true && saveAttempt.body?.data?.configured === true,
        `${saveAttempt.status}`
      );
      record(
        "encrypt roundtrip save hides secrets",
        !responseLeaksSecrets(saveAttempt.text) && !saveAttempt.text.includes(testPassword),
        saveAttempt.text.includes(testPassword) ? "plaintext leaked" : "clean"
      );

      const statusAfterSave = await request(
        `/clients/${clientId}/publication-targets/${publicationTargetId}/credentials`,
        { token }
      );
      record(
        "encrypt roundtrip status after save",
        statusAfterSave.status === 200 && statusAfterSave.body?.data?.configured === true,
        `${statusAfterSave.status}`
      );

      const deleteResponse = await request(
        `/clients/${clientId}/publication-targets/${publicationTargetId}/credentials`,
        { method: "DELETE", token }
      );
      record(
        "encrypt roundtrip delete succeeds",
        deleteResponse.status === 200 && deleteResponse.body?.data?.configured === false,
        `${deleteResponse.status}`
      );
    } else {
      record(
        "baseline save rejected when encryption unavailable",
        saveAttempt.status === 400 && saveAttempt.body?.ok === false,
        `${saveAttempt.status}`
      );
      record(
        "baseline rejected save hides secrets",
        !responseLeaksSecrets(saveAttempt.text) && !saveAttempt.text.includes(testPassword),
        "clean"
      );
    }

    if (expectMasterKey) {
      record(
        "strict encryptionAvailable required",
        encryptionAvailableFromApi === true,
        String(encryptionAvailableFromApi)
      );
      record(
        "strict encrypt roundtrip required",
        encryptionAvailableFromApi &&
          saveAttempt.status === 200 &&
          saveAttempt.body?.ok === true &&
          saveAttempt.body?.data?.configured === true,
        encryptionAvailableFromApi ? "roundtrip ok" : "encryption unavailable"
      );
    } else {
      record(
        "baseline probe passes with current encryption mode",
        encryptionAvailableFromApi
          ? saveAttempt.status === 200 && saveAttempt.body?.data?.configured === true
          : saveAttempt.status === 400 && saveAttempt.body?.ok === false,
        encryptionAvailableFromApi ? "encryption on" : "encryption off"
      );
    }
  } catch (error) {
    record("credential master key probe runtime", false, error instanceof Error ? error.message : String(error));
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

  if (failed.length === 0) {
    console.log("PROVEN: credential master key probe is secret-safe and matches the active encryption mode.");
  } else {
    console.log("NOT PROVEN: one or more credential master key probe checks failed.");
  }

  process.exitCode = failed.length > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error(`${smokeMarker} fatal - ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
