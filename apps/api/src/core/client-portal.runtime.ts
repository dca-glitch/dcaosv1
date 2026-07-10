import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuthResolvedSessionContext } from "../auth/types";
import { getPrivateStorageDownloadReference } from "../storage/private-storage.service";
import {
  buildPurivaClientSafeManualMetricsDisclaimer,
  consumePurivaApprovedManualMetricsSnapshot
} from "./puriva-manual-metrics";
import {
  toClientSafeReleasePackageFromRecord,
  WORKFLOW_BRIEF_FINAL_RELEASE_PACKAGE_VERSION,
  type ClientSafeReleasePackage
} from "./workflow-brief-final-release.execution";
import { toClientPortalSafeDownloadReference } from "./client-portal-serializer";

const prisma = createPrismaClient();

type ClientPortalDeliverableStatus = "DELIVERED" | "ACCEPTED";

const CLIENT_PORTAL_VISIBLE_STATUSES: ClientPortalDeliverableStatus[] = ["DELIVERED", "ACCEPTED"];

export function isClientPortalVisibleDeliverableStatus(
  status: string
): status is ClientPortalDeliverableStatus {
  return CLIENT_PORTAL_VISIBLE_STATUSES.includes(status as ClientPortalDeliverableStatus);
}

export function isClientPortalFinalMonthlyReportStatus(status: string): status is "FINAL" {
  return status === "FINAL";
}

function getActiveTenantId(authSession: AuthResolvedSessionContext): string | null {
  return authSession.tenantContext.activeMembership?.tenantId ?? null;
}

async function hasClientAccess(tenantId: string, clientId: string, userId: string): Promise<boolean> {
  const access = await prisma.clientUserAccess.findFirst({
    where: { tenantId, clientId, userId, isArchived: false },
    select: { id: true }
  });
  return access !== null;
}

function formatTargetMonth(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 7);
}

const clientPortalProjectSelect = {
  id: true,
  clientId: true,
  client: { select: { id: true, name: true } },
  projectId: true,
  project: { select: { id: true, name: true } },
  name: true,
  targetMonth: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true
} as const;

const CLIENT_PORTAL_INTERNAL_MARKER_PATTERNS = [
  /\[PURIVA_LOCAL_SETUP\]/gi,
  /\[PURIVA_[A-Z0-9_]+\]/gi,
  /PURIVA_[A-Z0-9_]+_V1/gi,
  /puriva_[a-z0-9_]+_seed/gi
] as const;

type SanitizeClientPortalDisplayTextOptions = {
  stripScaffoldWord?: boolean;
  fallback?: string | null;
};

function normalizeSanitizedClientPortalText(
  value: string,
  options?: Pick<SanitizeClientPortalDisplayTextOptions, "stripScaffoldWord">
): string {
  let cleaned = value;

  for (const pattern of CLIENT_PORTAL_INTERNAL_MARKER_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  if (options?.stripScaffoldWord) {
    cleaned = cleaned.replace(/\bscaffold\b/gi, "");
  }

  return cleaned
    .replace(/\s{2,}/g, " ")
    .replace(/\s+—\s+—/g, " — ")
    .replace(/^\s*—\s*/, "")
    .replace(/\s*—\s*$/, "")
    .trim();
}

export function sanitizeClientPortalDisplayText(
  raw: string | null | undefined,
  options: SanitizeClientPortalDisplayTextOptions = {}
): string | null {
  if (typeof raw !== "string") {
    return options.fallback ?? null;
  }

  const cleaned = normalizeSanitizedClientPortalText(raw.trim(), options);
  if (!cleaned) {
    return options.fallback ?? null;
  }

  return cleaned;
}

function sanitizeClientPortalStringList(
  value: unknown,
  options: SanitizeClientPortalDisplayTextOptions = {}
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => sanitizeClientPortalDisplayText(item, options) ?? "")
    .filter((item) => item.length > 0)
    .slice(0, 12);
}

