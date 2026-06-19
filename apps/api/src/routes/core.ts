import { Router } from "express";
import {
  archiveAiDeliveryProjectHandler,
  archiveAiDeliveryContentDraftHandler,
  archiveBillHandler,
  archiveClientHandler,
  archiveClientUserAccessHandler,
  archiveInvoiceHandler,
  archiveInvoiceItemHandler,
  archiveProjectHandler,
  archiveRecurringInvoiceHandler,
  archiveTaskHandler,
  cancelInvoiceHandler,
  createAiDeliveryProjectHandler,
  createAiDeliveryContentDraftHandler,
  createCreditNoteHandler,
  createBillHandler,
  createClientHandler,
  createInvoiceHandler,
  createInvoiceItemHandler,
  createProjectHandler,
  createRecurringInvoiceHandler,
  createTaskHandler,
  createVendorHandler,
  generateDueRecurringInvoiceHandler,
  downloadBillDocumentHandler,
  downloadCreditNoteDocumentHandler,
  downloadInvoiceDocumentHandler,
  getClientHandler,
  getCompanyProfileHandler,
  getInvoiceHandler,
  getProjectHandler,
  getRecurringInvoiceHandler,
  getTaskHandler,
  listAiDeliveryProjectsHandler,
  listAiDeliveryContentDraftsHandler,
  listClientAiDeliveryContentDraftReviewsHandler,
  approveClientAiDeliveryContentDraftReviewHandler,
  requestClientAiDeliveryContentDraftRevisionHandler,
  requestAiDeliveryContentDraftClientReviewHandler,
  listBillsHandler,
  listClientUserAccessHandler,
  listClientsHandler,
  listInvoiceItemsHandler,
  listInvoicesHandler,
  listProjectsHandler,
  listRecurringInvoicesHandler,
  listTasksHandler,
  listVendorsHandler,
  linkClientUserAccessHandler,
  requestAiDeliveryBriefClientInputHandler,
  requestAiDeliveryBriefClientRevisionHandler,
  approveFinalAiDeliveryBriefHandler,
  getAiDeliveryBriefHandler,
  saveAiDeliveryBriefHandler,
  // Monthly content plan handlers
  getAiDeliveryContentPlanHandler,
  createAiDeliveryContentPlanHandler,
  updateAiDeliveryContentPlanHandler,
  requestAiDeliveryContentPlanClientReviewHandler,
  approveAiDeliveryContentPlanHandler,
  getClientAiDeliveryContentPlanReviewHandler,
  approveClientAiDeliveryContentPlanReviewHandler,
  requestClientAiDeliveryContentPlanRevisionHandler,
  markInvoicePaidHandler,
  markInvoiceSentHandler,
  markInvoiceUncollectibleHandler,
  registerInvoicePaymentHandler,
  restoreBillHandler,
  restoreClientHandler,
  restoreInvoiceItemHandler,
  restoreProjectHandler,
  restoreTaskHandler,
  saveCompanyProfileHandler,
  issueCreditNoteHandler,
  updateAiDeliveryProjectHandler,
  updateAiDeliveryContentDraftHandler,
  updateBillHandler,
  updateClientHandler,
  updateCreditNoteHandler,
  updateInvoiceHandler,
  updateInvoiceItemHandler,
  updateProjectHandler,
  updateRecurringInvoiceHandler,
  updateTaskHandler,
  uploadBillDocumentHandler,
  voidCreditNoteHandler
} from "../controllers/coreController";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole, requireTenant } from "../middlewares";

