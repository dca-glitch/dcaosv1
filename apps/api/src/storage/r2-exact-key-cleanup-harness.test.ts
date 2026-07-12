import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runR2ExactKeyFakeRoundtripHarness } from "./r2-exact-key-cleanup-harness";

describe("r2-exact-key-cleanup-harness (fake transport)", () => {
  it("runs create/read/checksum/delete/absence with exactly one create and one delete", async () => {
    const result = await runR2ExactKeyFakeRoundtripHarness();
    assert.equal(result.liveMode, false);
    assert.equal(result.createCount, 1);
    assert.equal(result.deleteCount, 1);
    assert.equal(result.checksumMatched, true);
    assert.equal(result.absenceConfirmed, true);
    assert.equal(result.ok, true);
    assert.deepEqual(result.safeErrors, []);
    assert.ok(result.storageKey?.startsWith("tenants/"));
    assert.equal(JSON.stringify(result).includes("fake-secret-access-key"), false);
  });
});
