import type { RequestHandler } from "express";
import { createPrismaClient } from "../../../../packages/data/src/client";
import { failure, success, unauthorizedFailure } from "../utils/responses";
import type { AuthSessionLocals } from "./types";
import { hashPassword, verifyPassword } from "./password.service";
import { recordPlatformAuditEvent } from "../security/audit-log.service";
import { AUTH_RUNTIME_AUDIT_EVENTS } from "./auth.constants";

const prisma = createPrismaClient();

export const changePasswordHandler: RequestHandler = async (req, res) => {
  const authSession = (res.locals as AuthSessionLocals).authSession;
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const body = (req.body ?? {}) as { oldPassword?: unknown; newPassword?: unknown };
  const oldPassword = typeof body.oldPassword === "string" ? body.oldPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!oldPassword || !newPassword) {
    res.status(400).json(failure("AUTH_CHANGE_PASSWORD_INVALID", "Old password and new password are required."));
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json(failure("AUTH_CHANGE_PASSWORD_INVALID", "New password must be at least 8 characters long."));
    return;
  }

  if (oldPassword === newPassword) {
    res.status(400).json(failure("AUTH_CHANGE_PASSWORD_INVALID", "New password must differ from the current password."));
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authSession.user.id },
      select: { id: true, passwordHash: true }
    });

    if (!user?.passwordHash) {
      res.status(400).json(failure("AUTH_CHANGE_PASSWORD_FAILED", "Password change could not be completed."));
      return;
    }

    if (!verifyPassword(oldPassword, user.passwordHash)) {
      res.status(400).json(failure("AUTH_CHANGE_PASSWORD_INVALID", "Current password is incorrect."));
      return;
    }

    const newHash = hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        forcePasswordChange: false,
        passwordChangedAt: new Date()
      }
    });

    await recordPlatformAuditEvent({
      tenantId: authSession.tenantContext.activeMembership?.tenantId ?? null,
      actorUserId: authSession.user.id,
      action: AUTH_RUNTIME_AUDIT_EVENTS.passwordChanged,
      entityType: "user",
      entityId: authSession.user.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? null
    });

    res.json(
      success(
        { ok: true, message: "Password changed successfully." },
        { phase: "runtime", auth: "controlled-mvp" }
      )
    );
  } catch {
    res.status(500).json(failure("AUTH_RUNTIME_ERROR", "Password change could not be completed."));
  }
};
