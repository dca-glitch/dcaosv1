import { Router } from "express";
/**
 * Client Portal API routes (G574 inventory).
 * Archive serializers: client-portal.runtime.ts + client-portal-serializer.ts
 * Error / payload safety: client-portal-error-safety.ts
 * Approval mutations: client-portal-approval.* (Lane 10) — no RBAC weakening here.
 * Forbidden client exposure: storageKey, providerMetadata, raw cost, workflow internals.
 */
import { requireAuth } from "../middlewares/auth.middleware";
import { requireTenant } from "../middlewares/tenant.middleware";
import { failure, forbiddenFailure, success, unauthorizedFailure } from "../utils/responses";
import type { AuthSessionLocals } from "../auth/types";
import {
  getClientPortalDeliverableDownloadReference,
  getClientPortalDeliverySummary,
  getClientPortalMyClient,
  getClientPortalReleasePackage,
  getClientPortalMonthlyReportDownloadReference,
  getClientPortalProject,
  listClientPortalDeliverables,
  getClientPortalMonthlyReport,
  listClientPortalMonthlyReports,
  listClientPortalProjects
} from "../core/client-portal.runtime";
import {
  listClientPortalCatalogProducts,
  submitClientPortalCatalogInquiry
} from "../core/client-catalog.runtime";
import {
  approveClientPortalDeliverableHandler,
  approveClientPortalDeliverableImageHandler,
  getClientPortalDeliverableForApprovalHandler,
  getClientPortalDeliverableEditHistoryHandler,
  listClientPortalPendingApprovalsHandler,
  patchClientPortalDeliverableBodyHandler,
  patchClientPortalDeliverableMetadataHandler,
  rejectClientPortalDeliverableHandler,
  rejectClientPortalDeliverableImageHandler,
  undoClientPortalDeliverableImageReviewHandler
} from "../controllers/client-portal-approval.controller";

