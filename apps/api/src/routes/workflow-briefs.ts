// Workflow brief routes — new initiation layer at /workflow-briefs.
// Legacy monthly briefs: /briefs (ClientMonthlyBrief). Legacy project brief: /ai-delivery-projects/:id/brief.
import { Router } from "express";
import type { AuthSessionLocals } from "../auth/types";
import {
  archiveWorkflowBrief,
  createWorkflowBrief,
  getWorkflowBriefById,
  getWorkflowBriefMiReport,
  getWorkflowBriefProductionPlan,
  getWorkflowBriefSeoReport,
  listWorkflowBriefs,
  submitWorkflowBrief,
  triggerWorkflowBriefAiRun,
  updateWorkflowBrief,
  upsertWorkflowBriefProductionPlan
} from "../core/workflow-brief.runtime";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireTenant } from "../middlewares/tenant.middleware";
import { failure, forbiddenFailure, success, unauthorizedFailure } from "../utils/responses";

function getAuthSession(res: { locals: unknown }) {
  return (res.locals as AuthSessionLocals).authSession ?? null;
}

export function createWorkflowBriefsRouter() {
  const router = Router();

  router.get("/", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const clientId = typeof req.query.clientId === "string" ? req.query.clientId.trim() : undefined;
      const result = await listWorkflowBriefs(authSession, clientId);
      if (!result) {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(result.briefs, { scope: "workflow-briefs" }));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await getWorkflowBriefById(authSession, req.params.id);
      if (!result) {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }

      res.status(200).json(success(result.brief));
    } catch (error) {
      next(error);
    }
  });

  router.post("/", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
      const title = typeof body.title === "string" ? body.title.trim() : "";

      if (!clientId || !title) {
        res.status(400).json(failure("WORKFLOW_BRIEF_INVALID", "clientId and title are required."));
        return;
      }

      const result = await createWorkflowBrief(authSession, {
        clientId,
        title,
        goal: typeof body.goal === "string" ? body.goal : null,
        businessContext: typeof body.businessContext === "string" ? body.businessContext : null,
        targetAudience: typeof body.targetAudience === "string" ? body.targetAudience : null,
        offerContext: typeof body.offerContext === "string" ? body.offerContext : null,
        locationContext: typeof body.locationContext === "string" ? body.locationContext : null,
        notes: typeof body.notes === "string" ? body.notes : null,
        structuredInputJson: body.structuredInputJson ?? null
      });

      if (!result) {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(201).json(success(result.brief));
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:id", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const result = await updateWorkflowBrief(authSession, req.params.id, {
        title: typeof body.title === "string" ? body.title : undefined,
        goal: typeof body.goal === "string" ? body.goal : body.goal === null ? null : undefined,
        businessContext:
          typeof body.businessContext === "string"
            ? body.businessContext
            : body.businessContext === null
              ? null
              : undefined,
        targetAudience:
          typeof body.targetAudience === "string"
            ? body.targetAudience
            : body.targetAudience === null
              ? null
              : undefined,
        offerContext:
          typeof body.offerContext === "string"
            ? body.offerContext
            : body.offerContext === null
              ? null
              : undefined,
        locationContext:
          typeof body.locationContext === "string"
            ? body.locationContext
            : body.locationContext === null
              ? null
              : undefined,
        notes: typeof body.notes === "string" ? body.notes : body.notes === null ? null : undefined,
        structuredInputJson: body.structuredInputJson ?? undefined
      });

      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "locked") {
        res.status(400).json(failure("WORKFLOW_BRIEF_LOCKED", "Workflow brief cannot be edited in its current status."));
        return;
      }

      res.status(200).json(success(result.brief));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/submit", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await submitWorkflowBrief(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "invalid_status") {
        res.status(400).json(failure("WORKFLOW_BRIEF_INVALID_STATUS", "Workflow brief cannot be submitted in its current status."));
        return;
      }

      res.status(200).json(success(result.brief));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/archive", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await archiveWorkflowBrief(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(result.brief));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/run-ai", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await triggerWorkflowBriefAiRun(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "invalid_status") {
        res.status(400).json(failure("WORKFLOW_BRIEF_INVALID_STATUS", "Workflow brief is not ready for AI run."));
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/mi-report", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await getWorkflowBriefMiReport(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("MI_REPORT_NOT_FOUND", "MI report was not found for this brief."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(result.report));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/seo-report", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await getWorkflowBriefSeoReport(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("SEO_REPORT_NOT_FOUND", "SEO report was not found for this brief."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(result.report));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/production-plan", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await getWorkflowBriefProductionPlan(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("PRODUCTION_PLAN_NOT_FOUND", "Production plan was not found for this brief."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(result.plan));
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id/production-plan", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) {
        res.status(400).json(failure("PRODUCTION_PLAN_INVALID", "title is required."));
        return;
      }

      const result = await upsertWorkflowBriefProductionPlan(authSession, req.params.id, {
        title,
        body: typeof body.body === "string" ? body.body : null,
        planJson: body.planJson ?? null,
        clientVisibleSnapshotJson: body.clientVisibleSnapshotJson ?? null,
        aiDeliveryProjectId: typeof body.aiDeliveryProjectId === "string" ? body.aiDeliveryProjectId : null
      });

      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(result.plan));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
