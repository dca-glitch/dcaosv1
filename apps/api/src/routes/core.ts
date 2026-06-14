import { Router } from "express";
import {
  archiveClientHandler,
  archiveProjectHandler,
  archiveTaskHandler,
  createClientHandler,
  createProjectHandler,
  createTaskHandler,
  getClientHandler,
  getCompanyProfileHandler,
  getProjectHandler,
  getTaskHandler,
  listClientsHandler,
  listProjectsHandler,
  listTasksHandler,
  saveCompanyProfileHandler,
  updateClientHandler,
  updateProjectHandler,
  updateTaskHandler
} from "../controllers/coreController";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole, requireTenant } from "../middlewares";

export function createCoreRouter() {
  const router = Router();

  router.get("/company-profile", requireAuth, getCompanyProfileHandler);
  router.put("/company-profile", requireAuth, requireRole("owner", "admin"), saveCompanyProfileHandler);

  router.get("/clients", requireAuth, requireTenant, listClientsHandler);
  router.post("/clients", requireAuth, requireTenant, requireRole("owner", "admin"), createClientHandler);
  router.get("/clients/:id", requireAuth, requireTenant, getClientHandler);
  router.put("/clients/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateClientHandler);
  router.post("/clients/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveClientHandler);

  router.get("/projects", requireAuth, requireTenant, listProjectsHandler);
  router.post("/projects", requireAuth, requireTenant, requireRole("owner", "admin"), createProjectHandler);
  router.get("/projects/:id", requireAuth, requireTenant, getProjectHandler);
  router.put("/projects/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateProjectHandler);
  router.post("/projects/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveProjectHandler);

  router.get("/tasks", requireAuth, requireTenant, listTasksHandler);
  router.post("/tasks", requireAuth, requireTenant, requireRole("owner", "admin"), createTaskHandler);
  router.get("/tasks/:id", requireAuth, requireTenant, getTaskHandler);
  router.put("/tasks/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateTaskHandler);
  router.post("/tasks/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveTaskHandler);

  return router;
}
