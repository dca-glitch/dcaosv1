import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AuthResolvedSessionContext } from "../auth/types";
import { isClientPortalApprovalUser } from "./client-portal-approval.runtime";

function mockSession(roles: string[]): AuthResolvedSessionContext {
  return {
    user: {
      id: "user-1",
      email: "client@test.local",
      name: "Client User",
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

describe("client portal approval user", () => {
  it("treats client role as approval user", () => {
    assert.equal(isClientPortalApprovalUser(mockSession(["client"])), true);
  });

  it("excludes owner and admin from approval-only flows", () => {
    assert.equal(isClientPortalApprovalUser(mockSession(["owner"])), false);
    assert.equal(isClientPortalApprovalUser(mockSession(["admin"])), false);
    assert.equal(isClientPortalApprovalUser(mockSession(["client", "admin"])), false);
  });
});
