/**
 * No-live OpenRouter API env preflight.
 *
 * Proves a controlled local API process can be started with OpenRouter config
 * shape visible on GET /ai-provider/planning-config.
 *
 * Does NOT:
 * - call OpenRouter
 * - run workflow execute
 * - set SMOKE_EXPECT_OPENROUTER_LIVE
 * - require a real OPENROUTER_API_KEY
 *
 * Uses a dummy key for presence-only config-shape proof, then restores local gateway.
 */

import { execSync, spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const smokeMarker = "[SMOKE][OPENROUTER_API_ENV_PREFLIGHT]";
const approvedModel = "anthropic/claude-haiku-4.5";
const dummyKey = "sk-or-dummy-g77-config-shape-only-not-a-real-key";

const forbiddenPatterns = [/OPENROUTER_API_KEY\s*=/i, /sk-or-v1-[a-z0-9]{16,}/i, /passwordHash/i, /sessionTokenHash/i];
const results = [];
let apiChild = null;
let ownedApi = false;

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

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function getApiPort() {
  try {
    const url = new URL(apiBaseUrl);
    if (url.port) return Number(url.port);
    return url.protocol === "https:" ? 443 : 80;
  } catch {
    return 4000;
  }
}

function killProcessOnPort(port) {
  if (process.platform === "win32") {
    try {
      const output = execSync(`netstat -ano | findstr ":${port}"`, {
        encoding: "utf8",
        shell: true
      });
      const pids = new Set();
      for (const line of output.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue;
        const parts = line.trim().split(/\s+/);
        const pid = Number(parts[parts.length - 1]);
        if (Number.isInteger(pid) && pid > 0) pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore", shell: true });
        } catch {
          // process may already be gone
        }
      }
    } catch {
      // no listeners on port
    }
    return;
  }

  try {
    execSync(`lsof -ti :${port} | xargs kill -9`, { shell: true, stdio: "ignore" });
  } catch {
    // no listeners on port
  }
}

function buildApiEnv(mode) {
  const env = { ...process.env };
  delete env.SMOKE_EXPECT_OPENROUTER_LIVE;
  delete env.OPENROUTER_API_KEY;
  delete env.OPENROUTER_TEXT_PRIMARY_MODEL;
  delete env.OPENROUTER_TEXT_SECONDARY_MODEL;
  delete env.OPENROUTER_TEXT_REVIEWER_MODEL;
  delete env.OPENROUTER_TEXT_LONG_CONTEXT_MODEL;

  if (mode === "openrouter-shape") {
    env.AI_TEXT_GATEWAY = "openrouter";
    env.OPENROUTER_API_KEY = dummyKey;
    env.OPENROUTER_TEXT_PRIMARY_MODEL = approvedModel;
    return env;
  }

  env.AI_TEXT_GATEWAY = "local";
  return env;
}

function startApi(mode) {
  const env = buildApiEnv(mode);
  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", "npm.cmd run dev:api"], {
          cwd: process.cwd(),
          env,
          detached: true,
          stdio: "ignore",
          windowsHide: true
        })
      : spawn(npmCmd, ["run", "dev:api"], {
          cwd: process.cwd(),
          env,
          detached: true,
          stdio: "ignore"
        });
  child.unref();
  return child;
}

async function waitForApiReady(timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${apiBaseUrl}/health`, {
        headers: { Accept: "application/json" }
      });
      if (response.status === 200) {
        const body = await response.json();
        if (body?.ok === true && body?.data?.database?.status === "ready") {
          return true;
        }
      }
    } catch {
      // retry
    }
    await sleep(1000);
  }
  return false;
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

function responseLeaksSecrets(text) {
  return forbiddenPatterns.some((pattern) => pattern.test(text));
}

async function stopOwnedApi() {
  const port = getApiPort();
  if (apiChild?.pid) {
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /PID ${apiChild.pid} /T /F`, { stdio: "ignore", shell: true });
      } else {
        process.kill(-apiChild.pid, "SIGTERM");
      }
    } catch {
      // fall through to port kill
    }
  }
  killProcessOnPort(port);
  apiChild = null;
  ownedApi = false;
  await sleep(2000);
}

