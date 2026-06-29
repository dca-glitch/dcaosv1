import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeSnapshotTotals, eventMonthUtc, monthBoundsUtc, normalizeFinanceMonth } from "./finance-snapshot.service";

describe("finance snapshot", () => {
  it("normalizes valid month strings", () => {
    assert.equal(normalizeFinanceMonth("2026-06"), "2026-06");
    assert.equal(normalizeFinanceMonth("2026-6"), null);
    assert.equal(normalizeFinanceMonth("invalid"), null);
  });

  it("computes month bounds in UTC", () => {
    const { start, end } = monthBoundsUtc("2026-06");
    assert.equal(start.toISOString(), "2026-06-01T00:00:00.000Z");
    assert.equal(end.toISOString(), "2026-07-01T00:00:00.000Z");
  });

  it("derives event month in UTC", () => {
    assert.equal(eventMonthUtc(new Date("2026-06-15T12:00:00.000Z")), "2026-06");
  });

  it("computes deterministic snapshot totals", () => {
    const totals = computeSnapshotTotals([
      { type: "REVENUE", amountCents: 10000, metadata: {} },
      { type: "REVENUE", amountCents: 5000, metadata: { excluded: true } },
      { type: "COST", amountCents: 3000, metadata: {} }
    ]);

    assert.deepEqual(totals, {
      totalRevenueCents: 10000,
      totalCostCents: 3000,
      profitCents: 7000,
      marginPercent: 70
    });
  });
});
