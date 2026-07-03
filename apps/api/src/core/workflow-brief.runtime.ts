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
  buildWorkflowBriefDraftLineageNote,
  executeWorkflowBriefDraftGeneration,
  filterWorkflowBriefSeedPlanItems,
  isWorkflowBriefDraftForBrief,
  WORKFLOW_BRIEF_DRAFT_VERSION
} from "./workflow-brief-draft.execution";
import {
  buildWorkflowBriefDeliverablePayload,
  canPackageWorkflowBriefContentDraft,
  canRepackageWorkflowBriefDeliverable,
  classifyItemPackagingStateWithRejection,
  computePackagingStage,
  isClientReviewableDeliverableStatus,
  isDeliverableLockedForRepackage,
  isWorkflowBriefPackagedDeliverable,
  summarizeBatchPackagingResult,
  WORKFLOW_BRIEF_DELIVERABLE_PACKAGING_VERSION,
  type WorkflowBriefDeliverablePackagingStage,
  type WorkflowBriefItemPackagingState,
  type WorkflowBriefPackagingOutcome
} from "./workflow-brief-deliverable-packaging.execution";
import { sendAiDeliveryDeliverableForClientReview } from "./client-portal-approval.runtime";
import { resolvePublicationTargetForClient } from "./client-publication.runtime";
import {
  buildPublishablePackageSummary,
  buildWorkflowBriefImageCandidate,
  canPrepareWorkflowBriefImageSetFromDraft,
  classifyImageSetItemState,
  computeImageSetStage,
  computeOverallPackageCompletenessStage,
  computePackageItemCompleteness,
  computeReleasePrepStage,
  isArticleImageLockedForRefresh,
  isWorkflowBriefArticleImage,
  summarizeImageSetBatchResult,
  WORKFLOW_BRIEF_IMAGE_SET_VERSION,
  WORKFLOW_BRIEF_RELEASE_PREP_VERSION,
  type WorkflowBriefImageSetOutcome,
  type WorkflowBriefImageSetStage,
  type WorkflowBriefPackageCompletenessStage,
  type WorkflowBriefReleasePrepStage
} from "./workflow-brief-image-set.execution";
import {
  buildFinalReleasePackageRecord,
  canFinalizeWorkflowBriefReleasePackage,
  computeFinalReleasePackageFingerprint,
  computeFinalReleasePackageStage,
  isReleasableTextDeliverableStatus,
  resolveFeaturedImageRef,
  shouldReuseFinalReleasePackage,
  toClientSafeReleasePackageFromRecord,
  WORKFLOW_BRIEF_FINAL_RELEASE_PACKAGE_VERSION,
  type ClientSafeReleasePackage,
  type FinalReleasePackageFingerprintItem,
  type WorkflowBriefFinalReleasePackageRecord,
  type WorkflowBriefFinalReleasePackageItemSource,
  type WorkflowBriefFinalReleasePackageStage
} from "./workflow-brief-final-release.execution";
import {
  buildPublicationHandoffPackageMappingItem,
  buildPublicationHandoffItemFromDraft,
  buildPublicationHandoffRecord,
  canExecutePublicationHandoff,
  computePublicationHandoffPackageFingerprint,
  computePublicationHandoffStage,
  resolvePublicationHandoffFeaturedImageRef,
  shouldReusePublicationHandoff,
  WORKFLOW_BRIEF_PUBLICATION_HANDOFF_MODE,
  WORKFLOW_BRIEF_PUBLICATION_HANDOFF_VERSION,
  type WorkflowBriefPublicationHandoffRecord,
  type WorkflowBriefPublicationHandoffStage
} from "./workflow-brief-publication-handoff.execution";
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