function sanitizeClientPortalReleasePackage(
  releasePackage: ClientSafeReleasePackage
): ClientSafeReleasePackage {
  return {
    briefTitle:
      sanitizeClientPortalDisplayText(releasePackage.briefTitle, {
        stripScaffoldWord: true,
        fallback: "Release package"
      }) ?? "Release package",
    projectName:
      sanitizeClientPortalDisplayText(releasePackage.projectName, {
        stripScaffoldWord: true,
        fallback: releasePackage.projectName
      }) ?? releasePackage.projectName,
    finalizedAt: releasePackage.finalizedAt,
    releaseStatus: releasePackage.releaseStatus,
    summary: sanitizeClientPortalDisplayText(releasePackage.summary) ?? releasePackage.summary,
    deliverables: (releasePackage.deliverables ?? []).map((item) => ({
      title:
        sanitizeClientPortalDisplayText(item.title, {
          stripScaffoldWord: true,
          fallback: item.title
        }) ?? item.title,
      type: item.type,
      exportUrl: item.exportUrl ?? null,
      status: item.status
    })),
    images: (releasePackage.images ?? []).map((item) => ({
      title:
        sanitizeClientPortalDisplayText(item.title, {
          stripScaffoldWord: true,
          fallback: item.title
        }) ?? item.title,
      altText: sanitizeClientPortalDisplayText(item.altText),
      imageUrl: item.imageUrl ?? null,
      status: item.status
    })),
    notes: sanitizeClientPortalDisplayText(releasePackage.notes)
  };
}

function toClientPortalProjectSummary(p: {
  id: string;
  clientId: string;
  client: { id: string; name: string } | null;
  projectId: string | null;
  project: { id: string; name: string } | null;
  name: string;
  targetMonth: Date | string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: p.id,
    clientId: p.clientId,
    client: p.client ? { id: p.client.id, name: p.client.name } : null,
    projectId: p.projectId ?? null,
    project: p.project ? { id: p.project.id, name: p.project.name } : null,
    name: sanitizeClientPortalDisplayText(p.name, { stripScaffoldWord: true, fallback: p.name }) ?? p.name,
    targetMonth: formatTargetMonth(p.targetMonth),
    isArchived: p.isArchived,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt
  };
}

// Narrow select: storageKey, notes, contentDraftId, articleImageId, tenantId are intentionally excluded.
const clientPortalDeliverableSelect = {
  id: true,
  aiDeliveryProjectId: true,
  title: true,
  description: true,
  deliveryType: true,
  status: true,
  exportUrl: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true
} as const;

export function toClientPortalDeliverableSummary(d: {
  id: string;
  aiDeliveryProjectId: string;
  title: string;
  description: string | null;
  deliveryType: string;
  status: string;
  exportUrl: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  const displayTitle = sanitizeClientPortalDisplayText(d.title, {
    stripScaffoldWord: true,
    fallback: d.title
  });

  return {
    id: d.id,
    projectId: d.aiDeliveryProjectId,
    title: displayTitle ?? d.title,
    displayTitle,
    description: sanitizeClientPortalDisplayText(d.description),
    deliveryType: d.deliveryType,
    status: d.status,
    exportUrl: d.exportUrl ?? null,
    isArchived: d.isArchived,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
    updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : d.updatedAt
  };
}

export type ClientPortalMyClientSummary = {
  clientId: string;
  clientName: string;
};

export async function getClientPortalMyClient(
  authSession: AuthResolvedSessionContext
): Promise<ClientPortalMyClientSummary | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const access = await prisma.clientUserAccess.findFirst({
    where: {
      tenantId,
      userId: authSession.user.id,
      isArchived: false,
      client: { isArchived: false, tenantId }
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      clientId: true,
      client: {
        select: { name: true, tenantId: true }
      }
    }
  });

  if (!access || access.client.tenantId !== tenantId) {
    return null;
  }

  return {
    clientId: access.clientId,
    clientName: access.client.name
  };
}

export async function listClientPortalProjects(authSession: AuthResolvedSessionContext) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const userId = authSession.user.id;

  const accessEntries = await prisma.clientUserAccess.findMany({
    where: { tenantId, userId, isArchived: false },
    select: { clientId: true }
  });

  const allowedClientIds = accessEntries.map((e) => e.clientId);
  if (allowedClientIds.length === 0) {
    return { aiDeliveryProjects: [] };
  }

  const projects = await prisma.aiDeliveryProject.findMany({
    where: { tenantId, clientId: { in: allowedClientIds }, isArchived: false },
    orderBy: [{ targetMonth: "desc" }, { createdAt: "desc" }],
    select: clientPortalProjectSelect
  });

  return { aiDeliveryProjects: projects.map(toClientPortalProjectSummary) };
}

