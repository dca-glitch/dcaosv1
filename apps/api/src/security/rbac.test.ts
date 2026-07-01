import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RequestContext } from "../types";
import { PERMISSION_KEYS } from "./permission-keys";
import { denyByDefault, getPermissionSet, hasPermission, requirePermissionForContext } from "./rbac";

function userContext(permissions: string[]): RequestContext {
  return {
    actorType: "USER",
    userId: "user-1",
    tenantId: "tenant-1",
    tenantMembershipId: "membership-1",
    roles: ["admin"],
    permissions
  };
}

describe("rbac", () => {
  it("getPermissionSet returns empty set for non-user actors", () => {
    const context: RequestContext = { actorType: "SYSTEM", actorLabel: "cron" };
    assert.equal(getPermissionSet(context).size, 0);
  });

  it("hasPermission checks tenant user permissions", () => {
    const context = userContext([PERMISSION_KEYS.settingsRead]);
    assert.equal(hasPermission(context, PERMISSION_KEYS.settingsRead), true);
    assert.equal(hasPermission(context, PERMISSION_KEYS.usersRead), false);
  });

  it("requirePermissionForContext returns allowed or reason", () => {
    const allowed = requirePermissionForContext(userContext([PERMISSION_KEYS.usersRead]), PERMISSION_KEYS.usersRead);
    assert.equal(allowed.allowed, true);

    const denied = requirePermissionForContext(userContext([]), PERMISSION_KEYS.usersRead);
    assert.equal(denied.allowed, false);
    assert.match(denied.reason ?? "", /permission/i);
  });

  it("denyByDefault always returns false", () => {
    assert.equal(denyByDefault(), false);
  });
});
