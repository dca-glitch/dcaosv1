import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildImageGenerationNoLiveConfigSnapshot,
  getImageGenerationIntegrationReadiness,
  IMAGE_GENERATION_ENV_KEYS
} from "./image-generation.config";

describe("image-generation.config", () => {
  it("G562 keeps readiness liveProviderCallsDeferred and never claims live", () => {
    const readiness = getImageGenerationIntegrationReadiness();
    assert.equal(readiness.liveProviderCallsDeferred, true);
    assert.ok(["disabled", "missing_config", "configured_shape_ok"].includes(readiness.status));
  });

  it("G562 builds a no-live config snapshot without secret values", () => {
    const snapshot = buildImageGenerationNoLiveConfigSnapshot();
    assert.equal(snapshot.liveProviderCallsDeferred, true);
    assert.equal(snapshot.liveProviderCallsAllowed, false);
    assert.deepEqual(snapshot.readinessStatuses, ["disabled", "missing_config", "configured_shape_ok"]);
    assert.equal(snapshot.envKeys.apiKey, IMAGE_GENERATION_ENV_KEYS.apiKey);
    assert.ok(!("apiKeyValue" in snapshot));
  });
});
