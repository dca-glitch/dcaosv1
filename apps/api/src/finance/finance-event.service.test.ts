import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isFinanceEventExcluded } from "./finance-event.service";

describe("finance event", () => {
  it("detects excluded metadata", () => {
    assert.equal(isFinanceEventExcluded({ excluded: true }), true);
    assert.equal(isFinanceEventExcluded({ excluded: false }), false);
    assert.equal(isFinanceEventExcluded({}), false);
    assert.equal(isFinanceEventExcluded(null), false);
  });
});
