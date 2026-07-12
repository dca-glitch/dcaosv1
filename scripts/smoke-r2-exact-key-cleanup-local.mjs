/**
 * Local/no-live exact-key R2 cleanup harness smoke.
 * Default: runs fake in-memory roundtrip only (no Cloudflare call).
 * Live mode requires SMOKE_EXPECT_R2_EXACT_KEY_CLEANUP=true AND is refused here —
 * staging live create/read/delete remains a separate owner gate.
 */

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const expectLive = (process.env.SMOKE_EXPECT_R2_EXACT_KEY_CLEANUP ?? "").trim().toLowerCase() === "true";
const marker = "[SMOKE][R2_EXACT_KEY_CLEANUP]";

async function main() {
  console.log(`${marker} starting`);

  if (expectLive) {
    console.log(`FAIL ${marker} live mode refused in this script — use the separate staging R2 live gate`);
    process.exitCode = 1;
    return;
  }

  // Load compiled or tsx-backed module from apps/api source via node --import tsx when run from package script.
  const harnessPath = resolve("apps/api/src/storage/r2-exact-key-cleanup-harness.ts");
  const mod = await import(pathToFileURL(harnessPath).href);
  const result = await mod.runR2ExactKeyFakeRoundtripHarness();

  const checks = [
    ["liveMode false", result.liveMode === false],
    ["exactly one create", result.createCount === 1],
    ["exactly one delete", result.deleteCount === 1],
    ["checksum matched", result.checksumMatched === true],
    ["absence confirmed", result.absenceConfirmed === true],
    ["harness ok", result.ok === true]
  ];

  let failed = 0;
  for (const [name, ok] of checks) {
    console.log(`${ok ? "PASS" : "FAIL"} ${name}`);
    if (!ok) failed += 1;
  }

  if (failed === 0) {
    console.log(`${marker} finished — fake exact-key cleanup harness PASS (no live R2 call)`);
  } else {
    console.log(`${marker} finished — NOT PROVEN`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`${marker} runtime error:`, error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
