import { createPrismaClient } from "../../../../packages/data/src/client";
import type { Prisma } from "@prisma/client";
import type { AuthResolvedSessionContext } from "../auth/types";
import {
  assertClientPortalApprovalAccess,
  isClientPortalApprovalUser
} from "./client-portal-approval.runtime";

const prisma = createPrismaClient();

const MAX_TAG_COUNT = 30;
const MAX_TAG_LENGTH = 80;
const MAX_TITLE_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_CATEGORY_LENGTH = 200;

export type ClientPortalArticleMetadataInput = {
  title?: string;
  description?: string | null;
  tags?: string[];
  category?: string | null;
  scheduledPublishAt?: string | null;
};

export type ClientPortalEditableFieldName =
  | "title"
  | "body"
  | "description"
  | "tags"
  | "category"
  | "scheduledPublishAt";

function getActiveTenantId(authSession: AuthResolvedSessionContext): string | null {
  return authSession.tenantContext.activeMembership?.tenantId ?? null;
}

function serializeFieldValue(fieldName: ClientPortalEditableFieldName, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (fieldName === "tags" && Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag || tag.length > MAX_TAG_LENGTH) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(tag);
    if (normalized.length >= MAX_TAG_COUNT) break;
  }
  return normalized;
}

function parseScheduledPublishAt(value: string | null | undefined): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value.trim() === "") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

async function getEditableDeliverable(tenantId: string, deliverableId: string) {
  return prisma.aiDeliveryDeliverable.findFirst({
    where: { id: deliverableId, tenantId, isArchived: false },
    select: {
      id: true,
      title: true,
      description: true,
      bodyContent: true,
      tags: true,
      category: true,
      scheduledPublishAt: true,
      status: true,
      aiDeliveryProject: { select: { clientId: true } }
    }
  });
}

export async function assertClientPortalDeliverableEditAccess(
  authSession: AuthResolvedSessionContext,
  deliverableId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !isClientPortalApprovalUser(authSession)) return null;

  const deliverable = await getEditableDeliverable(tenantId, deliverableId);
  if (!deliverable || deliverable.status !== "PENDING_CLIENT_REVIEW") return null;
  if (!(await assertClientPortalApprovalAccess(authSession, deliverable.aiDeliveryProject.clientId))) {
    return null;
  }

  return { tenantId, deliverable };
}

type PrismaTx = Prisma.TransactionClient;

async function recordClientEdits(
  tx: PrismaTx,
  tenantId: string,
  deliverableId: string,
  userId: string,
  changes: Array<{ fieldName: ClientPortalEditableFieldName; oldValue: unknown; newValue: unknown }>
) {
  const rows = changes.filter((change) => serializeFieldValue(change.fieldName, change.oldValue) !== serializeFieldValue(change.fieldName, change.newValue));
  if (rows.length === 0) return;

  await tx.clientEdit.createMany({
    data: rows.map((change) => ({
      tenantId,
      deliverableId,
      userId,
      fieldName: change.fieldName,
      oldValue: serializeFieldValue(change.fieldName, change.oldValue),
      newValue: serializeFieldValue(change.fieldName, change.newValue)
    }))
  });
}

