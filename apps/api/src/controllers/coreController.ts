import type { RequestHandler, Response } from "express";
import {
  aiDeliveryProjectInvalidFailure,
  aiDeliveryProjectNotFoundFailure,
  billInvalidFailure,
  billNotFoundFailure,
  clientInvalidFailure,
  clientNotFoundFailure,
  companyProfileInvalidFailure,
  clientReviewDeferredFailure,
  failure,
  forbiddenFailure,
  invoiceInvalidFailure,
  invoiceNotFoundFailure,
  projectInvalidFailure,
  projectNotFoundFailure,
  recurringInvoiceInvalidFailure,
  recurringInvoiceNotFoundFailure,
  success,
  taskInvalidFailure,
  taskNotFoundFailure,
  unauthorizedFailure
} from "../utils/responses";
import type { AuthSessionLocals } from "../auth/types";
import { listTenantAuditLogs } from "../security/audit-log.service";
import {
  listTenantEmailLogs,
  type EmailNotificationStatus,
  type EmailNotificationTemplateKey
} from "../services/email-notifications.service";
import { sendAiDeliveryDeliverableForClientReview } from "../core/client-portal-approval.runtime";
import { getAiProviderPlanningSnapshot } from "../services/ai-provider-planning.service";
import {
  getAiOrchestratorLiteRegistrySnapshot,
  planAiOrchestratorLiteStep
} from "../core/ai-orchestrator-lite.service";
import { getAiKillSwitchSnapshot } from "../core/ai-kill-switch.service";
import {
  getAiBudgetLedgerSummary,
  recordAiBudgetLedgerEntry,
  sumSpentUsdForPeriod
} from "../core/ai-budget-ledger.service";
import { planWorkflowStepWithOrchestrator } from "../core/ai-orchestrator-workflow-adapter.skeleton";
import {
  emitBudgetCapNotification,
  emitKillSwitchNotification,
  emitWorkflowBlockedNotification,
  listAiNotificationEvents
} from "../services/ai-notification-events.service";
import { buildPurivaIntegrationBoundaryIndex, AI_DELIVERY_DELIVERABLE_STATUSES as CANONICAL_AI_DELIVERY_DELIVERABLE_STATUSES, normalizeOperatingPackBindingKey } from "@dca-os-v1/shared";
import { resolveClientOperatingPack } from "../core/client-operating-pack.resolver";
import { getPurivaAiPolicyProfile } from "../core/puriva-ai-policy-profile";
import { getGoogleDriveExportPlanningSnapshot } from "../services/google-drive-export-planning.service";
import { getExternalIntegrationsReadinessSnapshot } from "../core/external-integrations-readiness.service";
import { getImageGenerationIntegrationReadiness } from "../config/image-generation.config";
import { buildImageGenerationFoundationSnapshot } from "../core/image-generation.execution";
import { buildAdminOperationsSummary } from "../core/admin-operations-summary.service";
import {
  archiveAiDeliveryArticleImage,
  isAiDeliveryGuardError,
  isFinanceIntegrityError,
  archiveAiDeliveryProject,
  archiveAiDeliveryContentDraft,
  archiveClient,
  archiveClientUserAccess,
  archiveBill,
  archiveVendor,
  archiveInvoice,
  archiveProject,
  archiveRecurringInvoice,
  archiveTask,
  cancelInvoice,
  archiveInvoiceItem,
  createBill,
  createAiDeliveryArticleImage,
  createAiDeliveryContentDraft,
  createAiDeliveryProject,
  createAiDeliveryResearchRequest,
  createAiDeliveryResearchSummary,
  createAiDeliveryResearchSource,
  executeAiDeliveryWorkflowRun,
  createAiDeliveryWorkflowRun,
  createClient,
  createCreditNote,
  createInvoice,
  createInvoiceItem,
  createProject,
  createRecurringInvoice,
  createTask,
  createVendor,
  generateDueRecurringInvoice,
  listBills,
  listClientUserAccess,
  getClient,
  getCompanyProfile,
  getBillDocumentDownload,
  getCreditNoteDocumentDownload,
  getAiDeliveryArticleImageDownload,
  getAiDeliveryArticleImageDownloadReference,
  getAiDeliveryDeliverableDownload,
  getAiDeliveryDeliverableDownloadReference,
  prepareAiDeliveryDeliverableWordPressDraft,
  publishAiDeliveryDeliverableToWordPress,
  exportAiDeliveryDeliverableToGoogleDoc,
  getAiDeliveryWordPressConfigForTenant,
  getInvoiceDocumentDownload,
  getInvoice,
  getProject,
  getRecurringInvoice,
  getTask,
  listAiDeliveryArticleImages,
  listAiDeliveryProjects,
  listAiDeliveryResearchRequests,
  listAiDeliveryResearchSummaries,
  listAiDeliveryResearchSources,
  listAiDeliveryWorkflowRuns,
  listInvoices,
  listInvoiceItems,
  issueCreditNote,
  listClients,
  listCreditNotes,
  updateCreditNote,
  listProjects,
  listRecurringInvoices,
  listTasks,
  listVendors,
  linkClientUserAccess,
  markInvoicePaid,
  markInvoiceSent,
  markInvoiceUncollectible,
  registerInvoicePayment,
  restoreInvoiceItem,
  restoreBill,
  restoreVendor,
  restoreClient,
  restoreProject,
  restoreTask,
  saveCompanyProfile,
  updateAiDeliveryArticleImage,
  markAiDeliveryArticleImagePreviewReady,
  requestAiDeliveryArticleImageChanges,
  approveAiDeliveryArticleImage,
  markAiDeliveryArticleImageFinalReady,
  uploadAiDeliveryArticleImageFinalAsset,
  uploadAiDeliveryDeliverableDocument,
  markAiDeliveryDeliverableReady,
  requestAiDeliveryDeliverableRevision,
  acceptAiDeliveryDeliverable,
  updateAiDeliveryProject,
  updateAiDeliveryResearchRequest,
  updateAiDeliveryResearchSummary,
  updateAiDeliveryResearchSource,
  updateAiDeliveryWorkflowRun,
  updateBill,
  updateClient,
  updateVendor,
  updateInvoiceItem,
  updateInvoice,
  voidCreditNote,
  updateProject,
  updateRecurringInvoice,
  updateTask,
  uploadBillDocument,
  requestAiDeliveryBriefClientInput,
  requestAiDeliveryBriefClientRevision,
  approveFinalAiDeliveryBrief,
  getAiDeliveryBriefDetail,
  saveAiDeliveryBrief,
  listAiDeliveryContentDrafts,
  requestAiDeliveryContentDraftClientReview,
  returnAiDeliveryContentDraftToDraft,
  adminApproveAiDeliveryContentDraft,
  updateAiDeliveryContentDraft,
  // Content plan runtime functions
  getAiDeliveryContentPlanDetail,
  createAiDeliveryContentPlan,
  updateAiDeliveryContentPlan,
  requestAiDeliveryContentPlanClientReview,
  approveAiDeliveryContentPlan,
  requestAiDeliveryContentPlanChanges,
  applyAiDeliveryResearchSummaryToBrief,
  listAiDeliveryDeliverables,
  createAiDeliveryDeliverable,
  updateAiDeliveryDeliverable,
  archiveAiDeliveryDeliverable,
  restoreAiDeliveryDeliverable,
  listAiDeliveryDeliverableReviews,
  createAiDeliveryDeliverableReview,
  updateAiDeliveryDeliverableReview,
  listMarketIntelligenceProjects,
  createMarketIntelligenceProject,
  updateMarketIntelligenceProject,
  archiveMarketIntelligenceProject,
  listMarketIntelligenceSources,
  createMarketIntelligenceSource,
  updateMarketIntelligenceSource,
  archiveMarketIntelligenceSource,
  listMarketIntelligenceResearchRuns,
  createMarketIntelligenceResearchRun,
  executeMarketIntelligenceResearchRun,
  listMarketIntelligenceInsights,
  createMarketIntelligenceInsight,
  updateMarketIntelligenceInsight,
  archiveMarketIntelligenceInsight,
  prepareMarketIntelligenceHandoff,
  listMarketIntelligenceHandoffs,
  updateMarketIntelligenceHandoffStatus,
  archiveMarketIntelligenceHandoff,
  listMarketIntelligenceFindings,
  createMarketIntelligenceFinding,
  updateMarketIntelligenceFinding,
  archiveMarketIntelligenceFinding,
  listMarketIntelligenceSummaries,
  generateMarketIntelligenceSummary,
  createMarketIntelligenceSummary,
  updateMarketIntelligenceSummary,
  finalizeMarketIntelligenceSummary,
  archiveMarketIntelligenceSummary,
  listFinalizedMarketIntelligenceSummaries,
  listAiDeliveryMiContext,
  applyMiHandoffToAiDelivery,
  removeMiHandoffFromAiDelivery,
  listAiDeliveryMiSummaryContext,
  getAiDeliveryRevenueChainReadiness,
  applyFinalizedMiSummaryToAiDelivery,
  removeMiSummaryFromAiDelivery,
  applyFinalizedMiSummaryToAiDeliveryBrief,
  applyFinalizedMiSummaryToSeoContext,
  applyFinalizedMiSummaryToMonthlyReport,
  applyMarketIntelligenceSummaryTarget,
  getAiDeliveryMonthlySummary,
  getAiDeliveryMonthlyReport,
  getAiDeliveryMonthlyReportMetrics,
  createAiDeliveryMonthlyReport,
  generateAiDeliveryMonthlyReportPdfForReport,
  generateAiDeliveryMonthlyReportRecommendations,
  importAiDeliveryMonthlyReportMetrics,
  approveAiDeliveryMonthlyReportMetrics,
  archiveAiDeliveryMonthlyReportMetrics,
  updateAiDeliveryMonthlyReport,
  updateAiDeliveryMonthlyReportStatus,
  archiveAiDeliveryMonthlyReport,
  restoreAiDeliveryMonthlyReport,
  uploadAiDeliveryMonthlyReportDocument,
  getAiDeliveryMonthlyReportDownloadReference,
  getAiDeliveryMonthlyReportMiContext,
  applyMiHandoffToMonthlyReport,
  updateMonthlyReportMiContextDraft,
  removeMiHandoffFromMonthlyReport,
  generateAiDeliveryContentPlanPdfForProject,
  getAiDeliveryContentPlanDownloadReference
} from "../core/core.runtime";
import {
  createAiKnowledgeItem,
  listAiKnowledgeItems,
  previewAiContext,
  promoteAiDeliverySourceToKnowledgeItem,
  updateAiKnowledgeItem
} from "../core/ai-knowledge.runtime";
import { getAiOperationsRun, listAiOperationsRuns } from "../core/ai-operations.runtime";
import type { ListAiOperationsRunsFilters } from "@dca-os-v1/shared";
import type {
  AiContextPreviewInputRequest,
  AiKnowledgeItemInputRequest,
  AiKnowledgePromoteInputRequest,
  AiKnowledgeType
} from "@dca-os-v1/shared";
import type {
  AiDeliveryArticleImageUploadRequest,
  AiDeliveryArticleImageInputRequest,
  AiDeliveryContentDraftInputRequest,
  AiDeliveryProjectInputRequest,
  AiDeliveryDeliverableUploadRequest,
  AiDeliveryResearchRequestInputRequest,
  AiDeliveryResearchSummaryInputRequest,
  AiDeliveryResearchSourceInputRequest,
  BillDocumentUploadRequest,
  BillInputRequest,
  ClientInputRequest,
  CompanyProfileUpdateRequest,
  CreditNoteInputRequest,
  CreditNoteLineItemInputRequest,
  InvoiceInputRequest,
  InvoiceLineItemInputRequest,
  ProjectInputRequest,
  RecurringInvoiceInputRequest,
  RecurringInvoiceLineItemInputRequest,
  TaskInputRequest,
  VendorInputRequest,
  AiDeliveryDeliverableInputRequest,
  AiDeliveryDeliverableReviewInputRequest,
  AiDeliveryDeliverableResponse,
  AiDeliveryDeliverablesResponse,
  MarketIntelligenceProjectInputRequest,
  MarketIntelligenceSourceInputRequest,
  MarketIntelligenceResearchRunInputRequest,
  MarketIntelligenceInsightInputRequest,
  MarketIntelligenceFindingInputRequest,
  MarketIntelligenceSummaryInputRequest,
  MarketIntelligenceSummaryApplyTargetRequest,
  AiDeliveryMonthlyReportInputRequest,
  AiDeliveryMonthlyReportUploadRequest,
  AiDeliveryMonthlyReportStatusRequest,
  AiDeliveryMonthlyMetricSnapshotInputRequest,
  AiDeliveryMonthlyReportMiApplyRequest,
  AiDeliveryMonthlyReportMiDraftRequest
} from "../core/core.types";

const TEXT_FIELD_MAX_LENGTH = 4000;
const SHORT_TEXT_FIELD_MAX_LENGTH = 500;
const LOGO_URL_MAX_LENGTH = 2048;
const NAME_MAX_LENGTH = 255;
const CLIENT_COUNTRIES = new Set(["Indonesia", "Poland", "United States", "United Kingdom", "Singapore", "Australia"]);
const PROJECT_STATUSES = new Set(["Active", "Paused", "Completed", "Archived"]);
const AI_DELIVERY_WORKFLOW_RUN_STATUSES = new Set(["DRAFT", "READY", "IN_PROGRESS", "REVIEW", "COMPLETED", "FAILED", "ARCHIVED"]);
const AI_DELIVERY_CONTENT_PLAN_STATUSES = new Set(["DRAFT", "CLIENT_REVIEW_REQUESTED", "CLIENT_CHANGES_REQUESTED", "CLIENT_APPROVED"]);
const AI_DELIVERY_CONTENT_PLAN_ITEM_APPROVAL_STATUSES = new Set(["DRAFT", "CLIENT_CHANGES_REQUESTED", "CLIENT_APPROVED"]);
const AI_DELIVERY_RESEARCH_REQUEST_STATUSES = new Set(["DRAFT", "READY", "IN_REVIEW", "COMPLETED", "ARCHIVED"]);
const AI_DELIVERY_RESEARCH_SUMMARY_STATUSES = new Set(["DRAFT", "IN_REVIEW", "FINALIZED", "ARCHIVED"]);
const AI_DELIVERY_RESEARCH_SOURCE_STATUSES = new Set(["PROPOSED", "APPROVED", "REJECTED", "ARCHIVED"]);
const AI_DELIVERY_RESEARCH_SOURCE_TYPES = new Set(["WEBSITE", "DOCUMENT", "OTHER"]);
const AI_DELIVERY_CONTENT_DRAFT_STATUSES = new Set(["DRAFT", "READY_FOR_REVIEW", "CHANGES_REQUESTED", "ARCHIVED"]);
const AI_DELIVERY_ARTICLE_IMAGE_STATUSES = new Set(["DRAFT", "READY_FOR_GENERATION", "PREVIEW_READY", "APPROVED", "FINAL_READY", "CHANGES_REQUESTED", "ARCHIVED"]);
const AI_DELIVERY_DELIVERABLE_TYPES = new Set(["CONTENT_PACKAGE", "ARTICLE_DRAFT", "ARTICLE_IMAGE", "CLIENT_HANDOFF", "OTHER"]);
// Canonical status set (includes client-review states) so a valid in-review deliverable
// can be read/saved without a 400 caused solely by enum drift between controller and runtime.
const AI_DELIVERY_DELIVERABLE_STATUSES = new Set<string>(CANONICAL_AI_DELIVERY_DELIVERABLE_STATUSES);
const AI_DELIVERY_DELIVERABLE_REVIEW_STATUSES = new Set(["NOT_STARTED", "ADMIN_REVIEW", "CHANGES_REQUESTED", "APPROVED", "ARCHIVED"]);
const ACTIVITY_AUDIT_LOG_LIMIT_DEFAULT = 50;
const ACTIVITY_AUDIT_LOG_LIMIT_MAX = 100;
const EMAIL_NOTIFICATION_LOG_LIMIT_DEFAULT = 50;
const EMAIL_NOTIFICATION_LOG_LIMIT_MAX = 100;
const EMAIL_NOTIFICATION_TEMPLATE_KEYS = new Set<EmailNotificationTemplateKey>([
  "CLIENT_INVITE",
  "PASSWORD_RESET",
  "AI_DELIVERY_BRIEF_REQUEST",
  "AI_DELIVERY_REVIEW_REQUEST",
  "AI_DELIVERY_APPROVED",
  "INVOICE_ISSUED"
]);
const EMAIL_NOTIFICATION_STATUSES = new Set<EmailNotificationStatus>(["QUEUED", "SENT", "FAILED", "SKIPPED"]);

function getAuthSession(resLocals: unknown) {
  return (resLocals as AuthSessionLocals | undefined)?.authSession;
}

function getOptionalQueryValue(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseActivityAuditLogDate(value: unknown): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = getOptionalQueryValue(value);
  if (!trimmed) {
    return undefined;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseActivityAuditLogLimit(value: unknown): number | null {
  if (value === undefined) {
    return ACTIVITY_AUDIT_LOG_LIMIT_DEFAULT;
  }

  const trimmed = getOptionalQueryValue(value);
  if (!trimmed) {
    return ACTIVITY_AUDIT_LOG_LIMIT_DEFAULT;
  }

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return Math.min(parsed, ACTIVITY_AUDIT_LOG_LIMIT_MAX);
}

function parseEmailNotificationLogLimit(value: unknown): number | null {
  if (value === undefined) {
    return EMAIL_NOTIFICATION_LOG_LIMIT_DEFAULT;
  }

  const trimmed = getOptionalQueryValue(value);
  if (!trimmed) {
    return EMAIL_NOTIFICATION_LOG_LIMIT_DEFAULT;
  }

  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return Math.min(parsed, EMAIL_NOTIFICATION_LOG_LIMIT_MAX);
}

function parseEmailNotificationTemplateKey(value: unknown): EmailNotificationTemplateKey | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = getOptionalQueryValue(value);
  if (!trimmed) {
    return undefined;
  }

  return EMAIL_NOTIFICATION_TEMPLATE_KEYS.has(trimmed as EmailNotificationTemplateKey)
    ? (trimmed as EmailNotificationTemplateKey)
    : null;
}

function parseEmailNotificationStatus(value: unknown): EmailNotificationStatus | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = getOptionalQueryValue(value);
  if (!trimmed) {
    return undefined;
  }

  return EMAIL_NOTIFICATION_STATUSES.has(trimmed as EmailNotificationStatus)
    ? (trimmed as EmailNotificationStatus)
    : null;
}

function handleAiDeliveryGuardError(res: Response, error: unknown): boolean {
  if (!isAiDeliveryGuardError(error)) {
    return false;
  }

  res.status(error.status).json(failure(error.code, error.message));
  return true;
}

function handleFinanceIntegrityError(res: Response, error: unknown): boolean {
  if (!isFinanceIntegrityError(error)) {
    return false;
  }

  res.status(error.status).json(failure(error.code, error.message));
  return true;
}

function getRequiredString(value: unknown, maxLength = NAME_MAX_LENGTH): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return null;
  }

  return trimmed;
}

function getOptionalString(value: unknown, maxLength = TEXT_FIELD_MAX_LENGTH): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.length > maxLength ? null : trimmed;
}

function getOptionalUrl(value: unknown): string | null | undefined {
  const maybeString = getOptionalString(value, LOGO_URL_MAX_LENGTH);
  if (maybeString === undefined || maybeString === null) {
    return maybeString;
  }

  try {
    const parsed = new URL(maybeString);
    return parsed.toString();
  } catch {
    return null;
  }
}

function getOptionalHttpUrl(value: unknown): string | null | undefined {
  const maybeString = getOptionalString(value, LOGO_URL_MAX_LENGTH);
  if (maybeString === undefined || maybeString === null) {
    return maybeString;
  }

  try {
    const parsed = new URL(maybeString);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function parseDateInput(value: unknown): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function getCompanyProfileInput(body: unknown): CompanyProfileUpdateRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const name = getRequiredString(value.name, SHORT_TEXT_FIELD_MAX_LENGTH);
  const currency = getCurrency(value.currency);
  const invoiceTemplateKey = getOptionalString(value.invoiceTemplateKey, SHORT_TEXT_FIELD_MAX_LENGTH);

  if (!name || !currency) {
    return null;
  }

  return {
    name,
    legalName: getOptionalString(value.legalName, SHORT_TEXT_FIELD_MAX_LENGTH),
    email: getOptionalString(value.email, SHORT_TEXT_FIELD_MAX_LENGTH),
    phone: getOptionalString(value.phone, SHORT_TEXT_FIELD_MAX_LENGTH),
    website: getOptionalString(value.website, LOGO_URL_MAX_LENGTH),
    taxId: getOptionalString(value.taxId, SHORT_TEXT_FIELD_MAX_LENGTH),
    country: getOptionalString(value.country, SHORT_TEXT_FIELD_MAX_LENGTH),
    registrationNumber: getOptionalString(value.registrationNumber, SHORT_TEXT_FIELD_MAX_LENGTH),
    billingAddress: getOptionalString(value.billingAddress, TEXT_FIELD_MAX_LENGTH),
    paymentInstructions: getOptionalString(value.paymentInstructions, TEXT_FIELD_MAX_LENGTH),
    logoUrl: getOptionalUrl(value.logoUrl),
    currency,
    invoiceTemplateKey: invoiceTemplateKey ?? undefined,
    invoicePrefix: getOptionalString(value.invoicePrefix, SHORT_TEXT_FIELD_MAX_LENGTH),
    creditNotePrefix: getOptionalString(value.creditNotePrefix, SHORT_TEXT_FIELD_MAX_LENGTH)
  };
}

function getClientInput(body: unknown): ClientInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const name = getRequiredString(value.name, SHORT_TEXT_FIELD_MAX_LENGTH);

  if (!name) {
    return null;
  }

  const country = getOptionalString(value.country, SHORT_TEXT_FIELD_MAX_LENGTH);
  if (country !== undefined && country !== null && !CLIENT_COUNTRIES.has(country)) {
    return null;
  }

  let operatingPackKey: string | null | undefined = undefined;
  if (Object.prototype.hasOwnProperty.call(value, "operatingPackKey")) {
    if (value.operatingPackKey === null || value.operatingPackKey === "") {
      operatingPackKey = null;
    } else if (typeof value.operatingPackKey === "string") {
      const normalized = normalizeOperatingPackBindingKey(value.operatingPackKey);
      if (!normalized) {
        return null;
      }
      operatingPackKey = normalized;
    } else {
      return null;
    }
  }

  return {
    name,
    email: getOptionalString(value.email, SHORT_TEXT_FIELD_MAX_LENGTH),
    website: getOptionalString(value.website, LOGO_URL_MAX_LENGTH),
    contactPerson: getOptionalString(value.contactPerson, SHORT_TEXT_FIELD_MAX_LENGTH),
    billingAddress: getOptionalString(value.billingAddress, TEXT_FIELD_MAX_LENGTH),
    taxId: getOptionalString(value.taxId, SHORT_TEXT_FIELD_MAX_LENGTH),
    country,
    clientKind: value.clientKind === "OWN_DOMAIN" ? "OWN_DOMAIN" : value.clientKind === "AGENCY_CLIENT" ? "AGENCY_CLIENT" : undefined,
    legalEntityName: getOptionalString(value.legalEntityName, SHORT_TEXT_FIELD_MAX_LENGTH),
    accountGroupName: getOptionalString(value.accountGroupName, SHORT_TEXT_FIELD_MAX_LENGTH),
    migrationStatus:
      value.migrationStatus === "PLANNED_LICENSEE_TENANT" || value.migrationStatus === "MIGRATED" || value.migrationStatus === "ACTIVE"
        ? value.migrationStatus
        : undefined,
    operatingPackKey
  };
}

