import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveMonthlyReportApprovalState } from "./monthly-report-metrics-approval-state";

describe("monthly-report-metrics-approval-state (G537)", () => {
  it("G537: DRAFT and ADMIN_REVIEW are not client-visible and forbid available wording", () => {
    const draft = resolveMonthlyReportApprovalState({ status: "DRAFT" });
    assert.equal(draft.status, "DRAFT");
    assert.equal(draft.clientVisible, false);
    assert.equal(draft.adminEditable, true);
    assert.equal(draft.clientAvailabilityWordingAllowed, false);
    assert.equal(draft.clientLabel, "Report not available");
    assert.match(draft.adminLabel, /not client-visible/i);

    const review = resolveMonthlyReportApprovalState({ status: "ADMIN_REVIEW", audience: "client" });
    assert.equal(review.status, "ADMIN_REVIEW");
    assert.equal(review.clientVisible, false);
    assert.equal(review.clientAvailabilityWordingAllowed, false);
    assert.equal(review.clientLabel, "Report not available");
    assert.match(review.adminLabel, /Admin review/i);
  });

  it("G537: FINAL allows client availability wording; ARCHIVED hides from portal", () => {
    const final = resolveMonthlyReportApprovalState({ status: "FINAL", audience: "client" });
    assert.equal(final.status, "FINAL");
    assert.equal(final.clientVisible, true);
    assert.equal(final.adminEditable, false);
    assert.equal(final.clientAvailabilityWordingAllowed, true);
    assert.equal(final.clientLabel, "Monthly report available");
    assert.match(final.adminLabel, /client-visible/i);

    const archived = resolveMonthlyReportApprovalState({
      status: "FINAL",
      isArchived: true
    });
    assert.equal(archived.status, "ARCHIVED");
    assert.equal(archived.clientVisible, false);
    assert.equal(archived.clientAvailabilityWordingAllowed, false);
    assert.equal(archived.clientLabel, "Report not available");
    assert.match(archived.adminLabel, /Archived/i);
  });

  it("G537: unknown status stays not client-visible; empty defaults to DRAFT", () => {
    const unknown = resolveMonthlyReportApprovalState({ status: "PUBLISHED" });
    assert.equal(unknown.status, "UNKNOWN");
    assert.equal(unknown.clientVisible, false);
    assert.equal(unknown.clientAvailabilityWordingAllowed, false);
    assert.ok(unknown.errors.some((e) => /not a known approval state/i.test(e)));
    assert.equal(unknown.clientLabel, "Report not available");

    const empty = resolveMonthlyReportApprovalState({});
    assert.equal(empty.status, "DRAFT");
    assert.equal(empty.clientVisible, false);
    assert.equal(empty.errors.length, 0);
  });

  it("G537: client labels never claim available for non-FINAL statuses", () => {
    for (const status of ["DRAFT", "ADMIN_REVIEW", "ARCHIVED", "bogus"] as const) {
      const state = resolveMonthlyReportApprovalState({ status, audience: "client" });
      assert.equal(state.clientAvailabilityWordingAllowed, false);
      assert.match(state.clientLabel, /not available/i);
      assert.equal(/available$/i.test(state.clientLabel) && !/not available/i.test(state.clientLabel), false);
    }
  });
});