function sanitizeMiReportsForClient(miReports: unknown): unknown[] {
  const reports = Array.isArray(miReports) ? miReports : [];
  return reports.map((report) => {
    if (!report || typeof report !== "object") {
      return report;
    }
    const record = report as Record<string, unknown>;
    return {
      id: record.id,
      status: record.status,
      summaryText: record.summaryText,
      reportJson: readMiReportContent(record.reportJson),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  });
}

function sanitizeSeoReportsForClient(seoReports: unknown): unknown[] {
  const reports = Array.isArray(seoReports) ? seoReports : [];
  return reports.map((report) => {
    if (!report || typeof report !== "object") {
      return report;
    }
    const record = report as Record<string, unknown>;
    return {
      id: record.id,
      status: record.status,
      summaryText: record.summaryText,
      reportJson: readSeoReportContent(record.reportJson),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  });
}

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
    // Raw reportJson carries provider/run metadata (gateway, model, version) — reduce to
    // safe content fields only for non-admin/client viewers, same as productionPlans above.
    miReports: sanitizeMiReportsForClient(brief.miReports),
    seoReports: sanitizeSeoReportsForClient(brief.seoReports),
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

  // Raw reportJson carries provider/run metadata (gateway, model, version) — reduce to
  // safe content fields only for non-admin/client viewers.
  const isAdmin = isOwnerRole(getActiveRoles(authSession));
  return {
    report: isAdmin ? report : { ...report, reportJson: readMiReportContent(report.reportJson) }
  };
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

  // Raw reportJson carries provider/run metadata (gateway, model, version) — reduce to
  // safe content fields only for non-admin/client viewers.
  const isAdmin = isOwnerRole(getActiveRoles(authSession));
  return {
    report: isAdmin ? report : { ...report, reportJson: readSeoReportContent(report.reportJson) }
  };
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

const contentDraftSummarySelect = {
  id: true,
  contentPlanItemId: true,
  title: true,
  slug: true,
  draftBody: true,
  status: true,
  notes: true,
  revisionCount: true,
  reviewRequestedAt: true,
  approvedAt: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true
} as const;

type ContentDraftSummaryRecord = {
  id: string;
  contentPlanItemId: string | null;
  title: string;
  slug: string | null;
  draftBody: string;
  status: string;
  notes: string | null;
  revisionCount: number;
  reviewRequestedAt: Date | null;
  approvedAt: Date | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function readContentDraftsFromPlanJson(planJson: unknown): {
  version?: string;
  briefId?: string;
  lastGeneratedAt?: string;
  lastRegeneratedAt?: string;
  draftCount?: number;
  itemCount?: number;
  packageReadiness?: string;
} | null {
  if (!planJson || typeof planJson !== "object" || Array.isArray(planJson)) {
    return null;
  }
  const record = planJson as Record<string, unknown>;
  const drafts = record.contentDrafts;
  if (!drafts || typeof drafts !== "object" || Array.isArray(drafts)) {
    return null;
  }
  return drafts as {
    version?: string;
    briefId?: string;
    lastGeneratedAt?: string;
    lastRegeneratedAt?: string;
    draftCount?: number;
    itemCount?: number;
    packageReadiness?: string;
  };
}

function classifyDraftReadiness(status: string | null): "pending" | "generated" | "ready_for_review" | "needs_work" | "approved" {
  switch (status) {
    case "READY_FOR_REVIEW":
      return "ready_for_review";
    case "CHANGES_REQUESTED":
      return "needs_work";
    case "APPROVED":
      return "approved";
    case "DRAFT":
      return "generated";
    default:
      return "pending";
  }
}

function computePackageReadiness(input: {
  seedItemCount: number;
  draftCount: number;
  readyForReviewCount: number;
  needsWorkCount: number;
  approvedCount: number;
}): "none" | "partial" | "drafts_generated" | "ready_for_admin_review" | "ready_for_packaging" {
  if (input.seedItemCount === 0 || input.draftCount === 0) {
    return "none";
  }
  if (input.draftCount < input.seedItemCount) {
    return "partial";
  }
  if (input.approvedCount === input.seedItemCount) {
    return "ready_for_packaging";
  }
  if (input.readyForReviewCount + input.approvedCount === input.seedItemCount) {
    return "ready_for_admin_review";
  }
  return "drafts_generated";
}

function toContentDraftItemSummary(input: {
  briefId: string;
  planItem: ContentPlanSeedRecord["items"][number];
  draft: ContentDraftSummaryRecord | null;
}) {
  const readiness = input.draft ? classifyDraftReadiness(input.draft.status) : "pending";
  return {
    contentPlanItemId: input.planItem.id,
    planItemTitle: input.planItem.title,
    targetKeyword: input.planItem.targetKeyword,
    contentType: input.planItem.contentType,
    sortOrder: input.planItem.sortOrder,
    hasDraft: Boolean(input.draft),
    draftId: input.draft?.id ?? null,
    draftTitle: input.draft?.title ?? null,
    draftStatus: input.draft?.status ?? null,
    readiness,
    revisionCount: input.draft?.revisionCount ?? 0,
    isWorkflowBriefDraft: input.draft ? isWorkflowBriefDraftForBrief(input.draft.notes, input.briefId) : false,
    updatedAt: input.draft?.updatedAt?.toISOString() ?? null
  };
}

export type WorkflowBriefContentDraftStatus = {
  briefId: string;
  hasLinkedProject: boolean;
  project: { id: string; name: string; targetMonth: Date } | null;
  isSeeded: boolean;
  contentPlanId: string | null;
  seedItemCount: number;
  draftCount: number;
  pendingCount: number;
  generatedCount: number;
  readyForReviewCount: number;
  needsWorkCount: number;
  approvedCount: number;
  packageReadiness: ReturnType<typeof computePackageReadiness>;
  canGenerateDrafts: boolean;
  blockReason: string | null;
  lastGeneratedAt: string | null;
  lastRegeneratedAt: string | null;
  items: Array<ReturnType<typeof toContentDraftItemSummary>>;
  drafts: Array<{
    id: string;
    contentPlanItemId: string | null;
    title: string;
    slug: string | null;
    status: string;
    readiness: ReturnType<typeof classifyDraftReadiness>;
    revisionCount: number;
    notesPreview: string | null;
    updatedAt: string;
  }>;
  lineage: {
    briefId: string;
    productionPlanId: string | null;
    contentPlanId: string | null;
    aiDeliveryProjectId: string | null;
    version: string;
  };
};

async function loadWorkflowBriefDraftContext(tenantId: string, briefId: string) {
  const brief = await prisma.brief.findFirst({
    where: { id: briefId, tenantId },
    select: {
      id: true,
      clientId: true,
      title: true,
      goal: true,
      businessContext: true,
      targetAudience: true,
      status: true
    }
  });
  if (!brief) {
    return null;
  }

  const project = await resolveLinkedProjectForBrief(tenantId, briefId);
  const productionPlan = await prisma.productionPlan.findFirst({
    where: { tenantId, briefId },
    orderBy: { createdAt: "desc" },
    select: { id: true, planJson: true, clientVisibleSnapshotJson: true }
  });

  let contentPlan: ContentPlanSeedRecord | null = null;
  if (project) {
    contentPlan = (await prisma.aiDeliveryContentPlan.findFirst({
      where: { tenantId, aiDeliveryProjectId: project.id },
      select: contentPlanSeedSelect
    })) as ContentPlanSeedRecord | null;
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

  const seedItems = contentPlan ? filterWorkflowBriefSeedPlanItems(contentPlan.items, briefId) : [];
  const seedMeta = readContentSeedFromPlanJson(productionPlan?.planJson);
  const isSeeded = Boolean(seedItems.length > 0 || seedMeta?.briefId === briefId);

  let drafts: ContentDraftSummaryRecord[] = [];
  if (project) {
    drafts = (await prisma.aiDeliveryContentDraft.findMany({
      where: {
        tenantId,
        aiDeliveryProjectId: project.id,
        isArchived: false,
        contentPlanItemId: seedItems.length > 0 ? { in: seedItems.map((item) => item.id) } : undefined
      },
      select: contentDraftSummarySelect,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
    })) as ContentDraftSummaryRecord[];
  }

  const draftByItemId = new Map<string, ContentDraftSummaryRecord>();
  for (const draft of drafts) {
    if (!draft.contentPlanItemId || draftByItemId.has(draft.contentPlanItemId)) {
      continue;
    }
    draftByItemId.set(draft.contentPlanItemId, draft);
  }

  const planRecord =
    productionPlan?.planJson && typeof productionPlan.planJson === "object" && !Array.isArray(productionPlan.planJson)
      ? (productionPlan.planJson as Record<string, unknown>)
      : {};
  const recommendedContentDirection =
    typeof planRecord.recommendedContentDirection === "string" ? planRecord.recommendedContentDirection : null;

  return {
    brief,
    project,
    productionPlan,
    contentPlan,
    seedItems,
    isSeeded,
    seedMeta,
    mi: readMiReportContent(miReport?.reportJson),
    seo: readSeoReportContent(seoReport?.reportJson),
    recommendedContentDirection,
    draftByItemId,
    draftsMeta: readContentDraftsFromPlanJson(productionPlan?.planJson)
  };
}

function buildWorkflowBriefContentDraftStatusFromContext(
  briefId: string,
  context: NonNullable<Awaited<ReturnType<typeof loadWorkflowBriefDraftContext>>>,
  isAdmin: boolean
): WorkflowBriefContentDraftStatus {
  const { brief, project, productionPlan, contentPlan, seedItems, isSeeded, seedMeta, draftByItemId, draftsMeta } =
    context;

  const itemSummaries = seedItems.map((planItem) =>
    toContentDraftItemSummary({ briefId, planItem, draft: draftByItemId.get(planItem.id) ?? null })
  );

  const draftCount = itemSummaries.filter((item) => item.hasDraft).length;
  const pendingCount = itemSummaries.filter((item) => item.readiness === "pending").length;
  const generatedCount = itemSummaries.filter((item) => item.readiness === "generated").length;
  const readyForReviewCount = itemSummaries.filter((item) => item.readiness === "ready_for_review").length;
  const needsWorkCount = itemSummaries.filter((item) => item.readiness === "needs_work").length;
  const approvedCount = itemSummaries.filter((item) => item.readiness === "approved").length;

  const packageReadiness = computePackageReadiness({
    seedItemCount: seedItems.length,
    draftCount,
    readyForReviewCount,
    needsWorkCount,
    approvedCount
  });

  const draftableBriefStatuses: WorkflowBriefStatus[] = ["AI_RESULTS_READY", "APPROVED_FOR_PRODUCTION"];
  let canGenerateDrafts = false;
  let blockReason: string | null = null;

  if (!isAdmin) {
    blockReason = "Admin access required to generate content drafts.";
  } else if (!project) {
    blockReason = "Link an AI Delivery project before generating content drafts.";
  } else if (!isSeeded || seedItems.length === 0) {
    blockReason = "Seed content production before generating drafts.";
  } else if (!draftableBriefStatuses.includes(brief.status)) {
    blockReason = "Brief must reach AI results or approved-for-production before draft generation.";
  } else {
    canGenerateDrafts = true;
  }

  const drafts = itemSummaries
    .filter((item) => item.draftId)
    .map((item) => {
      const draft = draftByItemId.get(item.contentPlanItemId)!;
      return {
        id: draft.id,
        contentPlanItemId: draft.contentPlanItemId,
        title: draft.title,
        slug: draft.slug,
        status: draft.status,
        readiness: item.readiness,
        revisionCount: draft.revisionCount,
        notesPreview: draft.notes ? draft.notes.slice(0, 120) : null,
        updatedAt: draft.updatedAt.toISOString()
      };
    });

  return {
    briefId,
    hasLinkedProject: Boolean(project),
    project: project ? { id: project.id, name: project.name, targetMonth: project.targetMonth } : null,
    isSeeded,
    contentPlanId: contentPlan?.id ?? seedMeta?.contentPlanId ?? null,
    seedItemCount: seedItems.length,
    draftCount,
    pendingCount,
    generatedCount,
    readyForReviewCount,
    needsWorkCount,
    approvedCount,
    packageReadiness,
    canGenerateDrafts,
    blockReason,
    lastGeneratedAt: draftsMeta?.lastGeneratedAt ?? null,
    lastRegeneratedAt: draftsMeta?.lastRegeneratedAt ?? null,
    items: itemSummaries,
    drafts,
    lineage: {
      briefId,
      productionPlanId: productionPlan?.id ?? null,
      contentPlanId: contentPlan?.id ?? seedMeta?.contentPlanId ?? null,
      aiDeliveryProjectId: project?.id ?? null,
      version: WORKFLOW_BRIEF_DRAFT_VERSION
    }
  };
}

export async function getWorkflowBriefContentDraftStatus(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<WorkflowBriefContentDraftStatus | "not_found" | "forbidden"> {
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

  const context = await loadWorkflowBriefDraftContext(tenantId, briefId);
  if (!context) {
    return "not_found";
  }

  const isAdmin = isOwnerRole(getActiveRoles(authSession));
  return buildWorkflowBriefContentDraftStatusFromContext(briefId, context, isAdmin);
}

type PersistDraftOutcome = "created" | "updated" | "reused" | "skipped_locked";

async function persistWorkflowBriefGeneratedDraft(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    aiDeliveryProjectId: string;
    briefId: string;
    contentPlanItemId: string;
    generated: { title: string; slug: string | null; draftBody: string; notes: string | null };
    forceRegenerate: boolean;
  }
): Promise<{ outcome: PersistDraftOutcome; draftId: string | null }> {
  const existingDraft = await tx.aiDeliveryContentDraft.findFirst({
    where: {
      tenantId: input.tenantId,
      aiDeliveryProjectId: input.aiDeliveryProjectId,
      contentPlanItemId: input.contentPlanItemId,
      isArchived: false
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: { id: true, status: true, revisionCount: true }
  });

  const lineageNote = buildWorkflowBriefDraftLineageNote(
    input.briefId,
    input.contentPlanItemId,
    input.forceRegenerate ? "Regenerated draft" : "Generated draft"
  );
  const mergedNotes = input.generated.notes?.includes("workflow-brief-draft:v1")
    ? input.generated.notes
    : truncateWorkflowBriefDraftNotes(`${lineageNote}${input.generated.notes ? ` ${input.generated.notes}` : ""}`);

  if (existingDraft && !input.forceRegenerate) {
    return { outcome: "reused", draftId: existingDraft.id };
  }

  if (existingDraft?.status === "APPROVED") {
    return { outcome: "skipped_locked", draftId: existingDraft.id };
  }

  if (existingDraft) {
    const updated = await tx.aiDeliveryContentDraft.update({
      where: { id: existingDraft.id },
      data: {
        title: input.generated.title,
        slug: input.generated.slug,
        draftBody: input.generated.draftBody,
        status: "DRAFT",
        notes: mergedNotes,
        reviewRequestedAt: null,
        approvedAt: null,
        revisionCount: existingDraft.revisionCount + 1
      },
      select: { id: true }
    });
    return { outcome: "updated", draftId: updated.id };
  }

  const created = await tx.aiDeliveryContentDraft.create({
    data: {
      tenantId: input.tenantId,
      aiDeliveryProjectId: input.aiDeliveryProjectId,
      contentPlanItemId: input.contentPlanItemId,
      title: input.generated.title,
      slug: input.generated.slug,
      draftBody: input.generated.draftBody,
      status: "DRAFT",
      notes: mergedNotes,
      reviewRequestedAt: null,
      approvedAt: null,
      revisionCount: 0,
      isArchived: false
    },
    select: { id: true }
  });
  return { outcome: "created", draftId: created.id };
}

function truncateWorkflowBriefDraftNotes(value: string): string {
  return value.length > 500 ? `${value.slice(0, 497).trim()}...` : value;
}

async function writeContentDraftsMetadata(
  tx: Prisma.TransactionClient,
  input: {
    productionPlanId: string;
    planJson: unknown;
    briefId: string;
    seedItemCount: number;
    draftCount: number;
    readyForReviewCount: number;
    needsWorkCount: number;
    approvedCount: number;
    lastGeneratedAt?: string;
    lastRegeneratedAt?: string;
  }
): Promise<void> {
  const existingPlanJson =
    input.planJson && typeof input.planJson === "object" && !Array.isArray(input.planJson)
      ? (input.planJson as Record<string, unknown>)
      : {};

  const existingDraftsMeta = readContentDraftsFromPlanJson(input.planJson) ?? {};

  await tx.productionPlan.update({
    where: { id: input.productionPlanId },
    data: {
      planJson: {
        ...existingPlanJson,
        contentDrafts: {
          version: WORKFLOW_BRIEF_DRAFT_VERSION,
          briefId: input.briefId,
          itemCount: input.seedItemCount,
          draftCount: input.draftCount,
          packageReadiness: computePackageReadiness({
            seedItemCount: input.seedItemCount,
            draftCount: input.draftCount,
            readyForReviewCount: input.readyForReviewCount,
            needsWorkCount: input.needsWorkCount,
            approvedCount: input.approvedCount
          }),
          lastGeneratedAt: input.lastGeneratedAt ?? existingDraftsMeta.lastGeneratedAt ?? null,
          lastRegeneratedAt: input.lastRegeneratedAt ?? existingDraftsMeta.lastRegeneratedAt ?? null
        }
      } as Prisma.InputJsonValue
    }
  });
}

export async function generateWorkflowBriefContentDrafts(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<
  | {
      generated: boolean;
      created: number;
      updated: number;
      reused: number;
      skippedLocked: number;
      isDeterministic: boolean;
      status: WorkflowBriefContentDraftStatus;
    }
  | "not_found"
  | "forbidden"
  | "missing_project"
  | "not_seeded"
  | "invalid_status"
> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  if (!isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const context = await loadWorkflowBriefDraftContext(tenantId, briefId);
  if (!context) {
    return "not_found";
  }

  const draftableBriefStatuses: WorkflowBriefStatus[] = ["AI_RESULTS_READY", "APPROVED_FOR_PRODUCTION"];
  if (!draftableBriefStatuses.includes(context.brief.status)) {
    return "invalid_status";
  }

  if (!context.project) {
    return "missing_project";
  }

  if (!context.isSeeded || context.seedItems.length === 0) {
    return "not_seeded";
  }

  const finishedAtIso = new Date().toISOString();
  let created = 0;
  let updated = 0;
  let reused = 0;
  let skippedLocked = 0;
  let isDeterministic = true;

  await prisma.$transaction(async (tx) => {
    for (const planItem of context.seedItems) {
      const existing = context.draftByItemId.get(planItem.id);
      if (existing && existing.status !== "APPROVED") {
        reused += 1;
        continue;
      }
      if (existing?.status === "APPROVED") {
        skippedLocked += 1;
        continue;
      }

      const execution = await executeWorkflowBriefDraftGeneration({
        briefId,
        briefTitle: context.brief.title,
        goal: context.brief.goal,
        targetAudience: context.brief.targetAudience,
        businessContext: context.brief.businessContext,
        projectName: context.project!.name,
        targetMonth: context.project!.targetMonth.toISOString().slice(0, 7),
        planItem,
        mi: context.mi,
        seo: context.seo,
        recommendedContentDirection: context.recommendedContentDirection,
        finishedAtIso
      });

      if (!execution.meta.isDeterministic) {
        isDeterministic = false;
      }

      const persistResult = await persistWorkflowBriefGeneratedDraft(tx, {
        tenantId,
        aiDeliveryProjectId: context.project!.id,
        briefId,
        contentPlanItemId: planItem.id,
        generated: execution.draft,
        forceRegenerate: false
      });

      if (persistResult.outcome === "created") created += 1;
      else if (persistResult.outcome === "updated") updated += 1;
      else if (persistResult.outcome === "reused") reused += 1;
      else if (persistResult.outcome === "skipped_locked") skippedLocked += 1;
    }
  });

  if (context.productionPlan) {
    const refreshedContext = await loadWorkflowBriefDraftContext(tenantId, briefId);
    if (refreshedContext) {
      const draftStatus = buildWorkflowBriefContentDraftStatusFromContext(briefId, refreshedContext, true);
      await prisma.$transaction(async (tx) => {
        await writeContentDraftsMetadata(tx, {
          productionPlanId: context.productionPlan!.id,
          planJson: context.productionPlan!.planJson,
          briefId,
          seedItemCount: draftStatus.seedItemCount,
          draftCount: draftStatus.draftCount,
          readyForReviewCount: draftStatus.readyForReviewCount,
          needsWorkCount: draftStatus.needsWorkCount,
          approvedCount: draftStatus.approvedCount,
          lastGeneratedAt: finishedAtIso
        });
      });
    }
  }

  const status = await getWorkflowBriefContentDraftStatus(authSession, briefId);
  if (status === "not_found" || status === "forbidden") {
    return status;
  }

  return {
    generated: true,
    created,
    updated,
    reused,
    skippedLocked,
    isDeterministic,
    status
  };
}

export async function regenerateWorkflowBriefContentDraft(
  authSession: AuthResolvedSessionContext,
  briefId: string,
  contentPlanItemId: string
): Promise<
  | {
      regenerated: boolean;
      outcome: PersistDraftOutcome;
      draftId: string | null;
      isDeterministic: boolean;
      status: WorkflowBriefContentDraftStatus;
    }
  | "not_found"
  | "forbidden"
  | "missing_project"
  | "not_seeded"
  | "invalid_item"
  | "invalid_status"
> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return "forbidden";
  }

  if (!isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  if (!contentPlanItemId.trim()) {
    return "invalid_item";
  }

  const context = await loadWorkflowBriefDraftContext(tenantId, briefId);
  if (!context) {
    return "not_found";
  }

  const draftableBriefStatuses: WorkflowBriefStatus[] = ["AI_RESULTS_READY", "APPROVED_FOR_PRODUCTION"];
  if (!draftableBriefStatuses.includes(context.brief.status)) {
    return "invalid_status";
  }

  if (!context.project) {
    return "missing_project";
  }

  if (!context.isSeeded || context.seedItems.length === 0) {
    return "not_seeded";
  }

  const planItem = context.seedItems.find((item) => item.id === contentPlanItemId);
  if (!planItem) {
    return "invalid_item";
  }

  const finishedAtIso = new Date().toISOString();
  const execution = await executeWorkflowBriefDraftGeneration({
    briefId,
    briefTitle: context.brief.title,
    goal: context.brief.goal,
    targetAudience: context.brief.targetAudience,
    businessContext: context.brief.businessContext,
    projectName: context.project.name,
    targetMonth: context.project.targetMonth.toISOString().slice(0, 7),
    planItem,
    mi: context.mi,
    seo: context.seo,
    recommendedContentDirection: context.recommendedContentDirection,
    finishedAtIso
  });

  const persistResult = await prisma.$transaction(async (tx) => {
    return persistWorkflowBriefGeneratedDraft(tx, {
      tenantId,
      aiDeliveryProjectId: context.project!.id,
      briefId,
      contentPlanItemId: planItem.id,
      generated: execution.draft,
      forceRegenerate: true
    });
  });

  if (context.productionPlan) {
    const refreshedContext = await loadWorkflowBriefDraftContext(tenantId, briefId);
    if (refreshedContext) {
      const draftStatus = buildWorkflowBriefContentDraftStatusFromContext(briefId, refreshedContext, true);
      await prisma.$transaction(async (tx) => {
        await writeContentDraftsMetadata(tx, {
          productionPlanId: context.productionPlan!.id,
          planJson: context.productionPlan!.planJson,
          briefId,
          seedItemCount: draftStatus.seedItemCount,
          draftCount: draftStatus.draftCount,
          readyForReviewCount: draftStatus.readyForReviewCount,
          needsWorkCount: draftStatus.needsWorkCount,
          approvedCount: draftStatus.approvedCount,
          lastRegeneratedAt: finishedAtIso
        });
      });
    }
  }

  const status = await getWorkflowBriefContentDraftStatus(authSession, briefId);
  if (status === "not_found" || status === "forbidden") {
    return status;
  }

  return {
    regenerated: persistResult.outcome === "created" || persistResult.outcome === "updated",
    outcome: persistResult.outcome,
    draftId: persistResult.draftId,
    isDeterministic: execution.meta.isDeterministic,
    status
  };
}

const deliverablePackagingSelect = {
  id: true,
  contentDraftId: true,
  title: true,
  status: true,
  bodyContent: true,
  clientRejectionReason: true,
  deliveryType: true,
  notes: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true
} as const;

type DeliverablePackagingRecord = {
  id: string;
  contentDraftId: string | null;
  title: string;
  status: string;
  bodyContent: string | null;
  clientRejectionReason: string | null;
  deliveryType: string;
  notes: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const contentDraftPackagingSelect = {
  id: true,
  contentPlanItemId: true,
  title: true,
  slug: true,
  draftBody: true,
  status: true,
  notes: true,
  isArchived: true
} as const;

type ContentDraftPackagingRecord = {
  id: string;
  contentPlanItemId: string | null;
  title: string;
  slug: string | null;
  draftBody: string;
  status: string;
  notes: string | null;
  isArchived: boolean;
};

function readDeliverablePackagingFromPlanJson(planJson: unknown): {
  version?: string;
  briefId?: string;
  lastPackagedAt?: string;
  lastRepackagedAt?: string;
  packagedCount?: number;
  eligibleDraftCount?: number;
} | null {
  if (!planJson || typeof planJson !== "object" || Array.isArray(planJson)) {
    return null;
  }
  const record = planJson as Record<string, unknown>;
  const packaging = record.deliverablePackaging;
  if (!packaging || typeof packaging !== "object" || Array.isArray(packaging)) {
    return null;
  }
  return packaging as {
    version?: string;
    briefId?: string;
    lastPackagedAt?: string;
    lastRepackagedAt?: string;
    packagedCount?: number;
    eligibleDraftCount?: number;
  };
}

async function loadWorkflowBriefDeliverablePackagingData(tenantId: string, briefId: string) {
  const context = await loadWorkflowBriefDraftContext(tenantId, briefId);
  if (!context) {
    return null;
  }

  let deliverables: DeliverablePackagingRecord[] = [];
  if (context.project) {
    deliverables = (await prisma.aiDeliveryDeliverable.findMany({
      where: {
        tenantId,
        aiDeliveryProjectId: context.project.id,
        briefId,
        isArchived: false
      },
      select: deliverablePackagingSelect,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
    })) as DeliverablePackagingRecord[];
  }

  const deliverableByDraftId = new Map<string, DeliverablePackagingRecord>();
  for (const deliverable of deliverables) {
    if (!deliverable.contentDraftId || deliverableByDraftId.has(deliverable.contentDraftId)) {
      continue;
    }
    deliverableByDraftId.set(deliverable.contentDraftId, deliverable);
  }

  return {
    ...context,
    deliverables,
    deliverableByDraftId,
    packagingMeta: readDeliverablePackagingFromPlanJson(context.productionPlan?.planJson)
  };
}

async function loadFullDraftForPackaging(
  tenantId: string,
  projectId: string,
  draftId: string
): Promise<ContentDraftPackagingRecord | null> {
  return prisma.aiDeliveryContentDraft.findFirst({
    where: { id: draftId, tenantId, aiDeliveryProjectId: projectId, isArchived: false },
    select: contentDraftPackagingSelect
  }) as Promise<ContentDraftPackagingRecord | null>;
}

export type WorkflowBriefDeliverablePackagingStatus = {
  briefId: string;
  hasLinkedProject: boolean;
  project: { id: string; name: string; targetMonth: Date } | null;
  productionPlanId: string | null;
  eligibleDraftCount: number;
  packagedCount: number;
  unpackagedCount: number;
  pendingReviewCount: number;
  approvedByClientCount: number;
  rejectedCount: number;
  canPackageAll: boolean;
  canManagePackaging: boolean;
  blockReason: string | null;
  packagingStage: WorkflowBriefDeliverablePackagingStage;
  lastPackagedAt: string | null;
  lastRepackagedAt: string | null;
  items: Array<{
    contentPlanItemId: string;
    planItemTitle: string;
    draftId: string | null;
    draftTitle: string | null;
    draftStatus: string | null;
    isEligible: boolean;
    deliverableId: string | null;
    deliverableStatus: string | null;
    deliverableTitle: string | null;
    packagingState: WorkflowBriefItemPackagingState;
    canRepackage: boolean;
    isClientReviewable: boolean;
  }>;
  deliverables: Array<{
    id: string;
    contentDraftId: string | null;
    title: string;
    status: string;
    deliveryType: string;
    bodyPreview: string | null;
    clientRejectionReason: string | null;
    isWorkflowBriefDeliverable: boolean;
    updatedAt: string;
  }>;
  lineage: {
    briefId: string;
    productionPlanId: string | null;
    aiDeliveryProjectId: string | null;
    version: string;
  };
};

function buildWorkflowBriefDeliverablePackagingStatus(
  briefId: string,
  context: NonNullable<Awaited<ReturnType<typeof loadWorkflowBriefDeliverablePackagingData>>>,
  isAdmin: boolean
): WorkflowBriefDeliverablePackagingStatus {
  const { project, productionPlan, seedItems, draftByItemId, deliverableByDraftId, deliverables, packagingMeta } =
    context;

  const items = seedItems.map((planItem) => {
    const draft = draftByItemId.get(planItem.id) ?? null;
    const isEligible = draft
      ? canPackageWorkflowBriefContentDraft(
          {
            notes: draft.notes,
            draftBody: draft.draftBody,
            isArchived: draft.isArchived,
            contentPlanItemId: draft.contentPlanItemId
          },
          briefId
        )
      : false;

    const deliverable = draft ? deliverableByDraftId.get(draft.id) ?? null : null;
    const packagingState = classifyItemPackagingStateWithRejection({
      isEligible,
      hasDeliverable: Boolean(deliverable),
      deliverableStatus: deliverable?.status ?? null,
      clientRejectionReason: deliverable?.clientRejectionReason ?? null
    });

    return {
      contentPlanItemId: planItem.id,
      planItemTitle: planItem.title,
      draftId: draft?.id ?? null,
      draftTitle: draft?.title ?? null,
      draftStatus: draft?.status ?? null,
      isEligible,
      deliverableId: deliverable?.id ?? null,
      deliverableStatus: deliverable?.status ?? null,
      deliverableTitle: deliverable?.title ?? null,
      packagingState,
      canRepackage: isAdmin && Boolean(deliverable && canRepackageWorkflowBriefDeliverable(deliverable)),
      isClientReviewable: isClientReviewableDeliverableStatus(deliverable?.status)
    };
  });

  const eligibleDraftCount = items.filter((item) => item.isEligible).length;
  const packagedCount = items.filter(
    (item) => item.deliverableId && item.packagingState !== "not_eligible"
  ).length;
  const unpackagedCount = items.filter((item) => item.isEligible && !item.deliverableId).length;
  const pendingReviewCount = items.filter((item) => item.packagingState === "pending_review").length;
  const approvedByClientCount = items.filter((item) => item.packagingState === "approved").length;
  const rejectedCount = items.filter((item) => item.packagingState === "rejected").length;

  let canPackageAll = false;
  let blockReason: string | null = null;
  if (!isAdmin) {
    blockReason = "Admin access required to package deliverables.";
  } else if (!project) {
    blockReason = "Link an AI Delivery project before packaging deliverables.";
  } else if (eligibleDraftCount === 0) {
    blockReason = "Generate workflow content drafts before packaging deliverables.";
  } else {
    canPackageAll = true;
  }

  const packagingStage = computePackagingStage({
    eligibleDraftCount,
    packagedCount,
    pendingReviewCount,
    approvedByClientCount
  });

  return {
    briefId,
    hasLinkedProject: Boolean(project),
    project: project ? { id: project.id, name: project.name, targetMonth: project.targetMonth } : null,
    productionPlanId: productionPlan?.id ?? null,
    eligibleDraftCount,
    packagedCount,
    unpackagedCount,
    pendingReviewCount,
    approvedByClientCount,
    rejectedCount,
    canPackageAll,
    canManagePackaging: isAdmin,
    blockReason,
    packagingStage,
    lastPackagedAt: packagingMeta?.lastPackagedAt ?? null,
    lastRepackagedAt: packagingMeta?.lastRepackagedAt ?? null,
    items,
    deliverables: deliverables.map((deliverable) => ({
      id: deliverable.id,
      contentDraftId: deliverable.contentDraftId,
      title: deliverable.title,
      status: deliverable.status,
      deliveryType: deliverable.deliveryType,
      bodyPreview: deliverable.bodyContent ? deliverable.bodyContent.slice(0, 160) : null,
      clientRejectionReason: deliverable.clientRejectionReason,
      isWorkflowBriefDeliverable: isWorkflowBriefPackagedDeliverable(deliverable.notes, briefId),
      updatedAt: deliverable.updatedAt.toISOString()
    })),
    lineage: {
      briefId,
      productionPlanId: productionPlan?.id ?? null,
      aiDeliveryProjectId: project?.id ?? null,
      version: WORKFLOW_BRIEF_DELIVERABLE_PACKAGING_VERSION
    }
  };
}

export async function getWorkflowBriefDeliverablePackagingStatus(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<WorkflowBriefDeliverablePackagingStatus | "not_found" | "forbidden"> {
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

  const data = await loadWorkflowBriefDeliverablePackagingData(tenantId, briefId);
  if (!data) {
    return "not_found";
  }

  const isAdmin = isOwnerRole(getActiveRoles(authSession));
  return buildWorkflowBriefDeliverablePackagingStatus(briefId, data, isAdmin);
}

async function writeDeliverablePackagingMetadata(
  tx: Prisma.TransactionClient,
  input: {
    productionPlanId: string;
    planJson: unknown;
    briefId: string;
    eligibleDraftCount: number;
    packagedCount: number;
    lastPackagedAt?: string;
    lastRepackagedAt?: string;
  }
): Promise<void> {
  const existingPlanJson =
    input.planJson && typeof input.planJson === "object" && !Array.isArray(input.planJson)
      ? (input.planJson as Record<string, unknown>)
      : {};
  const existingMeta = readDeliverablePackagingFromPlanJson(input.planJson) ?? {};

  await tx.productionPlan.update({
    where: { id: input.productionPlanId },
    data: {
      planJson: {
        ...existingPlanJson,
        deliverablePackaging: {
          version: WORKFLOW_BRIEF_DELIVERABLE_PACKAGING_VERSION,
          briefId: input.briefId,
          eligibleDraftCount: input.eligibleDraftCount,
          packagedCount: input.packagedCount,
          lastPackagedAt: input.lastPackagedAt ?? existingMeta.lastPackagedAt ?? null,
          lastRepackagedAt: input.lastRepackagedAt ?? existingMeta.lastRepackagedAt ?? null
        }
      } as Prisma.InputJsonValue
    }
  });
}

async function packageWorkflowBriefDraftIntoDeliverable(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    briefId: string;
    productionPlanId: string | null;
    aiDeliveryProjectId: string;
    draft: ContentDraftPackagingRecord;
    existingDeliverable: DeliverablePackagingRecord | null;
    forceRepackage: boolean;
  }
): Promise<{ outcome: WorkflowBriefPackagingOutcome; deliverableId: string | null }> {
  if (!canPackageWorkflowBriefContentDraft(input.draft, input.briefId)) {
    return { outcome: "skipped_ineligible", deliverableId: null };
  }
  if (!input.draft.contentPlanItemId) {
    return { outcome: "skipped_ineligible", deliverableId: null };
  }

  const payload = buildWorkflowBriefDeliverablePayload({
    briefId: input.briefId,
    productionPlanId: input.productionPlanId,
    contentPlanItemId: input.draft.contentPlanItemId,
    contentDraftId: input.draft.id,
    title: input.draft.title,
    draftBody: input.draft.draftBody,
    slug: input.draft.slug
  });

  if (input.existingDeliverable) {
    if (!input.forceRepackage) {
      return { outcome: "reused", deliverableId: input.existingDeliverable.id };
    }
    if (isDeliverableLockedForRepackage(input.existingDeliverable.status)) {
      return { outcome: "skipped_locked", deliverableId: input.existingDeliverable.id };
    }

    const updated = await tx.aiDeliveryDeliverable.update({
      where: { id: input.existingDeliverable.id },
      data: {
        title: payload.title,
        bodyContent: payload.bodyContent,
        description: payload.description,
        deliveryType: payload.deliveryType,
        notes: payload.notes,
        briefId: payload.briefId,
        productionPlanId: payload.productionPlanId,
        contentDraftId: payload.contentDraftId,
        clientRejectionReason: null
      },
      select: { id: true }
    });
    return { outcome: "updated", deliverableId: updated.id };
  }

  const created = await tx.aiDeliveryDeliverable.create({
    data: {
      tenantId: input.tenantId,
      aiDeliveryProjectId: input.aiDeliveryProjectId,
      briefId: payload.briefId,
      productionPlanId: payload.productionPlanId,
      contentDraftId: payload.contentDraftId,
      title: payload.title,
      bodyContent: payload.bodyContent,
      description: payload.description,
      deliveryType: payload.deliveryType,
      status: payload.status,
      notes: payload.notes,
      isArchived: false
    },
    select: { id: true }
  });
  return { outcome: "created", deliverableId: created.id };
}

export async function packageAllWorkflowBriefDeliverables(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<
  | {
      packaged: boolean;
      outcomes: ReturnType<typeof summarizeBatchPackagingResult>;
      status: WorkflowBriefDeliverablePackagingStatus;
    }
  | "not_found"
  | "forbidden"
  | "missing_project"
  | "no_eligible_drafts"
> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const data = await loadWorkflowBriefDeliverablePackagingData(tenantId, briefId);
  if (!data) {
    return "not_found";
  }
  if (!data.project) {
    return "missing_project";
  }

  const preStatus = buildWorkflowBriefDeliverablePackagingStatus(briefId, data, true);
  if (preStatus.eligibleDraftCount === 0) {
    return "no_eligible_drafts";
  }

  const outcomeList: WorkflowBriefPackagingOutcome[] = [];
  const finishedAtIso = new Date().toISOString();

  await prisma.$transaction(async (tx) => {
    for (const planItem of data.seedItems) {
      const draftSummary = data.draftByItemId.get(planItem.id);
      if (!draftSummary) {
        outcomeList.push("skipped_missing_draft");
        continue;
      }

      const draft = (await tx.aiDeliveryContentDraft.findFirst({
        where: {
          id: draftSummary.id,
          tenantId,
          aiDeliveryProjectId: data.project!.id,
          isArchived: false
        },
        select: contentDraftPackagingSelect
      })) as ContentDraftPackagingRecord | null;

      if (!draft) {
        outcomeList.push("skipped_missing_draft");
        continue;
      }

      const existing = data.deliverableByDraftId.get(draft.id) ?? null;
      const result = await packageWorkflowBriefDraftIntoDeliverable(tx, {
        tenantId,
        briefId,
        productionPlanId: data.productionPlan?.id ?? null,
        aiDeliveryProjectId: data.project!.id,
        draft,
        existingDeliverable: existing,
        forceRepackage: false
      });
      outcomeList.push(result.outcome);
    }

    if (data.productionPlan?.id) {
      const refreshed = await loadWorkflowBriefDeliverablePackagingData(tenantId, briefId);
      const status = refreshed
        ? buildWorkflowBriefDeliverablePackagingStatus(briefId, refreshed, true)
        : null;
      await writeDeliverablePackagingMetadata(tx, {
        productionPlanId: data.productionPlan.id,
        planJson: data.productionPlan.planJson,
        briefId,
        eligibleDraftCount: status?.eligibleDraftCount ?? 0,
        packagedCount: status?.packagedCount ?? 0,
        lastPackagedAt: finishedAtIso
      });
    }
  });

  const outcomes = summarizeBatchPackagingResult(outcomeList);
  if (outcomes.created === 0 && outcomes.reused === 0 && outcomes.updated === 0) {
    return "no_eligible_drafts";
  }

  const status = await getWorkflowBriefDeliverablePackagingStatus(authSession, briefId);
  if (status === "not_found" || status === "forbidden") {
    return status;
  }

  return {
    packaged: true,
    outcomes,
    status
  };
}

export async function repackageWorkflowBriefDeliverable(
  authSession: AuthResolvedSessionContext,
  briefId: string,
  input: { contentDraftId?: string | null; contentPlanItemId?: string | null }
): Promise<
  | {
      repackaged: boolean;
      outcome: WorkflowBriefPackagingOutcome;
      deliverableId: string | null;
      status: WorkflowBriefDeliverablePackagingStatus;
    }
  | "not_found"
  | "forbidden"
  | "missing_project"
  | "invalid_item"
  | "missing_draft"
  | "skipped_locked"
> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const contentDraftId = input.contentDraftId?.trim() || null;
  const contentPlanItemId = input.contentPlanItemId?.trim() || null;
  if (!contentDraftId && !contentPlanItemId) {
    return "invalid_item";
  }

  const data = await loadWorkflowBriefDeliverablePackagingData(tenantId, briefId);
  if (!data) {
    return "not_found";
  }
  if (!data.project) {
    return "missing_project";
  }

  let draftId = contentDraftId;
  if (!draftId && contentPlanItemId) {
    const seededItem = data.seedItems.find((item) => item.id === contentPlanItemId);
    if (!seededItem) {
      return "invalid_item";
    }
    draftId = data.draftByItemId.get(contentPlanItemId)?.id ?? null;
  }

  if (!draftId) {
    return "missing_draft";
  }

  const draft = await loadFullDraftForPackaging(tenantId, data.project.id, draftId);
  if (!draft) {
    return "missing_draft";
  }

  const existing = data.deliverableByDraftId.get(draft.id) ?? null;
  const finishedAtIso = new Date().toISOString();
  let deliverableId: string | null = null;

  const txResult = await prisma.$transaction(async (tx) => {
    const result = await packageWorkflowBriefDraftIntoDeliverable(tx, {
      tenantId,
      briefId,
      productionPlanId: data.productionPlan?.id ?? null,
      aiDeliveryProjectId: data.project!.id,
      draft,
      existingDeliverable: existing,
      forceRepackage: true
    });

    if (data.productionPlan?.id && result.outcome === "updated") {
      const refreshed = await loadWorkflowBriefDeliverablePackagingData(tenantId, briefId);
      const status = refreshed
        ? buildWorkflowBriefDeliverablePackagingStatus(briefId, refreshed, true)
        : null;
      await writeDeliverablePackagingMetadata(tx, {
        productionPlanId: data.productionPlan.id,
        planJson: data.productionPlan.planJson,
        briefId,
        eligibleDraftCount: status?.eligibleDraftCount ?? 0,
        packagedCount: status?.packagedCount ?? 0,
        lastRepackagedAt: finishedAtIso
      });
    }

    return result;
  });

  const outcome = txResult.outcome;
  deliverableId = txResult.deliverableId;

  if (outcome === "skipped_locked") {
    return "skipped_locked";
  }
  if (outcome === "skipped_ineligible" || outcome === "skipped_missing_draft") {
    return "missing_draft";
  }

  const status = await getWorkflowBriefDeliverablePackagingStatus(authSession, briefId);
  if (status === "not_found" || status === "forbidden") {
    return status;
  }

  return {
    repackaged: outcome === "created" || outcome === "updated",
    outcome,
    deliverableId,
    status
  };
}

export async function sendWorkflowBriefDeliverableForClientReview(
  authSession: AuthResolvedSessionContext,
  briefId: string,
  deliverableId: string
): Promise<
  | {
      deliverable: {
        id: string;
        title: string;
        status: string;
        bodyContent: string;
      };
    }
  | "not_found"
  | "forbidden"
  | "invalid_deliverable"
> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const brief = await getBriefForAccess(briefId, tenantId);
  if (!brief) {
    return "not_found";
  }

  const data = await loadWorkflowBriefDeliverablePackagingData(tenantId, briefId);
  if (!data?.project) {
    return "not_found";
  }

  const deliverable = data.deliverables.find((row) => row.id === deliverableId);
  if (!deliverable || !isWorkflowBriefPackagedDeliverable(deliverable.notes, briefId)) {
    return "invalid_deliverable";
  }

  const result = await sendAiDeliveryDeliverableForClientReview(
    authSession,
    data.project.id,
    deliverableId
  );
  if (!result) {
    return "invalid_deliverable";
  }

  return {
    deliverable: result.deliverable
  };
}

const articleImageSetSelect = {
  id: true,
  contentDraftId: true,
  title: true,
  prompt: true,
  styleNotes: true,
  status: true,
  previewImageUrl: true,
  finalImageUrl: true,
  notes: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true
} as const;

type ArticleImageSetRecord = {
  id: string;
  contentDraftId: string;
  title: string;
  prompt: string;
  styleNotes: string | null;
  status: string;
  previewImageUrl: string | null;
  finalImageUrl: string | null;
  notes: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function readImageSetFromPlanJson(planJson: unknown): {
  version?: string;
  briefId?: string;
  lastPreparedAt?: string;
  lastRefreshedAt?: string;
  preparedCount?: number;
} | null {
  if (!planJson || typeof planJson !== "object" || Array.isArray(planJson)) {
    return null;
  }
  const record = planJson as Record<string, unknown>;
  const imageSets = record.imageSets;
  if (!imageSets || typeof imageSets !== "object" || Array.isArray(imageSets)) {
    return null;
  }
  return imageSets as {
    version?: string;
    briefId?: string;
    lastPreparedAt?: string;
    lastRefreshedAt?: string;
    preparedCount?: number;
  };
}

function readReleasePrepFromPlanJson(planJson: unknown): {
  version?: string;
  briefId?: string;
  preparedAt?: string;
  publicationTargetId?: string | null;
  publicationTargetLabel?: string | null;
  packageCount?: number;
} | null {
  if (!planJson || typeof planJson !== "object" || Array.isArray(planJson)) {
    return null;
  }
  const record = planJson as Record<string, unknown>;
  const releasePrep = record.releasePrep;
  if (!releasePrep || typeof releasePrep !== "object" || Array.isArray(releasePrep)) {
    return null;
  }
  return releasePrep as {
    version?: string;
    briefId?: string;
    preparedAt?: string;
    publicationTargetId?: string | null;
    publicationTargetLabel?: string | null;
    packageCount?: number;
  };
}

function readFinalReleasePackageFromPlanJson(planJson: unknown): WorkflowBriefFinalReleasePackageRecord | null {
  if (!planJson || typeof planJson !== "object" || Array.isArray(planJson)) {
    return null;
  }
  const record = planJson as Record<string, unknown>;
  const releasePackage = record.releasePackage;
  if (!releasePackage || typeof releasePackage !== "object" || Array.isArray(releasePackage)) {
    return null;
  }
  const parsed = releasePackage as WorkflowBriefFinalReleasePackageRecord;
  if (parsed.version !== WORKFLOW_BRIEF_FINAL_RELEASE_PACKAGE_VERSION || parsed.kind !== "final_release_package") {
    return null;
  }
  return parsed;
}

const LEGACY_PUBLICATION_HANDOFF_PLAN_JSON_KIND = "release_execution_result";

function readPublicationHandoffFromPlanJson(
  planJson: unknown
): WorkflowBriefPublicationHandoffRecord | null {
  if (!planJson || typeof planJson !== "object" || Array.isArray(planJson)) {
    return null;
  }
  const record = planJson as Record<string, unknown>;
  const candidates = [record.publicationHandoff, record.releaseExecution];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      continue;
    }
    const parsed = candidate as WorkflowBriefPublicationHandoffRecord & { kind?: string; version?: string };
    const versionMatches = parsed.version === WORKFLOW_BRIEF_PUBLICATION_HANDOFF_VERSION;
    const kindMatches =
      parsed.kind === "publication_handoff_result" || parsed.kind === LEGACY_PUBLICATION_HANDOFF_PLAN_JSON_KIND;
    if (versionMatches && kindMatches) {
      return parsed;
    }
  }
  return null;
}

async function loadWorkflowBriefPackageExecutionData(tenantId: string, briefId: string) {
  const packagingData = await loadWorkflowBriefDeliverablePackagingData(tenantId, briefId);
  if (!packagingData) {
    return null;
  }

  let articleImages: ArticleImageSetRecord[] = [];
  const imageApprovalsByDeliverableId = new Map<
    string,
    Array<{ articleImageId: string; status: string }>
  >();

  if (packagingData.project) {
    articleImages = (await prisma.aiDeliveryArticleImage.findMany({
      where: {
        tenantId,
        aiDeliveryProjectId: packagingData.project.id,
        isArchived: false
      },
      select: articleImageSetSelect,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
    })) as ArticleImageSetRecord[];

    const deliverableIds = packagingData.deliverables.map((row) => row.id);
    if (deliverableIds.length > 0) {
      const approvals = await prisma.aiDeliveryDeliverableImageApproval.findMany({
        where: { tenantId, deliverableId: { in: deliverableIds } },
        select: { deliverableId: true, articleImageId: true, status: true }
      });
      for (const approval of approvals) {
        const existing = imageApprovalsByDeliverableId.get(approval.deliverableId) ?? [];
        existing.push({ articleImageId: approval.articleImageId, status: approval.status });
        imageApprovalsByDeliverableId.set(approval.deliverableId, existing);
      }
    }
  }

  const imageByDraftId = new Map<string, ArticleImageSetRecord>();
  for (const image of articleImages) {
    if (!isWorkflowBriefArticleImage(image.notes, briefId)) {
      continue;
    }
    if (!imageByDraftId.has(image.contentDraftId)) {
      imageByDraftId.set(image.contentDraftId, image);
    }
  }

  const publicationTarget = packagingData.brief
    ? await resolvePublicationTargetForClient(tenantId, packagingData.brief.clientId, null)
    : null;

  return {
    ...packagingData,
    articleImages,
    imageByDraftId,
    imageApprovalsByDeliverableId,
    imageSetMeta: readImageSetFromPlanJson(packagingData.productionPlan?.planJson),
    releasePrepMeta: readReleasePrepFromPlanJson(packagingData.productionPlan?.planJson),
    finalReleasePackageMeta: readFinalReleasePackageFromPlanJson(packagingData.productionPlan?.planJson),
    publicationHandoffMeta: readPublicationHandoffFromPlanJson(packagingData.productionPlan?.planJson),
    publicationTarget
  };
}

async function writeImageSetMetadata(
  tx: Prisma.TransactionClient,
  input: {
    productionPlanId: string;
    planJson: unknown;
    briefId: string;
    preparedCount: number;
    lastPreparedAt?: string;
    lastRefreshedAt?: string;
  }
): Promise<void> {
  const existingPlanJson =
    input.planJson && typeof input.planJson === "object" && !Array.isArray(input.planJson)
      ? (input.planJson as Record<string, unknown>)
      : {};
  const existingMeta = readImageSetFromPlanJson(input.planJson) ?? {};

  await tx.productionPlan.update({
    where: { id: input.productionPlanId },
    data: {
      planJson: {
        ...existingPlanJson,
        imageSets: {
          version: WORKFLOW_BRIEF_IMAGE_SET_VERSION,
          briefId: input.briefId,
          preparedCount: input.preparedCount,
          lastPreparedAt: input.lastPreparedAt ?? existingMeta.lastPreparedAt ?? null,
          lastRefreshedAt: input.lastRefreshedAt ?? existingMeta.lastRefreshedAt ?? null
        }
      } as Prisma.InputJsonValue
    }
  });
}

async function writeReleasePrepMetadata(
  tx: Prisma.TransactionClient,
  input: {
    productionPlanId: string;
    planJson: unknown;
    summary: Record<string, unknown>;
  }
): Promise<void> {
  const existingPlanJson =
    input.planJson && typeof input.planJson === "object" && !Array.isArray(input.planJson)
      ? (input.planJson as Record<string, unknown>)
      : {};

  await tx.productionPlan.update({
    where: { id: input.productionPlanId },
    data: {
      planJson: {
        ...existingPlanJson,
        releasePrep: input.summary
      } as Prisma.InputJsonValue
    }
  });
}

async function persistWorkflowBriefImageCandidate(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    briefId: string;
    aiDeliveryProjectId: string;
    draft: ContentDraftPackagingRecord;
    planItem: { id: string; title: string; targetKeyword: string | null };
    briefTitle: string;
    goal: string | null;
    existingImage: ArticleImageSetRecord | null;
    deliverable: DeliverablePackagingRecord | null;
    forceRefresh: boolean;
  }
): Promise<{ outcome: WorkflowBriefImageSetOutcome; articleImageId: string | null }> {
  if (!canPrepareWorkflowBriefImageSetFromDraft(input.draft, input.briefId) || !input.draft.contentPlanItemId) {
    return { outcome: "skipped_ineligible", articleImageId: null };
  }

  const candidate = buildWorkflowBriefImageCandidate({
    briefId: input.briefId,
    contentPlanItemId: input.planItem.id,
    contentDraftId: input.draft.id,
    draftTitle: input.draft.title,
    targetKeyword: input.planItem.targetKeyword,
    briefTitle: input.briefTitle,
    goal: input.goal
  });

  if (input.existingImage) {
    if (!input.forceRefresh) {
      return { outcome: "reused", articleImageId: input.existingImage.id };
    }
    if (isArticleImageLockedForRefresh(input.existingImage.status)) {
      return { outcome: "skipped_locked", articleImageId: input.existingImage.id };
    }

    const updated = await tx.aiDeliveryArticleImage.update({
      where: { id: input.existingImage.id },
      data: {
        title: candidate.title,
        prompt: candidate.prompt,
        styleNotes: candidate.styleNotes,
        status: candidate.status,
        notes: candidate.notes
      },
      select: { id: true }
    });

    if (input.deliverable) {
      await tx.aiDeliveryDeliverable.update({
        where: { id: input.deliverable.id },
        data: { articleImageId: updated.id }
      });
    }

    return { outcome: "updated", articleImageId: updated.id };
  }

  const created = await tx.aiDeliveryArticleImage.create({
    data: {
      tenantId: input.tenantId,
      aiDeliveryProjectId: input.aiDeliveryProjectId,
      contentDraftId: input.draft.id,
      title: candidate.title,
      prompt: candidate.prompt,
      styleNotes: candidate.styleNotes,
      status: candidate.status,
      notes: candidate.notes,
      isArchived: false
    },
    select: { id: true }
  });

  if (input.deliverable) {
    await tx.aiDeliveryDeliverable.update({
      where: { id: input.deliverable.id },
      data: { articleImageId: created.id }
    });
  }

  return { outcome: "created", articleImageId: created.id };
}

export type WorkflowBriefImageSetStatus = {
  briefId: string;
  hasLinkedProject: boolean;
  project: { id: string; name: string; targetMonth: Date } | null;
  eligibleCount: number;
  preparedCount: number;
  missingCount: number;
  lockedCount: number;
  canPrepareAll: boolean;
  canManageImageSets: boolean;
  blockReason: string | null;
  imageSetStage: WorkflowBriefImageSetStage;
  lastPreparedAt: string | null;
  lastRefreshedAt: string | null;
  items: Array<{
    contentPlanItemId: string;
    planItemTitle: string;
    draftId: string | null;
    deliverableId: string | null;
    articleImageId: string | null;
    imageStatus: string | null;
    imageSetState: ReturnType<typeof classifyImageSetItemState>;
    canRefresh: boolean;
  }>;
  lineage: {
    briefId: string;
    productionPlanId: string | null;
    aiDeliveryProjectId: string | null;
    version: string;
  };
};

function buildWorkflowBriefImageSetStatus(
  briefId: string,
  data: NonNullable<Awaited<ReturnType<typeof loadWorkflowBriefPackageExecutionData>>>,
  isAdmin: boolean
): WorkflowBriefImageSetStatus {
  const items = data.seedItems.map((planItem) => {
    const draft = data.draftByItemId.get(planItem.id) ?? null;
    const isEligible = draft
      ? canPrepareWorkflowBriefImageSetFromDraft(
          {
            notes: draft.notes,
            draftBody: draft.draftBody,
            isArchived: draft.isArchived,
            contentPlanItemId: draft.contentPlanItemId
          },
          briefId
        )
      : false;
    const image = draft ? data.imageByDraftId.get(draft.id) ?? null : null;
    const deliverable = draft ? data.deliverableByDraftId.get(draft.id) ?? null : null;
    const imageSetState = classifyImageSetItemState({
      isEligible,
      hasImage: Boolean(image),
      imageStatus: image?.status ?? null
    });

    return {
      contentPlanItemId: planItem.id,
      planItemTitle: planItem.title,
      draftId: draft?.id ?? null,
      deliverableId: deliverable?.id ?? null,
      articleImageId: image?.id ?? null,
      imageStatus: image?.status ?? null,
      imageSetState,
      canRefresh: isAdmin && Boolean(image && !isArticleImageLockedForRefresh(image.status))
    };
  });

  const eligibleCount = items.filter((item) => item.imageSetState !== "not_eligible").length;
  const preparedCount = items.filter(
    (item) => item.imageSetState !== "not_eligible" && item.imageSetState !== "missing"
  ).length;
  const missingCount = items.filter((item) => item.imageSetState === "missing").length;
  const lockedCount = items.filter((item) => item.imageSetState === "locked" || item.imageSetState === "approved").length;

  let canPrepareAll = false;
  let blockReason: string | null = null;
  if (!isAdmin) {
    blockReason = "Admin access required to prepare image sets.";
  } else if (!data.project) {
    blockReason = "Link an AI Delivery project before preparing image sets.";
  } else if (eligibleCount === 0) {
    blockReason = "Generate workflow content drafts before preparing image sets.";
  } else {
    canPrepareAll = true;
  }

  const packagingStatus = buildWorkflowBriefDeliverablePackagingStatus(briefId, data, isAdmin);
  const imageSetStage = computeImageSetStage({
    eligibleCount,
    preparedCount,
    pendingReviewCount: packagingStatus.pendingReviewCount,
    reviewCompleteCount: packagingStatus.approvedByClientCount
  });

  return {
    briefId,
    hasLinkedProject: Boolean(data.project),
    project: data.project ? { id: data.project.id, name: data.project.name, targetMonth: data.project.targetMonth } : null,
    eligibleCount,
    preparedCount,
    missingCount,
    lockedCount,
    canPrepareAll,
    canManageImageSets: isAdmin,
    blockReason,
    imageSetStage,
    lastPreparedAt: data.imageSetMeta?.lastPreparedAt ?? null,
    lastRefreshedAt: data.imageSetMeta?.lastRefreshedAt ?? null,
    items,
    lineage: {
      briefId,
      productionPlanId: data.productionPlan?.id ?? null,
      aiDeliveryProjectId: data.project?.id ?? null,
      version: WORKFLOW_BRIEF_IMAGE_SET_VERSION
    }
  };
}

export type WorkflowBriefPackageCompletenessStatus = {
  briefId: string;
  eligibleItemCount: number;
  completeItemCount: number;
  readyForClientReviewCount: number;
  clientReviewInProgressCount: number;
  overallStage: WorkflowBriefPackageCompletenessStage;
  publicationTargetAvailable: boolean;
  publicationTargetLabel: string | null;
  releasePrepStage: WorkflowBriefReleasePrepStage;
  releasePrepared: boolean;
  lastReleasePreparedAt: string | null;
  releasePackageStage: WorkflowBriefFinalReleasePackageStage;
  releasePackageFinalized: boolean;
  lastReleasePackageFinalizedAt: string | null;
  packageChangedSinceFinalize: boolean;
  canFinalizeReleasePackage: boolean;
  releasePackageBlockReason: string | null;
  missingRequirements: string[];
  items: Array<{
    contentPlanItemId: string;
    planItemTitle: string;
    textDeliverableId: string | null;
    textDeliverableStatus: string | null;
    articleImageId: string | null;
    imageStatus: string | null;
    imageApprovalStatus: string | null;
    hasTextDeliverable: boolean;
    hasImageCandidate: boolean;
    textClientReviewed: boolean;
    imageClientReviewed: boolean;
    readyForClientReview: boolean;
    packageComplete: boolean;
    completenessStage: WorkflowBriefPackageCompletenessStage;
  }>;
};

function buildWorkflowBriefPackageCompletenessStatus(
  briefId: string,
  data: NonNullable<Awaited<ReturnType<typeof loadWorkflowBriefPackageExecutionData>>>
): WorkflowBriefPackageCompletenessStatus {
  const missingRequirements: string[] = [];
  const releasePrepared = Boolean(data.releasePrepMeta?.preparedAt);
  const publicationTargetAvailable = Boolean(data.publicationTarget);
  const publicationTargetLabel = data.publicationTarget?.label ?? null;

  const items = data.seedItems.map((planItem) => {
    const draft = data.draftByItemId.get(planItem.id) ?? null;
    const deliverable = draft ? data.deliverableByDraftId.get(draft.id) ?? null : null;
    const image = draft ? data.imageByDraftId.get(draft.id) ?? null : null;
    const approvals = deliverable ? data.imageApprovalsByDeliverableId.get(deliverable.id) ?? [] : [];
    const imageApproval = image ? approvals.find((row) => row.articleImageId === image.id) ?? null : null;

    const completeness = computePackageItemCompleteness({
      hasTextDeliverable: Boolean(deliverable),
      textDeliverableStatus: deliverable?.status ?? null,
      hasImageCandidate: Boolean(image),
      imageStatus: image?.status ?? null,
      imageApprovalStatus: imageApproval?.status ?? null,
      deliverableStatus: deliverable?.status ?? null
    });

    return {
      contentPlanItemId: planItem.id,
      planItemTitle: planItem.title,
      textDeliverableId: deliverable?.id ?? null,
      textDeliverableStatus: deliverable?.status ?? null,
      articleImageId: image?.id ?? null,
      imageStatus: image?.status ?? null,
      imageApprovalStatus: imageApproval?.status ?? null,
      ...completeness
    };
  });

  const eligibleItemCount = items.filter((item) => item.hasTextDeliverable || item.hasImageCandidate).length;
  const completeItemCount = items.filter((item) => item.packageComplete).length;
  const readyForClientReviewCount = items.filter((item) => item.readyForClientReview).length;
  const clientReviewInProgressCount = items.filter(
    (item) => item.completenessStage === "client_review_in_progress"
  ).length;

  if (!publicationTargetAvailable) {
    missingRequirements.push("Publication target is not configured for this client.");
  }
  if (items.some((item) => !item.hasTextDeliverable)) {
    missingRequirements.push("Some items are missing packaged text deliverables.");
  }
  if (items.some((item) => !item.hasImageCandidate)) {
    missingRequirements.push("Some items are missing image set candidates.");
  }
  if (completeItemCount < items.length) {
    missingRequirements.push("Not all text + image packages are client-reviewed and complete.");
  }

  const itemStages = items.map((item) => item.completenessStage);
  const overallStage = computeOverallPackageCompletenessStage({
    itemStages,
    eligibleItemCount: data.seedItems.length,
    completeItemCount,
    publicationTargetAvailable,
    releasePrepared
  });

  const releasePrepStage = computeReleasePrepStage({
    packageComplete: completeItemCount === data.seedItems.length && data.seedItems.length > 0,
    publicationTargetAvailable,
    releasePrepared
  });

  const packageFingerprint = computeFinalReleasePackageFingerprint(
    buildFinalReleasePackageFingerprintItems(data)
  );
  const packageComplete = completeItemCount === data.seedItems.length && data.seedItems.length > 0;
  const releasePackageFinalized = Boolean(data.finalReleasePackageMeta?.finalizedAt);
  const storedFinalizeFingerprint = data.finalReleasePackageMeta?.packageFingerprint ?? null;
  const packageChangedSinceFinalize = Boolean(
    releasePackageFinalized && storedFinalizeFingerprint && storedFinalizeFingerprint !== packageFingerprint
  );
  const finalizeGate = canFinalizeWorkflowBriefReleasePackage({
    releasePrepared,
    packageComplete,
    isAdmin: true,
    alreadyFinalized: releasePackageFinalized,
    packageChangedSinceFinalize
  });
  const releasePackageStage = computeFinalReleasePackageStage({
    releasePrepared,
    releasePackageFinalized,
    canFinalize: finalizeGate.allowed,
    packageChangedSinceFinalize
  });

  return {
    briefId,
    eligibleItemCount,
    completeItemCount,
    readyForClientReviewCount,
    clientReviewInProgressCount,
    overallStage,
    publicationTargetAvailable,
    publicationTargetLabel,
    releasePrepStage,
    releasePrepared,
    lastReleasePreparedAt: data.releasePrepMeta?.preparedAt ?? null,
    releasePackageStage,
    releasePackageFinalized,
    lastReleasePackageFinalizedAt: data.finalReleasePackageMeta?.finalizedAt ?? null,
    packageChangedSinceFinalize,
    canFinalizeReleasePackage: finalizeGate.allowed,
    releasePackageBlockReason: finalizeGate.blockReason,
    missingRequirements,
    items
  };
}

export async function getWorkflowBriefImageSetStatus(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<WorkflowBriefImageSetStatus | "not_found" | "forbidden"> {
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

  const data = await loadWorkflowBriefPackageExecutionData(tenantId, briefId);
  if (!data) {
    return "not_found";
  }

  return buildWorkflowBriefImageSetStatus(briefId, data, isOwnerRole(getActiveRoles(authSession)));
}

export async function getWorkflowBriefPackageCompleteness(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<WorkflowBriefPackageCompletenessStatus | "not_found" | "forbidden"> {
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

  const data = await loadWorkflowBriefPackageExecutionData(tenantId, briefId);
  if (!data) {
    return "not_found";
  }

  return buildWorkflowBriefPackageCompletenessStatus(briefId, data);
}

export async function prepareAllWorkflowBriefImageSets(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<
  | {
      prepared: boolean;
      outcomes: ReturnType<typeof summarizeImageSetBatchResult>;
      status: WorkflowBriefImageSetStatus;
      completeness: WorkflowBriefPackageCompletenessStatus;
    }
  | "not_found"
  | "forbidden"
  | "missing_project"
  | "no_eligible_drafts"
> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const data = await loadWorkflowBriefPackageExecutionData(tenantId, briefId);
  if (!data) {
    return "not_found";
  }
  if (!data.project) {
    return "missing_project";
  }

  const preStatus = buildWorkflowBriefImageSetStatus(briefId, data, true);
  if (preStatus.eligibleCount === 0) {
    return "no_eligible_drafts";
  }

  const outcomeList: WorkflowBriefImageSetOutcome[] = [];
  const finishedAtIso = new Date().toISOString();

  await prisma.$transaction(async (tx) => {
    for (const planItem of data.seedItems) {
      const draftSummary = data.draftByItemId.get(planItem.id);
      if (!draftSummary) {
        outcomeList.push("skipped_missing_draft");
        continue;
      }

      const draft = (await tx.aiDeliveryContentDraft.findFirst({
        where: {
          id: draftSummary.id,
          tenantId,
          aiDeliveryProjectId: data.project!.id,
          isArchived: false
        },
        select: contentDraftPackagingSelect
      })) as ContentDraftPackagingRecord | null;

      if (!draft) {
        outcomeList.push("skipped_missing_draft");
        continue;
      }

      const existing = data.imageByDraftId.get(draft.id) ?? null;
      const deliverable = data.deliverableByDraftId.get(draft.id) ?? null;
      const result = await persistWorkflowBriefImageCandidate(tx, {
        tenantId,
        briefId,
        aiDeliveryProjectId: data.project!.id,
        draft,
        planItem,
        briefTitle: data.brief.title,
        goal: data.brief.goal,
        existingImage: existing,
        deliverable,
        forceRefresh: false
      });
      outcomeList.push(result.outcome);
    }

    if (data.productionPlan?.id) {
      const refreshed = await loadWorkflowBriefPackageExecutionData(tenantId, briefId);
      const status = refreshed ? buildWorkflowBriefImageSetStatus(briefId, refreshed, true) : null;
      await writeImageSetMetadata(tx, {
        productionPlanId: data.productionPlan.id,
        planJson: data.productionPlan.planJson,
        briefId,
        preparedCount: status?.preparedCount ?? 0,
        lastPreparedAt: finishedAtIso
      });
    }
  });

  const outcomes = summarizeImageSetBatchResult(outcomeList);
  if (outcomes.created === 0 && outcomes.reused === 0 && outcomes.updated === 0) {
    return "no_eligible_drafts";
  }

  const status = await getWorkflowBriefImageSetStatus(authSession, briefId);
  const completeness = await getWorkflowBriefPackageCompleteness(authSession, briefId);
  if (status === "not_found") {
    return "not_found";
  }
  if (status === "forbidden") {
    return "forbidden";
  }
  if (completeness === "not_found") {
    return "not_found";
  }
  if (completeness === "forbidden") {
    return "forbidden";
  }

  return { prepared: true, outcomes, status, completeness };
}

export async function refreshWorkflowBriefImageSet(
  authSession: AuthResolvedSessionContext,
  briefId: string,
  input: { contentDraftId?: string | null; contentPlanItemId?: string | null }
): Promise<
  | {
      refreshed: boolean;
      outcome: WorkflowBriefImageSetOutcome;
      articleImageId: string | null;
      status: WorkflowBriefImageSetStatus;
      completeness: WorkflowBriefPackageCompletenessStatus;
    }
  | "not_found"
  | "forbidden"
  | "missing_project"
  | "invalid_item"
  | "missing_draft"
  | "skipped_locked"
> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const contentDraftId = input.contentDraftId?.trim() || null;
  const contentPlanItemId = input.contentPlanItemId?.trim() || null;
  if (!contentDraftId && !contentPlanItemId) {
    return "invalid_item";
  }

  const data = await loadWorkflowBriefPackageExecutionData(tenantId, briefId);
  if (!data) {
    return "not_found";
  }
  if (!data.project) {
    return "missing_project";
  }

  let draftId = contentDraftId;
  let planItem = contentPlanItemId
    ? data.seedItems.find((item) => item.id === contentPlanItemId) ?? null
    : null;

  if (!draftId && contentPlanItemId) {
    if (!planItem) {
      return "invalid_item";
    }
    draftId = data.draftByItemId.get(contentPlanItemId)?.id ?? null;
  }

  if (!draftId) {
    return "missing_draft";
  }

  if (!planItem) {
    const draftSummary = [...data.draftByItemId.values()].find((row) => row.id === draftId);
    planItem = draftSummary?.contentPlanItemId
      ? data.seedItems.find((item) => item.id === draftSummary.contentPlanItemId) ?? null
      : null;
  }

  if (!planItem) {
    return "invalid_item";
  }

  const draft = await loadFullDraftForPackaging(tenantId, data.project.id, draftId);
  if (!draft) {
    return "missing_draft";
  }

  const existing = data.imageByDraftId.get(draft.id) ?? null;
  const deliverable = data.deliverableByDraftId.get(draft.id) ?? null;
  const finishedAtIso = new Date().toISOString();

  const txResult = await prisma.$transaction(async (tx) => {
    const result = await persistWorkflowBriefImageCandidate(tx, {
      tenantId,
      briefId,
      aiDeliveryProjectId: data.project!.id,
      draft,
      planItem: planItem!,
      briefTitle: data.brief.title,
      goal: data.brief.goal,
      existingImage: existing,
      deliverable,
      forceRefresh: true
    });

    if (data.productionPlan?.id && result.outcome === "updated") {
      const refreshed = await loadWorkflowBriefPackageExecutionData(tenantId, briefId);
      const status = refreshed ? buildWorkflowBriefImageSetStatus(briefId, refreshed, true) : null;
      await writeImageSetMetadata(tx, {
        productionPlanId: data.productionPlan.id,
        planJson: data.productionPlan.planJson,
        briefId,
        preparedCount: status?.preparedCount ?? 0,
        lastRefreshedAt: finishedAtIso
      });
    }

    return result;
  });

  if (txResult.outcome === "skipped_locked") {
    return "skipped_locked";
  }
  if (txResult.outcome === "skipped_ineligible" || txResult.outcome === "skipped_missing_draft") {
    return "missing_draft";
  }

  const status = await getWorkflowBriefImageSetStatus(authSession, briefId);
  const completeness = await getWorkflowBriefPackageCompleteness(authSession, briefId);
  if (status === "not_found") {
    return "not_found";
  }
  if (status === "forbidden") {
    return "forbidden";
  }
  if (completeness === "not_found") {
    return "not_found";
  }
  if (completeness === "forbidden") {
    return "forbidden";
  }

  return {
    refreshed: txResult.outcome === "created" || txResult.outcome === "updated",
    outcome: txResult.outcome,
    articleImageId: txResult.articleImageId,
    status,
    completeness
  };
}

export async function getWorkflowBriefReleasePrepSummary(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<
  | (WorkflowBriefPackageCompletenessStatus & {
      publishablePackageSummary: Record<string, unknown> | null;
    })
  | "not_found"
  | "forbidden"
> {
  const completeness = await getWorkflowBriefPackageCompleteness(authSession, briefId);
  if (completeness === "not_found" || completeness === "forbidden") {
    return completeness;
  }

  const tenantId = getActiveTenantId(authSession);
  const data = tenantId ? await loadWorkflowBriefPackageExecutionData(tenantId, briefId) : null;
  const planJson = data?.productionPlan?.planJson;
  const publishablePackageSummary =
    planJson && typeof planJson === "object" && !Array.isArray(planJson)
      ? ((planJson as Record<string, unknown>).releasePrep as Record<string, unknown> | undefined) ?? null
      : null;

  return {
    ...completeness,
    publishablePackageSummary
  };
}

export async function prepareWorkflowBriefRelease(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<
  | {
      prepared: boolean;
      releasePrepStage: WorkflowBriefReleasePrepStage;
      publishablePackageSummary: Record<string, unknown>;
      completeness: WorkflowBriefPackageCompletenessStatus;
    }
  | "not_found"
  | "forbidden"
  | "missing_project"
  | "not_ready"
  | "publication_target_missing"
> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const data = await loadWorkflowBriefPackageExecutionData(tenantId, briefId);
  if (!data) {
    return "not_found";
  }
  if (!data.project) {
    return "missing_project";
  }

  const completeness = buildWorkflowBriefPackageCompletenessStatus(briefId, data);
  if (completeness.completeItemCount < data.seedItems.length || data.seedItems.length === 0) {
    return "not_ready";
  }

  if (!data.publicationTarget) {
    return "publication_target_missing";
  }

  const packages = data.seedItems
    .map((planItem) => {
      const draft = data.draftByItemId.get(planItem.id);
      const deliverable = draft ? data.deliverableByDraftId.get(draft.id) : null;
      const image = draft ? data.imageByDraftId.get(draft.id) : null;
      if (!draft || !deliverable || !image) {
        return null;
      }
      return {
        contentPlanItemId: planItem.id,
        planItemTitle: planItem.title,
        contentDraftId: draft.id,
        textDeliverableId: deliverable.id,
        articleImageId: image.id,
        textTitle: deliverable.title,
        bodyPreview: deliverable.bodyContent ?? draft.draftBody,
        imageTitle: image.title,
        imagePromptPreview: image.prompt
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const summary = buildPublishablePackageSummary({
    briefId,
    projectId: data.project.id,
    productionPlanId: data.productionPlan?.id ?? null,
    publicationTargetId: data.publicationTarget.id,
    publicationTargetLabel: data.publicationTarget.label,
    packages
  });

  if (data.productionPlan?.id) {
    await prisma.$transaction(async (tx) => {
      await writeReleasePrepMetadata(tx, {
        productionPlanId: data.productionPlan!.id,
        planJson: data.productionPlan!.planJson,
        summary
      });
    });
  }

  const refreshed = buildWorkflowBriefPackageCompletenessStatus(briefId, {
    ...data,
    releasePrepMeta: {
      version: WORKFLOW_BRIEF_RELEASE_PREP_VERSION,
      briefId,
      preparedAt: new Date().toISOString(),
      publicationTargetId: data.publicationTarget!.id,
      publicationTargetLabel: data.publicationTarget!.label,
      packageCount: packages.length
    }
  });

  return {
    prepared: true,
    releasePrepStage: refreshed.releasePrepStage,
    publishablePackageSummary: summary,
    completeness: refreshed
  };
}

function buildFinalReleasePackageFingerprintItems(
  data: NonNullable<Awaited<ReturnType<typeof loadWorkflowBriefPackageExecutionData>>>
): FinalReleasePackageFingerprintItem[] {
  return data.seedItems
    .map((planItem) => {
      const draft = data.draftByItemId.get(planItem.id);
      const deliverable = draft ? data.deliverableByDraftId.get(draft.id) : null;
      const image = draft ? data.imageByDraftId.get(draft.id) : null;
      if (!draft || !deliverable || !image) {
        return null;
      }

      return {
        contentPlanItemId: planItem.id,
        textDeliverableId: deliverable.id,
        contentDraftId: draft.id,
        articleImageId: image.id,
        textDeliverableUpdatedAt: deliverable.updatedAt,
        contentDraftUpdatedAt: draft.updatedAt,
        articleImageUpdatedAt: image.updatedAt,
        textDeliverableStatus: deliverable.status,
        imageStatus: image.status
      };
    })
    .filter((row): row is FinalReleasePackageFingerprintItem => Boolean(row));
}

async function writeFinalReleasePackageMetadata(
  tx: Prisma.TransactionClient,
  input: {
    productionPlanId: string;
    planJson: unknown;
    record: WorkflowBriefFinalReleasePackageRecord;
  }
): Promise<void> {
  const existingPlanJson =
    input.planJson && typeof input.planJson === "object" && !Array.isArray(input.planJson)
      ? (input.planJson as Record<string, unknown>)
      : {};

  await tx.productionPlan.update({
    where: { id: input.productionPlanId },
    data: {
      planJson: {
        ...existingPlanJson,
        releasePackage: input.record
      } as Prisma.InputJsonValue
    }
  });
}

function buildFinalReleasePackageItemSources(
  briefId: string,
  data: NonNullable<Awaited<ReturnType<typeof loadWorkflowBriefPackageExecutionData>>>
): WorkflowBriefFinalReleasePackageItemSource[] {
  return data.seedItems
    .map((planItem) => {
      const draft = data.draftByItemId.get(planItem.id);
      const deliverable = draft ? data.deliverableByDraftId.get(draft.id) : null;
      const image = draft ? data.imageByDraftId.get(draft.id) : null;
      if (!draft || !deliverable || !image) {
        return null;
      }
      if (!isReleasableTextDeliverableStatus(deliverable.status)) {
        return null;
      }

      return {
        contentPlanItemId: planItem.id,
        planItemTitle: planItem.title,
        textDeliverableId: deliverable.id,
        articleImageId: image.id,
        textTitle: deliverable.title,
        deliveryType: deliverable.deliveryType,
        exportUrl: null as string | null,
        textDeliverableStatus: deliverable.status,
        imageTitle: image.title,
        imageUrl: resolveFeaturedImageRef({
          finalImageUrl: image.finalImageUrl,
          previewImageUrl: image.previewImageUrl
        }),
        imageStatus: image.status
      };
    })
    .filter((row): row is WorkflowBriefFinalReleasePackageItemSource => Boolean(row));
}

export type WorkflowBriefReleasePackageStatus = WorkflowBriefPackageCompletenessStatus & {
  releasePackage: WorkflowBriefFinalReleasePackageRecord | null;
  clientReleasePackage: ClientSafeReleasePackage | null;
};

function buildWorkflowBriefReleasePackageStatus(
  briefId: string,
  data: NonNullable<Awaited<ReturnType<typeof loadWorkflowBriefPackageExecutionData>>>,
  isAdmin: boolean
): WorkflowBriefReleasePackageStatus {
  const completeness = buildWorkflowBriefPackageCompletenessStatus(briefId, data);
  const packageFingerprint = computeFinalReleasePackageFingerprint(buildFinalReleasePackageFingerprintItems(data));
  const packageComplete = completeness.completeItemCount === data.seedItems.length && data.seedItems.length > 0;
  const releasePackageFinalized = Boolean(data.finalReleasePackageMeta?.finalizedAt);
  const storedFinalizeFingerprint = data.finalReleasePackageMeta?.packageFingerprint ?? null;
  const packageChangedSinceFinalize = Boolean(
    releasePackageFinalized && storedFinalizeFingerprint && storedFinalizeFingerprint !== packageFingerprint
  );
  const finalizeGate = canFinalizeWorkflowBriefReleasePackage({
    releasePrepared: completeness.releasePrepared,
    packageComplete,
    isAdmin,
    alreadyFinalized: releasePackageFinalized,
    packageChangedSinceFinalize
  });

  return {
    ...completeness,
    releasePackageStage: computeFinalReleasePackageStage({
      releasePrepared: completeness.releasePrepared,
      releasePackageFinalized,
      canFinalize: finalizeGate.allowed,
      packageChangedSinceFinalize
    }),
    canFinalizeReleasePackage: finalizeGate.allowed,
    releasePackageBlockReason: finalizeGate.blockReason,
    releasePackageFinalized,
    lastReleasePackageFinalizedAt: data.finalReleasePackageMeta?.finalizedAt ?? null,
    packageChangedSinceFinalize,
    // Raw finalReleasePackageMeta carries internal packaging/automation metadata
    // (release execution records, provenance) — only admins/owners receive it. Clients
    // only ever receive the pre-sanitized clientReleasePackage snapshot below.
    releasePackage: isAdmin ? data.finalReleasePackageMeta : null,
    clientReleasePackage: toClientSafeReleasePackageFromRecord(data.finalReleasePackageMeta)
  };
}

export async function getWorkflowBriefReleasePackageStatus(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<WorkflowBriefReleasePackageStatus | "not_found" | "forbidden"> {
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

  const data = await loadWorkflowBriefPackageExecutionData(tenantId, briefId);
  if (!data) {
    return "not_found";
  }

  return buildWorkflowBriefReleasePackageStatus(briefId, data, isOwnerRole(getActiveRoles(authSession)));
}

export type AdminSafePublicationHandoffSummary = {
  version: string;
  kind: "publication_handoff_result" | "release_execution_result";
  executedAt: string;
  publicationTargetLabel: string;
  preparedCount: number;
  reusedCount: number;
  itemCount: number;
  note: string;
};

export type WorkflowBriefPublicationHandoffStatus = {
  briefId: string;
  handoffStage: WorkflowBriefPublicationHandoffStage;
  executionMode: typeof WORKFLOW_BRIEF_PUBLICATION_HANDOFF_MODE;
  packageComplete: boolean;
  releasePrepared: boolean;
  lastReleasePreparedAt: string | null;
  publicationTargetAvailable: boolean;
  publicationTargetId: string | null;
  publicationTargetLabel: string | null;
  releasePackageFinalized: boolean;
  lastReleasePackageFinalizedAt: string | null;
  handoffExecuted: boolean;
  lastHandoffExecutedAt: string | null;
  packageChangedSinceHandoff: boolean;
  canExecuteHandoff: boolean;
  handoffBlockReason: string | null;
  packageFingerprint: string;
  mappedItemCount: number;
  publicationHandoff: AdminSafePublicationHandoffSummary | null;
};

function buildPublicationHandoffPackageMappingItems(
  data: NonNullable<Awaited<ReturnType<typeof loadWorkflowBriefPackageExecutionData>>>
) {
  return data.seedItems
    .map((planItem) => {
      const draft = data.draftByItemId.get(planItem.id);
      const deliverable = draft ? data.deliverableByDraftId.get(draft.id) : null;
      const image = draft ? data.imageByDraftId.get(draft.id) : null;
      if (!draft || !deliverable || !image) {
        return null;
      }

      return buildPublicationHandoffPackageMappingItem({
        contentPlanItemId: planItem.id,
        planItemTitle: planItem.title,
        contentDraftId: draft.id,
        textDeliverableId: deliverable.id,
        articleImageId: image.id,
        textTitle: deliverable.title,
        bodyContent: deliverable.bodyContent ?? draft.draftBody,
        excerpt: deliverable.bodyContent ? deliverable.bodyContent.slice(0, 160) : draft.draftBody.slice(0, 160),
        imageTitle: image.title,
        featuredImageRef: resolvePublicationHandoffFeaturedImageRef({
          finalImageUrl: image.finalImageUrl,
          previewImageUrl: image.previewImageUrl
        }),
        textDeliverableStatus: deliverable.status,
        imageStatus: image.status,
        textDeliverableUpdatedAt: deliverable.updatedAt,
        contentDraftUpdatedAt: draft.updatedAt,
        articleImageUpdatedAt: image.updatedAt
      });
    })
    .filter((row): row is NonNullable<ReturnType<typeof buildPublicationHandoffPackageMappingItem>> => Boolean(row));
}

function toAdminSafePublicationHandoffSummary(
  record: WorkflowBriefPublicationHandoffRecord | null | undefined
): AdminSafePublicationHandoffSummary | null {
  if (!record || record.version !== WORKFLOW_BRIEF_PUBLICATION_HANDOFF_VERSION) {
    return null;
  }
  const kind =
    record.kind === "publication_handoff_result"
      ? "publication_handoff_result"
      : record.kind === LEGACY_PUBLICATION_HANDOFF_PLAN_JSON_KIND
        ? "release_execution_result"
        : null;
  if (!kind) {
    return null;
  }

  return {
    version: record.version,
    kind,
    executedAt: record.executedAt,
    publicationTargetLabel: record.publicationTargetLabel,
    preparedCount: record.preparedCount,
    reusedCount: record.reusedCount,
    itemCount: record.items.length,
    note: record.note
  };
}

function resolvePublicationHandoffExecutionGate(input: {
  packageComplete: boolean;
  releasePrepared: boolean;
  publicationTargetAvailable: boolean;
  releasePackageFinalized: boolean;
  isAdmin: boolean;
}): { allowed: boolean; blockReason: string | null } {
  const baseGate = canExecutePublicationHandoff({
    packageComplete: input.packageComplete,
    releasePrepared: input.releasePrepared,
    publicationTargetAvailable: input.publicationTargetAvailable,
    isAdmin: input.isAdmin
  });
  if (!baseGate.allowed) {
    return baseGate;
  }
  if (!input.releasePackageFinalized) {
    return {
      allowed: false,
      blockReason: "Finalize the release package before publication handoff."
    };
  }
  return { allowed: true, blockReason: null };
}

function buildWorkflowBriefPublicationHandoffStatus(
  briefId: string,
  data: NonNullable<Awaited<ReturnType<typeof loadWorkflowBriefPackageExecutionData>>>
): WorkflowBriefPublicationHandoffStatus {
  const completeness = buildWorkflowBriefPackageCompletenessStatus(briefId, data);
  const mappingItems = buildPublicationHandoffPackageMappingItems(data);
  const packageFingerprint = computePublicationHandoffPackageFingerprint(mappingItems);
  const packageComplete = completeness.completeItemCount === data.seedItems.length && data.seedItems.length > 0;
  const releasePrepared = completeness.releasePrepared;
  const publicationTargetAvailable = completeness.publicationTargetAvailable;
  const handoffExecuted = Boolean(data.publicationHandoffMeta?.executedAt);
  const storedFingerprint = data.publicationHandoffMeta?.packageFingerprint ?? null;
  const packageChangedSinceHandoff = Boolean(
    handoffExecuted && storedFingerprint && storedFingerprint !== packageFingerprint
  );
  const releasePackageFinalized = Boolean(data.finalReleasePackageMeta?.finalizedAt);
  const handoffGate = resolvePublicationHandoffExecutionGate({
    packageComplete,
    releasePrepared,
    publicationTargetAvailable,
    releasePackageFinalized,
    isAdmin: true
  });

  return {
    briefId,
    handoffStage: computePublicationHandoffStage({
      packageComplete,
      releasePrepared,
      publicationTargetAvailable,
      handoffExecuted,
      packageFingerprint,
      storedFingerprint
    }),
    executionMode: WORKFLOW_BRIEF_PUBLICATION_HANDOFF_MODE,
    packageComplete,
    releasePrepared,
    lastReleasePreparedAt: data.releasePrepMeta?.preparedAt ?? null,
    publicationTargetAvailable,
    publicationTargetId: data.publicationTarget?.id ?? null,
    publicationTargetLabel: data.publicationTarget?.label ?? null,
    releasePackageFinalized,
    lastReleasePackageFinalizedAt: data.finalReleasePackageMeta?.finalizedAt ?? null,
    handoffExecuted,
    lastHandoffExecutedAt: data.publicationHandoffMeta?.executedAt ?? null,
    packageChangedSinceHandoff,
    canExecuteHandoff: handoffGate.allowed,
    handoffBlockReason: handoffGate.blockReason,
    packageFingerprint,
    mappedItemCount: mappingItems.length,
    publicationHandoff: toAdminSafePublicationHandoffSummary(data.publicationHandoffMeta)
  };
}

export async function getWorkflowBriefPublicationHandoffStatus(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<WorkflowBriefPublicationHandoffStatus | "not_found" | "forbidden"> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const brief = await getBriefForAccess(briefId, tenantId);
  if (!brief) {
    return "not_found";
  }

  const data = await loadWorkflowBriefPackageExecutionData(tenantId, briefId);
  if (!data) {
    return "not_found";
  }

  return buildWorkflowBriefPublicationHandoffStatus(briefId, data);
}

async function writePublicationHandoffMetadata(
  tx: Prisma.TransactionClient,
  input: {
    productionPlanId: string;
    planJson: unknown;
    record: WorkflowBriefPublicationHandoffRecord;
  }
): Promise<void> {
  const existingPlanJson =
    input.planJson && typeof input.planJson === "object" && !Array.isArray(input.planJson)
      ? (input.planJson as Record<string, unknown>)
      : {};

  await tx.productionPlan.update({
    where: { id: input.productionPlanId },
    data: {
      planJson: {
        ...existingPlanJson,
        publicationHandoff: input.record
      } as Prisma.InputJsonValue
    }
  });
}

export type WorkflowBriefPublicationHandoffExecuteResult = {
  executed: boolean;
  reused: boolean;
  handoffStage: WorkflowBriefPublicationHandoffStage;
  publicationHandoff: AdminSafePublicationHandoffSummary;
  status: WorkflowBriefPublicationHandoffStatus;
};

export async function executeWorkflowBriefPublicationHandoff(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<
  | WorkflowBriefPublicationHandoffExecuteResult
  | "not_found"
  | "forbidden"
  | "missing_project"
  | "not_ready"
  | "release_prep_missing"
  | "publication_target_missing"
  | "release_package_not_finalized"
> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const data = await loadWorkflowBriefPackageExecutionData(tenantId, briefId);
  if (!data) {
    return "not_found";
  }
  if (!data.project) {
    return "missing_project";
  }
  if (!data.publicationTarget) {
    return "publication_target_missing";
  }

  const completeness = buildWorkflowBriefPackageCompletenessStatus(briefId, data);
  const mappingItems = buildPublicationHandoffPackageMappingItems(data);
  const packageFingerprint = computePublicationHandoffPackageFingerprint(mappingItems);
  const packageComplete = completeness.completeItemCount === data.seedItems.length && data.seedItems.length > 0;

  if (!packageComplete || mappingItems.length === 0) {
    return "not_ready";
  }
  if (!completeness.releasePrepared) {
    return "release_prep_missing";
  }

  const releasePackageFinalized = Boolean(data.finalReleasePackageMeta?.finalizedAt);
  if (!releasePackageFinalized) {
    return "release_package_not_finalized";
  }

  const handoffExecuted = Boolean(data.publicationHandoffMeta?.executedAt);
  const storedFingerprint = data.publicationHandoffMeta?.packageFingerprint ?? null;

  if (
    shouldReusePublicationHandoff({
      storedFingerprint,
      currentFingerprint: packageFingerprint,
      handoffExecuted
    }) &&
    data.publicationHandoffMeta
  ) {
    const status = buildWorkflowBriefPublicationHandoffStatus(briefId, data);
    const publicationHandoff = toAdminSafePublicationHandoffSummary(data.publicationHandoffMeta);
    if (!publicationHandoff) {
      return "not_ready";
    }
    return {
      executed: true,
      reused: true,
      handoffStage: status.handoffStage,
      publicationHandoff,
      status
    };
  }

  const { prepareAiDeliveryDeliverableWordPressDraft } = await import("./core.runtime");
  const executedAt = new Date().toISOString();
  const itemResults: WorkflowBriefPublicationHandoffRecord["items"] = [];

  for (const mapping of mappingItems) {
    const draftResponse = await prepareAiDeliveryDeliverableWordPressDraft(
      authSession,
      data.project.id,
      mapping.textDeliverableId,
      data.publicationTarget.id
    );
    if (!draftResponse?.wordpressDraft) {
      return "not_ready";
    }

    const latestLog = await prisma.publicationLog.findFirst({
      where: {
        tenantId,
        deliverableId: mapping.textDeliverableId,
        action: "PREPARE_WORDPRESS_DRAFT"
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true }
    });

    itemResults.push(
      buildPublicationHandoffItemFromDraft({
        mapping,
        wordpressDraft: draftResponse.wordpressDraft,
        publicationLogId: latestLog?.id ?? null,
        outcome: "created",
        preparedAt: executedAt
      })
    );
  }

  const publicationHandoffRecord = buildPublicationHandoffRecord({
    briefId,
    executedAt,
    publicationTargetId: data.publicationTarget.id,
    publicationTargetLabel: data.publicationTarget.label,
    packageFingerprint,
    aiDeliveryProjectId: data.project.id,
    productionPlanId: data.productionPlan?.id ?? null,
    items: itemResults
  });

  if (data.productionPlan?.id) {
    await prisma.$transaction(async (tx) => {
      await writePublicationHandoffMetadata(tx, {
        productionPlanId: data.productionPlan!.id,
        planJson: data.productionPlan!.planJson,
        record: publicationHandoffRecord
      });
    });
  }

  const refreshedData = await loadWorkflowBriefPackageExecutionData(tenantId, briefId);
  if (!refreshedData) {
    return "not_ready";
  }

  const status = buildWorkflowBriefPublicationHandoffStatus(briefId, refreshedData);
  const publicationHandoff = toAdminSafePublicationHandoffSummary(publicationHandoffRecord);
  if (!publicationHandoff) {
    return "not_ready";
  }

  return {
    executed: true,
    reused: false,
    handoffStage: status.handoffStage,
    publicationHandoff,
    status
  };
}

export async function finalizeWorkflowBriefReleasePackage(
  authSession: AuthResolvedSessionContext,
  briefId: string
): Promise<
  | {
      finalized: boolean;
      reused: boolean;
      releasePackageStage: WorkflowBriefFinalReleasePackageStage;
      releasePackage: WorkflowBriefFinalReleasePackageRecord;
      clientReleasePackage: ClientSafeReleasePackage;
      completeness: WorkflowBriefPackageCompletenessStatus;
    }
  | "not_found"
  | "forbidden"
  | "missing_project"
  | "release_prep_missing"
  | "not_ready"
  | "already_finalized"
> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isOwnerRole(getActiveRoles(authSession))) {
    return "forbidden";
  }

  const data = await loadWorkflowBriefPackageExecutionData(tenantId, briefId);
  if (!data) {
    return "not_found";
  }
  if (!data.project) {
    return "missing_project";
  }

  const completeness = buildWorkflowBriefPackageCompletenessStatus(briefId, data);
  if (!completeness.releasePrepared) {
    return "release_prep_missing";
  }

  const fingerprintItems = buildFinalReleasePackageFingerprintItems(data);
  const packageFingerprint = computeFinalReleasePackageFingerprint(fingerprintItems);
  const packageComplete = completeness.completeItemCount === data.seedItems.length && data.seedItems.length > 0;
  if (!packageComplete || fingerprintItems.length === 0) {
    return "not_ready";
  }

  const releasePackageFinalized = Boolean(data.finalReleasePackageMeta?.finalizedAt);
  const storedFinalizeFingerprint = data.finalReleasePackageMeta?.packageFingerprint ?? null;
  const packageChangedSinceFinalize = Boolean(
    releasePackageFinalized && storedFinalizeFingerprint && storedFinalizeFingerprint !== packageFingerprint
  );

  if (
    shouldReuseFinalReleasePackage({
      storedFingerprint: storedFinalizeFingerprint,
      currentFingerprint: packageFingerprint,
      releasePackageFinalized
    }) &&
    data.finalReleasePackageMeta
  ) {
    const clientReleasePackage = toClientSafeReleasePackageFromRecord(data.finalReleasePackageMeta);
    if (!clientReleasePackage) {
      return "not_ready";
    }
    return {
      finalized: true,
      reused: true,
      releasePackageStage: "finalized",
      releasePackage: data.finalReleasePackageMeta,
      clientReleasePackage,
      completeness
    };
  }

  if (releasePackageFinalized && !packageChangedSinceFinalize) {
    return "already_finalized";
  }

  const itemSources = buildFinalReleasePackageItemSources(briefId, data);
  if (itemSources.length !== data.seedItems.length) {
    return "not_ready";
  }

  const deliverableIds = itemSources.map((item) => item.textDeliverableId);
  const exportRows = (await prisma.aiDeliveryDeliverable.findMany({
    where: { tenantId, id: { in: deliverableIds } },
    select: { id: true, exportUrl: true }
  })) as Array<{ id: string; exportUrl: string | null }>;
  const exportByDeliverableId = new Map(exportRows.map((row) => [row.id, row.exportUrl]));
  for (const item of itemSources) {
    item.exportUrl = exportByDeliverableId.get(item.textDeliverableId) ?? null;
  }

  const summary =
    `Final release package for ${data.brief?.title ?? "workflow brief"} with ${itemSources.length} deliverable` +
    `${itemSources.length === 1 ? "" : "s"}.`;

  const releasePackage = buildFinalReleasePackageRecord({
    briefId,
    briefTitle: data.brief?.title ?? "Workflow brief",
    aiDeliveryProjectId: data.project.id,
    projectName: data.project.name,
    productionPlanId: data.productionPlan?.id ?? null,
    packageFingerprint,
    summary,
    items: itemSources
  });

  await prisma.$transaction(async (tx) => {
    for (const item of itemSources) {
      if (item.textDeliverableStatus === "APPROVED_BY_CLIENT") {
        await tx.aiDeliveryDeliverable.update({
          where: { id: item.textDeliverableId },
          data: { status: "DELIVERED" }
        });
      }
    }

    if (data.productionPlan?.id) {
      await writeFinalReleasePackageMetadata(tx, {
        productionPlanId: data.productionPlan.id,
        planJson: data.productionPlan.planJson,
        record: releasePackage
      });
    }

    await tx.briefApproval.create({
      data: {
        tenantId,
        briefId,
        actorUserId: authSession.user.id,
        actorRole: "ADMIN",
        decisionType: "APPROVE",
        targetType: "PRODUCTION_PLAN"
      }
    });
  });

  const refreshedData = await loadWorkflowBriefPackageExecutionData(tenantId, briefId);
  const refreshedCompleteness = refreshedData
    ? buildWorkflowBriefPackageCompletenessStatus(briefId, refreshedData)
    : completeness;
  const clientReleasePackage = toClientSafeReleasePackageFromRecord(releasePackage);
  if (!clientReleasePackage) {
    return "not_ready";
  }

  return {
    finalized: true,
    reused: false,
    releasePackageStage: "finalized",
    releasePackage,
    clientReleasePackage,
    completeness: refreshedCompleteness
  };
}
