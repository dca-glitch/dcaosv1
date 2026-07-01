// Workflow brief routes — new initiation layer at /workflow-briefs.
// Legacy monthly briefs: /briefs (ClientMonthlyBrief). Legacy project brief: /ai-delivery-projects/:id/brief.
import { Router } from "express";
import type { AuthSessionLocals } from "../auth/types";
import {
  archiveWorkflowBrief,
  clientApproveWorkflowBriefProductionPlan,
  clientRejectWorkflowBriefProductionPlan,
  createWorkflowBrief,
  createWorkflowBriefLinkedProject,
  generateWorkflowBriefProductionPlan,
  generateWorkflowBriefContentDrafts,
  getWorkflowBriefById,
  getWorkflowBriefContentDraftStatus,
  getWorkflowBriefContentProductionSeedStatus,
  getWorkflowBriefDeliverablePackagingStatus,
  getWorkflowBriefImageSetStatus,
  getWorkflowBriefMiReport,
  getWorkflowBriefPackageCompleteness,
  getWorkflowBriefProductionPlan,
  getWorkflowBriefReleasePrepSummary,
  getWorkflowBriefReleasePackageStatus,
  finalizeWorkflowBriefReleasePackage,
  getWorkflowBriefPublicationHandoffStatus,
  executeWorkflowBriefPublicationHandoff,
  getWorkflowBriefSeoReport,
  listWorkflowBriefs,
  packageAllWorkflowBriefDeliverables,
  prepareAllWorkflowBriefImageSets,
  prepareWorkflowBriefRelease,
  regenerateWorkflowBriefContentDraft,
  refreshWorkflowBriefImageSet,
  repackageWorkflowBriefDeliverable,
  sendWorkflowBriefDeliverableForClientReview,
  sendWorkflowBriefProductionPlanToClient,
  seedWorkflowBriefContentProduction,
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
      if (result === "locked") {
        res.status(400).json(failure("PRODUCTION_PLAN_LOCKED", "Production plan cannot be edited in its current status."));
        return;
      }

      res.status(200).json(success(result.plan));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/production-plan/generate", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await generateWorkflowBriefProductionPlan(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "missing_reports") {
        res.status(400).json(failure("PRODUCTION_PLAN_MISSING_REPORTS", "MI and SEO reports are required before generating a production plan."));
        return;
      }
      if (result === "locked") {
        res.status(400).json(failure("PRODUCTION_PLAN_LOCKED", "Production plan cannot be regenerated in its current status."));
        return;
      }

      res.status(200).json(success(result.plan));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/production-plan/send", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await sendWorkflowBriefProductionPlanToClient(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("PRODUCTION_PLAN_NOT_FOUND", "Production plan was not found for this brief."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "invalid_status") {
        res.status(400).json(failure("PRODUCTION_PLAN_INVALID_STATUS", "Production plan cannot be sent to client in its current status."));
        return;
      }

      res.status(200).json(success(result.plan));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/production-plan/approve", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await clientApproveWorkflowBriefProductionPlan(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("PRODUCTION_PLAN_NOT_FOUND", "Production plan was not found for this brief."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "invalid_status") {
        res.status(400).json(failure("PRODUCTION_PLAN_INVALID_STATUS", "Production plan cannot be approved in its current status."));
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/production-plan/reject", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const comment = typeof body.comment === "string" ? body.comment : null;

      const result = await clientRejectWorkflowBriefProductionPlan(authSession, req.params.id, comment);
      if (result === "not_found") {
        res.status(404).json(failure("PRODUCTION_PLAN_NOT_FOUND", "Production plan was not found for this brief."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "invalid_status") {
        res.status(400).json(failure("PRODUCTION_PLAN_INVALID_STATUS", "Production plan cannot be rejected in its current status."));
        return;
      }

      res.status(200).json(success(result.plan));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/create-project", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const result = await createWorkflowBriefLinkedProject(authSession, req.params.id, {
        targetMonth: typeof body.targetMonth === "string" ? body.targetMonth : null,
        name: typeof body.name === "string" ? body.name : null
      });

      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "invalid_input") {
        res.status(400).json(failure("AI_DELIVERY_PROJECT_INVALID", "Invalid target month format. Use YYYY-MM."));
        return;
      }

      res.status(result.created ? 201 : 200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/content-production-seed", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await getWorkflowBriefContentProductionSeedStatus(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/seed-content-production", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await seedWorkflowBriefContentProduction(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "missing_project") {
        res.status(400).json(failure("CONTENT_SEED_MISSING_PROJECT", "Link an AI Delivery project before seeding content production."));
        return;
      }
      if (result === "missing_plan") {
        res.status(400).json(failure("CONTENT_SEED_MISSING_PLAN", "Production plan and SEO report are required before seeding."));
        return;
      }
      if (result === "invalid_status") {
        res.status(400).json(failure("CONTENT_SEED_INVALID_STATUS", "Brief is not ready for content production seeding."));
        return;
      }
      if (result === "manual_plan_exists") {
        res.status(409).json(
          failure(
            "CONTENT_SEED_MANUAL_PLAN_EXISTS",
            "Linked project already has content plan items from another source. Seed skipped to avoid duplication."
          )
        );
        return;
      }

      res.status(result.created ? 201 : 200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/content-drafts", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await getWorkflowBriefContentDraftStatus(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/generate-content-drafts", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await generateWorkflowBriefContentDrafts(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "missing_project") {
        res.status(400).json(failure("CONTENT_DRAFTS_MISSING_PROJECT", "Link an AI Delivery project before generating content drafts."));
        return;
      }
      if (result === "not_seeded") {
        res.status(400).json(failure("CONTENT_DRAFTS_NOT_SEEDED", "Seed content production before generating drafts."));
        return;
      }
      if (result === "invalid_status") {
        res.status(400).json(failure("CONTENT_DRAFTS_INVALID_STATUS", "Brief is not ready for content draft generation."));
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/regenerate-content-draft", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const contentPlanItemId = typeof body.contentPlanItemId === "string" ? body.contentPlanItemId.trim() : "";
      if (!contentPlanItemId) {
        res.status(400).json(failure("CONTENT_DRAFT_INVALID_ITEM", "contentPlanItemId is required."));
        return;
      }

      const result = await regenerateWorkflowBriefContentDraft(authSession, req.params.id, contentPlanItemId);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "missing_project") {
        res.status(400).json(failure("CONTENT_DRAFTS_MISSING_PROJECT", "Link an AI Delivery project before regenerating content drafts."));
        return;
      }
      if (result === "not_seeded") {
        res.status(400).json(failure("CONTENT_DRAFTS_NOT_SEEDED", "Seed content production before regenerating drafts."));
        return;
      }
      if (result === "invalid_item") {
        res.status(400).json(failure("CONTENT_DRAFT_INVALID_ITEM", "Content plan item was not found for this workflow brief seed."));
        return;
      }
      if (result === "invalid_status") {
        res.status(400).json(failure("CONTENT_DRAFTS_INVALID_STATUS", "Brief is not ready for content draft regeneration."));
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/deliverable-packaging", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await getWorkflowBriefDeliverablePackagingStatus(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/package-deliverables", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await packageAllWorkflowBriefDeliverables(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "missing_project") {
        res.status(400).json(failure("DELIVERABLE_PACKAGING_MISSING_PROJECT", "Link an AI Delivery project before packaging deliverables."));
        return;
      }
      if (result === "no_eligible_drafts") {
        res.status(400).json(
          failure("DELIVERABLE_PACKAGING_NO_ELIGIBLE_DRAFTS", "No eligible workflow content drafts are available for packaging.")
        );
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/repackage-deliverable", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const result = await repackageWorkflowBriefDeliverable(authSession, req.params.id, {
        contentDraftId: typeof body.contentDraftId === "string" ? body.contentDraftId : null,
        contentPlanItemId: typeof body.contentPlanItemId === "string" ? body.contentPlanItemId : null
      });

      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "missing_project") {
        res.status(400).json(failure("DELIVERABLE_PACKAGING_MISSING_PROJECT", "Link an AI Delivery project before repackaging deliverables."));
        return;
      }
      if (result === "invalid_item") {
        res.status(400).json(failure("DELIVERABLE_REPACKAGE_INVALID_ITEM", "contentDraftId or contentPlanItemId is required."));
        return;
      }
      if (result === "missing_draft") {
        res.status(400).json(failure("DELIVERABLE_REPACKAGE_MISSING_DRAFT", "Workflow content draft was not found for repackaging."));
        return;
      }
      if (result === "skipped_locked") {
        res.status(409).json(
          failure("DELIVERABLE_REPACKAGE_LOCKED", "Deliverable is locked for repackaging while client review or approval is active.")
        );
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/deliverables/:deliverableId/send-for-client-review", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await sendWorkflowBriefDeliverableForClientReview(
        authSession,
        req.params.id,
        req.params.deliverableId
      );

      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "invalid_deliverable") {
        res.status(400).json(
          failure("DELIVERABLE_REVIEW_INVALID", "Deliverable was not found or is not a workflow-brief packaged text deliverable.")
        );
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/image-sets", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await getWorkflowBriefImageSetStatus(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/prepare-image-sets", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await prepareAllWorkflowBriefImageSets(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "missing_project") {
        res.status(400).json(failure("IMAGE_SET_MISSING_PROJECT", "Link an AI Delivery project before preparing image sets."));
        return;
      }
      if (result === "no_eligible_drafts") {
        res.status(400).json(
          failure("IMAGE_SET_NO_ELIGIBLE_DRAFTS", "No eligible workflow content drafts are available for image preparation.")
        );
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/refresh-image-set", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const result = await refreshWorkflowBriefImageSet(authSession, req.params.id, {
        contentDraftId: typeof body.contentDraftId === "string" ? body.contentDraftId : null,
        contentPlanItemId: typeof body.contentPlanItemId === "string" ? body.contentPlanItemId : null
      });

      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "missing_project") {
        res.status(400).json(failure("IMAGE_SET_MISSING_PROJECT", "Link an AI Delivery project before refreshing image sets."));
        return;
      }
      if (result === "invalid_item") {
        res.status(400).json(failure("IMAGE_SET_INVALID_ITEM", "contentDraftId or contentPlanItemId is required."));
        return;
      }
      if (result === "missing_draft") {
        res.status(400).json(failure("IMAGE_SET_MISSING_DRAFT", "Workflow content draft was not found for image refresh."));
        return;
      }
      if (result === "skipped_locked") {
        res.status(409).json(
          failure("IMAGE_SET_REFRESH_LOCKED", "Image set is locked for refresh while approved or final-ready.")
        );
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/package-completeness", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await getWorkflowBriefPackageCompleteness(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/release-prep", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await getWorkflowBriefReleasePrepSummary(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/prepare-release", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await prepareWorkflowBriefRelease(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "missing_project") {
        res.status(400).json(failure("RELEASE_PREP_MISSING_PROJECT", "Link an AI Delivery project before preparing release."));
        return;
      }
      if (result === "not_ready") {
        res.status(400).json(
          failure("RELEASE_PREP_NOT_READY", "Packages are not complete enough for release preparation.")
        );
        return;
      }
      if (result === "publication_target_missing") {
        res.status(400).json(
          failure("RELEASE_PREP_PUBLICATION_TARGET_MISSING", "Configure a publication target for this client before release preparation.")
        );
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/publication-handoff", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await getWorkflowBriefPublicationHandoffStatus(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/execute-publication-handoff", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await executeWorkflowBriefPublicationHandoff(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "missing_project") {
        res.status(400).json(
          failure(
            "PUBLICATION_HANDOFF_MISSING_PROJECT",
            "Link an AI Delivery project before executing publication handoff."
          )
        );
        return;
      }
      if (result === "publication_target_missing") {
        res.status(400).json(
          failure(
            "PUBLICATION_HANDOFF_PUBLICATION_TARGET_MISSING",
            "Configure a publication target for this client before publication handoff."
          )
        );
        return;
      }
      if (result === "not_ready") {
        res.status(400).json(
          failure("PUBLICATION_HANDOFF_NOT_READY", "Packages are not complete enough for publication handoff.")
        );
        return;
      }
      if (result === "release_prep_missing") {
        res.status(400).json(
          failure(
            "PUBLICATION_HANDOFF_PREP_MISSING",
            "Run release preparation before executing publication handoff."
          )
        );
        return;
      }
      if (result === "release_package_not_finalized") {
        res.status(400).json(
          failure(
            "PUBLICATION_HANDOFF_RELEASE_PACKAGE_NOT_FINALIZED",
            "Finalize the release package before executing publication handoff."
          )
        );
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id/release-package", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await getWorkflowBriefReleasePackageStatus(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  router.post("/:id/finalize-release-package", requireAuth, requireTenant, async (req, res, next) => {
    try {
      const authSession = getAuthSession(res);
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }

      const result = await finalizeWorkflowBriefReleasePackage(authSession, req.params.id);
      if (result === "not_found") {
        res.status(404).json(failure("WORKFLOW_BRIEF_NOT_FOUND", "Workflow brief was not found."));
        return;
      }
      if (result === "forbidden") {
        res.status(403).json(forbiddenFailure());
        return;
      }
      if (result === "missing_project") {
        res.status(400).json(
          failure("RELEASE_PACKAGE_MISSING_PROJECT", "Link an AI Delivery project before finalizing the release package.")
        );
        return;
      }
      if (result === "release_prep_missing") {
        res.status(400).json(
          failure(
            "RELEASE_PACKAGE_PREP_MISSING",
            "Run release preparation before finalizing the release package."
          )
        );
        return;
      }
      if (result === "not_ready") {
        res.status(400).json(
          failure("RELEASE_PACKAGE_NOT_READY", "Packages are not complete enough for final release.")
        );
        return;
      }
      if (result === "already_finalized") {
        res.status(409).json(
          failure("RELEASE_PACKAGE_ALREADY_FINALIZED", "Release package is already finalized for this workflow brief.")
        );
        return;
      }

      res.status(200).json(success(result));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