export async function getClientPortalProject(
  authSession: AuthResolvedSessionContext,
  projectId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const userId = authSession.user.id;

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: projectId, tenantId, isArchived: false },
    select: clientPortalProjectSelect
  });

  if (!project) return null;

  const access = await hasClientAccess(tenantId, project.clientId, userId);
  if (!access) return null;

  return { aiDeliveryProject: toClientPortalProjectSummary(project) };
}

export async function listClientPortalDeliverables(
  authSession: AuthResolvedSessionContext,
  projectId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const userId = authSession.user.id;

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: projectId, tenantId, isArchived: false },
    select: { id: true, clientId: true }
  });

  if (!project) return null;

  const access = await hasClientAccess(tenantId, project.clientId, userId);
  if (!access) return null;

  const deliverables = await (prisma as any).aiDeliveryDeliverable.findMany({
    where: {
      tenantId,
      aiDeliveryProjectId: projectId,
      isArchived: false,
      status: { in: CLIENT_PORTAL_VISIBLE_STATUSES }
    },
    orderBy: [{ updatedAt: "desc" }],
    select: clientPortalDeliverableSelect
  });

  return { deliverables: (deliverables as any[]).map(toClientPortalDeliverableSummary) };
}

// Narrow select: storageKey, adminSummaryNotes, tenantId, clientId, workflowRunId, and internal fields are intentionally excluded.
// storageKey is fetched only to compute hasDocument; it is not returned in the response.
const clientPortalMonthlyReportSelect = {
  id: true,
  aiDeliveryProjectId: true,
  title: true,
  recommendationsText: true,
  exportUrl: true,
  finalizedAt: true,
  storageKey: true,
  createdAt: true,
  updatedAt: true
} as const;

export function sanitizeClientPortalMonthlyReportDisplayTitle(
  rawTitle: string | null | undefined
): string | null {
  return sanitizeClientPortalDisplayText(rawTitle, {
    stripScaffoldWord: true,
    fallback: "Monthly report"
  });
}

export function isClientPortalMonthlyReportVisible(report: {
  status?: string | null;
  isArchived?: boolean | null;
}): boolean {
  return report.status === "FINAL" && report.isArchived !== true;
}

export function toClientPortalMonthlyReportSummary(r: {
  id: string;
  aiDeliveryProjectId: string;
  title: string | null;
  recommendationsText: string | null;
  exportUrl: string | null;
  finalizedAt: Date | string | null;
  storageKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const displayTitle = sanitizeClientPortalMonthlyReportDisplayTitle(r.title);

  return {
    id: r.id,
    aiDeliveryProjectId: r.aiDeliveryProjectId,
    title: displayTitle,
    displayTitle,
    recommendationsText: sanitizeClientPortalDisplayText(r.recommendationsText),
    exportUrl: r.exportUrl ?? null,
    status: "FINAL" as const,
    hasDocument: !!r.storageKey,
    finalizedAt: r.finalizedAt instanceof Date ? r.finalizedAt.toISOString() : (r.finalizedAt ?? null),
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt
  };
}

export async function listClientPortalMonthlyReports(
  authSession: AuthResolvedSessionContext,
  projectId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const userId = authSession.user.id;

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: projectId, tenantId, isArchived: false },
    select: { id: true, clientId: true }
  });

  if (!project) return null;

  const access = await hasClientAccess(tenantId, project.clientId, userId);
  if (!access) return null;

  const reports = await (prisma as any).aiDeliveryMonthlyReport.findMany({
    where: {
      tenantId,
      aiDeliveryProjectId: projectId,
      status: "FINAL",
      isArchived: false
    },
    orderBy: [{ finalizedAt: "desc" }, { updatedAt: "desc" }],
    select: clientPortalMonthlyReportSelect
  });

  return { monthlyReports: (reports as any[]).map(toClientPortalMonthlyReportSummary) };
}

const clientPortalWorkSummaryDeliverableSelect = {
  id: true,
  title: true,
  deliveryType: true,
  status: true,
  exportUrl: true
} as const;

const clientPortalWorkSummaryContentPlanItemSelect = {
  id: true,
  title: true,
  contentType: true,
  targetKeyword: true,
  approvalStatus: true
} as const;

