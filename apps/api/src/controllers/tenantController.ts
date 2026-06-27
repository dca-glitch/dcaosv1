import type { RequestHandler } from "express";
import {
  failure,
  forbiddenFailure,
  success,
  tenantMemberInvalidFailure,
  tenantMemberNotFoundFailure,
  tenantSettingsInvalidFailure,
  tenantSwitchInvalidFailure,
  unauthorizedFailure
} from "../utils/responses";
import type { AuthSessionLocals } from "../auth/types";
import {
  getCurrentTenantContext,
  getCurrentTenantMember,
  getCurrentTenantSettings,
  getTenantListContext,
  listCurrentTenantMembers,
  switchCurrentTenantMembership,
  updateCurrentTenantSettings
} from "../tenants/tenant.runtime";
import type { TenantSettingsUpdateRequest, TenantSwitchRequest } from "../tenants/types";
import { getTenantAuthorizationSummary } from "../services/tenant-authorization-summary.service";

const TENANT_NAME_MAX_LENGTH = 120;

function getAuthSession(resLocals: unknown) {
  return (resLocals as AuthSessionLocals | undefined)?.authSession;
}

function skeletonFailure(message: string) {
  return failure("TENANT_ACCESS_ERROR", message);
}

export const listTenants: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await getTenantListContext(authSession);
    res.json(
      success(response, {
        phase: "runtime",
        scope: "tenant-backend-skeleton"
      })
    );
  } catch {
    res.status(500).json(skeletonFailure("Tenant list could not be completed."));
  }
};

export const getCurrentTenant: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await getCurrentTenantContext(authSession);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.json(
      success(response, {
        phase: "runtime",
        scope: "tenant-backend-skeleton"
      })
    );
  } catch {
    res.status(500).json(skeletonFailure("Tenant context could not be completed."));
  }
};

export const switchCurrentTenant: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const body = (req.body ?? {}) as TenantSwitchRequest;
  const tenantMembershipId =
    typeof body.tenantMembershipId === "string" ? body.tenantMembershipId.trim() : "";

  if (!tenantMembershipId) {
    res.status(400).json(tenantSwitchInvalidFailure());
    return;
  }

  try {
    const response = await switchCurrentTenantMembership(authSession, tenantMembershipId);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.json(
      success(response, {
        phase: "runtime",
        scope: "tenant-backend-skeleton"
      })
    );
  } catch {
    res.status(500).json(skeletonFailure("Tenant switch could not be completed."));
  }
};

export const listTenantMembers: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await listCurrentTenantMembers(authSession);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.json(
      success(response, {
        phase: "runtime",
        scope: "tenant-backend-skeleton"
      })
    );
  } catch {
    res.status(500).json(skeletonFailure("Tenant member list could not be completed."));
  }
};

export const getTenantMember: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const membershipId = typeof req.params.membershipId === "string" ? req.params.membershipId : "";
  if (!membershipId) {
    res.status(400).json(tenantMemberInvalidFailure());
    return;
  }

  try {
    const response = await getCurrentTenantMember(authSession, membershipId);
    if (!response) {
      res.status(404).json(tenantMemberNotFoundFailure());
      return;
    }

    res.json(
      success(response, {
        phase: "runtime",
        scope: "tenant-backend-skeleton"
      })
    );
  } catch {
    res.status(500).json(skeletonFailure("Tenant member lookup could not be completed."));
  }
};

export const getTenantSettings: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await getCurrentTenantSettings(authSession);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.json(
      success(response, {
        phase: "runtime",
        scope: "tenant-backend-skeleton"
      })
    );
  } catch {
    res.status(500).json(skeletonFailure("Tenant settings could not be completed."));
  }
};

export const updateTenantSettings: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const body = (req.body ?? {}) as TenantSettingsUpdateRequest;
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name || name.length > TENANT_NAME_MAX_LENGTH) {
    res.status(400).json(tenantSettingsInvalidFailure());
    return;
  }

  try {
    const response = await updateCurrentTenantSettings(authSession, name);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.json(
      success(response, {
        phase: "runtime",
        scope: "tenant-backend-skeleton"
      })
    );
  } catch {
    res.status(500).json(skeletonFailure("Tenant settings update could not be completed."));
  }
};

export const getCurrentTenantAuthorizationSummaryHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  if (!authSession.tenantContext.activeMembership?.tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  try {
    const authorization = getTenantAuthorizationSummary(authSession);
    res.json(
      success({ authorization }, { phase: "runtime", scope: "tenant-authorization-summary" })
    );
  } catch {
    res.status(500).json(skeletonFailure("Tenant authorization summary could not be loaded."));
  }
};