function getProjectInput(body: unknown): ProjectInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const name = getRequiredString(value.name, SHORT_TEXT_FIELD_MAX_LENGTH);

  if (!name) {
    return null;
  }

  const clientId = getOptionalString(value.clientId, SHORT_TEXT_FIELD_MAX_LENGTH);

  const status =
    value.status === undefined
      ? "Active"
      : typeof value.status === "string"
        ? value.status.trim()
        : null;
  if (!status || !PROJECT_STATUSES.has(status)) {
    return null;
  }

  const startDate = parseDateInput(value.startDate);
  const dueDate = parseDateInput(value.dueDate);
  const hasStartDate = value.startDate !== undefined && value.startDate !== null && value.startDate !== "";
  const hasDueDate = value.dueDate !== undefined && value.dueDate !== null && value.dueDate !== "";

  if ((hasStartDate && startDate === undefined) || (hasDueDate && dueDate === undefined)) {
    return null;
  }

  return {
    clientId: clientId ?? undefined,
    name,
    description: getOptionalString(value.description, TEXT_FIELD_MAX_LENGTH),
    startDate: startDate?.toISOString() ?? null,
    dueDate: dueDate?.toISOString() ?? null,
    status
  };
}

function getAiDeliveryProjectInput(body: unknown): AiDeliveryProjectInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const clientId = getRequiredString(value.clientId, SHORT_TEXT_FIELD_MAX_LENGTH);
  const projectId = getOptionalString(value.projectId, SHORT_TEXT_FIELD_MAX_LENGTH);
  const name = getRequiredString(value.name, SHORT_TEXT_FIELD_MAX_LENGTH);
  const targetMonth = getRequiredString(value.targetMonth, SHORT_TEXT_FIELD_MAX_LENGTH);

  if (!clientId || !name || !targetMonth || !/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {
    return null;
  }

  return {
    clientId,
    projectId: projectId ?? null,
    name,
    targetMonth,
    plannedContentScopeNotes: getOptionalString(value.plannedContentScopeNotes, TEXT_FIELD_MAX_LENGTH)
  };
}

function getAiDeliveryContentDraftInput(body: unknown): AiDeliveryContentDraftInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const title = getRequiredString(value.title, SHORT_TEXT_FIELD_MAX_LENGTH);
  const status = typeof value.status === "string" ? value.status.trim().toUpperCase() : "DRAFT";
  const draftBody = typeof value.draftBody === "string" ? value.draftBody : null;

  if (!title || draftBody === null || !AI_DELIVERY_CONTENT_DRAFT_STATUSES.has(status)) {
    return null;
  }

  return {
    contentPlanItemId: getOptionalString(value.contentPlanItemId, SHORT_TEXT_FIELD_MAX_LENGTH) ?? null,
    title,
    slug: getOptionalString(value.slug, SHORT_TEXT_FIELD_MAX_LENGTH),
    draftBody,
    status,
    notes: getOptionalString(value.notes, TEXT_FIELD_MAX_LENGTH)
  };
}

function getAiDeliveryArticleImageInput(body: unknown): AiDeliveryArticleImageInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const contentDraftId = getRequiredString(value.contentDraftId, SHORT_TEXT_FIELD_MAX_LENGTH);
  const title = getRequiredString(value.title, SHORT_TEXT_FIELD_MAX_LENGTH);
  const prompt = typeof value.prompt === "string" ? value.prompt.trim() : "";
  const status = typeof value.status === "string" ? value.status.trim().toUpperCase() : "DRAFT";

  if (!contentDraftId || !title || !prompt || prompt.length > TEXT_FIELD_MAX_LENGTH || !AI_DELIVERY_ARTICLE_IMAGE_STATUSES.has(status)) {
    return null;
  }

  return {
    contentDraftId,
    title,
    prompt,
    styleNotes: getOptionalString(value.styleNotes, TEXT_FIELD_MAX_LENGTH),
    status,
    previewImageUrl: getOptionalUrl(value.previewImageUrl),
    finalImageUrl: getOptionalUrl(value.finalImageUrl),
    storageKey: getOptionalString(value.storageKey, LOGO_URL_MAX_LENGTH),
    notes: getOptionalString(value.notes, TEXT_FIELD_MAX_LENGTH)
  };
}

function getAiDeliveryWorkflowRunInput(body: unknown) {
  const value = (body ?? {}) as Record<string, unknown>;
  const status = value.status === undefined ? undefined : typeof value.status === "string" ? value.status.trim().toUpperCase() : null;

  if (status !== undefined && (!status || !AI_DELIVERY_WORKFLOW_RUN_STATUSES.has(status))) {
    return null;
  }

  return {
    status,
    adminNotes: getOptionalString(value.adminNotes, TEXT_FIELD_MAX_LENGTH),
    resultPlaceholder: getOptionalString(value.resultPlaceholder, TEXT_FIELD_MAX_LENGTH)
  };
}

function getAiDeliveryWorkflowRunExecuteInput(body: unknown) {
  const value = (body ?? {}) as Record<string, unknown>;
  return {
    contentPlanItemId: getOptionalString(value.contentPlanItemId, SHORT_TEXT_FIELD_MAX_LENGTH) ?? null
  };
}

function getAiDeliveryResearchRequestInput(body: unknown): AiDeliveryResearchRequestInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const status = value.status === undefined ? undefined : typeof value.status === "string" ? value.status.trim().toUpperCase() : null;
  if (status !== undefined && (!status || !AI_DELIVERY_RESEARCH_REQUEST_STATUSES.has(status))) {
    return null;
  }

  const title = value.title === undefined ? undefined : getRequiredString(value.title, SHORT_TEXT_FIELD_MAX_LENGTH);
  if (value.title !== undefined && !title) {
    return null;
  }

  return {
    workflowRunId: getOptionalString(value.workflowRunId, SHORT_TEXT_FIELD_MAX_LENGTH),
    title: title ?? undefined,
    description: getOptionalString(value.description, TEXT_FIELD_MAX_LENGTH),
    requestType: getOptionalString(value.requestType, SHORT_TEXT_FIELD_MAX_LENGTH),
    status
  };
}

function getAiDeliveryResearchSummaryInput(body: unknown): AiDeliveryResearchSummaryInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const status = value.status === undefined ? undefined : typeof value.status === "string" ? value.status.trim().toUpperCase() : null;
  if (status !== undefined && (!status || !AI_DELIVERY_RESEARCH_SUMMARY_STATUSES.has(status))) {
    return null;
  }

  const title = value.title === undefined ? undefined : getRequiredString(value.title, SHORT_TEXT_FIELD_MAX_LENGTH);
  if (value.title !== undefined && !title) {
    return null;
  }

  const summaryText = value.summaryText === undefined ? undefined : getRequiredString(value.summaryText, TEXT_FIELD_MAX_LENGTH);
  if (value.summaryText !== undefined && !summaryText) {
    return null;
  }

  return {
    workflowRunId: getOptionalString(value.workflowRunId, SHORT_TEXT_FIELD_MAX_LENGTH),
    title: title ?? undefined,
    status,
    summaryText: summaryText ?? undefined,
    keyFindings: getOptionalString(value.keyFindings, TEXT_FIELD_MAX_LENGTH),
    audienceInsights: getOptionalString(value.audienceInsights, TEXT_FIELD_MAX_LENGTH),
    competitorInsights: getOptionalString(value.competitorInsights, TEXT_FIELD_MAX_LENGTH),
    keywordOpportunities: getOptionalString(value.keywordOpportunities, TEXT_FIELD_MAX_LENGTH),
    contentRecommendations: getOptionalString(value.contentRecommendations, TEXT_FIELD_MAX_LENGTH),
    briefRevisionNotes: getOptionalString(value.briefRevisionNotes, TEXT_FIELD_MAX_LENGTH),
    sourceNotes: getOptionalString(value.sourceNotes, TEXT_FIELD_MAX_LENGTH)
  };
}

function getAiDeliveryResearchSourceInput(body: unknown): AiDeliveryResearchSourceInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const status = value.status === undefined ? undefined : typeof value.status === "string" ? value.status.trim().toUpperCase() : null;
  if (status !== undefined && (!status || !AI_DELIVERY_RESEARCH_SOURCE_STATUSES.has(status))) {
    return null;
  }

  const sourceType = value.sourceType === undefined ? undefined : typeof value.sourceType === "string" ? value.sourceType.trim().toUpperCase() : null;
  if (sourceType !== undefined && (!sourceType || !AI_DELIVERY_RESEARCH_SOURCE_TYPES.has(sourceType))) {
    return null;
  }

  const sourceUrl = value.sourceUrl === undefined ? undefined : getOptionalHttpUrl(value.sourceUrl);
  if (value.sourceUrl !== undefined && !sourceUrl) {
    return null;
  }

  return {
    researchRequestId: getOptionalString(value.researchRequestId, SHORT_TEXT_FIELD_MAX_LENGTH),
    workflowRunId: getOptionalString(value.workflowRunId, SHORT_TEXT_FIELD_MAX_LENGTH),
    sourceUrl: sourceUrl ?? undefined,
    sourceTitle: getOptionalString(value.sourceTitle, SHORT_TEXT_FIELD_MAX_LENGTH),
    sourceType,
    status,
    reviewNotes: getOptionalString(value.reviewNotes, TEXT_FIELD_MAX_LENGTH)
  };
}

const TASK_PRIORITIES = new Set(["LOW", "NORMAL", "HIGH"]);
const TASK_STATUSES = new Set(["TODO", "IN_PROGRESS", "DONE"]);
const TASK_RECURRING_TYPES = new Set(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
const INVOICE_STATUSES = new Set(["DRAFT", "ISSUED", "PAID", "VOIDED", "UNCOLLECTIBLE"]);
const RECURRING_INVOICE_INTERVALS = new Set(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
const BILL_PAYMENT_FORMS = new Set(["CASH", "REVOLUT_BANK", "WISE_BANK", "REVOLUT_CARD", "WISE_CARD", "OTHER"]);
const FILE_NAME_MAX_LENGTH = 255;
const BASE64_UPLOAD_MAX_LENGTH = 7 * 1024 * 1024;
const PAYMENT_METHODS = new Set(["CASH", "REVOLUT_BANK", "WISE_BANK", "REVOLUT_CARD", "WISE_CARD", "CARD_PROCESSOR", "OTHER"]);

function getOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function getNonNegativeInteger(value: unknown, defaultValue = 0): number | null {
  if (value === undefined) {
    return defaultValue;
  }
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : null;
}

function getPositiveInteger(value: unknown, defaultValue = 1): number | null {
  if (value === undefined) {
    return defaultValue;
  }
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : null;
}

function getCurrency(value: unknown): string | null {
  if (value === undefined) {
    return "USD";
  }
  if (typeof value !== "string") {
    return null;
  }
  const currency = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : null;
}

const INVALID_LINE_ITEMS = Symbol("INVALID_LINE_ITEMS");

type ParsedInvoiceLineItems =
  | InvoiceLineItemInputRequest[]
  | typeof INVALID_LINE_ITEMS
  | null;

function parseInvoiceLineItems(value: unknown): ParsedInvoiceLineItems {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const lineItems: InvoiceLineItemInputRequest[] = [];
  for (const [index, item] of value.entries()) {
    const record = (item ?? {}) as Record<string, unknown>;
    const description = getRequiredString(record.description, SHORT_TEXT_FIELD_MAX_LENGTH);
    const quantity = getPositiveInteger(record.quantity);
    const unitPriceCents = getNonNegativeInteger(record.unitPriceCents);
    const totalCents = getNonNegativeInteger(record.totalCents);
    const sortOrder = getNonNegativeInteger(record.sortOrder, index);
    if (!description || quantity === null || unitPriceCents === null || totalCents === null || sortOrder === null) {
      return INVALID_LINE_ITEMS;
    }

    lineItems.push({ description, quantity, unitPriceCents, totalCents, sortOrder });
  }

  return lineItems;
}

function getInvoiceLineItems(value: unknown): InvoiceLineItemInputRequest[] | null {
  const parsed = parseInvoiceLineItems(value);
  return parsed === INVALID_LINE_ITEMS ? null : parsed;
}

function getRecurringInvoiceLineItems(value: unknown): RecurringInvoiceLineItemInputRequest[] | null {
  const lineItems = getInvoiceLineItems(value);
  return lineItems;
}

function getCreditNoteLineItems(value: unknown): CreditNoteLineItemInputRequest[] | null {
  const lineItems = getInvoiceLineItems(value);
  return lineItems;
}

function hasInvalidLineItems(value: unknown): boolean {
  return parseInvoiceLineItems(value) === INVALID_LINE_ITEMS;
}

function invoiceLineItemsInvalidFailure() {
  return failure(
    "INVOICE_LINE_ITEMS_INVALID",
    "Invoice line items must all include description, quantity, unitPriceCents, totalCents, and sortOrder."
  );
}

function recurringInvoiceLineItemsInvalidFailure() {
  return failure(
    "RECURRING_INVOICE_LINE_ITEMS_INVALID",
    "Recurring invoice line items must all include description, quantity, unitPriceCents, totalCents, and sortOrder."
  );
}

function creditNoteLineItemsInvalidFailure() {
  return failure(
    "CREDIT_NOTE_LINE_ITEMS_INVALID",
    "Credit note line items must all include description, quantity, unitPriceCents, totalCents, and sortOrder."
  );
}

function getInvoiceInput(body: unknown): InvoiceInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const clientId = getRequiredString(value.clientId, SHORT_TEXT_FIELD_MAX_LENGTH);
  const invoiceNumber = getRequiredString(value.invoiceNumber, SHORT_TEXT_FIELD_MAX_LENGTH);
  const projectId = getOptionalString(value.projectId, SHORT_TEXT_FIELD_MAX_LENGTH);
  const status = typeof value.status === "string" ? value.status.trim().toUpperCase() : "DRAFT";
  const issueDate = parseDateInput(value.issueDate);
  const dueDate = parseDateInput(value.dueDate);
  const paidAt = parseDateInput(value.paidAt);
  const currency = getCurrency(value.currency);
  const subtotalCents = getNonNegativeInteger(value.subtotalCents);
  const taxCents = getNonNegativeInteger(value.taxCents);
  const discountCents = getNonNegativeInteger(value.discountCents);
  const totalCents = getNonNegativeInteger(value.totalCents);
  const amountPaidCents = getNonNegativeInteger(value.amountPaidCents);
  const lineItems = getInvoiceLineItems(value.lineItems);

  if (!clientId || !invoiceNumber || !INVOICE_STATUSES.has(status) || issueDate === undefined || dueDate === undefined || paidAt === undefined || !currency || subtotalCents === null || taxCents === null || discountCents === null || totalCents === null || amountPaidCents === null || !lineItems || lineItems.length === 0) {
    return null;
  }

  return {
    clientId,
    projectId: projectId ?? null,
    invoiceNumber,
    status,
    issueDate: issueDate?.toISOString() ?? null,
    dueDate: dueDate?.toISOString() ?? null,
    paidAt: paidAt?.toISOString() ?? null,
    currency,
    subtotalCents,
    taxCents,
    discountCents,
    totalCents,
    amountPaidCents,
    title: getOptionalString(value.title, SHORT_TEXT_FIELD_MAX_LENGTH),
    notes: getOptionalString(value.notes, TEXT_FIELD_MAX_LENGTH),
    paymentInstructions: getOptionalString(value.paymentInstructions, TEXT_FIELD_MAX_LENGTH),
    documentUrl: getOptionalUrl(value.documentUrl),
    documentStorageKey: getOptionalString(value.documentStorageKey, LOGO_URL_MAX_LENGTH),
    lineItems
  };
}

function getRecurringInvoiceInput(body: unknown): RecurringInvoiceInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const clientId = getRequiredString(value.clientId, SHORT_TEXT_FIELD_MAX_LENGTH);
  const projectId = getOptionalString(value.projectId, SHORT_TEXT_FIELD_MAX_LENGTH);
  const interval = typeof value.interval === "string" ? value.interval.trim().toUpperCase() : "";
  const startDate = parseDateInput(value.startDate);
  const endDate = parseDateInput(value.endDate);
  const nextRunDate = parseDateInput(value.nextRunDate);
  const currency = getCurrency(value.currency);
  const subtotalCents = getNonNegativeInteger(value.subtotalCents);
  const taxCents = getNonNegativeInteger(value.taxCents);
  const discountCents = getNonNegativeInteger(value.discountCents);
  const totalCents = getNonNegativeInteger(value.totalCents);
  const lineItems = getRecurringInvoiceLineItems(value.lineItems);

  if (!clientId || !RECURRING_INVOICE_INTERVALS.has(interval) || !startDate || endDate === undefined || nextRunDate === undefined || !currency || subtotalCents === null || taxCents === null || discountCents === null || totalCents === null || !lineItems || lineItems.length === 0) {
    return null;
  }

  if (endDate && endDate < startDate) {
    return null;
  }

  return {
    clientId,
    projectId: projectId ?? null,
    title: getOptionalString(value.title, SHORT_TEXT_FIELD_MAX_LENGTH),
    interval,
    startDate: startDate.toISOString(),
    endDate: endDate?.toISOString() ?? null,
    nextRunDate: nextRunDate?.toISOString() ?? startDate.toISOString(),
    currency,
    subtotalCents,
    taxCents,
    discountCents,
    totalCents,
    notes: getOptionalString(value.notes, TEXT_FIELD_MAX_LENGTH),
    paymentInstructions: getOptionalString(value.paymentInstructions, TEXT_FIELD_MAX_LENGTH),
    documentFolderHint: getOptionalString(value.documentFolderHint, LOGO_URL_MAX_LENGTH),
    isActive: getOptionalBoolean(value.isActive),
    lineItems
  };
}

function getVendorInput(body: unknown): VendorInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const name = getRequiredString(value.name, SHORT_TEXT_FIELD_MAX_LENGTH);

  return name ? { name } : null;
}

function getBillInput(body: unknown): BillInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const vendorId = getRequiredString(value.vendorId, SHORT_TEXT_FIELD_MAX_LENGTH);
  const amountCents = getPositiveInteger(value.amountCents, 0);
  const paymentForm = typeof value.paymentForm === "string" ? value.paymentForm.trim().toUpperCase() : "";
  const paymentDate = parseDateInput(value.paymentDate);
  const billDate = parseDateInput(value.billDate);
  const dueDate = parseDateInput(value.dueDate);

  if (!vendorId || amountCents === null || amountCents <= 0 || !BILL_PAYMENT_FORMS.has(paymentForm) || !paymentDate || billDate === undefined || dueDate === undefined) {
    return null;
  }

  return {
    vendorId,
    amountCents,
    paymentForm,
    paymentDate: paymentDate.toISOString(),
    billDate: billDate?.toISOString() ?? null,
    dueDate: dueDate?.toISOString() ?? null,
    referenceNumber: getOptionalString(value.referenceNumber, SHORT_TEXT_FIELD_MAX_LENGTH),
    category: getOptionalString(value.category, SHORT_TEXT_FIELD_MAX_LENGTH),
    notes: getOptionalString(value.notes, TEXT_FIELD_MAX_LENGTH),
    documentUrl: getOptionalUrl(value.documentUrl),
    documentStorageKey: getOptionalString(value.documentStorageKey, LOGO_URL_MAX_LENGTH)
  };
}

function getBillDocumentUploadInput(body: unknown): BillDocumentUploadRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const fileName = getRequiredString(value.fileName, FILE_NAME_MAX_LENGTH);
  const mimeType = getRequiredString(value.mimeType, SHORT_TEXT_FIELD_MAX_LENGTH);
  const contentBase64 = getRequiredString(value.contentBase64, BASE64_UPLOAD_MAX_LENGTH);

  if (!fileName || !mimeType || !contentBase64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(contentBase64)) {
    return null;
  }

  return {
    contentBase64,
    fileName,
    mimeType
  };
}

