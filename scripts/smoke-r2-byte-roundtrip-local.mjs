/**
 * Post-MVP Block 37 — R2 private storage local byte roundtrip smoke.
 * Proves guarded disabled mode locally, or upload → signed download → byte match when R2 env is configured.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][R2_BYTE_ROUNDTRIP]";
const expectRoundtrip = (process.env.SMOKE_EXPECT_R2_ROUNDTRIP ?? "").trim().toLowerCase() === "true";

const R2_ENV_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME"
];

const uploadPayload = Buffer.from(`${smokeMarker} private storage byte roundtrip proof.`, "utf8");
const uploadBase64 = uploadPayload.toString("base64");
const uploadSha256 = createHash("sha256").update(uploadPayload).digest("hex");

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

function getMissingR2EnvKeys() {
  return R2_ENV_KEYS.filter((key) => {
    const value = process.env[key];
    return typeof value !== "string" || value.trim().length === 0;
  });
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

async function login(email, password) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

function requireOkData(name, response, expectedStatus = 200) {
  const ok = response.status === expectedStatus && response.body?.ok === true;
  record(name, ok, `${response.status}`);
  if (!ok) {
    throw new Error(`${name} failed with HTTP ${response.status}.`);
  }
  return response.body.data;
}

async function createDeliverableFixture(token) {
  const client = requireOkData(
    "r2 roundtrip create client",
    await request("/clients", {
      method: "POST",
      token,
      body: { name: `${smokeMarker} ${makeSmokeId("client")}`, country: "United States" }
    }),
    201
  ).client;

  const project = requireOkData(
    "r2 roundtrip create ai delivery project",
    await request("/ai-delivery-projects", {
      method: "POST",
      token,
      body: {
        clientId: client.id,
        name: `${smokeMarker} ${makeSmokeId("project")}`,
        targetMonth: "2027-07"
      }
    }),
    201
  ).aiDeliveryProject;

  const deliverable = requireOkData(
    "r2 roundtrip create deliverable",
    await request(`/ai-delivery-projects/${project.id}/deliverables`, {
      method: "POST",
      token,
      body: {
        title: `${smokeMarker} deliverable`,
        description: "Private storage byte roundtrip fixture.",
        deliveryType: "ARTICLE_DRAFT",
        status: "DRAFT",
        notes: "Post-MVP Block 37 fixture."
      }
    }),
    201
  ).deliverable;

  if (!deliverable?.id || deliverable.storageKey !== null) {
    throw new Error("Deliverable fixture did not start with a null storageKey.");
  }

  return { projectId: project.id, deliverableId: deliverable.id };
}

async function proveDisabledUploadGuard(token, fixture, uploadResponse) {
  record(
    "r2 disabled upload returns 503 guard",
    uploadResponse.status === 503 && uploadResponse.body?.error?.code === "R2_STORAGE_NOT_CONFIGURED",
    `${uploadResponse.status}`
  );

  const deliverables = requireOkData(
    "r2 roundtrip deliverables list after guarded upload",
    await request(`/ai-delivery-projects/${fixture.projectId}/deliverables`, { token })
  ).deliverables;

  const deliverable = Array.isArray(deliverables)
    ? deliverables.find((entry) => entry.id === fixture.deliverableId)
    : null;

  record(
    "r2 disabled upload does not persist storageKey",
    Boolean(deliverable && deliverable.storageKey === null),
    deliverable?.storageKey ?? "missing deliverable"
  );

  const downloadReference = requireOkData(
    "r2 roundtrip download-reference while disabled",
    await request(
      `/ai-delivery-projects/${fixture.projectId}/deliverables/${fixture.deliverableId}/download-reference`,
      { token }
    )
  ).downloadReference;

  record(
    "r2 disabled download-reference stays null",
    downloadReference === null,
    downloadReference === null ? "null" : "unexpected reference"
  );
}

async function proveConfiguredByteRoundtrip(token, fixture, uploadResponse) {
  const uploadedDeliverable = requireOkData("r2 configured deliverable upload", uploadResponse)?.deliverable;
  record(
    "r2 configured upload persisted storageKey",
    typeof uploadedDeliverable?.storageKey === "string" && uploadedDeliverable.storageKey.length > 0,
    uploadedDeliverable?.storageKey ?? "missing"
  );
  record(
    "r2 configured upload cleared exportUrl",
    uploadedDeliverable?.exportUrl === null,
    uploadedDeliverable?.exportUrl ?? "null"
  );

  const secureDownload = requireOkData(
    "r2 configured secure download reference",
    await request(
      `/ai-delivery-projects/${fixture.projectId}/deliverables/${fixture.deliverableId}/download`,
      { token }
    )
  );

  record(
    "r2 configured secure download returns signed url",
    typeof secureDownload?.downloadUrl === "string" && secureDownload.downloadUrl.length > 0,
    `${secureDownload?.expiresSeconds ?? 0}s`
  );

  const objectResponse = await fetch(secureDownload.downloadUrl);
  const downloaded = Buffer.from(await objectResponse.arrayBuffer());
  const downloadedSha256 = createHash("sha256").update(downloaded).digest("hex");

  record("r2 configured object download HTTP ok", objectResponse.ok, `${objectResponse.status}`);
  record("r2 byte roundtrip sha256 matches", downloadedSha256 === uploadSha256, uploadSha256);
  record(
    "r2 byte roundtrip payload matches",
    downloaded.equals(uploadPayload),
    `${downloaded.length} bytes`
  );
}

async function main() {
  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    record("env AUTH_SEED_TEST_PASSWORD", false, "missing");
    process.exitCode = 1;
    return;
  }
  record("env AUTH_SEED_TEST_PASSWORD", true, "present");

  const missingR2EnvKeys = getMissingR2EnvKeys();
  record(
    "local R2 env presence checked",
    true,
    missingR2EnvKeys.length === 0 ? "all required keys present in process env" : `missing ${missingR2EnvKeys.join(", ")}`
  );

  const health = await request("/health");
  record(
    "api health ready",
    health.status === 200 && health.body?.ok === true && health.body?.data?.database?.status === "ready",
    `${health.status}`
  );
  if (health.status !== 200 || health.body?.data?.database?.status !== "ready") {
    process.exitCode = 1;
    return;
  }

  const loginResponse = await login(adminEmail, adminPassword);
  const token = loginResponse.body?.data?.session?.token ?? null;
  record("admin login", loginResponse.status === 200 && typeof token === "string", `${loginResponse.status}`);
  if (!token) {
    process.exitCode = 1;
    return;
  }

  const fixture = await createDeliverableFixture(token);

  const uploadResponse = await request(
    `/ai-delivery-projects/${fixture.projectId}/deliverables/${fixture.deliverableId}/document`,
    {
      method: "POST",
      token,
      body: {
        fileName: "smoke-r2-roundtrip-proof.pdf",
        mimeType: "application/pdf",
        contentBase64: uploadBase64
      }
    }
  );

  if (uploadResponse.status === 503) {
    if (expectRoundtrip) {
      record(
        "SMOKE_EXPECT_R2_ROUNDTRIP",
        false,
        "API returned disabled guard; configure R2 env and restart local API"
      );
    } else {
      record("r2 runtime mode", true, "disabled guard (local default)");
      await proveDisabledUploadGuard(token, fixture, uploadResponse);
    }
  } else if (uploadResponse.status === 200 || uploadResponse.status === 201) {
    record("r2 runtime mode", true, "configured roundtrip");
    await proveConfiguredByteRoundtrip(token, fixture, uploadResponse);
  } else {
    record("r2 upload probe", false, `${uploadResponse.status}`);
  }

  const allPassed = results.every((result) => result.ok);
  if (allPassed) {
    if (uploadResponse.status === 503 && !expectRoundtrip) {
      console.log("PROVEN: Local R2 disabled guard blocks upload without persisting storageKey.");
      console.log("NOTE: Set R2 env + restart API + SMOKE_EXPECT_R2_ROUNDTRIP=true for full byte roundtrip proof.");
    } else {
      console.log("PROVEN: R2 private storage upload and signed download byte roundtrip succeeded locally.");
    }
  } else {
    console.log("NOT PROVEN: one or more R2 byte roundtrip checks failed.");
  }

  process.exitCode = allPassed ? 0 : 1;
}

main().catch((error) => {
  console.error(`FAIL r2 byte roundtrip smoke runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
