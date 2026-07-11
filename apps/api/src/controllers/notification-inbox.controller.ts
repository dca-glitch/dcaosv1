import type { RequestHandler } from "express";
import type { AuthResolvedSessionContext, AuthSessionLocals } from "../auth/types";
import {
  listClientAccessClientIdsForUser,
  listInAppNotifications,
  markAllInAppNotificationsRead,
  markInAppNotificationRead
} from "../notifications/in-app-notifications.service";
import { failure, forbiddenFailure, success, unauthorizedFailure } from "../utils/responses";

function getAuthSession(locals: AuthSessionLocals): AuthResolvedSessionContext | null {
  return locals.authSession ?? null;
}

function getActiveTenantId(authSession: AuthResolvedSessionContext): string | null {
  return authSession.tenantContext.activeMembership?.tenantId ?? null;
}

function isOwnerOrAdmin(authSession: AuthResolvedSessionContext): boolean {
  return authSession.tenantContext.activeMembership?.roles.some((role) => role === "owner" || role === "admin") ?? false;
}

function parseLimit(value: unknown): number {
  if (typeof value !== "string") {
    return 25;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return 25;
  }
  if (parsed < 1) return 1;
  if (parsed > 100) return 100;
  return parsed;
}

export const listAdminInboxNotificationsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  if (!isOwnerOrAdmin(authSession)) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const result = await listInAppNotifications({
    tenantId,
    recipientUserId: authSession.user.id,
    recipientRoles: ["admin", "owner_operator"],
    status: "ALL",
    limit: parseLimit(req.query.limit)
  });

  res.status(200).json(success(result));
};

export const listAdminUnreadInboxNotificationsHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  if (!isOwnerOrAdmin(authSession)) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const result = await listInAppNotifications({
    tenantId,
    recipientUserId: authSession.user.id,
    recipientRoles: ["admin", "owner_operator"],
    status: "UNREAD",
    limit: 100
  });

  res.status(200).json(success({ notifications: result.notifications, unreadCount: result.unreadCount }));
};

export const markAdminInboxNotificationReadHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  if (!isOwnerOrAdmin(authSession)) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const notificationId = req.params.id;
  const result = await markInAppNotificationRead({
    tenantId,
    recipientUserId: authSession.user.id,
    recipientRoles: ["admin", "owner_operator"],
    notificationId
  });

  if (result === "not_found") {
    res.status(404).json(failure("NOTIFICATION_NOT_FOUND", "Notification was not found."));
    return;
  }

  res.status(200).json(success({ id: notificationId, status: "READ", unchanged: result === "already_read" }));
};

export const markAllAdminInboxNotificationsReadHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  if (!isOwnerOrAdmin(authSession)) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const markedCount = await markAllInAppNotificationsRead({
    tenantId,
    recipientUserId: authSession.user.id,
    recipientRoles: ["admin", "owner_operator"]
  });

  res.status(200).json(success({ markedCount }));
};

export const listClientInboxNotificationsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  if (isOwnerOrAdmin(authSession)) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const clientIds = await listClientAccessClientIdsForUser(tenantId, authSession.user.id);
  const result = await listInAppNotifications({
    tenantId,
    recipientUserId: authSession.user.id,
    recipientRoles: ["client"],
    clientIds,
    status: "ALL",
    limit: parseLimit(req.query.limit)
  });

  res.status(200).json(success(result));
};

export const listClientUnreadInboxNotificationsHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  if (isOwnerOrAdmin(authSession)) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const clientIds = await listClientAccessClientIdsForUser(tenantId, authSession.user.id);
  const result = await listInAppNotifications({
    tenantId,
    recipientUserId: authSession.user.id,
    recipientRoles: ["client"],
    clientIds,
    status: "UNREAD",
    limit: 100
  });

  res.status(200).json(success({ notifications: result.notifications, unreadCount: result.unreadCount }));
};

export const markClientInboxNotificationReadHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals as AuthSessionLocals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  if (isOwnerOrAdmin(authSession)) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const notificationId = req.params.id;
  const clientIds = await listClientAccessClientIdsForUser(tenantId, authSession.user.id);
  const result = await markInAppNotificationRead({
    tenantId,
    recipientUserId: authSession.user.id,
    recipientRoles: ["client"],
    clientIds,
    notificationId
  });

  if (result === "not_found") {
    res.status(404).json(failure("NOTIFICATION_NOT_FOUND", "Notification was not found."));
    return;
  }

  res.status(200).json(success({ id: notificationId, status: "READ", unchanged: result === "already_read" }));
};
