import type { Prisma } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type {
  AiKnowledgeItemInputRequest,
  AiKnowledgeItemResponse,
  AiKnowledgeItemsResponse,
  AiKnowledgeItemSummary,
  AiKnowledgePromoteInputRequest,
  AiKnowledgeScope,
  AiKnowledgeStatus,
  AiKnowledgeType,
  AiContextPreviewInputRequest,
  AiContextPreviewResponse
} from "@dca-os-v1/shared";
import type { AuthResolvedSessionContext } from "../auth/types";
import { AiDeliveryGuardError } from "./core.runtime";
import { buildAiContextPreview } from "./ai-context-builder.service";

const prisma = createPrismaClient();

type PrismaTx = Prisma.TransactionClient;

function throwAiKnowledgeBadRequest(code: string, message: string): never {
  throw new AiDeliveryGuardError(400, code, message);
}

const AI_KNOWLEDGE_SCOPES: AiKnowledgeScope[] = ["SYSTEM", "CLIENT", "PROJECT", "INDUSTRY"];
const AI_KNOWLEDGE_TYPES: AiKnowledgeType[] = [
  "CLIENT_FACT", "BRAND_VOICE", "TARGET_AUDIENCE", "PRODUCT_SERVICE", "OFFER", "COMPETITOR",
  "RESEARCH_NOTE", "MARKET_INSIGHT", "SEO_KEYWORD_GROUP", "CONTENT_EXAMPLE", "IMAGE_STYLE",
  "REPORT_INSIGHT", "PERFORMANCE_LEARNING", "FORBIDDEN_CLAIM", "APPROVED_LINK", "PROJECT_CONTEXT", "INDUSTRY_NOTE"
];
const AI_KNOWLEDGE_STATUSES: AiKnowledgeStatus[] = ["RAW", "REVIEWED", "APPROVED", "EXPIRED", "ARCHIVED", "REPLACED"];
const NON_PROMPT_ELIGIBLE_STATUSES: AiKnowledgeStatus[] = ["EXPIRED", "ARCHIVED", "REPLACED"];

const aiKnowledgeItemSelect = {
  id: true,
  tenantId: true,
  clientId: true,
  aiDeliveryProjectId: true,
  scope: true,
  type: true,
  status: true,
  title: true,
  summary: true,
  body: true,
  sourceType: true,
  sourceUrl: true,
  sourceDate: true,
  confidence: true,
  expiresAt: true,
  evergreen: true,
  allowedForPrompt: true,
  clientVisible: true,
  version: true,
  replacedById: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true
} as const;

function getActiveTenantId(authSession: AuthResolvedSessionContext): string | null {
  return authSession.tenantContext.activeMembership?.tenantId ?? null;
}

function getActiveUserId(authSession: AuthResolvedSessionContext): string | null {
  return authSession.user?.id ?? null;
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeScope(value: unknown): AiKnowledgeScope | null {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase() as AiKnowledgeScope;
  return AI_KNOWLEDGE_SCOPES.includes(upper) ? upper : null;
}

function normalizeType(value: unknown): AiKnowledgeType | null {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase() as AiKnowledgeType;
  return AI_KNOWLEDGE_TYPES.includes(upper) ? upper : null;
}

function normalizeStatus(value: unknown, fallback: AiKnowledgeStatus = "RAW"): AiKnowledgeStatus {
  if (typeof value !== "string") return fallback;
  const upper = value.trim().toUpperCase() as AiKnowledgeStatus;
  return AI_KNOWLEDGE_STATUSES.includes(upper) ? upper : fallback;
}

function parseOptionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validateHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throwAiKnowledgeBadRequest("AI_KNOWLEDGE_SOURCE_URL_INVALID", "Source URL must use http or https.");
    }
    return parsed.toString();
  } catch (error) {
    if (error instanceof AiDeliveryGuardError) throw error;
    throwAiKnowledgeBadRequest("AI_KNOWLEDGE_SOURCE_URL_INVALID", "Source URL must use http or https.");
  }
}

