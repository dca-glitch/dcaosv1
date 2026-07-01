/**
 * Workflow brief runtime — new brief-centered initiation layer.
 *
 * Distinct from:
 * - ClientMonthlyBrief (/briefs) — legacy monthly client brief submissions
 * - AiDeliveryBrief — legacy 1:1 project brief inside AI Delivery projects
 * - ProductionPlan — new foundation object here; not a replacement for AiDeliveryBrief
 */
import type {
  Prisma,
  ProductionPlanStatus,
  WorkflowBriefCreatedByRole,
  WorkflowBriefSource,
  WorkflowBriefStatus
} from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuthResolvedSessionContext } from "../auth/types";
import {
  buildWorkflowBriefSeedContentPlanItems,
  isWorkflowBriefSeedItemForBrief,
  WORKFLOW_BRIEF_CONTENT_SEED_VERSION,
  WORKFLOW_BRIEF_SEED_MARKER
} from "./workflow-brief-content-seed.execution";
import {
  buildProductionPlanBodyFromContent,
  buildProductionPlanTitle,
  buildWorkflowBriefClientVisiblePlanJson,
  buildWorkflowBriefPlanJson,
  executeWorkflowBriefPlanGeneration
} from "./workflow-brief-plan.execution";
import {
  buildWorkflowBriefMiReportJson,
  buildWorkflowBriefSeoReportJson,
  executeWorkflowBriefAiRun
} from "./workflow-brief-ai.execution";
import type {
  WorkflowBriefMiReportContent,
  WorkflowBriefSeoReportContent
} from "./workflow-brief-ai.execution";

const prisma = createPrismaClient();

function getActiveTenantId(authSession: AuthResolvedSessionContext): string | null {
  return authSession.tenantContext.activeMembership?.tenantId ?? null;
}

function getActiveRoles(authSession: AuthResolvedSessionContext): string[] {
  return authSession.tenantContext.activeMembership?.roles ?? [];
}

function isOwnerRole(roles: string[]): boolean {
  return roles.includes("owner") || roles.includes("admin");
}

function isClientRole(roles: string[]): boolean {
  return roles.includes("client") && !isOwnerRole(roles);
}

async function resolveAllowedClientIds(
  authSession: AuthResolvedSessionContext,
  tenantId: string
): Promise<string[] | "all"> {
  const roles = getActiveRoles(authSession);
  if (isOwnerRole(roles)) {
    return "all";
  }

  const accessEntries = await prisma.clientUserAccess.findMany({
    where: { tenantId, userId: authSession.user.id, isArchived: false },
    select: { clientId: true }
  });
  return accessEntries.map((entry) => entry.clientId);
}

async function canAccessClient(
  authSession: AuthResolvedSessionContext,
  tenantId: string,
  clientId: string
): Promise<boolean> {
  const allowed = await resolveAllowedClientIds(authSession, tenantId);
  if (allowed === "all") {
    return true;
  }
  return allowed.includes(clientId);
}

async function getBriefForAccess(
  briefId: string,
  tenantId: string
): Promise<{ id: string; clientId: string; status: WorkflowBriefStatus } | null> {
  return prisma.brief.findFirst({
    where: { id: briefId, tenantId },
    select: { id: true, clientId: true, status: true }
  });
}

const productionPlanSelect = {
  id: true,
  briefId: true,
  aiDeliveryProjectId: true,
  title: true,
  body: true,
  planJson: true,
  clientVisibleSnapshotJson: true,
  status: true,
  sentToClientAt: true,
  approvedByClientAt: true,
  createdAt: true,
  updatedAt: true
} as const;

function sanitizeBriefDetailForRole(brief: Record<string, unknown>, isAdmin: boolean): Record<string, unknown> {
  if (isAdmin) {
    return brief;
  }

  const productionPlans = Array.isArray(brief.productionPlans) ? brief.productionPlans : [];
  const visiblePlans = productionPlans
    .filter((plan) => {
      if (!plan || typeof plan !== "object") {
        return false;
      }
      const status = (plan as { status?: string }).status;
      return status && status !== "DRAFT" && status !== "ARCHIVED";
    })
    .map((plan) => {
      const record = plan as Record<string, unknown>;
      return {
        id: record.id,
        title: record.title,
        body: record.body,
        clientVisibleSnapshotJson: record.clientVisibleSnapshotJson,
        status: record.status,
        sentToClientAt: record.sentToClientAt,
        approvedByClientAt: record.approvedByClientAt,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      };
    });

  return {
    ...brief,
    productionPlans: visiblePlans,
    sourceProjects: []
  };
}

function parseReportJsonContent(reportJson: unknown, fields: string[]): Record<string, unknown> {
  if (!reportJson || typeof reportJson !== "object" || Array.isArray(reportJson)) {
    return {};
  }
  const record = reportJson as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const field of fields) {
    output[field] = record[field];
  }
  return output;
}

function readMiReportContent(reportJson: unknown): WorkflowBriefMiReportContent {
  const parsed = parseReportJsonContent(reportJson, [
    "summary",
    "audienceInsights",
    "competitorInsights",
    "marketSignals",
    "opportunities",
    "risks",
    "recommendedActions"
  ]);

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "No MI summary available",
    audienceInsights: Array.isArray(parsed.audienceInsights)
      ? parsed.audienceInsights.filter((entry): entry is string => typeof entry === "string")
      : [],
    competitorInsights: Array.isArray(parsed.competitorInsights)
      ? parsed.competitorInsights.filter((entry): entry is string => typeof entry === "string")
      : [],
    marketSignals: Array.isArray(parsed.marketSignals)
      ? parsed.marketSignals.filter((entry): entry is string => typeof entry === "string")
      : [],
    opportunities: Array.isArray(parsed.opportunities)
      ? parsed.opportunities.filter((entry): entry is string => typeof entry === "string")
      : [],
    risks: Array.isArray(parsed.risks)
      ? parsed.risks.filter((entry): entry is string => typeof entry === "string")
      : [],
    recommendedActions: Array.isArray(parsed.recommendedActions)
      ? parsed.recommendedActions.filter((entry): entry is string => typeof entry === "string")
      : []
  };
}

