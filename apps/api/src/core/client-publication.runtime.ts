import type { Prisma } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuthResolvedSessionContext } from "../auth/types";
import {
  decryptCredentialPlaintext,
  encryptCredentialPlaintext,
  isCredentialEncryptionConfigured
} from "../services/credential-encryption.service";
import { recordPlatformAuditEvent } from "../security/audit-log.service";
import type {
  ClientAnalyticsProfileInputRequest,
  ClientAnalyticsProfileResponse,
  PublicationLogSummary,
  PublicationLogsResponse,
  PublicationTargetCredentialStatusResponse,
  PublicationTargetCredentialUpsertRequest,
  PublicationTargetInputRequest,
  PublicationTargetResponse,
  PublicationTargetsResponse
} from "./core.types";

const prisma = createPrismaClient();
type PrismaTx = Prisma.TransactionClient;

const FORBIDDEN_CREDENTIAL_KEYS = [
  "password",
  "token",
  "apikey",
  "api_key",
  "secret",
  "clientsecret",
  "refreshtoken",
  "accesstoken",
  "bearertoken",
  "authheader",
  "applicationpassword",
  "application_password"
];

function getActiveTenantId(authSession: AuthResolvedSessionContext): string | null {
  return authSession.tenantContext.activeMembership?.tenantId ?? null;
}

function toNullableString(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeWebsiteUrl(value: string | null | undefined): string | null {
  const raw = toNullableString(value);
  if (!raw) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.protocol}//${host}${path === "/" ? "" : path}`;
  } catch {
    return null;
  }
}

function normalizePublicationSiteUrl(value: string): string | null {
  const normalized = normalizeWebsiteUrl(value);
  return normalized ? normalized.replace(/\/+$/, "") : null;
}

function hasForbiddenCredentialField(input: Record<string, unknown>): boolean {
  return Object.keys(input).some((key) => {
    const normalized = key.toLowerCase();
    if (normalized === "applicationpassword") {
      return false;
    }
    return FORBIDDEN_CREDENTIAL_KEYS.includes(normalized);
  });
}

async function getTenantClient(tx: PrismaTx, tenantId: string, clientId: string) {
  return tx.client.findFirst({
    where: { id: clientId, tenantId },
    select: { id: true, name: true, website: true }
  });
}

const publicationTargetSelect = {
  id: true,
  clientId: true,
  label: true,
  connectorType: true,
  siteUrl: true,
  siteSlug: true,
  wordpressUsername: true,
  wordPressComSite: true,
  isDefault: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true
} as const;

function toPublicationTargetSummary(target: {
  id: string;
  clientId: string;
  label: string;
  connectorType: string;
  siteUrl: string;
  siteSlug: string | null;
  wordpressUsername: string | null;
  wordPressComSite: boolean;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: target.id,
    clientId: target.clientId,
    label: target.label,
    connectorType: target.connectorType,
    siteUrl: target.siteUrl,
    siteSlug: target.siteSlug,
    wordpressUsername: target.wordpressUsername,
    wordPressComSite: target.wordPressComSite,
    isDefault: target.isDefault,
    isArchived: target.isArchived,
    createdAt: target.createdAt.toISOString(),
    updatedAt: target.updatedAt.toISOString()
  };
}

export async function listPublicationTargetsForClient(
  authSession: AuthResolvedSessionContext,
  clientId: string
): Promise<PublicationTargetsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !clientId) {
    return null;
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { id: true }
  });
  if (!client) {
    return { publicationTargets: [] };
  }

  const targets = await prisma.publicationTarget.findMany({
    where: { tenantId, clientId, isArchived: false },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: publicationTargetSelect
  });

  return { publicationTargets: targets.map(toPublicationTargetSummary) };
}