function getAiDeliveryDeliverableUploadInput(body: unknown): AiDeliveryDeliverableUploadRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const fileName = getRequiredString(value.fileName, FILE_NAME_MAX_LENGTH);
  const mimeType = getRequiredString(value.mimeType, SHORT_TEXT_FIELD_MAX_LENGTH);
  const contentBase64 = getRequiredString(value.contentBase64, BASE64_UPLOAD_MAX_LENGTH);

  if (!fileName || !mimeType || !contentBase64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(contentBase64)) {
    return null;
  }

  return {
    contentBase64,
    fileName,
    mimeType
  };
}

function getAiDeliveryArticleImageUploadInput(body: unknown): AiDeliveryArticleImageUploadRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const fileName = getRequiredString(value.fileName, FILE_NAME_MAX_LENGTH);
  const mimeType = getRequiredString(value.mimeType, SHORT_TEXT_FIELD_MAX_LENGTH);
  const contentBase64 = getRequiredString(value.contentBase64, BASE64_UPLOAD_MAX_LENGTH);

  if (!fileName || !mimeType || !contentBase64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(contentBase64)) {
    return null;
  }

  return {
    contentBase64,
    fileName,
    mimeType
  };
}

function getInvoiceItemInput(body: unknown) {
  const value = (body ?? {}) as Record<string, unknown>;
  const name = getRequiredString(value.name, SHORT_TEXT_FIELD_MAX_LENGTH);
  const unitPriceCents = getNonNegativeInteger(value.unitPriceCents);
  if (!name || unitPriceCents === null) return null;
  return { name, description: getOptionalString(value.description, TEXT_FIELD_MAX_LENGTH), unitPriceCents };
}

function getPaymentInput(body: unknown) {
  const value = (body ?? {}) as Record<string, unknown>;
  const paymentMethod = typeof value.paymentMethod === "string" ? value.paymentMethod.trim().toUpperCase() : "";
  const amountIssuedCents = getNonNegativeInteger(value.amountIssuedCents);
  const amountReceivedCents = getNonNegativeInteger(value.amountReceivedCents);
  const paymentDate = parseDateInput(value.paymentDate);
  if (!PAYMENT_METHODS.has(paymentMethod) || amountIssuedCents === null || amountReceivedCents === null || !paymentDate) return null;
  return { paymentMethod, amountIssuedCents, amountReceivedCents, paymentDate: paymentDate.toISOString(), notes: getOptionalString(value.notes, TEXT_FIELD_MAX_LENGTH) };
}

function getClientRevisionComment(body: unknown): string | null {
  const value = (body ?? {}) as Record<string, unknown>;
  return getRequiredString(value.comment, SHORT_TEXT_FIELD_MAX_LENGTH);
}

function getCreditNoteInput(body: unknown): CreditNoteInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const reason = getRequiredString(value.reason, TEXT_FIELD_MAX_LENGTH);
  const currency = getCurrency(value.currency);
  const amountCents = getNonNegativeInteger(value.amountCents);
  const subtotalCents = getNonNegativeInteger(value.subtotalCents);
  const taxCents = getNonNegativeInteger(value.taxCents);
  const discountCents = getNonNegativeInteger(value.discountCents);
  const totalCents = getNonNegativeInteger(value.totalCents);
  const rawLineItems = value.lineItems;
  if (rawLineItems !== undefined && (!Array.isArray(rawLineItems) || hasInvalidLineItems(rawLineItems))) {
    return null;
  }
  const lineItems = getCreditNoteLineItems(rawLineItems);
  if (!reason || !currency || amountCents === null || subtotalCents === null || taxCents === null || discountCents === null || totalCents === null) return null;
  return {
    reason,
    amountCents,
    currency,
    subtotalCents,
    taxCents,
    discountCents,
    totalCents,
    documentUrl: getOptionalUrl(value.documentUrl),
    documentStorageKey: getOptionalString(value.documentStorageKey, LOGO_URL_MAX_LENGTH),
    lineItems: lineItems ?? undefined
  };
}

function getTaskInput(body: unknown): TaskInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const projectId = getOptionalString(value.projectId, SHORT_TEXT_FIELD_MAX_LENGTH);
  const title = getRequiredString(value.title, SHORT_TEXT_FIELD_MAX_LENGTH);

  if (!title) {
    return null;
  }

  const priority = typeof value.priority === "string" ? value.priority.trim().toUpperCase() : "NORMAL";
  const status = typeof value.status === "string" ? value.status.trim().toUpperCase() : "TODO";
  const recurringType =
    typeof value.recurringType === "string" ? value.recurringType.trim().toUpperCase() : "NONE";

  if (!TASK_PRIORITIES.has(priority) || !TASK_STATUSES.has(status) || !TASK_RECURRING_TYPES.has(recurringType)) {
    return null;
  }

  if (value.dueDate === undefined || value.dueDate === null || value.dueDate === "") {
    return null;
  }

  const dueDate = parseDateInput(value.dueDate);
  if (dueDate === undefined) {
    return null;
  }

  return {
    projectId,
    title,
    description: getOptionalString(value.description, TEXT_FIELD_MAX_LENGTH),
    priority,
    status,
    dueDate: dueDate?.toISOString() ?? null,
    recurringType
  };
}

function getAiDeliveryDeliverableReviewInput(body: unknown): AiDeliveryDeliverableReviewInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const status = typeof value.status === "string" ? value.status.trim().toUpperCase() : undefined;
  if (status && !AI_DELIVERY_DELIVERABLE_REVIEW_STATUSES.has(status)) {
    return null;
  }

  return {
    status,
    reviewerName: getOptionalString(value.reviewerName, SHORT_TEXT_FIELD_MAX_LENGTH),
    reviewNotes: getOptionalString(value.reviewNotes, TEXT_FIELD_MAX_LENGTH),
    deliverableId: getOptionalString(value.deliverableId, SHORT_TEXT_FIELD_MAX_LENGTH),
    aiDeliveryProjectId: getOptionalString(value.aiDeliveryProjectId, SHORT_TEXT_FIELD_MAX_LENGTH),
    workflowRunId: getOptionalString(value.workflowRunId, SHORT_TEXT_FIELD_MAX_LENGTH)
  };
}

function getAiDeliveryDeliverableInput(body: unknown): AiDeliveryDeliverableInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const title = getRequiredString(value.title, SHORT_TEXT_FIELD_MAX_LENGTH);
  const deliveryType = typeof value.deliveryType === "string" ? value.deliveryType.trim().toUpperCase() : "CONTENT_PACKAGE";
  const hasStatus = Object.prototype.hasOwnProperty.call(value, "status");
  const status = hasStatus
    ? typeof value.status === "string"
      ? value.status.trim().toUpperCase()
      : undefined
    : undefined;

  if (
    !title ||
    !AI_DELIVERY_DELIVERABLE_TYPES.has(deliveryType) ||
    (hasStatus && (typeof value.status !== "string" || !status || !AI_DELIVERY_DELIVERABLE_STATUSES.has(status)))
  ) {
    return null;
  }

  return {
    contentDraftId: getOptionalString(value.contentDraftId, SHORT_TEXT_FIELD_MAX_LENGTH),
    articleImageId: getOptionalString(value.articleImageId, SHORT_TEXT_FIELD_MAX_LENGTH),
    title,
    description: getOptionalString(value.description, TEXT_FIELD_MAX_LENGTH),
    deliveryType,
    status,
    exportUrl: getOptionalString(value.exportUrl, LOGO_URL_MAX_LENGTH),
    storageKey: getOptionalString(value.storageKey, 1024),
    notes: getOptionalString(value.notes, TEXT_FIELD_MAX_LENGTH)
  };
}

export const getCompanyProfileHandler: RequestHandler = async (_req, res) => {
  try {
    res.json(success(await getCompanyProfile(res.locals.authSession), { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("COMPANY_PROFILE_RUNTIME_ERROR", "Company profile could not be completed."));
  }
};

export const saveCompanyProfileHandler: RequestHandler = async (req, res) => {
  const input = getCompanyProfileInput(req.body);
  if (!input) {
    res.status(400).json(companyProfileInvalidFailure());
    return;
  }

  try {
    res.json(
      success(
        await saveCompanyProfile(res.locals.authSession, input as Parameters<typeof saveCompanyProfile>[1]),
        { phase: "runtime", scope: "core-module-skeleton" }
      )
    );
  } catch {
    res.status(500).json(failure("COMPANY_PROFILE_RUNTIME_ERROR", "Company profile could not be completed."));
  }
};

export const listClientsHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await listClients(authSession);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("CLIENT_RUNTIME_ERROR", "Client list could not be completed."));
  }
};

export const listActivityAuditLogsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const tenantId = authSession.tenantContext.activeMembership?.tenantId ?? null;
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const createdAfter = parseActivityAuditLogDate(req.query.createdAfter);
  if (createdAfter === null) {
    res.status(400).json(failure("ACTIVITY_AUDIT_LOG_INVALID", "Invalid createdAfter value."));
    return;
  }

  const createdBefore = parseActivityAuditLogDate(req.query.createdBefore);
  if (createdBefore === null) {
    res.status(400).json(failure("ACTIVITY_AUDIT_LOG_INVALID", "Invalid createdBefore value."));
    return;
  }

  if (createdAfter && createdBefore && createdAfter > createdBefore) {
    res.status(400).json(failure("ACTIVITY_AUDIT_LOG_INVALID", "createdAfter must be earlier than or equal to createdBefore."));
    return;
  }

  const limit = parseActivityAuditLogLimit(req.query.limit);
  if (limit === null) {
    res.status(400).json(failure("ACTIVITY_AUDIT_LOG_INVALID", "Invalid limit value."));
    return;
  }

  try {
    const response = await listTenantAuditLogs({
      tenantId,
      actorUserId: getOptionalQueryValue(req.query.actorUserId) ?? undefined,
      action: getOptionalQueryValue(req.query.action) ?? undefined,
      entityType: getOptionalQueryValue(req.query.entityType) ?? undefined,
      entityId: getOptionalQueryValue(req.query.entityId) ?? undefined,
      createdAfter,
      createdBefore,
      limit
    });

    res.json(success(response, { phase: "runtime", scope: "activity-audit-logs" }));
  } catch {
    res.status(500).json(failure("ACTIVITY_AUDIT_LOG_RUNTIME_ERROR", "Activity audit logs could not be listed."));
  }
};

export const listEmailNotificationLogsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const tenantId = authSession.tenantContext.activeMembership?.tenantId ?? null;
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const limit = parseEmailNotificationLogLimit(req.query.limit);
  if (limit === null) {
    res.status(400).json(failure("EMAIL_NOTIFICATION_LOG_INVALID", "Invalid limit value."));
    return;
  }

  const templateKey = parseEmailNotificationTemplateKey(req.query.templateKey);
  if (templateKey === null) {
    res.status(400).json(failure("EMAIL_NOTIFICATION_LOG_INVALID", "Invalid templateKey value."));
    return;
  }

  const status = parseEmailNotificationStatus(req.query.status);
  if (status === null) {
    res.status(400).json(failure("EMAIL_NOTIFICATION_LOG_INVALID", "Invalid status value."));
    return;
  }

  try {
    const response = await listTenantEmailLogs({
      tenantId,
      templateKey: templateKey ?? undefined,
      status: status ?? undefined,
      limit
    });

    res.json(success(response, { phase: "runtime", scope: "email-notification-outbox" }));
  } catch {
    res.status(500).json(failure("EMAIL_NOTIFICATION_LOG_RUNTIME_ERROR", "Email notification logs could not be listed."));
  }
};

export const getAiProviderPlanningConfigHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const tenantId = authSession.tenantContext.activeMembership?.tenantId ?? null;
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  try {
    const planning = getAiProviderPlanningSnapshot();
    res.json(success({ planning }, { phase: "runtime", scope: "ai-provider-planning-config" }));
  } catch {
    res.status(500).json(failure("AI_PROVIDER_PLANNING_CONFIG_ERROR", "AI provider planning config could not be loaded."));
  }
};

export const getAiOrchestratorLiteRegistryHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const tenantId = authSession.tenantContext.activeMembership?.tenantId ?? null;
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  try {
    const registry = getAiOrchestratorLiteRegistrySnapshot();
    const purivaPolicyProfile = getPurivaAiPolicyProfile();
    const killSwitch = getAiKillSwitchSnapshot();
    const budgetLedger = await getAiBudgetLedgerSummary({ tenantId });
    const recentNotificationEvents = listAiNotificationEvents(tenantId, 10);
    const readiness = getExternalIntegrationsReadinessSnapshot();
    const integrationBoundary = buildPurivaIntegrationBoundaryIndex({
      monthlyAiCapUsd: purivaPolicyProfile.monthlyAiCapUsd,
      categories: readiness.categories.map((category) => ({
        key: category.key,
        status: category.status,
        notes: [category.detail]
      }))
    });
    res.json(
      success(
        {
          registry,
          purivaPolicyProfile,
          killSwitch,
          budgetLedger,
          recentNotificationEvents,
          integrationBoundary
        },
        { phase: "runtime", scope: "ai-orchestrator-lite-registry" }
      )
    );
  } catch {
    res.status(500).json(
      failure("AI_ORCHESTRATOR_LITE_REGISTRY_ERROR", "AI Orchestrator Lite registry could not be loaded.")
    );
  }
};

export const previewAiMaterialRoutingHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const tenantId = authSession.tenantContext.activeMembership?.tenantId ?? null;
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const body = req.body as Record<string, unknown>;
  const workflow = typeof body.workflow === "string" ? body.workflow.trim() : "";
  const step = typeof body.step === "string" ? body.step.trim() : "";
  const agentRole = typeof body.agentRole === "string" ? body.agentRole.trim() : "";
  const taskType = typeof body.taskType === "string" ? body.taskType.trim() : "";

  if (!workflow || !step || !agentRole || !taskType) {
    res.status(400).json(
      failure("AI_MATERIAL_ROUTING_PREVIEW_INVALID", "workflow, step, agentRole, and taskType are required.")
    );
    return;
  }

  try {
    const materialReferences = Array.isArray(body.materialReferences)
      ? (body.materialReferences as import("@dca-os-v1/shared").AiMaterialReference[])
      : undefined;

    const clientId = typeof body.clientId === "string" ? body.clientId : null;
    let operatingPackKey: string | null = null;
    let packResolverSource: string = "unbound";
    if (clientId) {
      const resolved = await resolveClientOperatingPack({ tenantId, clientId });
      if (resolved.ok) {
        operatingPackKey = resolved.operatingPackKey;
        packResolverSource = resolved.resolverSource;
      } else if (resolved.reason === "CLIENT_NOT_FOUND") {
        res.status(404).json(failure("CLIENT_NOT_FOUND", "Client was not found in the active tenant."));
        return;
      } else if (resolved.reason === "PACK_KEY_UNKNOWN") {
        res.status(400).json(
          failure("OPERATING_PACK_KEY_UNKNOWN", "Client operating pack binding is unknown and fail-closed.")
        );
        return;
      } else {
        operatingPackKey = null;
        packResolverSource = `database_binding:${resolved.reason}`;
      }
    } else if (typeof body.operatingPackKey === "string") {
      const normalized = normalizeOperatingPackBindingKey(body.operatingPackKey);
      if (!normalized) {
        res.status(400).json(failure("OPERATING_PACK_KEY_UNKNOWN", "operatingPackKey is not a registered binding key."));
        return;
      }
      operatingPackKey = normalized;
      packResolverSource = "request_override";
    }
    const stepReference = typeof body.stepReference === "string" ? body.stepReference : `${workflow}:${step}`;
    const workflowRunId = typeof body.workflowRunId === "string" ? body.workflowRunId : null;

    const spentThisPeriodUsd = await sumSpentUsdForPeriod({ tenantId, clientId });

    const requestedModelOverride =
      typeof body.requestedModelOverride === "string" ? body.requestedModelOverride.trim() : null;

    const plan = planAiOrchestratorLiteStep({
      workflow,
      step,
      agentRole: agentRole as import("@dca-os-v1/shared").AiAgentRole,
      taskType: taskType as import("@dca-os-v1/shared").AiTaskType,
      clientId,
      operatingPackKey,
      workflowReference: typeof body.workflowReference === "string" ? body.workflowReference : null,
      stepReference,
      materialReferences,
      spentThisPeriodUsd,
      requestedModelOverride
    });

    const ledgerStatus = plan.canExecute ? "PREVIEW" : "BLOCKED";
    await recordAiBudgetLedgerEntry({
      tenantId,
      clientId,
      workflowRunId,
      provider: plan.preview.audit.providerKey,
      taskType,
      agentRole,
      estimatedCostUsd: plan.preview.estimatedCostUsd,
      status: ledgerStatus,
      liveProviderCalled: false,
      stepReference,
      metadata: {
        workflow,
        step,
        operatingPackKey,
        packResolverSource,
        blockedReason: plan.blockedReason,
        modelRouting: {
          policyVersion: plan.preview.modelRouting.policyVersion,
          routingTaskType: plan.preview.modelRouting.routingTaskType,
          gateway: plan.preview.modelRouting.gateway,
          primaryModel: plan.preview.modelRouting.primaryModel,
          fallbackBehavior: plan.preview.modelRouting.fallbackBehavior,
          allowLive: plan.preview.modelRouting.allowLive,
          requiresBudgetLedger: plan.preview.modelRouting.requiresBudgetLedger,
          maxCostUsdPerRun: plan.preview.modelRouting.maxCostUsdPerRun,
          complianceProfile: plan.preview.modelRouting.complianceProfile,
          blocked: plan.preview.modelRouting.blocked,
          modelOverrideRejected: plan.preview.modelRouting.modelOverrideRejected
        }
      }
    });

    if (!plan.canExecute && plan.blockedReason) {
      if (plan.preview.budget.killSwitchActive) {
        emitBudgetCapNotification(tenantId, { clientId, message: plan.blockedReason });
      } else {
        emitWorkflowBlockedNotification(tenantId, {
          clientId,
          workflowReference: workflow,
          message: plan.blockedReason
        });
      }
    }

    const killSwitch = getAiKillSwitchSnapshot();
    if (!killSwitch.orchestratorLiveSafe) {
      emitKillSwitchNotification(tenantId, {
        message: "Orchestrator live-safe invariant not satisfied — preview-only mode enforced."
      });
    }

    res.json(
      success(
        { plan, budgetLedger: await getAiBudgetLedgerSummary({ tenantId, clientId }) },
        { phase: "runtime", scope: "ai-material-routing-preview" }
      )
    );
  } catch {
    res.status(500).json(
      failure("AI_MATERIAL_ROUTING_PREVIEW_ERROR", "AI material routing preview could not be generated.")
    );
  }
};

export const workflowDryRunHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const tenantId = authSession.tenantContext.activeMembership?.tenantId ?? null;
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  const body = req.body as Record<string, unknown>;
  const workflow = typeof body.workflow === "string" ? body.workflow.trim() : "";
  const step = typeof body.step === "string" ? body.step.trim() : "";
  const agentRole = typeof body.agentRole === "string" ? body.agentRole.trim() : "";
  const taskType = typeof body.taskType === "string" ? body.taskType.trim() : "";

  if (!workflow || !step || !agentRole || !taskType) {
    res.status(400).json(
      failure("AI_WORKFLOW_DRY_RUN_INVALID", "workflow, step, agentRole, and taskType are required.")
    );
    return;
  }

  try {
    const clientId = typeof body.clientId === "string" ? body.clientId : null;
    const spentThisPeriodUsd = await sumSpentUsdForPeriod({ tenantId, clientId });
    const briefApproved = body.briefApproved === false ? false : true;

    let operatingPackKey: string | null = null;
    if (clientId) {
      const resolved = await resolveClientOperatingPack({ tenantId, clientId });
      if (resolved.ok) {
        operatingPackKey = resolved.operatingPackKey;
      } else if (resolved.reason === "CLIENT_NOT_FOUND") {
        res.status(404).json(failure("CLIENT_NOT_FOUND", "Client was not found in the active tenant."));
        return;
      } else if (resolved.reason === "PACK_KEY_UNKNOWN") {
        res.status(400).json(
          failure("OPERATING_PACK_KEY_UNKNOWN", "Client operating pack binding is unknown and fail-closed.")
        );
        return;
      } else {
        operatingPackKey = null;
      }
    } else if (typeof body.operatingPackKey === "string") {
      const normalized = normalizeOperatingPackBindingKey(body.operatingPackKey);
      if (!normalized) {
        res.status(400).json(failure("OPERATING_PACK_KEY_UNKNOWN", "operatingPackKey is not a registered binding key."));
        return;
      }
      operatingPackKey = normalized;
    }

    const adapterResult = planWorkflowStepWithOrchestrator({
      workflow,
      step,
      agentRole: agentRole as import("@dca-os-v1/shared").AiAgentRole,
      taskType: taskType as import("@dca-os-v1/shared").AiTaskType,
      clientId,
      operatingPackKey,
      briefApproved,
      spentThisPeriodUsd,
      workflowReference: typeof body.workflowReference === "string" ? body.workflowReference : workflow,
      stepReference: typeof body.stepReference === "string" ? body.stepReference : `${workflow}:${step}`
    });

    if (!adapterResult.canProceedToExecution && adapterResult.blockedReason) {
      emitWorkflowBlockedNotification(tenantId, {
        clientId,
        workflowReference: workflow,
        message: adapterResult.blockedReason
      });
    }

    res.json(
      success(
        {
          adapter: adapterResult,
          budgetLedger: await getAiBudgetLedgerSummary({ tenantId, clientId }),
          recentNotificationEvents: listAiNotificationEvents(tenantId, 5)
        },
        { phase: "runtime", scope: "ai-workflow-dry-run" }
      )
    );
  } catch {
    res.status(500).json(failure("AI_WORKFLOW_DRY_RUN_ERROR", "AI workflow dry-run could not be generated."));
  }
};

export const getGoogleDriveExportConfigHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const tenantId = authSession.tenantContext.activeMembership?.tenantId ?? null;
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  try {
    const exportConfig = getGoogleDriveExportPlanningSnapshot();
    res.json(success({ exportConfig }, { phase: "runtime", scope: "google-drive-export-config" }));
  } catch {
    res.status(500).json(failure("GOOGLE_DRIVE_EXPORT_CONFIG_ERROR", "Google Drive export config could not be loaded."));
  }
};

export const getExternalIntegrationsReadinessHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const tenantId = authSession.tenantContext.activeMembership?.tenantId ?? null;
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  try {
    const readiness = getExternalIntegrationsReadinessSnapshot();
    res.json(success({ readiness }, { phase: "runtime", scope: "external-integrations-readiness" }));
  } catch {
    res.status(500).json(
      failure("EXTERNAL_INTEGRATIONS_READINESS_ERROR", "External integrations readiness could not be loaded.")
    );
  }
};

export const getImageGenerationFoundationConfigHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const tenantId = authSession.tenantContext.activeMembership?.tenantId ?? null;
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  try {
    const readiness = getImageGenerationIntegrationReadiness();
    const foundation = buildImageGenerationFoundationSnapshot(readiness);
    res.json(success({ foundation }, { phase: "runtime", scope: "image-generation-foundation-config" }));
  } catch {
    res.status(500).json(
      failure("IMAGE_GENERATION_FOUNDATION_CONFIG_ERROR", "Image generation foundation config could not be loaded.")
    );
  }
};

export const getAdminOperationsSummaryHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const tenantId = authSession.tenantContext.activeMembership?.tenantId ?? null;
  if (!tenantId) {
    res.status(403).json(forbiddenFailure());
    return;
  }

  try {
    const summary = await buildAdminOperationsSummary(tenantId);
    res.json(success({ summary }, { phase: "runtime", scope: "admin-operations-summary" }));
  } catch {
    res.status(500).json(failure("ADMIN_OPERATIONS_SUMMARY_ERROR", "Admin operations summary could not be loaded."));
  }
};

export const getClientHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const clientId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!clientId) {
    res.status(400).json(clientInvalidFailure());
    return;
  }

  try {
    const response = await getClient(authSession, clientId);
    if (!response?.client) {
      res.status(404).json(clientNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("CLIENT_RUNTIME_ERROR", "Client lookup could not be completed."));
  }
};

export const createClientHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const input = getClientInput(req.body);
  if (!input) {
    res.status(400).json(clientInvalidFailure());
    return;
  }

  try {
    const response = await createClient(authSession, input);
    if (!response?.client) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("CLIENT_RUNTIME_ERROR", "Client create could not be completed."));
  }
};

export const updateClientHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const clientId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getClientInput(req.body);
  if (!clientId || !input) {
    res.status(400).json(clientInvalidFailure());
    return;
  }

  try {
    const response = await updateClient(authSession, clientId, input);
    if (!response?.client) {
      res.status(404).json(clientNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("CLIENT_RUNTIME_ERROR", "Client update could not be completed."));
  }
};

export const archiveClientHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const clientId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!clientId) {
    res.status(400).json(clientInvalidFailure());
    return;
  }

  try {
    const response = await archiveClient(authSession, clientId);
    if (!response?.client) {
      res.status(404).json(clientNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch (error) {
    if ((error as { message?: string }).message === "CLIENT_HAS_ACTIVE_PROJECTS") {
      res.status(409).json(failure("CLIENT_ARCHIVE_BLOCKED", "Client cannot be archived while active projects exist."));
      return;
    }
    res.status(500).json(failure("CLIENT_RUNTIME_ERROR", "Client archive could not be completed."));
  }
};

export const restoreClientHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const clientId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!clientId) {
    res.status(400).json(clientInvalidFailure());
    return;
  }

  try {
    const response = await restoreClient(authSession, clientId);
    if (!response?.client) {
      res.status(404).json(clientNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("CLIENT_RUNTIME_ERROR", "Client restore could not be completed."));
  }
};

export const listClientUserAccessHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const clientId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!clientId) {
    res.status(400).json(clientInvalidFailure());
    return;
  }

  const includeArchived =
    req.query.includeArchived === "true" ||
    req.query.includeArchived === "1" ||
    req.query.includeArchived === "yes";

  try {
    const response = await listClientUserAccess(authSession, clientId, { includeArchived });
    if (!response) {
      res.status(404).json(clientNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "client-access-foundation" }));
  } catch {
    res.status(500).json(failure("CLIENT_ACCESS_RUNTIME_ERROR", "Client user access list could not be completed."));
  }
};

export const linkClientUserAccessHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const clientId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const userId = getRequiredString(req.body?.userId, SHORT_TEXT_FIELD_MAX_LENGTH);
  if (!clientId || !userId) {
    res.status(400).json(clientInvalidFailure());
    return;
  }

  try {
    const response = await linkClientUserAccess(authSession, clientId, userId);
    if (!response?.access) {
      res.status(404).json(clientNotFoundFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "client-access-foundation" }));
  } catch {
    res.status(500).json(failure("CLIENT_ACCESS_RUNTIME_ERROR", "Client user access link could not be completed."));
  }
};

export const archiveClientUserAccessHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const clientId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const userId = typeof req.params.userId === "string" ? req.params.userId.trim() : "";
  if (!clientId || !userId) {
    res.status(400).json(clientInvalidFailure());
    return;
  }

  try {
    const response = await archiveClientUserAccess(authSession, clientId, userId);
    if (!response?.access) {
      res.status(404).json(clientNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "client-access-foundation" }));
  } catch {
    res.status(500).json(failure("CLIENT_ACCESS_RUNTIME_ERROR", "Client user access archive could not be completed."));
  }
};

export const listProjectsHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await listProjects(authSession);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("PROJECT_RUNTIME_ERROR", "Project list could not be completed."));
  }
};

export const getProjectHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!projectId) {
    res.status(400).json(projectInvalidFailure());
    return;
  }

  try {
    const response = await getProject(authSession, projectId);
    if (!response?.project) {
      res.status(404).json(projectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("PROJECT_RUNTIME_ERROR", "Project lookup could not be completed."));
  }
};

export const createProjectHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const input = getProjectInput(req.body);
  if (!input) {
    res.status(400).json(projectInvalidFailure());
    return;
  }

  try {
    const response = await createProject(authSession, input);
    if (!response?.project) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("PROJECT_RUNTIME_ERROR", "Project create could not be completed."));
  }
};

export const updateProjectHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getProjectInput(req.body);
  if (!projectId || !input) {
    res.status(400).json(projectInvalidFailure());
    return;
  }

  try {
    const response = await updateProject(authSession, projectId, input);
    if (!response?.project) {
      res.status(404).json(projectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("PROJECT_RUNTIME_ERROR", "Project update could not be completed."));
  }
};

export const archiveProjectHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!projectId) {
    res.status(400).json(projectInvalidFailure());
    return;
  }

  try {
    const response = await archiveProject(authSession, projectId);
    if (!response?.project) {
      res.status(404).json(projectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch (error) {
    if ((error as { message?: string }).message === "PROJECT_ARCHIVE_BLOCKED") {
      res.status(409).json(failure("PROJECT_ARCHIVE_BLOCKED", "Project cannot be archived while it has active tasks."));
      return;
    }
    res.status(500).json(failure("PROJECT_RUNTIME_ERROR", "Project archive could not be completed."));
  }
};

export const restoreProjectHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!projectId) {
    res.status(400).json(projectInvalidFailure());
    return;
  }

  try {
    const response = await restoreProject(authSession, projectId);
    if (!response?.project) {
      res.status(404).json(projectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("PROJECT_RUNTIME_ERROR", "Project restore could not be completed."));
  }
};

export const listAiDeliveryProjectsHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await listAiDeliveryProjects(authSession);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-projects" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_PROJECT_RUNTIME_ERROR", "AI Delivery project list could not be completed."));
  }
};

export const createAiDeliveryProjectHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const input = getAiDeliveryProjectInput(req.body);
  if (!input) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await createAiDeliveryProject(authSession, input);
    if (!response?.aiDeliveryProject) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "ai-delivery-projects" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_PROJECT_RUNTIME_ERROR", "AI Delivery project create could not be completed."));
  }
};

export const updateAiDeliveryProjectHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getAiDeliveryProjectInput(req.body);
  if (!aiDeliveryProjectId || !input) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await updateAiDeliveryProject(authSession, aiDeliveryProjectId, input);
    if (!response?.aiDeliveryProject) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-projects" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_PROJECT_RUNTIME_ERROR", "AI Delivery project update could not be completed."));
  }
};

export const archiveAiDeliveryProjectHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!aiDeliveryProjectId) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await archiveAiDeliveryProject(authSession, aiDeliveryProjectId);
    if (!response?.aiDeliveryProject) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-projects" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_PROJECT_RUNTIME_ERROR", "AI Delivery project archive could not be completed."));
  }
};

export const listAiDeliveryWorkflowRunsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!aiDeliveryProjectId) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await listAiDeliveryWorkflowRuns(authSession, aiDeliveryProjectId);
    if (!response) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-workflow-runs" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_WORKFLOW_RUN_RUNTIME_ERROR", "AI Delivery workflow run list could not be completed."));
  }
};

export const createAiDeliveryWorkflowRunHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const input = getAiDeliveryWorkflowRunInput(req.body);
  if (!aiDeliveryProjectId || !input) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await createAiDeliveryWorkflowRun(authSession, aiDeliveryProjectId, input);
    if (!response?.workflowRun) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "ai-delivery-workflow-runs" }));
  } catch (error) {
    if ((error as { message?: string }).message === "AI_DELIVERY_WORKFLOW_RUN_INVALID_STATUS_TRANSITION") {
      res.status(400).json(failure("AI_DELIVERY_WORKFLOW_RUN_STATUS_GATE_BLOCKED", "Workflow run status transition is not allowed from the current state."));
      return;
    }
    res.status(500).json(failure("AI_DELIVERY_WORKFLOW_RUN_RUNTIME_ERROR", "AI Delivery workflow run create could not be completed."));
  }
};

export const updateAiDeliveryWorkflowRunHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const workflowRunId = typeof req.params.workflowRunId === "string" ? req.params.workflowRunId.trim() : "";
  const input = getAiDeliveryWorkflowRunInput(req.body);
  if (!aiDeliveryProjectId || !workflowRunId || !input) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await updateAiDeliveryWorkflowRun(authSession, aiDeliveryProjectId, workflowRunId, input);
    if (!response?.workflowRun) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-workflow-runs" }));
  } catch (error) {
    if ((error as { message?: string }).message === "AI_DELIVERY_WORKFLOW_RUN_INVALID_STATUS_TRANSITION") {
      res.status(400).json(failure("AI_DELIVERY_WORKFLOW_RUN_STATUS_GATE_BLOCKED", "Workflow run status transition is not allowed from the current state."));
      return;
    }
    res.status(500).json(failure("AI_DELIVERY_WORKFLOW_RUN_RUNTIME_ERROR", "AI Delivery workflow run update could not be completed."));
  }
};

export const executeAiDeliveryWorkflowRunHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const workflowRunId = typeof req.params.workflowRunId === "string" ? req.params.workflowRunId.trim() : "";
  const input = getAiDeliveryWorkflowRunExecuteInput(req.body);
  if (!aiDeliveryProjectId || !workflowRunId) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await executeAiDeliveryWorkflowRun(authSession, aiDeliveryProjectId, workflowRunId, input);
    if (!response?.workflowRun) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-workflow-runs" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    const message = (error as { message?: string }).message;
    if (message === "AI_DELIVERY_WORKFLOW_RUN_EXECUTION_ARCHIVED") {
      res.status(400).json(failure("AI_DELIVERY_WORKFLOW_RUN_EXECUTION_ARCHIVED", "Archived workflow runs cannot be executed."));
      return;
    }
    if (message === "AI_DELIVERY_WORKFLOW_RUN_EXECUTION_COMPLETED") {
      res.status(400).json(failure("AI_DELIVERY_WORKFLOW_RUN_EXECUTION_COMPLETED", "Completed workflow runs cannot be executed again from this screen."));
      return;
    }
    if (message === "AI_DELIVERY_WORKFLOW_RUN_EXECUTION_ALREADY_RUNNING") {
      res.status(400).json(failure("AI_DELIVERY_WORKFLOW_RUN_EXECUTION_ALREADY_RUNNING", "Workflow run is already in progress."));
      return;
    }
    if (message === "AI_DELIVERY_WORKFLOW_RUN_EXECUTION_REVIEW_PENDING") {
      res.status(400).json(failure("AI_DELIVERY_WORKFLOW_RUN_EXECUTION_REVIEW_PENDING", "Workflow run is already awaiting admin review."));
      return;
    }

    res.status(500).json(failure("AI_DELIVERY_WORKFLOW_RUN_EXECUTION_RUNTIME_ERROR", "AI Delivery workflow run execution could not be completed."));
  }
};

function parseAiOperationsListFilters(query: Record<string, unknown>): ListAiOperationsRunsFilters {
  const limitValue = typeof query.limit === "string" ? Number(query.limit) : undefined;
  const workflowKindRaw = typeof query.workflowKind === "string" ? query.workflowKind.trim() : undefined;
  const workflowKind: ListAiOperationsRunsFilters["workflowKind"] =
    workflowKindRaw === "ai_delivery_workflow_run" ||
    workflowKindRaw === "market_intelligence_research_run" ||
    workflowKindRaw === "all"
      ? workflowKindRaw
      : undefined;
  return {
    status: typeof query.status === "string" ? query.status : undefined,
    outputType: typeof query.outputType === "string" ? query.outputType : undefined,
    gateway: typeof query.gateway === "string" ? query.gateway : undefined,
    workflowKind,
    clientId: typeof query.clientId === "string" ? query.clientId : undefined,
    aiDeliveryProjectId:
      typeof query.aiDeliveryProjectId === "string" ? query.aiDeliveryProjectId : undefined,
    miProjectId: typeof query.miProjectId === "string" ? query.miProjectId : undefined,
    limit: Number.isFinite(limitValue) ? limitValue : undefined
  };
}

export const listAiOperationsRunsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await listAiOperationsRuns(authSession, parseAiOperationsListFilters(req.query));
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-operations-runs" }));
  } catch {
    res.status(500).json(failure("AI_OPERATIONS_RUNS_RUNTIME_ERROR", "AI operations runs could not be listed."));
  }
};

export const getAiOperationsRunHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const workflowRunId = typeof req.params.runId === "string" ? req.params.runId.trim() : "";
  if (!workflowRunId) {
    res.status(400).json(failure("AI_OPERATIONS_RUN_INVALID", "Workflow run id is required."));
    return;
  }

  try {
    const response = await getAiOperationsRun(authSession, workflowRunId);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    if (!response.run) {
      res.status(404).json(failure("AI_OPERATIONS_RUN_NOT_FOUND", "AI operations run was not found."));
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-operations-runs" }));
  } catch {
    res.status(500).json(failure("AI_OPERATIONS_RUN_RUNTIME_ERROR", "AI operations run detail could not be loaded."));
  }
};

export const listAiDeliveryResearchRequestsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!aiDeliveryProjectId) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await listAiDeliveryResearchRequests(authSession, aiDeliveryProjectId);
    if (!response) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-research-requests" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_RESEARCH_REQUEST_RUNTIME_ERROR", "AI Delivery research request list could not be completed."));
  }
};

export const createAiDeliveryResearchRequestHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const input = getAiDeliveryResearchRequestInput(req.body);
  if (!aiDeliveryProjectId || !input?.title) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await createAiDeliveryResearchRequest(authSession, aiDeliveryProjectId, input);
    if (!response?.researchRequest) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "ai-delivery-research-requests" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_RESEARCH_REQUEST_RUNTIME_ERROR", "AI Delivery research request create could not be completed."));
  }
};

export const updateAiDeliveryResearchRequestHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const researchRequestId = typeof req.params.researchRequestId === "string" ? req.params.researchRequestId.trim() : "";
  const input = getAiDeliveryResearchRequestInput(req.body);
  if (!aiDeliveryProjectId || !researchRequestId || !input) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await updateAiDeliveryResearchRequest(authSession, aiDeliveryProjectId, researchRequestId, input);
    if (!response?.researchRequest) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-research-requests" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_RESEARCH_REQUEST_RUNTIME_ERROR", "AI Delivery research request update could not be completed."));
  }
};

export const listAiDeliveryResearchSummariesHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!aiDeliveryProjectId) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await listAiDeliveryResearchSummaries(authSession, aiDeliveryProjectId);
    if (!response) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-research-summaries" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_RESEARCH_SUMMARY_RUNTIME_ERROR", "AI Delivery research summary list could not be completed."));
  }
};

export const createAiDeliveryResearchSummaryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const input = getAiDeliveryResearchSummaryInput(req.body);
  if (!aiDeliveryProjectId || !input?.title || !input.summaryText) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await createAiDeliveryResearchSummary(authSession, aiDeliveryProjectId, input);
    if (!response?.researchSummary) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "ai-delivery-research-summaries" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_RESEARCH_SUMMARY_RUNTIME_ERROR", "AI Delivery research summary create could not be completed."));
  }
};

export const updateAiDeliveryResearchSummaryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const researchSummaryId = typeof req.params.researchSummaryId === "string" ? req.params.researchSummaryId.trim() : "";
  const input = getAiDeliveryResearchSummaryInput(req.body);
  if (!aiDeliveryProjectId || !researchSummaryId || !input) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await updateAiDeliveryResearchSummary(authSession, aiDeliveryProjectId, researchSummaryId, input);
    if (!response?.researchSummary) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-research-summaries" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_RESEARCH_SUMMARY_RUNTIME_ERROR", "AI Delivery research summary update could not be completed."));
  }
};

export const applyAiDeliveryResearchSummaryToBriefHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const researchSummaryId = typeof req.params.researchSummaryId === "string" ? req.params.researchSummaryId.trim() : "";
  if (!aiDeliveryProjectId || !researchSummaryId) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await applyAiDeliveryResearchSummaryToBrief(authSession, aiDeliveryProjectId, researchSummaryId);
    if (!response?.researchSummary || !response.brief) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-research-summaries" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_RESEARCH_SUMMARY_RUNTIME_ERROR", "AI Delivery research summary apply-to-brief could not be completed."));
  }
};

export const listAiDeliveryResearchSourcesHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const researchRequestId = typeof req.query.researchRequestId === "string" ? req.query.researchRequestId.trim() : null;
  if (!aiDeliveryProjectId) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await listAiDeliveryResearchSources(authSession, aiDeliveryProjectId, researchRequestId);
    if (!response) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-research-sources" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_RESEARCH_SOURCE_RUNTIME_ERROR", "AI Delivery research source list could not be completed."));
  }
};

export const createAiDeliveryResearchSourceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const input = getAiDeliveryResearchSourceInput(req.body);
  if (!aiDeliveryProjectId || !input?.sourceUrl) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await createAiDeliveryResearchSource(authSession, aiDeliveryProjectId, input);
    if (!response?.researchSource) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "ai-delivery-research-sources" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_RESEARCH_SOURCE_RUNTIME_ERROR", "AI Delivery research source create could not be completed."));
  }
};

export const updateAiDeliveryResearchSourceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const researchSourceId = typeof req.params.researchSourceId === "string" ? req.params.researchSourceId.trim() : "";
  const input = getAiDeliveryResearchSourceInput(req.body);
  if (!aiDeliveryProjectId || !researchSourceId || !input) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await updateAiDeliveryResearchSource(authSession, aiDeliveryProjectId, researchSourceId, input);
    if (!response?.researchSource) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-research-sources" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_RESEARCH_SOURCE_RUNTIME_ERROR", "AI Delivery research source update could not be completed."));
  }
};

export const requestAiDeliveryBriefClientInputHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!aiDeliveryProjectId) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await requestAiDeliveryBriefClientInput(authSession, aiDeliveryProjectId);
    if (!response?.aiDeliveryProject) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-projects" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_BRIEF_RUNTIME_ERROR", "Requesting client input could not be completed."));
  }
};

export const requestAiDeliveryBriefClientRevisionHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!aiDeliveryProjectId) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await requestAiDeliveryBriefClientRevision(authSession, aiDeliveryProjectId);
    if (!response?.aiDeliveryProject) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-projects" }));
  } catch (error) {
    if (error instanceof Error && error.message === "BRIEF_REVISION_LIMIT_REACHED") {
      res.status(409).json(failure("AI_DELIVERY_BRIEF_REVISION_LIMIT_REACHED", "Brief revision limit reached."));
      return;
    }
    res.status(500).json(failure("AI_DELIVERY_BRIEF_RUNTIME_ERROR", "Requesting client revision could not be completed."));
  }
};

export const approveFinalAiDeliveryBriefHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!aiDeliveryProjectId) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await approveFinalAiDeliveryBrief(authSession, aiDeliveryProjectId);
    if (!response?.aiDeliveryProject) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-projects" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_BRIEF_RUNTIME_ERROR", "Approving final brief could not be completed."));
  }
};

export const getAiDeliveryBriefHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!aiDeliveryProjectId) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  try {
    const response = await getAiDeliveryBriefDetail(authSession, aiDeliveryProjectId);
    if (!response?.brief) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-projects" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_BRIEF_RUNTIME_ERROR", "Fetching brief could not be completed."));
  }
};

export const saveAiDeliveryBriefHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!aiDeliveryProjectId) {
    res.status(400).json(aiDeliveryProjectInvalidFailure());
    return;
  }

  const clientPriorities = getOptionalString(req.body.clientPriorities);
  const productsServicesFocus = getOptionalString(req.body.productsServicesFocus);
  const targetAudience = getOptionalString(req.body.targetAudience);
  const marketsCompetitors = getOptionalString(req.body.marketsCompetitors);
  const notes = getOptionalString(req.body.notes);

  try {
    const response = await saveAiDeliveryBrief(authSession, aiDeliveryProjectId, {
      clientPriorities,
      productsServicesFocus,
      targetAudience,
      marketsCompetitors,
      notes
    });

    if (!response?.brief) {
      res.status(404).json(aiDeliveryProjectNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "ai-delivery-projects" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_BRIEF_RUNTIME_ERROR", "Saving brief could not be completed."));
  }
};

function getAiDeliveryContentPlanItemsInput(body: unknown) {
  const rawItems = Array.isArray((body as { items?: unknown[] } | null | undefined)?.items)
    ? ((body as { items?: unknown[] }).items as unknown[])
    : undefined;
  if (!rawItems) return undefined;

  const items = [];
  for (const rawItem of rawItems) {
    const item = (rawItem ?? {}) as Record<string, unknown>;
    const title = getRequiredString(item.title, SHORT_TEXT_FIELD_MAX_LENGTH);
    if (!title) {
      continue;
    }

    const approvalStatus =
      item.approvalStatus === undefined
        ? null
        : typeof item.approvalStatus === "string"
          ? item.approvalStatus.trim().toUpperCase()
          : null;
    if (approvalStatus && !AI_DELIVERY_CONTENT_PLAN_ITEM_APPROVAL_STATUSES.has(approvalStatus)) {
      return null;
    }

    items.push({
      title,
      targetKeyword: getOptionalString(item.targetKeyword),
      contentType: getOptionalString(item.contentType) ?? "article",
      notes: getOptionalString(item.notes),
      sortOrder: Number.isInteger(item.sortOrder) ? Number(item.sortOrder) : 0,
      approvalStatus,
      clientComment: getOptionalString(item.clientComment)
    });
  }

  return items;
}

// --- Content plan handlers ---
export const getAiDeliveryContentPlanHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!aiDeliveryProjectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await getAiDeliveryContentPlanDetail(authSession, aiDeliveryProjectId as string);
    if (!response?.contentPlan) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-projects" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_CONTENT_PLAN_RUNTIME_ERROR", "Fetching content plan could not be completed."));
  }
};

export const createAiDeliveryContentPlanHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!aiDeliveryProjectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  const items = getAiDeliveryContentPlanItemsInput(req.body);
  if (items === null) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await createAiDeliveryContentPlan(authSession, aiDeliveryProjectId, { items });
    if (!response?.contentPlan) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    if (response.created) {
      res.status(201).json(success({ contentPlan: response.contentPlan }, { phase: "runtime", scope: "ai-delivery-projects" }));
    } else {
      res.json(success({ contentPlan: response.contentPlan }, { phase: "runtime", scope: "ai-delivery-projects" }));
    }
  } catch {
    res.status(500).json(failure("AI_DELIVERY_CONTENT_PLAN_RUNTIME_ERROR", "Creating content plan could not be completed."));
  }
};

export const updateAiDeliveryContentPlanHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!aiDeliveryProjectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  const status =
    req.body?.status === undefined
      ? undefined
      : typeof req.body.status === "string"
        ? req.body.status.trim().toUpperCase()
        : null;
  if (status === null || (status && !AI_DELIVERY_CONTENT_PLAN_STATUSES.has(status))) {
    return void res.status(400).json(aiDeliveryProjectInvalidFailure());
  }
  const revisionCount = Number.isInteger(req.body?.revisionCount) ? req.body.revisionCount : undefined;
  const items = getAiDeliveryContentPlanItemsInput(req.body);
  if (items === null) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await updateAiDeliveryContentPlan(authSession, aiDeliveryProjectId, { status, revisionCount, items });
    if (!response?.contentPlan) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-projects" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_CONTENT_PLAN_RUNTIME_ERROR", "Updating content plan could not be completed."));
  }
};

export const requestAiDeliveryContentPlanClientReviewHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!aiDeliveryProjectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await requestAiDeliveryContentPlanClientReview(authSession, aiDeliveryProjectId);
    if (!response?.contentPlan) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-projects" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_CONTENT_PLAN_RUNTIME_ERROR", "Requesting client review could not be completed."));
  }
};

export const approveAiDeliveryContentPlanHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!aiDeliveryProjectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await approveAiDeliveryContentPlan(authSession, aiDeliveryProjectId);
    if (!response?.contentPlan) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-projects" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_CONTENT_PLAN_RUNTIME_ERROR", "Approving content plan could not be completed."));
  }
};

export const requestAiDeliveryContentPlanChangesHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!aiDeliveryProjectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await requestAiDeliveryContentPlanChanges(authSession, aiDeliveryProjectId);
    if (!response?.contentPlan) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-projects" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_CONTENT_PLAN_RUNTIME_ERROR", "Requesting content plan changes could not be completed."));
  }
};

export const getClientAiDeliveryContentPlanReviewHandler: RequestHandler = (_req, res) => {
  res.status(403).json(clientReviewDeferredFailure());
};

export const approveClientAiDeliveryContentPlanReviewHandler: RequestHandler = (_req, res) => {
  res.status(403).json(clientReviewDeferredFailure());
};

export const requestClientAiDeliveryContentPlanRevisionHandler: RequestHandler = (_req, res) => {
  res.status(403).json(clientReviewDeferredFailure());
};

export const listAiDeliveryContentDraftsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await listAiDeliveryContentDrafts(authSession, aiDeliveryProjectId);
    if (!response) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-content-drafts" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_CONTENT_DRAFT_RUNTIME_ERROR", "Content drafts could not be listed."));
  }
};

export const createAiDeliveryContentDraftHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getAiDeliveryContentDraftInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !input) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await createAiDeliveryContentDraft(authSession, aiDeliveryProjectId, input);
    if (!response?.contentDraft) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.status(201).json(success(response, { phase: "runtime", scope: "ai-delivery-content-drafts" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_CONTENT_DRAFT_RUNTIME_ERROR", "Content draft could not be created."));
  }
};

export const updateAiDeliveryContentDraftHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const contentDraftId = typeof req.params.draftId === "string" ? req.params.draftId.trim() : "";
  const input = getAiDeliveryContentDraftInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !contentDraftId || !input) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await updateAiDeliveryContentDraft(authSession, aiDeliveryProjectId, contentDraftId, input);
    if (!response?.contentDraft) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-content-drafts" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_CONTENT_DRAFT_RUNTIME_ERROR", "Content draft could not be updated."));
  }
};

export const archiveAiDeliveryContentDraftHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const contentDraftId = typeof req.params.draftId === "string" ? req.params.draftId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !contentDraftId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await archiveAiDeliveryContentDraft(authSession, aiDeliveryProjectId, contentDraftId);
    if (!response?.contentDraft) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-content-drafts" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_CONTENT_DRAFT_RUNTIME_ERROR", "Content draft could not be archived."));
  }
};

export const listAiDeliveryArticleImagesHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await listAiDeliveryArticleImages(authSession, aiDeliveryProjectId);
    if (!response) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-article-images" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_ARTICLE_IMAGE_RUNTIME_ERROR", "Article images could not be listed."));
  }
};

export const createAiDeliveryArticleImageHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getAiDeliveryArticleImageInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !input) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await createAiDeliveryArticleImage(authSession, aiDeliveryProjectId, input);
    if (!response?.articleImage) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.status(201).json(success(response, { phase: "runtime", scope: "ai-delivery-article-images" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_ARTICLE_IMAGE_RUNTIME_ERROR", "Article image could not be created."));
  }
};

export const updateAiDeliveryArticleImageHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const articleImageId = typeof req.params.imageId === "string" ? req.params.imageId.trim() : "";
  const input = getAiDeliveryArticleImageInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !articleImageId || !input) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await updateAiDeliveryArticleImage(authSession, aiDeliveryProjectId, articleImageId, input);
    if (!response?.articleImage) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-article-images" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_ARTICLE_IMAGE_RUNTIME_ERROR", "Article image could not be updated."));
  }
};

export const archiveAiDeliveryArticleImageHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const articleImageId = typeof req.params.imageId === "string" ? req.params.imageId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !articleImageId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await archiveAiDeliveryArticleImage(authSession, aiDeliveryProjectId, articleImageId);
    if (!response?.articleImage) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-article-images" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_ARTICLE_IMAGE_RUNTIME_ERROR", "Article image could not be archived."));
  }
};

export const markAiDeliveryArticleImagePreviewReadyHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const articleImageId = typeof req.params.imageId === "string" ? req.params.imageId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !articleImageId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await markAiDeliveryArticleImagePreviewReady(authSession, aiDeliveryProjectId, articleImageId);
    if (!response?.articleImage) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-article-images" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_ARTICLE_IMAGE_RUNTIME_ERROR", "Article image preview-ready action could not be completed."));
  }
};

export const requestAiDeliveryArticleImageChangesHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const articleImageId = typeof req.params.imageId === "string" ? req.params.imageId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !articleImageId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await requestAiDeliveryArticleImageChanges(authSession, aiDeliveryProjectId, articleImageId);
    if (!response?.articleImage) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-article-images" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_ARTICLE_IMAGE_RUNTIME_ERROR", "Article image request-changes action could not be completed."));
  }
};

export const approveAiDeliveryArticleImageHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const articleImageId = typeof req.params.imageId === "string" ? req.params.imageId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !articleImageId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await approveAiDeliveryArticleImage(authSession, aiDeliveryProjectId, articleImageId);
    if (!response?.articleImage) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-article-images" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_ARTICLE_IMAGE_RUNTIME_ERROR", "Article image approve action could not be completed."));
  }
};

export const markAiDeliveryArticleImageFinalReadyHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const articleImageId = typeof req.params.imageId === "string" ? req.params.imageId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !articleImageId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await markAiDeliveryArticleImageFinalReady(authSession, aiDeliveryProjectId, articleImageId);
    if (!response?.articleImage) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-article-images" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_ARTICLE_IMAGE_RUNTIME_ERROR", "Article image final-ready action could not be completed."));
  }
};

export const uploadAiDeliveryArticleImageFinalAssetHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const articleImageId = typeof req.params.imageId === "string" ? req.params.imageId.trim() : "";
  const input = getAiDeliveryArticleImageUploadInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !articleImageId || !input) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await uploadAiDeliveryArticleImageFinalAsset(authSession, aiDeliveryProjectId, articleImageId, input);
    if (!response?.articleImage) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.status(201).json(success(response, { phase: "runtime", scope: "r2-storage-foundation" }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not configured")) {
      res.status(503).json(failure("R2_STORAGE_NOT_CONFIGURED", "R2 storage is not configured."));
      return;
    }
    if (message.includes("validation failed")) {
      res.status(400).json(aiDeliveryProjectInvalidFailure());
      return;
    }
    res.status(500).json(failure("AI_DELIVERY_ARTICLE_IMAGE_RUNTIME_ERROR", "Article image final asset upload could not be completed."));
  }
};

export const listAiDeliveryDeliverablesHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await listAiDeliveryDeliverables(authSession, aiDeliveryProjectId);
    if (!response) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-deliverables" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_DELIVERABLE_RUNTIME_ERROR", "Deliverables could not be listed."));
  }
};

export const createAiDeliveryDeliverableHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getAiDeliveryDeliverableInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !input) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await createAiDeliveryDeliverable(authSession, aiDeliveryProjectId, input);
    if (!response?.deliverable) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.status(201).json(success(response, { phase: "runtime", scope: "ai-delivery-deliverables" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_DELIVERABLE_RUNTIME_ERROR", "Deliverable could not be created."));
  }
};

export const updateAiDeliveryDeliverableHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  const input = getAiDeliveryDeliverableInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId || !input) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await updateAiDeliveryDeliverable(authSession, aiDeliveryProjectId, deliverableId, input);
    if (!response?.deliverable) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-deliverables" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_DELIVERABLE_RUNTIME_ERROR", "Deliverable could not be updated."));
  }
};

export const uploadAiDeliveryDeliverableDocumentHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  const input = getAiDeliveryDeliverableUploadInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId || !input) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await uploadAiDeliveryDeliverableDocument(authSession, aiDeliveryProjectId, deliverableId, input);
    if (!response?.deliverable) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.status(201).json(success(response, { phase: "runtime", scope: "r2-storage-foundation" }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not configured")) {
      res.status(503).json(failure("R2_STORAGE_NOT_CONFIGURED", "R2 storage is not configured."));
      return;
    }
    if (message.includes("validation failed")) {
      res.status(400).json(aiDeliveryProjectInvalidFailure());
      return;
    }
    res.status(500).json(failure("AI_DELIVERY_DELIVERABLE_RUNTIME_ERROR", "Deliverable upload could not be completed."));
  }
};

export const archiveAiDeliveryDeliverableHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await archiveAiDeliveryDeliverable(authSession, aiDeliveryProjectId, deliverableId);
    if (!response?.deliverable) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-deliverables" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_DELIVERABLE_RUNTIME_ERROR", "Deliverable could not be archived."));
  }
};

export const restoreAiDeliveryDeliverableHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await restoreAiDeliveryDeliverable(authSession, aiDeliveryProjectId, deliverableId);
    if (!response?.deliverable) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-deliverables" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_DELIVERABLE_RUNTIME_ERROR", "Deliverable could not be restored."));
  }
};

export const markAiDeliveryDeliverableReadyHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await markAiDeliveryDeliverableReady(authSession, aiDeliveryProjectId, deliverableId);
    if (!response?.deliverable) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-deliverables" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_DELIVERABLE_RUNTIME_ERROR", "Deliverable ready action could not be completed."));
  }
};

export const sendAiDeliveryDeliverableForClientReviewHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await sendAiDeliveryDeliverableForClientReview(authSession, aiDeliveryProjectId, deliverableId);
    if (!response?.deliverable) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-deliverables" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_DELIVERABLE_RUNTIME_ERROR", "Deliverable could not be sent for client review."));
  }
};

export const requestAiDeliveryDeliverableRevisionHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await requestAiDeliveryDeliverableRevision(authSession, aiDeliveryProjectId, deliverableId);
    if (!response?.deliverable) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-deliverables" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_DELIVERABLE_RUNTIME_ERROR", "Deliverable revision action could not be completed."));
  }
};

export const acceptAiDeliveryDeliverableHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await acceptAiDeliveryDeliverable(authSession, aiDeliveryProjectId, deliverableId);
    if (!response?.deliverable) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-deliverables" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_DELIVERABLE_RUNTIME_ERROR", "Deliverable accept action could not be completed."));
  }
};

export const listAiDeliveryDeliverableReviewsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await listAiDeliveryDeliverableReviews(authSession, aiDeliveryProjectId, deliverableId);
    if (!response) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-deliverable-reviews" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_DELIVERABLE_REVIEW_RUNTIME_ERROR", "Deliverable reviews could not be listed."));
  }
};

export const createAiDeliveryDeliverableReviewHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  const input = getAiDeliveryDeliverableReviewInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId || !input) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await createAiDeliveryDeliverableReview(authSession, aiDeliveryProjectId, deliverableId, input);
    if (!response?.deliverableReview) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.status(201).json(success(response, { phase: "runtime", scope: "ai-delivery-deliverable-reviews" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_DELIVERABLE_REVIEW_RUNTIME_ERROR", "Deliverable review could not be created."));
  }
};

export const updateAiDeliveryDeliverableReviewHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  const reviewId = typeof req.params.reviewId === "string" ? req.params.reviewId.trim() : "";
  const input = getAiDeliveryDeliverableReviewInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId || !reviewId || !input) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await updateAiDeliveryDeliverableReview(authSession, aiDeliveryProjectId, deliverableId, reviewId, input);
    if (!response?.deliverableReview) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-deliverable-reviews" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_DELIVERABLE_REVIEW_RUNTIME_ERROR", "Deliverable review could not be updated."));
  }
};

export const requestAiDeliveryContentDraftClientReviewHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const contentDraftId = typeof req.params.draftId === "string" ? req.params.draftId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !contentDraftId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await requestAiDeliveryContentDraftClientReview(authSession, aiDeliveryProjectId, contentDraftId);
    if (!response?.contentDraft) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-content-draft-client-review" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_CONTENT_DRAFT_RUNTIME_ERROR", "Content draft review request could not be completed."));
  }
};

export const returnAiDeliveryContentDraftToDraftHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const contentDraftId = typeof req.params.draftId === "string" ? req.params.draftId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !contentDraftId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await returnAiDeliveryContentDraftToDraft(authSession, aiDeliveryProjectId, contentDraftId);
    if (!response?.contentDraft) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-content-drafts" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_CONTENT_DRAFT_RUNTIME_ERROR", "Content draft could not be returned to draft."));
  }
};

export const adminApproveAiDeliveryContentDraftHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const contentDraftId = typeof req.params.draftId === "string" ? req.params.draftId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !contentDraftId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await adminApproveAiDeliveryContentDraft(authSession, aiDeliveryProjectId, contentDraftId);
    if (!response?.contentDraft) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-content-drafts" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_CONTENT_DRAFT_RUNTIME_ERROR", "Content draft could not be admin-approved."));
  }
};

export const listClientAiDeliveryContentDraftReviewsHandler: RequestHandler = (_req, res) => {
  res.status(403).json(clientReviewDeferredFailure());
};

export const approveClientAiDeliveryContentDraftReviewHandler: RequestHandler = (_req, res) => {
  res.status(403).json(clientReviewDeferredFailure());
};

export const requestClientAiDeliveryContentDraftRevisionHandler: RequestHandler = (_req, res) => {
  res.status(403).json(clientReviewDeferredFailure());
};

export const listTasksHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await listTasks(authSession);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("TASK_RUNTIME_ERROR", "Task list could not be completed."));
  }
};

export const getTaskHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const taskId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!taskId) {
    res.status(400).json(taskInvalidFailure());
    return;
  }

  try {
    const response = await getTask(authSession, taskId);
    if (!response?.task) {
      res.status(404).json(taskNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("TASK_RUNTIME_ERROR", "Task lookup could not be completed."));
  }
};

export const createTaskHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const input = getTaskInput(req.body);
  if (!input) {
    res.status(400).json(taskInvalidFailure());
    return;
  }

  try {
    const response = await createTask(authSession, input);
    if (!response?.task) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("TASK_RUNTIME_ERROR", "Task create could not be completed."));
  }
};

export const updateTaskHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const taskId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getTaskInput(req.body);
  if (!taskId || !input) {
    res.status(400).json(taskInvalidFailure());
    return;
  }

  try {
    const response = await updateTask(authSession, taskId, input);
    if (!response?.task) {
      res.status(404).json(taskNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("TASK_RUNTIME_ERROR", "Task update could not be completed."));
  }
};

export const archiveTaskHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const taskId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!taskId) {
    res.status(400).json(taskInvalidFailure());
    return;
  }

  try {
    const response = await archiveTask(authSession, taskId);
    if (!response?.task) {
      res.status(404).json(taskNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch (error) {
    if (error instanceof Error && error.message === "TASK_ARCHIVE_BLOCKED") {
      res.status(409).json(failure("TASK_ARCHIVE_BLOCKED", "Only done tasks can be archived."));
      return;
    }

    res.status(500).json(failure("TASK_RUNTIME_ERROR", "Task archive could not be completed."));
  }
};

export const restoreTaskHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const taskId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!taskId) {
    res.status(400).json(taskInvalidFailure());
    return;
  }

  try {
    const response = await restoreTask(authSession, taskId);
    if (!response?.task) {
      res.status(404).json(taskNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "core-module-skeleton" }));
  } catch {
    res.status(500).json(failure("TASK_RUNTIME_ERROR", "Task restore could not be completed."));
  }
};

export const listInvoicesHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await listInvoices(authSession);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "invoices-module" }));
  } catch {
    res.status(500).json(failure("INVOICE_RUNTIME_ERROR", "Invoice list could not be completed."));
  }
};

export const getInvoiceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const invoiceId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!invoiceId) {
    res.status(400).json(invoiceInvalidFailure());
    return;
  }

  try {
    const response = await getInvoice(authSession, invoiceId);
    if (!response?.invoice) {
      res.status(404).json(invoiceNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "invoices-module" }));
  } catch {
    res.status(500).json(failure("INVOICE_RUNTIME_ERROR", "Invoice lookup could not be completed."));
  }
};

export const createInvoiceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const input = getInvoiceInput(req.body);
  if (!input) {
    if (hasInvalidLineItems((req.body as Record<string, unknown> | undefined)?.lineItems)) {
      res.status(400).json(invoiceLineItemsInvalidFailure());
      return;
    }
    res.status(400).json(invoiceInvalidFailure());
    return;
  }

  try {
    const response = await createInvoice(authSession, input);
    if (!response?.invoice) {
      res.status(400).json(invoiceInvalidFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "invoices-module" }));
  } catch {
    res.status(500).json(failure("INVOICE_RUNTIME_ERROR", "Invoice create could not be completed."));
  }
};

export const updateInvoiceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const invoiceId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getInvoiceInput(req.body);
  if (!invoiceId || !input) {
    if (hasInvalidLineItems((req.body as Record<string, unknown> | undefined)?.lineItems)) {
      res.status(400).json(invoiceLineItemsInvalidFailure());
      return;
    }
    res.status(400).json(invoiceInvalidFailure());
    return;
  }

  try {
    const response = await updateInvoice(authSession, invoiceId, input);
    if (!response?.invoice) {
      res.status(404).json(invoiceNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "invoices-module" }));
  } catch {
    res.status(500).json(failure("INVOICE_RUNTIME_ERROR", "Invoice update could not be completed."));
  }
};

export const archiveInvoiceHandler: RequestHandler = async (req, res) => {
  await runInvoiceAction(req, res, archiveInvoice, "Invoice archive could not be completed.");
};

export const markInvoiceSentHandler: RequestHandler = async (req, res) => {
  await runInvoiceAction(req, res, markInvoiceSent, "Invoice mark sent could not be completed.");
};

export const markInvoicePaidHandler: RequestHandler = async (req, res) => {
  await runInvoiceAction(req, res, markInvoicePaid, "Invoice mark paid could not be completed.");
};

