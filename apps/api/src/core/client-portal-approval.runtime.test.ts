import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AuthResolvedSessionContext } from "../auth/types";
import {
  assertClientPortalPayloadHasNoForbiddenKeys,
  collectClientPortalForbiddenPayloadKeys
} from "./client-portal-error-safety";
import {
  isClientPortalApprovalUser,
  toClientPortalApprovalDeliverableSummary,
  toClientPortalPendingApprovalSummary
} from "./client-portal-approval.runtime";

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

describe("client portal approval request serializer (G201/G332/G584)", () => {
  it("serializes pending approval list rows with client-safe fields only", () => {
    const summary = toClientPortalPendingApprovalSummary({
      id: "del-1",
      title: "Article for review",
      status: "PENDING_CLIENT_REVIEW",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      aiDeliveryProject: {
        id: "proj-1",
        name: "July plan",
        clientId: "client-1",
        client: { id: "client-1", name: "Acme" }
      }
    });

    assert.deepEqual(Object.keys(summary).sort(), [
      "clientId",
      "clientName",
      "createdAt",
      "id",
      "projectId",
      "projectName",
      "status",
      "title"
    ]);
    assertClientPortalPayloadHasNoForbiddenKeys(summary);
  });

  it("serializes approval detail without storage, provider, workflow, cost, or admin notes", () => {
    const detail = toClientPortalApprovalDeliverableSummary({
      id: "del-2",
      title: "Review me",
      description: "Body preview",
      tags: ["seo"],
      category: "Blog",
      scheduledPublishAt: new Date("2026-07-10T00:00:00.000Z"),
      status: "PENDING_CLIENT_REVIEW",
      bodyContent: "Hello client",
      projectId: "proj-2",
      projectName: "Project",
      clientId: "client-2",
      clientName: "Client Co",
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      images: [
        {
          id: "img-1",
          title: "Hero",
          altText: "Hero",
          imageUrl: "https://cdn.example.com/hero.jpg",
          approvalStatus: "PENDING",
          rejectionReason: null
        }
      ]
    });

    const serialized = JSON.stringify(detail);
    for (const forbidden of [
      "storageKey",
      "provider",
      "providerMetadata",
      "workflowRunId",
      "jobQueueStatus",
      "auditLogs",
      "actualCostUsd",
      "estimatedCostUsd",
      "adminSummaryNotes",
      "contentDraftId",
      "executionLog",
      "revisionRoundAvailable"
    ]) {
      assert.equal(serialized.includes(forbidden), false, `leaked ${forbidden}`);
    }
    assert.equal(collectClientPortalForbiddenPayloadKeys(detail).length, 0);
    assert.equal(detail.images[0]?.approvalStatus, "PENDING");
    assert.equal(detail.status, "PENDING_CLIENT_REVIEW");
  });

  it("keeps approval list status client-visible without leaking internal workflow status keys", () => {
    const summary = toClientPortalPendingApprovalSummary({
      id: "del-3",
      title: "Second article",
      status: "PENDING_CLIENT_REVIEW",
      createdAt: "2026-07-02T00:00:00.000Z",
      aiDeliveryProject: {
        id: "proj-3",
        name: "August plan",
        clientId: "client-3",
        client: null
      }
    });

    assert.equal(summary.clientName, null);
    assert.equal(summary.status, "PENDING_CLIENT_REVIEW");
    assert.equal("workflowRunStatus" in summary, false);
    assert.equal("jobQueueStatus" in summary, false);
    assert.equal("provider" in summary, false);
    assertClientPortalPayloadHasNoForbiddenKeys(summary);
  });
});