export async function createPublicationTargetForClient(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  input: PublicationTargetInputRequest
): Promise<PublicationTargetResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !clientId) {
    return null;
  }

  const label = toNullableString(input.label);
  const siteUrl = input.siteUrl ? normalizePublicationSiteUrl(input.siteUrl) : null;
  if (!label || !siteUrl) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const client = await getTenantClient(tx, tenantId, clientId);
    if (!client) {
      return { publicationTarget: null };
    }

    const shouldDefault = Boolean(input.isDefault);
    if (shouldDefault) {
      await tx.publicationTarget.updateMany({
        where: { tenantId, clientId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const existingDefault = await tx.publicationTarget.count({
      where: { tenantId, clientId, isArchived: false, isDefault: true }
    });

    const created = await tx.publicationTarget.create({
      data: {
        tenantId,
        clientId,
        label,
        connectorType: "WORDPRESS",
        siteUrl,
        siteSlug: toNullableString(input.siteSlug),
        wordpressUsername: toNullableString(input.wordpressUsername),
        wordPressComSite: Boolean(input.wordPressComSite),
        isDefault: shouldDefault || existingDefault === 0
      },
      select: publicationTargetSelect
    });

    await recordPlatformAuditEvent({
      tenantId,
      actorUserId: authSession.user.id,
      action: "PUBLICATION_TARGET_CREATED",
      entityType: "PUBLICATION_TARGET",
      entityId: created.id,
      metadata: { clientId, siteUrlHost: new URL(siteUrl).hostname }
    });

    return { publicationTarget: toPublicationTargetSummary(created) };
  });
}

export async function updatePublicationTargetForClient(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  publicationTargetId: string,
  input: PublicationTargetInputRequest
): Promise<PublicationTargetResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !clientId || !publicationTargetId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.publicationTarget.findFirst({
      where: { id: publicationTargetId, tenantId, clientId, isArchived: false },
      select: { id: true }
    });
    if (!existing) {
      return { publicationTarget: null };
    }

    if (input.isDefault === true) {
      await tx.publicationTarget.updateMany({
        where: { tenantId, clientId, isDefault: true },
        data: { isDefault: false }
      });
    }

    const updateData: Prisma.PublicationTargetUpdateInput = {};
    if (input.label !== undefined) {
      const label = toNullableString(input.label);
      if (!label) {
        return { publicationTarget: null };
      }
      updateData.label = label;
    }
    if (input.siteUrl !== undefined) {
      const siteUrl = normalizePublicationSiteUrl(String(input.siteUrl));
      if (!siteUrl) {
        return { publicationTarget: null };
      }
      updateData.siteUrl = siteUrl;
    }
    if (input.siteSlug !== undefined) {
      updateData.siteSlug = toNullableString(input.siteSlug);
    }
    if (input.wordpressUsername !== undefined) {
      updateData.wordpressUsername = toNullableString(input.wordpressUsername);
    }
    if (input.wordPressComSite !== undefined) {
      updateData.wordPressComSite = Boolean(input.wordPressComSite);
    }
    if (input.isDefault !== undefined) {
      updateData.isDefault = Boolean(input.isDefault);
    }

    const updated = await tx.publicationTarget.update({
      where: { id: publicationTargetId },
      data: updateData,
      select: publicationTargetSelect
    });

    return { publicationTarget: toPublicationTargetSummary(updated) };
  });
}

export async function archivePublicationTargetForClient(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  publicationTargetId: string
): Promise<PublicationTargetResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !clientId || !publicationTargetId) {
    return null;
  }

  const updated = await prisma.publicationTarget.updateMany({
    where: { id: publicationTargetId, tenantId, clientId, isArchived: false },
    data: { isArchived: true, isDefault: false }
  });
  if (updated.count === 0) {
    return { publicationTarget: null };
  }

  const target = await prisma.publicationTarget.findFirst({
    where: { id: publicationTargetId, tenantId, clientId },
    select: publicationTargetSelect
  });

  return { publicationTarget: target ? toPublicationTargetSummary(target) : null };
}

export async function resolvePublicationTargetForClient(
  tenantId: string,
  clientId: string,
  publicationTargetId?: string | null
) {
  if (publicationTargetId) {
    return prisma.publicationTarget.findFirst({
      where: {
        id: publicationTargetId,
        tenantId,
        clientId,
        isArchived: false
      },
      select: publicationTargetSelect
    });
  }

  return prisma.publicationTarget.findFirst({
    where: {
      tenantId,
      clientId,
      isArchived: false,
      isDefault: true
    },
    select: publicationTargetSelect
  });
}