function readSeoReportContent(reportJson: unknown): WorkflowBriefSeoReportContent {
  const parsed = parseReportJsonContent(reportJson, [
    "keywordClusters",
    "topicIdeas",
    "contentAngles",
    "internalLinkIdeas",
    "seoNotes"
  ]);

  return {
    keywordClusters: Array.isArray(parsed.keywordClusters)
      ? parsed.keywordClusters.filter((entry): entry is string => typeof entry === "string")
      : [],
    topicIdeas: Array.isArray(parsed.topicIdeas)
      ? parsed.topicIdeas.filter((entry): entry is string => typeof entry === "string")
      : [],
    contentAngles: Array.isArray(parsed.contentAngles)
      ? parsed.contentAngles.filter((entry): entry is string => typeof entry === "string")
      : [],
    internalLinkIdeas: Array.isArray(parsed.internalLinkIdeas)
      ? parsed.internalLinkIdeas.filter((entry): entry is string => typeof entry === "string")
      : [],
    seoNotes: Array.isArray(parsed.seoNotes)
      ? parsed.seoNotes.filter((entry): entry is string => typeof entry === "string")
      : []
  };
}

function defaultTargetMonthIso(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const monthStr = month < 10 ? `0${month}` : String(month);
  return `${year}-${monthStr}`;
}

function parseTargetMonth(value: string): Date | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return Number.isNaN(date.getTime()) ? null : date;
}

function canAdminEditProductionPlanStatus(status: ProductionPlanStatus): boolean {
  return status === "DRAFT" || status === "CHANGES_REQUESTED";
}

function sanitizeProductionPlanForClient(plan: {
  id: string;
  briefId: string;
  aiDeliveryProjectId: string | null;
  title: string;
  body: string | null;
  planJson: unknown;
  clientVisibleSnapshotJson: unknown;
  status: ProductionPlanStatus;
  sentToClientAt: Date | null;
  approvedByClientAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: plan.id,
    briefId: plan.briefId,
    title: plan.title,
    body: plan.body,
    clientVisibleSnapshotJson: plan.clientVisibleSnapshotJson,
    status: plan.status,
    sentToClientAt: plan.sentToClientAt,
    approvedByClientAt: plan.approvedByClientAt,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt
  };
}

const briefListSelect = {
  id: true,
  tenantId: true,
  clientId: true,
  source: true,
  createdByUserId: true,
  createdByRole: true,
  title: true,
  goal: true,
  status: true,
  adminReviewedAt: true,
  aiRequestedAt: true,
  approvedForProductionAt: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, name: true } }
} as const;

const briefDetailInclude = {
  client: { select: { id: true, name: true } },
  createdByUser: { select: { id: true, name: true, email: true } },
  adminReviewedByUser: { select: { id: true, name: true, email: true } },
  aiBriefRuns: {
    orderBy: { createdAt: "desc" as const },
    take: 5,
    select: {
      id: true,
      status: true,
      startedAt: true,
      completedAt: true,
      errorMessage: true,
      createdAt: true
    }
  },
  miReports: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      status: true,
      summaryText: true,
      reportJson: true,
      createdAt: true,
      updatedAt: true
    }
  },
  seoReports: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      status: true,
      summaryText: true,
      reportJson: true,
      createdAt: true,
      updatedAt: true
    }
  },
  productionPlans: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      title: true,
      body: true,
      planJson: true,
      clientVisibleSnapshotJson: true,
      status: true,
      sentToClientAt: true,
      approvedByClientAt: true,
      aiDeliveryProjectId: true,
      createdAt: true,
      updatedAt: true
    }
  },
  sourceProjects: {
    where: { isArchived: false },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      name: true,
      targetMonth: true,
      isArchived: true,
      createdAt: true
    }
  }
} as const;

export type WorkflowBriefCreateInput = {
  clientId: string;
  title: string;
  goal?: string | null;
  businessContext?: string | null;
  targetAudience?: string | null;
  offerContext?: string | null;
  locationContext?: string | null;
  notes?: string | null;
  structuredInputJson?: Prisma.InputJsonValue | null;
};

export type WorkflowBriefUpdateInput = Partial<WorkflowBriefCreateInput>;

export async function listWorkflowBriefs(
  authSession: AuthResolvedSessionContext,
  clientIdFilter?: string
): Promise<{ briefs: unknown[] } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const allowed = await resolveAllowedClientIds(authSession, tenantId);
  if (allowed !== "all" && allowed.length === 0) {
    return { briefs: [] };
  }

  const where: Prisma.BriefWhereInput = { tenantId };
  if (clientIdFilter) {
    if (!(await canAccessClient(authSession, tenantId, clientIdFilter))) {
      return null;
    }
    where.clientId = clientIdFilter;
  } else if (allowed !== "all") {
    where.clientId = { in: allowed };
  }

  const briefs = await prisma.brief.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: briefListSelect
  });

  return { briefs };
}

export async function getWorkflowBriefById(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<{ brief: unknown } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const brief = await prisma.brief.findFirst({
    where: { id: briefId, tenantId },
    include: briefDetailInclude
  });
  if (!brief) {
    return null;
  }

  if (!(await canAccessClient(authSession, tenantId, brief.clientId))) {
    return null;
  }

  const roles = getActiveRoles(authSession);
  const isAdmin = isOwnerRole(roles);

  return { brief: sanitizeBriefDetailForRole(brief as Record<string, unknown>, isAdmin) };
}

