import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPublicationHandoffPackageMappingItem,
  buildPublicationHandoffRecord,
  canExecutePublicationHandoff,
  computePublicationHandoffPackageFingerprint,
  computePublicationHandoffStage,
  resolvePublicationHandoffFeaturedImageRef,
  shouldReusePublicationHandoff,
  WORKFLOW_BRIEF_PUBLICATION_HANDOFF_MODE,
  WORKFLOW_BRIEF_PUBLICATION_HANDOFF_VERSION
} from "./workflow-brief-publication-handoff.execution";

describe("workflow-brief-publication-handoff.execution", () => {
  const baseItem = {
    contentPlanItemId: "item-1",
    planItemTitle: "Article one",
    contentDraftId: "draft-1",
    textDeliverableId: "del-1",
    articleImageId: "img-1",
    textTitle: "Title",
    bodyContent: "Body content for publication",
    excerpt: "Summary",
    imageTitle: "Hero",
    featuredImageRef: "/assets/hero.png",
    textDeliverableStatus: "ACCEPTED",
    imageStatus: "FINAL_READY",
    textDeliverableUpdatedAt: new Date("2026-07-01T10:00:00.000Z"),
    contentDraftUpdatedAt: new Date("2026-07-01T09:00:00.000Z"),
    articleImageUpdatedAt: new Date("2026-07-01T09:30:00.000Z")
  };

  it("computes stable package fingerprints", () => {
    const mapping = buildPublicationHandoffPackageMappingItem(baseItem);
    const fingerprint = computePublicationHandoffPackageFingerprint([mapping]);
    assert.match(fingerprint, /^fp_v1_[a-f0-9]{16}$/);
    assert.equal(fingerprint, computePublicationHandoffPackageFingerprint([mapping]));
  });

  it("detects package fingerprint changes", () => {
    const mapping = buildPublicationHandoffPackageMappingItem(baseItem);
    const original = computePublicationHandoffPackageFingerprint([mapping]);
    const changed = computePublicationHandoffPackageFingerprint([
      { ...mapping, textDeliverableStatus: "REVISION_REQUESTED" }
    ]);
    assert.notEqual(original, changed);
  });

  it("computes publication handoff stages", () => {
    assert.equal(
      computePublicationHandoffStage({
        packageComplete: false,
        releasePrepared: false,
        publicationTargetAvailable: true,
        handoffExecuted: false,
        packageFingerprint: "fp",
        storedFingerprint: null
      }),
      "not_ready"
    );
    assert.equal(
      computePublicationHandoffStage({
        packageComplete: true,
        releasePrepared: false,
        publicationTargetAvailable: true,
        handoffExecuted: false,
        packageFingerprint: "fp",
        storedFingerprint: null
      }),
      "release_prep_missing"
    );
    assert.equal(
      computePublicationHandoffStage({
        packageComplete: true,
        releasePrepared: true,
        publicationTargetAvailable: true,
        handoffExecuted: false,
        packageFingerprint: "fp",
        storedFingerprint: null
      }),
      "ready_to_execute"
    );
    assert.equal(
      computePublicationHandoffStage({
        packageComplete: true,
        releasePrepared: true,
        publicationTargetAvailable: true,
        handoffExecuted: true,
        packageFingerprint: "fp_a",
        storedFingerprint: "fp_b"
      }),
      "package_changed_since_handoff"
    );
    assert.equal(
      computePublicationHandoffStage({
        packageComplete: true,
        releasePrepared: true,
        publicationTargetAvailable: true,
        handoffExecuted: true,
        packageFingerprint: "fp_a",
        storedFingerprint: "fp_a"
      }),
      "draft_prepared"
    );
  });

  it("gates publication handoff for incomplete packages and non-admins", () => {
    assert.equal(
      canExecutePublicationHandoff({
        packageComplete: false,
        releasePrepared: true,
        publicationTargetAvailable: true,
        isAdmin: true
      }).allowed,
      false
    );
    assert.equal(
      canExecutePublicationHandoff({
        packageComplete: true,
        releasePrepared: true,
        publicationTargetAvailable: true,
        isAdmin: false
      }).allowed,
      false
    );
    assert.equal(
      canExecutePublicationHandoff({
        packageComplete: true,
        releasePrepared: true,
        publicationTargetAvailable: true,
        isAdmin: true
      }).allowed,
      true
    );
  });

  it("prefers final image refs over preview refs", () => {
    assert.equal(
      resolvePublicationHandoffFeaturedImageRef({
        finalImageUrl: "/final.png",
        previewImageUrl: "/preview.png"
      }),
      "/final.png"
    );
    assert.equal(
      resolvePublicationHandoffFeaturedImageRef({
        finalImageUrl: null,
        previewImageUrl: "/preview.png"
      }),
      "/preview.png"
    );
    assert.equal(
      resolvePublicationHandoffFeaturedImageRef({ finalImageUrl: null, previewImageUrl: null }),
      null
    );
  });

  it("reuses publication handoff when fingerprint is unchanged", () => {
    assert.equal(
      shouldReusePublicationHandoff({
        storedFingerprint: "fp_v1_abc",
        currentFingerprint: "fp_v1_abc",
        handoffExecuted: true
      }),
      true
    );
    assert.equal(
      shouldReusePublicationHandoff({
        storedFingerprint: "fp_v1_abc",
        currentFingerprint: "fp_v1_def",
        handoffExecuted: true
      }),
      false
    );
  });

  it("builds publication handoff records", () => {
    const record = buildPublicationHandoffRecord({
      briefId: "brief-1",
      executedAt: "2026-07-01T12:00:00.000Z",
      publicationTargetId: "target-1",
      publicationTargetLabel: "Client blog",
      packageFingerprint: "fp_v1_abc",
      aiDeliveryProjectId: "project-1",
      productionPlanId: "plan-1",
      items: [
        {
          contentPlanItemId: "item-1",
          planItemTitle: "Article one",
          textDeliverableId: "del-1",
          articleImageId: "img-1",
          publicationLogId: "log-1",
          outcome: "created",
          draftStatus: "PREPARED",
          draftTitle: "Title",
          draftBodyPreview: "Body",
          featuredImageRef: null,
          publicationTargetId: "target-1",
          publicationTargetLabel: "Client blog",
          preparedAt: "2026-07-01T12:00:00.000Z"
        }
      ]
    });

    assert.equal(record.version, WORKFLOW_BRIEF_PUBLICATION_HANDOFF_VERSION);
    assert.equal(record.kind, "publication_handoff_result");
    assert.equal(record.executionMode, WORKFLOW_BRIEF_PUBLICATION_HANDOFF_MODE);
    assert.equal(record.preparedCount, 1);
    assert.equal(record.reusedCount, 0);
    assert.equal("storageKey" in record, false);
    assert.equal("prompt" in record, false);
  });
});