export function createClientPortalRouter() {
  const router = Router();

  router.get("/my-client", requireAuth, requireTenant, async (_req, res) => {
    const authSession = (res.locals as AuthSessionLocals).authSession;
    if (!authSession) {
      res.status(401).json(unauthorizedFailure());
      return;
    }

    const result = await getClientPortalMyClient(authSession);
    if (!result) {
      res.status(404).json(failure("CLIENT_PORTAL_ACCESS_NOT_FOUND", "No client access found"));
      return;
    }

    res.status(200).json(success(result));
  });

  router.get("/projects", requireAuth, requireTenant, async (_req, res) => {
    const authSession = (res.locals as AuthSessionLocals).authSession;
    if (!authSession) {
      res.status(401).json(unauthorizedFailure());
      return;
    }
    const result = await listClientPortalProjects(authSession);
    if (!result) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(result));
  });

  router.get("/projects/:projectId", requireAuth, requireTenant, async (req, res) => {
    const authSession = (res.locals as AuthSessionLocals).authSession;
    if (!authSession) {
      res.status(401).json(unauthorizedFailure());
      return;
    }
    const result = await getClientPortalProject(authSession, req.params.projectId);
    if (!result) {
      res.status(404).json(failure("CLIENT_PORTAL_PROJECT_NOT_FOUND", "Project was not found."));
      return;
    }
    res.status(200).json(success(result));
  });

  router.get("/projects/:projectId/delivery-summary", requireAuth, requireTenant, async (req, res) => {
    const authSession = (res.locals as AuthSessionLocals).authSession;
    if (!authSession) {
      res.status(401).json(unauthorizedFailure());
      return;
    }
    const result = await getClientPortalDeliverySummary(authSession, req.params.projectId);
    if (!result) {
      res.status(404).json(failure("CLIENT_PORTAL_PROJECT_NOT_FOUND", "Project was not found."));
      return;
    }
    res.status(200).json(success(result));
  });

  router.get("/projects/:projectId/release-package", requireAuth, requireTenant, async (req, res) => {
    const authSession = (res.locals as AuthSessionLocals).authSession;
    if (!authSession) {
      res.status(401).json(unauthorizedFailure());
      return;
    }
    const result = await getClientPortalReleasePackage(authSession, req.params.projectId);
    if (!result) {
      res.status(404).json(failure("CLIENT_PORTAL_PROJECT_NOT_FOUND", "Project was not found."));
      return;
    }
    res.status(200).json(success(result));
  });

  router.get("/projects/:projectId/catalog-products", requireAuth, requireTenant, async (req, res) => {
    const authSession = (res.locals as AuthSessionLocals).authSession;
    if (!authSession) {
      res.status(401).json(unauthorizedFailure());
      return;
    }
    const result = await listClientPortalCatalogProducts(authSession, req.params.projectId);
    if (!result) {
      res.status(404).json(failure("CLIENT_PORTAL_PROJECT_NOT_FOUND", "Project was not found."));
      return;
    }
    res.status(200).json(success(result));
  });

  router.post("/projects/:projectId/catalog-inquiries", requireAuth, requireTenant, async (req, res) => {
    const authSession = (res.locals as AuthSessionLocals).authSession;
    if (!authSession) {
      res.status(401).json(unauthorizedFailure());
      return;
    }
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await submitClientPortalCatalogInquiry(authSession, req.params.projectId, {
      productId: typeof body.productId === "string" ? body.productId : null,
      contactName: typeof body.contactName === "string" ? body.contactName : undefined,
      contactEmail: typeof body.contactEmail === "string" ? body.contactEmail : undefined,
      contactPhone: typeof body.contactPhone === "string" ? body.contactPhone : null,
      message: typeof body.message === "string" ? body.message : undefined
    });
    if (!result?.catalogInquiry) {
      res.status(400).json(failure("CLIENT_CATALOG_INQUIRY_INVALID", "Catalog inquiry could not be submitted."));
      return;
    }
    res.status(201).json(success(result));
  });

  router.get("/projects/:projectId/deliverables", requireAuth, requireTenant, async (req, res) => {
    const authSession = (res.locals as AuthSessionLocals).authSession;
    if (!authSession) {
      res.status(401).json(unauthorizedFailure());
      return;
    }
    const result = await listClientPortalDeliverables(authSession, req.params.projectId);
    if (!result) {
      res.status(404).json(failure("CLIENT_PORTAL_PROJECT_NOT_FOUND", "Project was not found."));
      return;
    }
    res.status(200).json(success(result));
  });

  router.get("/projects/:projectId/monthly-reports", requireAuth, requireTenant, async (req, res) => {
    const authSession = (res.locals as AuthSessionLocals).authSession;
    if (!authSession) {
      res.status(401).json(unauthorizedFailure());
      return;
    }
    const result = await listClientPortalMonthlyReports(authSession, req.params.projectId);
    if (!result) {
      res.status(404).json(failure("CLIENT_PORTAL_PROJECT_NOT_FOUND", "Project was not found."));
      return;
    }
    res.status(200).json(success(result));
  });

  router.get("/projects/:projectId/monthly-reports/:reportId", requireAuth, requireTenant, async (req, res) => {
    const authSession = (res.locals as AuthSessionLocals).authSession;
    if (!authSession) {
      res.status(401).json(unauthorizedFailure());
      return;
    }
    const result = await getClientPortalMonthlyReport(authSession, req.params.projectId, req.params.reportId);
    if (!result) {
      res.status(404).json(failure("CLIENT_PORTAL_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
      return;
    }
    res.status(200).json(success(result));
  });

  router.get(
    "/projects/:projectId/deliverables/:deliverableId/download",
    requireAuth,
    requireTenant,
    async (req, res) => {
      const authSession = (res.locals as AuthSessionLocals).authSession;
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }
      const result = await getClientPortalDeliverableDownloadReference(
        authSession,
        req.params.projectId,
        req.params.deliverableId
      );
      if (!result) {
        res.status(404).json(failure("CLIENT_PORTAL_DELIVERABLE_NOT_FOUND", "Deliverable was not found."));
        return;
      }
      res.status(200).json(success(result));
    }
  );

  router.get(
    "/projects/:projectId/monthly-reports/:reportId/download",
    requireAuth,
    requireTenant,
    async (req, res) => {
      const authSession = (res.locals as AuthSessionLocals).authSession;
      if (!authSession) {
        res.status(401).json(unauthorizedFailure());
        return;
      }
      const result = await getClientPortalMonthlyReportDownloadReference(
        authSession,
        req.params.projectId,
        req.params.reportId
      );
      if (!result) {
        res.status(404).json(failure("CLIENT_PORTAL_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found or document unavailable."));
        return;
      }
      res.status(200).json(success(result));
    }
  );

  router.get("/clients/:clientId/pending-approvals", requireAuth, requireTenant, listClientPortalPendingApprovalsHandler);
  router.get("/pending-approvals", requireAuth, requireTenant, listClientPortalPendingApprovalsHandler);
  router.get("/deliverables/:deliverableId/for-approval", requireAuth, requireTenant, getClientPortalDeliverableForApprovalHandler);
  router.patch("/deliverables/:deliverableId/body", requireAuth, requireTenant, patchClientPortalDeliverableBodyHandler);
  router.patch("/deliverables/:deliverableId/metadata", requireAuth, requireTenant, patchClientPortalDeliverableMetadataHandler);
  router.get("/deliverables/:deliverableId/edit-history", requireAuth, requireTenant, getClientPortalDeliverableEditHistoryHandler);
  router.patch("/deliverables/:deliverableId/images/:imageId/approve", requireAuth, requireTenant, approveClientPortalDeliverableImageHandler);
  router.patch("/deliverables/:deliverableId/images/:imageId/reject", requireAuth, requireTenant, rejectClientPortalDeliverableImageHandler);
  router.patch("/deliverables/:deliverableId/images/:imageId/undo", requireAuth, requireTenant, undoClientPortalDeliverableImageReviewHandler);
  router.patch("/deliverables/:deliverableId/approve", requireAuth, requireTenant, approveClientPortalDeliverableHandler);
  router.patch("/deliverables/:deliverableId/reject", requireAuth, requireTenant, rejectClientPortalDeliverableHandler);

  return router;
}