function toAiKnowledgeItemSummary(row: {
  id: string;
  tenantId: string;
  clientId: string | null;
  aiDeliveryProjectId: string | null;
  scope: string;
  type: string;
  status: string;
  title: string;
  summary: string | null;
  body: string | null;
  sourceType: string | null;
  sourceUrl: string | null;
  sourceDate: Date | null;
  confidence: string | null;
  expiresAt: Date | null;
  evergreen: boolean;
  allowedForPrompt: boolean;
  clientVisible: boolean;
  version: number;
  replacedById: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AiKnowledgeItemSummary {
  return {
    id: row.id,
    tenantId: row.tenantId,
    clientId: row.clientId,
    aiDeliveryProjectId: row.aiDeliveryProjectId,
    scope: row.scope as AiKnowledgeScope,
    type: row.type as AiKnowledgeType,
    status: row.status as AiKnowledgeStatus,
    title: row.title,
    summary: row.summary,
    body: row.body,
    sourceType: row.sourceType,
    sourceUrl: row.sourceUrl,
    sourceDate: row.sourceDate?.toISOString() ?? null,
    confidence: row.confidence,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    evergreen: row.evergreen,
    allowedForPrompt: row.allowedForPrompt,
    clientVisible: row.clientVisible,
    version: row.version,
    replacedById: row.replacedById,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function enforcePromptVisibilityRules(status: AiKnowledgeStatus, allowedForPrompt: boolean, clientVisible: boolean): void {
  if (allowedForPrompt && status !== "APPROVED") {
    throwAiKnowledgeBadRequest("AI_KNOWLEDGE_PROMPT_REQUIRES_APPROVED", "allowedForPrompt requires APPROVED status.");
  }
  if (clientVisible && status !== "APPROVED") {
    throwAiKnowledgeBadRequest("AI_KNOWLEDGE_CLIENT_VISIBLE_REQUIRES_APPROVED", "clientVisible requires APPROVED status.");
  }
  if (NON_PROMPT_ELIGIBLE_STATUSES.includes(status) && allowedForPrompt) {
    throwAiKnowledgeBadRequest("AI_KNOWLEDGE_STATUS_NOT_PROMPT_ELIGIBLE", "Expired, archived, or replaced items cannot be prompt-eligible.");
  }
}

async function validateScopeLinks(
  tx: PrismaTx | typeof prisma,
  tenantId: string,
  scope: AiKnowledgeScope,
  clientId: string | null,
  aiDeliveryProjectId: string | null
): Promise<{ clientId: string | null; aiDeliveryProjectId: string | null }> {
  if (scope === "CLIENT") {
    if (!clientId) {
      throwAiKnowledgeBadRequest("AI_KNOWLEDGE_CLIENT_SCOPE_REQUIRES_CLIENT", "CLIENT scope requires clientId.");
    }
    const client = await tx.client.findFirst({ where: { id: clientId, tenantId, isArchived: false }, select: { id: true } });
    if (!client) {
      throwAiKnowledgeBadRequest("AI_KNOWLEDGE_CLIENT_INVALID", "Client must belong to the active tenant.");
    }
    return { clientId, aiDeliveryProjectId: aiDeliveryProjectId ?? null };
  }

  if (scope === "PROJECT") {
    if (!aiDeliveryProjectId) {
      throwAiKnowledgeBadRequest("AI_KNOWLEDGE_PROJECT_SCOPE_REQUIRES_PROJECT", "PROJECT scope requires aiDeliveryProjectId.");
    }
    const project = await tx.aiDeliveryProject.findFirst({
      where: { id: aiDeliveryProjectId, tenantId, isArchived: false },
      select: { id: true, clientId: true }
    });
    if (!project) {
      throwAiKnowledgeBadRequest("AI_KNOWLEDGE_PROJECT_INVALID", "AI Delivery project must belong to the active tenant.");
    }
    if (clientId && clientId !== project.clientId) {
      throwAiKnowledgeBadRequest("AI_KNOWLEDGE_PROJECT_CLIENT_MISMATCH", "clientId must match the AI Delivery project client.");
    }
    return { clientId: project.clientId, aiDeliveryProjectId };
  }

  if (scope === "INDUSTRY") {
    if (clientId) {
      throwAiKnowledgeBadRequest("AI_KNOWLEDGE_INDUSTRY_SCOPE_NO_CLIENT", "INDUSTRY scope must not include clientId.");
    }
    return { clientId: null, aiDeliveryProjectId: null };
  }

  // SYSTEM
  if (clientId) {
    const client = await tx.client.findFirst({ where: { id: clientId, tenantId }, select: { id: true } });
    if (!client) {
      throwAiKnowledgeBadRequest("AI_KNOWLEDGE_CLIENT_INVALID", "Client must belong to the active tenant.");
    }
  }
  if (aiDeliveryProjectId) {
    const project = await tx.aiDeliveryProject.findFirst({ where: { id: aiDeliveryProjectId, tenantId }, select: { id: true } });
    if (!project) {
      throwAiKnowledgeBadRequest("AI_KNOWLEDGE_PROJECT_INVALID", "AI Delivery project must belong to the active tenant.");
    }
  }
  return { clientId, aiDeliveryProjectId };
}

async function createKnowledgeVersion(
  tx: PrismaTx,
  item: {
    id: string;
    version: number;
    title: string;
    summary: string | null;
    body: string | null;
    status: AiKnowledgeStatus;
    allowedForPrompt: boolean;
    clientVisible: boolean;
    expiresAt: Date | null;
  },
  changeReason: string | null,
  createdByUserId: string | null
): Promise<void> {
  await tx.aiKnowledgeItemVersion.create({
    data: {
      knowledgeItemId: item.id,
      version: item.version,
      title: item.title,
      summary: item.summary,
      body: item.body,
      status: item.status,
      allowedForPrompt: item.allowedForPrompt,
      clientVisible: item.clientVisible,
      expiresAt: item.expiresAt,
      changeReason,
      createdByUserId
    }
  });
}

function meaningfulFieldsChanged(
  existing: { title: string; summary: string | null; body: string | null; status: string; allowedForPrompt: boolean; clientVisible: boolean; expiresAt: Date | null },
  next: { title: string; summary: string | null; body: string | null; status: AiKnowledgeStatus; allowedForPrompt: boolean; clientVisible: boolean; expiresAt: Date | null }
): boolean {
  return (
    existing.title !== next.title ||
    existing.summary !== next.summary ||
    existing.body !== next.body ||
    existing.status !== next.status ||
    existing.allowedForPrompt !== next.allowedForPrompt ||
    existing.clientVisible !== next.clientVisible ||
    (existing.expiresAt?.toISOString() ?? null) !== (next.expiresAt?.toISOString() ?? null)
  );
}

export interface ListAiKnowledgeItemsQuery {
  clientId?: string;
  aiDeliveryProjectId?: string;
  scope?: string;
  type?: string;
  status?: string;
  allowedForPrompt?: string;
  clientVisible?: string;
  q?: string;
  includeExpired?: string;
  limit?: string;
}

export async function listAiKnowledgeItems(
  authSession: AuthResolvedSessionContext,
  query: ListAiKnowledgeItemsQuery
): Promise<AiKnowledgeItemsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const limitRaw = query.limit ? Number.parseInt(query.limit, 10) : 50;
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
  const includeExpired = query.includeExpired === "true";

  const where: Prisma.AiKnowledgeItemWhereInput = { tenantId };

  if (query.clientId) {
    const client = await prisma.client.findFirst({ where: { id: query.clientId, tenantId }, select: { id: true } });
    if (!client) return { knowledgeItems: [] };
    where.clientId = query.clientId;
  }

  if (query.aiDeliveryProjectId) {
    const project = await prisma.aiDeliveryProject.findFirst({
      where: { id: query.aiDeliveryProjectId, tenantId },
      select: { id: true }
    });
    if (!project) return { knowledgeItems: [] };
    where.aiDeliveryProjectId = query.aiDeliveryProjectId;
  }

  const scope = query.scope ? normalizeScope(query.scope) : null;
  if (scope) where.scope = scope;

  const type = query.type ? normalizeType(query.type) : null;
  if (type) where.type = type;

  const status = query.status ? normalizeStatus(query.status) : null;
  if (status) where.status = status;

  if (query.allowedForPrompt === "true") where.allowedForPrompt = true;
  if (query.allowedForPrompt === "false") where.allowedForPrompt = false;
  if (query.clientVisible === "true") where.clientVisible = true;
  if (query.clientVisible === "false") where.clientVisible = false;

  if (!includeExpired) {
    where.NOT = {
      OR: [
        { status: "EXPIRED" },
        { AND: [{ expiresAt: { not: null } }, { expiresAt: { lt: new Date() } }] }
      ]
    };
  }

  if (query.q?.trim()) {
    const search = query.q.trim();
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { summary: { contains: search, mode: "insensitive" } },
      { body: { contains: search, mode: "insensitive" } }
    ];
  }

  const rows = await prisma.aiKnowledgeItem.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: aiKnowledgeItemSelect
  });

  return { knowledgeItems: rows.map(toAiKnowledgeItemSummary) };
}

