import { Router, type RequestHandler } from "express";
import {
  archiveAiDeliveryArticleImageHandler,
  approveAiDeliveryArticleImageHandler,
  acceptAiDeliveryDeliverableHandler,
  archiveAiDeliveryProjectHandler,
  getAiDeliveryMonthlySummaryHandler,
  archiveAiDeliveryContentDraftHandler,
  archiveBillHandler,
  archiveVendorHandler,
  archiveClientHandler,
  archiveClientUserAccessHandler,
  archiveInvoiceHandler,
  archiveInvoiceItemHandler,
  archiveProjectHandler,
  archiveRecurringInvoiceHandler,
  archiveTaskHandler,
  cancelInvoiceHandler,
  createAiDeliveryProjectHandler,
  createAiDeliveryResearchRequestHandler,
  createAiDeliveryResearchSummaryHandler,
  createAiDeliveryResearchSourceHandler,
  createAiDeliveryArticleImageHandler,
  createAiDeliveryContentDraftHandler,
  createAiDeliveryWorkflowRunHandler,
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
  executeAiDeliveryWorkflowRunHandler,
  markAiDeliveryArticleImageFinalReadyHandler,
  markAiDeliveryArticleImagePreviewReadyHandler,
  applyAiDeliveryResearchSummaryToBriefHandler,
  getClientHandler,
  getCompanyProfileHandler,
  getInvoiceHandler,
  getProjectHandler,
  getRecurringInvoiceHandler,
  getTaskHandler,
  listActivityAuditLogsHandler,
  listAiDeliveryArticleImagesHandler,
  listAiDeliveryDeliverablesHandler,
  listAiDeliveryDeliverableReviewsHandler,
  createAiDeliveryDeliverableHandler,
  createAiDeliveryDeliverableReviewHandler,
  downloadAiDeliveryArticleImageHandler,
  getAiDeliveryArticleImageDownloadReferenceHandler,
  downloadAiDeliveryDeliverableHandler,
  getAiDeliveryDeliverableDownloadReferenceHandler,
  prepareAiDeliveryDeliverableWordPressDraftHandler,
  publishAiDeliveryDeliverableToWordPressHandler,
  getAiDeliveryWordPressConfigHandler,
  saveAiDeliveryWordPressConfigHandler,
  uploadAiDeliveryArticleImageFinalAssetHandler,
  uploadAiDeliveryDeliverableDocumentHandler,
  markAiDeliveryDeliverableReadyHandler,
  updateAiDeliveryDeliverableHandler,
  updateAiDeliveryDeliverableReviewHandler,
  archiveAiDeliveryDeliverableHandler,
  requestAiDeliveryDeliverableRevisionHandler,
  restoreAiDeliveryDeliverableHandler,
  listAiDeliveryProjectsHandler,
  listAiDeliveryResearchRequestsHandler,
  listAiDeliveryResearchSummariesHandler,
  listAiDeliveryResearchSourcesHandler,
  listAiDeliveryWorkflowRunsHandler,
  listAiDeliveryContentDraftsHandler,
  requestAiDeliveryContentDraftClientReviewHandler,
  requestAiDeliveryArticleImageChangesHandler,
  returnAiDeliveryContentDraftToDraftHandler,
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
  requestAiDeliveryContentPlanChangesHandler,
  markInvoicePaidHandler,
  markInvoiceSentHandler,
  markInvoiceUncollectibleHandler,
  registerInvoicePaymentHandler,
  restoreBillHandler,
  restoreVendorHandler,
  restoreClientHandler,
  restoreInvoiceItemHandler,
  restoreProjectHandler,
  restoreTaskHandler,
  saveCompanyProfileHandler,
  issueCreditNoteHandler,
  updateAiDeliveryProjectHandler,
  updateAiDeliveryResearchRequestHandler,
  updateAiDeliveryResearchSummaryHandler,
  updateAiDeliveryResearchSourceHandler,
  updateAiDeliveryArticleImageHandler,
  updateAiDeliveryContentDraftHandler,
  updateAiDeliveryWorkflowRunHandler,
  updateBillHandler,
  updateClientHandler,
  updateVendorHandler,
  updateCreditNoteHandler,
  updateInvoiceHandler,
  updateInvoiceItemHandler,
  updateProjectHandler,
  updateRecurringInvoiceHandler,
  updateTaskHandler,
  uploadBillDocumentHandler,
  voidCreditNoteHandler,
  listMarketIntelligenceProjectsHandler,
  createMarketIntelligenceProjectHandler,
  updateMarketIntelligenceProjectHandler,
  archiveMarketIntelligenceProjectHandler,
  listMarketIntelligenceSourcesHandler,
  createMarketIntelligenceSourceHandler,
  updateMarketIntelligenceSourceHandler,
  archiveMarketIntelligenceSourceHandler,
  listMarketIntelligenceResearchRunsHandler,
  createMarketIntelligenceResearchRunHandler,
  executeMarketIntelligenceResearchRunHandler,
  listMarketIntelligenceInsightsHandler,
  createMarketIntelligenceInsightHandler,
  updateMarketIntelligenceInsightHandler,
  archiveMarketIntelligenceInsightHandler,
  getAiDeliveryMonthlyReportHandler,
  getAiDeliveryMonthlyReportMetricsHandler,
  createAiDeliveryMonthlyReportHandler,
  importAiDeliveryMonthlyReportMetricsHandler,
  approveAiDeliveryMonthlyReportMetricsHandler,
  archiveAiDeliveryMonthlyReportMetricsHandler,
  updateAiDeliveryMonthlyReportHandler,
  updateAiDeliveryMonthlyReportStatusHandler,
  archiveAiDeliveryMonthlyReportHandler,
  restoreAiDeliveryMonthlyReportHandler,
  uploadAiDeliveryMonthlyReportDocumentHandler,
  getAiDeliveryMonthlyReportDownloadReferenceHandler
} from "../controllers/coreController";
import { failure } from "../utils/responses";
import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole, requireTenant } from "../middlewares";

