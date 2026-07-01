import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RequestContext } from "../types";
import { isTenantDataContext, toDataRequestContext } from "./data-context.service";

describe("data context service", () => {
  it("maps tenant user context", () => {
    const context: RequestContext = {
      actorType: "USER",
      userId: "user-1",
      tenantId: "tenant-1",
      tenantMembershipId: "membership-1",
      roles: ["admin"],
      permissions: ["settings:read"]
    };

    assert.deepEqual(toDataRequestContext(context), {
      actorType: "USER",
      requestId: undefined,
      tenantId: "tenant-1",
      tenantMembershipId: "membership-1",
      userId: "user-1",
      roles: ["admin"],
      permissions: ["settings:read"]
    });
    assert.equal(isTenantDataContext(context), true);
  });

  it("maps system context without tenant fields", () => {
    const context: RequestContext = {
      actorType: "SYSTEM",
      actorLabel: "scheduler",
      requestId: "req-1"
    };

    assert.deepEqual(toDataRequestContext(context), {
      actorType: "SYSTEM",
      requestId: "req-1",
      actorLabel: "scheduler",
      roles: [],
      permissions: []
    });
    assert.equal(isTenantDataContext(context), false);
  });
});
