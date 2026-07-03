import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildClientSafeReleasePackage,
  buildFinalReleasePackageRecord,
  canFinalizeWorkflowBriefReleasePackage,
  computeFinalReleasePackageStage,
  isReleasableTextDeliverableStatus,
  shouldReuseFinalReleasePackage,
  toClientSafeReleasePackageFromRecord,
  WORKFLOW_BRIEF_FINAL_RELEASE_PACKAGE_VERSION
} from "./workflow-brief-final-release.execution";

const sampleItem = {
  contentPlanItemId: "item-1",
  planItemTitle: "Blog post",
  textDeliverableId: "del-1",
  articleImageId: "img-1",
  textTitle: "Sample title",
  deliveryType: "ARTICLE_DRAFT",
  exportUrl: "https://example.com/export.docx",
  textDeliverableStatus: "APPROVED_BY_CLIENT",
  imageTitle: "Hero image",
  imageUrl: "https://cdn.example.com/hero.jpg",
  imageStatus: "FINAL_READY"
};

describe("workflow-brief-final-release.execution", () => {
  it("computes finalize stage from release prep and finalized state", () => {
    assert.equal(
      computeFinalReleasePackageStage({
        releasePrepared: false,
        releasePackageFinalized: false,
        canFinalize: false,
        packageChangedSinceFinalize: false
      }),
      "release_prep_missing"
    );
    assert.equal(
      computeFinalReleasePackageStage({
        releasePrepared: true,
        releasePackageFinalized: false,
        canFinalize: true,
        packageChangedSinceFinalize: false
      }),
      "ready_to_finalize"
    );
    assert.equal(
      computeFinalReleasePackageStage({
        releasePrepared: true,
        releasePackageFinalized: true,
        canFinalize: false,
        packageChangedSinceFinalize: true
      }),
      "package_changed_since_finalize"
    );
  });

  it("blocks finalize for non-admin and missing release prep", () => {
    assert.equal(
      canFinalizeWorkflowBriefReleasePackage({
        releasePrepared: false,
        packageComplete: true,
        isAdmin: true,
        alreadyFinalized: false,
        packageChangedSinceFinalize: false
      }).allowed,
      false
    );
    assert.equal(
      canFinalizeWorkflowBriefReleasePackage({
        releasePrepared: true,
        packageComplete: true,
        isAdmin: false,
        alreadyFinalized: false,
        packageChangedSinceFinalize: false
      }).allowed,
      false
    );
    assert.equal(
      canFinalizeWorkflowBriefReleasePackage({
        releasePrepared: true,
        packageComplete: true,
        isAdmin: true,
        alreadyFinalized: true,
        packageChangedSinceFinalize: false
      }).allowed,
      false
    );
  });

  it("builds client-safe package without internal ids", () => {
    const record = buildFinalReleasePackageRecord({
      briefId: "brief-1",
      briefTitle: "Monthly brief",
      aiDeliveryProjectId: "proj-1",
      projectName: "July delivery",
      productionPlanId: "plan-1",
      packageFingerprint: "fp_v1_abc",
      summary: "Final package ready for client review archive.",
      items: [sampleItem]
    });

    assert.equal(record.version, WORKFLOW_BRIEF_FINAL_RELEASE_PACKAGE_VERSION);
    assert.equal(record.kind, "final_release_package");
    assert.ok(record.releasePackageId);
    assert.equal(record.clientSnapshot.releaseStatus, "RELEASED");
    assert.equal(record.clientSnapshot.deliverables[0]?.status, "RELEASED");
    assert.equal(record.clientSnapshot.images[0]?.status, "FINAL");
    assert.equal(record.clientSnapshot.deliverables[0]?.title, "Sample title");
    assert.equal("storageKey" in record.clientSnapshot, false);
    assert.equal("prompt" in record.clientSnapshot, false);
    assert.equal("textDeliverableId" in record.clientSnapshot, false);
    assert.equal("releasePackageId" in record.clientSnapshot, false);

    const clientView = toClientSafeReleasePackageFromRecord(record);
    assert.ok(clientView);
    assert.equal(clientView?.deliverables.length, 1);
    assert.equal(clientView?.images[0]?.imageUrl, "https://cdn.example.com/hero.jpg");
    assert.equal(clientView && "releasePackageId" in clientView, false);
  });

  it("reuses finalized package when fingerprint is unchanged", () => {
    assert.equal(
      shouldReuseFinalReleasePackage({
        storedFingerprint: "fp_v1_same",
        currentFingerprint: "fp_v1_same",
        releasePackageFinalized: true
      }),
      true
    );
    assert.equal(
      shouldReuseFinalReleasePackage({
        storedFingerprint: "fp_v1_old",
        currentFingerprint: "fp_v1_new",
        releasePackageFinalized: true
      }),
      false
    );
  });

  it("recognizes releasable text deliverable statuses", () => {
    assert.equal(isReleasableTextDeliverableStatus("APPROVED_BY_CLIENT"), true);
    assert.equal(isReleasableTextDeliverableStatus("DRAFT"), false);
    const snapshot = buildClientSafeReleasePackage({
      briefTitle: "Brief",
      projectName: "Project",
      finalizedAt: new Date().toISOString(),
      summary: "Summary",
      items: [sampleItem]
    });
    assert.equal(snapshot.deliverables[0]?.exportUrl, "https://example.com/export.docx");
  });
});
