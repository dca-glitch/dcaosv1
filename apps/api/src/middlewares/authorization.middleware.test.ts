import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AuthResolvedSessionContext } from "../auth/types";
import { resolveActiveRoles, resolveEffectivePermissions } from "./authorization.middleware";
import { PERMISSION_KEYS } from "../security/permission-keys";

function mockAuthSession(roles: string[]): AuthResolvedSessionContext {
  return {
    user: {
      id: "user-1",
      email: "user@test.local",
      name: "Test User",
      status: "active",
      forcePasswordChange: false,
      lastLoginAt: null
    },
    session: {
      id: "session-1",
      createdAt: new Date(),
      expiresAt: new Date(),
      lastSeenAt: null
    },
    tenantContext: {
      activeMembership: {
        tenantId: "tenant-1",
        tenantMembershipId: "membership-1",
        roles
      },
      memberships: []
    }
  };
}

describe("authorization middleware helpers", () => {
  it("resolveActiveRoles returns membership roles", () => {
    assert.deepEqual(resolveActiveRoles(mockAuthSession(["owner"])), ["owner"]);
    assert.deepEqual(resolveActiveRoles(mockAuthSession(["client"])), ["client"]);
  });

  it("resolveEffectivePermissions grants core permissions to owner/admin", () => {
    const ownerPermissions = resolveEffectivePermissions(mockAuthSession(["owner"]));
    assert.ok(ownerPermissions.includes(PERMISSION_KEYS.settingsRead));
    assert.ok(ownerPermissions.includes(PERMISSION_KEYS.usersRead));

    const adminPermissions = resolveEffectivePermissions(mockAuthSession(["admin"]));
    assert.ok(adminPermissions.includes(PERMISSION_KEYS.modulesManage));
  });

  it("resolveEffectivePermissions returns empty for local_tester", () => {
    assert.deepEqual(resolveEffectivePermissions(mockAuthSession(["local_tester"])), []);
  });

  it("resolveEffectivePermissions returns empty for unknown roles", () => {
    assert.deepEqual(resolveEffectivePermissions(mockAuthSession(["client"])), []);
  });
});