const clientPortalApprovedMetricSelect = {
  id: true,
  targetMonth: true,
  sourceType: true,
  status: true,
  notes: true,
  gscClicks: true,
  gscImpressions: true,
  gscAverageCtr: true,
  gscAveragePosition: true,
  ga4Sessions: true,
  ga4Users: true,
  ga4PageViews: true
} as const;

type ClientPortalApprovedMetricSnapshot = {
  id: string;
  targetMonth: string;
  sourceType: string;
  status: string;
  notes: string | null;
  gscClicks: number | null;
  gscImpressions: number | null;
  gscAverageCtr: number | null;
  gscAveragePosition: number | null;
  ga4Sessions: number | null;
  ga4Users: number | null;
  ga4PageViews: number | null;
};

export type ClientPortalMonthlyReportPerformanceSummary = {
  targetMonth: string;
  sourceType: string;
  placeholderOnly: boolean;
  manualSource: boolean;
  disclaimer: string | null;
  itemCount: number | null;
  gscClicks: number | null;
  gscImpressions: number | null;
  gscAverageCtr: number | null;
  gscAveragePosition: number | null;
  ga4Sessions: number | null;
  ga4Users: number | null;
  ga4PageViews: number | null;
};

export function toClientPortalMonthlyReportPerformanceSummary(
  approvedSnapshot: ClientPortalApprovedMetricSnapshot
): ClientPortalMonthlyReportPerformanceSummary {
  const consumed = consumePurivaApprovedManualMetricsSnapshot({
    id: approvedSnapshot.id,
    targetMonth: approvedSnapshot.targetMonth,
    sourceType: approvedSnapshot.sourceType,
    status: approvedSnapshot.status,
    notes: approvedSnapshot.notes
  });

  // Client-safe provenance only: never expose snapshot id, notes, or internal source IDs.
  const base = {
    targetMonth: approvedSnapshot.targetMonth,
    sourceType: approvedSnapshot.sourceType,
    gscClicks: approvedSnapshot.gscClicks,
    gscImpressions: approvedSnapshot.gscImpressions,
    gscAverageCtr: approvedSnapshot.gscAverageCtr,
    gscAveragePosition: approvedSnapshot.gscAveragePosition,
    ga4Sessions: approvedSnapshot.ga4Sessions,
    ga4Users: approvedSnapshot.ga4Users,
    ga4PageViews: approvedSnapshot.ga4PageViews
  };

  if (consumed?.clientSafeSummary) {
    return {
      ...base,
      placeholderOnly: true,
      manualSource: true,
      disclaimer: consumed.clientSafeSummary.disclaimer,
      itemCount: consumed.clientSafeSummary.itemCount
    };
  }

  if (approvedSnapshot.sourceType === "MANUAL") {
    return {
      ...base,
      placeholderOnly: true,
      manualSource: true,
      disclaimer: buildPurivaClientSafeManualMetricsDisclaimer(),
      itemCount: null
    };
  }

  return {
    ...base,
    placeholderOnly: false,
    manualSource: false,
    disclaimer: null,
    itemCount: null
  };
}

async function buildClientPortalMonthlyReportWorkSummary(tenantId: string, projectId: string) {
  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: projectId, tenantId, isArchived: false },
    select: { targetMonth: true }
  });
  if (!project) {
    return null;
  }

  const [deliverables, contentPlan] = await Promise.all([
    prisma.aiDeliveryDeliverable.findMany({
      where: {
        tenantId,
        aiDeliveryProjectId: projectId,
        status: { in: ["DELIVERED", "ACCEPTED"] },
        isArchived: false
      },
      orderBy: [{ updatedAt: "desc" }],
      select: clientPortalWorkSummaryDeliverableSelect
    }),
    prisma.aiDeliveryContentPlan.findFirst({
      where: { tenantId, aiDeliveryProjectId: projectId },
      select: {
        items: {
          select: clientPortalWorkSummaryContentPlanItemSelect,
          orderBy: { sortOrder: "asc" }
        }
      }
    })
  ]);

  const finalDeliverables = deliverables.filter((item) => isClientPortalVisibleDeliverableStatus(item.status));
  const deliveredCount = finalDeliverables.filter((item) => item.status === "DELIVERED").length;
  const acceptedCount = finalDeliverables.filter((item) => item.status === "ACCEPTED").length;
  const contentPlanItems = contentPlan?.items ?? [];
  const clientApprovedPlanItemCount = contentPlanItems.filter((item) => item.approvalStatus === "CLIENT_APPROVED").length;

  return {
    targetMonth: formatTargetMonth(project.targetMonth),
    finalDeliverableCount: finalDeliverables.length,
    deliveredCount,
    acceptedCount,
    contentPlanItemCount: contentPlanItems.length,
    clientApprovedPlanItemCount,
    deliverables: finalDeliverables.map((item) => ({
      id: item.id,
      title:
        sanitizeClientPortalDisplayText(item.title, {
          stripScaffoldWord: true,
          fallback: item.title
        }) ?? item.title,
      deliveryType: item.deliveryType,
      status: item.status,
      exportUrl: item.exportUrl ?? null
    })),
    contentPlanItems: contentPlanItems.map((item) => ({
      id: item.id,
      title:
        sanitizeClientPortalDisplayText(item.title, {
          stripScaffoldWord: true,
          fallback: item.title
        }) ?? item.title,
      contentType: item.contentType ?? null,
      targetKeyword: item.targetKeyword ?? null,
      approvalStatus: item.approvalStatus ?? null
    }))
  };
}

