#!/usr/bin/env node

/**
 * Full local AI workflow smoke matrix.
 * Default: deterministic/admin paths only; no provider secrets required.
 * Skips live OpenRouter unless SMOKE_EXPECT_OPENROUTER_LIVE=true.
 */

import { spawnSync } from "node:child_process";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const expectOpenRouterLive = (process.env.SMOKE_EXPECT_OPENROUTER_LIVE ?? "").trim().toLowerCase() === "true";

const steps = [
  { name: "AI provider config", script: "smoke:ai-provider-config:local" },
  { name: "AI knowledge context", script: "smoke:ai-knowledge-context" },
  { name: "Market Intelligence", script: "smoke:ai-market-intelligence" },
  { name: "Monthly report local", script: "smoke:monthly-report:local" },
  { name: "Monthly report MI context", script: "smoke:monthly-report:mi-context" },
  { name: "AI delivery reviews", script: "smoke:ai-delivery-reviews" },
  { name: "Google Drive export contract", script: "smoke:google-drive-export" },
  { name: "OpenRouter guarded local", script: "smoke:openrouter-guarded:local", skip: expectOpenRouterLive ? false : false }
];

function runStep(step) {
  console.log(`\n[AI_MATRIX] Running ${step.name} (${step.script})...\n`);
  const result = spawnSync(npmCmd, ["run", step.script], {
    cwd: process.cwd(),
    env: process.env,
    shell: true,
    stdio: "inherit"
  });
  if (result.status !== 0) {
    console.error(`\n[AI_MATRIX] FAIL: ${step.name}`);
    process.exit(result.status ?? 1);
  }
  console.log(`\n[AI_MATRIX] PASS: ${step.name}`);
}

function main() {
  console.log("[AI_MATRIX] Starting full local AI workflow smoke matrix...");
  if (!process.env.AUTH_SEED_TEST_PASSWORD) {
    console.error("[AI_MATRIX] AUTH_SEED_TEST_PASSWORD is required.");
    process.exit(1);
  }

  for (const step of steps) {
    if (step.skip) {
      console.log(`\n[AI_MATRIX] SKIP: ${step.name}`);
      continue;
    }
    runStep(step);
  }

  console.log("\n[AI_MATRIX] All configured AI workflow smokes passed.");
}

main();
