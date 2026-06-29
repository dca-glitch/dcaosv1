import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RequestContext } from "../types";
import { getTenantSelectionResult, hasTenantSelection, requireTenantSelection } from "./tenant-selection";

describe("tenant selection", () => {
  it("hasTenantSelection requires user actor with tenant ids", () => {
    const complete: RequestContext = {
      actorType: "USER",
      userId: "u1",
      tenantId: "t1",
      tenantMembershipId: "m1",
      roles: [],
      permissions: []
    };
    assert.equal(hasTenantSelection(complete), true);

    const incomplete: RequestContext = {
      actorType: "USER",
      userId: "u1",
      tenantId: "",
      tenantMembershipId: "",
      roles: [],
      permissions: []
    };
    assert.equal(hasTenantSelection(incomplete), false);
  });

  it("getTenantSelectionResult reports system actor as missing", () => {
    const result = getTenantSelectionResult({ actorType: "SYSTEM", actorLabel: "job" });
    assert.equal(result.state, "missing");
    assert.equal(result.ok, false);
  });

  it("requireTenantSelection mirrors getTenantSelectionResult", () => {
    const context: RequestContext = {
      actorType: "USER",
      userId: "u1",
      tenantId: "t1",
      tenantMembershipId: "m1",
      roles: ["owner"],
      permissions: []
    };
    const result = requireTenantSelection(context);
    assert.equal(result.state, "selected");
    assert.equal(result.ok, true);
    assert.equal(result.tenantId, "t1");
  });
});