export function createCoreRouter() {
  const router = Router();

  router.get("/company-profile", requireAuth, requireTenant, getCompanyProfileHandler);
  router.put("/company-profile", requireAuth, requireTenant, requireRole("owner", "admin"), saveCompanyProfileHandler);

  router.get("/clients", requireAuth, requireTenant, listClientsHandler);
  router.post("/clients", requireAuth, requireTenant, requireRole("owner", "admin"), createClientHandler);
  router.get("/clients/:id/users", requireAuth, requireTenant, requireRole("owner", "admin"), listClientUserAccessHandler);
  router.post("/clients/:id/users", requireAuth, requireTenant, requireRole("owner", "admin"), linkClientUserAccessHandler);
  router.post("/clients/:id/users/:userId/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveClientUserAccessHandler);
  router.get("/clients/:id", requireAuth, requireTenant, getClientHandler);
  router.put("/clients/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateClientHandler);
  router.post("/clients/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveClientHandler);
  router.post("/clients/:id/restore", requireAuth, requireTenant, requireRole("owner", "admin"), restoreClientHandler);

  router.get("/projects", requireAuth, requireTenant, listProjectsHandler);
  router.post("/projects", requireAuth, requireTenant, requireRole("owner", "admin"), createProjectHandler);
  router.get("/projects/:id", requireAuth, requireTenant, getProjectHandler);
  router.put("/projects/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateProjectHandler);
  router.post("/projects/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveProjectHandler);
  router.post("/projects/:id/restore", requireAuth, requireTenant, requireRole("owner", "admin"), restoreProjectHandler);

  router.get("/ai-delivery-projects", requireAuth, requireTenant, requireRole("owner", "admin"), listAiDeliveryProjectsHandler);
  router.post("/ai-delivery-projects", requireAuth, requireTenant, requireRole("owner", "admin"), createAiDeliveryProjectHandler);
  router.put("/ai-delivery-projects/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateAiDeliveryProjectHandler);
  router.post("/ai-delivery-projects/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveAiDeliveryProjectHandler);
  router.post("/ai-delivery-projects/:id/brief/request-client-input", requireAuth, requireTenant, requireRole("owner", "admin"), requestAiDeliveryBriefClientInputHandler);
  router.post("/ai-delivery-projects/:id/brief/request-client-revision", requireAuth, requireTenant, requireRole("owner", "admin"), requestAiDeliveryBriefClientRevisionHandler);
  router.post("/ai-delivery-projects/:id/brief/approve-final", requireAuth, requireTenant, requireRole("owner", "admin"), approveFinalAiDeliveryBriefHandler);
  router.get("/ai-delivery-projects/:id/brief", requireAuth, requireTenant, requireRole("owner", "admin"), getAiDeliveryBriefHandler);
  router.put("/ai-delivery-projects/:id/brief", requireAuth, requireTenant, requireRole("owner", "admin"), saveAiDeliveryBriefHandler);

  // Monthly content plan endpoints (admin/owner only)
  router.get("/ai-delivery-projects/:id/content-plan", requireAuth, requireTenant, requireRole("owner", "admin"), getAiDeliveryContentPlanHandler);
  router.post("/ai-delivery-projects/:id/content-plan", requireAuth, requireTenant, requireRole("owner", "admin"), createAiDeliveryContentPlanHandler);
  router.put("/ai-delivery-projects/:id/content-plan", requireAuth, requireTenant, requireRole("owner", "admin"), updateAiDeliveryContentPlanHandler);
  router.post("/ai-delivery-projects/:id/content-plan/request-client-review", requireAuth, requireTenant, requireRole("owner", "admin"), requestAiDeliveryContentPlanClientReviewHandler);
  router.post("/ai-delivery-projects/:id/content-plan/approve", requireAuth, requireTenant, requireRole("owner", "admin"), approveAiDeliveryContentPlanHandler);
  router.get("/ai-delivery-projects/:id/content-drafts", requireAuth, requireTenant, requireRole("owner", "admin"), listAiDeliveryContentDraftsHandler);
  router.post("/ai-delivery-projects/:id/content-drafts", requireAuth, requireTenant, requireRole("owner", "admin"), createAiDeliveryContentDraftHandler);
  router.put("/ai-delivery-projects/:id/content-drafts/:draftId", requireAuth, requireTenant, requireRole("owner", "admin"), updateAiDeliveryContentDraftHandler);
  router.post("/ai-delivery-projects/:id/content-drafts/:draftId/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveAiDeliveryContentDraftHandler);
  router.post("/ai-delivery-projects/:id/content-drafts/:draftId/request-client-review", requireAuth, requireTenant, requireRole("owner", "admin"), requestAiDeliveryContentDraftClientReviewHandler);
  router.get("/ai-delivery-projects/:id/content-plan/client-review", requireAuth, requireTenant, getClientAiDeliveryContentPlanReviewHandler);
  router.post("/ai-delivery-projects/:id/content-plan/client-review/approve", requireAuth, requireTenant, approveClientAiDeliveryContentPlanReviewHandler);
  router.post("/ai-delivery-projects/:id/content-plan/client-review/request-revision", requireAuth, requireTenant, requestClientAiDeliveryContentPlanRevisionHandler);
  router.get("/ai-delivery-projects/:id/content-drafts/client-review", requireAuth, requireTenant, listClientAiDeliveryContentDraftReviewsHandler);
  router.post("/ai-delivery-projects/:id/content-drafts/:draftId/client-review/approve", requireAuth, requireTenant, approveClientAiDeliveryContentDraftReviewHandler);
  router.post("/ai-delivery-projects/:id/content-drafts/:draftId/client-review/request-revision", requireAuth, requireTenant, requestClientAiDeliveryContentDraftRevisionHandler);

  router.get("/tasks", requireAuth, requireTenant, listTasksHandler);
  router.post("/tasks", requireAuth, requireTenant, requireRole("owner", "admin"), createTaskHandler);
  router.get("/tasks/:id", requireAuth, requireTenant, getTaskHandler);
  router.put("/tasks/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateTaskHandler);
  router.post("/tasks/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveTaskHandler);
  router.post("/tasks/:id/restore", requireAuth, requireTenant, requireRole("owner", "admin"), restoreTaskHandler);

  router.get("/invoices", requireAuth, requireTenant, listInvoicesHandler);
  router.post("/invoices", requireAuth, requireTenant, requireRole("owner", "admin"), createInvoiceHandler);
  router.get("/invoice-items", requireAuth, requireTenant, listInvoiceItemsHandler);
  router.post("/invoice-items", requireAuth, requireTenant, requireRole("owner", "admin"), createInvoiceItemHandler);
  router.put("/invoice-items/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateInvoiceItemHandler);
  router.post("/invoice-items/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveInvoiceItemHandler);
  router.post("/invoice-items/:id/restore", requireAuth, requireTenant, requireRole("owner", "admin"), restoreInvoiceItemHandler);
  router.get("/invoices/:id", requireAuth, requireTenant, getInvoiceHandler);
  router.put("/invoices/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateInvoiceHandler);
  router.get("/invoices/:id/document/download", requireAuth, requireTenant, downloadInvoiceDocumentHandler);
  router.post("/invoices/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveInvoiceHandler);
  router.post("/invoices/:id/mark-sent", requireAuth, requireTenant, requireRole("owner", "admin"), markInvoiceSentHandler);
  router.post("/invoices/:id/mark-paid", requireAuth, requireTenant, requireRole("owner", "admin"), markInvoicePaidHandler);
  router.post("/invoices/:id/payment", requireAuth, requireTenant, requireRole("owner", "admin"), registerInvoicePaymentHandler);
  router.post("/invoices/:id/cancel", requireAuth, requireTenant, requireRole("owner", "admin"), cancelInvoiceHandler);
  router.post("/invoices/:id/mark-uncollectible", requireAuth, requireTenant, requireRole("owner", "admin"), markInvoiceUncollectibleHandler);
  router.post("/invoices/:id/credit-notes", requireAuth, requireTenant, requireRole("owner", "admin"), createCreditNoteHandler);
  router.put("/credit-notes/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateCreditNoteHandler);
  router.post("/credit-notes/:id/issue", requireAuth, requireTenant, requireRole("owner", "admin"), issueCreditNoteHandler);
  router.post("/credit-notes/:id/void", requireAuth, requireTenant, requireRole("owner", "admin"), voidCreditNoteHandler);
  router.get("/credit-notes/:id/document/download", requireAuth, requireTenant, downloadCreditNoteDocumentHandler);

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
  router.get("/bills/:id/document/download", requireAuth, requireTenant, downloadBillDocumentHandler);
  router.post("/bills/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveBillHandler);
  router.post("/bills/:id/restore", requireAuth, requireTenant, requireRole("owner", "admin"), restoreBillHandler);

  return router;
}
