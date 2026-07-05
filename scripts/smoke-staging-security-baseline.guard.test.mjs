import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "smoke-staging-security-baseline.mjs");
const refusalMessage =
  "Staging security baseline refused: set DCA_SMOKE_REMOTE_TARGET=staging to run live remote checks. Default is refuse (no HTTP requests).";

function runScriptWithoutRemoteOptIn() {
  const env = { ...process.env };
  delete env.DCA_SMOKE_REMOTE_TARGET;
  delete env.DCA_SMOKE_ALLOW_PRODUCTION_HEALTH_PROBE;

  return spawnSync(process.execPath, [scriptPath], {
    env,
    encoding: "utf8"
  });
}

test("refuses by default without remote opt-in and performs no remote smoke checks", () => {
  const result = runScriptWithoutRemoteOptIn();
  const output = `${result.stdout}${result.stderr}`;

  assert.equal(result.status, 1, "expected exit code 1");
  assert.match(output, new RegExp(refusalMessage.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.doesNotMatch(output, /\[SMOKE\]\[STAGING_SECURITY_BASELINE\] starting/);
  assert.doesNotMatch(output, /^(PASS|FAIL) /m);
});
