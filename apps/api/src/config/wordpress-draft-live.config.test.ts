import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluateWordPressDraftLiveAuthorization,
  WORDPRESS_DRAFT_LIVE_ENV_KEYS
} from "./wordpress-draft-live.config";

describe("wordpress-draft-live.config unit", () => {
  it("ignores non-exact truthy strings", () => {
    const snap = evaluateWordPressDraftLiveAuthorization({
      [WORDPRESS_DRAFT_LIVE_ENV_KEYS.enabled]: "1",
      [WORDPRESS_DRAFT_LIVE_ENV_KEYS.liveCallsAllowed]: "yes"
    });
    assert.equal(snap.authorized, false);
  });
});
