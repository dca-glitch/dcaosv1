import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_ONLY_PRIVATE_STORAGE_FIELDS,
  ADMIN_PRIVATE_FIELD_INVENTORY,
  buildAuditSafeDownloadMetadata,
  buildClientSafeDownloadProofStagePlan,
  buildDownloadFailureClientError,
  buildLocalMockDownloadTruth,
  isAdminOnlyPrivateStorageField,
  isAuditSafeDownloadMetadata,
  isClientSafeDownloadProofStage,
  listAdminOnlyPrivateStorageFields,
  listClientSafeDownloadProofStagePlans,
  toAdminPrivateFieldInventorySnapshot
} from "./private-delivery-download-boundary";
import { assertNoStorageKeyLeak } from "./storage-key-boundary";

describe("private-delivery-download-boundary (G485–G489)", () => {
  it("inventories admin-only private fields without exposing values (G485)", () => {
    assert.deepEqual([...listAdminOnlyPrivateStorageFields()], ["storageKey", "documentStorageKey"]);
    assert.equal(isAdminOnlyPrivateStorageField("storageKey"), true);
    assert.equal(isAdminOnlyPrivateStorageField("exportUrl"), false);

    for (const entry of ADMIN_PRIVATE_FIELD_INVENTORY) {
      assert.equal(entry.audience, "admin");
      assert.equal(entry.clientForbidden, true);
      assert.equal(entry.valueExposed, false);
    }

    const snapshot = toAdminPrivateFieldInventorySnapshot();
    assert.equal(snapshot.liveProven, false);
    assert.deepEqual([...snapshot.fields], [...ADMIN_ONLY_PRIVATE_STORAGE_FIELDS]);
    // Inventory lists field *names* only — must not embed raw tenant object paths.
    assert.equal(JSON.stringify(snapshot).includes("tenants/"), false);
    assert.equal(JSON.stringify(ADMIN_PRIVATE_FIELD_INVENTORY).includes("tenants/"), false);
  });

  it("lists client-safe download future proof stages as non-live (G486)", () => {
    const plans = listClientSafeDownloadProofStagePlans();
    assert.ok(plans.length >= 5);
    for (const plan of plans) {
      assert.equal(isClientSafeDownloadProofStage(plan.stage), true);
      assert.equal(plan.liveIoPerformed, false);
      assert.equal(plan.claimsLiveBucketProof, false);
      assert.equal(plan.clientSafe, true);
      assert.equal(plan.liveIoAllowed, false);
    }

    const future = buildClientSafeDownloadProofStagePlan("future_signed_url_issuance");
    assert.equal(future.truthLabel, "future_placeholder");
    assert.equal(future.liveIoAllowed, false);
  });

  it("labels local mock downloads as mocked and non-live (G487)", () => {
    const mock = buildLocalMockDownloadTruth({
      storageKeyPresent: true,
      exportUrl: "https://docs.example.com/export/mock"
    });

    assert.equal(mock.truthLabel, "mocked");
    assert.equal(mock.liveProven, false);
    assert.equal(mock.mayImplyLiveSignedUrl, false);
    assert.equal(mock.hasDocument, true);
    assert.equal(mock.exportUrl, "https://docs.example.com/export/mock");
    assert.ok(mock.downloadUrl?.includes("mock.local"));
    assertNoStorageKeyLeak(mock);
    assert.equal(JSON.stringify(mock).includes("tenants/"), false);
  });

  it("redacts download failure payloads so storageKey never leaks (G488)", () => {
    const failure = buildDownloadFailureClientError(
      "Download failed for storageKey=tenants/acme/years/2026/documents/secret.pdf R2_SECRET_ACCESS_KEY=supersecret"
    );

    assert.equal(failure.redacted, true);
    assert.equal(failure.liveProven, false);
    assert.equal(failure.storageKeyExposed, false);
    assert.equal(failure.error.code, "DOWNLOAD_FAILED");
    assert.equal(JSON.stringify(failure).includes("tenants/acme"), false);
    assert.equal(JSON.stringify(failure).includes("supersecret"), false);
    assert.equal(JSON.stringify(failure).includes("storageKey="), false);
    assertNoStorageKeyLeak(failure);
  });

  it("builds audit-safe download metadata without storageKey (G489)", () => {
    const meta = buildAuditSafeDownloadMetadata({
      audience: "client",
      entityType: "deliverable",
      entityId: "deliv-1",
      tenantIdHash: "tenant-hash-abc",
      hasDocument: true,
      truthLabel: "mocked",
      expiresSeconds: null,
      outcome: "disabled",
      storageKeyPresent: true
    });

    assert.equal(meta.event, "private_delivery_download");
    assert.equal(meta.liveProven, false);
    assert.equal(meta.storageKeyPresent, true);
    assert.equal("storageKey" in meta, false);
    assert.equal(isAuditSafeDownloadMetadata(meta), true);
    assertNoStorageKeyLeak(meta);

    assert.throws(() =>
      buildAuditSafeDownloadMetadata({
        audience: "client",
        entityType: "monthly_report",
        entityId: "report-1",
        tenantIdHash: "tenant-hash-abc",
        hasDocument: true,
        truthLabel: "export_url",
        outcome: "issued",
        storageKey: "tenants/leak/key.pdf"
      } as never)
    );
  });
});