export async function createAiKnowledgeItem(
  authSession: AuthResolvedSessionContext,
  input: AiKnowledgeItemInputRequest
): Promise<AiKnowledgeItemResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const scope = normalizeScope(input.scope);
  const type = normalizeType(input.type);
  if (!scope || !type || !input.title?.trim()) {
    throwAiKnowledgeBadRequest("AI_KNOWLEDGE_INPUT_INVALID", "title, scope, and type are required.");
  }

  const status = normalizeStatus(input.status, "RAW");
  let allowedForPrompt = input.allowedForPrompt ?? false;
  let clientVisible = input.clientVisible ?? false;
  enforcePromptVisibilityRules(status, allowedForPrompt, clientVisible);

  const sourceUrl = input.sourceUrl !== undefined ? validateHttpUrl(toNullableString(input.sourceUrl)) : null;
  const userId = getActiveUserId(authSession);

  return prisma.$transaction(async (tx: PrismaTx) => {
    const links = await validateScopeLinks(
      tx,
      tenantId,
      scope!,
      toNullableString(input.clientId),
      toNullableString(input.aiDeliveryProjectId)
    );

    const created = await tx.aiKnowledgeItem.create({
      data: {
        tenantId,
        clientId: links.clientId,
        aiDeliveryProjectId: links.aiDeliveryProjectId,
        scope: scope!,
        type: type!,
        status,
        title: input.title.trim(),
        summary: toNullableString(input.summary),
        body: toNullableString(input.body),
        sourceType: toNullableString(input.sourceType),
        sourceUrl,
        sourceDate: parseOptionalDate(input.sourceDate) ?? null,
        confidence: toNullableString(input.confidence),
        expiresAt: parseOptionalDate(input.expiresAt) ?? null,
        evergreen: input.evergreen ?? false,
        allowedForPrompt,
        clientVisible,
        createdByUserId: userId,
        reviewedByUserId: status === "REVIEWED" || status === "APPROVED" ? userId : null,
        approvedByUserId: status === "APPROVED" ? userId : null,
        approvedAt: status === "APPROVED" ? new Date() : null
      },
      select: aiKnowledgeItemSelect
    });

    return { knowledgeItem: toAiKnowledgeItemSummary(created) };
  });
}

