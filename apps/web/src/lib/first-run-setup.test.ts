import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveFirstRunSetupState } from "./first-run-setup";

describe("deriveFirstRunSetupState", () => {
  it("skips setup for non-managers", () => {
    const state = deriveFirstRunSetupState(null, null, false);
    assert.equal(state.setupIncomplete, false);
  });

  it("requires company profile and first client when empty", () => {
    const state = deriveFirstRunSetupState({ companyProfile: null }, { clients: [] }, true);
    assert.equal(state.needsCompanyProfile, true);
    assert.equal(state.needsFirstClient, true);
    assert.equal(state.setupIncomplete, true);
  });

  it("requires only first client when company exists", () => {
    const state = deriveFirstRunSetupState(
      { companyProfile: { id: "cp-1", name: "DCA" } },
      { clients: [] },
      true
    );
    assert.equal(state.needsCompanyProfile, false);
    assert.equal(state.needsFirstClient, true);
    assert.equal(state.setupIncomplete, true);
  });

  it("is complete when company and active client exist", () => {
    const state = deriveFirstRunSetupState(
      { companyProfile: { id: "cp-1", name: "DCA" } },
      { clients: [{ id: "c-1", isArchived: false }] },
      true
    );
    assert.equal(state.setupIncomplete, false);
  });

  it("ignores archived clients for first-client check", () => {
    const state = deriveFirstRunSetupState(
      { companyProfile: { id: "cp-1", name: "DCA" } },
      { clients: [{ id: "c-1", isArchived: true }] },
      true
    );
    assert.equal(state.needsFirstClient, true);
  });
});
