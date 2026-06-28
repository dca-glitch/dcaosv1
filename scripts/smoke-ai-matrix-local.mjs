#!/usr/bin/env node

/**
 * Full local AI workflow smoke matrix.
 * Default: deterministic/admin paths only; no provider secrets required.
 * Requires local API on port 4000 (or API_BASE) with database ready.
 * Live OpenRouter proof is never part of this matrix unless SMOKE_EXPECT_OPENROUTER_LIVE=true
 * (guarded local smoke still runs by default and must not call live providers).
 */

import { execSync, spawn, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const apiBase = (process.env.API_BASE ?? process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBase = (process.env.WEB_BASE ?? process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const matrixLogPath = join(tmpdir(), `dca-ai-matrix-${Date.now()}.log`);
const startedAt = new Date().toISOString();

const steps = [
  { name: "AI provider config", script: "smoke:ai-provider-config:local", requiresApi: true },
  { name: "OpenRouter guarded local", script: "smoke:openrouter-guarded:local", requiresApi: true },
  { name: "AI knowledge context", script: "smoke:ai-knowledge-context", requiresApi: true },
  { name: "Market Intelligence", script: "smoke:ai-market-intelligence", requiresApi: true, requiresWeb: true },
  { name: "Monthly report local", script: "smoke:monthly-report:local", requiresApi: true },
  { name: "Monthly report MI context", script: "smoke:monthly-report:mi-context", requiresApi: true },
  { name: "AI delivery reviews", script: "smoke:ai-delivery-reviews", requiresApi: true, restartApiBefore: true },
  { name: "AI operations local", script: "smoke:ai-operations:local", requiresApi: true, restartApiBefore: true },
  { name: "AI operations browser", script: "smoke:ai-operations:browser", requiresApi: true, requiresWeb: true },
  { name: "Google Drive export contract", script: "smoke:google-drive-export", requiresApi: true }
];

const logLines = [`[AI_MATRIX] started ${startedAt}`, `[AI_MATRIX] api=${apiBase}`, `[AI_MATRIX] web=${webBase}`];

function appendLog(line) {
  logLines.push(line);
  console.log(line);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cooldownBetweenSteps() {
  await sleep(2500);
}

function getApiPort() {
  try {
    const url = new URL(apiBase);
    if (url.port) {
      return Number(url.port);
    }
    return url.protocol === "https:" ? 443 : 80;
  } catch {
    return 4000;
  }
}

function killProcessOnPort(port) {
  if (process.platform === "win32") {
    try {
      const output = execSync(`netstat -ano | findstr ":${port}"`, { encoding: "utf8", shell: true });
      const pids = new Set();
      for (const line of output.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) {
          continue;
        }
        const parts = line.trim().split(/\s+/);
        const pid = Number(parts[parts.length - 1]);
        if (pid > 0) {
          pids.add(pid);
        }
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore", shell: true });
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

function startLocalApi() {
  const child = spawn(npmCmd, ["run", "dev:api"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TENANT_MODULE_ENFORCEMENT: process.env.TENANT_MODULE_ENFORCEMENT ?? "off"
    },
    detached: true,
    stdio: "ignore",
    shell: true
  });
  child.unref();
}

async function restartLocalApi(reason) {
  appendLog("[AI_MATRIX] Restarting API to reset local in-memory rate limit.");
  if (reason) {
    appendLog(`[AI_MATRIX] ${reason}`);
  }
  const port = getApiPort();
  killProcessOnPort(port);
  await sleep(3000);
  startLocalApi();
  await waitForApiReady("post-restart");
}

async function waitForApiReady(label, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${apiBase}/health`, { headers: { Accept: "application/json" } });
      if (response.status === 200) {
        const body = await response.json();
        if (body?.ok === true && body?.data?.database?.status === "ready") {
          appendLog(`[AI_MATRIX] ${label}: API/database ready`);
          return;
        }
      }
    } catch {
      // retry
    }
    await sleep(1000);
  }
  throw new Error(`${label}: API not ready at ${apiBase}/health within ${timeoutMs}ms`);
}

async function waitForWebReady(label, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(webBase, { method: "GET" });
      if (response.status >= 200 && response.status < 500) {
        appendLog(`[AI_MATRIX] ${label}: web reachable`);
        return;
      }
    } catch {
      // retry
    }
    await sleep(1000);
  }
  throw new Error(`${label}: web not reachable at ${webBase} within ${timeoutMs}ms`);
}

async function runStep(step, index) {
  const stepLabel = `Step ${index + 1}/${steps.length}: ${step.name}`;
  appendLog(`\n[AI_MATRIX] RUN ${stepLabel} (${step.script})`);

  const result = spawnSync(npmCmd, ["run", step.script], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      API_BASE: apiBase,
      WEB_BASE: webBase,
      MVP_SMOKE_API_BASE_URL: apiBase,
      MVP_SMOKE_WEB_BASE_URL: webBase
    },
    shell: true,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    appendLog(`[AI_MATRIX] FAIL ${stepLabel} exit=${result.status ?? 1}`);
    writeFileSync(matrixLogPath, `${logLines.join("\n")}\n`, "utf8");
    console.error(`\n[AI_MATRIX] Failure log: ${matrixLogPath}`);
    console.error("[AI_MATRIX] Recovery hints: restart API if rate-limited; ensure ports 4000/5173 are free; stop stale node holding Prisma DLL on Windows.");
    process.exit(result.status ?? 1);
  }

  appendLog(`[AI_MATRIX] PASS ${stepLabel}`);
  await cooldownBetweenSteps();
}

async function main() {
  appendLog("[AI_MATRIX] Starting full local AI workflow smoke matrix (sequential, deterministic by default).");
  appendLog("[AI_MATRIX] Rate-limit note: in-memory API rate limits reset when the API process restarts.");

  if (!process.env.AUTH_SEED_TEST_PASSWORD) {
    appendLog("[AI_MATRIX] AUTH_SEED_TEST_PASSWORD is required.");
    writeFileSync(matrixLogPath, `${logLines.join("\n")}\n`, "utf8");
    process.exit(1);
  }

  const needsApi = steps.some((step) => step.requiresApi && !step.skip);
  const needsWeb = steps.some((step) => step.requiresWeb && !step.skip);

  if (needsApi) {
    await waitForApiReady("preflight");
  }
  if (needsWeb) {
    await waitForWebReady("preflight");
  }

  let index = 0;
  for (const step of steps) {
    if (step.skip) {
      appendLog(`\n[AI_MATRIX] SKIP Step ${index + 1}/${steps.length}: ${step.name}${step.skipReason ? ` — ${step.skipReason}` : ""}`);
      index += 1;
      continue;
    }
    if (step.restartApiBefore) {
      await restartLocalApi(`before Step ${index + 1}/${steps.length}: ${step.name}`);
    }
    await runStep(step, index);
    index += 1;
  }

  appendLog("\n[AI_MATRIX] All configured AI workflow smokes passed.");
  writeFileSync(matrixLogPath, `${logLines.join("\n")}\n`, "utf8");
  appendLog(`[AI_MATRIX] Summary log: ${matrixLogPath}`);
}

main().catch((error) => {
  appendLog(`[AI_MATRIX] FATAL: ${error instanceof Error ? error.message : String(error)}`);
  writeFileSync(matrixLogPath, `${logLines.join("\n")}\n`, "utf8");
  console.error(`[AI_MATRIX] Failure log: ${matrixLogPath}`);
  process.exit(1);
});
