import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuthResolvedSessionContext } from "../auth/types";
import { userCanAccessClient } from "./core.runtime";
import type {
  ClientCatalogInquiryInputRequest,
  ClientCatalogInquiryResponse,
  ClientCatalogInquiriesResponse,
  ClientCatalogInquiryStatus,
  ClientCatalogInquiryStatusInputRequest,
  ClientCatalogProductInputRequest,
  ClientCatalogProductResponse,
  ClientCatalogProductsResponse
} from "./core.types";

const prisma = createPrismaClient();

const CATALOG_INQUIRY_STATUSES = new Set<ClientCatalogInquiryStatus>(["NEW", "ACKNOWLEDGED", "CLOSED"]);

const catalogProductSelect = {
  id: true,
  clientId: true,
  name: true,
  description: true,
  sku: true,
  priceLabel: true,
  imageUrl: true,
  sortOrder: true,
  isVisibleInPortal: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true
} as const;

const catalogInquirySelect = {
  id: true,
  clientId: true,
  productId: true,
  product: { select: { name: true } },
  contactName: true,
  contactEmail: true,
  contactPhone: true,
  message: true,
  status: true,
  createdAt: true,
  updatedAt: true
} as const;

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

function normalizeInquiryStatus(value: string | null | undefined): ClientCatalogInquiryStatus {
  return value && CATALOG_INQUIRY_STATUSES.has(value as ClientCatalogInquiryStatus)
    ? (value as ClientCatalogInquiryStatus)
    : "NEW";
}

function toCatalogProductSummary(product: {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  sku: string | null;
  priceLabel: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isVisibleInPortal: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: product.id,
    clientId: product.clientId,
    name: product.name,
    description: product.description,
    sku: product.sku,
    priceLabel: product.priceLabel,
    imageUrl: product.imageUrl,
    sortOrder: product.sortOrder,
    isVisibleInPortal: product.isVisibleInPortal,
    isArchived: product.isArchived,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  };
}

function toCatalogInquirySummary(inquiry: {
  id: string;
  clientId: string;
  productId: string | null;
  product?: { name: string } | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  message: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: inquiry.id,
    clientId: inquiry.clientId,
    productId: inquiry.productId,
    productName: inquiry.product?.name ?? null,
    contactName: inquiry.contactName,
    contactEmail: inquiry.contactEmail,
    contactPhone: inquiry.contactPhone,
    message: inquiry.message,
    status: normalizeInquiryStatus(inquiry.status),
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString()
  };
}

async function getTenantClient(tenantId: string, clientId: string) {
  return prisma.client.findFirst({
    where: { id: clientId, tenantId, isArchived: false },
    select: { id: true }
  });
}

async function resolveClientIdFromAiDeliveryProject(tenantId: string, aiDeliveryProjectId: string) {
  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: aiDeliveryProjectId, tenantId, isArchived: false },
    select: { id: true, clientId: true }
  });
  return project?.clientId ?? null;
}

export async function listCatalogProductsForClient(
  authSession: AuthResolvedSessionContext,
  clientId: string
): Promise<ClientCatalogProductsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !clientId) {
    return null;
  }

  const client = await getTenantClient(tenantId, clientId);
  if (!client) {
    return { catalogProducts: [] };
  }

  const products = await prisma.clientCatalogProduct.findMany({
    where: { tenantId, clientId, isArchived: false },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: catalogProductSelect
  });

  return { catalogProducts: products.map(toCatalogProductSummary) };
}

export async function createCatalogProductForClient(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  input: ClientCatalogProductInputRequest
): Promise<ClientCatalogProductResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  const name = toNullableString(input.name);
  if (!tenantId || !clientId || !name) {
    return null;
  }

  const client = await getTenantClient(tenantId, clientId);
  if (!client) {
    return null;
  }

  const created = await prisma.clientCatalogProduct.create({
    data: {
      tenantId,
      clientId,
      name,
      description: toNullableString(input.description),
      sku: toNullableString(input.sku),
      priceLabel: toNullableString(input.priceLabel),
      imageUrl: toNullableString(input.imageUrl),
      sortOrder: typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder) ? Math.trunc(input.sortOrder) : 0,
      isVisibleInPortal: input.isVisibleInPortal === undefined ? true : Boolean(input.isVisibleInPortal)
    },
    select: catalogProductSelect
  });

  return { catalogProduct: toCatalogProductSummary(created) };
}

