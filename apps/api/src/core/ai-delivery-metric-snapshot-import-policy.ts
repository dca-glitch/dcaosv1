/**
 * Pure policy for monthly metric snapshot re-import.
 *
 * Approval fields (status/approvedByUserId/approvedAt) are NOT import-owned. Re-importing
 * metrics must never downgrade or erase an already-approved snapshot; only import-owned data
 * fields may change. This keeps the decision testable without a database.
 */

export function shouldPreserveMetricSnapshotApproval(existingStatus: string | null | undefined): boolean {
  return existingStatus === "APPROVED";
}

/**
 * Builds the Prisma `update` payload for a metrics re-import. When the existing snapshot is
 * already approved, workflow status and approval metadata are omitted (preserved). Otherwise the
 * requested status is applied and approval metadata is reset to null.
 */
export function buildMetricSnapshotImportUpdateData<T extends Record<string, unknown>>(
  importOwnedData: T,
  existingStatus: string | null | undefined,
  requestedStatus: string
): T & { status?: string; approvedByUserId?: null; approvedAt?: null } {
  if (shouldPreserveMetricSnapshotApproval(existingStatus)) {
    return { ...importOwnedData };
  }
  return { ...importOwnedData, status: requestedStatus, approvedByUserId: null, approvedAt: null };
}
