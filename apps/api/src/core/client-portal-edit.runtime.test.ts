import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AuthResolvedSessionContext } from "../auth/types";
import { isClientPortalApprovalUser } from "./client-portal-approval.runtime";
import { isClientPortalEditableFieldName } from "./client-portal-edit.runtime";

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

describe("client portal edit access", () => {
  it("treats client role as portal edit user", () => {
    assert.equal(isClientPortalApprovalUser(mockSession(["client"])), true);
  });

  it("excludes owner and admin from client-only edit flows", () => {
    assert.equal(isClientPortalApprovalUser(mockSession(["owner"])), false);
    assert.equal(isClientPortalApprovalUser(mockSession(["admin"])), false);
  });

  it("allows only client-edit fields in edit history serialization", () => {
    assert.equal(isClientPortalEditableFieldName("title"), true);
    assert.equal(isClientPortalEditableFieldName("body"), true);
    assert.equal(isClientPortalEditableFieldName("description"), true);
    assert.equal(isClientPortalEditableFieldName("tags"), true);
    assert.equal(isClientPortalEditableFieldName("category"), true);
    assert.equal(isClientPortalEditableFieldName("scheduledPublishAt"), true);

    assert.equal(isClientPortalEditableFieldName("storageKey"), false);
    assert.equal(isClientPortalEditableFieldName("workflowRunId"), false);
    assert.equal(isClientPortalEditableFieldName("provider"), false);
    assert.equal(isClientPortalEditableFieldName("providerMetadata"), false);
    assert.equal(isClientPortalEditableFieldName("actualCostUsd"), false);
    assert.equal(isClientPortalEditableFieldName("estimatedCostUsd"), false);
    assert.equal(isClientPortalEditableFieldName("audit"), false);
    assert.equal(isClientPortalEditableFieldName("adminSummaryNotes"), false);
  });
});