export async function updateAiKnowledgeItem(
  authSession: AuthResolvedSessionContext,
  knowledgeItemId: string,
  input: AiKnowledgeItemInputRequest
): Promise<AiKnowledgeItemResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const userId = getActiveUserId(authSession);

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.aiKnowledgeItem.findFirst({
      where: { id: knowledgeItemId, tenantId },
      select: { ...aiKnowledgeItemSelect, reviewedByUserId: true, approvedByUserId: true }
    });
    if (!existing) return null;

    const nextScope = input.scope ? normalizeScope(input.scope) : (existing.scope as AiKnowledgeScope);
    const nextType = input.type ? normalizeType(input.type) : (existing.type as AiKnowledgeType);
    if (!nextScope || !nextType) {
      throwAiKnowledgeBadRequest("AI_KNOWLEDGE_INPUT_INVALID", "Invalid scope or type.");
    }

    const nextStatus = input.status ? normalizeStatus(input.status, existing.status as AiKnowledgeStatus) : (existing.status as AiKnowledgeStatus);
    let nextAllowedForPrompt = input.allowedForPrompt !== undefined ? input.allowedForPrompt : existing.allowedForPrompt;
    let nextClientVisible = input.clientVisible !== undefined ? input.clientVisible : existing.clientVisible;

    if (NON_PROMPT_ELIGIBLE_STATUSES.includes(nextStatus)) {
      nextAllowedForPrompt = false;
    }

    enforcePromptVisibilityRules(nextStatus, nextAllowedForPrompt, nextClientVisible);

    const nextClientId = input.clientId !== undefined ? toNullableString(input.clientId) : existing.clientId;
    const nextProjectId = input.aiDeliveryProjectId !== undefined ? toNullableString(input.aiDeliveryProjectId) : existing.aiDeliveryProjectId;
    await validateScopeLinks(tx, tenantId, nextScope!, nextClientId, nextProjectId);

    const nextTitle = input.title !== undefined ? input.title.trim() : existing.title;
    const nextSummary = input.summary !== undefined ? toNullableString(input.summary) : existing.summary;
    const nextBody = input.body !== undefined ? toNullableString(input.body) : existing.body;
    const nextExpiresAt = input.expiresAt !== undefined ? (parseOptionalDate(input.expiresAt) ?? null) : existing.expiresAt;
    const nextSourceUrl = input.sourceUrl !== undefined ? validateHttpUrl(toNullableString(input.sourceUrl)) : existing.sourceUrl;

    const nextSnapshot = {
      title: nextTitle,
      summary: nextSummary,
      body: nextBody,
      status: nextStatus,
      allowedForPrompt: nextAllowedForPrompt,
      clientVisible: nextClientVisible,
      expiresAt: nextExpiresAt
    };

    const versionBump = meaningfulFieldsChanged(existing, nextSnapshot);
    const nextVersion = versionBump ? existing.version + 1 : existing.version;

    if (versionBump) {
      await createKnowledgeVersion(
        tx,
        {
          id: existing.id,
          version: existing.version,
          title: existing.title,
          summary: existing.summary,
          body: existing.body,
          status: existing.status as AiKnowledgeStatus,
          allowedForPrompt: existing.allowedForPrompt,
          clientVisible: existing.clientVisible,
          expiresAt: existing.expiresAt
        },
        toNullableString(input.changeReason),
        userId
      );
    }

    const updated = await tx.aiKnowledgeItem.update({
      where: { id: knowledgeItemId },
      data: {
        clientId: nextClientId,
        aiDeliveryProjectId: nextProjectId,
        scope: nextScope!,
        type: nextType!,
        title: nextTitle,
        summary: nextSummary,
        body: nextBody,
        status: nextStatus,
        allowedForPrompt: nextAllowedForPrompt,
        clientVisible: nextClientVisible,
        expiresAt: nextExpiresAt,
        confidence: input.confidence !== undefined ? toNullableString(input.confidence) : existing.confidence,
        sourceType: input.sourceType !== undefined ? toNullableString(input.sourceType) : existing.sourceType,
        sourceUrl: nextSourceUrl,
        sourceDate: input.sourceDate !== undefined ? (parseOptionalDate(input.sourceDate) ?? null) : existing.sourceDate,
        evergreen: input.evergreen !== undefined ? input.evergreen : existing.evergreen,
        version: nextVersion,
        reviewedByUserId: nextStatus === "REVIEWED" || nextStatus === "APPROVED" ? (userId ?? existing.reviewedByUserId) : existing.reviewedByUserId,
        approvedByUserId: nextStatus === "APPROVED" ? (userId ?? existing.approvedByUserId) : existing.approvedByUserId,
        approvedAt: nextStatus === "APPROVED" ? (existing.approvedAt ?? new Date()) : existing.approvedAt
      },
      select: aiKnowledgeItemSelect
    });

    return { knowledgeItem: toAiKnowledgeItemSummary(updated) };
  });
}

