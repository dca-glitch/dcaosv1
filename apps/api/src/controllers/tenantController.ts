import type { RequestHandler } from "express";
import { failure, success } from "../utils/responses";
import type { AuthSessionLocals } from "../auth/types";
import {
  getCurrentTenantContext,
  getCurrentTenantMember,
  getCurrentTenantSettings,
  getTenantListContext,
  listCurrentTenantMembers,
  updateCurrentTenantSettings
} from "../tenants/tenant.runtime";
import type { TenantSettingsUpdateRequest } from "../tenants/types";

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
    res.status(401).json(failure("AUTH_UNAUTHORIZED", "Authorization is required."));
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
    res.status(401).json(failure("AUTH_UNAUTHORIZED", "Authorization is required."));
    return;
  }

  try {
    const response = await getCurrentTenantContext(authSession);
    if (!response) {
      res.status(403).json(failure("AUTH_FORBIDDEN", "Access is forbidden."));
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

export const listTenantMembers: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(failure("AUTH_UNAUTHORIZED", "Authorization is required."));
    return;
  }

  try {
    const response = await listCurrentTenantMembers(authSession);
    if (!response) {
      res.status(403).json(failure("AUTH_FORBIDDEN", "Access is forbidden."));
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
    res.status(401).json(failure("AUTH_UNAUTHORIZED", "Authorization is required."));
    return;
  }

  const membershipId = typeof req.params.membershipId === "string" ? req.params.membershipId : "";
  if (!membershipId) {
    res.status(400).json(failure("TENANT_MEMBER_INVALID", "Invalid tenant member request."));
    return;
  }

  try {
    const response = await getCurrentTenantMember(authSession, membershipId);
    if (!response) {
      res.status(404).json(failure("TENANT_MEMBER_NOT_FOUND", "Member was not found."));
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
    res.status(401).json(failure("AUTH_UNAUTHORIZED", "Authorization is required."));
    return;
  }

  try {
    const response = await getCurrentTenantSettings(authSession);
    if (!response) {
      res.status(403).json(failure("AUTH_FORBIDDEN", "Access is forbidden."));
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
    res.status(401).json(failure("AUTH_UNAUTHORIZED", "Authorization is required."));
    return;
  }

  const body = (req.body ?? {}) as TenantSettingsUpdateRequest;
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name || name.length > TENANT_NAME_MAX_LENGTH) {
    res.status(400).json(failure("TENANT_SETTINGS_INVALID", "Invalid tenant settings."));
    return;
  }

  try {
    const response = await updateCurrentTenantSettings(authSession, name);
    if (!response) {
      res.status(403).json(failure("AUTH_FORBIDDEN", "Access is forbidden."));
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
