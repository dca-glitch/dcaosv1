import type { Prisma } from "@prisma/client";
import type { FinanceMonthlySnapshotSummary } from "./finance.types";
import { isFinanceEventExcluded } from "./finance-event.service";

type PrismaTx = Prisma.TransactionClient;

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export function normalizeFinanceMonth(value: string | null | undefined): string | null {
  if (!value || !MONTH_PATTERN.test(value)) {
    return null;
  }
  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function monthBoundsUtc(month: string): { start: Date; end: Date } {
  const [year, monthNum] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0, 0));
  return { start, end };
}

export function eventMonthUtc(timestamp: Date): string {
  const year = timestamp.getUTCFullYear();
  const month = String(timestamp.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function computeSnapshotTotals(events: Array<{ type: "REVENUE" | "COST"; amountCents: number; metadata: unknown }>): {
  totalRevenueCents: number;
  totalCostCents: number;
  profitCents: number;
  marginPercent: number;
} {
  let totalRevenueCents = 0;
  let totalCostCents = 0;

  for (const event of events) {
    if (isFinanceEventExcluded(event.metadata)) {
      continue;
    }
    if (event.type === "REVENUE") {
      totalRevenueCents += event.amountCents;
    } else {
      totalCostCents += event.amountCents;
    }
  }

  const profitCents = totalRevenueCents - totalCostCents;
  const marginPercent =
    totalRevenueCents > 0 ? Math.round((profitCents / totalRevenueCents) * 10000) / 100 : 0;

  return { totalRevenueCents, totalCostCents, profitCents, marginPercent };
}

export function toFinanceMonthlySnapshotSummary(snapshot: {
  month: string;
  totalRevenueCents: number;
  totalCostCents: number;
  profitCents: number;
  marginPercent: number;
  reportStorageKey: string | null;
  updatedAt: Date;
}): FinanceMonthlySnapshotSummary {
  return {
    month: snapshot.month,
    totalRevenue: snapshot.totalRevenueCents,
    totalCost: snapshot.totalCostCents,
    profit: snapshot.profitCents,
    marginPercent: snapshot.marginPercent,
    reportStorageKey: snapshot.reportStorageKey,
    updatedAt: snapshot.updatedAt.toISOString()
  };
}

export async function computeAndUpsertMonthlySnapshot(
  tx: PrismaTx,
  tenantId: string,
  month: string
): Promise<FinanceMonthlySnapshotSummary> {
  const { start, end } = monthBoundsUtc(month);
  const events = await tx.financeEvent.findMany({
    where: {
      tenantId,
      timestamp: {
        gte: start,
        lt: end
      }
    },
    orderBy: [{ timestamp: "asc" }, { id: "asc" }],
    select: {
      type: true,
      amountCents: true,
      metadata: true
    }
  });

  const totals = computeSnapshotTotals(events);
  const snapshot = await tx.financeMonthlySnapshot.upsert({
    where: {
      tenantId_month: { tenantId, month }
    },
    create: {
      tenantId,
      month,
      ...totals
    },
    update: totals,
    select: {
      month: true,
      totalRevenueCents: true,
      totalCostCents: true,
      profitCents: true,
      marginPercent: true,
      reportStorageKey: true,
      updatedAt: true
    }
  });

  return toFinanceMonthlySnapshotSummary(snapshot);
}

export async function refreshSnapshotsForEventMonth(
  tx: PrismaTx,
  tenantId: string,
  timestamp: Date
): Promise<void> {
  const month = eventMonthUtc(timestamp);
  await computeAndUpsertMonthlySnapshot(tx, tenantId, month);
}
