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
  WorkflowBriefCreatedByRole,
  WorkflowBriefSource,
  WorkflowBriefStatus
} from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuthResolvedSessionContext } from "../auth/types";
import {
  buildWorkflowBriefMiReportJson,
  buildWorkflowBriefSeoReportJson,
  executeWorkflowBriefAiRun
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
      createdAt: true,
      updatedAt: true
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

  return { brief };
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
): Promise<{ plan: unknown } | "not_found" | "forbidden"> {
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
    select: { id: true }
  });

  const data = {
    title: input.title.trim(),
    body: input.body?.trim() || null,
    planJson: input.planJson ?? undefined,
    clientVisibleSnapshotJson: input.clientVisibleSnapshotJson ?? undefined,
    aiDeliveryProjectId: input.aiDeliveryProjectId ?? undefined
  };

  const plan = existing
    ? await prisma.productionPlan.update({
        where: { id: existing.id },
        data,
        select: {
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
        }
      })
    : await prisma.productionPlan.create({
        data: {
          tenantId,
          briefId,
          ...data,
          status: "DRAFT"
        },
        select: {
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
        }
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
    select: {
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
    }
  });

  if (!plan) {
    return "not_found";
  }

  if (!isAdmin && plan.status === "DRAFT") {
    return "forbidden";
  }

  if (!isAdmin) {
    return {
      plan: {
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
      }
    };
  }

  return { plan };
}