export async function getPublicationTargetCredentialStatus(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  publicationTargetId: string
): Promise<PublicationTargetCredentialStatusResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const target = await prisma.publicationTarget.findFirst({
    where: { id: publicationTargetId, tenantId, clientId, isArchived: false },
    select: {
      id: true,
      credentials: {
        select: { updatedAt: true, updatedByUserId: true }
      }
    }
  });

  if (!target) {
    return { configured: false, encryptionAvailable: isCredentialEncryptionConfigured(), updatedAt: null };
  }

  return {
    configured: Boolean(target.credentials),
    encryptionAvailable: isCredentialEncryptionConfigured(),
    updatedAt: target.credentials?.updatedAt.toISOString() ?? null
  };
}

export async function savePublicationTargetCredentials(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  publicationTargetId: string,
  input: PublicationTargetCredentialUpsertRequest
): Promise<PublicationTargetCredentialStatusResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  if (hasForbiddenCredentialField((input ?? {}) as Record<string, unknown>)) {
    return null;
  }

  const applicationPassword = toNullableString(input.applicationPassword);
  if (!applicationPassword) {
    return null;
  }

  if (!isCredentialEncryptionConfigured()) {
    return null;
  }

  const encrypted = encryptCredentialPlaintext(applicationPassword, tenantId);
  if (!encrypted) {
    return null;
  }

  const target = await prisma.publicationTarget.findFirst({
    where: { id: publicationTargetId, tenantId, clientId, isArchived: false },
    select: { id: true, siteUrl: true }
  });
  if (!target) {
    return null;
  }

  await prisma.publicationTargetCredential.upsert({
    where: { publicationTargetId },
    update: {
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      updatedByUserId: authSession.user.id,
      updatedAt: new Date()
    },
    create: {
      tenantId,
      publicationTargetId,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      updatedByUserId: authSession.user.id
    }
  });

  let siteUrlHost: string | null = null;
  try {
    siteUrlHost = new URL(target.siteUrl).hostname;
  } catch {
    siteUrlHost = null;
  }

  await recordPlatformAuditEvent({
    tenantId,
    actorUserId: authSession.user.id,
    action: "WORDPRESS_CREDENTIALS_UPDATED",
    entityType: "PUBLICATION_TARGET",
    entityId: publicationTargetId,
    metadata: { clientId, publicationTargetId, credentialsPresent: true, siteUrlHost }
  });

  return getPublicationTargetCredentialStatus(authSession, clientId, publicationTargetId);
}

export async function deletePublicationTargetCredentials(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  publicationTargetId: string
): Promise<PublicationTargetCredentialStatusResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  await prisma.publicationTargetCredential.deleteMany({
    where: {
      tenantId,
      publicationTargetId,
      publicationTarget: { clientId }
    }
  });

  await recordPlatformAuditEvent({
    tenantId,
    actorUserId: authSession.user.id,
    action: "WORDPRESS_CREDENTIALS_DELETED",
    entityType: "PUBLICATION_TARGET",
    entityId: publicationTargetId,
    metadata: { clientId, publicationTargetId }
  });

  return getPublicationTargetCredentialStatus(authSession, clientId, publicationTargetId);
}

export async function getDecryptedPublicationTargetPassword(
  tenantId: string,
  publicationTargetId: string
): Promise<string | null> {
  const record = await prisma.publicationTargetCredential.findFirst({
    where: { tenantId, publicationTargetId },
    select: { ciphertext: true, iv: true, authTag: true }
  });
  if (!record) {
    return null;
  }

  return decryptCredentialPlaintext(record.ciphertext, record.iv, record.authTag, tenantId);
}