export function createCoreRouter() {
  const router = Router();
  const clientPortalDeferredHandler: RequestHandler = (_req, res) => {
    res.status(403).json(
      failure(
        "CLIENT_PORTAL_DEFERRED",
        "Client review access is deferred until the Client Portal foundation is enabled."
      )
    );
  };

  router.get("/company-profile", requireAuth, requireTenant, getCompanyProfileHandler);
  router.put("/company-profile", requireAuth, requireTenant, requireRole("owner", "admin"), saveCompanyProfileHandler);
  router.get("/tenant/wordpress-config", requireAuth, requireTenant, requireRole("owner", "admin"), getAiDeliveryWordPressConfigHandler);
  router.post("/tenant/wordpress-config", requireAuth, requireTenant, requireRole("owner", "admin"), saveAiDeliveryWordPressConfigHandler);
  router.get("/activity/audit-logs", requireAuth, requireTenant, requireRole("owner", "admin"), listActivityAuditLogsHandler);

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
  router.get("/ai-delivery/projects/:projectId/workflow-runs", requireAuth, requireTenant, requireRole("owner", "admin"), listAiDeliveryWorkflowRunsHandler);
  router.post("/ai-delivery/projects/:projectId/workflow-runs", requireAuth, requireTenant, requireRole("owner", "admin"), createAiDeliveryWorkflowRunHandler);
  router.put("/ai-delivery/projects/:projectId/workflow-runs/:workflowRunId", requireAuth, requireTenant, requireRole("owner", "admin"), updateAiDeliveryWorkflowRunHandler);
  router.post("/ai-delivery/projects/:projectId/workflow-runs/:workflowRunId/execute", requireAuth, requireTenant, requireRole("owner", "admin"), executeAiDeliveryWorkflowRunHandler);
  router.get("/ai-delivery/projects/:projectId/research-requests", requireAuth, requireTenant, requireRole("owner", "admin"), listAiDeliveryResearchRequestsHandler);
  router.post("/ai-delivery/projects/:projectId/research-requests", requireAuth, requireTenant, requireRole("owner", "admin"), createAiDeliveryResearchRequestHandler);
  router.put("/ai-delivery/projects/:projectId/research-requests/:researchRequestId", requireAuth, requireTenant, requireRole("owner", "admin"), updateAiDeliveryResearchRequestHandler);
  router.get("/ai-delivery/projects/:projectId/research-summaries", requireAuth, requireTenant, requireRole("owner", "admin"), listAiDeliveryResearchSummariesHandler);
  router.post("/ai-delivery/projects/:projectId/research-summaries", requireAuth, requireTenant, requireRole("owner", "admin"), createAiDeliveryResearchSummaryHandler);
  router.put("/ai-delivery/projects/:projectId/research-summaries/:researchSummaryId", requireAuth, requireTenant, requireRole("owner", "admin"), updateAiDeliveryResearchSummaryHandler);
  router.post("/ai-delivery/projects/:projectId/research-summaries/:researchSummaryId/apply-to-brief", requireAuth, requireTenant, requireRole("owner", "admin"), applyAiDeliveryResearchSummaryToBriefHandler);
  router.get("/ai-delivery/projects/:projectId/research-sources", requireAuth, requireTenant, requireRole("owner", "admin"), listAiDeliveryResearchSourcesHandler);
  router.post("/ai-delivery/projects/:projectId/research-sources", requireAuth, requireTenant, requireRole("owner", "admin"), createAiDeliveryResearchSourceHandler);
  router.put("/ai-delivery/projects/:projectId/research-sources/:researchSourceId", requireAuth, requireTenant, requireRole("owner", "admin"), updateAiDeliveryResearchSourceHandler);
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
  router.post("/ai-delivery-projects/:id/content-plan/request-changes", requireAuth, requireTenant, requireRole("owner", "admin"), requestAiDeliveryContentPlanChangesHandler);
  router.get("/ai-delivery-projects/:id/content-drafts", requireAuth, requireTenant, requireRole("owner", "admin"), listAiDeliveryContentDraftsHandler);
  router.post("/ai-delivery-projects/:id/content-drafts", requireAuth, requireTenant, requireRole("owner", "admin"), createAiDeliveryContentDraftHandler);
  router.put("/ai-delivery-projects/:id/content-drafts/:draftId", requireAuth, requireTenant, requireRole("owner", "admin"), updateAiDeliveryContentDraftHandler);
  router.post("/ai-delivery-projects/:id/content-drafts/:draftId/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveAiDeliveryContentDraftHandler);
  router.post("/ai-delivery-projects/:id/content-drafts/:draftId/request-client-review", requireAuth, requireTenant, requireRole("owner", "admin"), requestAiDeliveryContentDraftClientReviewHandler);
  router.post("/ai-delivery-projects/:id/content-drafts/:draftId/return-to-draft", requireAuth, requireTenant, requireRole("owner", "admin"), returnAiDeliveryContentDraftToDraftHandler);
  router.get("/ai-delivery-projects/:id/article-images", requireAuth, requireTenant, requireRole("owner", "admin"), listAiDeliveryArticleImagesHandler);
  router.post("/ai-delivery-projects/:id/article-images", requireAuth, requireTenant, requireRole("owner", "admin"), createAiDeliveryArticleImageHandler);
  router.put("/ai-delivery-projects/:id/article-images/:imageId", requireAuth, requireTenant, requireRole("owner", "admin"), updateAiDeliveryArticleImageHandler);
  router.post("/ai-delivery-projects/:id/article-images/:imageId/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveAiDeliveryArticleImageHandler);
  router.post("/ai-delivery-projects/:id/article-images/:imageId/mark-preview-ready", requireAuth, requireTenant, requireRole("owner", "admin"), markAiDeliveryArticleImagePreviewReadyHandler);
  router.post("/ai-delivery-projects/:id/article-images/:imageId/request-changes", requireAuth, requireTenant, requireRole("owner", "admin"), requestAiDeliveryArticleImageChangesHandler);
  router.post("/ai-delivery-projects/:id/article-images/:imageId/approve", requireAuth, requireTenant, requireRole("owner", "admin"), approveAiDeliveryArticleImageHandler);
  router.post("/ai-delivery-projects/:id/article-images/:imageId/final-image", requireAuth, requireTenant, requireRole("owner", "admin"), uploadAiDeliveryArticleImageFinalAssetHandler);
  router.post("/ai-delivery-projects/:id/article-images/:imageId/mark-final-ready", requireAuth, requireTenant, requireRole("owner", "admin"), markAiDeliveryArticleImageFinalReadyHandler);
  router.get("/ai-delivery-projects/:id/article-images/:imageId/download", requireAuth, requireTenant, requireRole("owner", "admin"), downloadAiDeliveryArticleImageHandler);
  router.get("/ai-delivery-projects/:id/article-images/:imageId/download-reference", requireAuth, requireTenant, requireRole("owner", "admin"), getAiDeliveryArticleImageDownloadReferenceHandler);
  router.get("/ai-delivery-projects/:id/deliverables", requireAuth, requireTenant, requireRole("owner", "admin"), listAiDeliveryDeliverablesHandler);
  router.post("/ai-delivery-projects/:id/deliverables", requireAuth, requireTenant, requireRole("owner", "admin"), createAiDeliveryDeliverableHandler);
  router.put("/ai-delivery-projects/:id/deliverables/:deliverableId", requireAuth, requireTenant, requireRole("owner", "admin"), updateAiDeliveryDeliverableHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/document", requireAuth, requireTenant, requireRole("owner", "admin"), uploadAiDeliveryDeliverableDocumentHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/mark-ready", requireAuth, requireTenant, requireRole("owner", "admin"), markAiDeliveryDeliverableReadyHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/request-revision", requireAuth, requireTenant, requireRole("owner", "admin"), requestAiDeliveryDeliverableRevisionHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/accept", requireAuth, requireTenant, requireRole("owner", "admin"), acceptAiDeliveryDeliverableHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveAiDeliveryDeliverableHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/restore", requireAuth, requireTenant, requireRole("owner", "admin"), restoreAiDeliveryDeliverableHandler);
  router.get("/ai-delivery-projects/:id/deliverables/:deliverableId/download", requireAuth, requireTenant, requireRole("owner", "admin"), downloadAiDeliveryDeliverableHandler);
  router.get("/ai-delivery-projects/:id/deliverables/:deliverableId/download-reference", requireAuth, requireTenant, requireRole("owner", "admin"), getAiDeliveryDeliverableDownloadReferenceHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/prepare-wordpress-draft", requireAuth, requireTenant, requireRole("owner", "admin"), prepareAiDeliveryDeliverableWordPressDraftHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/publish-wordpress", requireAuth, requireTenant, requireRole("owner", "admin"), publishAiDeliveryDeliverableToWordPressHandler);
  router.get("/ai-delivery-projects/:id/deliverables/:deliverableId/reviews", requireAuth, requireTenant, requireRole("owner", "admin"), listAiDeliveryDeliverableReviewsHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/reviews", requireAuth, requireTenant, requireRole("owner", "admin"), createAiDeliveryDeliverableReviewHandler);
  router.put("/ai-delivery-projects/:id/deliverables/:deliverableId/reviews/:reviewId", requireAuth, requireTenant, requireRole("owner", "admin"), updateAiDeliveryDeliverableReviewHandler);
  router.get("/ai-delivery-projects/:id/content-plan/client-review", clientPortalDeferredHandler);
  router.post("/ai-delivery-projects/:id/content-plan/client-review/approve", clientPortalDeferredHandler);
  router.post("/ai-delivery-projects/:id/content-plan/client-review/request-revision", clientPortalDeferredHandler);
  router.get("/ai-delivery-projects/:id/content-drafts/client-review", clientPortalDeferredHandler);
  router.post("/ai-delivery-projects/:id/content-drafts/:draftId/client-review/approve", clientPortalDeferredHandler);
  router.post("/ai-delivery-projects/:id/content-drafts/:draftId/client-review/request-revision", clientPortalDeferredHandler);

  router.get("/ai-delivery/reports/monthly/:reportId/metrics", requireAuth, requireTenant, requireRole("owner", "admin"), getAiDeliveryMonthlyReportMetricsHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/metrics/import", requireAuth, requireTenant, requireRole("owner", "admin"), importAiDeliveryMonthlyReportMetricsHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/metrics/:snapshotId/approve", requireAuth, requireTenant, requireRole("owner", "admin"), approveAiDeliveryMonthlyReportMetricsHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/metrics/:snapshotId/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveAiDeliveryMonthlyReportMetricsHandler);

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
  router.put("/vendors/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateVendorHandler);
  router.post("/vendors/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveVendorHandler);
  router.post("/vendors/:id/restore", requireAuth, requireTenant, requireRole("owner", "admin"), restoreVendorHandler);

  router.get("/bills", requireAuth, requireTenant, listBillsHandler);
  router.post("/bills", requireAuth, requireTenant, requireRole("owner", "admin"), createBillHandler);
  router.put("/bills/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateBillHandler);
  router.post("/bills/:id/document", requireAuth, requireTenant, requireRole("owner", "admin"), uploadBillDocumentHandler);
  router.get("/bills/:id/document/download", requireAuth, requireTenant, downloadBillDocumentHandler);
  router.post("/bills/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveBillHandler);
  router.post("/bills/:id/restore", requireAuth, requireTenant, requireRole("owner", "admin"), restoreBillHandler);

  // Monthly Report - admin-only computed summary (schema-free, read model)
  router.get("/ai-delivery/reports/monthly-summary", requireAuth, requireTenant, requireRole("owner", "admin"), getAiDeliveryMonthlySummaryHandler);

  // Monthly Report - admin-only persisted model
  router.get("/ai-delivery/reports/monthly/:projectId", requireAuth, requireTenant, requireRole("owner", "admin"), getAiDeliveryMonthlyReportHandler);
  router.post("/ai-delivery/reports/monthly/:projectId", requireAuth, requireTenant, requireRole("owner", "admin"), createAiDeliveryMonthlyReportHandler);
  router.put("/ai-delivery/reports/monthly/:reportId/update", requireAuth, requireTenant, requireRole("owner", "admin"), updateAiDeliveryMonthlyReportHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/status", requireAuth, requireTenant, requireRole("owner", "admin"), updateAiDeliveryMonthlyReportStatusHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveAiDeliveryMonthlyReportHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/restore", requireAuth, requireTenant, requireRole("owner", "admin"), restoreAiDeliveryMonthlyReportHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/document", requireAuth, requireTenant, requireRole("owner", "admin"), uploadAiDeliveryMonthlyReportDocumentHandler);
  router.get("/ai-delivery/reports/monthly/:reportId/download", requireAuth, requireTenant, requireRole("owner", "admin"), getAiDeliveryMonthlyReportDownloadReferenceHandler);

  // Market Intelligence routes
  router.get("/market-intelligence-projects", requireAuth, requireTenant, requireRole("owner", "admin"), listMarketIntelligenceProjectsHandler);
  router.post("/market-intelligence-projects", requireAuth, requireTenant, requireRole("owner", "admin"), createMarketIntelligenceProjectHandler);
  router.put("/market-intelligence-projects/:id", requireAuth, requireTenant, requireRole("owner", "admin"), updateMarketIntelligenceProjectHandler);
  router.post("/market-intelligence-projects/:id/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveMarketIntelligenceProjectHandler);

  router.get("/market-intelligence-projects/:projectId/sources", requireAuth, requireTenant, requireRole("owner", "admin"), listMarketIntelligenceSourcesHandler);
  router.post("/market-intelligence-projects/:projectId/sources", requireAuth, requireTenant, requireRole("owner", "admin"), createMarketIntelligenceSourceHandler);
  router.put("/market-intelligence-projects/:projectId/sources/:sourceId", requireAuth, requireTenant, requireRole("owner", "admin"), updateMarketIntelligenceSourceHandler);
  router.post("/market-intelligence-projects/:projectId/sources/:sourceId/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveMarketIntelligenceSourceHandler);

  router.get("/market-intelligence-projects/:projectId/research-runs", requireAuth, requireTenant, requireRole("owner", "admin"), listMarketIntelligenceResearchRunsHandler);
  router.post("/market-intelligence-projects/:projectId/research-runs", requireAuth, requireTenant, requireRole("owner", "admin"), createMarketIntelligenceResearchRunHandler);
  router.post("/market-intelligence-projects/:projectId/research-runs/:runId/execute", requireAuth, requireTenant, requireRole("owner", "admin"), executeMarketIntelligenceResearchRunHandler);

  router.get("/market-intelligence-projects/:projectId/insights", requireAuth, requireTenant, requireRole("owner", "admin"), listMarketIntelligenceInsightsHandler);
  router.post("/market-intelligence-projects/:projectId/insights", requireAuth, requireTenant, requireRole("owner", "admin"), createMarketIntelligenceInsightHandler);
  router.put("/market-intelligence-projects/:projectId/insights/:insightId", requireAuth, requireTenant, requireRole("owner", "admin"), updateMarketIntelligenceInsightHandler);
  router.post("/market-intelligence-projects/:projectId/insights/:insightId/archive", requireAuth, requireTenant, requireRole("owner", "admin"), archiveMarketIntelligenceInsightHandler);

  return router;
}
