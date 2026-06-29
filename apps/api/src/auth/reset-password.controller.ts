import type { RequestHandler } from "express";
import { createPrismaClient } from "../../../../packages/data/src/client";
import { failure, success } from "../utils/responses";
import type { AuthSessionLocals } from "./types";
import { generateTemporaryPassword } from "./password-generator";
import { hashPassword } from "./password.service";
import { recordPlatformAuditEvent } from "../security/audit-log.service";
import { AUTH_RUNTIME_AUDIT_EVENTS } from "./auth.constants";

const prisma = createPrismaClient();
const LOGIN_URL_BASE = process.env.APP_BASE_URL ?? "https://system.digitalcubeagency.net";

export const adminPasswordReset: RequestHandler = async (req, res) => {
  const authSession = (res.locals as AuthSessionLocals).authSession;
  if (!authSession?.tenantContext.activeMembership) {
    res.status(403).json(failure("AUTH_FORBIDDEN", "Active tenant context required."));
    return;
  }

  const userId = typeof req.params["userId"] === "string" ? req.params["userId"] : "";
  if (!userId) {
    res.status(400).json(failure("AUTH_USER_INVALID", "User ID is required."));
    return;
  }

  const { tenantId } = authSession.tenantContext.activeMembership;

  try {
    const membership = await prisma.tenantMembership.findFirst({
      where: { tenantId, userId },
      select: {
        user: { select: { id: true, email: true } }
      }
    });

    if (!membership) {
      res.status(404).json(failure("AUTH_USER_NOT_FOUND", "User was not found in this tenant."));
      return;
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = hashPassword(tempPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, forcePasswordChange: true }
    });

    await recordPlatformAuditEvent({
      tenantId,
      actorUserId: authSession.user.id,
      action: AUTH_RUNTIME_AUDIT_EVENTS.passwordResetByAdmin,
      entityType: "user",
      entityId: userId,
      metadata: { email: membership.user.email },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? null
    });

    const loginUrl = `${LOGIN_URL_BASE}/#/login?email=${encodeURIComponent(membership.user.email)}`;

    res.json(
      success(
        { userId, email: membership.user.email, tempPassword, loginUrl },
        { phase: "runtime", auth: "controlled-mvp" }
      )
    );
  } catch {
    res.status(500).json(failure("AUTH_RUNTIME_ERROR", "Password reset could not be completed."));
  }
};