export async function createWorkflowBrief(
  authSession: AuthResolvedSessionContext,
  input: WorkflowBriefCreateInput
): Promise<{ brief: unknown } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const roles = getActiveRoles(authSession);
  const isAdmin = isOwnerRole(roles);
  const isClient = isClientRole(roles);
  if (!isAdmin && !isClient) {
    return null;
  }

  if (!(await canAccessClient(authSession, tenantId, input.clientId))) {
    return null;
  }

  const client = await prisma.client.findFirst({
    where: { id: input.clientId, tenantId },
    select: { id: true }
  });
  if (!client) {
    return null;
  }

  const createdByRole: WorkflowBriefCreatedByRole = isAdmin ? "ADMIN" : "CLIENT";
  const source: WorkflowBriefSource = isAdmin ? "ADMIN_PANEL" : "CLIENT_PORTAL";

  const brief = await prisma.brief.create({
    data: {
      tenantId,
      clientId: input.clientId,
      source,
      createdByUserId: authSession.user.id,
      createdByRole,
      title: input.title.trim(),
      goal: input.goal?.trim() || null,
      businessContext: input.businessContext?.trim() || null,
      targetAudience: input.targetAudience?.trim() || null,
      offerContext: input.offerContext?.trim() || null,
      locationContext: input.locationContext?.trim() || null,
      notes: input.notes?.trim() || null,
      structuredInputJson: input.structuredInputJson ?? undefined,
      status: "DRAFT"
    },
    include: briefDetailInclude
  });

  return { brief };
}

export async function updateWorkflowBrief(
  authSession: AuthResolvedSessionContext,
  briefId: string,
  input: WorkflowBriefUpdateInput
): Promise<{ brief: unknown } | "not_found" | "forbidden" | "locked"> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  const existing = await getBriefForAccess(briefId, tenantId);
  if (!existing) {
    return "not_found";
  }

  if (!(await canAccessClient(authSession, tenantId, existing.clientId))) {
    return "forbidden";
  }

  const roles = getActiveRoles(authSession);
  const lockedStatuses: WorkflowBriefStatus[] = ["ARCHIVED", "AI_RUNNING", "APPROVED_FOR_PRODUCTION"];
  if (lockedStatuses.includes(existing.status)) {
    return "locked";
  }

  if (isClientRole(roles) && existing.status !== "DRAFT" && existing.status !== "SUBMITTED") {
    return "locked";
  }

  const data: Prisma.BriefUpdateInput = {};
  if (typeof input.title === "string") {
    data.title = input.title.trim();
  }
  if (input.goal !== undefined) {
    data.goal = input.goal?.trim() || null;
  }
  if (input.businessContext !== undefined) {
    data.businessContext = input.businessContext?.trim() || null;
  }
  if (input.targetAudience !== undefined) {
    data.targetAudience = input.targetAudience?.trim() || null;
  }
  if (input.offerContext !== undefined) {
    data.offerContext = input.offerContext?.trim() || null;
  }
  if (input.locationContext !== undefined) {
    data.locationContext = input.locationContext?.trim() || null;
  }
  if (input.notes !== undefined) {
    data.notes = input.notes?.trim() || null;
  }
  if (input.structuredInputJson !== undefined) {
    data.structuredInputJson = input.structuredInputJson ?? undefined;
  }

  const brief = await prisma.brief.update({
    where: { id: briefId },
    data,
    include: briefDetailInclude
  });

  return { brief };
}

export async function submitWorkflowBrief(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<{ brief: unknown } | "not_found" | "forbidden" | "invalid_status"> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  const existing = await prisma.brief.findFirst({
    where: { id: briefId, tenantId },
    select: { id: true, clientId: true, status: true }
  });
  if (!existing) {
    return "not_found";
  }

  if (!(await canAccessClient(authSession, tenantId, existing.clientId))) {
    return "forbidden";
  }

  const roles = getActiveRoles(authSession);
  const isAdmin = isOwnerRole(roles);

  let nextStatus: WorkflowBriefStatus;
  if (isAdmin) {
    if (!["DRAFT", "IN_REVIEW", "SUBMITTED"].includes(existing.status)) {
      return "invalid_status";
    }
    nextStatus = "READY_FOR_AI";
  } else {
    if (existing.status !== "DRAFT") {
      return "invalid_status";
    }
    nextStatus = "SUBMITTED";
  }

  const brief = await prisma.brief.update({
    where: { id: briefId },
    data: {
      status: nextStatus,
      ...(isAdmin
        ? {
            adminReviewedAt: new Date(),
            adminReviewedByUserId: authSession.user.id
          }
        : {})
    },
    include: briefDetailInclude
  });

  await prisma.briefApproval.create({
    data: {
      tenantId,
      briefId,
      actorUserId: authSession.user.id,
      actorRole: isAdmin ? "ADMIN" : "CLIENT",
      decisionType: "SUBMIT",
      targetType: "BRIEF"
    }
  });

  return { brief };
}

export async function archiveWorkflowBrief(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<{ brief: unknown } | "not_found" | "forbidden"> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  if (!isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const existing = await getBriefForAccess(briefId, tenantId);
  if (!existing) {
    return "not_found";
  }

  const brief = await prisma.brief.update({
    where: { id: briefId },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date()
    },
    include: briefDetailInclude
  });

  await prisma.briefApproval.create({
    data: {
      tenantId,
      briefId,
      actorUserId: authSession.user.id,
      actorRole: "ADMIN",
      decisionType: "ARCHIVE",
      targetType: "BRIEF"
    }
  });

  return { brief };
}

