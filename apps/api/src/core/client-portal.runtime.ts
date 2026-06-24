import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuthResolvedSessionContext } from "../auth/types";
import { getPrivateStorageDownloadReference } from "../storage/private-storage.service";

const prisma = createPrismaClient();

type ClientPortalDeliverableStatus = "DELIVERED" | "ACCEPTED";

const CLIENT_PORTAL_VISIBLE_STATUSES: ClientPortalDeliverableStatus[] = ["DELIVERED", "ACCEPTED"];

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
    name: p.name,
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

function toClientPortalDeliverableSummary(d: {
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
  return {
    id: d.id,
    projectId: d.aiDeliveryProjectId,
    title: d.title,
    description: d.description ?? null,
    deliveryType: d.deliveryType,
    status: d.status,
    exportUrl: d.exportUrl ?? null,
    isArchived: d.isArchived,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
    updatedAt: d.updatedAt instanceof Date ? d.updatedAt.toISOString() : d.updatedAt
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
  return {
    downloadReference: downloadRef
      ? { downloadUrl: downloadRef.downloadUrl, expiresSeconds: downloadRef.expiresSeconds }
      : null
  };
}