export async function getClientAnalyticsProfile(
  authSession: AuthResolvedSessionContext,
  clientId: string
): Promise<ClientAnalyticsProfileResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const profile = await prisma.clientAnalyticsProfile.findFirst({
    where: { tenantId, clientId },
    select: {
      id: true,
      clientId: true,
      gscSiteUrl: true,
      ga4PropertyId: true,
      defaultSourceType: true,
      connectionStatus: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return {
    profile: profile
      ? {
          id: profile.id,
          clientId: profile.clientId,
          gscSiteUrl: profile.gscSiteUrl,
          ga4PropertyId: profile.ga4PropertyId,
          defaultSourceType: profile.defaultSourceType,
          connectionStatus: profile.connectionStatus,
          createdAt: profile.createdAt.toISOString(),
          updatedAt: profile.updatedAt.toISOString()
        }
      : null
  };
}

export async function saveClientAnalyticsProfile(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  input: ClientAnalyticsProfileInputRequest
): Promise<ClientAnalyticsProfileResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { id: true }
  });
  if (!client) {
    return { profile: null };
  }

  const profile = await prisma.clientAnalyticsProfile.upsert({
    where: { clientId },
    update: {
      gscSiteUrl: input.gscSiteUrl !== undefined ? toNullableString(input.gscSiteUrl) : undefined,
      ga4PropertyId: input.ga4PropertyId !== undefined ? toNullableString(input.ga4PropertyId) : undefined,
      defaultSourceType: input.defaultSourceType ?? undefined,
      connectionStatus: input.connectionStatus ?? undefined
    },
    create: {
      tenantId,
      clientId,
      gscSiteUrl: toNullableString(input.gscSiteUrl),
      ga4PropertyId: toNullableString(input.ga4PropertyId),
      defaultSourceType: input.defaultSourceType ?? "MANUAL",
      connectionStatus: input.connectionStatus ?? "MANUAL"
    },
    select: {
      id: true,
      clientId: true,
      gscSiteUrl: true,
      ga4PropertyId: true,
      defaultSourceType: true,
      connectionStatus: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return {
    profile: {
      id: profile.id,
      clientId: profile.clientId,
      gscSiteUrl: profile.gscSiteUrl,
      ga4PropertyId: profile.ga4PropertyId,
      defaultSourceType: profile.defaultSourceType,
      connectionStatus: profile.connectionStatus,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString()
    }
  };
}

export async function recordPublicationLog(input: {
  tenantId: string;
  clientId: string;
  publicationTargetId?: string | null;
  aiDeliveryProjectId?: string | null;
  deliverableId?: string | null;
  action: string;
  status: "PREPARED" | "PROVIDER_DISABLED" | "PUBLISHED" | "FAILED";
  siteUrlHost?: string | null;
  externalPostId?: string | null;
  actorUserId?: string | null;
  note?: string | null;
}): Promise<PublicationLogSummary> {
  const log = await prisma.publicationLog.create({
    data: {
      tenantId: input.tenantId,
      clientId: input.clientId,
      publicationTargetId: input.publicationTargetId ?? null,
      aiDeliveryProjectId: input.aiDeliveryProjectId ?? null,
      deliverableId: input.deliverableId ?? null,
      action: input.action,
      status: input.status,
      siteUrlHost: input.siteUrlHost ?? null,
      externalPostId: input.externalPostId ?? null,
      actorUserId: input.actorUserId ?? null,
      note: input.note ?? null
    },
    select: {
      id: true,
      clientId: true,
      publicationTargetId: true,
      aiDeliveryProjectId: true,
      deliverableId: true,
      action: true,
      status: true,
      siteUrlHost: true,
      externalPostId: true,
      note: true,
      createdAt: true
    }
  });

  return {
    id: log.id,
    clientId: log.clientId,
    publicationTargetId: log.publicationTargetId,
    aiDeliveryProjectId: log.aiDeliveryProjectId,
    deliverableId: log.deliverableId,
    action: log.action,
    status: log.status,
    siteUrlHost: log.siteUrlHost,
    externalPostId: log.externalPostId,
    note: log.note,
    createdAt: log.createdAt.toISOString()
  };
}

export async function listPublicationLogsForClient(
  authSession: AuthResolvedSessionContext,
  clientId: string
): Promise<PublicationLogsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const logs = await prisma.publicationLog.findMany({
    where: { tenantId, clientId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      clientId: true,
      publicationTargetId: true,
      aiDeliveryProjectId: true,
      deliverableId: true,
      action: true,
      status: true,
      siteUrlHost: true,
      externalPostId: true,
      note: true,
      createdAt: true
    }
  });

  return {
    publicationLogs: logs.map((log) => ({
      id: log.id,
      clientId: log.clientId,
      publicationTargetId: log.publicationTargetId,
      aiDeliveryProjectId: log.aiDeliveryProjectId,
      deliverableId: log.deliverableId,
      action: log.action,
      status: log.status,
      siteUrlHost: log.siteUrlHost,
      externalPostId: log.externalPostId,
      note: log.note,
      createdAt: log.createdAt.toISOString()
    }))
  };
}