export async function updateArticleMetadata(
  authSession: AuthResolvedSessionContext,
  deliverableId: string,
  fields: ClientPortalArticleMetadataInput
) {
  const access = await assertClientPortalDeliverableEditAccess(authSession, deliverableId);
  if (!access) return null;

  const { tenantId, deliverable } = access;
  const data: {
    title?: string;
    description?: string | null;
    tags?: string[];
    category?: string | null;
    scheduledPublishAt?: Date | null;
  } = {};

  const changes: Array<{ fieldName: ClientPortalEditableFieldName; oldValue: unknown; newValue: unknown }> = [];

  if (fields.title !== undefined) {
    const title = fields.title.trim();
    if (!title || title.length > MAX_TITLE_LENGTH) return null;
    data.title = title;
    changes.push({ fieldName: "title", oldValue: deliverable.title, newValue: title });
  }

  if (fields.description !== undefined) {
    const description =
      fields.description === null ? null : fields.description.trim().slice(0, MAX_DESCRIPTION_LENGTH) || null;
    data.description = description;
    changes.push({ fieldName: "description", oldValue: deliverable.description, newValue: description });
  }

  if (fields.tags !== undefined) {
    const tags = normalizeTags(fields.tags);
    data.tags = tags;
    changes.push({ fieldName: "tags", oldValue: deliverable.tags, newValue: tags });
  }

  if (fields.category !== undefined) {
    const category =
      fields.category === null ? null : fields.category.trim().slice(0, MAX_CATEGORY_LENGTH) || null;
    data.category = category;
    changes.push({ fieldName: "category", oldValue: deliverable.category, newValue: category });
  }

  if (fields.scheduledPublishAt !== undefined) {
    const parsed = parseScheduledPublishAt(fields.scheduledPublishAt);
    if (fields.scheduledPublishAt !== null && fields.scheduledPublishAt.trim() !== "" && parsed === null) {
      return null;
    }
    data.scheduledPublishAt = parsed ?? null;
    changes.push({
      fieldName: "scheduledPublishAt",
      oldValue: deliverable.scheduledPublishAt,
      newValue: parsed ?? null
    });
  }

  if (Object.keys(data).length === 0) {
    return {
      deliverable: {
        id: deliverable.id,
        title: deliverable.title,
        description: deliverable.description,
        tags: deliverable.tags,
        category: deliverable.category,
        scheduledPublishAt: deliverable.scheduledPublishAt?.toISOString() ?? null,
        updatedAt: new Date().toISOString()
      }
    };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.aiDeliveryDeliverable.update({
      where: { id: deliverableId },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        category: true,
        scheduledPublishAt: true,
        updatedAt: true
      }
    });

    await recordClientEdits(tx, tenantId, deliverableId, authSession.user.id, changes);
    return saved;
  });

  return {
    deliverable: {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      tags: updated.tags,
      category: updated.category,
      scheduledPublishAt: updated.scheduledPublishAt?.toISOString() ?? null,
      updatedAt: updated.updatedAt.toISOString()
    }
  };
}

export async function updateArticleBody(
  authSession: AuthResolvedSessionContext,
  deliverableId: string,
  bodyContent: string
) {
  const access = await assertClientPortalDeliverableEditAccess(authSession, deliverableId);
  if (!access) return null;

  const { tenantId, deliverable } = access;
  const nextBody = bodyContent;

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.aiDeliveryDeliverable.update({
      where: { id: deliverableId },
      data: { bodyContent: nextBody },
      select: { id: true, bodyContent: true, updatedAt: true }
    });

    await recordClientEdits(tx, tenantId, deliverableId, authSession.user.id, [
      { fieldName: "body", oldValue: deliverable.bodyContent ?? "", newValue: nextBody }
    ]);

    return saved;
  });

  return {
    deliverable: {
      id: updated.id,
      bodyContent: updated.bodyContent ?? "",
      updatedAt: updated.updatedAt.toISOString()
    }
  };
}

export async function getClientPortalDeliverableEditHistory(
  authSession: AuthResolvedSessionContext,
  deliverableId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const deliverable = await prisma.aiDeliveryDeliverable.findFirst({
    where: { id: deliverableId, tenantId, isArchived: false },
    select: {
      id: true,
      status: true,
      aiDeliveryProject: { select: { clientId: true } }
    }
  });
  if (!deliverable) return null;

  const isClientUser = isClientPortalApprovalUser(authSession);
  const isAdmin = !isClientUser;
  if (isClientUser) {
    if (!(await assertClientPortalApprovalAccess(authSession, deliverable.aiDeliveryProject.clientId))) {
      return null;
    }
  }

  const edits = await prisma.clientEdit.findMany({
    where: { tenantId, deliverableId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      fieldName: true,
      oldValue: true,
      newValue: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true } }
    }
  });

  return {
    edits: edits.map((edit) => ({
      id: edit.id,
      fieldName: edit.fieldName,
      oldValue: edit.oldValue,
      newValue: edit.newValue,
      createdAt: edit.createdAt.toISOString(),
      user: {
        id: edit.user.id,
        name: edit.user.name,
        email: isAdmin ? edit.user.email : null
      }
    }))
  };
}
