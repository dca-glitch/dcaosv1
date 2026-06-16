import { Router } from "express";
import {
  archiveBillHandler,
  archiveClientHandler,
  archiveInvoiceHandler,
  archiveProjectHandler,
  archiveRecurringInvoiceHandler,
  archiveTaskHandler,
  cancelInvoiceHandler,
  createBillHandler,
  createClientHandler,
  createInvoiceHandler,
  createProjectHandler,
  createRecurringInvoiceHandler,
  createTaskHandler,
  createVendorHandler,
  generateDueRecurringInvoiceHandler,
  getClientHandler,
  getCompanyProfileHandler,
  getInvoiceHandler,
  getProjectHandler,
  getRecurringInvoiceHandler,
  getTaskHandler,
  listBillsHandler,
  listClientsHandler,
  listInvoicesHandler,
  listProjectsHandler,
  listRecurringInvoicesHandler,
  listTasksHandler,
  listVendorsHandler,
  markInvoicePaidHandler,
  markInvoiceSentHandler,
  restoreBillHandler,
  saveCompanyProfileHandler,
  updateBillHandler,
  updateClientHandler,
  updateInvoiceHandler,
  updateProjectHandler,
  updateRecurringInvoiceHandler,
  updateTaskHandler,
  uploadBillDocumentHandler
} from "../controllers/coreController";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole, requireTenant } from "../middlewares";

export function createCoreRouter() {
  const router = Router();

  router.get("/company-profile", requireAuth, requireTenant, getCompanyProfileHandler);
  router.put("/company-profile", requireAuth, requireTenant, requireRole("owner", "admin"), saveCompanyProfileHandler);

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

  router.get("/invoices", requireAuth, requireTenant, listInvoicesHandler);
  router.post("/invoices", requireAuth, requireTenant, requireRole("owner", "admin"), createInvoiceHandler);
  router.get("/invoices/:id", requireAuth, requireTenant, getInvoiceHandler);
  router.put("/invoices/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateInvoiceHandler);
  router.post("/invoices/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveInvoiceHandler);
  router.post("/invoices/:id/mark-sent", requireAuth, requireTenant, requireRole("owner", "admin"), markInvoiceSentHandler);
  router.post("/invoices/:id/mark-paid", requireAuth, requireTenant, requireRole("owner", "admin"), markInvoicePaidHandler);
  router.post("/invoices/:id/cancel", requireAuth, requireTenant, requireRole("owner", "admin"), cancelInvoiceHandler);

  router.get("/recurring-invoices", requireAuth, requireTenant, listRecurringInvoicesHandler);
  router.post("/recurring-invoices", requireAuth, requireTenant, requireRole("owner", "admin"), createRecurringInvoiceHandler);
  router.get("/recurring-invoices/:id", requireAuth, requireTenant, getRecurringInvoiceHandler);
  router.put("/recurring-invoices/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateRecurringInvoiceHandler);
  router.post("/recurring-invoices/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveRecurringInvoiceHandler);
  router.post("/recurring-invoices/:id/generate-due", requireAuth, requireTenant, requireRole("owner", "admin"), generateDueRecurringInvoiceHandler);

  router.get("/vendors", requireAuth, requireTenant, listVendorsHandler);
  router.post("/vendors", requireAuth, requireTenant, requireRole("owner", "admin"), createVendorHandler);

  router.get("/bills", requireAuth, requireTenant, listBillsHandler);
  router.post("/bills", requireAuth, requireTenant, requireRole("owner", "admin"), createBillHandler);
  router.put("/bills/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateBillHandler);
  router.post("/bills/:id/document", requireAuth, requireTenant, requireRole("owner", "admin"), uploadBillDocumentHandler);
  router.post("/bills/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveBillHandler);
  router.post("/bills/:id/restore", requireAuth, requireTenant, requireRole("owner", "admin"), restoreBillHandler);

  return router;
}
