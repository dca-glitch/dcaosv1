import type {
  AiBudgetLedgerStatus,
  Prisma
} from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type {
  AiCompletedLedgerMetadata,
  AiMockedProviderExecutionResult,
  AiModelRouteAudit,
  AiPlannedLedgerMetadata
} from "@dca-os-v1/shared";
import { AI_MODEL_ROUTING_POLICY_VERSION, AI_ORCHESTRATOR_LITE_VERSION } from "@dca-os-v1/shared";
import { PURIVA_AI_MONTHLY_CAP_USD, buildPeriodKey } from "./ai-budget-guard.service";
import { normalizeClientProfile, normalizeContentChannel, resolveModelRoute } from "./ai-model-routing-policy.service";

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

export interface PrepareCompletedLedgerAttributionInput {
  orchestratorTaskType: string;
  clientProfile?: string | null;
  contentChannel?: string | null;
  routingAudit?: AiModelRouteAudit | null;
  plannedLedgerMetadata?: AiPlannedLedgerMetadata | null;
  providerExecution: AiMockedProviderExecutionResult;
  estimatedCostUsd?: number | null;
  workflowRunId?: string | null;
}

export interface CompletedLedgerAttributionResult {
  ok: boolean;
  blockedReason: string | null;
  metadata: AiCompletedLedgerMetadata | null;
  ledgerStatus: AiBudgetLedgerStatus;
}

function refuseCompletedAttribution(
  reason: string,
  ledgerStatus: AiBudgetLedgerStatus = "BLOCKED"
): CompletedLedgerAttributionResult {
  return {
    ok: false,
    blockedReason: reason,
    metadata: null,
    ledgerStatus
  };
}

export function buildCompletedLedgerMetadata(input: {
  orchestratorTaskType: string;
  clientProfile?: string | null;
  contentChannel?: string | null;
  routingAudit: AiModelRouteAudit;
  providerExecution: AiMockedProviderExecutionResult;
  estimatedCostUsd: number;
  ledgerStatus: "COMPLETED" | "BLOCKED" | "SKIPPED";
  actualCostUsd: number | null;
  overCap: boolean;
  overCapReason: string | null;
  workflowRunId?: string | null;
}): AiCompletedLedgerMetadata {
  return {
    ledgerVersion: AI_BUDGET_LEDGER_VERSION,
    ledgerStatus: input.ledgerStatus,
    taskType: input.orchestratorTaskType,
    routingTaskType: input.routingAudit.routingTaskType,
    gateway: input.routingAudit.gateway,
    provider: input.providerExecution.providerKey,
    model: input.providerExecution.model,
    policyVersion: input.routingAudit.policyVersion,
    clientProfile: normalizeClientProfile(input.clientProfile),
    contentChannel: normalizeContentChannel(input.contentChannel ?? "website"),
    maxCostUsdPerRun: input.routingAudit.maxCostUsdPerRun,
    estimatedCostUsd: input.estimatedCostUsd,
    actualCostUsd: input.actualCostUsd,
    approximateInputTokens: input.providerExecution.approximateInputTokens ?? null,
    approximateOutputTokens:
      input.providerExecution.approximateOutputTokens ?? input.routingAudit.maxOutputTokens ?? null,
    liveProviderCalled: input.providerExecution.liveProviderCalled,
    safeError: input.providerExecution.safeError ?? null,
    overCap: input.overCap,
    overCapReason: input.overCapReason,
    workflowRunId: input.workflowRunId ?? null,
    runId: input.providerExecution.runId ?? null
  };
}

