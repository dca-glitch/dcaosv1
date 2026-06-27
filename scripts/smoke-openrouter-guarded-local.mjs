/**
 * Post-MVP Block 40 — OpenRouter guarded local proof.
 * Baseline pass in local deterministic mode; optional strict pass when OpenRouter env is fully configured.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][OPENROUTER_GUARDED]";
const expectOpenRouterLive = (process.env.SMOKE_EXPECT_OPENROUTER_LIVE ?? "").trim().toLowerCase() === "true";

const forbiddenPatterns = [/OPENROUTER_API_KEY/i, /sk-or-/i, /passwordHash/i, /sessionTokenHash/i];

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

    const planningResponse = await request("/ai-provider/planning-config", { token });
    record(
      "ai provider planning config reachable",
      planningResponse.status === 200 && planningResponse.body?.ok === true,
      `${planningResponse.status}`
    );
    record("ai provider planning config hides secrets", !responseLeaksSecrets(planningResponse.text), "safe response");

    const planning = planningResponse.body?.data?.planning ?? null;
    record(
      "ai provider planning config returns textGateway",
      planning?.textGateway === "local" || planning?.textGateway === "openrouter",
      planning?.textGateway ?? "missing"
    );
    record(
      "ai provider planning config reports hasOpenRouterApiKey boolean",
      typeof planning?.hasOpenRouterApiKey === "boolean",
      String(planning?.hasOpenRouterApiKey)
    );
    record(
      "ai provider planning config includes validation object",
      typeof planning?.validation?.ok === "boolean" && Array.isArray(planning?.validation?.issues),
      planning?.validation?.ok === false ? "issues present" : "ok"
    );

    if (expectOpenRouterLive) {
      record(
        "strict openrouter live execution enabled",
        planning?.openRouterLiveExecutionEnabled === true,
        String(planning?.openRouterLiveExecutionEnabled)
      );
    } else {
      record(
        "baseline local deterministic gateway",
        planning?.textGateway === "local" && planning?.openRouterLiveExecutionEnabled === false,
        `${planning?.textGateway ?? "missing"} / live=${planning?.openRouterLiveExecutionEnabled}`
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
        targetMonth: "2027-09"
      }
    });

    record("ai delivery project fixture create", projectResponse.status === 201, `${projectResponse.status}`);
    const projectId = projectResponse.body?.data?.aiDeliveryProject?.id ?? null;
    if (!projectId) {
      throw new Error("AI Delivery project fixture did not return an id.");
    }

    const createdRun = (
      await request(`/ai-delivery/projects/${projectId}/workflow-runs`, {
        method: "POST",
        token,
        body: {
          status: "DRAFT",
          adminNotes: `${smokeMarker} guarded execution proof`,
          resultPlaceholder: ""
        }
      })
    ).body?.data?.workflowRun;

    if (!createdRun?.id) {
      throw new Error("Workflow run fixture create failed.");
    }

    const executed = (
      await request(`/ai-delivery/projects/${projectId}/workflow-runs/${createdRun.id}/execute`, {
        method: "POST",
        token
      })
    ).body?.data?.workflowRun;

    record("workflow execute returns result placeholder", typeof executed?.resultPlaceholder === "string", "present");

    if (expectOpenRouterLive) {
      record(
        "strict workflow execution reports openrouter gateway",
        executed?.resultPlaceholder?.includes("Gateway: openrouter") === true,
        executed?.resultPlaceholder?.slice(0, 80) ?? "missing"
      );
    } else {
      record(
        "baseline workflow execution stays on local deterministic gateway",
        executed?.resultPlaceholder?.includes("Gateway: local") === true &&
          executed?.resultPlaceholder?.includes("Model: local-deterministic") === true,
        executed?.resultPlaceholder?.slice(0, 80) ?? "missing"
      );
    }
  } catch (error) {
    record("openrouter guarded smoke runtime", false, error instanceof Error ? error.message : String(error));
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

  if (failed.length === 0) {
    console.log("PROVEN: OpenRouter planning config is safe/read-only and workflow execution remains guarded locally by default.");
  } else {
    console.log("NOT PROVEN: one or more OpenRouter guarded checks failed.");
  }

  process.exitCode = failed.length > 0 ? 1 : 0;
}

main();
