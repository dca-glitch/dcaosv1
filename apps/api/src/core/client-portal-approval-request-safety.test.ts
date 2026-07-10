/**
 * G573 — Approval request/action surface safety (Lane 9).
 * Read-only imports from approval policy/runtime; does not weaken RBAC.
 * Full approve/reject/revision policy matrix remains Lane 10 (G577–G580).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AuthResolvedSessionContext } from "../auth/types";
import { evaluateClientPortalApprovalAction } from "./client-portal-approval-policy";
import { isClientPortalApprovalUser } from "./client-portal-approval.runtime";
import {
  assertClientPortalSerializerNoLeak,
  stripClientPortalForbiddenKeys
} from "./client-portal-serializer";

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

describe("client portal approval request/action safety (G573)", () => {
  it("keeps approve/request-changes policy decisions free of forbidden payload keys", () => {
    const approve = evaluateClientPortalApprovalAction({
      action: "approve_deliverable",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      revisionRoundUsed: false
    });
    const reject = evaluateClientPortalApprovalAction({
      action: "request_changes",
      deliverableStatus: "PENDING_CLIENT_REVIEW",
      revisionRoundUsed: false,
      reason: "Please revise the intro"
    });

    assert.equal(approve.ok, true);
    assert.equal(reject.ok, true);
    assertClientPortalSerializerNoLeak(approve);
    assertClientPortalSerializerNoLeak(reject);
    assert.equal("storageKey" in approve, false);
    assert.equal("providerMetadata" in reject, false);
    assert.equal("actualCostUsd" in approve, false);
  });

  it("does not allow owner/admin through client approval user gate", () => {
    assert.equal(isClientPortalApprovalUser(mockSession(["client"])), true);
    assert.equal(isClientPortalApprovalUser(mockSession(["owner"])), false);
    assert.equal(isClientPortalApprovalUser(mockSession(["admin"])), false);
  });

  it("strips accidental internal fields from an approval-shaped response probe", () => {
    const probe = {
      id: "d1",
      status: "PENDING_CLIENT_REVIEW",
      title: "Article",
      storageKey: "tenants/x/y.pdf",
      provider: "openai",
      actualCostUsd: 2.5,
      workflowRunStatus: "RUNNING"
    };
    const cleaned = stripClientPortalForbiddenKeys(probe);
    assert.deepEqual(cleaned, {
      id: "d1",
      status: "PENDING_CLIENT_REVIEW",
      title: "Article"
    });
    assertClientPortalSerializerNoLeak(cleaned);
  });
});
