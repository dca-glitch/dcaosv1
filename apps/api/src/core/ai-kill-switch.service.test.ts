import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertOrchestratorDisabledSafeInvariant, getAiKillSwitchSnapshot } from "./ai-kill-switch.service";

describe("ai-kill-switch.service", () => {
  it("defaults to disabled-safe live flags", () => {
    const snapshot = getAiKillSwitchSnapshot();
    assert.equal(snapshot.anyLiveProviderEnabled, false);
    assert.equal(snapshot.researchProviderLive, false);
    assert.equal(snapshot.visionQaLive, false);
  });

  it("passes orchestrator disabled-safe invariant", () => {
    const result = assertOrchestratorDisabledSafeInvariant();
    assert.equal(result.ok, true);
    assert.equal(result.violations.length, 0);
  });

  it("reports orchestrator live-safe when registry has no live providers", () => {
    const snapshot = getAiKillSwitchSnapshot();
    assert.equal(snapshot.orchestratorLiveSafe, !snapshot.textGatewayLive);
  });
});