export function prepareCompletedLedgerAttribution(
  input: PrepareCompletedLedgerAttributionInput
): CompletedLedgerAttributionResult {
  const routingAudit =
    input.routingAudit ??
    (input.plannedLedgerMetadata
      ? resolveModelRoute({
          orchestratorTaskType: input.orchestratorTaskType,
          clientProfile: input.clientProfile,
          contentChannel: input.contentChannel ?? "website"
        }).audit
      : null);

  if (!routingAudit?.policyVersion) {
    return refuseCompletedAttribution(
      "Routing policy metadata is required for completed ledger attribution."
    );
  }

  if (routingAudit.policyVersion !== AI_MODEL_ROUTING_POLICY_VERSION) {
    return refuseCompletedAttribution("Unsupported routing policy version for completed attribution.");
  }

  if (typeof input.providerExecution.liveProviderCalled !== "boolean") {
    return refuseCompletedAttribution("liveProviderCalled must be explicit for completed attribution.");
  }

  if (routingAudit.blocked) {
    return refuseCompletedAttribution(
      routingAudit.blockedReason ?? "Route is blocked; completed attribution refused.",
      "BLOCKED"
    );
  }

  const estimatedCostUsd =
    input.estimatedCostUsd ??
    input.plannedLedgerMetadata?.estimatedCostUsd ??
    routingAudit.maxCostUsdPerRun;

  if (!(routingAudit.maxCostUsdPerRun >= 0)) {
    return refuseCompletedAttribution("Route maxCostUsdPerRun metadata is required.");
  }

  if (routingAudit.primaryModel && input.providerExecution.ok) {
    if (input.providerExecution.model !== routingAudit.primaryModel) {
      return refuseCompletedAttribution(
        "Provider model does not match backend routing policy model."
      );
    }
  }

  const safeError = input.providerExecution.safeError ?? null;
  let ledgerStatus: "COMPLETED" | "BLOCKED" | "SKIPPED" = "COMPLETED";
  let actualCostUsd: number | null = null;
  let overCap = false;
  let overCapReason: string | null = null;

  if (!input.providerExecution.ok || safeError) {
    ledgerStatus = safeError ? "BLOCKED" : "SKIPPED";
    return {
      ok: true,
      blockedReason: safeError,
      metadata: buildCompletedLedgerMetadata({
        orchestratorTaskType: input.orchestratorTaskType,
        clientProfile: input.clientProfile,
        contentChannel: input.contentChannel,
        routingAudit,
        providerExecution: input.providerExecution,
        estimatedCostUsd,
        ledgerStatus,
        actualCostUsd: null,
        overCap: false,
        overCapReason: null,
        workflowRunId: input.workflowRunId
      }),
      ledgerStatus
    };
  }

  if (input.providerExecution.actualCostUsd != null) {
    const rawActual = Number(input.providerExecution.actualCostUsd);
    // Trusted-source policy: non-finite / negative values are not actuals — leave null.
    if (Number.isFinite(rawActual) && rawActual >= 0) {
      if (
        routingAudit.maxCostUsdPerRun > 0 &&
        rawActual > routingAudit.maxCostUsdPerRun
      ) {
        overCap = true;
        overCapReason = `Actual cost $${rawActual} exceeds route cap $${routingAudit.maxCostUsdPerRun}.`;
        ledgerStatus = "BLOCKED";
      } else {
        actualCostUsd = rawActual;
      }
    }
  }

  if (overCap) {
    return {
      ok: true,
      blockedReason: overCapReason,
      metadata: buildCompletedLedgerMetadata({
        orchestratorTaskType: input.orchestratorTaskType,
        clientProfile: input.clientProfile,
        contentChannel: input.contentChannel,
        routingAudit,
        providerExecution: input.providerExecution,
        estimatedCostUsd,
        ledgerStatus,
        actualCostUsd: null,
        overCap,
        overCapReason,
        workflowRunId: input.workflowRunId
      }),
      ledgerStatus
    };
  }

  return {
    ok: true,
    blockedReason: null,
    metadata: buildCompletedLedgerMetadata({
      orchestratorTaskType: input.orchestratorTaskType,
      clientProfile: input.clientProfile,
      contentChannel: input.contentChannel,
      routingAudit,
      providerExecution: input.providerExecution,
      estimatedCostUsd,
      ledgerStatus: "COMPLETED",
      actualCostUsd,
      overCap: false,
      overCapReason: null,
      workflowRunId: input.workflowRunId
    }),
    ledgerStatus: "COMPLETED"
  };
}

