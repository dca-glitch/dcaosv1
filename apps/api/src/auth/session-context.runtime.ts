import type { Prisma } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import { hashSessionToken } from "./session.service";
import type {
  AuthCurrentUserResponse,
  AuthLoginUserSummary,
  AuthResolvedSessionContext,
  AuthTenantMembershipSummary
} from "./types";

const prisma = createPrismaClient();

type PrismaTx = Prisma.TransactionClient;

type SessionLookupRecord = {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    status: string;
    forcePasswordChange: boolean;
    lastLoginAt: Date | null;
    memberships: Array<{
      id: string;
      tenantId: string;
      membershipRoles: Array<{
        role: {
          key: string;
        };
      }>;
    }>;
  };
};

export function extractBearerToken(authorizationHeader: string | null | undefined): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, ...rest] = authorizationHeader.trim().split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== "bearer" || rest.length === 0) {
    return null;
  }

  const token = rest.join(" ").trim();
  return token ? token : null;
}

function toTenantMembershipSummaries(
  memberships: SessionLookupRecord["user"]["memberships"]
): AuthTenantMembershipSummary[] {
  return memberships.map((membership) => ({
    tenantId: membership.tenantId,
    tenantMembershipId: membership.id,
    roles: membership.membershipRoles.map((membershipRole) => membershipRole.role.key)
  }));
}

function toLoginUserSummary(user: SessionLookupRecord["user"]): AuthLoginUserSummary {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    forcePasswordChange: user.forcePasswordChange,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null
  };
}

function toResolvedSessionContext(record: SessionLookupRecord): AuthResolvedSessionContext {
  const memberships = toTenantMembershipSummaries(record.user.memberships);

  return {
    user: toLoginUserSummary(record.user),
    session: {
      id: record.id,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      lastSeenAt: record.lastSeenAt
    },
    tenantContext: {
      activeMembership: memberships[0] ?? null,
      memberships
    }
  };
}

export async function resolveAuthSessionContext(
  token: string,
  touchLastSeenAt = true
): Promise<AuthResolvedSessionContext | null> {
  const now = new Date();
  const sessionTokenHash = hashSessionToken(token);

  return prisma.$transaction(async (tx: PrismaTx) => {
    const session = await tx.session.findFirst({
      where: {
        sessionTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: now
        }
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        lastSeenAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true,
            forcePasswordChange: true,
            lastLoginAt: true,
            memberships: {
              where: {
                status: "ACTIVE"
              },
              orderBy: {
                createdAt: "asc"
              },
              select: {
                id: true,
                tenantId: true,
                membershipRoles: {
                  orderBy: {
                    createdAt: "asc"
                  },
                  select: {
                    role: {
                      select: {
                        key: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!session) {
      return null;
    }

    if (touchLastSeenAt) {
      await tx.session.update({
        where: {
          id: session.id
        },
        data: {
          lastSeenAt: now
        }
      });
    }

    return toResolvedSessionContext(session);
  });
}

export function toCurrentUserResponse(context: AuthResolvedSessionContext): AuthCurrentUserResponse {
  return {
    user: context.user,
    session: {
      createdAt: context.session.createdAt.toISOString(),
      expiresAt: context.session.expiresAt.toISOString(),
      lastSeenAt: context.session.lastSeenAt?.toISOString() ?? null,
      revokedAt: null
    },
    tenantContext: context.tenantContext
  };
}

export async function revokeAuthSession(sessionId: string): Promise<Date> {
  const revokedAt = new Date();

  await prisma.session.update({
    where: {
      id: sessionId
    },
    data: {
      revokedAt
    }
  });

  return revokedAt;
}
