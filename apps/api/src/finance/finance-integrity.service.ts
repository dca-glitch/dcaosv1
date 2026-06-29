import type { Prisma } from "@prisma/client";
import type { FinanceIntegrityCheck, FinanceIntegrityResponse } from "./finance.types";
import { computeSnapshotTotals, monthBoundsUtc } from "./finance-snapshot.service";

type PrismaTx = Prisma.TransactionClient;

export async function runFinanceIntegrityChecks(
  tx: PrismaTx,
  tenantId: string
): Promise<FinanceIntegrityResponse> {
  const checks: FinanceIntegrityCheck[] = [];

  const revenueInvoices = await tx.invoice.findMany({
    where: {
      tenantId,
      isArchived: false,
      status: { in: ["ISSUED", "PAID"] }
    },
    select: { id: true, invoiceNumber: true }
  });

  for (const invoice of revenueInvoices) {
    const event = await tx.financeEvent.findFirst({
      where: {
        tenantId,
        source: "INVOICE",
        sourceEntityId: invoice.id
      },
      select: { id: true, metadata: true }
    });
    if (!event) {
      checks.push({
        code: "ORPHAN_INVOICE",
        severity: "error",
        message: `Invoice ${invoice.invoiceNumber} has no finance event`,
        entityId: invoice.id
      });
      continue;
    }
    const metadata = event.metadata as Record<string, unknown>;
    if (metadata.excluded === true) {
      checks.push({
        code: "ORPHAN_INVOICE",
        severity: "error",
        message: `Invoice ${invoice.invoiceNumber} finance event is excluded`,
        entityId: invoice.id
      });
    }
  }

  const activeBills = await tx.bill.findMany({
    where: { tenantId, isArchived: false },
    select: { id: true, referenceNumber: true }
  });

  for (const bill of activeBills) {
    const event = await tx.financeEvent.findFirst({
      where: {
        tenantId,
        source: "BILL",
        sourceEntityId: bill.id
      },
      select: { id: true, metadata: true }
    });
    if (!event) {
      checks.push({
        code: "ORPHAN_BILL",
        severity: "error",
        message: `Bill ${bill.referenceNumber ?? bill.id} has no finance event`,
        entityId: bill.id
      });
      continue;
    }
    const metadata = event.metadata as Record<string, unknown>;
    if (metadata.excluded === true) {
      checks.push({
        code: "ORPHAN_BILL",
        severity: "error",
        message: `Bill ${bill.referenceNumber ?? bill.id} finance event is excluded`,
        entityId: bill.id
      });
    }
  }

  const deliveryRevenueEvents = await tx.financeEvent.findMany({
    where: {
      tenantId,
      type: "REVENUE",
      source: { in: ["DELIVERY", "INVOICE"] }
    },
    select: {
      id: true,
      source: true,
      clientId: true,
      projectId: true,
      revenueAttribution: {
        select: { id: true, deliveryId: true }
      }
    }
  });

  for (const event of deliveryRevenueEvents) {
    if (!event.revenueAttribution && event.source === "DELIVERY") {
      checks.push({
        code: "MISSING_ATTRIBUTION",
        severity: "warning",
        message: "Delivery revenue event missing attribution",
        entityId: event.id
      });
    }
    if (event.revenueAttribution && !event.revenueAttribution.deliveryId && event.source === "DELIVERY") {
      checks.push({
        code: "MISSING_ATTRIBUTION",
        severity: "warning",
        message: "Revenue attribution missing delivery link",
        entityId: event.id
      });
    }
  }

  const snapshots = await tx.financeMonthlySnapshot.findMany({
    where: { tenantId },
    select: {
      month: true,
      totalRevenueCents: true,
      totalCostCents: true,
      profitCents: true,
      marginPercent: true
    }
  });

  for (const snapshot of snapshots) {
    const { start, end } = monthBoundsUtc(snapshot.month);
    const events = await tx.financeEvent.findMany({
      where: {
        tenantId,
        timestamp: { gte: start, lt: end }
      },
      select: { type: true, amountCents: true, metadata: true }
    });
    const computed = computeSnapshotTotals(events);
    const mismatch =
      computed.totalRevenueCents !== snapshot.totalRevenueCents ||
      computed.totalCostCents !== snapshot.totalCostCents ||
      computed.profitCents !== snapshot.profitCents ||
      computed.marginPercent !== snapshot.marginPercent;

    if (mismatch) {
      checks.push({
        code: "SNAPSHOT_INCONSISTENT",
        severity: "error",
        message: `Monthly snapshot ${snapshot.month} does not match ledger totals`,
        entityId: snapshot.month
      });
    }
  }

  return {
    checks,
    ok: checks.every((check) => check.severity !== "error")
  };
}