export async function updateCatalogProductForClient(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  productId: string,
  input: ClientCatalogProductInputRequest
): Promise<ClientCatalogProductResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !clientId || !productId) {
    return null;
  }

  const existing = await prisma.clientCatalogProduct.findFirst({
    where: { id: productId, tenantId, clientId, isArchived: false },
    select: { id: true }
  });
  if (!existing) {
    return null;
  }

  const name = input.name === undefined ? undefined : toNullableString(input.name);
  if (name === null) {
    return null;
  }

  const updated = await prisma.clientCatalogProduct.update({
    where: { id: productId },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(input.description !== undefined ? { description: toNullableString(input.description) } : {}),
      ...(input.sku !== undefined ? { sku: toNullableString(input.sku) } : {}),
      ...(input.priceLabel !== undefined ? { priceLabel: toNullableString(input.priceLabel) } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: toNullableString(input.imageUrl) } : {}),
      ...(input.sortOrder !== undefined && typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
        ? { sortOrder: Math.trunc(input.sortOrder) }
        : {}),
      ...(input.isVisibleInPortal !== undefined ? { isVisibleInPortal: Boolean(input.isVisibleInPortal) } : {})
    },
    select: catalogProductSelect
  });

  return { catalogProduct: toCatalogProductSummary(updated) };
}

export async function archiveCatalogProductForClient(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  productId: string
): Promise<ClientCatalogProductResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !clientId || !productId) {
    return null;
  }

  const existing = await prisma.clientCatalogProduct.findFirst({
    where: { id: productId, tenantId, clientId, isArchived: false },
    select: { id: true }
  });
  if (!existing) {
    return null;
  }

  const archived = await prisma.clientCatalogProduct.update({
    where: { id: productId },
    data: { isArchived: true },
    select: catalogProductSelect
  });

  return { catalogProduct: toCatalogProductSummary(archived) };
}

export async function listCatalogInquiriesForClient(
  authSession: AuthResolvedSessionContext,
  clientId: string
): Promise<ClientCatalogInquiriesResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !clientId) {
    return null;
  }

  const client = await getTenantClient(tenantId, clientId);
  if (!client) {
    return { catalogInquiries: [] };
  }

  const inquiries = await prisma.clientCatalogInquiry.findMany({
    where: { tenantId, clientId },
    orderBy: [{ createdAt: "desc" }],
    select: catalogInquirySelect
  });

  return { catalogInquiries: inquiries.map(toCatalogInquirySummary) };
}

export async function updateCatalogInquiryStatusForClient(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  inquiryId: string,
  input: ClientCatalogInquiryStatusInputRequest
): Promise<ClientCatalogInquiryResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  const status = normalizeInquiryStatus(input.status);
  if (!tenantId || !clientId || !inquiryId) {
    return null;
  }

  const existing = await prisma.clientCatalogInquiry.findFirst({
    where: { id: inquiryId, tenantId, clientId },
    select: { id: true }
  });
  if (!existing) {
    return null;
  }

  const updated = await prisma.clientCatalogInquiry.update({
    where: { id: inquiryId },
    data: { status },
    select: catalogInquirySelect
  });

  return { catalogInquiry: toCatalogInquirySummary(updated) };
}

export async function listClientPortalCatalogProducts(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<ClientCatalogProductsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const clientId = await resolveClientIdFromAiDeliveryProject(tenantId, aiDeliveryProjectId);
  if (!clientId || !(await userCanAccessClient(authSession, clientId))) {
    return null;
  }

  const products = await prisma.clientCatalogProduct.findMany({
    where: { tenantId, clientId, isArchived: false, isVisibleInPortal: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: catalogProductSelect
  });

  return { catalogProducts: products.map(toCatalogProductSummary) };
}

export async function submitClientPortalCatalogInquiry(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  input: ClientCatalogInquiryInputRequest
): Promise<ClientCatalogInquiryResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  const contactName = toNullableString(input.contactName);
  const contactEmail = toNullableString(input.contactEmail);
  const message = toNullableString(input.message);
  if (!tenantId || !contactName || !contactEmail || !message) {
    return null;
  }

  const clientId = await resolveClientIdFromAiDeliveryProject(tenantId, aiDeliveryProjectId);
  if (!clientId || !(await userCanAccessClient(authSession, clientId))) {
    return null;
  }

  const productId = toNullableString(input.productId);
  if (productId) {
    const product = await prisma.clientCatalogProduct.findFirst({
      where: {
        id: productId,
        tenantId,
        clientId,
        isArchived: false,
        isVisibleInPortal: true
      },
      select: { id: true }
    });
    if (!product) {
      return null;
    }
  }

  const created = await prisma.clientCatalogInquiry.create({
    data: {
      tenantId,
      clientId,
      productId,
      contactName,
      contactEmail,
      contactPhone: toNullableString(input.contactPhone),
      message,
      submittedByUserId: authSession.user.id
    },
    select: catalogInquirySelect
  });

  return { catalogInquiry: toCatalogInquirySummary(created) };
}