export async function triggerWorkflowBriefAiRun(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<
  | { run: unknown; miReport: unknown; seoReport: unknown; brief: unknown }
  | "not_found"
  | "forbidden"
  | "invalid_status"
> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  if (!isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const brief = await prisma.brief.findFirst({
    where: { id: briefId, tenantId },
    select: {
      id: true,
      clientId: true,
      status: true,
      title: true,
      goal: true,
      targetAudience: true,
      businessContext: true,
      offerContext: true,
      locationContext: true,
      notes: true,
      structuredInputJson: true
    }
  });
  if (!brief) {
    return "not_found";
  }

  const runnableStatuses: WorkflowBriefStatus[] = ["READY_FOR_AI", "AI_RESULTS_READY", "IN_REVIEW", "SUBMITTED"];
  if (!runnableStatuses.includes(brief.status)) {
    return "invalid_status";
  }

  const inputSnapshot = {
    briefId: brief.id,
    title: brief.title,
    goal: brief.goal,
    targetAudience: brief.targetAudience,
    businessContext: brief.businessContext,
    offerContext: brief.offerContext,
    locationContext: brief.locationContext,
    notes: brief.notes,
    structuredInputJson: brief.structuredInputJson
  };

  const startedAt = new Date();

  const runRecord = await prisma.$transaction(async (tx) => {
    await tx.brief.update({
      where: { id: briefId },
      data: {
        status: "AI_RUNNING",
        aiRequestedAt: startedAt
      }
    });

    return tx.aiBriefRun.create({
      data: {
        tenantId,
        briefId,
        triggeredByUserId: authSession.user.id,
        status: "RUNNING",
        startedAt,
        inputSnapshotJson: inputSnapshot
      }
    });
  });

  const finishedAtIso = new Date().toISOString();
  const executionResult = await executeWorkflowBriefAiRun({
    briefId: brief.id,
    title: brief.title,
    goal: brief.goal,
    businessContext: brief.businessContext,
    targetAudience: brief.targetAudience,
    offerContext: brief.offerContext,
    locationContext: brief.locationContext,
    notes: brief.notes,
    structuredInputJson: brief.structuredInputJson,
    finishedAtIso
  });

  const resultSnapshot = {
    gateway: executionResult.meta.gateway,
    model: executionResult.meta.model,
    generatedAt: executionResult.meta.generatedAt,
    liveProviderCalled: executionResult.meta.liveProviderCalled,
    isDeterministic: executionResult.meta.isDeterministic,
    safeError: executionResult.meta.safeError
  };

  if (!executionResult.ok) {
    const failed = await prisma.$transaction(async (tx) => {
      const completedRun = await tx.aiBriefRun.update({
        where: { id: runRecord.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          errorMessage: executionResult.errorMessage,
          inputSnapshotJson: {
            ...inputSnapshot,
            resultSnapshot,
            executionLogPreview: executionResult.executionLog.slice(-6)
          }
        }
      });

      const updatedBrief = await tx.brief.update({
        where: { id: briefId },
        data: { status: "READY_FOR_AI" },
        include: briefDetailInclude
      });

      return { run: completedRun, brief: updatedBrief };
    });

    return {
      run: failed.run,
      miReport: null,
      seoReport: null,
      brief: failed.brief
    };
  }

  const miReportJson = buildWorkflowBriefMiReportJson(executionResult.mi, executionResult.meta);
  const seoReportJson = buildWorkflowBriefSeoReportJson(executionResult.seo, executionResult.meta);

  const result = await prisma.$transaction(async (tx) => {
    const completedRun = await tx.aiBriefRun.update({
      where: { id: runRecord.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        inputSnapshotJson: {
          ...inputSnapshot,
          resultSnapshot,
          executionLogPreview: executionResult.executionLog.slice(-8)
        }
      }
    });

    const miReport = await tx.aiMiReport.create({
      data: {
        tenantId,
        briefId,
        aiBriefRunId: runRecord.id,
        status: "READY",
        summaryText: executionResult.mi.summary,
        reportJson: miReportJson as Prisma.InputJsonValue
      }
    });

    const seoReport = await tx.aiSeoReport.create({
      data: {
        tenantId,
        briefId,
        aiBriefRunId: runRecord.id,
        status: "READY",
        summaryText: executionResult.seo.topicIdeas[0]
          ? `SEO topics: ${executionResult.seo.topicIdeas.slice(0, 2).join("; ")}`
          : `SEO analysis for: ${brief.title}`,
        reportJson: seoReportJson as Prisma.InputJsonValue
      }
    });

    const updatedBrief = await tx.brief.update({
      where: { id: briefId },
      data: { status: "AI_RESULTS_READY" },
      include: briefDetailInclude
    });

    return { run: completedRun, miReport, seoReport, brief: updatedBrief };
  });

  return result;
}

export async function getWorkflowBriefMiReport(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<{ report: unknown } | "not_found" | "forbidden"> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  const brief = await getBriefForAccess(briefId, tenantId);
  if (!brief) {
    return "not_found";
  }

  if (!(await canAccessClient(authSession, tenantId, brief.clientId))) {
    return "forbidden";
  }

  const report = await prisma.aiMiReport.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      summaryText: true,
      reportJson: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!report) {
    return "not_found";
  }

  return { report };
}

export async function getWorkflowBriefSeoReport(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<{ report: unknown } | "not_found" | "forbidden"> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  const brief = await getBriefForAccess(briefId, tenantId);
  if (!brief) {
    return "not_found";
  }

  if (!(await canAccessClient(authSession, tenantId, brief.clientId))) {
    return "forbidden";
  }

  const report = await prisma.aiSeoReport.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      summaryText: true,
      reportJson: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!report) {
    return "not_found";
  }

  return { report };
}

export type ProductionPlanInput = {
  title: string;
  body?: string | null;
  planJson?: Prisma.InputJsonValue | null;
  clientVisibleSnapshotJson?: Prisma.InputJsonValue | null;
  aiDeliveryProjectId?: string | null;
};

export async function upsertWorkflowBriefProductionPlan(
  authSession: AuthResolvedSessionContext,
  briefId: string,
  input: ProductionPlanInput
): Promise<{ plan: unknown } | "not_found" | "forbidden" | "locked"> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  if (!isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const brief = await getBriefForAccess(briefId, tenantId);
  if (!brief) {
    return "not_found";
  }

  const existing = await prisma.productionPlan.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true }
  });

  if (existing && !canAdminEditProductionPlanStatus(existing.status)) {
    return "locked";
  }

  const data = {
    title: input.title.trim(),
    body: input.body?.trim() || null,
    planJson: input.planJson ?? undefined,
    clientVisibleSnapshotJson: input.clientVisibleSnapshotJson ?? undefined,
    aiDeliveryProjectId: input.aiDeliveryProjectId ?? undefined,
    ...(existing?.status === "CHANGES_REQUESTED" ? { status: "DRAFT" as ProductionPlanStatus } : {})
  };

  const plan = existing
    ? await prisma.productionPlan.update({
        where: { id: existing.id },
        data,
        select: productionPlanSelect
      })
    : await prisma.productionPlan.create({
        data: {
          tenantId,
          briefId,
          ...data,
          status: "DRAFT"
        },
        select: productionPlanSelect
      });

  return { plan };
}

