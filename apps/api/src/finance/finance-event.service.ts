import type { Prisma } from "@prisma/client";
import type { CreateFinanceEventInput, FinanceEventSummary } from "./finance.types";

type PrismaTx = Prisma.TransactionClient;

function toMetadataRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function isFinanceEventExcluded(metadata: unknown): boolean {
  const record = toMetadataRecord(metadata);
  return record.excluded === true;
}

export function toFinanceEventSummary(event: {
  id: string;
  type: FinanceEventSummary["type"];
  source: FinanceEventSummary["source"];
  sourceEntityId: string | null;
  amountCents: number;
  currency: string;
  clientId: string | null;
  projectId: string | null;
  timestamp: Date;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): FinanceEventSummary {
  return {
    id: event.id,
    type: event.type,
    source: event.source,
    sourceEntityId: event.sourceEntityId,
    amount: event.amountCents,
    currency: event.currency,
    clientId: event.clientId,
    projectId: event.projectId,
    timestamp: event.timestamp.toISOString(),
    metadata: toMetadataRecord(event.metadata),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString()
  };
}

const financeEventSelect = {
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
} as const;

export async function createFinanceEvent(
  tx: PrismaTx,
  tenantId: string,
  input: CreateFinanceEventInput
): Promise<FinanceEventSummary> {
  const amountCents = Math.max(0, Math.round(input.amountCents));
  const sourceEntityId = input.sourceEntityId ?? null;

  if (sourceEntityId) {
    const existing = await tx.financeEvent.findFirst({
      where: {
        tenantId,
        source: input.source,
        sourceEntityId
      },
      select: financeEventSelect
    });
    if (existing) {
      const updated = await tx.financeEvent.update({
        where: { id: existing.id },
        data: {
          type: input.type,
          amountCents,
          currency: input.currency ?? "USD",
          clientId: input.clientId ?? null,
          projectId: input.projectId ?? null,
          timestamp: input.timestamp,
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue
        },
        select: financeEventSelect
      });
      return toFinanceEventSummary(updated);
    }
  }

  const created = await tx.financeEvent.create({
    data: {
      tenantId,
      type: input.type,
      source: input.source,
      sourceEntityId,
      amountCents,
      currency: input.currency ?? "USD",
      clientId: input.clientId ?? null,
      projectId: input.projectId ?? null,
      timestamp: input.timestamp,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue
    },
    select: financeEventSelect
  });
  return toFinanceEventSummary(created);
}

export async function createRevenueEvent(
  tx: PrismaTx,
  tenantId: string,
  input: Omit<CreateFinanceEventInput, "type">
): Promise<FinanceEventSummary> {
  return createFinanceEvent(tx, tenantId, { ...input, type: "REVENUE" });
}

export async function createCostEvent(
  tx: PrismaTx,
  tenantId: string,
  input: Omit<CreateFinanceEventInput, "type">
): Promise<FinanceEventSummary> {
  return createFinanceEvent(tx, tenantId, { ...input, type: "COST" });
}

export async function excludeFinanceEventBySource(
  tx: PrismaTx,
  tenantId: string,
  source: CreateFinanceEventInput["source"],
  sourceEntityId: string,
  reason: string
): Promise<void> {
  const existing = await tx.financeEvent.findFirst({
    where: { tenantId, source, sourceEntityId },
    select: { id: true, metadata: true }
  });
  if (!existing) {
    return;
  }
  const metadata = toMetadataRecord(existing.metadata);
  await tx.financeEvent.update({
    where: { id: existing.id },
    data: {
      metadata: { ...metadata, excluded: true, exclusionReason: reason } as Prisma.InputJsonValue
    }
  });
}
