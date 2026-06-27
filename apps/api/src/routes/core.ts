import { Router } from "express";
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
  exportAiDeliveryDeliverableToGoogleDocHandler,
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
  listClientAiDeliveryContentDraftReviewsHandler,
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
  requestClientAiDeliveryContentDraftRevisionHandler,
  requestClientAiDeliveryContentPlanRevisionHandler,
  approveClientAiDeliveryContentDraftReviewHandler,
  approveClientAiDeliveryContentPlanReviewHandler,
  approveFinalAiDeliveryBriefHandler,
  getClientAiDeliveryContentPlanReviewHandler,
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
  prepareMarketIntelligenceHandoffHandler,
  listMarketIntelligenceHandoffsHandler,
  updateMarketIntelligenceHandoffStatusHandler,
  archiveMarketIntelligenceHandoffHandler,
  listAiDeliveryMiContextHandler,
  applyMiHandoffToAiDeliveryHandler,
  removeMiHandoffFromAiDeliveryHandler,
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
  generateAiDeliveryMonthlyReportPdfHandler,
  uploadAiDeliveryMonthlyReportDocumentHandler,
  getAiDeliveryMonthlyReportDownloadReferenceHandler,
  getAiDeliveryMonthlyReportMiContextHandler,
  applyMiHandoffToMonthlyReportHandler,
  updateMonthlyReportMiContextDraftHandler,
  removeMiHandoffFromMonthlyReportHandler
} from "../controllers/coreController";

import { requireAuth } from "../middlewares/auth.middleware";
import { requireRole, requireTenant } from "../middlewares";
import { tenantModuleGuard } from "../middlewares/tenant-module.middleware";
import {
  archiveClientPublicationTargetHandler,
  clientPublicationRouteGuards,
  createClientPublicationTargetHandler,
  deleteClientPublicationTargetCredentialsHandler,
  getClientAnalyticsProfileHandler,
  getClientPublicationTargetCredentialStatusHandler,
  listClientPublicationLogsHandler,
  listClientPublicationTargetsHandler,
  saveClientAnalyticsProfileHandler,
  saveClientPublicationTargetCredentialsHandler,
  updateClientPublicationTargetHandler
} from "../controllers/clientPublicationController";
import {
  archiveClientCatalogProductHandler,
  clientCatalogRouteGuards,
  createClientCatalogProductHandler,
  listClientCatalogInquiriesHandler,
  listClientCatalogProductsHandler,
  updateClientCatalogInquiryStatusHandler,
  updateClientCatalogProductHandler
} from "../controllers/clientCatalogController";

