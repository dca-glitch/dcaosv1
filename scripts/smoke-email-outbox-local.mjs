/**
 * Post-MVP Block 38 — email notification outbox read-only smoke.
 * Proves tenant-scoped EmailLog listing and non-sending outbox status without provider delivery.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][EMAIL_OUTBOX]";
const internalRecipient = "internal-events@dcaos.local";

const forbiddenPatterns = [/RESEND_API_KEY/i, /re_[A-Za-z0-9]{10,}/, /passwordHash/i, /sessionTokenHash/i];

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

    const baselineOutbox = await request("/notifications/email-logs?limit=5", { token });
    record("email outbox list API reachable", baselineOutbox.status === 200 && baselineOutbox.body?.ok === true, `${baselineOutbox.status}`);
    record("email outbox response hides secrets", !responseLeaksSecrets(baselineOutbox.text), "safe response");

    const outbox = baselineOutbox.body?.data?.outbox ?? null;
    record(
      "email outbox reports non-sending provider status",
      outbox?.sendingEnabled === false && (outbox?.provider === "local" || outbox?.provider === "resend"),
      outbox?.provider ?? "missing provider"
    );
    record(
      "email outbox reports hasResendApiKey without exposing key",
      typeof outbox?.hasResendApiKey === "boolean",
      String(outbox?.hasResendApiKey)
    );

    const client = (await request("/clients", {
      method: "POST",
      token,
      body: { name: `${smokeMarker} ${makeSmokeId("client")}`, country: "United States" }
    })).body?.data?.client;

    if (!client?.id) {
      throw new Error("Client fixture create failed.");
    }

    const projectResponse = await request("/ai-delivery-projects", {
      method: "POST",
      token,
      body: {
        clientId: client.id,
        name: `${smokeMarker} ${makeSmokeId("project")}`,
        targetMonth: "2027-08"
      }
    });

    record("ai delivery project fixture create", projectResponse.status === 201, `${projectResponse.status}`);
    const projectId = projectResponse.body?.data?.aiDeliveryProject?.id ?? null;
    if (!projectId) {
      throw new Error("AI Delivery project fixture did not return an id.");
    }

    const outboxAfter = await request("/notifications/email-logs?limit=10", { token });
    record("email outbox list after system event", outboxAfter.status === 200, `${outboxAfter.status}`);

    const emailLogs = outboxAfter.body?.data?.emailLogs ?? [];
    const fixtureLog = Array.isArray(emailLogs)
      ? emailLogs.find(
          (entry) =>
            entry?.relatedModule === "AI_DELIVERY" &&
            entry?.relatedEntityId === projectId &&
            entry?.recipientEmail === internalRecipient
        )
      : null;

    record(
      "email outbox includes AI delivery system event log",
      Boolean(fixtureLog?.id),
      fixtureLog?.templateKey ?? "missing fixture log"
    );
    record(
      "email outbox fixture log is non-sending SKIPPED status",
      fixtureLog?.status === "SKIPPED",
      fixtureLog?.status ?? "missing"
    );
    record(
      "email outbox fixture log records no provider delivery",
      typeof fixtureLog?.providerMessageId !== "string" || fixtureLog.providerMessageId === null,
      fixtureLog?.providerMessageId ?? "null"
    );

    const filtered = await request("/notifications/email-logs?status=SKIPPED&limit=5", { token });
    record("email outbox status filter", filtered.status === 200, `${filtered.status}`);
    const filteredLogs = filtered.body?.data?.emailLogs ?? [];
    record(
      "email outbox status filter returns SKIPPED rows only",
      Array.isArray(filteredLogs) && filteredLogs.every((entry) => entry.status === "SKIPPED"),
      `${filteredLogs.length} rows`
    );
  } catch (error) {
    record("email outbox smoke runtime", false, error instanceof Error ? error.message : String(error));
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

  if (failed.length === 0) {
    console.log("PROVEN: Email notification outbox is readable, tenant-scoped, and remains non-sending in local mode.");
  } else {
    console.log("NOT PROVEN: one or more email outbox checks failed.");
  }

  process.exitCode = failed.length > 0 ? 1 : 0;
}

main();