async function buildClientPortalMonthlyReportPerformanceSummary(tenantId: string, reportId: string) {
  const approvedSnapshot = await (prisma as any).aiDeliveryMonthlyMetricSnapshot.findFirst({
    where: {
      tenantId,
      aiDeliveryMonthlyReportId: reportId,
      status: "APPROVED"
    },
    orderBy: [{ targetMonth: "desc" }, { updatedAt: "desc" }],
    select: clientPortalApprovedMetricSelect
  }) as ClientPortalApprovedMetricSnapshot | null;

  if (!approvedSnapshot) {
    return null;
  }

  return toClientPortalMonthlyReportPerformanceSummary(approvedSnapshot);
}

export async function getClientPortalMonthlyReport(
  authSession: AuthResolvedSessionContext,
  projectId: string,
  reportId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const userId = authSession.user.id;

  const report = await (prisma as any).aiDeliveryMonthlyReport.findFirst({
    where: {
      id: reportId,
      aiDeliveryProjectId: projectId,
      tenantId,
      status: "FINAL",
      isArchived: false
    },
    select: clientPortalMonthlyReportSelect
  }) as Parameters<typeof toClientPortalMonthlyReportSummary>[0] | null;

  if (!report) return null;

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: projectId, tenantId, isArchived: false },
    select: { clientId: true }
  });
  if (!project) return null;

  const clientAccess = await hasClientAccess(tenantId, project.clientId, userId);
  if (!clientAccess) return null;

  const [workSummary, performanceSummary] = await Promise.all([
    buildClientPortalMonthlyReportWorkSummary(tenantId, projectId),
    buildClientPortalMonthlyReportPerformanceSummary(tenantId, reportId)
  ]);

  if (!workSummary) return null;

  return {
    monthlyReport: toClientPortalMonthlyReportSummary(report),
    workSummary,
    performanceSummary
  };
}

export async function getClientPortalDeliverableDownloadReference(
  authSession: AuthResolvedSessionContext,
  projectId: string,
  deliverableId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const userId = authSession.user.id;

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: projectId, tenantId, isArchived: false },
    select: { id: true, clientId: true }
  });

  if (!project) return null;

  const access = await hasClientAccess(tenantId, project.clientId, userId);
  if (!access) return null;

  // Only allow DELIVERED or ACCEPTED deliverables; storageKey is fetched internally and never returned.
  const deliverable = await (prisma as any).aiDeliveryDeliverable.findFirst({
    where: {
      id: deliverableId,
      tenantId,
      aiDeliveryProjectId: projectId,
      isArchived: false,
      status: { in: CLIENT_PORTAL_VISIBLE_STATUSES }
    },
    select: { id: true, storageKey: true }
  }) as { id: string; storageKey: string | null } | null;

  if (!deliverable) return null;

  if (!deliverable.storageKey) {
    return { downloadReference: null };
  }

  const downloadRef = getPrivateStorageDownloadReference(deliverable.storageKey);
  // storageKey is consumed internally; client envelope never includes it (G568).
  return toClientPortalSafeDownloadReference(
    deliverable.storageKey,
    downloadRef?.downloadUrl ?? null,
    downloadRef?.expiresSeconds ?? null
  );
}