export function isCompletedAttributionCompatibleWithMonthlyCap(
  metadata: AiCompletedLedgerMetadata,
  monthlyCapUsd = PURIVA_AI_MONTHLY_CAP_USD
): boolean {
  const spend = metadata.actualCostUsd ?? metadata.estimatedCostUsd;
  return metadata.maxCostUsdPerRun < monthlyCapUsd && spend <= monthlyCapUsd;
}

export async function recordCompletedAiLedgerEntry(input: {
  tenantId: string;
  clientId?: string | null;
  aiDeliveryProjectId?: string | null;
  workflowRunId?: string | null;
  stepReference?: string | null;
  agentRole?: string | null;
  attribution: CompletedLedgerAttributionResult;
}): Promise<{ recorded: boolean; reason: string | null }> {
  if (!input.attribution.ok || !input.attribution.metadata) {
    return {
      recorded: false,
      reason: input.attribution.blockedReason ?? "Completed attribution not ready for recording."
    };
  }

  const metadata = input.attribution.metadata;
  await recordAiBudgetLedgerEntry({
    tenantId: input.tenantId,
    clientId: input.clientId,
    aiDeliveryProjectId: input.aiDeliveryProjectId,
    workflowRunId: input.workflowRunId ?? metadata.workflowRunId,
    provider: metadata.provider,
    taskType: metadata.taskType,
    agentRole: input.agentRole ?? null,
    estimatedCostUsd: metadata.estimatedCostUsd,
    actualCostUsd: metadata.actualCostUsd,
    status: input.attribution.ledgerStatus,
    liveProviderCalled: metadata.liveProviderCalled,
    stepReference: input.stepReference ?? null,
    metadata: {
      completedAttribution: {
        ledgerStatus: metadata.ledgerStatus,
        routingTaskType: metadata.routingTaskType,
        gateway: metadata.gateway,
        model: metadata.model,
        policyVersion: metadata.policyVersion,
        clientProfile: metadata.clientProfile,
        contentChannel: metadata.contentChannel,
        maxCostUsdPerRun: metadata.maxCostUsdPerRun,
        approximateInputTokens: metadata.approximateInputTokens,
        approximateOutputTokens: metadata.approximateOutputTokens,
        liveProviderCalled: metadata.liveProviderCalled,
        safeError: metadata.safeError,
        overCap: metadata.overCap,
        overCapReason: metadata.overCapReason,
        runId: metadata.runId
      }
    }
  });

  return { recorded: true, reason: null };
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

export interface AiBudgetLedgerSpendRow {
  estimatedCostUsd: Prisma.Decimal | number | string;
  actualCostUsd?: Prisma.Decimal | number | string | null;
}

function getPrisma() {
  return createPrismaClient();
}

function ledgerCostToNumber(value: AiBudgetLedgerSpendRow["estimatedCostUsd"]): number {
  return Number(value.toString());
}

export function sumAiBudgetLedgerRowsSpentUsd(rows: readonly AiBudgetLedgerSpendRow[]): number {
  return rows.reduce((total, row) => {
    const spend = row.actualCostUsd ?? row.estimatedCostUsd;
    return total + ledgerCostToNumber(spend);
  }, 0);
}

export async function sumSpentUsdForPeriod(input: {
  tenantId: string;
  clientId?: string | null;
  periodKey?: string;
}): Promise<number> {
  const prisma = getPrisma();
  const periodKey = input.periodKey ?? buildPeriodKey();

  const rows = await prisma.aiBudgetLedgerEntry.findMany({
    where: {
      tenantId: input.tenantId,
      periodKey,
      clientId: input.clientId ?? undefined,
      status: { in: COUNTABLE_STATUSES }
    },
    select: {
      estimatedCostUsd: true,
      actualCostUsd: true
    }
  });

  return sumAiBudgetLedgerRowsSpentUsd(rows);
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