export async function promoteAiDeliverySourceToKnowledgeItem(
  authSession: AuthResolvedSessionContext,
  input: AiKnowledgePromoteInputRequest
): Promise<AiKnowledgeItemResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  if (!input.sourceId?.trim() || !input.aiDeliveryProjectId?.trim()) {
    throwAiKnowledgeBadRequest("AI_KNOWLEDGE_PROMOTE_INPUT_INVALID", "sourceId and aiDeliveryProjectId are required.");
  }

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: input.aiDeliveryProjectId, tenantId, isArchived: false },
    select: { id: true, clientId: true }
  });
  if (!project) return null;

  const scope = input.scope ?? "PROJECT";
  const status = normalizeStatus(input.status, "REVIEWED");
  const allowedForPrompt = input.allowedForPrompt ?? false;
  const clientVisible = input.clientVisible ?? false;
  enforcePromptVisibilityRules(status, allowedForPrompt, clientVisible);

  let title = "";
  let summary: string | null = null;
  let body: string | null = null;
  let type: AiKnowledgeType = input.type ?? "RESEARCH_NOTE";
  let sourceType = input.sourceType;
  let sourceUrl: string | null = null;

  if (input.sourceType === "AI_DELIVERY_RESEARCH_SUMMARY") {
    const source = await prisma.aiDeliveryResearchSummary.findFirst({
      where: { id: input.sourceId, tenantId, aiDeliveryProjectId: project.id },
      select: {
        title: true,
        summaryText: true,
        keyFindings: true,
        audienceInsights: true,
        competitorInsights: true,
        keywordOpportunities: true,
        contentRecommendations: true,
        sourceNotes: true
      }
    });
    if (!source) return null;
    title = source.title;
    summary = source.summaryText;
    body = [
      source.keyFindings,
      source.audienceInsights,
      source.competitorInsights,
      source.keywordOpportunities,
      source.contentRecommendations,
      source.sourceNotes
    ].filter(Boolean).join("\n\n") || null;
    if (!input.type) type = "RESEARCH_NOTE";
    sourceUrl = null;
  } else if (input.sourceType === "AI_DELIVERY_DELIVERABLE") {
    const source = await prisma.aiDeliveryDeliverable.findFirst({
      where: { id: input.sourceId, tenantId, aiDeliveryProjectId: project.id },
      select: { title: true, description: true, notes: true, exportUrl: true }
    });
    if (!source) return null;
    title = source.title;
    summary = source.description;
    body = source.notes;
    if (!input.type) type = "CONTENT_EXAMPLE";
    sourceUrl = source.exportUrl;
  } else if (input.sourceType === "AI_DELIVERY_MONTHLY_REPORT") {
    const source = await prisma.aiDeliveryMonthlyReport.findFirst({
      where: { id: input.sourceId, tenantId, aiDeliveryProjectId: project.id },
      select: { title: true, adminSummaryNotes: true, recommendationsText: true, exportUrl: true }
    });
    if (!source) return null;
    title = source.title ?? "Monthly report insight";
    summary = source.adminSummaryNotes;
    body = source.recommendationsText;
    if (!input.type) type = "REPORT_INSIGHT";
    sourceUrl = source.exportUrl;
  } else {
    throwAiKnowledgeBadRequest("AI_KNOWLEDGE_PROMOTE_SOURCE_INVALID", "Unsupported promotion source type.");
  }

  return createAiKnowledgeItem(authSession, {
    clientId: project.clientId,
    aiDeliveryProjectId: project.id,
    scope,
    type,
    status,
    title,
    summary,
    body,
    sourceType,
    sourceUrl,
    allowedForPrompt,
    clientVisible,
    changeReason: input.changeReason ?? `Promoted from ${input.sourceType}:${input.sourceId}`
  });
}

export async function previewAiContext(
  authSession: AuthResolvedSessionContext,
  input: AiContextPreviewInputRequest
): Promise<AiContextPreviewResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const userId = getActiveUserId(authSession);
  if (!input.workflowType?.trim()) {
    throwAiKnowledgeBadRequest("AI_CONTEXT_PREVIEW_INPUT_INVALID", "workflowType is required.");
  }

  return buildAiContextPreview({
    tenantId,
    userId,
    clientId: toNullableString(input.clientId),
    aiDeliveryProjectId: toNullableString(input.aiDeliveryProjectId),
    workflowType: input.workflowType.trim(),
    requestedKnowledgeTypes: input.requestedKnowledgeTypes,
    includeRaw: input.includeRaw ?? false,
    includeExpired: input.includeExpired ?? false,
    maxTokens: input.maxTokens,
    oneOffInstruction: toNullableString(input.oneOffInstruction),
    saveSnapshot: input.saveSnapshot ?? false
  });
}
