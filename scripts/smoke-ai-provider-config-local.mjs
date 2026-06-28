/**
 * AI provider local configuration smoke (no API required).
 * Wraps the shared config hardening runner used by API check.
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const runnerPath = resolve(process.cwd(), "apps/api/scripts/check-ai-provider-config.runner.ts");
const result = spawnSync("npx", ["tsx", runnerPath], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
  shell: true
});

process.exit(result.status ?? 1);
