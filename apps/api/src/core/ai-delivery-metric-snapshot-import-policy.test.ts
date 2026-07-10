/**
 * Regression: monthly metrics re-import must not downgrade or erase an approved snapshot.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMetricSnapshotImportUpdateData,
  shouldPreserveMetricSnapshotApproval
} from "./ai-delivery-metric-snapshot-import-policy";

const importOwned = {
  aiDeliveryProjectId: "proj-1",
  targetMonth: "2026-06",
  sourceType: "CSV_IMPORT",
  gscClicks: 100,
  importedByUserId: "user-1"
};

describe("metric snapshot import approval preservation", () => {
  it("preserves approval by omitting status/approval fields when snapshot is already APPROVED", () => {
    assert.equal(shouldPreserveMetricSnapshotApproval("APPROVED"), true);

    const update = buildMetricSnapshotImportUpdateData(importOwned, "APPROVED", "IMPORTED");
    assert.equal("status" in update, false, "must not overwrite status on an approved snapshot");
    assert.equal("approvedByUserId" in update, false, "must not clear approvedByUserId");
    assert.equal("approvedAt" in update, false, "must not clear approvedAt");
    // Import-owned data still updates.
    assert.equal(update.gscClicks, 100);
    assert.equal(update.aiDeliveryProjectId, "proj-1");
  });

  it("applies requested status and resets approval nulls for a non-approved snapshot", () => {
    assert.equal(shouldPreserveMetricSnapshotApproval("IMPORTED"), false);
    assert.equal(shouldPreserveMetricSnapshotApproval(null), false);

    const update = buildMetricSnapshotImportUpdateData(importOwned, "IMPORTED", "IMPORTED");
    assert.equal(update.status, "IMPORTED");
    assert.equal(update.approvedByUserId, null);
    assert.equal(update.approvedAt, null);
    assert.equal(update.gscClicks, 100);
  });
});
