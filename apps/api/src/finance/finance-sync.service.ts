import type { Prisma } from "@prisma/client";
import { createCostEvent, createRevenueEvent } from "./finance-event.service";
import { refreshSnapshotsForEventMonth } from "./finance-snapshot.service";

type PrismaTx = Prisma.TransactionClient;

const REVENUE_INVOICE_STATUSES = new Set(["ISSUED", "PAID"]);

function invoiceEventTimestamp(invoice: {
  paidAt: Date | null;
  issueDate: Date | null;
  createdAt: Date;
}): Date {
  return invoice.paidAt ?? invoice.issueDate ?? invoice.createdAt;
}

export async function syncInvoiceToFinanceEvent(
  tx: PrismaTx,
  tenantId: string,
  invoiceId: string
): Promise<void> {
  const invoice = await tx.invoice.findFirst({
    where: { id: invoiceId, tenantId },
    select: {
      id: true,
      clientId: true,
      projectId: true,
      status: true,
      currency: true,
      totalCents: true,
      invoiceNumber: true,
      isArchived: true,
      paidAt: true,
      issueDate: true,
      createdAt: true
    }
  });
  if (!invoice) {
    return;
  }

  const shouldRecord =
    !invoice.isArchived && REVENUE_INVOICE_STATUSES.has(invoice.status);

  if (!shouldRecord) {
    const existing = await tx.financeEvent.findFirst({
      where: { tenantId, source: "INVOICE", sourceEntityId: invoice.id },
      select: { timestamp: true }
    });
    if (existing) {
      await tx.financeEvent.update({
        where: {
          tenantId_source_sourceEntityId: {
            tenantId,
            source: "INVOICE",
            sourceEntityId: invoice.id
          }
        },
        data: {
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            excluded: true,
            exclusionReason: `Invoice status ${invoice.status}`
          }
        }
      });
      await refreshSnapshotsForEventMonth(tx, tenantId, existing.timestamp);
    }
    return;
  }

  const timestamp = invoiceEventTimestamp(invoice);
  await createRevenueEvent(tx, tenantId, {
    source: "INVOICE",
    sourceEntityId: invoice.id,
    amountCents: invoice.totalCents,
    currency: invoice.currency,
    clientId: invoice.clientId,
    projectId: invoice.projectId,
    timestamp,
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      excluded: false
    }
  });
  await refreshSnapshotsForEventMonth(tx, tenantId, timestamp);
}

export async function syncBillToFinanceEvent(
  tx: PrismaTx,
  tenantId: string,
  billId: string
): Promise<void> {
  const bill = await tx.bill.findFirst({
    where: { id: billId, tenantId },
    select: {
      id: true,
      amountCents: true,
      paymentDate: true,
      isArchived: true,
      referenceNumber: true,
      category: true,
      vendorId: true
    }
  });
  if (!bill) {
    return;
  }

  if (bill.isArchived) {
    const existing = await tx.financeEvent.findFirst({
      where: { tenantId, source: "BILL", sourceEntityId: bill.id },
      select: { timestamp: true }
    });
    if (existing) {
      await tx.financeEvent.update({
        where: {
          tenantId_source_sourceEntityId: {
            tenantId,
            source: "BILL",
            sourceEntityId: bill.id
          }
        },
        data: {
          metadata: {
            billId: bill.id,
            excluded: true,
            exclusionReason: "Bill archived"
          }
        }
      });
      await refreshSnapshotsForEventMonth(tx, tenantId, existing.timestamp);
    }
    return;
  }

  const timestamp = bill.paymentDate;
  await createCostEvent(tx, tenantId, {
    source: "BILL",
    sourceEntityId: bill.id,
    amountCents: bill.amountCents,
    currency: "USD",
    clientId: null,
    projectId: null,
    timestamp,
    metadata: {
      billId: bill.id,
      vendorId: bill.vendorId,
      referenceNumber: bill.referenceNumber,
      category: bill.category,
      excluded: false
    }
  });
  await refreshSnapshotsForEventMonth(tx, tenantId, timestamp);
}

export async function migrateLegacyFinanceToLedger(
  tx: PrismaTx,
  tenantId: string
): Promise<{ invoicesMigrated: number; billsMigrated: number }> {
  const invoices = await tx.invoice.findMany({
    where: { tenantId },
    select: { id: true }
  });
  const bills = await tx.bill.findMany({
    where: { tenantId },
    select: { id: true }
  });

  for (const invoice of invoices) {
    await syncInvoiceToFinanceEvent(tx, tenantId, invoice.id);
  }
  for (const bill of bills) {
    await syncBillToFinanceEvent(tx, tenantId, bill.id);
  }

  const months = new Set<string>();
  const events = await tx.financeEvent.findMany({
    where: { tenantId },
    select: { timestamp: true }
  });
  for (const event of events) {
    const year = event.timestamp.getUTCFullYear();
    const month = String(event.timestamp.getUTCMonth() + 1).padStart(2, "0");
    months.add(`${year}-${month}`);
  }

  const { computeAndUpsertMonthlySnapshot } = await import("./finance-snapshot.service");
  for (const month of [...months].sort()) {
    await computeAndUpsertMonthlySnapshot(tx, tenantId, month);
  }

  return { invoicesMigrated: invoices.length, billsMigrated: bills.length };
}
