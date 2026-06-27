/**
 * Phase F Block 59 — tenant module middleware baseline orchestrator.
 * Runs dry_run probe + full matrix smoke in sequence (API expected in off mode).
 */

import { spawnSync } from "node:child_process";

const smokeMarker = "[SMOKE][TENANT_MODULE_PHASE_F]";
const steps = [
  { name: "dry_run probe (off baseline)", script: "smoke:tenant-module:dry-run-probe" },
  { name: "full module matrix (off baseline)", script: "smoke:tenant-module:local" }
];

function runStep(step) {
  console.log(`${smokeMarker} step: ${step.name}`);
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(`${npmCmd} run ${step.script}`, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
    env: process.env
  });
  const ok = result.status === 0;
  console.log(`${smokeMarker} ${ok ? "PASS" : "FAIL"}: ${step.name}`);
  return ok;
}

function main() {
  console.log(`${smokeMarker} starting (API expected in TENANT_MODULE_ENFORCEMENT=off)`);
  const outcomes = steps.map((step) => ({ step, ok: runStep(step) }));
  const failed = outcomes.filter((entry) => !entry.ok);

  if (failed.length === 0) {
    console.log("PROVEN: Phase F tenant module baseline orchestrator passed.");
    console.log(
      "NOTE: Strict dry_run/enforce proofs require API restart — see docs/runbooks/PHASE_F_BLOCK_59_MODULE_MIDDLEWARE_LOCAL_ENFORCE.md"
    );
    process.exitCode = 0;
    return;
  }

  console.log("NOT PROVEN: one or more Phase F tenant module steps failed.");
  for (const entry of failed) {
    console.log(`  - ${entry.step.name}`);
  }
  process.exitCode = 1;
}

main();