export function createCoreRouter() {
  const router = Router();

  router.get("/company-profile", requireAuth, requireTenant, tenantModuleGuard, getCompanyProfileHandler);
  router.put("/company-profile", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), saveCompanyProfileHandler);
  router.get("/tenant/wordpress-config", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), getAiDeliveryWordPressConfigHandler);
  router.post("/tenant/wordpress-config", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), saveAiDeliveryWordPressConfigHandler);
  router.get("/activity/audit-logs", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listActivityAuditLogsHandler);

  router.get("/clients", requireAuth, requireTenant, tenantModuleGuard, listClientsHandler);
  router.post("/clients", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createClientHandler);
  router.get("/clients/:id/users", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listClientUserAccessHandler);
  router.post("/clients/:id/users", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), linkClientUserAccessHandler);
  router.post("/clients/:id/users/:userId/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveClientUserAccessHandler);
  router.get("/clients/:id", requireAuth, requireTenant, tenantModuleGuard, getClientHandler);
  router.put("/clients/:id", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateClientHandler);
  router.get("/clients/:clientId/publication-targets", ...clientPublicationRouteGuards, tenantModuleGuard, listClientPublicationTargetsHandler);
  router.post("/clients/:clientId/publication-targets", ...clientPublicationRouteGuards, tenantModuleGuard, createClientPublicationTargetHandler);
  router.put("/clients/:clientId/publication-targets/:publicationTargetId", ...clientPublicationRouteGuards, tenantModuleGuard, updateClientPublicationTargetHandler);
  router.post("/clients/:clientId/publication-targets/:publicationTargetId/archive", ...clientPublicationRouteGuards, tenantModuleGuard, archiveClientPublicationTargetHandler);
  router.get("/clients/:clientId/publication-targets/:publicationTargetId/credentials", ...clientPublicationRouteGuards, tenantModuleGuard, getClientPublicationTargetCredentialStatusHandler);
  router.post("/clients/:clientId/publication-targets/:publicationTargetId/credentials", ...clientPublicationRouteGuards, tenantModuleGuard, saveClientPublicationTargetCredentialsHandler);
  router.delete("/clients/:clientId/publication-targets/:publicationTargetId/credentials", ...clientPublicationRouteGuards, tenantModuleGuard, deleteClientPublicationTargetCredentialsHandler);
  router.get("/clients/:clientId/analytics-profile", ...clientPublicationRouteGuards, tenantModuleGuard, getClientAnalyticsProfileHandler);
  router.put("/clients/:clientId/analytics-profile", ...clientPublicationRouteGuards, tenantModuleGuard, saveClientAnalyticsProfileHandler);
  router.get("/clients/:clientId/publication-logs", ...clientPublicationRouteGuards, tenantModuleGuard, listClientPublicationLogsHandler);
  router.get("/clients/:clientId/catalog-products", ...clientCatalogRouteGuards, tenantModuleGuard, listClientCatalogProductsHandler);
  router.post("/clients/:clientId/catalog-products", ...clientCatalogRouteGuards, tenantModuleGuard, createClientCatalogProductHandler);
  router.put("/clients/:clientId/catalog-products/:productId", ...clientCatalogRouteGuards, tenantModuleGuard, updateClientCatalogProductHandler);
  router.post("/clients/:clientId/catalog-products/:productId/archive", ...clientCatalogRouteGuards, tenantModuleGuard, archiveClientCatalogProductHandler);
  router.get("/clients/:clientId/catalog-inquiries", ...clientCatalogRouteGuards, tenantModuleGuard, listClientCatalogInquiriesHandler);
  router.post("/clients/:clientId/catalog-inquiries/:inquiryId/status", ...clientCatalogRouteGuards, tenantModuleGuard, updateClientCatalogInquiryStatusHandler);
  router.post("/clients/:id/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveClientHandler);
  router.post("/clients/:id/restore", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), restoreClientHandler);

  router.get("/projects", requireAuth, requireTenant, listProjectsHandler);
  router.post("/projects", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createProjectHandler);
  router.get("/projects/:id", requireAuth, requireTenant, getProjectHandler);
  router.put("/projects/:id", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateProjectHandler);
  router.post("/projects/:id/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveProjectHandler);
  router.post("/projects/:id/restore", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), restoreProjectHandler);

  router.get("/ai-delivery-projects", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listAiDeliveryProjectsHandler);
  router.post("/ai-delivery-projects", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createAiDeliveryProjectHandler);
  router.put("/ai-delivery-projects/:id", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateAiDeliveryProjectHandler);
  router.post("/ai-delivery-projects/:id/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveAiDeliveryProjectHandler);
  router.get("/ai-delivery/projects/:projectId/workflow-runs", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listAiDeliveryWorkflowRunsHandler);
  router.post("/ai-delivery/projects/:projectId/workflow-runs", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createAiDeliveryWorkflowRunHandler);
  router.put("/ai-delivery/projects/:projectId/workflow-runs/:workflowRunId", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateAiDeliveryWorkflowRunHandler);
  router.post("/ai-delivery/projects/:projectId/workflow-runs/:workflowRunId/execute", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), executeAiDeliveryWorkflowRunHandler);
  router.get("/ai-delivery/projects/:projectId/research-requests", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listAiDeliveryResearchRequestsHandler);
  router.post("/ai-delivery/projects/:projectId/research-requests", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createAiDeliveryResearchRequestHandler);
  router.put("/ai-delivery/projects/:projectId/research-requests/:researchRequestId", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateAiDeliveryResearchRequestHandler);
  router.get("/ai-delivery/projects/:projectId/research-summaries", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listAiDeliveryResearchSummariesHandler);
  router.post("/ai-delivery/projects/:projectId/research-summaries", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createAiDeliveryResearchSummaryHandler);
  router.put("/ai-delivery/projects/:projectId/research-summaries/:researchSummaryId", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateAiDeliveryResearchSummaryHandler);
  router.post("/ai-delivery/projects/:projectId/research-summaries/:researchSummaryId/apply-to-brief", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), applyAiDeliveryResearchSummaryToBriefHandler);
  router.get("/ai-delivery/projects/:projectId/research-sources", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listAiDeliveryResearchSourcesHandler);
  router.post("/ai-delivery/projects/:projectId/research-sources", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createAiDeliveryResearchSourceHandler);
  router.put("/ai-delivery/projects/:projectId/research-sources/:researchSourceId", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateAiDeliveryResearchSourceHandler);
  router.post("/ai-delivery-projects/:id/brief/request-client-input", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), requestAiDeliveryBriefClientInputHandler);
  router.post("/ai-delivery-projects/:id/brief/request-client-revision", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), requestAiDeliveryBriefClientRevisionHandler);
  router.post("/ai-delivery-projects/:id/brief/approve-final", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), approveFinalAiDeliveryBriefHandler);
  router.get("/ai-delivery-projects/:id/brief", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), getAiDeliveryBriefHandler);
  router.put("/ai-delivery-projects/:id/brief", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), saveAiDeliveryBriefHandler);

  // Monthly content plan endpoints (admin/owner only)
  router.get("/ai-delivery-projects/:id/content-plan", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), getAiDeliveryContentPlanHandler);
  router.post("/ai-delivery-projects/:id/content-plan", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createAiDeliveryContentPlanHandler);
  router.put("/ai-delivery-projects/:id/content-plan", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateAiDeliveryContentPlanHandler);
  router.post("/ai-delivery-projects/:id/content-plan/request-client-review", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), requestAiDeliveryContentPlanClientReviewHandler);
  router.post("/ai-delivery-projects/:id/content-plan/approve", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), approveAiDeliveryContentPlanHandler);
  router.post("/ai-delivery-projects/:id/content-plan/request-changes", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), requestAiDeliveryContentPlanChangesHandler);
  router.get("/ai-delivery-projects/:id/content-drafts", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listAiDeliveryContentDraftsHandler);
  router.post("/ai-delivery-projects/:id/content-drafts", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createAiDeliveryContentDraftHandler);
  router.put("/ai-delivery-projects/:id/content-drafts/:draftId", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateAiDeliveryContentDraftHandler);
  router.post("/ai-delivery-projects/:id/content-drafts/:draftId/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveAiDeliveryContentDraftHandler);
  router.post("/ai-delivery-projects/:id/content-drafts/:draftId/request-client-review", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), requestAiDeliveryContentDraftClientReviewHandler);
  router.post("/ai-delivery-projects/:id/content-drafts/:draftId/return-to-draft", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), returnAiDeliveryContentDraftToDraftHandler);
  router.get("/ai-delivery-projects/:id/article-images", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listAiDeliveryArticleImagesHandler);
  router.post("/ai-delivery-projects/:id/article-images", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createAiDeliveryArticleImageHandler);
  router.put("/ai-delivery-projects/:id/article-images/:imageId", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateAiDeliveryArticleImageHandler);
  router.post("/ai-delivery-projects/:id/article-images/:imageId/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveAiDeliveryArticleImageHandler);
  router.post("/ai-delivery-projects/:id/article-images/:imageId/mark-preview-ready", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), markAiDeliveryArticleImagePreviewReadyHandler);
  router.post("/ai-delivery-projects/:id/article-images/:imageId/request-changes", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), requestAiDeliveryArticleImageChangesHandler);
  router.post("/ai-delivery-projects/:id/article-images/:imageId/approve", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), approveAiDeliveryArticleImageHandler);
  router.post("/ai-delivery-projects/:id/article-images/:imageId/final-image", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), uploadAiDeliveryArticleImageFinalAssetHandler);
  router.post("/ai-delivery-projects/:id/article-images/:imageId/mark-final-ready", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), markAiDeliveryArticleImageFinalReadyHandler);
  router.get("/ai-delivery-projects/:id/article-images/:imageId/download", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), downloadAiDeliveryArticleImageHandler);
  router.get("/ai-delivery-projects/:id/article-images/:imageId/download-reference", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), getAiDeliveryArticleImageDownloadReferenceHandler);
  router.get("/ai-delivery-projects/:id/deliverables", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listAiDeliveryDeliverablesHandler);
  router.post("/ai-delivery-projects/:id/deliverables", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createAiDeliveryDeliverableHandler);
  router.put("/ai-delivery-projects/:id/deliverables/:deliverableId", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateAiDeliveryDeliverableHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/document", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), uploadAiDeliveryDeliverableDocumentHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/mark-ready", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), markAiDeliveryDeliverableReadyHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/request-revision", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), requestAiDeliveryDeliverableRevisionHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/accept", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), acceptAiDeliveryDeliverableHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveAiDeliveryDeliverableHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/restore", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), restoreAiDeliveryDeliverableHandler);
  router.get("/ai-delivery-projects/:id/deliverables/:deliverableId/download", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), downloadAiDeliveryDeliverableHandler);
  router.get("/ai-delivery-projects/:id/deliverables/:deliverableId/download-reference", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), getAiDeliveryDeliverableDownloadReferenceHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/prepare-wordpress-draft", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), prepareAiDeliveryDeliverableWordPressDraftHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/publish-wordpress", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), publishAiDeliveryDeliverableToWordPressHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/export-google-doc", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), exportAiDeliveryDeliverableToGoogleDocHandler);
  router.get("/ai-delivery-projects/:id/deliverables/:deliverableId/reviews", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listAiDeliveryDeliverableReviewsHandler);
  router.post("/ai-delivery-projects/:id/deliverables/:deliverableId/reviews", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createAiDeliveryDeliverableReviewHandler);
  router.put("/ai-delivery-projects/:id/deliverables/:deliverableId/reviews/:reviewId", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateAiDeliveryDeliverableReviewHandler);
  router.get("/ai-delivery-projects/:id/content-plan/client-review", requireAuth, requireTenant, getClientAiDeliveryContentPlanReviewHandler);
  router.post("/ai-delivery-projects/:id/content-plan/client-review/approve", requireAuth, requireTenant, approveClientAiDeliveryContentPlanReviewHandler);
  router.post("/ai-delivery-projects/:id/content-plan/client-review/request-revision", requireAuth, requireTenant, requestClientAiDeliveryContentPlanRevisionHandler);
  router.get("/ai-delivery-projects/:id/content-drafts/client-review", requireAuth, requireTenant, listClientAiDeliveryContentDraftReviewsHandler);
  router.post("/ai-delivery-projects/:id/content-drafts/:draftId/client-review/approve", requireAuth, requireTenant, approveClientAiDeliveryContentDraftReviewHandler);
  router.post("/ai-delivery-projects/:id/content-drafts/:draftId/client-review/request-revision", requireAuth, requireTenant, requestClientAiDeliveryContentDraftRevisionHandler);

  router.get("/ai-delivery/reports/monthly/:reportId/metrics", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), getAiDeliveryMonthlyReportMetricsHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/metrics/import", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), importAiDeliveryMonthlyReportMetricsHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/metrics/:snapshotId/approve", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), approveAiDeliveryMonthlyReportMetricsHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/metrics/:snapshotId/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveAiDeliveryMonthlyReportMetricsHandler);

  router.get("/tasks", requireAuth, requireTenant, listTasksHandler);
  router.post("/tasks", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createTaskHandler);
  router.get("/tasks/:id", requireAuth, requireTenant, getTaskHandler);
  router.put("/tasks/:id", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateTaskHandler);
  router.post("/tasks/:id/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveTaskHandler);
  router.post("/tasks/:id/restore", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), restoreTaskHandler);

  router.get("/invoices", requireAuth, requireTenant, tenantModuleGuard, listInvoicesHandler);
  router.post("/invoices", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createInvoiceHandler);
  router.get("/invoice-items", requireAuth, requireTenant, tenantModuleGuard, listInvoiceItemsHandler);
  router.post("/invoice-items", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createInvoiceItemHandler);
  router.put("/invoice-items/:id", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateInvoiceItemHandler);
  router.post("/invoice-items/:id/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveInvoiceItemHandler);
  router.post("/invoice-items/:id/restore", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), restoreInvoiceItemHandler);
  router.get("/invoices/:id", requireAuth, requireTenant, tenantModuleGuard, getInvoiceHandler);
  router.put("/invoices/:id", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateInvoiceHandler);
  router.get("/invoices/:id/document/download", requireAuth, requireTenant, tenantModuleGuard, downloadInvoiceDocumentHandler);
  router.post("/invoices/:id/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveInvoiceHandler);
  router.post("/invoices/:id/mark-sent", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), markInvoiceSentHandler);
  router.post("/invoices/:id/mark-paid", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), markInvoicePaidHandler);
  router.post("/invoices/:id/payment", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), registerInvoicePaymentHandler);
  router.post("/invoices/:id/cancel", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), cancelInvoiceHandler);
  router.post("/invoices/:id/mark-uncollectible", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), markInvoiceUncollectibleHandler);
  router.post("/invoices/:id/credit-notes", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createCreditNoteHandler);
  router.put("/credit-notes/:id", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateCreditNoteHandler);
  router.post("/credit-notes/:id/issue", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), issueCreditNoteHandler);
  router.post("/credit-notes/:id/void", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), voidCreditNoteHandler);
  router.get("/credit-notes/:id/document/download", requireAuth, requireTenant, tenantModuleGuard, downloadCreditNoteDocumentHandler);

  router.get("/recurring-invoices", requireAuth, requireTenant, tenantModuleGuard, listRecurringInvoicesHandler);
  router.post("/recurring-invoices", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createRecurringInvoiceHandler);
  router.get("/recurring-invoices/:id", requireAuth, requireTenant, tenantModuleGuard, getRecurringInvoiceHandler);
  router.put("/recurring-invoices/:id", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateRecurringInvoiceHandler);
  router.post("/recurring-invoices/:id/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveRecurringInvoiceHandler);
  router.post("/recurring-invoices/:id/generate-due", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), generateDueRecurringInvoiceHandler);

  router.get("/vendors", requireAuth, requireTenant, tenantModuleGuard, listVendorsHandler);
  router.post("/vendors", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createVendorHandler);
  router.put("/vendors/:id", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateVendorHandler);
  router.post("/vendors/:id/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveVendorHandler);
  router.post("/vendors/:id/restore", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), restoreVendorHandler);

  router.get("/bills", requireAuth, requireTenant, tenantModuleGuard, listBillsHandler);
  router.post("/bills", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createBillHandler);
  router.put("/bills/:id", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateBillHandler);
  router.post("/bills/:id/document", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), uploadBillDocumentHandler);
  router.get("/bills/:id/document/download", requireAuth, requireTenant, tenantModuleGuard, downloadBillDocumentHandler);
  router.post("/bills/:id/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveBillHandler);
  router.post("/bills/:id/restore", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), restoreBillHandler);

  // Monthly Report - admin-only computed summary (schema-free, read model)
  router.get("/ai-delivery/reports/monthly-summary", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), getAiDeliveryMonthlySummaryHandler);

  // Monthly Report - admin-only persisted model
  router.get("/ai-delivery/reports/monthly/:projectId", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), getAiDeliveryMonthlyReportHandler);
  router.post("/ai-delivery/reports/monthly/:projectId", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createAiDeliveryMonthlyReportHandler);
  router.put("/ai-delivery/reports/monthly/:reportId/update", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateAiDeliveryMonthlyReportHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/status", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateAiDeliveryMonthlyReportStatusHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveAiDeliveryMonthlyReportHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/restore", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), restoreAiDeliveryMonthlyReportHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/generate-pdf", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), generateAiDeliveryMonthlyReportPdfHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/document", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), uploadAiDeliveryMonthlyReportDocumentHandler);
  router.get("/ai-delivery/reports/monthly/:reportId/download", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), getAiDeliveryMonthlyReportDownloadReferenceHandler);

  // Monthly Report — Market Intelligence context (admin-only internal)
  router.get("/ai-delivery/reports/monthly/:reportId/mi-context", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), getAiDeliveryMonthlyReportMiContextHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/mi-context/apply", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), applyMiHandoffToMonthlyReportHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/mi-context/draft", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateMonthlyReportMiContextDraftHandler);
  router.post("/ai-delivery/reports/monthly/:reportId/mi-context/remove", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), removeMiHandoffFromMonthlyReportHandler);

  // Market Intelligence routes
  router.get("/market-intelligence-projects", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listMarketIntelligenceProjectsHandler);
  router.post("/market-intelligence-projects", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createMarketIntelligenceProjectHandler);
  router.put("/market-intelligence-projects/:id", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateMarketIntelligenceProjectHandler);
  router.post("/market-intelligence-projects/:id/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveMarketIntelligenceProjectHandler);

  router.get("/market-intelligence-projects/:projectId/sources", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listMarketIntelligenceSourcesHandler);
  router.post("/market-intelligence-projects/:projectId/sources", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createMarketIntelligenceSourceHandler);
  router.put("/market-intelligence-projects/:projectId/sources/:sourceId", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateMarketIntelligenceSourceHandler);
  router.post("/market-intelligence-projects/:projectId/sources/:sourceId/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveMarketIntelligenceSourceHandler);

  router.get("/market-intelligence-projects/:projectId/research-runs", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listMarketIntelligenceResearchRunsHandler);
  router.post("/market-intelligence-projects/:projectId/research-runs", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createMarketIntelligenceResearchRunHandler);
  router.post("/market-intelligence-projects/:projectId/research-runs/:runId/execute", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), executeMarketIntelligenceResearchRunHandler);

  router.get("/market-intelligence-projects/:projectId/insights", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listMarketIntelligenceInsightsHandler);
  router.post("/market-intelligence-projects/:projectId/insights", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), createMarketIntelligenceInsightHandler);
  router.put("/market-intelligence-projects/:projectId/insights/:insightId", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateMarketIntelligenceInsightHandler);
  router.post("/market-intelligence-projects/:projectId/insights/:insightId/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveMarketIntelligenceInsightHandler);

  // Handoff routes — admin-only internal bridge, not client-facing
  router.get("/market-intelligence-projects/:projectId/handoffs", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listMarketIntelligenceHandoffsHandler);
  router.post("/market-intelligence-projects/:projectId/handoffs/prepare", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), prepareMarketIntelligenceHandoffHandler);
  router.put("/market-intelligence-projects/:projectId/handoffs/:handoffId/status", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), updateMarketIntelligenceHandoffStatusHandler);
  router.post("/market-intelligence-projects/:projectId/handoffs/:handoffId/archive", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), archiveMarketIntelligenceHandoffHandler);

  // AI Delivery — Market Intelligence context linkage
  router.get("/ai-delivery/projects/:projectId/market-intelligence-context", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), listAiDeliveryMiContextHandler);
  router.post("/ai-delivery/projects/:projectId/market-intelligence-context/apply", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), applyMiHandoffToAiDeliveryHandler);
  router.post("/ai-delivery/projects/:projectId/market-intelligence-context/:handoffId/remove", requireAuth, requireTenant, tenantModuleGuard, requireRole("owner", "admin"), removeMiHandoffFromAiDeliveryHandler);

  return router;
}
