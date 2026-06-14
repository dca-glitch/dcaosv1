import type { Prisma } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuthResolvedSessionContext, AuthTenantMembershipSummary } from "../auth/types";
import type {
  TenantCurrentResponse,
  TenantListResponse,
  TenantMemberDetailResponse,
  TenantMemberSummary,
  TenantMembersResponse,
  TenantMembershipCard,
  TenantSettingsResponse,
  TenantSummary,
  TenantUserSummary
} from "./types";

const prisma = createPrismaClient();

type PrismaTx = Prisma.TransactionClient;

type TenantCardLookup = {
  id: string;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  membershipRoles: Array<{
    role: {
      key: string;
    };
  }>;
};

type TenantMemberLookup = {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
  user: {
    id: string;
    email: string;
    name: string | null;
    status: string;
  };
  membershipRoles: Array<{
    role: {
      key: string;
    };
  }>;
};

function toTenantSummary(tenant: TenantCardLookup["tenant"]): TenantSummary {
  return {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    createdAt: tenant.createdAt.toISOString(),
    updatedAt: tenant.updatedAt.toISOString()
  };
}

function toTenantUserSummary(user: TenantMemberLookup["user"]): TenantUserSummary {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status
  };
}

function toTenantMembershipCard(card: TenantCardLookup): TenantMembershipCard {
  return {
    tenant: toTenantSummary(card.tenant),
    tenantMembershipId: card.id,
    roles: card.membershipRoles.map((membershipRole) => membershipRole.role.key)
  };
}

function toTenantMemberSummary(member: TenantMemberLookup): TenantMemberSummary {
  return {
    tenantMembershipId: member.id,
    user: toTenantUserSummary(member.user),
    status: member.status,
    roles: member.membershipRoles.map((membershipRole) => membershipRole.role.key),
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString()
  };
}

async function listMembershipCards(
  tx: PrismaTx,
  userId: string
): Promise<TenantMembershipCard[]> {
  const memberships = await tx.tenantMembership.findMany({
    where: {
      userId,
      status: "ACTIVE"
    },
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true,
      tenantId: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      },
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
  });

  return memberships.map(toTenantMembershipCard);
}

async function getCurrentMembershipCard(
  tx: PrismaTx,
  authSession: AuthResolvedSessionContext
): Promise<TenantMembershipCard | null> {
  const cards = await listMembershipCards(tx, authSession.user.id);
  const currentMembershipId = authSession.tenantContext.activeMembership?.tenantMembershipId;

  if (!currentMembershipId) {
    return null;
  }

  return cards.find((card) => card.tenantMembershipId === currentMembershipId) ?? null;
}

function toTenantListResponse(
  authSession: AuthResolvedSessionContext,
  availableTenants: TenantMembershipCard[]
): TenantListResponse {
  const currentMembershipId = authSession.tenantContext.activeMembership?.tenantMembershipId ?? null;
  const currentTenant =
    currentMembershipId === null
      ? null
      : availableTenants.find((card) => card.tenantMembershipId === currentMembershipId) ?? null;

  return {
    user: {
      id: authSession.user.id,
      email: authSession.user.email,
      name: authSession.user.name ?? null,
      status: authSession.user.status
    },
    currentTenant,
    availableTenants
  };
}

export async function getTenantListContext(
  authSession: AuthResolvedSessionContext
): Promise<TenantListResponse> {
  const availableTenants = await prisma.$transaction(async (tx: PrismaTx) =>
    listMembershipCards(tx, authSession.user.id)
  );
  return toTenantListResponse(authSession, availableTenants);
}

export async function getCurrentTenantContext(
  authSession: AuthResolvedSessionContext
): Promise<TenantCurrentResponse | null> {
  return prisma.$transaction(async (tx: PrismaTx) => {
    const currentTenant = await getCurrentMembershipCard(tx, authSession);
    if (!currentTenant) {
      return null;
    }

    const availableTenants = await listMembershipCards(tx, authSession.user.id);
    return {
      user: {
        id: authSession.user.id,
        email: authSession.user.email,
        name: authSession.user.name ?? null,
        status: authSession.user.status
      },
      currentTenant,
      availableTenants
    };
  });
}