function toClientSafeStringList(value: unknown): string[] {
  return sanitizeClientPortalStringList(value);
}

async function assertClientPortalProjectAccess(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<{ tenantId: string; clientId: string } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const userId = authSession.user.id;

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: projectId, tenantId, isArchived: false },
    select: { id: true, clientId: true }
  });

  if (!project) return null;

  const access = await hasClientAccess(tenantId, project.clientId, userId);
  if (!access) return null;

  return { tenantId, clientId: project.clientId };
}

export async function getClientPortalDeliverySummary(
  authSession: AuthResolvedSessionContext,
  projectId: string
) {
  const access = await assertClientPortalProjectAccess(authSession, projectId);
  if (!access) return null;

  const { tenantId, clientId } = access;

  const [handoff, contentPlan, deliverables, publicationLog] = await Promise.all([
    prisma.marketIntelligenceHandoff.findFirst({
      where: {
        tenantId,
        aiDeliveryProjectId: projectId,
        clientId,
        isArchived: false,
        handoffStatus: { in: ["READY", "APPLIED"] }
      },
      orderBy: [{ updatedAt: "desc" }],
      select: {
        title: true,
        marketSummary: true,
        opportunities: true,
        recommendedActions: true,
        handoffStatus: true,
        updatedAt: true
      }
    }),
    prisma.aiDeliveryContentPlan.findFirst({
      where: { tenantId, aiDeliveryProjectId: projectId },
      select: {
        status: true,
        approvedAt: true,
        updatedAt: true,
        items: {
          select: { approvalStatus: true },
          where: { tenantId }
        }
      }
    }),
    (prisma as any).aiDeliveryDeliverable.findMany({
      where: {
        tenantId,
        aiDeliveryProjectId: projectId,
        isArchived: false,
        status: { in: CLIENT_PORTAL_VISIBLE_STATUSES }
      },
      select: {
        id: true,
        title: true,
        exportUrl: true,
        deliveryType: true,
        status: true,
        updatedAt: true
      },
      orderBy: [{ updatedAt: "desc" }]
    }),
    prisma.publicationLog.findFirst({
      where: {
        tenantId,
        clientId,
        aiDeliveryProjectId: projectId
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        action: true,
        status: true,
        siteUrlHost: true,
        createdAt: true
      }
    })
  ]);

  const approvedPlanItems =
    contentPlan?.items.filter((item) => item.approvalStatus === "CLIENT_APPROVED").length ?? 0;
  const totalPlanItems = contentPlan?.items.length ?? 0;

  const googleDocsExports = (deliverables as Array<{
    id: string;
    title: string;
    exportUrl: string | null;
    deliveryType: string;
    status: string;
    updatedAt: Date;
  }>)
    .filter((deliverable) => typeof deliverable.exportUrl === "string" && deliverable.exportUrl.trim().length > 0)
    .map((deliverable) => {
      const displayTitle =
        sanitizeClientPortalDisplayText(deliverable.title, {
          stripScaffoldWord: true,
          fallback: deliverable.title
        }) ?? deliverable.title;

      return {
        id: deliverable.id,
        title: displayTitle,
        displayTitle,
        exportUrl: deliverable.exportUrl,
        deliveryType: deliverable.deliveryType,
        status: deliverable.status,
        updatedAt:
          deliverable.updatedAt instanceof Date
            ? deliverable.updatedAt.toISOString()
            : deliverable.updatedAt
      };
    });

  const marketIntelligenceTitle = handoff
    ? sanitizeClientPortalDisplayText(handoff.title, {
        stripScaffoldWord: true,
        fallback: "Market intelligence summary"
      })
    : null;

  return {
    deliverySummary: {
      marketIntelligence: handoff
        ? {
            title: marketIntelligenceTitle,
            displayTitle: marketIntelligenceTitle,
            marketSummary: sanitizeClientPortalDisplayText(handoff.marketSummary),
            opportunities: toClientSafeStringList(handoff.opportunities),
            recommendedActions: toClientSafeStringList(handoff.recommendedActions),
            status: handoff.handoffStatus,
            updatedAt:
              handoff.updatedAt instanceof Date ? handoff.updatedAt.toISOString() : handoff.updatedAt
          }
        : null,
      aiSeo: contentPlan
        ? {
            contentPlanStatus: contentPlan.status,
            approvedItemCount: approvedPlanItems,
            totalItemCount: totalPlanItems,
            approvedAt:
              contentPlan.approvedAt instanceof Date
                ? contentPlan.approvedAt.toISOString()
                : (contentPlan.approvedAt ?? null),
            updatedAt:
              contentPlan.updatedAt instanceof Date
                ? contentPlan.updatedAt.toISOString()
                : contentPlan.updatedAt,
            finalDeliverableCount: (deliverables as unknown[]).length
          }
        : null,
      websitePublishing: publicationLog
        ? {
            action: publicationLog.action,
            status: publicationLog.status,
            siteUrlHost: publicationLog.siteUrlHost ?? null,
            updatedAt:
              publicationLog.createdAt instanceof Date
                ? publicationLog.createdAt.toISOString()
                : publicationLog.createdAt
          }
        : null,
      googleDocsExports
    }
  };
}

