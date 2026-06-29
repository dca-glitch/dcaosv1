import { Router } from "express";
import type { BriefStatus, BriefType } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type { AuthResolvedSessionContext, AuthSessionLocals } from "../auth/types";
import { requireAuth } from "../middlewares/auth.middleware";
import { failure, forbiddenFailure, success, unauthorizedFailure } from "../utils/responses";

const prisma = createPrismaClient();

function getAuthSession(res: { locals: unknown }): AuthResolvedSessionContext | null {
  return (res.locals as AuthSessionLocals).authSession ?? null;
}

function getActiveRoles(authSession: AuthResolvedSessionContext): string[] {
  return authSession.tenantContext.activeMembership?.roles ?? [];
}

function isOwnerRole(roles: string[]): boolean {
  return roles.includes("owner") || roles.includes("admin");
}

function isClientRole(roles: string[]): boolean {
  return roles.includes("client") && !isOwnerRole(roles);
}

async function resolveClientCompanyId(
  authSession: AuthResolvedSessionContext,
  clientId?: string
): Promise<string | null> {
  const tenantId = authSession.tenantContext.activeMembership?.tenantId;
  if (!tenantId) {
    return null;
  }

  const accessEntries = await prisma.clientUserAccess.findMany({
    where: { tenantId, userId: authSession.user.id, isArchived: false },
    select: { clientId: true }
  });
  const clientIds = accessEntries.map((entry) => entry.clientId);
  if (clientIds.length === 0) {
    return null;
  }

  if (clientId) {
    if (!clientIds.includes(clientId)) {
      return null;
    }
    return clientId;
  }

  return clientIds.length === 1 ? clientIds[0] : null;
}

async function resolveCompanyIdForCreate(
  authSession: AuthResolvedSessionContext,
  clientId: string
): Promise<string | null> {
  const roles = getActiveRoles(authSession);
  const tenantId = authSession.tenantContext.activeMembership?.tenantId;
  if (!tenantId) {
    return null;
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { id: true }
  });
  if (!client) {
    return null;
  }

  if (isClientRole(roles)) {
    const access = await prisma.clientUserAccess.findFirst({
      where: {
        tenantId,
        userId: authSession.user.id,
        clientId,
        isArchived: false
      },
      select: { clientId: true }
    });
    return access?.clientId ?? null;
  }

  if (isOwnerRole(roles)) {
    return clientId;
  }

  return null;
}

function clientOwnsBrief(companyId: string, authCompanyId: string | null): boolean {
  return authCompanyId !== null && authCompanyId === companyId;
}

function parseNonNegativeInt(value: unknown, defaultValue = 0): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value);
  }
  return defaultValue;
}

async function getNextBriefNumber(clientId: string): Promise<number> {
  const lastBrief = await prisma.brief.findFirst({
    where: { clientId },
    orderBy: { briefNumber: "desc" },
    select: { briefNumber: true }
  });
  return (lastBrief?.briefNumber ?? 0) + 1;
}

function buildAutoBriefTitle(briefNumber: number): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `Brief #${briefNumber} — ${day}.${month}.${year}`;
}