function toTenantMembersResponse(
  tenant: TenantSummary,
  currentMembership: AuthTenantMembershipSummary,
  members: TenantMemberLookup[]
): TenantMembersResponse {
  return {
    tenant,
    currentMembership,
    members: members.map(toTenantMemberSummary)
  };
}

export async function listCurrentTenantMembers(
  authSession: AuthResolvedSessionContext
): Promise<TenantMembersResponse | null> {
  return prisma.$transaction(async (tx: PrismaTx) => {
    const currentTenant = await getCurrentMembershipCard(tx, authSession);
    if (!currentTenant) {
      return null;
    }

    const members = await tx.tenantMembership.findMany({
      where: {
        tenantId: currentTenant.tenant.id,
        status: "ACTIVE"
      },
      orderBy: {
        createdAt: "asc"
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true
          }
        },
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
    });

    return toTenantMembersResponse(currentTenant.tenant, authSession.tenantContext.activeMembership!, members);
  });
}

export async function getCurrentTenantMember(
  authSession: AuthResolvedSessionContext,
  membershipId: string
): Promise<TenantMemberDetailResponse | null> {
  return prisma.$transaction(async (tx: PrismaTx) => {
    const currentTenant = await getCurrentMembershipCard(tx, authSession);
    if (!currentTenant) {
      return null;
    }

    const member = await tx.tenantMembership.findFirst({
      where: {
        id: membershipId,
        tenantId: currentTenant.tenant.id,
        status: "ACTIVE"
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            createdAt: true,
            updatedAt: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true
          }
        },
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
    });

    if (!member) {
      return null;
    }

    return {
      tenant: currentTenant.tenant,
      currentMembership: authSession.tenantContext.activeMembership!,
      member: toTenantMemberSummary(member)
    };
  });
}

export async function getCurrentTenantSettings(
  authSession: AuthResolvedSessionContext
): Promise<TenantSettingsResponse | null> {
  return prisma.$transaction(async (tx: PrismaTx) => {
    const currentTenant = await getCurrentMembershipCard(tx, authSession);
    if (!currentTenant) {
      return null;
    }

    return {
      tenant: currentTenant.tenant,
      currentMembership: authSession.tenantContext.activeMembership!
    };
  });
}

export async function updateCurrentTenantSettings(
  authSession: AuthResolvedSessionContext,
  name: string
): Promise<TenantSettingsResponse | null> {
  return prisma.$transaction(async (tx: PrismaTx) => {
    const currentTenant = await getCurrentMembershipCard(tx, authSession);
    if (!currentTenant) {
      return null;
    }

    const updatedTenant = await tx.tenant.update({
      where: {
        id: currentTenant.tenant.id
      },
      data: {
        name
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      tenant: {
        id: updatedTenant.id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        status: updatedTenant.status,
        createdAt: updatedTenant.createdAt.toISOString(),
        updatedAt: updatedTenant.updatedAt.toISOString()
      },
      currentMembership: authSession.tenantContext.activeMembership!
    };
  });
}

export async function switchCurrentTenantMembership(
  authSession: AuthResolvedSessionContext,
  tenantMembershipId: string
): Promise<TenantCurrentResponse | null> {
  return prisma.$transaction(async (tx: PrismaTx) => {
    const membership = await tx.tenantMembership.findFirst({
      where: {
        id: tenantMembershipId,
        userId: authSession.user.id,
        status: "ACTIVE",
        tenant: {
          status: "ACTIVE"
        }
      },
      select: {
        id: true
      }
    });

    if (!membership) {
      return null;
    }

    await tx.session.update({
      where: {
        id: authSession.session.id
      },
      data: {
        activeTenantMembershipId: membership.id
      }
    });

    const availableTenants = await listMembershipCards(tx, authSession.user.id);
    const currentTenant = availableTenants.find((card) => card.tenantMembershipId === membership.id) ?? null;

    if (!currentTenant) {
      return null;
    }

    return {
      user: {
        id: authSession.user.id,
        email: authSession.user.email,
        name: authSession.user.name ?? null,
        status: authSession.user.status
      },
      currentTenant,
      availableTenants
    };
  });
}
