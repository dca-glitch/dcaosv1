import { describe, expect, it } from "vitest";
import {
  formatProofStateLabel,
  looksLikeLiveOverclaim,
  proofStateTone,
  safeAdminIntegrationHint,
  type ProofState
} from "./proof-state-labels";

describe("formatProofStateLabel", () => {
  it("maps every proof state to a stable admin label", () => {
    const states: ProofState[] = [
      "not_started",
      "local_only",
      "disabled_safe",
      "config_shape_ok",
      "owner_gated",
      "staging_proven",
      "production_proven",
      "blocked"
    ];
    expect(states.map(formatProofStateLabel)).toEqual([
      "Not started",
      "Local only",
      "Disabled-safe",
      "Config shape OK",
      "Owner-gated",
      "Staging proven",
      "Production proven",
      "Blocked"
    ]);
  });
});

describe("proofStateTone", () => {
  it("keeps local evidence visually distinct from success tones", () => {
    expect(proofStateTone("local_only")).toBe("local");
    expect(proofStateTone("disabled_safe")).toBe("local");
    expect(proofStateTone("config_shape_ok")).toBe("local");
    expect(proofStateTone("staging_proven")).toBe("success");
    expect(proofStateTone("blocked")).toBe("danger");
  });
});

describe("looksLikeLiveOverclaim", () => {
  it("flags unqualified live/production claims", () => {
    expect(looksLikeLiveOverclaim("GA/GSC live synced")).toBe(true);
    expect(looksLikeLiveOverclaim("Production ready")).toBe(true);
    expect(looksLikeLiveOverclaim("Fully connected")).toBe(true);
  });

  it("allows deferred and local-safe wording", () => {
    expect(looksLikeLiveOverclaim("Live GA/GSC sync deferred")).toBe(false);
    expect(looksLikeLiveOverclaim("Local/admin practice path only")).toBe(false);
    expect(looksLikeLiveOverclaim("Disabled-safe; no live calls")).toBe(false);
    expect(looksLikeLiveOverclaim("")).toBe(false);
  });
});

describe("safeAdminIntegrationHint", () => {
  it("never implies staging/production for local-only states", () => {
    expect(safeAdminIntegrationHint("local_only")).toMatch(/Staging and production remain unproven/i);
    expect(safeAdminIntegrationHint("disabled_safe")).toMatch(/Live calls remain deferred/i);
    expect(safeAdminIntegrationHint("config_shape_ok")).toMatch(/Does not imply live provider success/i);
  });
});
