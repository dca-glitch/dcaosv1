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

export const createUser: RequestHandler = async (req, res) => {
  const authSession = (res.locals as AuthSessionLocals).authSession;
  if (!authSession?.tenantContext.activeMembership) {
    res.status(403).json(failure("AUTH_FORBIDDEN", "Active tenant context required."));
    return;
  }

  const body = (req.body ?? {}) as { email?: unknown; name?: unknown; roleKey?: unknown; clientId?: unknown };
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;
  const roleKey = typeof body.roleKey === "string" && body.roleKey.trim() ? body.roleKey.trim() : "admin";
  const clientId = typeof body.clientId === "string" && body.clientId.trim() ? body.clientId.trim() : null;

  if (!email) {
    res.status(400).json(failure("AUTH_USER_INVALID", "Email is required."));
    return;
  }

  const normalizedEmail = email.toLowerCase();
  const { tenantId } = authSession.tenantContext.activeMembership;

  try {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true }
    });

    if (existing) {
      res.status(409).json(failure("AUTH_USER_CONFLICT", "A user with this email already exists."));
      return;
    }

    const role = await prisma.role.findFirst({
      where: { tenantId, key: roleKey, status: "ACTIVE" },
      select: { id: true }
    });

    let validClientId = null;
    if (clientId) {
      const clientRecord = await prisma.client.findFirst({
        where: { id: clientId, tenantId, isArchived: false },
        select: { id: true }
      });
      validClientId = clientRecord?.id ?? null;
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = hashPassword(tempPassword);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          name,
          status: "ACTIVE",
          passwordHash,
          forcePasswordChange: true,
          failedLoginCount: 0
        }
      });

      const membership = await tx.tenantMembership.create({
        data: { tenantId, userId: user.id, status: "ACTIVE" }
      });

      if (role) {
        await tx.membershipRole.create({
          data: { tenantMembershipId: membership.id, roleId: role.id }
        });
      }

      if (validClientId) {
        await tx.clientUserAccess.create({
          data: { tenantId, clientId: validClientId, userId: user.id, isArchived: false }
        });
      }

      return user;
    });

    await recordPlatformAuditEvent({
      tenantId,
      actorUserId: authSession.user.id,
      action: AUTH_RUNTIME_AUDIT_EVENTS.adminUserCreated,
      entityType: "user",
      entityId: result.id,
      metadata: {
        email: normalizedEmail,
        roleKey,
        ...(validClientId ? { clientId: validClientId } : {})
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? null
    });

    const loginUrl = `${LOGIN_URL_BASE}/#/login?email=${encodeURIComponent(normalizedEmail)}`;

    res.status(201).json(
      success(
        {
          userId: result.id,
          email: normalizedEmail,
          tempPassword,
          loginUrl,
          ...(validClientId ? { clientId: validClientId } : {})
        },
        { phase: "runtime", auth: "controlled-mvp" }
      )
    );
  } catch {
    res.status(500).json(failure("AUTH_RUNTIME_ERROR", "User could not be created."));
  }
};