export async function getClientPortalMonthlyReportDownloadReference(
  authSession: AuthResolvedSessionContext,
  projectId: string,
  reportId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const userId = authSession.user.id;

  // Fetch the report with clientId and storageKey; enforce FINAL + non-archived at DB level.
  const report = await (prisma as any).aiDeliveryMonthlyReport.findFirst({
    where: {
      id: reportId,
      aiDeliveryProjectId: projectId,
      tenantId,
      status: "FINAL",
      isArchived: false
    },
    select: { id: true, clientId: true, storageKey: true }
  }) as { id: string; clientId: string; storageKey: string | null } | null;

  if (!report) return null;

  // Verify client access via ClientUserAccess.
  const access = await hasClientAccess(tenantId, report.clientId, userId);
  if (!access) return null;

  if (!report.storageKey) {
    return { downloadReference: null };
  }

  const downloadRef = getPrivateStorageDownloadReference(report.storageKey);
  // storageKey is consumed internally; client envelope never includes it (G568).
  return toClientPortalSafeDownloadReference(
    report.storageKey,
    downloadRef?.downloadUrl ?? null,
    downloadRef?.expiresSeconds ?? null
  );
}

function readFinalReleasePackageFromPlanJson(planJson: unknown): {
  version: string;
  kind: string;
  finalizedAt?: string;
  clientSnapshot?: ClientSafeReleasePackage;
} | null {
  if (!planJson || typeof planJson !== "object" || Array.isArray(planJson)) {
    return null;
  }
  const record = planJson as Record<string, unknown>;
  const releasePackage = record.releasePackage;
  if (!releasePackage || typeof releasePackage !== "object" || Array.isArray(releasePackage)) {
    return null;
  }
  const parsed = releasePackage as {
    version?: string;
    kind?: string;
    finalizedAt?: string;
    clientSnapshot?: ClientSafeReleasePackage;
  };
  if (parsed.version !== WORKFLOW_BRIEF_FINAL_RELEASE_PACKAGE_VERSION || parsed.kind !== "final_release_package") {
    return null;
  }
  return parsed as {
    version: string;
    kind: string;
    finalizedAt?: string;
    clientSnapshot?: ClientSafeReleasePackage;
  };
}

export async function getClientPortalReleasePackage(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<{ releasePackage: ClientSafeReleasePackage | null } | null> {
  const access = await assertClientPortalProjectAccess(authSession, projectId);
  if (!access) return null;

  const { tenantId } = access;

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: projectId, tenantId, isArchived: false },
    select: { id: true, sourceBriefId: true, name: true }
  });
  if (!project?.sourceBriefId) {
    return { releasePackage: null };
  }

  const productionPlan = await prisma.productionPlan.findFirst({
    where: { tenantId, briefId: project.sourceBriefId },
    orderBy: { createdAt: "desc" },
    select: { planJson: true }
  });
  if (!productionPlan) {
    return { releasePackage: null };
  }

  const stored = readFinalReleasePackageFromPlanJson(productionPlan.planJson);
  if (!stored?.finalizedAt) {
    return { releasePackage: null };
  }

  const parsedReleasePackage = toClientSafeReleasePackageFromRecord(
    stored as Parameters<typeof toClientSafeReleasePackageFromRecord>[0]
  );
  if (!parsedReleasePackage) {
    return { releasePackage: null };
  }

  return { releasePackage: sanitizeClientPortalReleasePackage(parsedReleasePackage) };
}