export async function getWorkflowBriefProductionPlan(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<{ plan: unknown } | "not_found" | "forbidden"> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  const brief = await getBriefForAccess(briefId, tenantId);
  if (!brief) {
    return "not_found";
  }

  if (!(await canAccessClient(authSession, tenantId, brief.clientId))) {
    return "forbidden";
  }

  const roles = getActiveRoles(authSession);
  const isAdmin = isOwnerRole(roles);

  const plan = await prisma.productionPlan.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: productionPlanSelect
  });

  if (!plan) {
    return "not_found";
  }

  if (!isAdmin && plan.status === "DRAFT") {
    return "forbidden";
  }

  if (!isAdmin) {
    return { plan: sanitizeProductionPlanForClient(plan) };
  }

  return { plan };
}

export async function generateWorkflowBriefProductionPlan(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<{ plan: unknown } | "not_found" | "forbidden" | "missing_reports" | "locked"> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  if (!isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const brief = await prisma.brief.findFirst({
    where: { id: briefId, tenantId },
    select: {
      id: true,
      clientId: true,
      status: true,
      title: true,
      goal: true,
      businessContext: true,
      targetAudience: true,
      offerContext: true,
      locationContext: true,
      notes: true
    }
  });
  if (!brief) {
    return "not_found";
  }

  const miReport = await prisma.aiMiReport.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: { reportJson: true }
  });
  const seoReport = await prisma.aiSeoReport.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: { reportJson: true }
  });

  if (!miReport || !seoReport) {
    return "missing_reports";
  }

  const existingPlan = await prisma.productionPlan.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true }
  });

  if (existingPlan && !canAdminEditProductionPlanStatus(existingPlan.status)) {
    return "locked";
  }

  const finishedAtIso = new Date().toISOString();
  const executionResult = await executeWorkflowBriefPlanGeneration({
    briefId: brief.id,
    title: brief.title,
    goal: brief.goal,
    businessContext: brief.businessContext,
    targetAudience: brief.targetAudience,
    offerContext: brief.offerContext,
    locationContext: brief.locationContext,
    notes: brief.notes,
    mi: readMiReportContent(miReport.reportJson),
    seo: readSeoReportContent(seoReport.reportJson),
    finishedAtIso
  });

  if (!executionResult.ok) {
    return "forbidden";
  }

  const planJson = buildWorkflowBriefPlanJson(executionResult.plan, executionResult.meta);
  const clientVisibleSnapshotJson = buildWorkflowBriefClientVisiblePlanJson(
    executionResult.clientSnapshot,
    executionResult.meta
  );
  const title = buildProductionPlanTitle(brief.title);
  const body = buildProductionPlanBodyFromContent(executionResult.plan);

  const plan = existingPlan
    ? await prisma.productionPlan.update({
        where: { id: existingPlan.id },
        data: {
          title,
          body,
          planJson: planJson as Prisma.InputJsonValue,
          clientVisibleSnapshotJson: clientVisibleSnapshotJson as Prisma.InputJsonValue,
          status: "DRAFT"
        },
        select: productionPlanSelect
      })
    : await prisma.productionPlan.create({
        data: {
          tenantId,
          briefId,
          title,
          body,
          planJson: planJson as Prisma.InputJsonValue,
          clientVisibleSnapshotJson: clientVisibleSnapshotJson as Prisma.InputJsonValue,
          status: "DRAFT"
        },
        select: productionPlanSelect
      });

  return { plan };
}

export async function sendWorkflowBriefProductionPlanToClient(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<{ plan: unknown } | "not_found" | "forbidden" | "invalid_status"> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  if (!isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const brief = await getBriefForAccess(briefId, tenantId);
  if (!brief) {
    return "not_found";
  }

  const existing = await prisma.productionPlan.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true }
  });
  if (!existing) {
    return "not_found";
  }

  if (!["DRAFT", "CHANGES_REQUESTED"].includes(existing.status)) {
    return "invalid_status";
  }

  const sentAt = new Date();
  const plan = await prisma.productionPlan.update({
    where: { id: existing.id },
    data: {
      status: "SENT_TO_CLIENT",
      sentToClientAt: sentAt
    },
    select: productionPlanSelect
  });

  return { plan };
}

export async function clientApproveWorkflowBriefProductionPlan(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<{ plan: unknown; brief: unknown } | "not_found" | "forbidden" | "invalid_status"> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  const roles = getActiveRoles(authSession);
  if (!isClientRole(roles) && !isOwnerRole(roles)) {
    return "forbidden";
  }

  const briefRecord = await prisma.brief.findFirst({
    where: { id: briefId, tenantId },
    select: { id: true, clientId: true }
  });
  if (!briefRecord) {
    return "not_found";
  }

  if (!(await canAccessClient(authSession, tenantId, briefRecord.clientId))) {
    return "forbidden";
  }

  if (isClientRole(roles) && !isOwnerRole(roles)) {
    // Client-only path enforced below; admins can also approve for testing/support.
  }

  const existing = await prisma.productionPlan.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true }
  });
  if (!existing) {
    return "not_found";
  }

  if (existing.status !== "SENT_TO_CLIENT") {
    return "invalid_status";
  }

  const approvedAt = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const plan = await tx.productionPlan.update({
      where: { id: existing.id },
      data: {
        status: "APPROVED",
        approvedByClientAt: approvedAt
      },
      select: productionPlanSelect
    });

    const brief = await tx.brief.update({
      where: { id: briefId },
      data: {
        status: "APPROVED_FOR_PRODUCTION",
        approvedForProductionAt: approvedAt
      },
      include: briefDetailInclude
    });

    await tx.briefApproval.create({
      data: {
        tenantId,
        briefId,
        actorUserId: authSession.user.id,
        actorRole: isOwnerRole(roles) ? "ADMIN" : "CLIENT",
        decisionType: "APPROVE",
        targetType: "PRODUCTION_PLAN"
      }
    });

    return { plan, brief };
  });

  const isAdmin = isOwnerRole(roles);
  return {
    plan: isAdmin ? result.plan : sanitizeProductionPlanForClient(result.plan),
    brief: sanitizeBriefDetailForRole(result.brief as Record<string, unknown>, isAdmin)
  };
}