async function restartApiWithMode(label, mode) {
  await stopOwnedApi();
  apiChild = startApi(mode);
  ownedApi = true;
  const ready = await waitForApiReady();
  record(`${label} API health ready`, ready, ready ? "200" : "timeout");
  if (!ready) {
    throw new Error(`${label}: API failed to become healthy after restart.`);
  }
}

async function assertPlanningShape(label, expected) {
  const token = await login();
  record(`${label} admin login`, true, "200");

  const planningResponse = await request("/ai-provider/planning-config", { token });
  record(
    `${label} planning-config reachable`,
    planningResponse.status === 200 && planningResponse.body?.ok === true,
    `${planningResponse.status}`
  );
  record(
    `${label} planning-config hides secrets`,
    !responseLeaksSecrets(planningResponse.text),
    "safe response"
  );

  const planning = planningResponse.body?.data?.planning ?? null;
  record(
    `${label} textGateway`,
    planning?.textGateway === expected.textGateway,
    planning?.textGateway ?? "missing"
  );
  record(
    `${label} hasOpenRouterApiKey`,
    planning?.hasOpenRouterApiKey === expected.hasOpenRouterApiKey,
    String(planning?.hasOpenRouterApiKey)
  );
  record(
    `${label} openRouterLiveExecutionEnabled`,
    planning?.openRouterLiveExecutionEnabled === expected.openRouterLiveExecutionEnabled,
    String(planning?.openRouterLiveExecutionEnabled)
  );
  record(
    `${label} primary model`,
    planning?.models?.primary === expected.primaryModel,
    planning?.models?.primary ?? "missing"
  );

  const failed = results.filter((entry) => entry.name.startsWith(`${label} `) && !entry.ok);
  if (failed.length > 0) {
    throw new Error(`${label}: planning-config shape assertions failed.`);
  }
}

async function main() {
  console.log(`${smokeMarker} starting`);
  console.log(`${smokeMarker} no live OpenRouter call; no workflow execute; dummy key only`);

  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    record("env AUTH_SEED_TEST_PASSWORD", false, "missing");
    process.exitCode = 1;
    return;
  }
  record("env AUTH_SEED_TEST_PASSWORD", true, "present");

  try {
    await restartApiWithMode("openrouter-shape", "openrouter-shape");
    await assertPlanningShape("openrouter-shape", {
      textGateway: "openrouter",
      hasOpenRouterApiKey: true,
      openRouterLiveExecutionEnabled: true,
      primaryModel: approvedModel
    });

    await restartApiWithMode("local-restore", "local-restore");
    await assertPlanningShape("local-restore", {
      textGateway: "local",
      hasOpenRouterApiKey: false,
      openRouterLiveExecutionEnabled: false,
      primaryModel: null
    });
  } catch (error) {
    record(
      "preflight completed without fatal error",
      false,
      error instanceof Error ? error.message : String(error)
    );
    process.exitCode = 1;
  } finally {
    if (ownedApi) {
      const restoreFailed = results.some(
        (entry) => entry.name.startsWith("local-restore") && !entry.ok
      );
      if (restoreFailed || process.exitCode === 1) {
        await stopOwnedApi();
        record("cleanup stopped API after failure", true, "port cleared");
      } else {
        record("cleanup left restored local API running", true, "port 4000 local");
      }
    }
  }

  const failed = results.filter((entry) => !entry.ok);
  console.log(`${smokeMarker} finished - ${results.length - failed.length}/${results.length} passed`);

  if (failed.length === 0) {
    console.log(
      "PROVEN: API process OpenRouter env injection works for planning-config shape; no live provider call."
    );
  } else {
    console.log("NOT PROVEN: OpenRouter API env preflight failed.");
    process.exitCode = 1;
  }
}

await main();
