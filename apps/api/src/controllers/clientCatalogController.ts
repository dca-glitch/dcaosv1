import type { RequestHandler } from "express";
import {
  archiveCatalogProductForClient,
  createCatalogProductForClient,
  listCatalogInquiriesForClient,
  listCatalogProductsForClient,
  updateCatalogInquiryStatusForClient,
  updateCatalogProductForClient
} from "../core/client-catalog.runtime";
import type {
  ClientCatalogInquiryStatusInputRequest,
  ClientCatalogProductInputRequest
} from "../core/core.types";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole, requireTenant } from "../middlewares";
import { failure, success } from "../utils/responses";
import type { AuthResolvedSessionContext } from "../auth/types";

type AuthSessionLocals = {
  authSession?: AuthResolvedSessionContext;
};

function getAuthSession(resLocals: unknown): AuthResolvedSessionContext | null {
  return (resLocals as AuthSessionLocals | undefined)?.authSession ?? null;
}

function getCatalogProductInput(body: unknown): ClientCatalogProductInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name) {
    return null;
  }
  return {
    name,
    description: typeof value.description === "string" ? value.description : null,
    sku: typeof value.sku === "string" ? value.sku : null,
    priceLabel: typeof value.priceLabel === "string" ? value.priceLabel : null,
    imageUrl: typeof value.imageUrl === "string" ? value.imageUrl : null,
    sortOrder: typeof value.sortOrder === "number" ? value.sortOrder : null,
    isVisibleInPortal: value.isVisibleInPortal === undefined ? undefined : Boolean(value.isVisibleInPortal)
  };
}

function getCatalogProductUpdateInput(body: unknown): ClientCatalogProductInputRequest {
  const value = (body ?? {}) as Record<string, unknown>;
  return {
    ...(typeof value.name === "string" ? { name: value.name.trim() } : {}),
    ...(value.description !== undefined ? { description: typeof value.description === "string" ? value.description : null } : {}),
    ...(value.sku !== undefined ? { sku: typeof value.sku === "string" ? value.sku : null } : {}),
    ...(value.priceLabel !== undefined ? { priceLabel: typeof value.priceLabel === "string" ? value.priceLabel : null } : {}),
    ...(value.imageUrl !== undefined ? { imageUrl: typeof value.imageUrl === "string" ? value.imageUrl : null } : {}),
    ...(typeof value.sortOrder === "number" ? { sortOrder: value.sortOrder } : {}),
    ...(value.isVisibleInPortal !== undefined ? { isVisibleInPortal: Boolean(value.isVisibleInPortal) } : {})
  };
}

function getCatalogInquiryStatusInput(body: unknown): ClientCatalogInquiryStatusInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const status = typeof value.status === "string" ? value.status.trim() : "";
  if (!status) {
    return null;
  }
  return { status: status as ClientCatalogInquiryStatusInputRequest["status"] };
}

export const clientCatalogRouteGuards = [requireAuth, requireTenant, requireRole("owner", "admin")] as const;

export const listClientCatalogProductsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const response = await listCatalogProductsForClient(authSession, req.params.clientId);
  if (!response) {
    return void res.status(403).json(failure("FORBIDDEN", "Client catalog products are unavailable."));
  }
  res.json(success(response, { scope: "client-catalog-products" }));
};

export const createClientCatalogProductHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const input = getCatalogProductInput(req.body);
  if (!input) {
    return void res.status(400).json(failure("CLIENT_CATALOG_PRODUCT_INVALID", "Product name is required."));
  }
  const response = await createCatalogProductForClient(authSession, req.params.clientId, input);
  if (!response?.catalogProduct) {
    return void res.status(404).json(failure("CLIENT_CATALOG_PRODUCT_NOT_CREATED", "Catalog product could not be created."));
  }
  res.status(201).json(success(response, { scope: "client-catalog-products" }));
};

export const updateClientCatalogProductHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const input = getCatalogProductUpdateInput(req.body);
  const response = await updateCatalogProductForClient(authSession, req.params.clientId, req.params.productId, input);
  if (!response?.catalogProduct) {
    return void res.status(404).json(failure("CLIENT_CATALOG_PRODUCT_NOT_FOUND", "Catalog product not found."));
  }
  res.json(success(response, { scope: "client-catalog-products" }));
};

export const archiveClientCatalogProductHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const response = await archiveCatalogProductForClient(authSession, req.params.clientId, req.params.productId);
  if (!response?.catalogProduct) {
    return void res.status(404).json(failure("CLIENT_CATALOG_PRODUCT_NOT_FOUND", "Catalog product not found."));
  }
  res.json(success(response, { scope: "client-catalog-products" }));
};

export const listClientCatalogInquiriesHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const response = await listCatalogInquiriesForClient(authSession, req.params.clientId);
  if (!response) {
    return void res.status(403).json(failure("FORBIDDEN", "Client catalog inquiries are unavailable."));
  }
  res.json(success(response, { scope: "client-catalog-inquiries" }));
};

export const updateClientCatalogInquiryStatusHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const input = getCatalogInquiryStatusInput(req.body);
  if (!input) {
    return void res.status(400).json(failure("CLIENT_CATALOG_INQUIRY_INVALID", "Inquiry status is required."));
  }
  const response = await updateCatalogInquiryStatusForClient(
    authSession,
    req.params.clientId,
    req.params.inquiryId,
    input
  );
  if (!response?.catalogInquiry) {
    return void res.status(404).json(failure("CLIENT_CATALOG_INQUIRY_NOT_FOUND", "Catalog inquiry not found."));
  }
  res.json(success(response, { scope: "client-catalog-inquiries" }));
};