export async function clientRejectWorkflowBriefProductionPlan(
  authSession: AuthResolvedSessionContext,
  briefId: string,
  comment?: string | null
): Promise<{ plan: unknown } | "not_found" | "forbidden" | "invalid_status"> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  const roles = getActiveRoles(authSession);
  if (!isClientRole(roles) && !isOwnerRole(roles)) {
    return "forbidden";
  }

  const briefRecord = await prisma.brief.findFirst({
    where: { id: briefId, tenantId },
    select: { id: true, clientId: true }
  });
  if (!briefRecord) {
    return "not_found";
  }

  if (!(await canAccessClient(authSession, tenantId, briefRecord.clientId))) {
    return "forbidden";
  }

  const existing = await prisma.productionPlan.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true }
  });
  if (!existing) {
    return "not_found";
  }

  if (existing.status !== "SENT_TO_CLIENT") {
    return "invalid_status";
  }

  const plan = await prisma.productionPlan.update({
    where: { id: existing.id },
    data: {
      status: "CHANGES_REQUESTED",
      approvedByClientAt: null
    },
    select: productionPlanSelect
  });

  await prisma.briefApproval.create({
    data: {
      tenantId,
      briefId,
      actorUserId: authSession.user.id,
      actorRole: isOwnerRole(roles) ? "ADMIN" : "CLIENT",
      decisionType: "REQUEST_CHANGES",
      targetType: "PRODUCTION_PLAN",
      comment: comment?.trim() || null
    }
  });

  const isAdmin = isOwnerRole(roles);
  return { plan: isAdmin ? plan : sanitizeProductionPlanForClient(plan) };
}

export async function createWorkflowBriefLinkedProject(
  authSession: AuthResolvedSessionContext,
  briefId: string,
  input?: { targetMonth?: string | null; name?: string | null }
): Promise<
  | { project: unknown; plan: unknown | null; created: boolean }
  | "not_found"
  | "forbidden"
  | "invalid_input"
> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  if (!isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const brief = await prisma.brief.findFirst({
    where: { id: briefId, tenantId },
    select: {
      id: true,
      clientId: true,
      title: true,
      goal: true
    }
  });
  if (!brief) {
    return "not_found";
  }

  const existingProject = await prisma.aiDeliveryProject.findFirst({
    where: { tenantId, sourceBriefId: briefId, isArchived: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      clientId: true,
      targetMonth: true,
      sourceBriefId: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (existingProject) {
    const plan = await linkProductionPlanToProject(tenantId, briefId, existingProject.id);
    return {
      project: existingProject,
      plan,
      created: false
    };
  }

  const targetMonthValue = input?.targetMonth?.trim() || defaultTargetMonthIso();
  const targetMonth = parseTargetMonth(targetMonthValue);
  if (!targetMonth) {
    return "invalid_input";
  }

  const planRecord = await prisma.productionPlan.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: { title: true }
  });

  const projectName =
    input?.name?.trim() ||
    planRecord?.title?.trim() ||
    `Content Production — ${brief.title}`;

  const scopeNotes = brief.goal ? `From workflow brief: ${brief.goal}` : null;

  const created = await prisma.$transaction(async (tx) => {
    const project = await tx.aiDeliveryProject.create({
      data: {
        tenantId,
        clientId: brief.clientId,
        sourceBriefId: briefId,
        name: projectName,
        targetMonth,
        plannedContentScopeNotes: scopeNotes,
        brief: {
          create: {
            tenantId,
            status: "DRAFT"
          }
        }
      },
      select: {
        id: true,
        name: true,
        clientId: true,
        targetMonth: true,
        sourceBriefId: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const plan = await tx.productionPlan.findFirst({
      where: { tenantId, briefId },
      orderBy: { createdAt: "desc" },
      select: { id: true }
    });

    let linkedPlan = null;
    if (plan) {
      linkedPlan = await tx.productionPlan.update({
        where: { id: plan.id },
        data: { aiDeliveryProjectId: project.id },
        select: productionPlanSelect
      });
    }

    return { project, linkedPlan };
  });

  return {
    project: created.project,
    plan: created.linkedPlan,
    created: true
  };
}

async function linkProductionPlanToProject(
  tenantId: string,
  briefId: string,
  projectId: string
): Promise<unknown | null> {
  const plan = await prisma.productionPlan.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: { id: true, aiDeliveryProjectId: true }
  });

  if (!plan) {
    return null;
  }

  if (plan.aiDeliveryProjectId === projectId) {
    return prisma.productionPlan.findFirst({
      where: { id: plan.id },
      select: productionPlanSelect
    });
  }

  return prisma.productionPlan.update({
    where: { id: plan.id },
    data: { aiDeliveryProjectId: projectId },
    select: productionPlanSelect
  });
}

const contentPlanSeedSelect = {
  id: true,
  aiDeliveryProjectId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  items: {
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true,
      title: true,
      targetKeyword: true,
      contentType: true,
      notes: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true
    }
  }
} as const;

type ContentPlanSeedRecord = {
  id: string;
  aiDeliveryProjectId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    title: string;
    targetKeyword: string | null;
    contentType: string;
    notes: string | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

function toContentPlanSeedSummary(contentPlan: ContentPlanSeedRecord) {
  return {
    id: contentPlan.id,
    aiDeliveryProjectId: contentPlan.aiDeliveryProjectId,
    status: contentPlan.status,
    itemCount: contentPlan.items.length,
    items: contentPlan.items.map((item) => ({
      id: item.id,
      title: item.title,
      targetKeyword: item.targetKeyword,
      contentType: item.contentType,
      notes: item.notes,
      sortOrder: item.sortOrder,
      isWorkflowBriefSeed: (item.notes ?? "").includes(WORKFLOW_BRIEF_SEED_MARKER)
    })),
    createdAt: contentPlan.createdAt,
    updatedAt: contentPlan.updatedAt
  };
}

function readContentSeedFromPlanJson(planJson: unknown): {
  seededAt?: string;
  contentPlanId?: string;
  itemCount?: number;
  briefId?: string;
  version?: string;
} | null {
  if (!planJson || typeof planJson !== "object" || Array.isArray(planJson)) {
    return null;
  }
  const record = planJson as Record<string, unknown>;
  const seed = record.contentSeed;
  if (!seed || typeof seed !== "object" || Array.isArray(seed)) {
    return null;
  }
  return seed as {
    seededAt?: string;
    contentPlanId?: string;
    itemCount?: number;
    briefId?: string;
    version?: string;
  };
}

async function resolveLinkedProjectForBrief(tenantId: string, briefId: string) {
  const fromSource = await prisma.aiDeliveryProject.findFirst({
    where: { tenantId, sourceBriefId: briefId, isArchived: false },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, clientId: true, targetMonth: true, sourceBriefId: true }
  });
  if (fromSource) {
    return fromSource;
  }

  const productionPlan = await prisma.productionPlan.findFirst({
    where: { tenantId, briefId, aiDeliveryProjectId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { aiDeliveryProjectId: true }
  });
  if (!productionPlan?.aiDeliveryProjectId) {
    return null;
  }

  return prisma.aiDeliveryProject.findFirst({
    where: { id: productionPlan.aiDeliveryProjectId, tenantId, isArchived: false },
    select: { id: true, name: true, clientId: true, targetMonth: true, sourceBriefId: true }
  });
}

export type WorkflowBriefContentProductionSeedStatus = {
  briefId: string;
  hasLinkedProject: boolean;
  project: { id: string; name: string; targetMonth: Date } | null;
  hasProductionPlan: boolean;
  productionPlanId: string | null;
  productionPlanStatus: string | null;
  isSeeded: boolean;
  contentPlanId: string | null;
  itemCount: number;
  seededAt: string | null;
  canSeed: boolean;
  blockReason: string | null;
  contentPlan: ReturnType<typeof toContentPlanSeedSummary> | null;
};

export async function getWorkflowBriefContentProductionSeedStatus(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<WorkflowBriefContentProductionSeedStatus | "not_found" | "forbidden"> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  const brief = await getBriefForAccess(briefId, tenantId);
  if (!brief) {
    return "not_found";
  }

  if (!(await canAccessClient(authSession, tenantId, brief.clientId))) {
    return "forbidden";
  }

  const isAdmin = isOwnerRole(getActiveRoles(authSession));
  const project = await resolveLinkedProjectForBrief(tenantId, briefId);

  const productionPlan = await prisma.productionPlan.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, planJson: true, aiDeliveryProjectId: true }
  });

  let contentPlan: ContentPlanSeedRecord | null = null;
  if (project) {
    contentPlan = (await prisma.aiDeliveryContentPlan.findFirst({
      where: { tenantId, aiDeliveryProjectId: project.id },
      select: contentPlanSeedSelect
    })) as ContentPlanSeedRecord | null;
  }

  const seedMeta = readContentSeedFromPlanJson(productionPlan?.planJson);
  const seedItems =
    contentPlan?.items.filter((item) => isWorkflowBriefSeedItemForBrief(item.notes, briefId)) ?? [];
  const isSeeded = Boolean(
    (seedMeta?.briefId === briefId && seedMeta.contentPlanId) ||
      seedItems.length > 0 ||
      (contentPlan && contentPlan.items.length > 0 && seedMeta?.contentPlanId === contentPlan.id)
  );

  const seedableBriefStatuses: WorkflowBriefStatus[] = ["AI_RESULTS_READY", "APPROVED_FOR_PRODUCTION"];
  let canSeed = false;
  let blockReason: string | null = null;

  if (!isAdmin) {
    blockReason = "Admin access required to seed content production.";
  } else if (!project) {
    blockReason = "Link an AI Delivery project before seeding content production.";
  } else if (!productionPlan) {
    blockReason = "Generate a production plan before seeding content production.";
  } else if (!seedableBriefStatuses.includes(brief.status)) {
    blockReason = "Brief must reach AI results or approved-for-production before seeding.";
  } else if (isSeeded) {
    blockReason = null;
  } else if (contentPlan && contentPlan.items.length > 0) {
    blockReason = "Linked project already has content plan items (manual or other source). Seed skipped to avoid duplication.";
  } else {
    canSeed = true;
  }

  return {
    briefId,
    hasLinkedProject: Boolean(project),
    project: project
      ? { id: project.id, name: project.name, targetMonth: project.targetMonth }
      : null,
    hasProductionPlan: Boolean(productionPlan),
    productionPlanId: productionPlan?.id ?? null,
    productionPlanStatus: productionPlan?.status ?? null,
    isSeeded,
    contentPlanId: contentPlan?.id ?? seedMeta?.contentPlanId ?? null,
    itemCount: contentPlan?.items.length ?? seedMeta?.itemCount ?? 0,
    seededAt: seedMeta?.seededAt ?? null,
    canSeed: canSeed && !isSeeded,
    blockReason: isSeeded ? null : blockReason,
    contentPlan: contentPlan ? toContentPlanSeedSummary(contentPlan) : null
  };
}

