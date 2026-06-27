import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireTenant } from "../middlewares/tenant.middleware";
import { failure, forbiddenFailure, success, unauthorizedFailure } from "../utils/responses";
import type { AuthSessionLocals } from "../auth/types";
import {
  getClientPortalDeliverableDownloadReference,
  getClientPortalDeliverySummary,
  getClientPortalMonthlyReportDownloadReference,
  getClientPortalProject,
  listClientPortalDeliverables,
  listClientPortalMonthlyReports,
  listClientPortalProjects
} from "../core/client-portal.runtime";

export function createClientPortalRouter() {
  const router = Router();

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

  return router;
}
