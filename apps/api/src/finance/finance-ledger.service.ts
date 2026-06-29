import type { Prisma } from "@prisma/client";
import type {
  FinanceClientSummaryResponse,
  FinanceEventsResponse,
  FinanceProjectSummaryResponse,
  FinanceSummaryResponse
} from "./finance.types";
import { toFinanceEventSummary } from "./finance-event.service";
import {
  computeSnapshotTotals,
  eventMonthUtc,
  monthBoundsUtc,
  normalizeFinanceMonth,
  toFinanceMonthlySnapshotSummary
} from "./finance-snapshot.service";
import { isFinanceEventExcluded } from "./finance-event.service";

type PrismaTx = Prisma.TransactionClient;

function computeMarginPercent(totalRevenue: number, profit: number): number {
  return totalRevenue > 0 ? Math.round((profit / totalRevenue) * 10000) / 100 : 0;
}

export async function aggregateFinanceEvents(
  tx: PrismaTx,
  tenantId: string,
  filter: {
    month?: string | null;
    clientId?: string | null;
    projectId?: string | null;
  }
): Promise<{
  totalRevenue: number;
  totalCost: number;
  profit: number;
  marginPercent: number;
  eventCount: number;
}> {
  const where: Prisma.FinanceEventWhereInput = { tenantId };

  if (filter.clientId) {
    where.clientId = filter.clientId;
  }
  if (filter.projectId) {
    where.projectId = filter.projectId;
  }
  if (filter.month) {
    const { start, end } = monthBoundsUtc(filter.month);
    where.timestamp = { gte: start, lt: end };
  }

  const events = await tx.financeEvent.findMany({
    where,
    orderBy: [{ timestamp: "asc" }, { id: "asc" }],
    select: { type: true, amountCents: true, metadata: true }
  });

  const totals = computeSnapshotTotals(events);
  const activeCount = events.filter((event) => !isFinanceEventExcluded(event.metadata)).length;

  return {
    totalRevenue: totals.totalRevenueCents,
    totalCost: totals.totalCostCents,
    profit: totals.profitCents,
    marginPercent: computeMarginPercent(totals.totalRevenueCents, totals.profitCents),
    eventCount: activeCount
  };
}

export async function getFinanceSummaryFromLedger(
  tx: PrismaTx,
  tenantId: string,
  monthInput: string | null | undefined
): Promise<FinanceSummaryResponse | null> {
  const month = normalizeFinanceMonth(monthInput) ?? eventMonthUtc(new Date());
  const snapshot = await tx.financeMonthlySnapshot.findUnique({
    where: { tenantId_month: { tenantId, month } },
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

  if (snapshot) {
    return {
      month,
      snapshot: toFinanceMonthlySnapshotSummary(snapshot)
    };
  }

  const { computeAndUpsertMonthlySnapshot } = await import("./finance-snapshot.service");
  const computed = await computeAndUpsertMonthlySnapshot(tx, tenantId, month);
  return { month, snapshot: computed };
}

export async function getFinanceClientSummaryFromLedger(
  tx: PrismaTx,
  tenantId: string,
  clientId: string
): Promise<FinanceClientSummaryResponse | null> {
  const client = await tx.client.findFirst({
    where: { id: clientId, tenantId },
    select: { id: true }
  });
  if (!client) {
    return null;
  }

  const totals = await aggregateFinanceEvents(tx, tenantId, { clientId });
  return {
    clientId,
    totalRevenue: totals.totalRevenue,
    totalCost: totals.totalCost,
    profit: totals.profit,
    marginPercent: totals.marginPercent,
    eventCount: totals.eventCount
  };
}

export async function getFinanceProjectSummaryFromLedger(
  tx: PrismaTx,
  tenantId: string,
  projectId: string
): Promise<FinanceProjectSummaryResponse | null> {
  const project = await tx.project.findFirst({
    where: { id: projectId, tenantId },
    select: { id: true }
  });
  if (!project) {
    return null;
  }

  const totals = await aggregateFinanceEvents(tx, tenantId, { projectId });
  return {
    projectId,
    totalRevenue: totals.totalRevenue,
    totalCost: totals.totalCost,
    profit: totals.profit,
    marginPercent: totals.marginPercent,
    eventCount: totals.eventCount
  };
}

export async function listFinanceEventsFromLedger(
  tx: PrismaTx,
  tenantId: string,
  options: {
    month?: string | null;
    clientId?: string | null;
    projectId?: string | null;
    limit?: number;
  } = {}
): Promise<FinanceEventsResponse> {
  const where: Prisma.FinanceEventWhereInput = { tenantId };

  if (options.clientId) {
    where.clientId = options.clientId;
  }
  if (options.projectId) {
    where.projectId = options.projectId;
  }
  if (options.month) {
    const normalized = normalizeFinanceMonth(options.month);
    if (normalized) {
      const { start, end } = monthBoundsUtc(normalized);
      where.timestamp = { gte: start, lt: end };
    }
  }

  const events = await tx.financeEvent.findMany({
    where,
    orderBy: [{ timestamp: "desc" }, { id: "desc" }],
    take: Math.min(Math.max(options.limit ?? 200, 1), 500),
    select: {
      id: true,
      type: true,
      source: true,
      sourceEntityId: true,
      amountCents: true,
      currency: true,
      clientId: true,
      projectId: true,
      timestamp: true,
      metadata: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return { events: events.map(toFinanceEventSummary) };
}