export async function seedWorkflowBriefContentProduction(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<
  | {
      seeded: boolean;
      created: boolean;
      itemsCreated: number;
      contentPlan: ReturnType<typeof toContentPlanSeedSummary>;
      project: { id: string; name: string };
      lineage: { briefId: string; productionPlanId: string; contentPlanId: string; version: string };
    }
  | "not_found"
  | "forbidden"
  | "missing_project"
  | "missing_plan"
  | "invalid_status"
  | "manual_plan_exists"
> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  if (!isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const brief = await prisma.brief.findFirst({
    where: { id: briefId, tenantId },
    select: { id: true, clientId: true, status: true }
  });
  if (!brief) {
    return "not_found";
  }

  const seedableBriefStatuses: WorkflowBriefStatus[] = ["AI_RESULTS_READY", "APPROVED_FOR_PRODUCTION"];
  if (!seedableBriefStatuses.includes(brief.status)) {
    return "invalid_status";
  }

  const project = await resolveLinkedProjectForBrief(tenantId, briefId);
  if (!project) {
    return "missing_project";
  }

  const productionPlan = await prisma.productionPlan.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      planJson: true,
      clientVisibleSnapshotJson: true,
      aiDeliveryProjectId: true
    }
  });
  if (!productionPlan) {
    return "missing_plan";
  }

  const seoReport = await prisma.aiSeoReport.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: { reportJson: true }
  });
  if (!seoReport) {
    return "missing_plan";
  }

  const existingContentPlan = (await prisma.aiDeliveryContentPlan.findFirst({
    where: { tenantId, aiDeliveryProjectId: project.id },
    select: contentPlanSeedSelect
  })) as ContentPlanSeedRecord | null;

  const seedMeta = readContentSeedFromPlanJson(productionPlan.planJson);
  if (
    seedMeta?.briefId === briefId &&
    seedMeta.contentPlanId &&
    (existingContentPlan?.id === seedMeta.contentPlanId || !existingContentPlan)
  ) {
    if (existingContentPlan) {
      return {
        seeded: true,
        created: false,
        itemsCreated: 0,
        contentPlan: toContentPlanSeedSummary(existingContentPlan),
        project: { id: project.id, name: project.name },
        lineage: {
          briefId,
          productionPlanId: productionPlan.id,
          contentPlanId: existingContentPlan.id,
          version: WORKFLOW_BRIEF_CONTENT_SEED_VERSION
        }
      };
    }
  }

  if (existingContentPlan) {
    const hasSeedItems = existingContentPlan.items.some((item) =>
      isWorkflowBriefSeedItemForBrief(item.notes, briefId)
    );
    if (hasSeedItems || seedMeta?.briefId === briefId) {
      return {
        seeded: true,
        created: false,
        itemsCreated: 0,
        contentPlan: toContentPlanSeedSummary(existingContentPlan),
        project: { id: project.id, name: project.name },
        lineage: {
          briefId,
          productionPlanId: productionPlan.id,
          contentPlanId: existingContentPlan.id,
          version: WORKFLOW_BRIEF_CONTENT_SEED_VERSION
        }
      };
    }

    if (existingContentPlan.items.length > 0) {
      return "manual_plan_exists";
    }
  }

  const itemDrafts = buildWorkflowBriefSeedContentPlanItems({
    briefId,
    productionPlanId: productionPlan.id,
    planJson: productionPlan.planJson,
    clientVisibleSnapshotJson: productionPlan.clientVisibleSnapshotJson,
    seoReportJson: seoReport.reportJson
  });

  const seededAt = new Date().toISOString();

  const result = await prisma.$transaction(async (tx) => {
    let contentPlan: ContentPlanSeedRecord | null = existingContentPlan;
    let created = false;

    if (!contentPlan) {
      contentPlan = (await tx.aiDeliveryContentPlan.create({
        data: {
          tenantId,
          aiDeliveryProjectId: project.id,
          status: "DRAFT",
          revisionCount: 0
        },
        select: contentPlanSeedSelect
      })) as ContentPlanSeedRecord;
      created = true;
    }

    for (const item of itemDrafts) {
      await tx.aiDeliveryContentPlanItem.create({
        data: {
          tenantId,
          contentPlanId: contentPlan.id,
          title: item.title,
          targetKeyword: item.targetKeyword,
          contentType: item.contentType,
          notes: item.notes,
          sortOrder: item.sortOrder,
          approvalStatus: "DRAFT"
        }
      });
    }

    const refreshedPlan = (await tx.aiDeliveryContentPlan.findFirst({
      where: { id: contentPlan.id },
      select: contentPlanSeedSelect
    })) as ContentPlanSeedRecord | null;

    const existingPlanJson =
      productionPlan.planJson && typeof productionPlan.planJson === "object" && !Array.isArray(productionPlan.planJson)
        ? (productionPlan.planJson as Record<string, unknown>)
        : {};

    await tx.productionPlan.update({
      where: { id: productionPlan.id },
      data: {
        aiDeliveryProjectId: productionPlan.aiDeliveryProjectId ?? project.id,
        planJson: {
          ...existingPlanJson,
          contentSeed: {
            version: WORKFLOW_BRIEF_CONTENT_SEED_VERSION,
            briefId,
            productionPlanId: productionPlan.id,
            contentPlanId: contentPlan.id,
            aiDeliveryProjectId: project.id,
            itemCount: refreshedPlan?.items.length ?? itemDrafts.length,
            seededAt
          }
        } as Prisma.InputJsonValue
      }
    });

    return { contentPlan: refreshedPlan ?? contentPlan, created };
  });

  return {
    seeded: true,
    created: result.created,
    itemsCreated: itemDrafts.length,
    contentPlan: toContentPlanSeedSummary(result.contentPlan),
    project: { id: project.id, name: project.name },
    lineage: {
      briefId,
      productionPlanId: productionPlan.id,
      contentPlanId: result.contentPlan.id,
      version: WORKFLOW_BRIEF_CONTENT_SEED_VERSION
    }
  };
}