export function createBriefsRouter() {
  const router = Router();

  router.get("/", requireAuth, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const clientId = typeof req.query.clientId === "string" ? req.query.clientId.trim() : "";
      if (!clientId) {
        res.status(400).json(failure("BRIEF_INVALID", "clientId is required"));
        return;
      }

      const roles = getActiveRoles(authSession);

      if (isClientRole(roles)) {
        const companyId = await resolveClientCompanyId(authSession, clientId);
        if (!companyId) {
          res.status(403).json(forbiddenFailure());
          return;
        }

        const briefs = await prisma.brief.findMany({
          where: { clientId, companyId },
          orderBy: { createdAt: "desc" }
        });
        res.status(200).json(success(briefs));
        return;
      }

      if (isOwnerRole(roles)) {
        const briefs = await prisma.brief.findMany({
          where: { clientId },
          orderBy: { createdAt: "desc" }
        });
        res.status(200).json(success(briefs));
        return;
      }

      res.status(403).json(forbiddenFailure());
    } catch (error) {
      next(error);
    }
  });

  router.get("/admin", requireAuth, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const roles = getActiveRoles(authSession);
      if (!isOwnerRole(roles)) {
        res.status(403).json(forbiddenFailure());
        return;
      }

      const tenantId = authSession.tenantContext.activeMembership?.tenantId;
      if (!tenantId) {
        res.status(403).json(forbiddenFailure());
        return;
      }

      const clients = await prisma.client.findMany({
        where: { tenantId },
        select: { id: true, name: true }
      });
      const clientIds = clients.map((client) => client.id);
      const clientNameById = new Map(clients.map((client) => [client.id, client.name]));

      if (clientIds.length === 0) {
        res.status(200).json(success([]));
        return;
      }

      const briefs = await prisma.brief.findMany({
        where: { clientId: { in: clientIds } },
        orderBy: [{ briefNumber: "desc" }, { createdAt: "desc" }]
      });

      const enrichedBriefs = briefs.map((brief) => ({
        ...brief,
        clientName: clientNameById.get(brief.clientId) ?? "Unknown"
      }));

      res.status(200).json(success(enrichedBriefs));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", requireAuth, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const brief = await prisma.brief.findUnique({ where: { id: req.params.id } });
      if (!brief) {
        res.status(404).json(failure("BRIEF_NOT_FOUND", "Brief was not found."));
        return;
      }

      const roles = getActiveRoles(authSession);
      if (isClientRole(roles)) {
        const companyId = await resolveClientCompanyId(authSession, brief.clientId);
        if (!clientOwnsBrief(brief.companyId, companyId)) {
          res.status(403).json(forbiddenFailure());
          return;
        }
      } else if (!isOwnerRole(roles)) {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(brief));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireAuth, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
      const type = typeof body.type === "string" ? body.type.trim() : "";
      const content = typeof body.content === "string" ? body.content : "";
      const month = typeof body.month === "number" ? body.month : undefined;
      const year = typeof body.year === "number" ? body.year : undefined;
      const targetGroup =
        typeof body.targetGroup === "string" && body.targetGroup.trim()
          ? body.targetGroup.trim()
          : null;
      const hubCount = parseNonNegativeInt(body.hubCount);
      const geoSeoCount = parseNonNegativeInt(body.geoSeoCount);
      const lifestyleCount = parseNonNegativeInt(body.lifestyleCount);
      const otherCount = parseNonNegativeInt(body.otherCount);

      if (!clientId) {
        res.status(400).json({ error: "clientId is required" });
        return;
      }

      if (!type || !content) {
        res.status(400).json(failure("BRIEF_INVALID", "type and content are required."));
        return;
      }

      if (type !== "MONTHLY" && type !== "ADDITIONAL") {
        res.status(400).json(failure("BRIEF_INVALID", "type must be MONTHLY or ADDITIONAL."));
        return;
      }

      const companyId = await resolveCompanyIdForCreate(authSession, clientId);
      if (!companyId) {
        res.status(403).json(forbiddenFailure());
        return;
      }

      if (type === "MONTHLY") {
        if (month === undefined || year === undefined) {
          res.status(400).json(failure("BRIEF_INVALID", "month and year are required for MONTHLY briefs."));
          return;
        }

        const existing = await prisma.brief.findFirst({
          where: {
            clientId,
            type: "MONTHLY",
            month,
            year
          }
        });
        if (existing) {
          res.status(409).json(failure("BRIEF_ALREADY_EXISTS", "A monthly brief already exists for this client and period."));
          return;
        }
      }

      const briefNumber = await getNextBriefNumber(clientId);
      const title = buildAutoBriefTitle(briefNumber);

      const brief = await prisma.brief.create({
        data: {
          companyId,
          clientId,
          briefNumber,
          targetGroup,
          hubCount,
          geoSeoCount,
          lifestyleCount,
          otherCount,
          type: type as BriefType,
          month: type === "MONTHLY" ? month : null,
          year: type === "MONTHLY" ? year : null,
          title,
          content,
          status: "DRAFT" satisfies BriefStatus
        }
      });

      res.status(201).json(success(brief));
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id", requireAuth, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const brief = await prisma.brief.findUnique({ where: { id: req.params.id } });
      if (!brief) {
        res.status(404).json(failure("BRIEF_NOT_FOUND", "Brief was not found."));
        return;
      }

      const roles = getActiveRoles(authSession);
      if (isClientRole(roles)) {
        const companyId = await resolveClientCompanyId(authSession, brief.clientId);
        if (!clientOwnsBrief(brief.companyId, companyId)) {
          res.status(403).json(forbiddenFailure());
          return;
        }
      } else if (!isOwnerRole(roles)) {
        res.status(403).json(forbiddenFailure());
        return;
      }

      if (isOwnerRole(roles)) {
        if (brief.status === "AWAITING_CLIENT") {
          res.status(400).json({ error: "Brief is with client and cannot be edited" });
          return;
        }
        if (brief.status === "SUBMITTED") {
          res.status(400).json({ error: "Cannot edit a submitted brief" });
          return;
        }
      } else if (isClientRole(roles)) {
        if (brief.status === "SUBMITTED") {
          res.status(400).json({ error: "Cannot edit a submitted brief" });
          return;
        }
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const updateData: {
        title?: string;
        content?: string;
        targetGroup?: string | null;
        hubCount?: number;
        geoSeoCount?: number;
        lifestyleCount?: number;
        otherCount?: number;
      } = {};
      if (typeof body.title === "string") {
        updateData.title = body.title;
      }
      if (typeof body.content === "string") {
        updateData.content = body.content;
      }
      if (body.targetGroup === null) {
        updateData.targetGroup = null;
      } else if (typeof body.targetGroup === "string") {
        const trimmedTargetGroup = body.targetGroup.trim();
        updateData.targetGroup = trimmedTargetGroup ? trimmedTargetGroup : null;
      }
      if (body.hubCount !== undefined) {
        updateData.hubCount = parseNonNegativeInt(body.hubCount);
      }
      if (body.geoSeoCount !== undefined) {
        updateData.geoSeoCount = parseNonNegativeInt(body.geoSeoCount);
      }
      if (body.lifestyleCount !== undefined) {
        updateData.lifestyleCount = parseNonNegativeInt(body.lifestyleCount);
      }
      if (body.otherCount !== undefined) {
        updateData.otherCount = parseNonNegativeInt(body.otherCount);
      }

      const updated = await prisma.brief.update({
        where: { id: brief.id },
        data: updateData
      });

      res.status(200).json(success(updated));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/submit", requireAuth, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const brief = await prisma.brief.findUnique({ where: { id: req.params.id } });
      if (!brief) {
        res.status(404).json(failure("BRIEF_NOT_FOUND", "Brief was not found."));
        return;
      }

      const roles = getActiveRoles(authSession);
      if (isClientRole(roles)) {
        const companyId = await resolveClientCompanyId(authSession, brief.clientId);
        if (!clientOwnsBrief(brief.companyId, companyId)) {
          res.status(403).json(forbiddenFailure());
          return;
        }
      } else if (!isOwnerRole(roles)) {
        res.status(403).json(forbiddenFailure());
        return;
      }

      if (isOwnerRole(roles)) {
        if (brief.status !== "DRAFT") {
          res.status(400).json({ error: "Only DRAFT briefs can be sent to client" });
          return;
        }

        const updated = await prisma.brief.update({
          where: { id: brief.id },
          data: {
            status: "AWAITING_CLIENT",
            submittedAt: new Date(),
            submittedById: authSession.user.id
          }
        });

        res.status(200).json(success(updated));
        return;
      }

      if (brief.status === "SUBMITTED") {
        res.status(400).json({ error: "Already submitted" });
        return;
      }

      const updated = await prisma.brief.update({
        where: { id: brief.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          submittedById: authSession.user.id
        }
      });

      res.status(200).json(success(updated));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
