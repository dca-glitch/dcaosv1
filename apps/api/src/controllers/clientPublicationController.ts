import type { RequestHandler } from "express";
import {
  archivePublicationTargetForClient,
  createPublicationTargetForClient,
  deletePublicationTargetCredentials,
  getClientAnalyticsProfile,
  getPublicationTargetCredentialStatus,
  listPublicationLogsForClient,
  listPublicationTargetsForClient,
  saveClientAnalyticsProfile,
  savePublicationTargetCredentials,
  updatePublicationTargetForClient
} from "../core/client-publication.runtime";
import type {
  ClientAnalyticsProfileInputRequest,
  PublicationTargetCredentialUpsertRequest,
  PublicationTargetInputRequest
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

function getPublicationTargetInput(body: unknown): PublicationTargetInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const label = typeof value.label === "string" ? value.label.trim() : "";
  const siteUrl = typeof value.siteUrl === "string" ? value.siteUrl.trim() : "";
  if (!label || !siteUrl) {
    return null;
  }
  return {
    label,
    siteUrl,
    siteSlug: typeof value.siteSlug === "string" ? value.siteSlug.trim() || null : null,
    wordpressUsername:
      typeof value.wordpressUsername === "string" ? value.wordpressUsername.trim() || null : null,
    wordPressComSite: Boolean(value.wordPressComSite),
    isDefault: value.isDefault === undefined ? undefined : Boolean(value.isDefault)
  };
}

export const listClientPublicationTargetsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const response = await listPublicationTargetsForClient(authSession, req.params.clientId);
  if (!response) {
    return void res.status(403).json(failure("FORBIDDEN", "Client publication targets are unavailable."));
  }
  res.json(success(response, { scope: "client-publication-targets" }));
};

export const createClientPublicationTargetHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const input = getPublicationTargetInput(req.body);
  if (!input) {
    return void res.status(400).json(failure("PUBLICATION_TARGET_INVALID", "Publication target label and site URL are required."));
  }
  const response = await createPublicationTargetForClient(authSession, req.params.clientId, input);
  if (!response?.publicationTarget) {
    return void res.status(404).json(failure("PUBLICATION_TARGET_NOT_CREATED", "Publication target could not be created."));
  }
  res.status(201).json(success(response, { scope: "client-publication-targets" }));
};

export const updateClientPublicationTargetHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const input = getPublicationTargetInput(req.body);
  if (!input) {
    return void res.status(400).json(failure("PUBLICATION_TARGET_INVALID", "Publication target update is invalid."));
  }
  const response = await updatePublicationTargetForClient(
    authSession,
    req.params.clientId,
    req.params.publicationTargetId,
    input
  );
  if (!response?.publicationTarget) {
    return void res.status(404).json(failure("PUBLICATION_TARGET_NOT_FOUND", "Publication target not found."));
  }
  res.json(success(response, { scope: "client-publication-targets" }));
};

export const archiveClientPublicationTargetHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const response = await archivePublicationTargetForClient(
    authSession,
    req.params.clientId,
    req.params.publicationTargetId
  );
  if (!response?.publicationTarget) {
    return void res.status(404).json(failure("PUBLICATION_TARGET_NOT_FOUND", "Publication target not found."));
  }
  res.json(success(response, { scope: "client-publication-targets" }));
};

export const getClientPublicationTargetCredentialStatusHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const response = await getPublicationTargetCredentialStatus(
    authSession,
    req.params.clientId,
    req.params.publicationTargetId
  );
  if (!response) {
    return void res.status(404).json(failure("PUBLICATION_TARGET_NOT_FOUND", "Publication target not found."));
  }
  res.json(success(response, { scope: "client-publication-credentials" }));
};

export const saveClientPublicationTargetCredentialsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const input = (req.body ?? {}) as PublicationTargetCredentialUpsertRequest;
  const response = await savePublicationTargetCredentials(
    authSession,
    req.params.clientId,
    req.params.publicationTargetId,
    input
  );
  if (!response) {
    return void res
      .status(400)
      .json(failure("PUBLICATION_CREDENTIALS_INVALID", "Credentials could not be saved. Check encryption configuration."));
  }
  res.json(success(response, { scope: "client-publication-credentials" }));
};

export const deleteClientPublicationTargetCredentialsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const response = await deletePublicationTargetCredentials(
    authSession,
    req.params.clientId,
    req.params.publicationTargetId
  );
  if (!response) {
    return void res.status(404).json(failure("PUBLICATION_TARGET_NOT_FOUND", "Publication target not found."));
  }
  res.json(success(response, { scope: "client-publication-credentials" }));
};

export const getClientAnalyticsProfileHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const response = await getClientAnalyticsProfile(authSession, req.params.clientId);
  if (!response) {
    return void res.status(403).json(failure("FORBIDDEN", "Client analytics profile is unavailable."));
  }
  res.json(success(response, { scope: "client-analytics-profile" }));
};

export const saveClientAnalyticsProfileHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const input = (req.body ?? {}) as ClientAnalyticsProfileInputRequest;
  const response = await saveClientAnalyticsProfile(authSession, req.params.clientId, input);
  if (!response) {
    return void res.status(404).json(failure("CLIENT_NOT_FOUND", "Client not found."));
  }
  res.json(success(response, { scope: "client-analytics-profile" }));
};

export const listClientPublicationLogsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    return void res.status(401).json(failure("UNAUTHORIZED", "Authentication required."));
  }
  const response = await listPublicationLogsForClient(authSession, req.params.clientId);
  if (!response) {
    return void res.status(403).json(failure("FORBIDDEN", "Publication logs are unavailable."));
  }
  res.json(success(response, { scope: "client-publication-logs" }));
};

export const clientPublicationRouteGuards = [requireAuth, requireTenant, requireRole("owner", "admin")] as const;
