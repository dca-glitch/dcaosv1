/**
 * Block 1 — unified external integrations readiness smoke (config-only default).
 * Wraps the shared readiness runner; optional API probe when local API is reachable.
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const runnerPath = resolve(process.cwd(), "apps/api/scripts/check-external-integrations-readiness.runner.ts");
const smokeMarker = "[SMOKE][EXTERNAL_INTEGRATIONS_READINESS]";
const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const probeApi = (process.env.SMOKE_PROBE_EXTERNAL_INTEGRATIONS_API ?? "").trim().toLowerCase() === "true";

const forbiddenValuePatterns = [/sk-or-[a-z0-9]{8,}/i, /passwordHash/i, /sessionTokenHash/i, /-----BEGIN/i];

function record(name, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
  return ok;
}

const runnerResult = spawnSync("npx", ["tsx", runnerPath], {
  cwd: process.cwd(),
  env: process.env,
  encoding: "utf8",
  shell: true
});

if (runnerResult.stdout) {
  process.stdout.write(runnerResult.stdout);
}
if (runnerResult.stderr) {
  process.stderr.write(runnerResult.stderr);
}

let exitCode = runnerResult.status ?? 1;

async function probeReadinessApi() {
  console.log(`${smokeMarker} optional API probe starting`);

  try {
    const health = await fetch(`${apiBaseUrl}/health`);
    if (!health.ok) {
      record("api probe skipped", true, `health HTTP ${health.status}`);
      return;
    }

    const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
    const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
    if (!adminPassword) {
      record("api probe skipped", true, "AUTH_SEED_TEST_PASSWORD not set");
      return;
    }

    const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword })
    });
    const loginBody = await loginResponse.json();
    const token = loginBody?.data?.session?.token;
    if (!token) {
      record("api probe login", false, `HTTP ${loginResponse.status}`);
      exitCode = 1;
      return;
    }

    const readinessResponse = await fetch(`${apiBaseUrl}/integrations/readiness`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
    });
    const readinessText = await readinessResponse.text();
    const readinessBody = readinessText ? JSON.parse(readinessText) : null;
    const categories = readinessBody?.data?.readiness?.categories ?? [];

    if (
      !record(
        "api integrations readiness reachable",
        readinessResponse.status === 200 && readinessBody?.ok === true,
        `${readinessResponse.status}`
      )
    ) {
      exitCode = 1;
      return;
    }

    if (
      !record(
        "api integrations readiness has five categories",
        Array.isArray(categories) && categories.length === 5,
        `count=${categories.length}`
      )
    ) {
      exitCode = 1;
    }

    if (
      !record(
        "api integrations readiness hides secrets",
        !forbiddenValuePatterns.some((pattern) => pattern.test(readinessText)),
        "safe response"
      )
    ) {
      exitCode = 1;
    }

    if (
      !record(
        "api integrations readiness marks live calls deferred",
        readinessBody?.data?.readiness?.summary?.noLiveCallsInThisLayer === true,
        String(readinessBody?.data?.readiness?.summary?.noLiveCallsInThisLayer)
      )
    ) {
      exitCode = 1;
    }
  } catch (error) {
    record("api probe runtime", false, error instanceof Error ? error.message : String(error));
    exitCode = 1;
  }
}

if (exitCode === 0) {
  if (probeApi) {
    await probeReadinessApi();
  } else {
    console.log(`${smokeMarker} API probe skipped (set SMOKE_PROBE_EXTERNAL_INTEGRATIONS_API=true to enable)`);
    console.log(
      "PROVEN: External integrations readiness smoke passed without requiring live API or external calls."
    );
  }
}

process.exit(exitCode);