export const cancelInvoiceHandler: RequestHandler = async (req, res) => {
  await runInvoiceAction(req, res, cancelInvoice, "Invoice cancel could not be completed.");
};

export const markInvoiceUncollectibleHandler: RequestHandler = async (req, res) => {
  await runInvoiceAction(req, res, markInvoiceUncollectible, "Invoice uncollectible update could not be completed.");
};

export const registerInvoicePaymentHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const invoiceId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getPaymentInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!invoiceId || !input) return void res.status(400).json(invoiceInvalidFailure());
  try {
    const response = await registerInvoicePayment(authSession, invoiceId, input);
    if (!response?.invoice) return void res.status(400).json(invoiceInvalidFailure());
    res.status(201).json(success(response, { phase: "runtime", scope: "invoice-payments" }));
  } catch {
    res.status(500).json(failure("INVOICE_PAYMENT_RUNTIME_ERROR", "Invoice payment could not be registered."));
  }
};

export const listInvoiceItemsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  try {
    const archived = req.query.archived === "true";
    const response = await listInvoiceItems(authSession, { archived });
    if (!response) return void res.status(403).json(forbiddenFailure());
    res.json(success(response, { phase: "runtime", scope: "invoice-items" }));
  } catch {
    res.status(500).json(failure("INVOICE_ITEM_RUNTIME_ERROR", "Invoice items could not be listed."));
  }
};

export const createInvoiceItemHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const input = getInvoiceItemInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!input) return void res.status(400).json(invoiceInvalidFailure());
  try {
    const response = await createInvoiceItem(authSession, input);
    if (!response?.invoiceItem) return void res.status(400).json(invoiceInvalidFailure());
    res.status(201).json(success(response, { phase: "runtime", scope: "invoice-items" }));
  } catch {
    res.status(500).json(failure("INVOICE_ITEM_RUNTIME_ERROR", "Invoice item could not be created."));
  }
};

export const updateInvoiceItemHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const itemId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getInvoiceItemInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!itemId || !input) return void res.status(400).json(invoiceInvalidFailure());
  try {
    const response = await updateInvoiceItem(authSession, itemId, input);
    if (!response?.invoiceItem) return void res.status(404).json(invoiceNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "invoice-items" }));
  } catch {
    res.status(500).json(failure("INVOICE_ITEM_RUNTIME_ERROR", "Invoice item could not be updated."));
  }
};

export const archiveInvoiceItemHandler: RequestHandler = async (req, res) => runInvoiceItemAction(req, res, archiveInvoiceItem);
export const restoreInvoiceItemHandler: RequestHandler = async (req, res) => runInvoiceItemAction(req, res, restoreInvoiceItem);

async function runInvoiceItemAction(req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1], action: typeof archiveInvoiceItem) {
  const authSession = getAuthSession(res.locals);
  const itemId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!itemId) return void res.status(400).json(invoiceInvalidFailure());
  try {
    const response = await action(authSession, itemId);
    if (!response?.invoiceItem) return void res.status(404).json(invoiceNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "invoice-items" }));
  } catch {
    res.status(500).json(failure("INVOICE_ITEM_RUNTIME_ERROR", "Invoice item archive state could not be updated."));
  }
}

export const createCreditNoteHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals); const invoiceId = typeof req.params.id === "string" ? req.params.id.trim() : ""; const input = getCreditNoteInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!invoiceId || !input) {
    if (hasInvalidLineItems((req.body as Record<string, unknown> | undefined)?.lineItems)) {
      return void res.status(400).json(creditNoteLineItemsInvalidFailure());
    }
    return void res.status(400).json(invoiceInvalidFailure());
  }
  try {
    const response = await createCreditNote(authSession, invoiceId, input);
    if (!response?.creditNote) return void res.status(404).json(invoiceNotFoundFailure());
    res.status(201).json(success(response, { phase: "runtime", scope: "credit-notes" }));
  } catch {
    res.status(500).json(failure("CREDIT_NOTE_RUNTIME_ERROR", "Credit note create could not be completed."));
  }
};

export const updateCreditNoteHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals); const creditNoteId = typeof req.params.id === "string" ? req.params.id.trim() : ""; const input = getCreditNoteInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!creditNoteId || !input) {
    if (hasInvalidLineItems((req.body as Record<string, unknown> | undefined)?.lineItems)) {
      return void res.status(400).json(creditNoteLineItemsInvalidFailure());
    }
    return void res.status(400).json(invoiceInvalidFailure());
  }
  try {
    const response = await updateCreditNote(authSession, creditNoteId, input);
    if (!response?.creditNote) return void res.status(404).json(invoiceNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "credit-notes" }));
  } catch {
    res.status(500).json(failure("CREDIT_NOTE_RUNTIME_ERROR", "Credit note update could not be completed."));
  }
};

export const issueCreditNoteHandler: RequestHandler = async (req, res) => runCreditNoteAction(req, res, issueCreditNote);
export const voidCreditNoteHandler: RequestHandler = async (req, res) => runCreditNoteAction(req, res, voidCreditNote);

async function runCreditNoteAction(req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1], action: typeof issueCreditNote) {
  const authSession = getAuthSession(res.locals); const creditNoteId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!creditNoteId) return void res.status(400).json(invoiceInvalidFailure());
  try {
    const response = await action(authSession, creditNoteId);
    if (!response?.creditNote) return void res.status(404).json(invoiceNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "credit-notes" }));
  } catch {
    res.status(500).json(failure("CREDIT_NOTE_RUNTIME_ERROR", "Credit note status update could not be completed."));
  }
}

export const downloadInvoiceDocumentHandler: RequestHandler = async (req, res) => runDownload(req, res, getInvoiceDocumentDownload, req.params.id);
export const downloadBillDocumentHandler: RequestHandler = async (req, res) => runDownload(req, res, getBillDocumentDownload, req.params.id);
export const downloadCreditNoteDocumentHandler: RequestHandler = async (req, res) => runDownload(req, res, getCreditNoteDocumentDownload, req.params.id);
export const downloadAiDeliveryDeliverableHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());
  const response = await getAiDeliveryDeliverableDownload(authSession, aiDeliveryProjectId, deliverableId);
  if (!response) return void res.status(404).json(failure("DOCUMENT_NOT_FOUND", "Document is not available."));
  res.json(success(response, { phase: "runtime", scope: "secure-downloads" }));
};

export const getAiDeliveryDeliverableDownloadReferenceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await getAiDeliveryDeliverableDownloadReference(authSession, aiDeliveryProjectId, deliverableId);
    if (!response) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-deliverables" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_DELIVERABLE_RUNTIME_ERROR", "Download reference could not be retrieved."));
  }
};

export const prepareAiDeliveryDeliverableWordPressDraftHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const publicationTargetId =
      typeof (req.body as { publicationTargetId?: unknown })?.publicationTargetId === "string"
        ? (req.body as { publicationTargetId: string }).publicationTargetId.trim()
        : undefined;
    const response = await prepareAiDeliveryDeliverableWordPressDraft(
      authSession,
      aiDeliveryProjectId,
      deliverableId,
      publicationTargetId
    );
    if (!response) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-deliverables" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_WORDPRESS_DRAFT_RUNTIME_ERROR", "WordPress draft could not be prepared."));
  }
};

export const publishAiDeliveryDeliverableToWordPressHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const publicationTargetId =
      typeof (req.body as { publicationTargetId?: unknown })?.publicationTargetId === "string"
        ? (req.body as { publicationTargetId: string }).publicationTargetId.trim()
        : undefined;
    const response = await publishAiDeliveryDeliverableToWordPress(
      authSession,
      aiDeliveryProjectId,
      deliverableId,
      publicationTargetId
    );
    if (!response) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-deliverables" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_WORDPRESS_PUBLISH_RUNTIME_ERROR", "WordPress publish could not be processed."));
  }
};

export const exportAiDeliveryDeliverableToGoogleDocHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const deliverableId = typeof req.params.deliverableId === "string" ? req.params.deliverableId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !deliverableId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await exportAiDeliveryDeliverableToGoogleDoc(authSession, aiDeliveryProjectId, deliverableId);
    if (!response) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-deliverables" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_GOOGLE_DOC_EXPORT_RUNTIME_ERROR", "Google Doc export could not be processed."));
  }
};

export const downloadAiDeliveryArticleImageHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const articleImageId = typeof req.params.imageId === "string" ? req.params.imageId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !articleImageId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());
  const response = await getAiDeliveryArticleImageDownload(authSession, aiDeliveryProjectId, articleImageId);
  if (!response) return void res.status(404).json(failure("DOCUMENT_NOT_FOUND", "Document is not available."));
  res.json(success(response, { phase: "runtime", scope: "secure-downloads" }));
};

export const getAiDeliveryArticleImageDownloadReferenceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const aiDeliveryProjectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const articleImageId = typeof req.params.imageId === "string" ? req.params.imageId.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!aiDeliveryProjectId || !articleImageId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await getAiDeliveryArticleImageDownloadReference(authSession, aiDeliveryProjectId, articleImageId);
    if (!response) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-article-images" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_ARTICLE_IMAGE_RUNTIME_ERROR", "Download reference could not be retrieved."));
  }
};

async function runDownload(req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1], action: typeof getInvoiceDocumentDownload, idValue: unknown) {
  const authSession = getAuthSession(res.locals); const id = typeof idValue === "string" ? idValue.trim() : "";
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!id) return void res.status(400).json(invoiceInvalidFailure());
  const response = await action(authSession, id);
  if (!response) return void res.status(404).json(failure("DOCUMENT_NOT_FOUND", "Document is not available."));
  res.json(success(response, { phase: "runtime", scope: "secure-downloads" }));
}

async function runInvoiceAction(
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
  action: typeof archiveInvoice,
  errorMessage: string
) {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const invoiceId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!invoiceId) {
    res.status(400).json(invoiceInvalidFailure());
    return;
  }

  try {
    const response = await action(authSession, invoiceId);
    if (!response?.invoice) {
      res.status(404).json(invoiceNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "invoices-module" }));
  } catch (error) {
    if (handleFinanceIntegrityError(res, error)) {
      return;
    }
    res.status(500).json(failure("INVOICE_RUNTIME_ERROR", errorMessage));
  }
}

export const listVendorsHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await listVendors(authSession);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "bills-module" }));
  } catch {
    res.status(500).json(failure("VENDOR_RUNTIME_ERROR", "Vendor list could not be completed."));
  }
};

export const createVendorHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const input = getVendorInput(req.body);
  if (!input) {
    res.status(400).json(billInvalidFailure());
    return;
  }

  try {
    const response = await createVendor(authSession, input);
    if (!response?.vendor) {
      res.status(400).json(billInvalidFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "bills-module" }));
  } catch {
    res.status(500).json(failure("VENDOR_RUNTIME_ERROR", "Vendor create could not be completed."));
  }
};

export const updateVendorHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const vendorId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getVendorInput(req.body);
  if (!vendorId || !input) {
    res.status(400).json(failure("VENDOR_INVALID", "Vendor request is invalid."));
    return;
  }

  try {
    const response = await updateVendor(authSession, vendorId, input);
    if (!response) {
      res.status(404).json(failure("VENDOR_NOT_FOUND", "Vendor was not found for this tenant."));
      return;
    }
    if (!response.vendor) {
      res.status(400).json(failure("VENDOR_INVALID", "Vendor request is invalid."));
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "bills-module" }));
  } catch {
    res.status(500).json(failure("VENDOR_RUNTIME_ERROR", "Vendor update could not be completed."));
  }
};

export const archiveVendorHandler: RequestHandler = async (req, res) => {
  await runVendorAction(req, res, archiveVendor, "Vendor archive could not be completed.");
};

export const restoreVendorHandler: RequestHandler = async (req, res) => {
  await runVendorAction(req, res, restoreVendor, "Vendor restore could not be completed.");
};

async function runVendorAction(
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
  action: typeof archiveVendor,
  errorMessage: string
) {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const vendorId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!vendorId) {
    res.status(400).json(failure("VENDOR_INVALID", "Vendor request is invalid."));
    return;
  }

  try {
    const response = await action(authSession, vendorId);
    if (!response?.vendor) {
      res.status(404).json(failure("VENDOR_NOT_FOUND", "Vendor was not found for this tenant."));
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "bills-module" }));
  } catch {
    res.status(500).json(failure("VENDOR_RUNTIME_ERROR", errorMessage));
  }
}

export const listBillsHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await listBills(authSession);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "bills-module" }));
  } catch {
    res.status(500).json(failure("BILL_RUNTIME_ERROR", "Bill list could not be completed."));
  }
};

export const createBillHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const input = getBillInput(req.body);
  if (!input) {
    res.status(400).json(billInvalidFailure());
    return;
  }

  try {
    const response = await createBill(authSession, input);
    if (!response?.bill) {
      res.status(400).json(billInvalidFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "bills-module" }));
  } catch {
    res.status(500).json(failure("BILL_RUNTIME_ERROR", "Bill create could not be completed."));
  }
};

export const updateBillHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const billId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getBillInput(req.body);
  if (!billId || !input) {
    res.status(400).json(billInvalidFailure());
    return;
  }

  try {
    const response = await updateBill(authSession, billId, input);
    if (!response?.bill) {
      res.status(404).json(billNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "bills-module" }));
  } catch {
    res.status(500).json(failure("BILL_RUNTIME_ERROR", "Bill update could not be completed."));
  }
};

export const uploadBillDocumentHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const billId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getBillDocumentUploadInput(req.body);
  if (!billId || !input) {
    res.status(400).json(billInvalidFailure());
    return;
  }

  try {
    const response = await uploadBillDocument(authSession, billId, input);
    if (!response?.bill) {
      res.status(404).json(billNotFoundFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "r2-storage-foundation" }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not configured")) {
      res.status(503).json(failure("R2_STORAGE_NOT_CONFIGURED", "R2 storage is not configured."));
      return;
    }
    if (message.includes("validation failed")) {
      res.status(400).json(billInvalidFailure());
      return;
    }

    res.status(500).json(failure("BILL_DOCUMENT_UPLOAD_ERROR", "Bill document upload could not be completed."));
  }
};

export const archiveBillHandler: RequestHandler = async (req, res) => {
  await runBillAction(req, res, archiveBill, "Bill archive could not be completed.");
};

export const restoreBillHandler: RequestHandler = async (req, res) => {
  await runBillAction(req, res, restoreBill, "Bill restore could not be completed.");
};

async function runBillAction(
  req: Parameters<RequestHandler>[0],
  res: Parameters<RequestHandler>[1],
  action: typeof archiveBill,
  errorMessage: string
) {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const billId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!billId) {
    res.status(400).json(billInvalidFailure());
    return;
  }

  try {
    const response = await action(authSession, billId);
    if (!response?.bill) {
      res.status(404).json(billNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "bills-module" }));
  } catch {
    res.status(500).json(failure("BILL_RUNTIME_ERROR", errorMessage));
  }
}

export const listRecurringInvoicesHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await listRecurringInvoices(authSession);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "invoices-module" }));
  } catch {
    res.status(500).json(failure("RECURRING_INVOICE_RUNTIME_ERROR", "Recurring invoice list could not be completed."));
  }
};

export const getRecurringInvoiceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const recurringInvoiceId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!recurringInvoiceId) {
    res.status(400).json(recurringInvoiceInvalidFailure());
    return;
  }

  try {
    const response = await getRecurringInvoice(authSession, recurringInvoiceId);
    if (!response?.recurringInvoice) {
      res.status(404).json(recurringInvoiceNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "invoices-module" }));
  } catch {
    res.status(500).json(failure("RECURRING_INVOICE_RUNTIME_ERROR", "Recurring invoice lookup could not be completed."));
  }
};

export const createRecurringInvoiceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const input = getRecurringInvoiceInput(req.body);
  if (!input) {
    if (hasInvalidLineItems((req.body as Record<string, unknown> | undefined)?.lineItems)) {
      res.status(400).json(recurringInvoiceLineItemsInvalidFailure());
      return;
    }
    res.status(400).json(recurringInvoiceInvalidFailure());
    return;
  }

  try {
    const response = await createRecurringInvoice(authSession, input);
    if (!response?.recurringInvoice) {
      res.status(400).json(recurringInvoiceInvalidFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "invoices-module" }));
  } catch {
    res.status(500).json(failure("RECURRING_INVOICE_RUNTIME_ERROR", "Recurring invoice create could not be completed."));
  }
};

export const updateRecurringInvoiceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const recurringInvoiceId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getRecurringInvoiceInput(req.body);
  if (!recurringInvoiceId || !input) {
    if (hasInvalidLineItems((req.body as Record<string, unknown> | undefined)?.lineItems)) {
      res.status(400).json(recurringInvoiceLineItemsInvalidFailure());
      return;
    }
    res.status(400).json(recurringInvoiceInvalidFailure());
    return;
  }

  try {
    const response = await updateRecurringInvoice(authSession, recurringInvoiceId, input);
    if (!response?.recurringInvoice) {
      res.status(404).json(recurringInvoiceNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "invoices-module" }));
  } catch {
    res.status(500).json(failure("RECURRING_INVOICE_RUNTIME_ERROR", "Recurring invoice update could not be completed."));
  }
};

export const archiveRecurringInvoiceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const recurringInvoiceId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!recurringInvoiceId) {
    res.status(400).json(recurringInvoiceInvalidFailure());
    return;
  }

  try {
    const response = await archiveRecurringInvoice(authSession, recurringInvoiceId);
    if (!response?.recurringInvoice) {
      res.status(404).json(recurringInvoiceNotFoundFailure());
      return;
    }

    res.json(success(response, { phase: "runtime", scope: "invoices-module" }));
  } catch {
    res.status(500).json(failure("RECURRING_INVOICE_RUNTIME_ERROR", "Recurring invoice archive could not be completed."));
  }
};

export const generateDueRecurringInvoiceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const recurringInvoiceId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const targetDate = parseDateInput((req.body as Record<string, unknown> | undefined)?.targetDate);
  if (!recurringInvoiceId || targetDate === undefined) {
    res.status(400).json(recurringInvoiceInvalidFailure());
    return;
  }

  try {
    const response = await generateDueRecurringInvoice(authSession, recurringInvoiceId, targetDate?.toISOString() ?? null);
    if (!response?.invoice) {
      res.status(404).json(recurringInvoiceNotFoundFailure());
      return;
    }

    res.status(201).json(success(response, { phase: "runtime", scope: "invoices-module" }));
  } catch (error) {
    if (handleFinanceIntegrityError(res, error)) {
      return;
    }
    res.status(500).json(failure("RECURRING_INVOICE_RUNTIME_ERROR", "Recurring invoice generation could not be completed."));
  }
};

const LEGACY_WORDPRESS_CONFIG_REPLACEMENT =
  "Use Client Hub publication targets: GET/POST /api/v1/clients/:clientId/publication-targets";

const LEGACY_WORDPRESS_CONFIG_META = {
  deprecated: true,
  readOnly: true,
  sunset: true,
  replacement: LEGACY_WORDPRESS_CONFIG_REPLACEMENT
};

export const getAiDeliveryWordPressConfigHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  try {
    const response = await getAiDeliveryWordPressConfigForTenant(authSession);
    if (!response) return void res.status(403).json(forbiddenFailure());
    res.setHeader("Deprecation", "true");
    res.setHeader("Link", '</api/v1/clients/{clientId}/publication-targets>; rel="successor-version"');
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-wordpress-config", ...LEGACY_WORDPRESS_CONFIG_META }));
  } catch {
    res.status(500).json(failure("WORDPRESS_CONFIG_RUNTIME_ERROR", "WordPress config retrieval could not be completed."));
  }
};

export const saveAiDeliveryWordPressConfigHandler: RequestHandler = async (_req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  res.setHeader("Deprecation", "true");
  res.setHeader("Link", '</api/v1/clients/{clientId}/publication-targets>; rel="successor-version"');
  res.status(410).json(
    failure(
      "WORDPRESS_CONFIG_DEPRECATED",
      "Tenant-level WordPress config is sunset. Configure publication targets per client in Client Hub.",
      { replacement: LEGACY_WORDPRESS_CONFIG_REPLACEMENT }
    )
  );
};

// Market Intelligence handlers

export const listMarketIntelligenceProjectsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await listMarketIntelligenceProjects(authSession);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Could not list projects."));
  }
};

export const createMarketIntelligenceProjectHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const input = getMarketIntelligenceProjectInput(req.body);
  if (!input) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project input is invalid."));
    return;
  }

  try {
    const response = await createMarketIntelligenceProject(authSession, input);
    if (!response?.project) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(201).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Project create could not be completed."));
  }
};

export const updateMarketIntelligenceProjectHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  const input = getMarketIntelligenceProjectInput(req.body);
  if (!input) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project input is invalid."));
    return;
  }

  try {
    const response = await updateMarketIntelligenceProject(authSession, projectId, input);
    if (!response?.project) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Project update could not be completed."));
  }
};

export const archiveMarketIntelligenceProjectHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  try {
    const response = await archiveMarketIntelligenceProject(authSession, projectId);
    if (!response?.project) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Project archive could not be completed."));
  }
};

export const listMarketIntelligenceSourcesHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  try {
    const response = await listMarketIntelligenceSources(authSession, projectId);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Could not list sources."));
  }
};

export const createMarketIntelligenceSourceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_SOURCE_INVALID", "Project ID is invalid."));
    return;
  }

  const input = getMarketIntelligenceSourceInput(req.body);
  if (!input) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_SOURCE_INVALID", "Source input is invalid."));
    return;
  }

  try {
    const response = await createMarketIntelligenceSource(authSession, { ...input, projectId });
    if (!response?.source) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(201).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Source create could not be completed."));
  }
};

export const updateMarketIntelligenceSourceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  const sourceId = typeof req.params.sourceId === "string" ? req.params.sourceId.trim() : "";
  if (!sourceId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_SOURCE_INVALID", "Source ID is invalid."));
    return;
  }

  const input = getMarketIntelligenceSourceInput(req.body);
  if (!input) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_SOURCE_INVALID", "Source input is invalid."));
    return;
  }

  try {
    const response = await updateMarketIntelligenceSource(authSession, sourceId, projectId, input);
    if (!response?.source) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Source update could not be completed."));
  }
};

export const archiveMarketIntelligenceSourceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  const sourceId = typeof req.params.sourceId === "string" ? req.params.sourceId.trim() : "";
  if (!sourceId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_SOURCE_INVALID", "Source ID is invalid."));
    return;
  }

  try {
    const response = await archiveMarketIntelligenceSource(authSession, sourceId, projectId);
    if (!response?.source) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Source archive could not be completed."));
  }
};

export const listMarketIntelligenceResearchRunsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  try {
    const response = await listMarketIntelligenceResearchRuns(authSession, projectId);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Could not list research runs."));
  }
};

export const createMarketIntelligenceResearchRunHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  const input = getMarketIntelligenceResearchRunInput(req.body);
  if (!input) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_RESEARCH_RUN_INVALID", "Research run input is invalid."));
    return;
  }

  try {
    const response = await createMarketIntelligenceResearchRun(authSession, projectId, input);
    if (!response?.researchRun) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(201).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Research run create could not be completed."));
  }
};

export const executeMarketIntelligenceResearchRunHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  const runId = typeof req.params.runId === "string" ? req.params.runId.trim() : "";
  if (!runId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_RESEARCH_RUN_INVALID", "Run ID is invalid."));
    return;
  }

  try {
    const response = await executeMarketIntelligenceResearchRun(authSession, runId, projectId);
    if (!response?.researchRun) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Research run execute could not be completed."));
  }
};

export const listMarketIntelligenceInsightsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  try {
    const response = await listMarketIntelligenceInsights(authSession, projectId);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Could not list insights."));
  }
};

export const createMarketIntelligenceInsightHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_INSIGHT_INVALID", "Project ID is invalid."));
    return;
  }

  const input = getMarketIntelligenceInsightInput(req.body);
  if (!input) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_INSIGHT_INVALID", "Insight input is invalid."));
    return;
  }

  try {
    const response = await createMarketIntelligenceInsight(authSession, { ...input, projectId });
    if (!response?.insight) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(201).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Insight create could not be completed."));
  }
};

export const updateMarketIntelligenceInsightHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  const insightId = typeof req.params.insightId === "string" ? req.params.insightId.trim() : "";
  if (!insightId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_INSIGHT_INVALID", "Insight ID is invalid."));
    return;
  }

  const input = getMarketIntelligenceInsightInput(req.body);
  if (!input) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_INSIGHT_INVALID", "Insight input is invalid."));
    return;
  }

  try {
    const response = await updateMarketIntelligenceInsight(authSession, insightId, projectId, input);
    if (!response?.insight) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Insight update could not be completed."));
  }
};

export const getAiDeliveryMonthlySummaryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.query.projectId === "string" ? req.query.projectId.trim() : "";
  if (!projectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await getAiDeliveryMonthlySummary(authSession, projectId);
    if (!response) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-summary" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_SUMMARY_ERROR", "Monthly summary could not be computed."));
  }
};

export const archiveMarketIntelligenceInsightHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  const insightId = typeof req.params.insightId === "string" ? req.params.insightId.trim() : "";
  if (!insightId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_INSIGHT_INVALID", "Insight ID is invalid."));
    return;
  }

  try {
    const response = await archiveMarketIntelligenceInsight(authSession, insightId, projectId);
    if (!response?.insight) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Insight archive could not be completed."));
  }
};

// ── Market Intelligence Handoff handlers ────────────────────────────────────

export const prepareMarketIntelligenceHandoffHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  const insightId = typeof req.body?.insightId === "string" ? req.body.insightId.trim() : "";
  if (!insightId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_HANDOFF_INVALID", "insightId is required and must be an APPROVED insight."));
    return;
  }

  try {
    const response = await prepareMarketIntelligenceHandoff(authSession, projectId, insightId);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    if (!response.handoff) {
      res.status(400).json(failure("MARKET_INTELLIGENCE_HANDOFF_INVALID", "Handoff could not be prepared. Ensure the insight is APPROVED."));
      return;
    }
    res.status(201).json(success(response, { phase: "runtime", scope: "market-intelligence-handoff" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Handoff prepare could not be completed."));
  }
};

export const listMarketIntelligenceHandoffsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  try {
    const response = await listMarketIntelligenceHandoffs(authSession, projectId);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence-handoff" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Handoffs list could not be retrieved."));
  }
};

export const updateMarketIntelligenceHandoffStatusHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const handoffId = typeof req.params.handoffId === "string" ? req.params.handoffId.trim() : "";
  if (!projectId || !handoffId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_HANDOFF_INVALID", "Project ID and Handoff ID are required."));
    return;
  }

  const handoffStatus = typeof req.body?.handoffStatus === "string" ? req.body.handoffStatus.trim() : "";
  if (!handoffStatus) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_HANDOFF_INVALID", "handoffStatus is required (DRAFT, READY, APPLIED, ARCHIVED)."));
    return;
  }

  try {
    const response = await updateMarketIntelligenceHandoffStatus(authSession, projectId, handoffId, { handoffStatus });
    if (!response?.handoff) {
      res.status(400).json(failure("MARKET_INTELLIGENCE_HANDOFF_INVALID", "Handoff status update failed. Check handoffStatus value."));
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence-handoff" }));
  } catch (error) {
    if ((error as { message?: string }).message === "MARKET_INTELLIGENCE_HANDOFF_STATUS_GATE_BLOCKED") {
      res.status(400).json(failure("MARKET_INTELLIGENCE_HANDOFF_STATUS_GATE_BLOCKED", "Handoff status transition is not allowed from the current state."));
      return;
    }
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Handoff status update could not be completed."));
  }
};

export const archiveMarketIntelligenceHandoffHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const handoffId = typeof req.params.handoffId === "string" ? req.params.handoffId.trim() : "";
  if (!projectId || !handoffId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_HANDOFF_INVALID", "Project ID and Handoff ID are required."));
    return;
  }

  try {
    const response = await archiveMarketIntelligenceHandoff(authSession, projectId, handoffId);
    if (!response?.handoff) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence-handoff" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Handoff archive could not be completed."));
  }
};

export const listMarketIntelligenceFindingsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  try {
    const response = await listMarketIntelligenceFindings(authSession, projectId);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence-finding" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Findings list could not be retrieved."));
  }
};

export const createMarketIntelligenceFindingHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  const input = getMarketIntelligenceFindingInput({ ...req.body, projectId });
  if (!input) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_FINDING_INVALID", "Finding input is invalid."));
    return;
  }

  try {
    const response = await createMarketIntelligenceFinding(authSession, input);
    if (!response?.finding) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(201).json(success(response, { phase: "runtime", scope: "market-intelligence-finding" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Finding create could not be completed."));
  }
};

export const updateMarketIntelligenceFindingHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const findingId = typeof req.params.findingId === "string" ? req.params.findingId.trim() : "";
  if (!projectId || !findingId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_FINDING_INVALID", "Project ID and Finding ID are required."));
    return;
  }

  const input = getMarketIntelligenceFindingInput(req.body);
  if (!input) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_FINDING_INVALID", "Finding input is invalid."));
    return;
  }

  try {
    const response = await updateMarketIntelligenceFinding(authSession, findingId, projectId, input);
    if (!response?.finding) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence-finding" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Finding update could not be completed."));
  }
};

export const archiveMarketIntelligenceFindingHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const findingId = typeof req.params.findingId === "string" ? req.params.findingId.trim() : "";
  if (!projectId || !findingId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_FINDING_INVALID", "Project ID and Finding ID are required."));
    return;
  }

  try {
    const response = await archiveMarketIntelligenceFinding(authSession, findingId, projectId);
    if (!response?.finding) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence-finding" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Finding archive could not be completed."));
  }
};

export const listMarketIntelligenceSummariesHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  try {
    const response = await listMarketIntelligenceSummaries(authSession, projectId);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence-summary" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Summaries list could not be retrieved."));
  }
};

export const generateMarketIntelligenceSummaryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  const persist = req.body?.persist === true;
  const title = typeof req.body?.title === "string" ? req.body.title : null;

  try {
    const response = await generateMarketIntelligenceSummary(authSession, projectId, { persist, title });
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(persist ? 201 : 200).json(success(response, { phase: "runtime", scope: "market-intelligence-summary" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Summary generation could not be completed."));
  }
};

export const createMarketIntelligenceSummaryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_PROJECT_INVALID", "Project ID is invalid."));
    return;
  }

  const input = getMarketIntelligenceSummaryInput(req.body);
  if (!input) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_SUMMARY_INVALID", "Summary input is invalid."));
    return;
  }

  try {
    const response = await createMarketIntelligenceSummary(authSession, projectId, input);
    if (!response?.summary) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(201).json(success(response, { phase: "runtime", scope: "market-intelligence-summary" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Summary create could not be completed."));
  }
};

export const updateMarketIntelligenceSummaryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const summaryId = typeof req.params.summaryId === "string" ? req.params.summaryId.trim() : "";
  if (!projectId || !summaryId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_SUMMARY_INVALID", "Project ID and Summary ID are required."));
    return;
  }

  const input = getMarketIntelligenceSummaryInput(req.body);
  if (!input) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_SUMMARY_INVALID", "Summary input is invalid."));
    return;
  }

  try {
    const response = await updateMarketIntelligenceSummary(authSession, summaryId, projectId, input);
    if (!response?.summary) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence-summary" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Summary update could not be completed."));
  }
};

export const finalizeMarketIntelligenceSummaryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const summaryId = typeof req.params.summaryId === "string" ? req.params.summaryId.trim() : "";
  if (!projectId || !summaryId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_SUMMARY_INVALID", "Project ID and Summary ID are required."));
    return;
  }

  try {
    const response = await finalizeMarketIntelligenceSummary(authSession, summaryId, projectId);
    if (!response?.summary) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence-summary" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Summary finalize could not be completed."));
  }
};

export const archiveMarketIntelligenceSummaryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const summaryId = typeof req.params.summaryId === "string" ? req.params.summaryId.trim() : "";
  if (!projectId || !summaryId) {
    res.status(400).json(failure("MARKET_INTELLIGENCE_SUMMARY_INVALID", "Project ID and Summary ID are required."));
    return;
  }

  try {
    const response = await archiveMarketIntelligenceSummary(authSession, summaryId, projectId);
    if (!response?.summary) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence-summary" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Summary archive could not be completed."));
  }
};

export const listAiDeliveryMiContextHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await listAiDeliveryMiContext(authSession, projectId);
    if (!response) return void res.status(403).json(forbiddenFailure());
    res.status(200).json(success(response, { phase: "runtime", scope: "ai-delivery-mi-context" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_MI_CONTEXT_ERROR", "Could not load Market Intelligence context."));
  }
};

export const applyMiHandoffToAiDeliveryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const handoffId = typeof req.body?.handoffId === "string" ? req.body.handoffId.trim() : "";
  if (!projectId || !handoffId) {
    return void res.status(400).json(failure("AI_DELIVERY_MI_CONTEXT_INVALID", "Project ID and handoff ID are required."));
  }

  try {
    const response = await applyMiHandoffToAiDelivery(authSession, projectId, handoffId);
    if (!response) return void res.status(403).json(forbiddenFailure());
    res.status(200).json(success(response, { phase: "runtime", scope: "ai-delivery-mi-context" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_MI_CONTEXT_ERROR", "Could not apply Market Intelligence context."));
  }
};

export const removeMiHandoffFromAiDeliveryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const handoffId = typeof req.params.handoffId === "string" ? req.params.handoffId.trim() : "";
  if (!projectId || !handoffId) {
    return void res.status(400).json(failure("AI_DELIVERY_MI_CONTEXT_INVALID", "Project ID and handoff ID are required."));
  }

  try {
    const response = await removeMiHandoffFromAiDelivery(authSession, projectId, handoffId);
    if (!response) return void res.status(403).json(forbiddenFailure());
    res.status(200).json(success(response, { phase: "runtime", scope: "ai-delivery-mi-context" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_MI_CONTEXT_ERROR", "Could not remove Market Intelligence context."));
  }
};

export const listFinalizedMarketIntelligenceSummariesHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const clientId = typeof req.query.clientId === "string" ? req.query.clientId.trim() : "";

  try {
    const response = await listFinalizedMarketIntelligenceSummaries(authSession, clientId || null);
    if (!response) return void res.status(403).json(forbiddenFailure());
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence-summary" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "Finalized summaries could not be listed."));
  }
};

export const listAiDeliveryMiSummaryContextHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await listAiDeliveryMiSummaryContext(authSession, projectId);
    if (!response) return void res.status(403).json(forbiddenFailure());
    res.status(200).json(success(response, { phase: "runtime", scope: "ai-delivery-mi-summary-context" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_MI_SUMMARY_CONTEXT_ERROR", "Could not load MI summary context."));
  }
};

export const getAiDeliveryRevenueChainReadinessHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await getAiDeliveryRevenueChainReadiness(authSession, projectId);
    if (!response) return void res.status(403).json(forbiddenFailure());
    res.status(200).json(success(response, { phase: "runtime", scope: "ai-delivery-revenue-chain-readiness" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_REVENUE_CHAIN_READINESS_ERROR", "Could not load delivery chain readiness."));
  }
};

export const applyFinalizedMiSummaryToAiDeliveryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const summaryId = typeof req.body?.summaryId === "string" ? req.body.summaryId.trim() : "";
  if (!projectId || !summaryId) {
    return void res.status(400).json(failure("AI_DELIVERY_MI_SUMMARY_INVALID", "Project ID and summary ID are required."));
  }

  try {
    const response = await applyFinalizedMiSummaryToAiDelivery(authSession, projectId, summaryId);
    if (!response) return void res.status(403).json(forbiddenFailure());
    res.status(200).json(success(response, { phase: "runtime", scope: "ai-delivery-mi-summary-context" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_MI_SUMMARY_CONTEXT_ERROR", "Could not apply finalized MI summary."));
  }
};

export const removeMiSummaryFromAiDeliveryHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const summaryId = typeof req.params.summaryId === "string" ? req.params.summaryId.trim() : "";
  if (!projectId || !summaryId) {
    return void res.status(400).json(failure("AI_DELIVERY_MI_SUMMARY_INVALID", "Project ID and summary ID are required."));
  }

  try {
    const response = await removeMiSummaryFromAiDelivery(authSession, projectId, summaryId);
    if (!response) return void res.status(403).json(forbiddenFailure());
    res.status(200).json(success(response, { phase: "runtime", scope: "ai-delivery-mi-summary-context" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_MI_SUMMARY_CONTEXT_ERROR", "Could not remove MI summary link."));
  }
};

export const applyFinalizedMiSummaryToAiDeliveryBriefHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const summaryId = typeof req.params.summaryId === "string" ? req.params.summaryId.trim() : "";
  if (!projectId || !summaryId) {
    return void res.status(400).json(failure("AI_DELIVERY_MI_SUMMARY_INVALID", "Project ID and summary ID are required."));
  }

  try {
    const response = await applyFinalizedMiSummaryToAiDeliveryBrief(authSession, projectId, summaryId);
    if (!response) return void res.status(403).json(forbiddenFailure());
    res.status(200).json(success(response, { phase: "runtime", scope: "ai-delivery-mi-summary-brief" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_MI_SUMMARY_CONTEXT_ERROR", "Could not apply MI summary to brief."));
  }
};

export const applyFinalizedMiSummaryToSeoContextHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const summaryId = typeof req.params.summaryId === "string" ? req.params.summaryId.trim() : "";
  if (!projectId || !summaryId) {
    return void res.status(400).json(failure("AI_DELIVERY_MI_SUMMARY_INVALID", "Project ID and summary ID are required."));
  }

  try {
    const response = await applyFinalizedMiSummaryToSeoContext(authSession, projectId, summaryId);
    if (!response) return void res.status(403).json(forbiddenFailure());
    res.status(200).json(success(response, { phase: "runtime", scope: "ai-delivery-mi-summary-seo" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_MI_SUMMARY_CONTEXT_ERROR", "Could not apply MI summary to SEO context."));
  }
};

export const applyMarketIntelligenceSummaryTargetHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  const summaryId = typeof req.params.summaryId === "string" ? req.params.summaryId.trim() : "";
  const input = getMarketIntelligenceSummaryApplyInput(req.body);
  if (!projectId || !summaryId || !input) {
    return void res.status(400).json(failure("MARKET_INTELLIGENCE_SUMMARY_APPLY_INVALID", "Project ID, summary ID, target, and aiDeliveryProjectId are required."));
  }

  try {
    const response = await applyMarketIntelligenceSummaryTarget(authSession, projectId, summaryId, input);
    if (!response) return void res.status(403).json(forbiddenFailure());
    res.status(200).json(success(response, { phase: "runtime", scope: "market-intelligence-summary-apply" }));
  } catch {
    res.status(500).json(failure("MARKET_INTELLIGENCE_RUNTIME_ERROR", "MI summary apply could not be completed."));
  }
};

const AI_DELIVERY_MONTHLY_REPORT_STATUSES = new Set(["DRAFT", "ADMIN_REVIEW", "FINAL", "ARCHIVED"]);

// Monthly Report handlers

export const getAiDeliveryMonthlyReportHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  try {
    const response = await getAiDeliveryMonthlyReport(authSession, projectId);
    if (!response) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    if (!response.report) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-report" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_REPORT_ERROR", "Monthly report could not be retrieved."));
  }
};

export const getAiDeliveryMonthlyReportMetricsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_METRICS_INVALID", "Report ID is invalid."));

  try {
    const response = await getAiDeliveryMonthlyReportMetrics(authSession, reportId);
    if (!response) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-metrics" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_METRICS_ERROR", "Monthly metrics could not be retrieved."));
  }
};

export const createAiDeliveryMonthlyReportHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.params.projectId === "string" ? req.params.projectId.trim() : "";
  if (!projectId) return void res.status(400).json(aiDeliveryProjectInvalidFailure());

  const input = getAiDeliveryMonthlyReportInput(req.body);

  try {
    const response = await createAiDeliveryMonthlyReport(authSession, projectId, input);
    if (!response) return void res.status(404).json(aiDeliveryProjectNotFoundFailure());
    res.status(201).json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-report" }));
  } catch (err) {
    if (isAiDeliveryGuardError(err)) {
      return void res.status(err.status).json(failure(err.code, err.message));
    }
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_REPORT_ERROR", "Monthly report could not be created."));
  }
};

export const importAiDeliveryMonthlyReportMetricsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_METRICS_INVALID", "Report ID is invalid."));

  const input = getAiDeliveryMonthlyMetricSnapshotInput(req.body);
  if (!input || !input.targetMonth) {
    return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_METRICS_INVALID", "Metric snapshot input is invalid."));
  }

  try {
    const response = await importAiDeliveryMonthlyReportMetrics(authSession, reportId, input);
    if (!response) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
    res.status(201).json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-metrics" }));
  } catch (err) {
    const error = err as { name?: string; code?: string; message?: string };
    console.error("[AI_DELIVERY_MONTHLY_METRICS_IMPORT_ERROR]", {
      name: error.name ?? "Error",
      code: error.code ?? null,
      message: error.message ?? "Unknown error"
    });
    if (isAiDeliveryGuardError(err)) {
      return void res.status(err.status).json(failure(err.code, err.message));
    }
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_METRICS_ERROR", "Monthly metrics could not be imported."));
  }
};

export const approveAiDeliveryMonthlyReportMetricsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_METRICS_INVALID", "Report ID is invalid."));

  const snapshotId = typeof req.params.snapshotId === "string" ? req.params.snapshotId.trim() : "";
  if (!snapshotId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_METRICS_INVALID", "Snapshot ID is invalid."));

  try {
    const response = await approveAiDeliveryMonthlyReportMetrics(authSession, reportId, snapshotId);
    if (!response) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_METRICS_NOT_FOUND", "Monthly metric snapshot not found."));
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-metrics" }));
  } catch (err) {
    if (isAiDeliveryGuardError(err)) {
      return void res.status(err.status).json(failure(err.code, err.message));
    }
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_METRICS_ERROR", "Monthly metrics snapshot could not be approved."));
  }
};

export const archiveAiDeliveryMonthlyReportMetricsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_METRICS_INVALID", "Report ID is invalid."));

  const snapshotId = typeof req.params.snapshotId === "string" ? req.params.snapshotId.trim() : "";
  if (!snapshotId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_METRICS_INVALID", "Snapshot ID is invalid."));

  try {
    const response = await archiveAiDeliveryMonthlyReportMetrics(authSession, reportId, snapshotId);
    if (!response) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_METRICS_NOT_FOUND", "Monthly metric snapshot not found."));
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-metrics" }));
  } catch (err) {
    if (isAiDeliveryGuardError(err)) {
      return void res.status(err.status).json(failure(err.code, err.message));
    }
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_METRICS_ERROR", "Monthly metrics snapshot could not be archived."));
  }
};

export const updateAiDeliveryMonthlyReportHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_REPORT_INVALID", "Report ID is invalid."));

  const input = getAiDeliveryMonthlyReportInput(req.body);

  try {
    const response = await updateAiDeliveryMonthlyReport(authSession, reportId, input);
    if (!response) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-report" }));
  } catch (err) {
    if (isAiDeliveryGuardError(err)) {
      return void res.status(err.status).json(failure(err.code, err.message));
    }
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_REPORT_ERROR", "Monthly report could not be updated."));
  }
};

export const updateAiDeliveryMonthlyReportStatusHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_REPORT_INVALID", "Report ID is invalid."));

  const statusInput = getAiDeliveryMonthlyReportStatusInput(req.body);
  if (!statusInput.status || !AI_DELIVERY_MONTHLY_REPORT_STATUSES.has(statusInput.status.toUpperCase())) {
    return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_REPORT_STATUS_INVALID", "Report status is invalid."));
  }

  try {
    const response = await updateAiDeliveryMonthlyReportStatus(authSession, reportId, statusInput);
    if (!response) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-report" }));
  } catch (err) {
    if (isAiDeliveryGuardError(err)) {
      return void res.status(err.status).json(failure(err.code, err.message));
    }
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_REPORT_ERROR", "Monthly report status could not be updated."));
  }
};

export const archiveAiDeliveryMonthlyReportHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_REPORT_INVALID", "Report ID is invalid."));

  try {
    const response = await archiveAiDeliveryMonthlyReport(authSession, reportId);
    if (!response) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-report" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_REPORT_ERROR", "Monthly report could not be archived."));
  }
};

export const restoreAiDeliveryMonthlyReportHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_REPORT_INVALID", "Report ID is invalid."));

  try {
    const response = await restoreAiDeliveryMonthlyReport(authSession, reportId);
    if (!response) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-report" }));
  } catch {
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_REPORT_ERROR", "Monthly report could not be restored."));
  }
};

export const uploadAiDeliveryMonthlyReportDocumentHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  const input = getAiDeliveryMonthlyReportUploadInput(req.body);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  if (!reportId || !input) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_REPORT_INVALID", "Report ID or upload input is invalid."));

  try {
    const response = await uploadAiDeliveryMonthlyReportDocument(authSession, reportId, input);
    if (!response) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
    res.status(201).json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-report" }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not configured")) {
      res.status(503).json(failure("R2_STORAGE_NOT_CONFIGURED", "R2 storage is not configured."));
      return;
    }
    if (message.includes("validation failed")) {
      res.status(400).json(failure("AI_DELIVERY_MONTHLY_REPORT_INVALID", "Upload validation failed."));
      return;
    }
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_REPORT_ERROR", "Monthly report document upload could not be completed."));
  }
};

export const getAiDeliveryMonthlyReportDownloadReferenceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_REPORT_INVALID", "Report ID is invalid."));

  try {
    const response = await getAiDeliveryMonthlyReportDownloadReference(authSession, reportId);
    if (!response) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-report" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_REPORT_ERROR", "Download reference could not be retrieved."));
  }
};

export const generateAiDeliveryMonthlyReportPdfHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_REPORT_INVALID", "Report ID is invalid."));

  try {
    const response = await generateAiDeliveryMonthlyReportPdfForReport(authSession, reportId);
    if (!response) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
    res.status(201).json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-report" }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not configured")) {
      res.status(503).json(failure("R2_STORAGE_NOT_CONFIGURED", "R2 storage is not configured."));
      return;
    }
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_REPORT_ERROR", "Monthly report PDF could not be generated."));
  }
};

export const generateAiDeliveryMonthlyReportRecommendationsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_REPORT_INVALID", "Report ID is invalid."));

  try {
    const response = await generateAiDeliveryMonthlyReportRecommendations(authSession, reportId);
    if (!response?.report) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-monthly-report" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_MONTHLY_REPORT_ERROR", "Monthly report recommendations could not be generated."));
  }
};

export const getAiDeliveryMonthlyReportMiContextHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_REPORT_INVALID", "Report ID is invalid."));
  const response = await getAiDeliveryMonthlyReportMiContext(authSession, reportId);
  if (!response) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
  res.status(200).json(success(response));
};

export const applyMiHandoffToMonthlyReportHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_REPORT_INVALID", "Report ID is invalid."));
  const body = req.body as AiDeliveryMonthlyReportMiApplyRequest;
  const handoffId = typeof body?.handoffId === "string" ? body.handoffId.trim() : "";
  const summaryId = typeof body?.summaryId === "string" ? body.summaryId.trim() : "";
  if (!handoffId && !summaryId) {
    return void res.status(400).json(failure("MI_CONTEXT_INVALID", "handoffId or summaryId is required."));
  }
  const response = await applyMiHandoffToMonthlyReport(authSession, reportId, body);
  if (!response) return void res.status(404).json(failure("MI_CONTEXT_NOT_FOUND", "MI context not found or not in a valid status."));
  res.status(200).json(success(response));
};

export const updateMonthlyReportMiContextDraftHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_REPORT_INVALID", "Report ID is invalid."));
  const body = req.body as AiDeliveryMonthlyReportMiDraftRequest;
  if (typeof body?.miContextDraft !== "string") {
    return void res.status(400).json(failure("MI_DRAFT_INVALID", "miContextDraft must be a string."));
  }
  const response = await updateMonthlyReportMiContextDraft(authSession, reportId, body);
  if (!response) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
  res.status(200).json(success(response));
};

export const removeMiHandoffFromMonthlyReportHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());
  const reportId = typeof req.params.reportId === "string" ? req.params.reportId.trim() : "";
  if (!reportId) return void res.status(400).json(failure("AI_DELIVERY_MONTHLY_REPORT_INVALID", "Report ID is invalid."));
  const response = await removeMiHandoffFromMonthlyReport(authSession, reportId);
  if (!response) return void res.status(404).json(failure("AI_DELIVERY_MONTHLY_REPORT_NOT_FOUND", "Monthly report not found."));
  res.status(200).json(success(response));
};

// Market Intelligence input validators

function getMarketIntelligenceProjectInput(value: unknown): MarketIntelligenceProjectInputRequest | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const obj = value as Record<string, unknown>;
  return {
    clientId: getOptionalString(obj.clientId),
    title: getOptionalString(obj.title),
    description: getOptionalString(obj.description),
    keywords: getOptionalString(obj.keywords),
    competitors: getOptionalString(obj.competitors),
    niche: getOptionalString(obj.niche),
    productServiceFocus: getOptionalString(obj.productServiceFocus),
    targetClientName: getOptionalString(obj.targetClientName),
    targetMonth: getOptionalString(obj.targetMonth),
    status: getOptionalString(obj.status)
  };
}

function getMarketIntelligenceSourceInput(value: unknown): MarketIntelligenceSourceInputRequest | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const obj = value as Record<string, unknown>;
  return {
    projectId: getOptionalString(obj.projectId),
    title: getOptionalString(obj.title),
    sourceType: getOptionalString(obj.sourceType),
    sourceUrl: getOptionalString(obj.sourceUrl),
    sourceNotes: getOptionalString(obj.sourceNotes)
  };
}

function getMarketIntelligenceResearchRunInput(value: unknown): MarketIntelligenceResearchRunInputRequest | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const obj = value as Record<string, unknown>;
  return {
    projectId: getOptionalString(obj.projectId),
    status: getOptionalString(obj.status),
    resultSummary: getOptionalString(obj.resultSummary),
    executionLog: getOptionalString(obj.executionLog)
  };
}

function getMarketIntelligenceInsightInput(value: unknown): MarketIntelligenceInsightInputRequest | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const obj = value as Record<string, unknown>;
  return {
    projectId: getOptionalString(obj.projectId),
    title: getOptionalString(obj.title),
    summary: getOptionalString(obj.summary),
    resultData: obj.resultData,
    status: getOptionalString(obj.status),
    reviewerNotes: getOptionalString(obj.reviewerNotes)
  };
}

function getMarketIntelligenceFindingInput(value: unknown): MarketIntelligenceFindingInputRequest | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const obj = value as Record<string, unknown>;
  return {
    projectId: getOptionalString(obj.projectId),
    researchRunId: getOptionalString(obj.researchRunId),
    sourceId: getOptionalString(obj.sourceId),
    findingCategory: getOptionalString(obj.findingCategory),
    findingText: getOptionalString(obj.findingText),
    priority: getOptionalString(obj.priority)
  };
}

function getMarketIntelligenceSummaryInput(value: unknown): MarketIntelligenceSummaryInputRequest | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const obj = value as Record<string, unknown>;
  return {
    title: getOptionalString(obj.title),
    summaryText: getOptionalString(obj.summaryText),
    status: getOptionalString(obj.status),
    sourceNotes: getOptionalString(obj.sourceNotes)
  };
}

function getMarketIntelligenceSummaryApplyInput(value: unknown): MarketIntelligenceSummaryApplyTargetRequest | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const obj = value as Record<string, unknown>;
  const target = getOptionalString(obj.target);
  const aiDeliveryProjectId = getOptionalString(obj.aiDeliveryProjectId);
  if (!target || !aiDeliveryProjectId) {
    return null;
  }

  const allowed = new Set(["delivery", "brief", "seo", "monthly_report"]);
  if (!allowed.has(target)) {
    return null;
  }

  return {
    target: target as MarketIntelligenceSummaryApplyTargetRequest["target"],
    aiDeliveryProjectId,
    reportId: getOptionalString(obj.reportId)
  };
}

function getAiDeliveryMonthlyReportInput(value: unknown): AiDeliveryMonthlyReportInputRequest {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  const obj = value as Record<string, unknown>;
  return {
    title: getOptionalString(obj.title),
    adminSummaryNotes: getOptionalString(obj.adminSummaryNotes),
    recommendationsText: getOptionalString(obj.recommendationsText),
    exportUrl: getOptionalString(obj.exportUrl)
  };
}

function getAiDeliveryMonthlyReportUploadInput(body: unknown): AiDeliveryMonthlyReportUploadRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const fileName = getRequiredString(value.fileName, FILE_NAME_MAX_LENGTH);
  const mimeType = getRequiredString(value.mimeType, SHORT_TEXT_FIELD_MAX_LENGTH);
  const contentBase64 = getRequiredString(value.contentBase64, BASE64_UPLOAD_MAX_LENGTH);

  if (!fileName || !mimeType || !contentBase64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(contentBase64)) {
    return null;
  }

  return { contentBase64, fileName, mimeType };
}

function getAiDeliveryMonthlyReportStatusInput(value: unknown): AiDeliveryMonthlyReportStatusRequest {
  if (typeof value !== "object" || value === null) {
    return {};
  }
  const obj = value as Record<string, unknown>;
  return {
    status: getOptionalString(obj.status)
  };
}

function getAiDeliveryMonthlyMetricSnapshotInput(value: unknown): AiDeliveryMonthlyMetricSnapshotInputRequest | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const obj = value as Record<string, unknown>;
  const sourceType = typeof obj.sourceType === "string" ? obj.sourceType.trim().toUpperCase() : "MANUAL";
  const status = typeof obj.status === "string" ? obj.status.trim().toUpperCase() : "IMPORTED";

  if (!["MANUAL", "CSV_IMPORT", "GA4", "GSC", "HYBRID"].includes(sourceType) || !["DRAFT", "IMPORTED"].includes(status)) {
    return null;
  }

  const metricFields: Array<[keyof AiDeliveryMonthlyMetricSnapshotInputRequest, unknown]> = [
    ["gscClicks", obj.gscClicks],
    ["gscImpressions", obj.gscImpressions],
    ["gscAverageCtr", obj.gscAverageCtr],
    ["gscAveragePosition", obj.gscAveragePosition],
    ["ga4Sessions", obj.ga4Sessions],
    ["ga4Users", obj.ga4Users],
    ["ga4PageViews", obj.ga4PageViews]
  ];

  for (const [field, rawValue] of metricFields) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    if (typeof rawValue !== "number" || !Number.isFinite(rawValue) || rawValue < 0) {
      return null;
    }

    if ((field === "gscAverageCtr" || field === "gscAveragePosition") && rawValue > Number.MAX_SAFE_INTEGER) {
      return null;
    }
  }

  return {
    targetMonth: getOptionalString(obj.targetMonth) ?? undefined,
    sourceType: sourceType as AiDeliveryMonthlyMetricSnapshotInputRequest["sourceType"],
    status: status as "DRAFT" | "IMPORTED",
    gscClicks: typeof obj.gscClicks === "number" ? obj.gscClicks : undefined,
    gscImpressions: typeof obj.gscImpressions === "number" ? obj.gscImpressions : undefined,
    gscAverageCtr: typeof obj.gscAverageCtr === "number" ? obj.gscAverageCtr : undefined,
    gscAveragePosition: typeof obj.gscAveragePosition === "number" ? obj.gscAveragePosition : undefined,
    ga4Sessions: typeof obj.ga4Sessions === "number" ? obj.ga4Sessions : undefined,
    ga4Users: typeof obj.ga4Users === "number" ? obj.ga4Users : undefined,
    ga4PageViews: typeof obj.ga4PageViews === "number" ? obj.ga4PageViews : undefined,
    notes: getOptionalString(obj.notes)
  };
}

function getAiKnowledgeItemInput(body: unknown): AiKnowledgeItemInputRequest | null {
  if (!body || typeof body !== "object") return null;
  const obj = body as Record<string, unknown>;
  const scope = typeof obj.scope === "string" ? obj.scope.trim() : "";
  const type = typeof obj.type === "string" ? obj.type.trim() : "";
  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  if (!scope || !type || !title) return null;

  return {
    clientId: obj.clientId === null ? null : getOptionalString(obj.clientId),
    aiDeliveryProjectId: obj.aiDeliveryProjectId === null ? null : getOptionalString(obj.aiDeliveryProjectId),
    scope: scope as AiKnowledgeItemInputRequest["scope"],
    type: type as AiKnowledgeItemInputRequest["type"],
    status: typeof obj.status === "string" ? (obj.status.trim().toUpperCase() as AiKnowledgeItemInputRequest["status"]) : undefined,
    title,
    summary: obj.summary === null ? null : getOptionalString(obj.summary),
    body: obj.body === null ? null : getOptionalString(obj.body),
    sourceType: obj.sourceType === null ? null : getOptionalString(obj.sourceType),
    sourceUrl: obj.sourceUrl === null ? null : getOptionalString(obj.sourceUrl),
    sourceDate: obj.sourceDate === null ? null : getOptionalString(obj.sourceDate),
    confidence: obj.confidence === null ? null : getOptionalString(obj.confidence),
    expiresAt: obj.expiresAt === null ? null : getOptionalString(obj.expiresAt),
    evergreen: typeof obj.evergreen === "boolean" ? obj.evergreen : undefined,
    allowedForPrompt: typeof obj.allowedForPrompt === "boolean" ? obj.allowedForPrompt : undefined,
    clientVisible: typeof obj.clientVisible === "boolean" ? obj.clientVisible : undefined,
    changeReason: obj.changeReason === null ? null : getOptionalString(obj.changeReason)
  };
}

function getAiKnowledgePromoteInput(body: unknown): AiKnowledgePromoteInputRequest | null {
  if (!body || typeof body !== "object") return null;
  const obj = body as Record<string, unknown>;
  const sourceType = typeof obj.sourceType === "string" ? obj.sourceType.trim() : "";
  const sourceId = typeof obj.sourceId === "string" ? obj.sourceId.trim() : "";
  const aiDeliveryProjectId = typeof obj.aiDeliveryProjectId === "string" ? obj.aiDeliveryProjectId.trim() : "";
  if (!sourceType || !sourceId || !aiDeliveryProjectId) return null;

  return {
    sourceType: sourceType as AiKnowledgePromoteInputRequest["sourceType"],
    sourceId,
    aiDeliveryProjectId,
    scope: typeof obj.scope === "string" ? (obj.scope.trim().toUpperCase() as AiKnowledgePromoteInputRequest["scope"]) : undefined,
    type: typeof obj.type === "string" ? (obj.type.trim().toUpperCase() as AiKnowledgePromoteInputRequest["type"]) : undefined,
    status: typeof obj.status === "string" ? (obj.status.trim().toUpperCase() as AiKnowledgePromoteInputRequest["status"]) : undefined,
    allowedForPrompt: typeof obj.allowedForPrompt === "boolean" ? obj.allowedForPrompt : undefined,
    clientVisible: typeof obj.clientVisible === "boolean" ? obj.clientVisible : undefined,
    changeReason: obj.changeReason === null ? null : getOptionalString(obj.changeReason)
  };
}

function getAiContextPreviewInput(body: unknown): AiContextPreviewInputRequest | null {
  if (!body || typeof body !== "object") return null;
  const obj = body as Record<string, unknown>;
  const workflowType = typeof obj.workflowType === "string" ? obj.workflowType.trim() : "";
  if (!workflowType) return null;

  const requestedKnowledgeTypes = Array.isArray(obj.requestedKnowledgeTypes)
    ? obj.requestedKnowledgeTypes.filter((value): value is AiKnowledgeType => typeof value === "string")
    : undefined;

  return {
    clientId: obj.clientId === null ? null : getOptionalString(obj.clientId),
    aiDeliveryProjectId: obj.aiDeliveryProjectId === null ? null : getOptionalString(obj.aiDeliveryProjectId),
    workflowType,
    requestedKnowledgeTypes,
    includeRaw: typeof obj.includeRaw === "boolean" ? obj.includeRaw : undefined,
    includeExpired: typeof obj.includeExpired === "boolean" ? obj.includeExpired : undefined,
    maxTokens: typeof obj.maxTokens === "number" && Number.isFinite(obj.maxTokens) ? obj.maxTokens : undefined,
    oneOffInstruction: obj.oneOffInstruction === null ? null : getOptionalString(obj.oneOffInstruction),
    saveSnapshot: typeof obj.saveSnapshot === "boolean" ? obj.saveSnapshot : undefined
  };
}

export const listAiKnowledgeItemsHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  try {
    const response = await listAiKnowledgeItems(authSession, req.query as Record<string, string>);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.json(success(response, { phase: "runtime", scope: "ai-operating-layer-knowledge" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_KNOWLEDGE_RUNTIME_ERROR", "AI knowledge list could not be completed."));
  }
};

export const createAiKnowledgeItemHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const input = getAiKnowledgeItemInput(req.body);
  if (!input) {
    res.status(400).json(failure("AI_KNOWLEDGE_INPUT_INVALID", "title, scope, and type are required."));
    return;
  }

  try {
    const response = await createAiKnowledgeItem(authSession, input);
    if (!response?.knowledgeItem) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.status(201).json(success(response, { phase: "runtime", scope: "ai-operating-layer-knowledge" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_KNOWLEDGE_RUNTIME_ERROR", "AI knowledge create could not be completed."));
  }
};

export const updateAiKnowledgeItemHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const knowledgeItemId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  const input = getAiKnowledgeItemInput(req.body);
  if (!knowledgeItemId || !input) {
    res.status(400).json(failure("AI_KNOWLEDGE_INPUT_INVALID", "Knowledge item id and valid input are required."));
    return;
  }

  try {
    const response = await updateAiKnowledgeItem(authSession, knowledgeItemId, input);
    if (!response?.knowledgeItem) {
      res.status(404).json(failure("AI_KNOWLEDGE_NOT_FOUND", "Knowledge item was not found."));
      return;
    }
    res.json(success(response, { phase: "runtime", scope: "ai-operating-layer-knowledge" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_KNOWLEDGE_RUNTIME_ERROR", "AI knowledge update could not be completed."));
  }
};

export const promoteAiKnowledgeItemHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const input = getAiKnowledgePromoteInput(req.body);
  if (!input) {
    res.status(400).json(failure("AI_KNOWLEDGE_PROMOTE_INPUT_INVALID", "sourceType, sourceId, and aiDeliveryProjectId are required."));
    return;
  }

  try {
    const response = await promoteAiDeliverySourceToKnowledgeItem(authSession, input);
    if (!response?.knowledgeItem) {
      res.status(404).json(failure("AI_KNOWLEDGE_PROMOTE_SOURCE_NOT_FOUND", "Promotion source was not found."));
      return;
    }
    res.status(201).json(success(response, { phase: "runtime", scope: "ai-operating-layer-knowledge" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_KNOWLEDGE_RUNTIME_ERROR", "AI knowledge promotion could not be completed."));
  }
};

export const previewAiContextHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) {
    res.status(401).json(unauthorizedFailure());
    return;
  }

  const input = getAiContextPreviewInput(req.body);
  if (!input) {
    res.status(400).json(failure("AI_CONTEXT_PREVIEW_INPUT_INVALID", "workflowType is required."));
    return;
  }

  try {
    const response = await previewAiContext(authSession, input);
    if (!response) {
      res.status(403).json(forbiddenFailure());
      return;
    }
    res.json(success(response, { phase: "runtime", scope: "ai-operating-layer-context-preview" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_CONTEXT_PREVIEW_RUNTIME_ERROR", "AI context preview could not be completed."));
  }
};

export const generateAiDeliveryContentPlanPdfHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!projectId) return void res.status(400).json(failure("AI_DELIVERY_CONTENT_PLAN_INVALID", "Project ID is invalid."));

  try {
    const response = await generateAiDeliveryContentPlanPdfForProject(authSession, projectId);
    if (!response) return void res.status(404).json(failure("AI_DELIVERY_CONTENT_PLAN_NOT_FOUND", "Content plan not found."));
    res.status(201).json(success(response, { phase: "runtime", scope: "ai-delivery-content-plan" }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not configured")) {
      res.status(503).json(failure("R2_STORAGE_NOT_CONFIGURED", "R2 storage is not configured."));
      return;
    }
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_CONTENT_PLAN_ERROR", "Content plan PDF could not be generated."));
  }
};

export const getAiDeliveryContentPlanDownloadReferenceHandler: RequestHandler = async (req, res) => {
  const authSession = getAuthSession(res.locals);
  if (!authSession) return void res.status(401).json(unauthorizedFailure());

  const projectId = typeof req.params.id === "string" ? req.params.id.trim() : "";
  if (!projectId) return void res.status(400).json(failure("AI_DELIVERY_CONTENT_PLAN_INVALID", "Project ID is invalid."));

  try {
    const response = await getAiDeliveryContentPlanDownloadReference(authSession, projectId);
    if (!response) return void res.status(404).json(failure("AI_DELIVERY_CONTENT_PLAN_NOT_FOUND", "Content plan not found."));
    res.json(success(response, { phase: "runtime", scope: "ai-delivery-content-plan" }));
  } catch (error) {
    if (handleAiDeliveryGuardError(res, error)) return;
    res.status(500).json(failure("AI_DELIVERY_CONTENT_PLAN_ERROR", "Download reference could not be retrieved."));
  }
};
