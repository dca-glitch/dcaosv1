import type { Request, RequestHandler } from "express";
import type { Prisma } from "@prisma/client";
import { success, failure } from "../utils/responses";
import { createPrismaClient } from "../../../../packages/data/src/client";
import {
  AUTH_LOGIN_LOCKOUT_MINUTES_DEFAULT,
  AUTH_LOGIN_MAX_FAILED_ATTEMPTS_DEFAULT,
  AUTH_SESSION_TTL_MINUTES_DEFAULT
} from "./auth.constants";
import { hashSessionToken, generateSessionToken } from "./session.service";
import { verifyPassword } from "./password.service";
import type {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthTenantMembershipSummary
} from "./types";

type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  passwordHash: string | null;
  forcePasswordChange: boolean;
  failedLoginCount: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
};

type PrismaTx = Prisma.TransactionClient;
type LoginAttemptResult =
  | { ok: true; response: AuthLoginResponse }
  | { ok: false };

const prisma = createPrismaClient();

function getPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getLoginPolicy() {
  return {
    maxFailedAttempts: getPositiveInteger(
      process.env.AUTH_LOGIN_MAX_FAILED_ATTEMPTS,
      AUTH_LOGIN_MAX_FAILED_ATTEMPTS_DEFAULT
    ),
    lockoutMinutes: getPositiveInteger(
      process.env.AUTH_LOGIN_LOCKOUT_MINUTES,
      AUTH_LOGIN_LOCKOUT_MINUTES_DEFAULT
    ),
    sessionTtlMinutes: getPositiveInteger(
      process.env.AUTH_SESSION_TTL_MINUTES,
      AUTH_SESSION_TTL_MINUTES_DEFAULT
    )
  };
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toPasswordValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isActiveLockout(lockedUntil: Date | null | undefined, now: Date): boolean {
  return Boolean(lockedUntil && lockedUntil.getTime() > now.getTime());
}

function toTenantMembershipSummaries(
  memberships: Array<{
    id: string;
    tenantId: string;
    membershipRoles: Array<{ role: { key: string } }>;
  }>
): AuthTenantMembershipSummary[] {
  return memberships.map((membership) => ({
    tenantId: membership.tenantId,
    tenantMembershipId: membership.id,
    roles: membership.membershipRoles.map((membershipRole) => membershipRole.role.key)
  }));
}

function buildAuthResponse(
  user: UserRecord,
  sessionToken: string,
  sessionExpiresAt: Date,
  memberships: AuthTenantMembershipSummary[],
  activeMembership: AuthTenantMembershipSummary | null,
  lastLoginAt: Date | null
): AuthLoginResponse {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      forcePasswordChange: user.forcePasswordChange,
      lastLoginAt: lastLoginAt?.toISOString() ?? null
    },
    session: {
      token: sessionToken,
      expiresAt: sessionExpiresAt.toISOString(),
      ttlMinutes: getLoginPolicy().sessionTtlMinutes
    },
    tenantContext: {
      activeMembership,
      memberships
    }
  };
}

async function recordFailedLogin(
  tx: PrismaTx,
  user: UserRecord,
  now: Date
): Promise<void> {
  const policy = getLoginPolicy();
  const nextCount = user.failedLoginCount + 1;
  const shouldLock = nextCount >= policy.maxFailedAttempts;
  const lockedUntil = shouldLock
    ? new Date(now.getTime() + policy.lockoutMinutes * 60 * 1000)
    : user.lockedUntil;

  await tx.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: nextCount,
      lockedUntil
    }
  });
}

async function recordSuccessfulLogin(
  tx: PrismaTx,
  userId: string,
  now: Date,
  sessionToken: string,
  activeTenantMembershipId: string | null,
  req: Request
): Promise<{ sessionExpiresAt: Date }> {
  const policy = getLoginPolicy();
  const sessionExpiresAt = new Date(now.getTime() + policy.sessionTtlMinutes * 60 * 1000);
  const sessionTokenHash = hashSessionToken(sessionToken);
  const ipAddress = typeof req.ip === "string" && req.ip ? req.ip : undefined;
  const userAgent = typeof req.get === "function" ? req.get("user-agent") ?? undefined : undefined;

  await tx.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: now
    }
  });

  await tx.session.create({
    data: {
      userId,
      sessionTokenHash,
      activeTenantMembershipId,
      expiresAt: sessionExpiresAt,
      ipAddress,
      userAgent
    }
  });

  return { sessionExpiresAt };
}

async function getActiveMemberships(tx: PrismaTx, userId: string): Promise<AuthTenantMembershipSummary[]> {
  const memberships = await tx.tenantMembership.findMany({
    where: {
      userId,
      status: "ACTIVE"
    },
    orderBy: [
      { createdAt: "asc" }
    ],
    select: {
      id: true,
      tenantId: true,
      membershipRoles: {
        select: {
          role: {
            select: {
              key: true
            }
          }
        }
      }
    }
  });

  return toTenantMembershipSummaries(memberships);
}

async function loginWithCredentials(
  email: string,
  password: string,
  req: Request
): Promise<LoginAttemptResult> {
  const now = new Date();
  const normalizedEmail = email.toLowerCase();

  return prisma.$transaction(async (tx: Prisma.TransactionClient): Promise<LoginAttemptResult> => {
    const user = await tx.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive"
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        passwordHash: true,
        forcePasswordChange: true,
        failedLoginCount: true,
        lockedUntil: true,
        lastLoginAt: true
      }
    });

    if (!user || user.status !== "ACTIVE" || !user.passwordHash) {
      return { ok: false };
    }

    if (isActiveLockout(user.lockedUntil, now)) {
      return { ok: false };
    }

    if (!verifyPassword(password, user.passwordHash)) {
      await recordFailedLogin(tx, user, now);
      return { ok: false };
    }

    const memberships = await getActiveMemberships(tx, user.id);
    const activeMembership = memberships[0] ?? null;
    const sessionToken = generateSessionToken().token;
    const { sessionExpiresAt } = await recordSuccessfulLogin(
      tx,
      user.id,
      now,
      sessionToken,
      activeMembership?.tenantMembershipId ?? null,
      req
    );

    return {
      ok: true,
      response: buildAuthResponse(
        {
          ...user,
          lastLoginAt: now
        },
        sessionToken,
        sessionExpiresAt,
        memberships,
        activeMembership,
        now
      )
    };
  });
}

export const login: RequestHandler = async (req, res) => {
  const body = (req.body ?? {}) as AuthLoginRequest;
  const email = toStringValue(body.email);
  const password = toPasswordValue(body.password);

  if (!email || !password) {
    res.status(401).json(failure("AUTH_LOGIN_FAILED", "Invalid email or password."));
    return;
  }

  try {
    const result = await loginWithCredentials(email, password, req);
    if (!result.ok) {
      res.status(401).json(failure("AUTH_LOGIN_FAILED", "Invalid email or password."));
      return;
    }

    res.json(
      success(result.response, {
        phase: "runtime",
        auth: "controlled-mvp"
      })
    );
  } catch {
    res.status(500).json(failure("AUTH_RUNTIME_ERROR", "Auth login could not be completed."));
  }
};
