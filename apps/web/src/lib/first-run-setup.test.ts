import { describe, expect, it } from "vitest";
import { deriveFirstRunSetupState } from "./first-run-setup";

describe("deriveFirstRunSetupState", () => {
  it("skips setup for non-managers", () => {
    const state = deriveFirstRunSetupState(null, null, false);
    expect(state.setupIncomplete).toBe(false);
  });

  it("requires company profile and first client when empty", () => {
    const state = deriveFirstRunSetupState({ companyProfile: null }, { clients: [] }, true);
    expect(state.needsCompanyProfile).toBe(true);
    expect(state.needsFirstClient).toBe(true);
    expect(state.setupIncomplete).toBe(true);
  });

  it("requires only first client when company exists", () => {
    const state = deriveFirstRunSetupState(
      { companyProfile: { id: "cp-1", name: "DCA" } },
      { clients: [] },
      true
    );
    expect(state.needsCompanyProfile).toBe(false);
    expect(state.needsFirstClient).toBe(true);
    expect(state.setupIncomplete).toBe(true);
  });

  it("is complete when company and active client exist", () => {
    const state = deriveFirstRunSetupState(
      { companyProfile: { id: "cp-1", name: "DCA" } },
      { clients: [{ id: "c-1", isArchived: false }] },
      true
    );
    expect(state.setupIncomplete).toBe(false);
  });

  it("ignores archived clients for first-client check", () => {
    const state = deriveFirstRunSetupState(
      { companyProfile: { id: "cp-1", name: "DCA" } },
      { clients: [{ id: "c-1", isArchived: true }] },
      true
    );
    expect(state.needsFirstClient).toBe(true);
  });
});
