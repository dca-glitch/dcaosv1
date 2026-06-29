import type { Prisma } from "@prisma/client";
import { createRevenueEvent } from "./finance-event.service";
import { refreshSnapshotsForEventMonth } from "./finance-snapshot.service";

type PrismaTx = Prisma.TransactionClient;

export interface DeliveryPublishContext {
  tenantId: string;
  deliverableId: string;
  aiDeliveryProjectId: string;
  clientId: string;
  projectId: string | null;
  publishedAt: Date;
  invoiceId?: string | null;
  amountCents?: number;
  metadata?: Record<string, unknown>;
}

export async function linkDeliveryRevenueAttribution(
  tx: PrismaTx,
  input: DeliveryPublishContext
): Promise<{ financeEventId: string; attributionId: string }> {
  let financeEventId: string | null = null;

  if (input.invoiceId) {
    const invoiceEvent = await tx.financeEvent.findFirst({
      where: {
        tenantId: input.tenantId,
        source: "INVOICE",
        sourceEntityId: input.invoiceId
      },
      select: { id: true }
    });
    financeEventId = invoiceEvent?.id ?? null;
  }

  if (!financeEventId) {
    const relatedInvoice = await tx.invoice.findFirst({
      where: {
        tenantId: input.tenantId,
        clientId: input.clientId,
        ...(input.projectId ? { projectId: input.projectId } : {}),
        status: { in: ["ISSUED", "PAID"] },
        isArchived: false
      },
      orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
      select: { id: true, totalCents: true, currency: true }
    });

    if (relatedInvoice) {
      const invoiceEvent = await tx.financeEvent.findFirst({
        where: {
          tenantId: input.tenantId,
          source: "INVOICE",
          sourceEntityId: relatedInvoice.id
        },
        select: { id: true }
      });
      financeEventId = invoiceEvent?.id ?? null;
    }
  }

  if (!financeEventId) {
    const created = await createRevenueEvent(tx, input.tenantId, {
      source: "DELIVERY",
      sourceEntityId: input.deliverableId,
      amountCents: input.amountCents ?? 0,
      currency: "USD",
      clientId: input.clientId,
      projectId: input.projectId,
      timestamp: input.publishedAt,
      metadata: {
        deliverableId: input.deliverableId,
        aiDeliveryProjectId: input.aiDeliveryProjectId,
        excluded: false,
        ...(input.metadata ?? {})
      }
    });
    financeEventId = created.id;
    await refreshSnapshotsForEventMonth(tx, input.tenantId, input.publishedAt);
  }

  const attribution = await tx.revenueAttribution.upsert({
    where: { financeEventId },
    create: {
      tenantId: input.tenantId,
      financeEventId,
      deliveryId: input.deliverableId,
      clientId: input.clientId,
      projectId: input.projectId,
      metadata: {
        aiDeliveryProjectId: input.aiDeliveryProjectId,
        invoiceId: input.invoiceId ?? null,
        ...(input.metadata ?? {})
      } as Prisma.InputJsonValue
    },
    update: {
      deliveryId: input.deliverableId,
      clientId: input.clientId,
      projectId: input.projectId,
      metadata: {
        aiDeliveryProjectId: input.aiDeliveryProjectId,
        invoiceId: input.invoiceId ?? null,
        ...(input.metadata ?? {})
      } as Prisma.InputJsonValue
    },
    select: { id: true }
  });

  return { financeEventId, attributionId: attribution.id };
}
