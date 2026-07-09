import type { AiBudgetLedgerStatus, Prisma } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AiModelRouteAudit, AiPlannedLedgerMetadata } from "@dca-os-v1/shared";
import { AI_ORCHESTRATOR_LITE_VERSION } from "@dca-os-v1/shared";
import { buildPeriodKey } from "./ai-budget-guard.service";
import { normalizeClientProfile, normalizeContentChannel } from "./ai-model-routing-policy.service";

export const AI_BUDGET_LEDGER_VERSION = "AI_BUDGET_LEDGER_V1";

const COUNTABLE_STATUSES: AiBudgetLedgerStatus[] = ["PREVIEW", "PLANNED", "COMPLETED"];

export function buildPlannedLedgerMetadata(input: {
  orchestratorTaskType: string;
  clientProfile?: string | null;
  contentChannel?: string | null;
  providerKey: string;
  estimatedCostUsd: number;
  canExecute: boolean;
  routingAudit: AiModelRouteAudit;
}): AiPlannedLedgerMetadata {
  return {
    ledgerVersion: AI_BUDGET_LEDGER_VERSION,
    taskType: input.orchestratorTaskType,
    routingTaskType: input.routingAudit.routingTaskType,
    gateway: input.routingAudit.gateway,
    model: input.routingAudit.primaryModel,
    maxCostUsdPerRun: input.routingAudit.maxCostUsdPerRun,
    policyVersion: input.routingAudit.policyVersion,
    clientProfile: normalizeClientProfile(input.clientProfile),
    contentChannel: normalizeContentChannel(input.contentChannel ?? "website"),
    provider: input.providerKey,
    estimatedCostUsd: input.estimatedCostUsd,
    requiresBudgetLedger: input.routingAudit.requiresBudgetLedger,
    liveProviderCalled: false,
    ledgerStatus: input.canExecute ? "PREVIEW" : "BLOCKED"
  };
}

export interface AiBudgetLedgerRecordInput {
  tenantId: string;
  clientId?: string | null;
  aiDeliveryProjectId?: string | null;
  workflowRunId?: string | null;
  periodKey?: string;
  provider: string;
  taskType?: string | null;
  agentRole?: string | null;
  estimatedCostUsd: number;
  actualCostUsd?: number | null;
  status: AiBudgetLedgerStatus;
  liveProviderCalled?: boolean;
  orchestratorVersion?: string | null;
  stepReference?: string | null;
  metadata?: Prisma.InputJsonValue;
}

export interface AiBudgetLedgerSummary {
  ledgerVersion: typeof AI_BUDGET_LEDGER_VERSION;
  periodKey: string;
  clientId: string | null;
  spentThisPeriodUsd: number;
  entryCount: number;
}

function getPrisma() {
  return createPrismaClient();
}

export async function sumSpentUsdForPeriod(input: {
  tenantId: string;
  clientId?: string | null;
  periodKey?: string;
}): Promise<number> {
  const prisma = getPrisma();
  const periodKey = input.periodKey ?? buildPeriodKey();

  const aggregate = await prisma.aiBudgetLedgerEntry.aggregate({
    where: {
      tenantId: input.tenantId,
      periodKey,
      clientId: input.clientId ?? undefined,
      status: { in: COUNTABLE_STATUSES },
      liveProviderCalled: false
    },
    _sum: { estimatedCostUsd: true }
  });

  return Number(aggregate._sum.estimatedCostUsd ?? 0);
}

export async function recordAiBudgetLedgerEntry(input: AiBudgetLedgerRecordInput): Promise<void> {
  const prisma = getPrisma();
  const periodKey = input.periodKey ?? buildPeriodKey();
  const stepReference = input.stepReference ?? null;
  const workflowRunId = input.workflowRunId ?? null;

  const data = {
    tenantId: input.tenantId,
    clientId: input.clientId ?? null,
    aiDeliveryProjectId: input.aiDeliveryProjectId ?? null,
    workflowRunId,
    periodKey,
    provider: input.provider,
    taskType: input.taskType ?? null,
    agentRole: input.agentRole ?? null,
    estimatedCostUsd: input.estimatedCostUsd,
    actualCostUsd: input.actualCostUsd ?? null,
    status: input.status,
    liveProviderCalled: input.liveProviderCalled ?? false,
    orchestratorVersion: input.orchestratorVersion ?? AI_ORCHESTRATOR_LITE_VERSION,
    stepReference,
    metadata: input.metadata ?? undefined
  };

  if (workflowRunId && stepReference) {
    await prisma.aiBudgetLedgerEntry.upsert({
      where: {
        tenantId_workflowRunId_stepReference: {
          tenantId: input.tenantId,
          workflowRunId,
          stepReference
        }
      },
      create: data,
      update: {
        estimatedCostUsd: data.estimatedCostUsd,
        actualCostUsd: data.actualCostUsd,
        status: data.status,
        provider: data.provider,
        taskType: data.taskType,
        agentRole: data.agentRole,
        metadata: data.metadata,
        updatedAt: new Date()
      }
    });
    return;
  }

  if (stepReference) {
    const existing = await prisma.aiBudgetLedgerEntry.findFirst({
      where: {
        tenantId: input.tenantId,
        clientId: input.clientId ?? null,
        periodKey,
        stepReference,
        workflowRunId: null
      }
    });

    if (existing) {
      await prisma.aiBudgetLedgerEntry.update({
        where: { id: existing.id },
        data: {
          estimatedCostUsd: data.estimatedCostUsd,
          actualCostUsd: data.actualCostUsd,
          status: data.status,
          provider: data.provider,
          taskType: data.taskType,
          agentRole: data.agentRole,
          metadata: data.metadata
        }
      });
      return;
    }
  }

  await prisma.aiBudgetLedgerEntry.create({ data });
}

export async function getAiBudgetLedgerSummary(input: {
  tenantId: string;
  clientId?: string | null;
  periodKey?: string;
}): Promise<AiBudgetLedgerSummary> {
  const periodKey = input.periodKey ?? buildPeriodKey();
  const spentThisPeriodUsd = await sumSpentUsdForPeriod({
    tenantId: input.tenantId,
    clientId: input.clientId,
    periodKey
  });

  const prisma = getPrisma();
  const entryCount = await prisma.aiBudgetLedgerEntry.count({
    where: {
      tenantId: input.tenantId,
      periodKey,
      clientId: input.clientId ?? undefined,
      status: { in: COUNTABLE_STATUSES }
    }
  });

  return {
    ledgerVersion: AI_BUDGET_LEDGER_VERSION,
    periodKey,
    clientId: input.clientId ?? null,
    spentThisPeriodUsd: Number(spentThisPeriodUsd.toFixed(4)),
    entryCount
  };
}
