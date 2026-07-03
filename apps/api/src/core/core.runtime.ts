import type { Prisma } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type {
  AiDeliveryArticleImageUploadRequest,
  AiDeliveryArticleImageInputRequest,
  AiDeliveryArticleImageResponse,
  AiDeliveryArticleImagesResponse,
  AiDeliveryContentDraftInputRequest,
  AiDeliveryContentDraftResponse,
  AiDeliveryContentDraftsResponse,
  AiDeliveryProjectInputRequest,
  AiDeliveryProjectResponse,
  AiDeliveryProjectsResponse,
  AiDeliveryResearchRequestInputRequest,
  AiDeliveryResearchRequestResponse,
  AiDeliveryResearchRequestsResponse,
  AiDeliveryResearchSummaryApplyResponse,
  AiDeliveryResearchSummaryInputRequest,
  AiDeliveryResearchSummaryResponse,
  AiDeliveryResearchSummariesResponse,
  AiDeliveryResearchSourceInputRequest,
  AiDeliveryResearchSourceResponse,
  AiDeliveryResearchSourcesResponse,
  AiDeliveryWorkflowRunInputRequest,
  AiDeliveryWorkflowRunResponse,
  AiDeliveryWorkflowRunsResponse,
  AiDeliveryDeliverableInputRequest,
  AiDeliveryDeliverableUploadRequest,
  AiDeliveryDeliverableResponse,
  AiDeliveryDeliverablesResponse,
  AiDeliveryDeliverableDownloadReferenceResponse,
  AiDeliveryWordPressDraftResponse,
  AiDeliveryDeliverableReviewInputRequest,
  AiDeliveryDeliverableReviewResponse,
  AiDeliveryDeliverableReviewsResponse,
  AiDeliveryMonthlySummaryResponse,
  AiDeliveryMonthlyReportSummary,
  AiDeliveryMonthlyReportResponse,
  AiDeliveryMonthlyReportInputRequest,
  AiDeliveryMonthlyReportUploadRequest,
  AiDeliveryMonthlyReportDownloadReferenceResponse,
  AiDeliveryMonthlyReportGeneratePdfResponse,
  AiDeliveryMonthlyReportStatusRequest,
  AiDeliveryMonthlyMetricSnapshotSummary,
  AiDeliveryMonthlyMetricSnapshotInputRequest,
  AiDeliveryMonthlyMetricsTrendMonthSummary,
  AiDeliveryMonthlyMetricsTrendSummary,
  AiDeliveryMonthlyMetricsSummary,
  AiDeliveryMonthlyMetricsResponse,
  AiDeliveryMonthlyMetricSnapshotResponse,
  MonthlyMetricSourceType,
  MonthlyMetricSnapshotStatus,
  BillDocumentUploadRequest,
  BillInputRequest,
  BillResponse,
  BillsResponse,
  ClientInputRequest,
  ClientResponse,
  ClientsResponse,
  CompanyProfileResponse,
  CompanyProfileUpdateRequest,
  CreditNoteInputRequest,
  CreditNoteLineItemInputRequest,
  CreditNoteResponse,
  CreditNotesResponse,
  DocumentDownloadResponse,
  InvoiceInputRequest,
  InvoiceItemInputRequest,
  InvoiceItemResponse,
  InvoiceItemsResponse,
  InvoicePaymentInputRequest,
  InvoicePaymentResponse,
  InvoiceResponse,
  InvoicesResponse,
  ProjectDocumentResponse,
  ProjectDocumentsResponse,
  ProjectDocumentUploadRequest,
  ProjectInputRequest,
  ProjectResponse,
  ProjectsResponse,
  RecurringInvoiceInputRequest,
  RecurringInvoiceResponse,
  RecurringInvoicesResponse,
  TaskInputRequest,
  TaskResponse,
  TasksResponse,
  VendorInputRequest,
  VendorResponse,
  VendorsResponse,
  MarketIntelligenceProjectSummary,
  MarketIntelligenceProjectResponse,
  MarketIntelligenceProjectsResponse,
  MarketIntelligenceProjectInputRequest,
  MarketIntelligenceSourceSummary,
  MarketIntelligenceSourceResponse,
  MarketIntelligenceSourcesResponse,
  MarketIntelligenceSourceInputRequest,
  MarketIntelligenceResearchRunSummary,
  MarketIntelligenceResearchRunResponse,
  MarketIntelligenceResearchRunsResponse,
  MarketIntelligenceResearchRunInputRequest,
  MarketIntelligenceInsightSummary,
  MarketIntelligenceInsightResponse,
  MarketIntelligenceInsightsResponse,
  MarketIntelligenceInsightInputRequest,
  MarketIntelligenceHandoffSummary,
  MarketIntelligenceHandoffResponse,
  MarketIntelligenceHandoffsResponse,
  MarketIntelligenceHandoffStatusRequest,
  AiDeliveryMiContextResponse,
  AiDeliveryGoogleDocExportResponse,
  AiDeliveryMonthlyReportMiContextResponse,
  AiDeliveryMonthlyReportMiApplyRequest,
  AiDeliveryMonthlyReportMiDraftRequest
} from "./core.types";
import type { AuthResolvedSessionContext } from "../auth/types";
import {
  getPrivateStorageDownloadReference,
  putPrivateStorageObject
} from "../storage/private-storage.service";
import { generateAiDeliveryMonthlyReportPdf } from "./monthly-report-pdf.service";
import { generateAiDeliveryContentPlanPdf } from "./content-plan-pdf.service";
import { recordAiDeliverySystemEvent } from "../services/system-events.service";
import { recordPlatformAuditEvent } from "../security/audit-log.service";
import type { AiDeliveryWordPressPublishResult } from "../services/wordpress.service";
import { getAiProviderConfig } from "../config";
import {
  createAiDeliveryWorkflowExecutionAdapter,
  type AiDeliveryWorkflowExecutionContentPlanItemContext,
  type AiDeliveryWorkflowExecutionKnowledgeContext,
  type AiDeliveryGeneratedContentPlanItem,
  type AiDeliveryWorkflowExecutionMiHandoffContext,
  type AiDeliveryWorkflowExecutionResearchSummaryContext,
  type AiDeliveryWorkflowExecutionSourceContext
} from "./ai-delivery-workflow-execution.adapter";
import type { AiWorkflowResultV1 } from "./ai-delivery-workflow-result.contract";
import { buildAiWorkflowKnowledgeContext } from "./ai-context-builder.service";
import {
  getDecryptedPublicationTargetPassword,
  normalizeWebsiteUrl,
  recordPublicationLog,
  resolvePublicationTargetForClient
} from "./client-publication.runtime";
import { linkDeliveryRevenueAttribution } from "../finance/finance-attribution.service";
import { syncBillToFinanceEvent, syncInvoiceToFinanceEvent } from "../finance/finance-sync.service";

const prisma = createPrismaClient();

type PrismaTx = Prisma.TransactionClient;
type TaskPriority = "LOW" | "NORMAL" | "HIGH";
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskRecurringType = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "VOIDED" | "UNCOLLECTIBLE";
type AiDeliveryWorkflowRunStatus = "DRAFT" | "READY" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "FAILED" | "ARCHIVED";
type AiDeliveryContentPlanStatus = "DRAFT" | "CLIENT_REVIEW_REQUESTED" | "CLIENT_CHANGES_REQUESTED" | "CLIENT_APPROVED";
type AiDeliveryContentPlanItemApprovalStatus = "DRAFT" | "CLIENT_CHANGES_REQUESTED" | "CLIENT_APPROVED";
type AiDeliveryResearchRequestStatus = "DRAFT" | "READY" | "IN_REVIEW" | "COMPLETED" | "ARCHIVED";
type AiDeliveryResearchSummaryStatus = "DRAFT" | "IN_REVIEW" | "FINALIZED" | "ARCHIVED";
type AiDeliveryResearchSourceStatus = "PROPOSED" | "APPROVED" | "REJECTED" | "ARCHIVED";
type AiDeliveryResearchSourceType = "WEBSITE" | "DOCUMENT" | "OTHER";
type AiDeliveryContentDraftStatus = "DRAFT" | "READY_FOR_REVIEW" | "APPROVED" | "CHANGES_REQUESTED" | "ARCHIVED";
type AiDeliveryArticleImageStatus = "DRAFT" | "READY_FOR_GENERATION" | "PREVIEW_READY" | "APPROVED" | "FINAL_READY" | "CHANGES_REQUESTED" | "ARCHIVED";
// Deliverable types for AI Delivery
type AiDeliveryDeliverableDeliveryType = "CONTENT_PACKAGE" | "ARTICLE_DRAFT" | "ARTICLE_IMAGE" | "CLIENT_HANDOFF" | "OTHER";
type AiDeliveryDeliverableStatus = "DRAFT" | "READY" | "DELIVERED" | "REVISION_REQUESTED" | "ACCEPTED" | "ARCHIVED";
type AiDeliveryDeliverableReviewStatus = "NOT_STARTED" | "ADMIN_REVIEW" | "CHANGES_REQUESTED" | "APPROVED" | "ARCHIVED";
type CreditNoteStatus = "DRAFT" | "ISSUED" | "VOIDED";
type PaymentMethod = "CASH" | "REVOLUT_BANK" | "WISE_BANK" | "REVOLUT_CARD" | "WISE_CARD" | "CARD_PROCESSOR" | "OTHER";
type RecurringInvoiceInterval = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
type BillPaymentForm = "CASH" | "REVOLUT_BANK" | "WISE_BANK" | "REVOLUT_CARD" | "WISE_CARD" | "OTHER";
const AI_DELIVERY_WORKFLOW_RUN_STATUSES: AiDeliveryWorkflowRunStatus[] = ["DRAFT", "READY", "IN_PROGRESS", "REVIEW", "COMPLETED", "FAILED", "ARCHIVED"];
const AI_DELIVERY_WORKFLOW_RUN_STATUS_ORDER: AiDeliveryWorkflowRunStatus[] = ["DRAFT", "READY", "IN_PROGRESS", "REVIEW", "COMPLETED", "ARCHIVED"];
const AI_DELIVERY_RESEARCH_REQUEST_STATUSES: AiDeliveryResearchRequestStatus[] = ["DRAFT", "READY", "IN_REVIEW", "COMPLETED", "ARCHIVED"];
const AI_DELIVERY_RESEARCH_SUMMARY_STATUSES: AiDeliveryResearchSummaryStatus[] = ["DRAFT", "IN_REVIEW", "FINALIZED", "ARCHIVED"];
const AI_DELIVERY_RESEARCH_SOURCE_STATUSES: AiDeliveryResearchSourceStatus[] = ["PROPOSED", "APPROVED", "REJECTED", "ARCHIVED"];
const AI_DELIVERY_RESEARCH_SOURCE_TYPES: AiDeliveryResearchSourceType[] = ["WEBSITE", "DOCUMENT", "OTHER"];

export class AiDeliveryGuardError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AiDeliveryGuardError";
    this.status = status;
    this.code = code;
  }
}

export function isAiDeliveryGuardError(error: unknown): error is AiDeliveryGuardError {
  return error instanceof AiDeliveryGuardError;
}

function throwAiDeliveryBadRequest(code: string, message: string): never {
  throw new AiDeliveryGuardError(400, code, message);
}

function throwAiDeliveryConflict(code: string, message: string): never {
  throw new AiDeliveryGuardError(409, code, message);
}

export class FinanceIntegrityError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "FinanceIntegrityError";
    this.status = status;
    this.code = code;
  }
}

export function isFinanceIntegrityError(error: unknown): error is FinanceIntegrityError {
  return error instanceof FinanceIntegrityError;
}

function throwFinanceConflict(code: string, message: string): never {
  throw new FinanceIntegrityError(409, code, message);
}
type ClientUserAccessSummary = {
  id: string;
  clientId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    status: string;
  };
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};
type AiDeliveryProjectDelegate = {
  findFirst: (args: unknown) => Promise<unknown>;
  findMany: (args: unknown) => Promise<unknown[]>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
};

function toNullableString(value: string | null | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseAiDeliveryTargetMonth(value: string): Date | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatAiDeliveryTargetMonth(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 7);
}

function getAiDeliveryProjectDelegate(client: PrismaTx | typeof prisma): AiDeliveryProjectDelegate {
  return (client as unknown as { aiDeliveryProject: AiDeliveryProjectDelegate }).aiDeliveryProject;
}

function getAiDeliveryArticleImageDelegate(client: PrismaTx | typeof prisma) {
  return (client as unknown as { aiDeliveryArticleImage: { findFirst: (args: unknown) => Promise<unknown>; findMany: (args: unknown) => Promise<unknown[]>; create: (args: unknown) => Promise<unknown>; update: (args: unknown) => Promise<unknown>; } }).aiDeliveryArticleImage;
}

function getAiDeliveryResearchRequestDelegate(client: PrismaTx | typeof prisma) {
  return (client as unknown as { aiDeliveryResearchRequest: { findFirst: (args: unknown) => Promise<unknown>; findMany: (args: unknown) => Promise<unknown[]>; create: (args: unknown) => Promise<unknown>; update: (args: unknown) => Promise<unknown>; } }).aiDeliveryResearchRequest;
}

function getAiDeliveryResearchSourceDelegate(client: PrismaTx | typeof prisma) {
  return (client as unknown as { aiDeliveryResearchSource: { findFirst: (args: unknown) => Promise<unknown>; findMany: (args: unknown) => Promise<unknown[]>; create: (args: unknown) => Promise<unknown>; update: (args: unknown) => Promise<unknown>; } }).aiDeliveryResearchSource;
}

function getAiDeliveryResearchSummaryDelegate(client: PrismaTx | typeof prisma) {
  return (client as unknown as { aiDeliveryResearchSummary: { findFirst: (args: unknown) => Promise<unknown>; findMany: (args: unknown) => Promise<unknown[]>; create: (args: unknown) => Promise<unknown>; update: (args: unknown) => Promise<unknown>; } }).aiDeliveryResearchSummary;
}

function toDateString(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

function toCompanyProfileSummary(profile: {
  id: string;
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  country: string | null;
  registrationNumber: string | null;
  billingAddress: string | null;
  paymentInstructions: string | null;
  logoUrl: string | null;
  isActive: boolean;
  currency: string;
  invoiceTemplateKey: string;
  invoicePrefix: string | null;
  creditNotePrefix: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: profile.id,
    name: profile.name,
    legalName: profile.legalName,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    taxId: profile.taxId,
    country: profile.country,
    registrationNumber: profile.registrationNumber,
    billingAddress: profile.billingAddress,
    paymentInstructions: profile.paymentInstructions,
    logoUrl: profile.logoUrl,
    isActive: profile.isActive,
    currency: profile.currency,
    invoiceTemplateKey: profile.invoiceTemplateKey,
    invoicePrefix: profile.invoicePrefix,
    creditNotePrefix: profile.creditNotePrefix,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  };
}

function toClientSummary(client: {
  id: string;
  name: string;
  email: string | null;
  website: string | null;
  billingDetails: string | null;
  contactPerson: string | null;
  taxId: string | null;
  country: string | null;
  clientKind: string;
  legalEntityName: string | null;
  accountGroupName: string | null;
  migrationStatus: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    projects: number;
  };
}) {
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    website: client.website,
    contactPerson: client.contactPerson,
    billingAddress: client.billingDetails,
    taxId: client.taxId,
    country: client.country,
    clientKind: client.clientKind as "AGENCY_CLIENT" | "OWN_DOMAIN",
    legalEntityName: client.legalEntityName,
    accountGroupName: client.accountGroupName,
    migrationStatus: client.migrationStatus as "ACTIVE" | "PLANNED_LICENSEE_TENANT" | "MIGRATED",
    isArchived: client.isArchived,
    projectCount: client._count.projects,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString()
  };
}

function toProjectSummary(project: {
  id: string;
  clientId: string | null;
  client: {
    id: string;
    name: string;
  } | null;
  name: string;
  description: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  status: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    tasks: number;
  };
  taskCount?: number;
  openTaskCount?: number;
}) {
  return {
    id: project.id,
    clientId: project.clientId,
    client: project.client
      ? {
          id: project.client.id,
          name: project.client.name
        }
      : null,
    name: project.name,
    description: project.description,
    startDate: toDateString(project.startDate),
    dueDate: toDateString(project.dueDate),
    status: project.status,
    isArchived: project.isArchived,
    taskCount: project.taskCount ?? project._count?.tasks ?? 0,
    openTaskCount: project.openTaskCount ?? 0,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}

const aiDeliveryProjectSelect = {
  id: true,
  clientId: true,
  client: {
    select: {
      id: true,
      name: true
    }
  },
  projectId: true,
  project: {
    select: {
      id: true,
      name: true
    }
  },
  name: true,
  targetMonth: true,
  plannedContentScopeNotes: true,
  isArchived: true,
  brief: {
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true
    }
  },
  createdAt: true,
  updatedAt: true
} as const;

function toAiDeliveryProjectSummary(aiDeliveryProject: {
  id: string;
  clientId: string;
  client: { id: string; name: string } | null;
  projectId: string | null;
  project: { id: string; name: string } | null;
  name: string;
  targetMonth: Date | string;
  plannedContentScopeNotes: string | null;
  isArchived: boolean;
  brief: { id: string; status: string; createdAt: Date; updatedAt: Date } | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: aiDeliveryProject.id,
    clientId: aiDeliveryProject.clientId,
    client: aiDeliveryProject.client
      ? {
          id: aiDeliveryProject.client.id,
          name: aiDeliveryProject.client.name
        }
      : null,
    projectId: aiDeliveryProject.projectId,
    project: aiDeliveryProject.project
      ? {
          id: aiDeliveryProject.project.id,
          name: aiDeliveryProject.project.name
        }
      : null,
    name: aiDeliveryProject.name,
    targetMonth: formatAiDeliveryTargetMonth(aiDeliveryProject.targetMonth),
    plannedContentScopeNotes: aiDeliveryProject.plannedContentScopeNotes,
    isArchived: aiDeliveryProject.isArchived,
    brief: aiDeliveryProject.brief
      ? {
          id: aiDeliveryProject.brief.id,
          status: aiDeliveryProject.brief.status,
          createdAt: aiDeliveryProject.brief.createdAt.toISOString(),
          updatedAt: aiDeliveryProject.brief.updatedAt.toISOString()
        }
      : null,
    createdAt: aiDeliveryProject.createdAt.toISOString(),
    updatedAt: aiDeliveryProject.updatedAt.toISOString()
  };
}

function toTaskSummary(task: {
  id: string;
  projectId: string | null;
  project: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
    } | null;
  } | null;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: Date | null;
  recurringType: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: task.id,
    projectId: task.projectId,
    project: task.project
      ? {
          id: task.project.id,
          name: task.project.name,
          client: task.project.client
            ? {
                id: task.project.client.id,
                name: task.project.client.name
              }
            : null
        }
      : null,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: toDateString(task.dueDate),
    recurringType: task.recurringType,
    isArchived: task.isArchived,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString()
  };
}

function getActiveTenantId(authSession: AuthResolvedSessionContext): string | null {
  return authSession.tenantContext.activeMembership?.tenantId ?? null;
}

function userHasActiveTenantRole(authSession: AuthResolvedSessionContext, roles: string[]): boolean {
  return Boolean(authSession.tenantContext.activeMembership?.roles.some((role) => roles.includes(role)));
}

function toClientUserAccessSummary(access: {
  id: string;
  clientId: string;
  user: { id: string; email: string; name: string | null; status: string };
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ClientUserAccessSummary {
  return {
    id: access.id,
    clientId: access.clientId,
    user: access.user,
    isArchived: access.isArchived,
    createdAt: access.createdAt.toISOString(),
    updatedAt: access.updatedAt.toISOString()
  };
}

export async function userCanAccessClient(
  authSession: AuthResolvedSessionContext,
  clientId: string
): Promise<boolean> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return false;
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { id: true }
  });

  if (!client) {
    return false;
  }

  if (userHasActiveTenantRole(authSession, ["owner", "admin"])) {
    return true;
  }

  const access = await prisma.clientUserAccess.findFirst({
    where: {
      tenantId,
      clientId,
      userId: authSession.user.id,
      isArchived: false
    },
    select: { id: true }
  });

  return Boolean(access);
}

function toProjectStatus(value: string | undefined | null): string {
  return value === "Paused" || value === "Completed" || value === "Archived" ? value : "Active";
}

export async function getCompanyProfile(authSession: AuthResolvedSessionContext): Promise<CompanyProfileResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }
  const companyProfile = await prisma.companyProfile.findFirst({
    where: {
      tenantId,
      isActive: true
    },
    orderBy: {
      updatedAt: "desc"
    }
  });

  return {
    companyProfile: companyProfile ? toCompanyProfileSummary(companyProfile) : null
  };
}

export async function saveCompanyProfile(
  authSession: AuthResolvedSessionContext,
  input: Required<Pick<CompanyProfileUpdateRequest, "name">> & CompanyProfileUpdateRequest
): Promise<CompanyProfileResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.companyProfile.findFirst({
      where: {
        tenantId
      },
      orderBy: {
        updatedAt: "desc"
      },
      select: {
        id: true
      }
    });

    if (existing) {
      const updated = await tx.companyProfile.update({
        where: {
          id: existing.id
        },
        data: {
          name: input.name,
          legalName: toNullableString(input.legalName),
          email: toNullableString(input.email),
          phone: toNullableString(input.phone),
          website: toNullableString(input.website),
          taxId: toNullableString(input.taxId),
          country: toNullableString(input.country),
          registrationNumber: toNullableString(input.registrationNumber),
          billingAddress: toNullableString(input.billingAddress),
          paymentInstructions: toNullableString(input.paymentInstructions),
          logoUrl: toNullableString(input.logoUrl),
          currency: input.currency ?? "USD",
          invoiceTemplateKey: input.invoiceTemplateKey ?? "classic",
          invoicePrefix: toNullableString(input.invoicePrefix) ?? "DCA-INV",
          creditNotePrefix: toNullableString(input.creditNotePrefix) ?? "DCA-CN",
          isActive: true
        }
      });

      return {
        companyProfile: toCompanyProfileSummary(updated)
      };
    }

    const created = await tx.companyProfile.create({
      data: {
        tenantId,
        name: input.name,
        legalName: toNullableString(input.legalName),
        email: toNullableString(input.email),
        phone: toNullableString(input.phone),
        website: toNullableString(input.website),
        taxId: toNullableString(input.taxId),
        country: toNullableString(input.country),
        registrationNumber: toNullableString(input.registrationNumber),
        billingAddress: toNullableString(input.billingAddress),
        paymentInstructions: toNullableString(input.paymentInstructions),
        logoUrl: toNullableString(input.logoUrl),
        currency: input.currency ?? "USD",
        invoiceTemplateKey: input.invoiceTemplateKey ?? "classic",
        invoicePrefix: toNullableString(input.invoicePrefix) ?? "DCA-INV",
        creditNotePrefix: toNullableString(input.creditNotePrefix) ?? "DCA-CN",
        isActive: true
      }
    });

    return {
      companyProfile: toCompanyProfileSummary(created)
    };
  });
}

export async function listClients(
  authSession: AuthResolvedSessionContext
): Promise<ClientsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const clients = await prisma.client.findMany({
    where: {
      tenantId
    },
    orderBy: [
      {
        isArchived: "asc"
      },
      {
        createdAt: "asc"
      }
    ],
    select: {
      id: true,
      name: true,
      email: true,
      website: true,
      billingDetails: true,
      contactPerson: true,
      taxId: true,
      country: true,
      clientKind: true,
      legalEntityName: true,
      accountGroupName: true,
      migrationStatus: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          projects: true
        }
      }
    }
  });

  return {
    clients: clients.map(toClientSummary)
  };
}

async function getClientRecord(tx: PrismaTx, tenantId: string, clientId: string) {
  return tx.client.findFirst({
    where: {
      id: clientId,
      tenantId
    },
    select: {
      id: true,
      name: true,
      email: true,
      website: true,
      billingDetails: true,
      contactPerson: true,
      taxId: true,
      country: true,
      clientKind: true,
      legalEntityName: true,
      accountGroupName: true,
      migrationStatus: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          projects: true
        }
      }
    }
  });
}

export async function getClient(authSession: AuthResolvedSessionContext, clientId: string): Promise<ClientResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const client = await prisma.$transaction(async (tx: PrismaTx) => getClientRecord(tx, tenantId, clientId));

  return {
    client: client ? toClientSummary(client) : null
  };
}

export async function createClient(
  authSession: AuthResolvedSessionContext,
  input: ClientInputRequest
): Promise<ClientResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const clientKind = input.clientKind === "OWN_DOMAIN" ? "OWN_DOMAIN" : "AGENCY_CLIENT";
    const legalEntityName = toNullableString(input.legalEntityName);
    if (clientKind === "OWN_DOMAIN" && !legalEntityName) {
      return { client: null };
    }

    const created = await tx.client.create({
      data: {
        tenantId,
        name: input.name ?? "",
        email: toNullableString(input.email),
        website: normalizeWebsiteUrl(input.website),
        contactPerson: toNullableString(input.contactPerson),
        billingDetails: toNullableString(input.billingAddress),
        taxId: toNullableString(input.taxId),
        country: toNullableString(input.country),
        clientKind,
        legalEntityName,
        accountGroupName: toNullableString(input.accountGroupName),
        migrationStatus:
          input.migrationStatus === "PLANNED_LICENSEE_TENANT" || input.migrationStatus === "MIGRATED"
            ? input.migrationStatus
            : "ACTIVE"
      },
      select: {
        id: true,
        name: true,
        email: true,
        website: true,
        billingDetails: true,
        contactPerson: true,
        taxId: true,
        country: true,
        clientKind: true,
        legalEntityName: true,
        accountGroupName: true,
        migrationStatus: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    return {
      client: toClientSummary(created)
    };
  });
}

export async function updateClient(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  input: ClientInputRequest
): Promise<ClientResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getClientRecord(tx, tenantId, clientId);
    if (!existing) {
      return null;
    }

    const updated = await tx.client.update({
      where: {
        id: clientId
      },
      data: {
        name: input.name ?? existing.name,
        email: input.email !== undefined ? toNullableString(input.email) : undefined,
        website: input.website !== undefined ? normalizeWebsiteUrl(input.website) : undefined,
        contactPerson: input.contactPerson !== undefined ? toNullableString(input.contactPerson) : undefined,
        billingDetails: input.billingAddress !== undefined ? toNullableString(input.billingAddress) : undefined,
        taxId: input.taxId !== undefined ? toNullableString(input.taxId) : undefined,
        country: input.country !== undefined ? toNullableString(input.country) : undefined,
        clientKind: input.clientKind === "OWN_DOMAIN" || input.clientKind === "AGENCY_CLIENT" ? input.clientKind : undefined,
        legalEntityName: input.legalEntityName !== undefined ? toNullableString(input.legalEntityName) : undefined,
        accountGroupName: input.accountGroupName !== undefined ? toNullableString(input.accountGroupName) : undefined,
        migrationStatus:
          input.migrationStatus === "PLANNED_LICENSEE_TENANT" || input.migrationStatus === "MIGRATED" || input.migrationStatus === "ACTIVE"
            ? input.migrationStatus
            : undefined
      },
      select: {
        id: true,
        name: true,
        email: true,
        website: true,
        billingDetails: true,
        contactPerson: true,
        taxId: true,
        country: true,
        clientKind: true,
        legalEntityName: true,
        accountGroupName: true,
        migrationStatus: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    return {
      client: toClientSummary(updated)
    };
  });
}

export async function archiveClient(
  authSession: AuthResolvedSessionContext,
  clientId: string
): Promise<ClientResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getClientRecord(tx, tenantId, clientId);
    if (!existing) {
      return null;
    }

    const activeProjectCount = await tx.project.count({
      where: {
        tenantId,
        clientId,
        isArchived: false
      }
    });
    if (activeProjectCount > 0) {
      throw new Error("CLIENT_HAS_ACTIVE_PROJECTS");
    }

    const archived = await tx.client.update({
      where: {
        id: clientId
      },
      data: {
        isArchived: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        website: true,
        billingDetails: true,
        contactPerson: true,
        taxId: true,
        country: true,
        clientKind: true,
        legalEntityName: true,
        accountGroupName: true,
        migrationStatus: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    return {
      client: toClientSummary(archived)
    };
  });
}

export async function restoreClient(
  authSession: AuthResolvedSessionContext,
  clientId: string
): Promise<ClientResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getClientRecord(tx, tenantId, clientId);
    if (!existing) {
      return null;
    }

    const restored = await tx.client.update({
      where: {
        id: clientId
      },
      data: {
        isArchived: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        website: true,
        billingDetails: true,
        contactPerson: true,
        taxId: true,
        country: true,
        clientKind: true,
        legalEntityName: true,
        accountGroupName: true,
        migrationStatus: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    return {
      client: toClientSummary(restored)
    };
  });
}

export async function listClientUserAccess(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  options?: { includeArchived?: boolean }
): Promise<{ users: ClientUserAccessSummary[] } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, tenantId },
    select: { id: true }
  });

  if (!client) {
    return null;
  }

  const includeArchived = options?.includeArchived === true;

  const users = await prisma.clientUserAccess.findMany({
    where: {
      tenantId,
      clientId,
      ...(includeArchived ? {} : { isArchived: false })
    },
    orderBy: [{ isArchived: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      clientId: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true
        }
      }
    }
  });

  return { users: users.map(toClientUserAccessSummary) };
}

export async function linkClientUserAccess(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  userId: string
): Promise<{ access: ClientUserAccessSummary } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const client = await tx.client.findFirst({
      where: { id: clientId, tenantId },
      select: { id: true }
    });

    if (!client) {
      return null;
    }

    const membership = await tx.tenantMembership.findFirst({
      where: { tenantId, userId, status: "ACTIVE" },
      select: { id: true }
    });

    if (!membership) {
      return null;
    }

    const access = await tx.clientUserAccess.upsert({
      where: { tenantId_clientId_userId: { tenantId, clientId, userId } },
      create: { tenantId, clientId, userId },
      update: { isArchived: false },
      select: {
        id: true,
        clientId: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true
          }
        }
      }
    });

    return { access: toClientUserAccessSummary(access) };
  });
}

export async function archiveClientUserAccess(
  authSession: AuthResolvedSessionContext,
  clientId: string,
  userId: string
): Promise<{ access: ClientUserAccessSummary } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.clientUserAccess.findFirst({
      where: { tenantId, clientId, userId },
      select: { id: true }
    });

    if (!existing) {
      return null;
    }

    const access = await tx.clientUserAccess.update({
      where: { id: existing.id },
      data: { isArchived: true },
      select: {
        id: true,
        clientId: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            status: true
          }
        }
      }
    });

    return { access: toClientUserAccessSummary(access) };
  });
}

export async function listProjects(
  authSession: AuthResolvedSessionContext
): Promise<ProjectsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const projects = await prisma.project.findMany({
    where: {
      tenantId
    },
    orderBy: [
      {
        isArchived: "asc"
      },
      {
        createdAt: "asc"
      }
    ],
    select: {
      id: true,
      clientId: true,
      client: {
        select: {
          id: true,
          name: true
        }
      },
      name: true,
      description: true,
      startDate: true,
      dueDate: true,
      status: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          tasks: true
        }
      }
    }
  });

  const openTaskCounts = await Promise.all(
    projects.map(async (project) => ({
      projectId: project.id,
      openTaskCount: await prisma.task.count({
        where: {
          tenantId,
          projectId: project.id,
          isArchived: false,
          status: {
            in: ["TODO", "IN_PROGRESS"]
          }
        }
      })
    }))
  );

  const openTaskCountByProjectId = new Map(
    openTaskCounts.map((entry) => [entry.projectId, entry.openTaskCount])
  );

  return {
    projects: projects.map((project) =>
      toProjectSummary({
        ...project,
        taskCount: project._count.tasks,
        openTaskCount: openTaskCountByProjectId.get(project.id) ?? 0
      })
    )
  };
}

async function getProjectRecord(tx: PrismaTx, tenantId: string, projectId: string) {
  return tx.project.findFirst({
    where: {
      id: projectId,
      tenantId
    },
    select: {
      id: true,
      clientId: true,
      client: {
        select: {
          id: true,
          name: true
        }
      },
      name: true,
      description: true,
      startDate: true,
      dueDate: true,
      status: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          tasks: true
        }
      }
    }
  });
}

export async function getProject(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<ProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const project = await prisma.$transaction(async (tx: PrismaTx) => getProjectRecord(tx, tenantId, projectId));

  if (!project) {
    return {
      project: null
    };
  }

  const openTaskCount = await prisma.task.count({
    where: {
      projectId: project.id,
      tenantId,
      isArchived: false,
      status: {
        in: ["TODO", "IN_PROGRESS"]
      }
    }
  });

  return {
    project: toProjectSummary({
      ...project,
      taskCount: project._count.tasks,
      openTaskCount
    })
  };
}

export async function createProject(
  authSession: AuthResolvedSessionContext,
  input: ProjectInputRequest
): Promise<ProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const clientId = toNullableString(input.clientId);
    const client = clientId
      ? await tx.client.findFirst({
          where: {
            id: clientId,
            tenantId
          },
          select: {
            id: true
          }
        })
      : null;

    if (clientId && !client) {
      return null;
    }

    const created = await tx.project.create({
      data: {
        tenantId,
        clientId: client?.id ?? null,
        name: input.name ?? "",
        description: toNullableString(input.description),
        startDate: input.startDate ? new Date(input.startDate) : null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        status: toProjectStatus(input.status)
      },
      select: {
        id: true,
        clientId: true,
        client: {
          select: {
            id: true,
            name: true
          }
        },
        name: true,
        description: true,
        startDate: true,
        dueDate: true,
        status: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    return {
      project: toProjectSummary({
        ...created,
        openTaskCount: 0
      })
    };
  });
}

export async function updateProject(
  authSession: AuthResolvedSessionContext,
  projectId: string,
  input: ProjectInputRequest
): Promise<ProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getProjectRecord(tx, tenantId, projectId);
    if (!existing) {
      return null;
    }

    const clientId = toNullableString(input.clientId);
    const client = clientId
      ? await tx.client.findFirst({
          where: {
            id: clientId,
            tenantId
          },
          select: {
            id: true
          }
        })
      : null;

    if (clientId && !client) {
      return null;
    }

    const updated = await tx.project.update({
      where: {
        id: projectId
      },
      data: {
        clientId: client?.id ?? null,
        name: input.name ?? existing.name,
        description: toNullableString(input.description),
        startDate: input.startDate ? new Date(input.startDate) : null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        status: toProjectStatus(input.status)
      },
      select: {
        id: true,
        clientId: true,
        client: {
          select: {
            id: true,
            name: true
          }
        },
        name: true,
        description: true,
        startDate: true,
        dueDate: true,
        status: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    const openTaskCount = await tx.task.count({
      where: {
        projectId: updated.id,
        tenantId,
        isArchived: false,
        status: {
          in: ["TODO", "IN_PROGRESS"]
        }
      }
    });

    return {
      project: toProjectSummary({
        ...updated,
        taskCount: updated._count.tasks,
        openTaskCount
      })
    };
  });
}

export async function archiveProject(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<ProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getProjectRecord(tx, tenantId, projectId);
    if (!existing) {
      return null;
    }

    const activeTaskCount = await tx.task.count({
      where: {
        tenantId,
        projectId,
        isArchived: false,
        status: {
          in: ["TODO", "IN_PROGRESS"]
        }
      }
    });
    if (activeTaskCount > 0) {
      throw new Error("PROJECT_ARCHIVE_BLOCKED");
    }

    const archived = await tx.project.update({
      where: {
        id: projectId
      },
      data: {
        isArchived: true
      },
      select: {
        id: true,
        clientId: true,
        client: {
          select: {
            id: true,
            name: true
          }
        },
        name: true,
        description: true,
        startDate: true,
        dueDate: true,
        status: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    const openTaskCount = await tx.task.count({
      where: {
        projectId: archived.id,
        tenantId,
        isArchived: false,
        status: {
          in: ["TODO", "IN_PROGRESS"]
        }
      }
    });

    return {
      project: toProjectSummary({
        ...archived,
        taskCount: archived._count.tasks,
        openTaskCount
      })
    };
  });
}

export async function restoreProject(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<ProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getProjectRecord(tx, tenantId, projectId);
    if (!existing) {
      return null;
    }

    const restored = await tx.project.update({
      where: {
        id: projectId
      },
      data: {
        isArchived: false,
        status: "Active"
      },
      select: {
        id: true,
        clientId: true,
        client: {
          select: {
            id: true,
            name: true
          }
        },
        name: true,
        description: true,
        startDate: true,
        dueDate: true,
        status: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasks: true
          }
        }
      }
    });

    const openTaskCount = await tx.task.count({
      where: {
        projectId: restored.id,
        tenantId,
        isArchived: false,
        status: {
          in: ["TODO", "IN_PROGRESS"]
        }
      }
    });

    return {
      project: toProjectSummary({
        ...restored,
        taskCount: restored._count.tasks,
        openTaskCount
      })
    };
  });
}

async function getAiDeliveryProjectRecord(tx: PrismaTx, tenantId: string, aiDeliveryProjectId: string) {
  return getAiDeliveryProjectDelegate(tx).findFirst({
    where: {
      id: aiDeliveryProjectId,
      tenantId
    },
    select: aiDeliveryProjectSelect
  });
}

async function getAiDeliveryTenantClient(tx: PrismaTx, tenantId: string, clientId: string | undefined) {
  if (!clientId) {
    return null;
  }

  return tx.client.findFirst({
    where: {
      id: clientId,
      tenantId
    },
    select: {
      id: true
    }
  });
}

async function getAiDeliveryTenantProject(
  tx: PrismaTx,
  tenantId: string,
  clientId: string,
  projectId: string | null | undefined
) {
  if (!projectId) {
    return null;
  }

  return tx.project.findFirst({
    where: {
      id: projectId,
      tenantId,
      clientId
    },
    select: {
      id: true
    }
  });
}

export async function listAiDeliveryProjects(
  authSession: AuthResolvedSessionContext
): Promise<AiDeliveryProjectsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const aiDeliveryProjects = await getAiDeliveryProjectDelegate(prisma).findMany({
    where: {
      tenantId
    },
    orderBy: [
      {
        isArchived: "asc"
      },
      {
        targetMonth: "desc"
      },
      {
        createdAt: "desc"
      }
    ],
    select: aiDeliveryProjectSelect
  });

  return {
    aiDeliveryProjects: aiDeliveryProjects.map((aiDeliveryProject) =>
      toAiDeliveryProjectSummary(aiDeliveryProject as Parameters<typeof toAiDeliveryProjectSummary>[0])
    )
  };
}

// --- Brief detail and save helpers ---
export async function getAiDeliveryBriefDetail(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<{ brief: {
  id: string;
  status: string;
  clientPriorities: string | null;
  productsServicesFocus: string | null;
  targetAudience: string | null;
  marketsCompetitors: string | null;
  notes: string | null;
  revisionCount: number;
  submittedAt: string | null;
  revisionRequestedAt: string | null;
  revisedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
} | null } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const brief = await prisma.aiDeliveryBrief.findFirst({
    where: { tenantId, aiDeliveryProjectId },
    select: {
      id: true,
      status: true,
      clientPriorities: true,
      productsServicesFocus: true,
      targetAudience: true,
      marketsCompetitors: true,
      notes: true,
      revisionCount: true,
      submittedAt: true,
      revisionRequestedAt: true,
      revisedAt: true,
      approvedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!brief) return null;

  return {
    brief: {
      id: brief.id,
      status: brief.status,
      clientPriorities: brief.clientPriorities,
      productsServicesFocus: brief.productsServicesFocus,
      targetAudience: brief.targetAudience,
      marketsCompetitors: brief.marketsCompetitors,
      notes: brief.notes,
      revisionCount: brief.revisionCount,
      submittedAt: brief.submittedAt ? brief.submittedAt.toISOString() : null,
      revisionRequestedAt: brief.revisionRequestedAt ? brief.revisionRequestedAt.toISOString() : null,
      revisedAt: brief.revisedAt ? brief.revisedAt.toISOString() : null,
      approvedAt: brief.approvedAt ? brief.approvedAt.toISOString() : null,
      createdAt: brief.createdAt.toISOString(),
      updatedAt: brief.updatedAt.toISOString()
    }
  };
}

export async function saveAiDeliveryBrief(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  input: {
    clientPriorities?: string | null;
    productsServicesFocus?: string | null;
    targetAudience?: string | null;
    marketsCompetitors?: string | null;
    notes?: string | null;
  }
): Promise<{ brief: {
  id: string;
  status: string;
  clientPriorities: string | null;
  productsServicesFocus: string | null;
  targetAudience: string | null;
  marketsCompetitors: string | null;
  notes: string | null;
  revisionCount: number;
  submittedAt: string | null;
  revisionRequestedAt: string | null;
  revisedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
} | null } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.aiDeliveryBrief.findFirst({ where: { tenantId, aiDeliveryProjectId } });
    if (!existing) return null;

    const updated = await tx.aiDeliveryBrief.update({
      where: { id: existing.id },
      data: {
        clientPriorities: typeof input.clientPriorities === "string" ? input.clientPriorities : input.clientPriorities ?? null,
        productsServicesFocus: typeof input.productsServicesFocus === "string" ? input.productsServicesFocus : input.productsServicesFocus ?? null,
        targetAudience: typeof input.targetAudience === "string" ? input.targetAudience : input.targetAudience ?? null,
        marketsCompetitors: typeof input.marketsCompetitors === "string" ? input.marketsCompetitors : input.marketsCompetitors ?? null,
        notes: typeof input.notes === "string" ? input.notes : input.notes ?? null
      },
      select: {
        id: true,
        status: true,
        clientPriorities: true,
        productsServicesFocus: true,
        targetAudience: true,
        marketsCompetitors: true,
        notes: true,
        revisionCount: true,
        submittedAt: true,
        revisionRequestedAt: true,
        revisedAt: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_BRIEF_SAVED",
        relatedEntityId: updated.id
      },
      tx
    );

    return {
      brief: {
        id: updated.id,
        status: updated.status,
        clientPriorities: updated.clientPriorities,
        productsServicesFocus: updated.productsServicesFocus,
        targetAudience: updated.targetAudience,
        marketsCompetitors: updated.marketsCompetitors,
        notes: updated.notes,
        revisionCount: updated.revisionCount,
        submittedAt: updated.submittedAt ? updated.submittedAt.toISOString() : null,
        revisionRequestedAt: updated.revisionRequestedAt ? updated.revisionRequestedAt.toISOString() : null,
        revisedAt: updated.revisedAt ? updated.revisedAt.toISOString() : null,
        approvedAt: updated.approvedAt ? updated.approvedAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString()
      }
    };
  });
}

export async function createAiDeliveryProject(
  authSession: AuthResolvedSessionContext,
  input: AiDeliveryProjectInputRequest
): Promise<AiDeliveryProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.clientId || !input.name || !input.targetMonth) {
    return null;
  }

  const targetMonth = parseAiDeliveryTargetMonth(input.targetMonth);
  if (!targetMonth) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const client = await getAiDeliveryTenantClient(tx, tenantId, input.clientId);
    if (!client) {
      throwAiDeliveryBadRequest("AI_DELIVERY_PROJECT_CLIENT_LINK_INVALID", "Client must belong to the active tenant.");
    }

    const project = await getAiDeliveryTenantProject(tx, tenantId, client.id, input.projectId);
    if (input.projectId && !project) {
      throwAiDeliveryBadRequest("AI_DELIVERY_PROJECT_OPTIONAL_PROJECT_LINK_INVALID", "Project link must belong to the selected client in the active tenant.");
    }

    const created = await getAiDeliveryProjectDelegate(tx).create({
      data: {
        tenantId,
        clientId: client.id,
        projectId: project?.id ?? null,
        name: input.name,
        targetMonth,
        plannedContentScopeNotes: toNullableString(input.plannedContentScopeNotes),
        brief: {
          create: {
            tenantId,
            status: "DRAFT"
          }
        }
      },
      select: aiDeliveryProjectSelect
    });

    const createdProject = created as Parameters<typeof toAiDeliveryProjectSummary>[0];
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId: createdProject.id,
        eventName: "AI_DELIVERY_PROJECT_CREATED",
        relatedEntityId: createdProject.id
      },
      tx
    );

    return {
      aiDeliveryProject: toAiDeliveryProjectSummary(createdProject)
    };
  });
}

// --- Content plan runtime helpers ---
function getAiDeliveryContentPlanDelegate(client: PrismaTx | typeof prisma) {
  return (client as unknown as { aiDeliveryContentPlan: { findFirst: (args: unknown) => Promise<unknown>; findMany: (args: unknown) => Promise<unknown[]>; create: (args: unknown) => Promise<unknown>; update: (args: unknown) => Promise<unknown>; delete: (args: unknown) => Promise<unknown>; } }).aiDeliveryContentPlan;
}

function getAiDeliveryContentDraftDelegate(client: PrismaTx | typeof prisma) {
  return (client as unknown as { aiDeliveryContentDraft: { findFirst: (args: unknown) => Promise<unknown>; findMany: (args: unknown) => Promise<unknown[]>; create: (args: unknown) => Promise<unknown>; update: (args: unknown) => Promise<unknown>; } }).aiDeliveryContentDraft;
}

const aiDeliveryContentPlanItemSelect = {
  id: true,
  title: true,
  targetKeyword: true,
  contentType: true,
  notes: true,
  sortOrder: true,
  approvalStatus: true,
  clientComment: true,
  createdAt: true,
  updatedAt: true
} as const;

const aiDeliveryContentPlanSelect = {
  id: true,
  aiDeliveryProjectId: true,
  status: true,
  revisionCount: true,
  reviewRequestedAt: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: aiDeliveryContentPlanItemSelect,
    orderBy: { sortOrder: "asc" }
  }
} as const;

const AI_DELIVERY_CONTENT_PLAN_STATUSES = new Set(["DRAFT", "CLIENT_REVIEW_REQUESTED", "CLIENT_CHANGES_REQUESTED", "CLIENT_APPROVED"]);
const AI_DELIVERY_CONTENT_PLAN_ITEM_APPROVAL_STATUSES = new Set(["DRAFT", "CLIENT_CHANGES_REQUESTED", "CLIENT_APPROVED"]);

function normalizeAiDeliveryContentPlanStatus(value: string | null | undefined): AiDeliveryContentPlanStatus {
  return value && AI_DELIVERY_CONTENT_PLAN_STATUSES.has(value) ? value as AiDeliveryContentPlanStatus : "DRAFT";
}

function canTransitionAiDeliveryContentPlanStatus(
  currentStatus: AiDeliveryContentPlanStatus,
  nextStatus: AiDeliveryContentPlanStatus
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  if (nextStatus === "CLIENT_CHANGES_REQUESTED") {
    return currentStatus === "CLIENT_REVIEW_REQUESTED" || currentStatus === "CLIENT_APPROVED";
  }

  const order: AiDeliveryContentPlanStatus[] = ["DRAFT", "CLIENT_REVIEW_REQUESTED", "CLIENT_CHANGES_REQUESTED", "CLIENT_APPROVED"];
  const currentIndex = order.indexOf(currentStatus);
  const nextIndex = order.indexOf(nextStatus);
  return currentIndex >= 0 && nextIndex === currentIndex + 1;
}

function normalizeAiDeliveryContentPlanItemApprovalStatus(
  value: string | null | undefined
): AiDeliveryContentPlanItemApprovalStatus | null {
  return value && AI_DELIVERY_CONTENT_PLAN_ITEM_APPROVAL_STATUSES.has(value)
    ? (value as AiDeliveryContentPlanItemApprovalStatus)
    : null;
}

function toAiDeliveryContentPlanSummary(plan: any) {
  return {
    id: plan.id,
    aiDeliveryProjectId: plan.aiDeliveryProjectId,
    status: plan.status,
    revisionCount: plan.revisionCount,
    reviewRequestedAt: plan.reviewRequestedAt ? plan.reviewRequestedAt.toISOString() : null,
    approvedAt: plan.approvedAt ? plan.approvedAt.toISOString() : null,
    items: (plan.items ?? []).map((it: any) => ({
      id: it.id,
      title: it.title,
      targetKeyword: it.targetKeyword,
      contentType: it.contentType,
      notes: it.notes,
      sortOrder: it.sortOrder,
      approvalStatus: it.approvalStatus ?? null,
      clientComment: it.clientComment ?? null,
      createdAt: it.createdAt.toISOString(),
      updatedAt: it.updatedAt.toISOString()
    })),
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString()
  };
}

const AI_DELIVERY_CONTENT_DRAFT_STATUSES = new Set(["DRAFT", "READY_FOR_REVIEW", "APPROVED", "CHANGES_REQUESTED", "ARCHIVED"]);
const AI_DELIVERY_CONTENT_DRAFT_ADMIN_STATUSES = new Set(["DRAFT", "READY_FOR_REVIEW", "CHANGES_REQUESTED", "ARCHIVED"]);

const aiDeliveryContentDraftSelect = {
  id: true,
  aiDeliveryProjectId: true,
  contentPlanItemId: true,
  contentPlanItem: { select: { id: true, title: true, sortOrder: true } },
  title: true,
  slug: true,
  draftBody: true,
  status: true,
  notes: true,
  reviewRequestedAt: true,
  approvedAt: true,
  revisionCount: true,
  clientComment: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true
} as const;

function normalizeAiDeliveryContentDraftStatus(value: string | null | undefined): AiDeliveryContentDraftStatus {
  return value && AI_DELIVERY_CONTENT_DRAFT_STATUSES.has(value) ? value as AiDeliveryContentDraftStatus : "DRAFT";
}

function normalizeAiDeliveryContentDraftAdminStatus(value: string | null | undefined): Exclude<AiDeliveryContentDraftStatus, "APPROVED"> {
  return value && AI_DELIVERY_CONTENT_DRAFT_ADMIN_STATUSES.has(value)
    ? value as Exclude<AiDeliveryContentDraftStatus, "APPROVED">
    : "DRAFT";
}

function toAiDeliveryContentDraftSummary(draft: any) {
  return {
    id: draft.id,
    aiDeliveryProjectId: draft.aiDeliveryProjectId,
    contentPlanItemId: draft.contentPlanItemId,
    contentPlanItem: draft.contentPlanItem ?? null,
    title: draft.title,
    slug: draft.slug,
    draftBody: draft.draftBody,
    status: draft.status,
    notes: draft.notes,
    reviewRequestedAt: toDateString(draft.reviewRequestedAt),
    approvedAt: toDateString(draft.approvedAt),
    revisionCount: draft.revisionCount ?? 0,
    clientComment: draft.clientComment ?? null,
    isArchived: draft.isArchived,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString()
  };
}

async function getAiDeliveryProjectForDraft(tx: PrismaTx, tenantId: string, aiDeliveryProjectId: string) {
  return tx.aiDeliveryProject.findFirst({ where: { id: aiDeliveryProjectId, tenantId, isArchived: false }, select: { id: true, clientId: true, tenantId: true, isArchived: true } });
}

async function getContentPlanItemForDraft(tx: PrismaTx, tenantId: string, aiDeliveryProjectId: string, contentPlanItemId: string | null | undefined) {
  if (!contentPlanItemId) return null;
  return tx.aiDeliveryContentPlanItem.findFirst({
    where: { id: contentPlanItemId, tenantId, contentPlan: { tenantId, aiDeliveryProjectId } },
    select: {
      id: true,
      title: true,
      targetKeyword: true,
      contentType: true,
      notes: true,
      sortOrder: true,
      approvalStatus: true
    }
  });
}

export async function listAiDeliveryContentDrafts(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<AiDeliveryContentDraftsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await getAiDeliveryProjectForDraft(tx, tenantId, aiDeliveryProjectId);
    if (!project) return null;
    const drafts = await getAiDeliveryContentDraftDelegate(tx).findMany({
      where: { tenantId, aiDeliveryProjectId },
      orderBy: [{ isArchived: "asc" }, { updatedAt: "desc" }],
      select: aiDeliveryContentDraftSelect
    }) as any[];
    return { contentDrafts: drafts.map(toAiDeliveryContentDraftSummary) };
  });
}

export async function createAiDeliveryContentDraft(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  input: AiDeliveryContentDraftInputRequest
): Promise<AiDeliveryContentDraftResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.title || input.draftBody === undefined) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await getAiDeliveryProjectForDraft(tx, tenantId, aiDeliveryProjectId);
    if (!project) return null;
    const contentPlanItem = await getContentPlanItemForDraft(tx, tenantId, aiDeliveryProjectId, input.contentPlanItemId);
    if (input.contentPlanItemId && !contentPlanItem) {
      throwAiDeliveryBadRequest("AI_DELIVERY_CONTENT_DRAFT_CONTENT_PLAN_ITEM_LINK_INVALID", "Content plan item must belong to the same AI Delivery project.");
    }
    const nextStatus = normalizeAiDeliveryContentDraftAdminStatus(input.status);
    const reviewRequestedAt = nextStatus === "READY_FOR_REVIEW" ? new Date() : null;
    const created = await getAiDeliveryContentDraftDelegate(tx).create({
      data: {
        tenantId,
        aiDeliveryProjectId,
        contentPlanItemId: contentPlanItem?.id ?? null,
        title: input.title,
        slug: toNullableString(input.slug),
        draftBody: input.draftBody,
        status: nextStatus,
        notes: toNullableString(input.notes),
        reviewRequestedAt,
        approvedAt: null,
        isArchived: nextStatus === "ARCHIVED"
      },
      select: aiDeliveryContentDraftSelect
    }) as any;
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_CONTENT_DRAFT_CREATED",
        relatedEntityId: created.id
      },
      tx
    );
    return { contentDraft: toAiDeliveryContentDraftSummary(created) };
  });
}

export async function updateAiDeliveryContentDraft(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  contentDraftId: string,
  input: AiDeliveryContentDraftInputRequest
): Promise<AiDeliveryContentDraftResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.title || input.draftBody === undefined) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryContentDraftDelegate(tx).findFirst({ where: { id: contentDraftId, tenantId, aiDeliveryProjectId }, select: aiDeliveryContentDraftSelect }) as any;
    if (!existing) return null;
    const contentPlanItem = await getContentPlanItemForDraft(tx, tenantId, aiDeliveryProjectId, input.contentPlanItemId);
    if (input.contentPlanItemId && !contentPlanItem) {
      throwAiDeliveryBadRequest("AI_DELIVERY_CONTENT_DRAFT_CONTENT_PLAN_ITEM_LINK_INVALID", "Content plan item must belong to the same AI Delivery project.");
    }
    const nextStatus = normalizeAiDeliveryContentDraftAdminStatus(input.status ?? existing.status);
    const lifecycleUpdate = nextStatus === "READY_FOR_REVIEW"
      ? { reviewRequestedAt: existing.reviewRequestedAt ?? new Date(), approvedAt: null }
      : nextStatus === "DRAFT"
        ? { reviewRequestedAt: null, approvedAt: null }
        : nextStatus === "CHANGES_REQUESTED"
          ? { approvedAt: null }
          : {};
    const updated = await getAiDeliveryContentDraftDelegate(tx).update({
      where: { id: contentDraftId },
      data: {
        contentPlanItemId: contentPlanItem?.id ?? null,
        title: input.title,
        slug: toNullableString(input.slug),
        draftBody: input.draftBody,
        status: nextStatus,
        notes: toNullableString(input.notes),
        isArchived: nextStatus === "ARCHIVED" ? true : existing.isArchived,
        ...lifecycleUpdate
      },
      select: aiDeliveryContentDraftSelect
    }) as any;
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_CONTENT_DRAFT_UPDATED",
        relatedEntityId: updated.id
      },
      tx
    );
    return { contentDraft: toAiDeliveryContentDraftSummary(updated) };
  });
}

export async function archiveAiDeliveryContentDraft(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  contentDraftId: string
): Promise<AiDeliveryContentDraftResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryContentDraftDelegate(tx).findFirst({ where: { id: contentDraftId, tenantId, aiDeliveryProjectId }, select: { id: true } }) as any;
    if (!existing) return null;
    const archived = await getAiDeliveryContentDraftDelegate(tx).update({ where: { id: contentDraftId }, data: { isArchived: true, status: "ARCHIVED" }, select: aiDeliveryContentDraftSelect }) as any;
    return { contentDraft: toAiDeliveryContentDraftSummary(archived) };
  });
}

export async function requestAiDeliveryContentDraftClientReview(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  contentDraftId: string
): Promise<AiDeliveryContentDraftResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await getAiDeliveryProjectForDraft(tx, tenantId, aiDeliveryProjectId);
    if (!project) return null;
    const existing = await getAiDeliveryContentDraftDelegate(tx).findFirst({
      where: { id: contentDraftId, tenantId, aiDeliveryProjectId },
      select: { id: true, draftBody: true, title: true, isArchived: true }
    }) as any;
    if (!existing) return null;
    if (existing.isArchived) {
      throwAiDeliveryConflict("AI_DELIVERY_CONTENT_DRAFT_ARCHIVED_ACTION_BLOCKED", "Archived content drafts cannot be moved to client review.");
    }
    if (!existing.title.trim() || !existing.draftBody.trim()) {
      throwAiDeliveryConflict("AI_DELIVERY_CONTENT_DRAFT_REVIEW_BLOCKED", "Only drafts with both a title and body can be moved to client review.");
    }
    const updated = await getAiDeliveryContentDraftDelegate(tx).update({
      where: { id: contentDraftId },
      data: { status: "READY_FOR_REVIEW", reviewRequestedAt: new Date(), approvedAt: null },
      select: aiDeliveryContentDraftSelect
    }) as any;
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_CONTENT_DRAFT_REVIEW_REQUESTED",
        relatedEntityId: updated.id
      },
      tx
    );
    return { contentDraft: toAiDeliveryContentDraftSummary(updated) };
  });
}

export async function returnAiDeliveryContentDraftToDraft(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  contentDraftId: string
): Promise<AiDeliveryContentDraftResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryContentDraftDelegate(tx).findFirst({
      where: { id: contentDraftId, tenantId, aiDeliveryProjectId },
      select: { id: true, isArchived: true }
    }) as any;
    if (!existing) return null;
    if (existing.isArchived) {
      throwAiDeliveryConflict("AI_DELIVERY_CONTENT_DRAFT_ARCHIVED_ACTION_BLOCKED", "Archived content drafts cannot be returned to draft.");
    }

    const updated = await getAiDeliveryContentDraftDelegate(tx).update({
      where: { id: contentDraftId },
      data: { status: "DRAFT", reviewRequestedAt: null, approvedAt: null },
      select: aiDeliveryContentDraftSelect
    }) as any;

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_CONTENT_DRAFT_RETURNED_TO_DRAFT",
        relatedEntityId: updated.id
      },
      tx
    );

    return { contentDraft: toAiDeliveryContentDraftSummary(updated) };
  });
}

export async function adminApproveAiDeliveryContentDraft(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  contentDraftId: string
): Promise<AiDeliveryContentDraftResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryContentDraftDelegate(tx).findFirst({
      where: { id: contentDraftId, tenantId, aiDeliveryProjectId },
      select: aiDeliveryContentDraftSelect
    }) as any;
    if (!existing) return null;
    if (existing.isArchived) {
      throwAiDeliveryConflict("AI_DELIVERY_CONTENT_DRAFT_ARCHIVED_ACTION_BLOCKED", "Archived content drafts cannot be admin-approved.");
    }
    if (!existing.title.trim() || !existing.draftBody.trim()) {
      throwAiDeliveryConflict("AI_DELIVERY_CONTENT_DRAFT_REVIEW_BLOCKED", "Only drafts with both a title and body can be admin-approved.");
    }

    const updated = await getAiDeliveryContentDraftDelegate(tx).update({
      where: { id: contentDraftId },
      data: { status: "APPROVED", approvedAt: new Date() },
      select: aiDeliveryContentDraftSelect
    }) as any;

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_CONTENT_DRAFT_UPDATED",
        relatedEntityId: updated.id
      },
      tx
    );

    return { contentDraft: toAiDeliveryContentDraftSummary(updated) };
  });
}

async function getClientAccessibleContentDrafts(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: aiDeliveryProjectId, tenantId, isArchived: false },
    select: { id: true, tenantId: true, clientId: true, isArchived: true }
  });

  if (!project || !project.clientId || !(await userCanAccessClient(authSession, project.clientId))) return null;

  const drafts = await getAiDeliveryContentDraftDelegate(prisma).findMany({
    where: { tenantId, aiDeliveryProjectId, isArchived: false, status: { in: ["READY_FOR_REVIEW", "APPROVED", "CHANGES_REQUESTED"] } },
    orderBy: [{ updatedAt: "desc" }],
    select: aiDeliveryContentDraftSelect
  }) as any[];

  return drafts;
}

export async function listClientAiDeliveryContentDraftReviews(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<AiDeliveryContentDraftsResponse | null> {
  const drafts = await getClientAccessibleContentDrafts(authSession, aiDeliveryProjectId);
  if (!drafts) return null;
  return { contentDrafts: drafts.map(toAiDeliveryContentDraftSummary) };
}

export async function approveClientAiDeliveryContentDraftReview(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  contentDraftId: string
): Promise<AiDeliveryContentDraftResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;
  const drafts = await getClientAccessibleContentDrafts(authSession, aiDeliveryProjectId);
  const draft = drafts?.find((item) => item.id === contentDraftId);
  if (!draft) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const updated = await getAiDeliveryContentDraftDelegate(tx).update({
      where: { id: contentDraftId },
      data: { status: "APPROVED", approvedAt: new Date() },
      select: aiDeliveryContentDraftSelect
    }) as any;

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_CONTENT_DRAFT_CLIENT_APPROVED",
        relatedEntityId: updated.id
      },
      tx
    );

    return { contentDraft: toAiDeliveryContentDraftSummary(updated) };
  });
}

export async function requestClientAiDeliveryContentDraftRevision(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  contentDraftId: string,
  comment: string
): Promise<AiDeliveryContentDraftResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;
  const drafts = await getClientAccessibleContentDrafts(authSession, aiDeliveryProjectId);
  const draft = drafts?.find((item) => item.id === contentDraftId);
  if (!draft || !comment.trim()) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const updated = await getAiDeliveryContentDraftDelegate(tx).update({
      where: { id: contentDraftId },
      data: {
        status: "CHANGES_REQUESTED",
        revisionCount: { increment: 1 },
        clientComment: comment.trim(),
        approvedAt: null
      },
      select: aiDeliveryContentDraftSelect
    }) as any;

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_CONTENT_DRAFT_CLIENT_CHANGES_REQUESTED",
        relatedEntityId: updated.id
      },
      tx
    );

    return { contentDraft: toAiDeliveryContentDraftSummary(updated) };
  });
}

const AI_DELIVERY_ARTICLE_IMAGE_STATUSES = new Set(["DRAFT", "READY_FOR_GENERATION", "PREVIEW_READY", "APPROVED", "FINAL_READY", "CHANGES_REQUESTED", "ARCHIVED"]);

const aiDeliveryArticleImageSelect = {
  id: true,
  aiDeliveryProjectId: true,
  contentDraftId: true,
  contentDraft: { select: { id: true, title: true } },
  title: true,
  prompt: true,
  styleNotes: true,
  status: true,
  previewImageUrl: true,
  finalImageUrl: true,
  storageKey: true,
  notes: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true
} as const;

function normalizeAiDeliveryArticleImageStatus(value: string | null | undefined): AiDeliveryArticleImageStatus {
  return value && AI_DELIVERY_ARTICLE_IMAGE_STATUSES.has(value) ? value as AiDeliveryArticleImageStatus : "DRAFT";
}

function hasArticleImagePreviewReference(image: {
  previewImageUrl?: string | null;
  finalImageUrl?: string | null;
}) {
  return Boolean((image.previewImageUrl ?? "").trim() || (image.finalImageUrl ?? "").trim());
}

function hasArticleImageFinalReference(image: {
  finalImageUrl?: string | null;
  storageKey?: string | null;
}) {
  return Boolean((image.finalImageUrl ?? "").trim() || (image.storageKey ?? "").trim());
}

function toAiDeliveryArticleImageSummary(image: any) {
  return {
    id: image.id,
    aiDeliveryProjectId: image.aiDeliveryProjectId,
    contentDraftId: image.contentDraftId,
    contentDraft: image.contentDraft,
    title: image.title,
    prompt: image.prompt,
    styleNotes: image.styleNotes,
    status: image.status,
    previewImageUrl: image.previewImageUrl,
    finalImageUrl: image.finalImageUrl,
    storageKey: image.storageKey,
    notes: image.notes,
    isArchived: image.isArchived,
    createdAt: image.createdAt.toISOString(),
    updatedAt: image.updatedAt.toISOString()
  };
}

async function getContentDraftForArticleImage(
  tx: PrismaTx,
  tenantId: string,
  aiDeliveryProjectId: string,
  contentDraftId: string | undefined
): Promise<{ id: string } | null> {
  if (!contentDraftId) return null;
  return getAiDeliveryContentDraftDelegate(tx).findFirst({
    where: { id: contentDraftId, tenantId, aiDeliveryProjectId },
    select: { id: true }
  }) as Promise<{ id: string } | null>;
}

export async function listAiDeliveryArticleImages(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<AiDeliveryArticleImagesResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await getAiDeliveryProjectForDraft(tx, tenantId, aiDeliveryProjectId);
    if (!project) return null;
    const articleImages = await getAiDeliveryArticleImageDelegate(tx).findMany({
      where: { tenantId, aiDeliveryProjectId },
      orderBy: [{ isArchived: "asc" }, { updatedAt: "desc" }],
      select: aiDeliveryArticleImageSelect
    }) as any[];
    return { articleImages: articleImages.map(toAiDeliveryArticleImageSummary) };
  });
}

export async function createAiDeliveryArticleImage(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  input: AiDeliveryArticleImageInputRequest
): Promise<AiDeliveryArticleImageResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.contentDraftId || !input.title || !input.prompt) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await getAiDeliveryProjectForDraft(tx, tenantId, aiDeliveryProjectId);
    if (!project) return null;
    const contentDraft = await getContentDraftForArticleImage(tx, tenantId, aiDeliveryProjectId, input.contentDraftId);
    if (!contentDraft) {
      throwAiDeliveryBadRequest("AI_DELIVERY_ARTICLE_IMAGE_CONTENT_DRAFT_LINK_INVALID", "Content draft must belong to the same AI Delivery project.");
    }
    const created = await getAiDeliveryArticleImageDelegate(tx).create({
      data: {
        tenantId,
        aiDeliveryProjectId,
        contentDraftId: contentDraft.id,
        title: input.title,
        prompt: input.prompt,
        styleNotes: toNullableString(input.styleNotes),
        status: normalizeAiDeliveryArticleImageStatus(input.status),
        previewImageUrl: toNullableString(input.previewImageUrl),
        finalImageUrl: toNullableString(input.finalImageUrl),
        storageKey: toNullableString(input.storageKey),
        notes: toNullableString(input.notes)
      },
      select: aiDeliveryArticleImageSelect
    }) as any;
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_ARTICLE_IMAGE_CREATED",
        relatedEntityId: created.id
      },
      tx
    );
    return { articleImage: toAiDeliveryArticleImageSummary(created) };
  });
}

export async function updateAiDeliveryArticleImage(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  articleImageId: string,
  input: AiDeliveryArticleImageInputRequest
): Promise<AiDeliveryArticleImageResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.contentDraftId || !input.title || !input.prompt) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryArticleImageDelegate(tx).findFirst({
      where: { id: articleImageId, tenantId, aiDeliveryProjectId },
      select: aiDeliveryArticleImageSelect
    }) as any;
    if (!existing) return null;
    const contentDraft = await getContentDraftForArticleImage(tx, tenantId, aiDeliveryProjectId, input.contentDraftId);
    if (!contentDraft) {
      throwAiDeliveryBadRequest("AI_DELIVERY_ARTICLE_IMAGE_CONTENT_DRAFT_LINK_INVALID", "Content draft must belong to the same AI Delivery project.");
    }
    const status = normalizeAiDeliveryArticleImageStatus(input.status);
    if (status !== existing.status) {
      throwAiDeliveryConflict(
        "AI_DELIVERY_ARTICLE_IMAGE_STATUS_PUT_BLOCKED",
        "Article image status must be changed through dedicated transition actions."
      );
    }
    const updated = await getAiDeliveryArticleImageDelegate(tx).update({
      where: { id: articleImageId },
      data: {
        contentDraftId: contentDraft.id,
        title: input.title,
        prompt: input.prompt,
        styleNotes: toNullableString(input.styleNotes),
        status,
        previewImageUrl: toNullableString(input.previewImageUrl),
        finalImageUrl: toNullableString(input.finalImageUrl),
        storageKey: toNullableString(input.storageKey),
        notes: toNullableString(input.notes),
        isArchived: status === "ARCHIVED" ? true : existing.isArchived
      },
      select: aiDeliveryArticleImageSelect
    }) as any;
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_ARTICLE_IMAGE_UPDATED",
        relatedEntityId: updated.id
      },
      tx
    );
    return { articleImage: toAiDeliveryArticleImageSummary(updated) };
  });
}

async function transitionAiDeliveryArticleImageStatus(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  articleImageId: string,
  options: {
    allowedFrom: AiDeliveryArticleImageStatus[];
    nextStatus: AiDeliveryArticleImageStatus;
    eventName:
      | "AI_DELIVERY_ARTICLE_IMAGE_PREVIEW_READY"
      | "AI_DELIVERY_ARTICLE_IMAGE_CHANGES_REQUESTED"
      | "AI_DELIVERY_ARTICLE_IMAGE_APPROVED"
      | "AI_DELIVERY_ARTICLE_IMAGE_FINAL_READY";
    requiresPreview?: boolean;
    requiresFinal?: boolean;
  }
): Promise<AiDeliveryArticleImageResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryArticleImageDelegate(tx).findFirst({
      where: { id: articleImageId, tenantId, aiDeliveryProjectId },
      select: aiDeliveryArticleImageSelect
    }) as any;
    if (!existing) return null;
    if (existing.isArchived) {
      throwAiDeliveryConflict("AI_DELIVERY_ARTICLE_IMAGE_ARCHIVED_ACTION_BLOCKED", "Archived article images cannot be updated through status actions.");
    }
    if (!options.allowedFrom.includes(existing.status)) {
      throwAiDeliveryConflict("AI_DELIVERY_ARTICLE_IMAGE_ACTION_BLOCKED", `Article image action is not allowed from status ${existing.status}.`);
    }
    if (options.requiresPreview && !hasArticleImagePreviewReference(existing)) {
      throwAiDeliveryConflict("AI_DELIVERY_ARTICLE_IMAGE_PREVIEW_REFERENCE_REQUIRED", "Preview or final image reference is required before this action.");
    }
    if (options.requiresFinal && !hasArticleImageFinalReference(existing)) {
      throwAiDeliveryConflict("AI_DELIVERY_ARTICLE_IMAGE_FINAL_REFERENCE_REQUIRED", "Final image URL or storage key is required before this action.");
    }

    const updated = await getAiDeliveryArticleImageDelegate(tx).update({
      where: { id: articleImageId },
      data: { status: options.nextStatus },
      select: aiDeliveryArticleImageSelect
    }) as any;

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: options.eventName,
        relatedEntityId: updated.id
      },
      tx
    );

    return { articleImage: toAiDeliveryArticleImageSummary(updated) };
  });
}

export async function markAiDeliveryArticleImagePreviewReady(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  articleImageId: string
): Promise<AiDeliveryArticleImageResponse | null> {
  return transitionAiDeliveryArticleImageStatus(authSession, aiDeliveryProjectId, articleImageId, {
    allowedFrom: ["DRAFT", "READY_FOR_GENERATION", "CHANGES_REQUESTED"],
    nextStatus: "PREVIEW_READY",
    eventName: "AI_DELIVERY_ARTICLE_IMAGE_PREVIEW_READY",
    requiresPreview: true
  });
}

export async function requestAiDeliveryArticleImageChanges(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  articleImageId: string
): Promise<AiDeliveryArticleImageResponse | null> {
  return transitionAiDeliveryArticleImageStatus(authSession, aiDeliveryProjectId, articleImageId, {
    allowedFrom: ["PREVIEW_READY", "APPROVED", "FINAL_READY"],
    nextStatus: "CHANGES_REQUESTED",
    eventName: "AI_DELIVERY_ARTICLE_IMAGE_CHANGES_REQUESTED",
    requiresPreview: true
  });
}

export async function approveAiDeliveryArticleImage(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  articleImageId: string
): Promise<AiDeliveryArticleImageResponse | null> {
  return transitionAiDeliveryArticleImageStatus(authSession, aiDeliveryProjectId, articleImageId, {
    allowedFrom: ["PREVIEW_READY", "CHANGES_REQUESTED"],
    nextStatus: "APPROVED",
    eventName: "AI_DELIVERY_ARTICLE_IMAGE_APPROVED",
    requiresPreview: true
  });
}

export async function markAiDeliveryArticleImageFinalReady(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  articleImageId: string
): Promise<AiDeliveryArticleImageResponse | null> {
  return transitionAiDeliveryArticleImageStatus(authSession, aiDeliveryProjectId, articleImageId, {
    allowedFrom: ["APPROVED", "PREVIEW_READY"],
    nextStatus: "FINAL_READY",
    eventName: "AI_DELIVERY_ARTICLE_IMAGE_FINAL_READY",
    requiresFinal: true
  });
}

export async function archiveAiDeliveryArticleImage(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  articleImageId: string
): Promise<AiDeliveryArticleImageResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryArticleImageDelegate(tx).findFirst({
      where: { id: articleImageId, tenantId, aiDeliveryProjectId },
      select: { id: true }
    }) as any;
    if (!existing) return null;
    const archived = await getAiDeliveryArticleImageDelegate(tx).update({
      where: { id: articleImageId },
      data: { isArchived: true, status: "ARCHIVED" },
      select: aiDeliveryArticleImageSelect
    }) as any;
    return { articleImage: toAiDeliveryArticleImageSummary(archived) };
  });
}

export async function getAiDeliveryArticleImageDownload(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  articleImageId: string
): Promise<DocumentDownloadResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !aiDeliveryProjectId || !articleImageId) {
    return null;
  }

  const articleImage = await getAiDeliveryArticleImageDelegate(prisma).findFirst({
    where: {
      id: articleImageId,
      tenantId,
      aiDeliveryProjectId,
      isArchived: false
    },
    select: {
      storageKey: true
    }
  }) as { storageKey?: string | null } | null;

  if (!articleImage?.storageKey) {
    return null;
  }

  return getPrivateStorageDownloadReference(articleImage.storageKey);
}

export async function getAiDeliveryArticleImageDownloadReference(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  articleImageId: string
): Promise<AiDeliveryDeliverableDownloadReferenceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !aiDeliveryProjectId || !articleImageId) {
    return null;
  }

  const articleImage = await getAiDeliveryArticleImageDelegate(prisma).findFirst({
    where: {
      id: articleImageId,
      tenantId,
      aiDeliveryProjectId,
      isArchived: false
    },
    select: {
      storageKey: true
    }
  }) as { storageKey?: string | null } | null;

  if (!articleImage?.storageKey) {
    return { downloadReference: null };
  }

  const downloadRef = getPrivateStorageDownloadReference(articleImage.storageKey);
  return {
    downloadReference: downloadRef
      ? {
          storageKey: articleImage.storageKey,
          downloadUrl: downloadRef.downloadUrl || null,
          expiresSeconds: downloadRef.expiresSeconds || null
        }
      : null
  };
}

export async function uploadAiDeliveryArticleImageFinalAsset(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  articleImageId: string,
  input: AiDeliveryArticleImageUploadRequest
): Promise<AiDeliveryArticleImageResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !aiDeliveryProjectId || !articleImageId || !input.fileName || !input.mimeType || !input.contentBase64) {
    return null;
  }
  const { contentBase64, fileName, mimeType } = input;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await getAiDeliveryProjectForDraft(tx, tenantId, aiDeliveryProjectId);
    if (!project) {
      return null;
    }

    const existing = await getAiDeliveryArticleImageDelegate(tx).findFirst({
      where: {
        id: articleImageId,
        tenantId,
        aiDeliveryProjectId,
        isArchived: false
      },
      select: aiDeliveryArticleImageSelect as any
    }) as any;
    if (!existing) {
      return null;
    }

    const tenant = await tx.tenant.findUnique({
      where: {
        id: tenantId
      },
      select: {
        id: true,
        slug: true
      }
    });
    if (!tenant) {
      return null;
    }

    const upload = await putPrivateStorageObject({
      body: Buffer.from(contentBase64, "base64"),
      documentDate: new Date(),
      mimeType,
      namespace: "ai-delivery-asset",
      originalFileName: fileName,
      projectSlugOrId: aiDeliveryProjectId,
      tenantSlugOrId: tenant.slug || tenant.id
    });

    if (!upload) {
      throw new Error("Private storage is not configured.");
    }

    const updated = await getAiDeliveryArticleImageDelegate(tx).update({
      where: {
        id: existing.id
      },
      data: {
        storageKey: upload.storageKey,
        finalImageUrl: null
      },
      select: aiDeliveryArticleImageSelect
    }) as any;

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_ARTICLE_IMAGE_UPDATED",
        relatedEntityId: updated.id
      },
      tx
    );

    return {
      articleImage: toAiDeliveryArticleImageSummary(updated)
    };
  });
}

export async function getAiDeliveryContentPlanDetail(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<{ contentPlan: any | null } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const plan = await prisma.aiDeliveryContentPlan.findFirst({
    where: { tenantId, aiDeliveryProjectId },
    select: aiDeliveryContentPlanSelect
  });

  if (!plan) return null;

  return { contentPlan: toAiDeliveryContentPlanSummary(plan) };
}

export async function generateAiDeliveryContentPlanPdfForProject(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<{ contentPlanId: string; hasDocument: boolean; generatedAt: string; fileName: string } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !aiDeliveryProjectId) return null;

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: aiDeliveryProjectId, tenantId },
    select: {
      id: true,
      name: true,
      targetMonth: true,
      isArchived: true,
      client: { select: { name: true } }
    }
  });
  if (!project) return null;
  if (project.isArchived) {
    throwAiDeliveryBadRequest("AI_DELIVERY_CONTENT_PLAN_ARCHIVED", "Cannot generate a PDF for an archived AI Delivery project.");
  }

  const plan = await getAiDeliveryContentPlanDelegate(prisma).findFirst({
    where: { aiDeliveryProjectId, tenantId },
    select: {
      id: true,
      status: true,
      items: {
        select: aiDeliveryContentPlanItemSelect,
        orderBy: { sortOrder: "asc" }
      }
    }
  }) as { id: string; status: string; items: any[] } | null;
  if (!plan) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true }
  });
  if (!tenant) return null;

  const generatedAt = new Date();
  const pdf = await generateAiDeliveryContentPlanPdf({
    generatedAt,
    projectName: project.name,
    clientName: project.client?.name ?? null,
    targetMonth: formatAiDeliveryTargetMonth(project.targetMonth),
    status: plan.status,
    items: plan.items.map((item: any) => ({
      title: item.title,
      targetKeyword: item.targetKeyword ?? null,
      contentType: item.contentType ?? null,
      notes: item.notes ?? null,
      sortOrder: item.sortOrder,
      approvalStatus: item.approvalStatus ?? null
    }))
  });

  const upload = await putPrivateStorageObject({
    body: pdf.pdfBuffer,
    documentDate: generatedAt,
    mimeType: "application/pdf",
    namespace: "ai-delivery-report",
    originalFileName: pdf.fileName,
    projectSlugOrId: plan.id,
    tenantSlugOrId: tenant.slug || tenant.id
  });

  if (!upload) {
    throw new Error("Private storage is not configured.");
  }

  await getAiDeliveryContentPlanDelegate(prisma).update({
    where: { id: plan.id },
    data: { storageKey: upload.storageKey }
  });

  return {
    contentPlanId: plan.id,
    hasDocument: true,
    generatedAt: generatedAt.toISOString(),
    fileName: pdf.fileName
  };
}

export async function getAiDeliveryContentPlanDownloadReference(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<{ downloadReference: { downloadUrl: string; expiresSeconds: number } | null } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !aiDeliveryProjectId) return null;

  const plan = await getAiDeliveryContentPlanDelegate(prisma).findFirst({
    where: { aiDeliveryProjectId, tenantId },
    select: { id: true, storageKey: true }
  }) as { id: string; storageKey: string | null } | null;

  if (!plan) return null;

  if (!plan.storageKey) {
    return { downloadReference: null };
  }

  const downloadRef = getPrivateStorageDownloadReference(plan.storageKey);
  return {
    downloadReference: downloadRef
      ? { downloadUrl: downloadRef.downloadUrl, expiresSeconds: downloadRef.expiresSeconds }
      : null
  };
}

async function getClientAccessibleContentPlan(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const plan = await prisma.aiDeliveryContentPlan.findFirst({
    where: { tenantId, aiDeliveryProjectId },
    select: {
      ...aiDeliveryContentPlanSelect,
      aiDeliveryProject: { select: { id: true, tenantId: true, clientId: true, isArchived: true } }
    }
  });

  if (!plan || (plan as any).aiDeliveryProject?.tenantId !== tenantId || (plan as any).aiDeliveryProject?.isArchived) return null;
  const clientId = (plan as any).aiDeliveryProject.clientId;
  if (!clientId || !(await userCanAccessClient(authSession, clientId))) return null;
  return plan;
}

export async function getClientAiDeliveryContentPlanReview(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<{ contentPlan: any | null } | null> {
  const plan = await getClientAccessibleContentPlan(authSession, aiDeliveryProjectId);
  if (!plan) return null;
  return { contentPlan: toAiDeliveryContentPlanSummary(plan) };
}

export async function approveClientAiDeliveryContentPlanReview(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<{ contentPlan: any | null } | null> {
  const plan = await getClientAccessibleContentPlan(authSession, aiDeliveryProjectId);
  if (!plan) return null;

  const updated = await prisma.aiDeliveryContentPlan.update({
    where: { id: (plan as any).id },
    data: { status: "CLIENT_APPROVED", approvedAt: new Date() },
    select: aiDeliveryContentPlanSelect
  });
  return { contentPlan: toAiDeliveryContentPlanSummary(updated) };
}

export async function requestClientAiDeliveryContentPlanRevision(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  comment: string
): Promise<{ contentPlan: any | null } | null> {
  const plan = await getClientAccessibleContentPlan(authSession, aiDeliveryProjectId);
  if (!plan) return null;

  const updated = await prisma.$transaction(async (tx: PrismaTx) => {
    const contentPlan = await tx.aiDeliveryContentPlan.update({
      where: { id: (plan as any).id },
      data: { status: "CLIENT_CHANGES_REQUESTED", revisionCount: { increment: 1 } },
      select: { id: true }
    });

    const firstItem = (plan as any).items?.[0];
    if (firstItem) {
      await tx.aiDeliveryContentPlanItem.update({
        where: { id: firstItem.id },
        data: { approvalStatus: "CLIENT_CHANGES_REQUESTED", clientComment: comment }
      });
    }

    return tx.aiDeliveryContentPlan.findFirst({ where: { id: contentPlan.id }, select: aiDeliveryContentPlanSelect });
  });

  return { contentPlan: updated ? toAiDeliveryContentPlanSummary(updated) : null };
}

export async function createAiDeliveryContentPlan(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  input?: { items?: { title: string; targetKeyword?: string | null; contentType?: string | null; notes?: string | null; sortOrder?: number | null; approvalStatus?: string | null; clientComment?: string | null }[] }
): Promise<{ contentPlan: any | null; created: boolean } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existingProject = await getAiDeliveryProjectRecord(tx, tenantId, aiDeliveryProjectId);
    if (!existingProject) return null;

    const existingPlan = await tx.aiDeliveryContentPlan.findFirst({ where: { tenantId, aiDeliveryProjectId } });
    if (existingPlan) {
      const found = await tx.aiDeliveryContentPlan.findFirst({ where: { id: existingPlan.id }, select: aiDeliveryContentPlanSelect });
      return { contentPlan: found, created: false };
    }

    const created = await tx.aiDeliveryContentPlan.create({
      data: {
        tenantId,
        aiDeliveryProjectId,
        status: "DRAFT",
        revisionCount: 0,
        items: input?.items && input.items.length > 0 ? {
          create: input.items.map((it) => ({
            title: it.title,
            targetKeyword: it.targetKeyword ?? null,
            contentType: it.contentType ?? "article",
            notes: it.notes ?? null,
            sortOrder: it.sortOrder ?? 0,
            approvalStatus: normalizeAiDeliveryContentPlanItemApprovalStatus(it.approvalStatus),
            clientComment: it.clientComment ?? null,
            tenant: { connect: { id: tenantId } }
          }))
        } : undefined
      },
      select: aiDeliveryContentPlanSelect
    });

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_CONTENT_PLAN_CREATED",
        relatedEntityId: created.id
      },
      tx
    );

    return { contentPlan: created, created: true };
  });
}

export async function updateAiDeliveryContentPlan(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  input: { status?: string | null; revisionCount?: number | null; items?: { title: string; targetKeyword?: string | null; contentType?: string | null; notes?: string | null; sortOrder?: number | null; approvalStatus?: string | null; clientComment?: string | null }[] }
): Promise<{ contentPlan: any | null } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.aiDeliveryContentPlan.findFirst({ where: { tenantId, aiDeliveryProjectId } });
    if (!existing) return null;

    const existingStatus = normalizeAiDeliveryContentPlanStatus(existing.status);
    const nextStatus = input.status === undefined || input.status === null
      ? existingStatus
      : normalizeAiDeliveryContentPlanStatus(input.status);
    if (!canTransitionAiDeliveryContentPlanStatus(existingStatus, nextStatus)) {
      throwAiDeliveryConflict(
        "AI_DELIVERY_CONTENT_PLAN_STATUS_GATE_BLOCKED",
        `Content plan status transition from ${existingStatus} to ${nextStatus} is not allowed.`
      );
    }

    const updated = await tx.aiDeliveryContentPlan.update({
      where: { id: existing.id },
      data: {
        status: nextStatus,
        revisionCount: typeof input.revisionCount === "number" ? input.revisionCount : existing.revisionCount
      },
      select: { id: true }
    });

    if (Array.isArray(input.items)) {
      // replace items deterministically when the caller explicitly sends item edits
      await tx.aiDeliveryContentPlanItem.deleteMany({ where: { contentPlanId: updated.id, tenantId } });

      if (input.items.length > 0) {
        for (const it of input.items) {
          await tx.aiDeliveryContentPlanItem.create({
            data: {
              tenantId,
              contentPlanId: updated.id,
              title: it.title,
              targetKeyword: it.targetKeyword ?? null,
              contentType: it.contentType ?? "article",
              notes: it.notes ?? null,
              sortOrder: it.sortOrder ?? 0,
              approvalStatus: normalizeAiDeliveryContentPlanItemApprovalStatus(it.approvalStatus),
              clientComment: it.clientComment ?? null
            }
          });
        }
      }
    }

    const found = await tx.aiDeliveryContentPlan.findFirst({ where: { id: updated.id }, select: aiDeliveryContentPlanSelect });
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_CONTENT_PLAN_UPDATED",
        relatedEntityId: updated.id
      },
      tx
    );
    return { contentPlan: found };
  });
}

export async function requestAiDeliveryContentPlanClientReview(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<{ contentPlan: any | null } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.aiDeliveryContentPlan.findFirst({ where: { tenantId, aiDeliveryProjectId } });
    if (!existing) return null;

    const updated = await tx.aiDeliveryContentPlan.update({
      where: { id: existing.id },
      data: { status: "CLIENT_REVIEW_REQUESTED", reviewRequestedAt: new Date() },
      select: aiDeliveryContentPlanSelect
    });

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_CONTENT_PLAN_REVIEW_REQUESTED",
        relatedEntityId: updated.id
      },
      tx
    );

    return { contentPlan: updated };
  });
}

export async function approveAiDeliveryContentPlan(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<{ contentPlan: any | null } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.aiDeliveryContentPlan.findFirst({ where: { tenantId, aiDeliveryProjectId } });
    if (!existing) return null;

    const updated = await tx.aiDeliveryContentPlan.update({
      where: { id: existing.id },
      data: { status: "CLIENT_APPROVED", approvedAt: new Date() },
      select: aiDeliveryContentPlanSelect
    });

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_CONTENT_PLAN_APPROVED",
        relatedEntityId: updated.id
      },
      tx
    );

    return { contentPlan: updated };
  });
}

export async function requestAiDeliveryContentPlanChanges(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<{ contentPlan: any | null } | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.aiDeliveryContentPlan.findFirst({ where: { tenantId, aiDeliveryProjectId } });
    if (!existing) return null;

    const updated = await tx.aiDeliveryContentPlan.update({
      where: { id: existing.id },
      data: {
        status: "CLIENT_CHANGES_REQUESTED",
        revisionCount: { increment: 1 },
        approvedAt: null
      },
      select: aiDeliveryContentPlanSelect
    });

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_CONTENT_PLAN_CHANGES_REQUESTED",
        relatedEntityId: updated.id
      },
      tx
    );

    return { contentPlan: updated };
  });
}

export async function updateAiDeliveryProject(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  input: AiDeliveryProjectInputRequest
): Promise<AiDeliveryProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.clientId || !input.name || !input.targetMonth) {
    return null;
  }

  const targetMonth = parseAiDeliveryTargetMonth(input.targetMonth);
  if (!targetMonth) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryProjectRecord(tx, tenantId, aiDeliveryProjectId);
    if (!existing) {
      return null;
    }

    const client = await getAiDeliveryTenantClient(tx, tenantId, input.clientId);
    if (!client) {
      throwAiDeliveryBadRequest("AI_DELIVERY_PROJECT_CLIENT_LINK_INVALID", "Client must belong to the active tenant.");
    }

    const project = await getAiDeliveryTenantProject(tx, tenantId, client.id, input.projectId);
    if (input.projectId && !project) {
      throwAiDeliveryBadRequest("AI_DELIVERY_PROJECT_OPTIONAL_PROJECT_LINK_INVALID", "Project link must belong to the selected client in the active tenant.");
    }

    const updated = await getAiDeliveryProjectDelegate(tx).update({
      where: {
        id: aiDeliveryProjectId
      },
      data: {
        clientId: client.id,
        projectId: project?.id ?? null,
        name: input.name,
        targetMonth,
        plannedContentScopeNotes: toNullableString(input.plannedContentScopeNotes)
      },
      select: aiDeliveryProjectSelect
    });

    const updatedProject = updated as Parameters<typeof toAiDeliveryProjectSummary>[0];
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_PROJECT_UPDATED",
        relatedEntityId: updatedProject.id
      },
      tx
    );

    return {
      aiDeliveryProject: toAiDeliveryProjectSummary(updatedProject)
    };
  });
}

export async function archiveAiDeliveryProject(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<AiDeliveryProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryProjectRecord(tx, tenantId, aiDeliveryProjectId);
    if (!existing) {
      return null;
    }

    const archived = await getAiDeliveryProjectDelegate(tx).update({
      where: {
        id: aiDeliveryProjectId
      },
      data: {
        isArchived: true
      },
      select: aiDeliveryProjectSelect
    });

    const archivedProject = archived as Parameters<typeof toAiDeliveryProjectSummary>[0];
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_PROJECT_ARCHIVED",
        relatedEntityId: archivedProject.id
      },
      tx
    );

    return {
      aiDeliveryProject: toAiDeliveryProjectSummary(archivedProject)
    };
  });
}

export async function requestAiDeliveryBriefClientInput(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<AiDeliveryProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryProjectRecord(tx, tenantId, aiDeliveryProjectId);
    if (!existing) return null;

    const brief = await tx.aiDeliveryBrief.findFirst({
      where: { aiDeliveryProjectId, tenantId },
      select: { id: true }
    });
    if (!brief) return null;

    // Update the related brief status to CLIENT_INPUT_REQUESTED
    const updated = await getAiDeliveryProjectDelegate(tx).update({
      where: { id: aiDeliveryProjectId },
      data: {
        brief: {
          update: {
            status: "CLIENT_INPUT_REQUESTED"
          }
        }
      },
      select: aiDeliveryProjectSelect
    });

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_BRIEF_CLIENT_INPUT_REQUESTED",
        relatedEntityId: brief.id
      },
      tx
    );

    return {
      aiDeliveryProject: toAiDeliveryProjectSummary(updated as Parameters<typeof toAiDeliveryProjectSummary>[0])
    };
  });
}

export async function requestAiDeliveryBriefClientRevision(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<AiDeliveryProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    // load brief with revisionCount
    const brief = await tx.aiDeliveryBrief.findFirst({
      where: { aiDeliveryProjectId, tenantId },
      select: { id: true, revisionCount: true }
    });

    if (!brief) return null;

    if (brief.revisionCount >= 1) {
      throw new Error("BRIEF_REVISION_LIMIT_REACHED");
    }

    const updated = await getAiDeliveryProjectDelegate(tx).update({
      where: { id: aiDeliveryProjectId },
      data: {
        brief: {
          update: {
            status: "REVISION_REQUESTED",
            revisionRequestedAt: new Date()
          }
        }
      },
      select: aiDeliveryProjectSelect
    });

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_BRIEF_REVISION_REQUESTED",
        relatedEntityId: brief.id
      },
      tx
    );

    return {
      aiDeliveryProject: toAiDeliveryProjectSummary(updated as Parameters<typeof toAiDeliveryProjectSummary>[0])
    };
  });
}

export async function approveFinalAiDeliveryBrief(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<AiDeliveryProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryProjectRecord(tx, tenantId, aiDeliveryProjectId);
    if (!existing) return null;

    const brief = await tx.aiDeliveryBrief.findFirst({
      where: { aiDeliveryProjectId, tenantId },
      select: { id: true }
    });
    if (!brief) return null;

    const updated = await getAiDeliveryProjectDelegate(tx).update({
      where: { id: aiDeliveryProjectId },
      data: {
        brief: {
          update: {
            status: "ADMIN_APPROVED",
            approvedAt: new Date()
          }
        }
      },
      select: aiDeliveryProjectSelect
    });

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_BRIEF_APPROVED",
        relatedEntityId: brief.id
      },
      tx
    );

    return {
      aiDeliveryProject: toAiDeliveryProjectSummary(updated as Parameters<typeof toAiDeliveryProjectSummary>[0])
    };
  });
}

function getAiDeliveryWorkflowRunDelegate(client: PrismaTx | typeof prisma) {
  return (client as unknown as { aiDeliveryWorkflowRun: { findFirst: (args: unknown) => Promise<unknown>; findMany: (args: unknown) => Promise<unknown[]>; create: (args: unknown) => Promise<unknown>; update: (args: unknown) => Promise<unknown>; } }).aiDeliveryWorkflowRun;
}

const aiDeliveryWorkflowRunSelect = {
  id: true,
  tenantId: true,
  aiDeliveryProjectId: true,
  status: true,
  adminNotes: true,
  resultPlaceholder: true,
  executionLog: true,
  executionError: true,
  startedAt: true,
  finishedAt: true,
  createdAt: true,
  updatedAt: true,
  aiDeliveryProject: {
    select: {
      brief: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  }
} as const;

function normalizeAiDeliveryWorkflowRunStatus(value: string | null | undefined): AiDeliveryWorkflowRunStatus {
  const status = value ? value.trim().toUpperCase() : null;
  return status && AI_DELIVERY_WORKFLOW_RUN_STATUSES.includes(status as AiDeliveryWorkflowRunStatus)
    ? (status as AiDeliveryWorkflowRunStatus)
    : "DRAFT";
}

function canTransitionAiDeliveryWorkflowRunStatus(
  currentStatus: AiDeliveryWorkflowRunStatus,
  nextStatus: AiDeliveryWorkflowRunStatus
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  if (currentStatus === "FAILED" && nextStatus === "ARCHIVED") {
    return true;
  }

  if (nextStatus === "FAILED") {
    return currentStatus === "IN_PROGRESS" || currentStatus === "REVIEW";
  }

  const currentIndex = AI_DELIVERY_WORKFLOW_RUN_STATUS_ORDER.indexOf(currentStatus);
  const nextIndex = AI_DELIVERY_WORKFLOW_RUN_STATUS_ORDER.indexOf(nextStatus);
  return currentIndex >= 0 && nextIndex === currentIndex + 1;
}

function toAiDeliveryWorkflowRunSummary(run: any) {
  const brief = run.aiDeliveryProject?.brief ?? null;
  return {
    id: run.id,
    tenantId: run.tenantId,
    aiDeliveryProjectId: run.aiDeliveryProjectId,
    status: run.status,
    adminNotes: run.adminNotes ?? null,
    resultPlaceholder: run.resultPlaceholder ?? null,
    executionLog: run.executionLog ?? null,
    executionError: run.executionError ?? null,
    startedAt: run.startedAt ? run.startedAt.toISOString() : null,
    finishedAt: run.finishedAt ? run.finishedAt.toISOString() : null,
    brief: brief
      ? {
          id: brief.id,
          status: brief.status,
          createdAt: brief.createdAt.toISOString(),
          updatedAt: brief.updatedAt.toISOString()
        }
      : null,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString()
  };
}

function appendAiDeliveryWorkflowExecutionLog(existingLog: string | null | undefined, lines: string[]): string {
  const parts = [existingLog?.trim(), ...lines.map((line) => line.trim()).filter(Boolean)].filter(Boolean) as string[];
  return parts.join("\n");
}

function buildAiDeliveryWorkflowLogEntries(timestamp: string, lines: string[]): string[] {
  return lines.map((line) => `[${timestamp}] ${line}`);
}

function toAiDeliveryWorkflowExecutionMiHandoffContext(handoff: {
  title: string;
  marketSummary: string | null;
  competitorSummary: string | null;
  audienceSignals: unknown;
  opportunities: unknown;
  risks: unknown;
  recommendedActions: unknown;
  sourceNote: string | null;
}): AiDeliveryWorkflowExecutionMiHandoffContext {
  const normalizeList = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.map((entry) => (typeof entry === "string" ? entry.trim() : "")).filter(Boolean)
      : [];

  return {
    title: handoff.title,
    marketSummary: handoff.marketSummary,
    competitorSummary: handoff.competitorSummary,
    audienceSignals: normalizeList(handoff.audienceSignals),
    opportunities: normalizeList(handoff.opportunities),
    risks: normalizeList(handoff.risks),
    recommendedActions: normalizeList(handoff.recommendedActions),
    sourceNote: handoff.sourceNote
  };
}

async function persistGeneratedAiDeliveryContentPlan(
  tx: PrismaTx,
  input: {
    tenantId: string;
    aiDeliveryProjectId: string;
    generatedItems: AiDeliveryGeneratedContentPlanItem[];
    finishedAtIso: string;
  }
): Promise<string[]> {
  const existingPlan = await tx.aiDeliveryContentPlan.findFirst({
    where: { tenantId: input.tenantId, aiDeliveryProjectId: input.aiDeliveryProjectId },
    select: {
      id: true,
      status: true,
      revisionCount: true
    }
  });

  if (!existingPlan) {
    const createdPlan = await tx.aiDeliveryContentPlan.create({
      data: {
        tenantId: input.tenantId,
        aiDeliveryProjectId: input.aiDeliveryProjectId,
        status: "DRAFT",
        revisionCount: 0
      },
      select: { id: true }
    });

    for (const item of input.generatedItems) {
      await tx.aiDeliveryContentPlanItem.create({
        data: {
          tenantId: input.tenantId,
          contentPlanId: createdPlan.id,
          title: item.title,
          targetKeyword: item.targetKeyword,
          contentType: item.contentType,
          notes: item.notes,
          sortOrder: item.sortOrder,
          approvalStatus: item.approvalStatus,
          clientComment: item.clientComment
        }
      });
    }

    await recordAiDeliverySystemEvent(
      {
        tenantId: input.tenantId,
        aiDeliveryProjectId: input.aiDeliveryProjectId,
        eventName: "AI_DELIVERY_CONTENT_PLAN_CREATED",
        relatedEntityId: createdPlan.id
      },
      tx
    );

    return buildAiDeliveryWorkflowLogEntries(input.finishedAtIso, [
      `Generated draft content plan created with ${input.generatedItems.length} item(s).`
    ]);
  }

  const planStatus = normalizeAiDeliveryContentPlanStatus(existingPlan.status);
  if (planStatus === "CLIENT_REVIEW_REQUESTED" || planStatus === "CLIENT_APPROVED") {
    return buildAiDeliveryWorkflowLogEntries(input.finishedAtIso, [
      `Generated draft content plan was not persisted because the existing content plan is ${planStatus}.`
    ]);
  }

  await tx.aiDeliveryContentPlan.update({
    where: { id: existingPlan.id },
    data: {
      status: "DRAFT",
      reviewRequestedAt: null,
      approvedAt: null
    },
    select: { id: true }
  });

  await tx.aiDeliveryContentPlanItem.deleteMany({
    where: {
      tenantId: input.tenantId,
      contentPlanId: existingPlan.id
    }
  });

  for (const item of input.generatedItems) {
    await tx.aiDeliveryContentPlanItem.create({
      data: {
        tenantId: input.tenantId,
        contentPlanId: existingPlan.id,
        title: item.title,
        targetKeyword: item.targetKeyword,
        contentType: item.contentType,
        notes: item.notes,
        sortOrder: item.sortOrder,
        approvalStatus: item.approvalStatus,
        clientComment: item.clientComment
      }
    });
  }

  await recordAiDeliverySystemEvent(
    {
      tenantId: input.tenantId,
      aiDeliveryProjectId: input.aiDeliveryProjectId,
      eventName: "AI_DELIVERY_CONTENT_PLAN_UPDATED",
      relatedEntityId: existingPlan.id
    },
    tx
  );

  return buildAiDeliveryWorkflowLogEntries(input.finishedAtIso, [
    `Generated draft content plan updated with ${input.generatedItems.length} item(s).`
  ]);
}

async function persistGeneratedAiDeliveryContentDraft(
  tx: PrismaTx,
  input: {
    tenantId: string;
    aiDeliveryProjectId: string;
    generatedDraft: {
      title: string;
      slug: string | null;
      draftBody: string;
      notes: string | null;
      contentPlanItemId: string;
    };
    finishedAtIso: string;
  }
): Promise<string[]> {
  const existingDraft = await getAiDeliveryContentDraftDelegate(tx).findFirst({
    where: {
      tenantId: input.tenantId,
      aiDeliveryProjectId: input.aiDeliveryProjectId,
      contentPlanItemId: input.generatedDraft.contentPlanItemId,
      isArchived: false
    },
    orderBy: [
      { updatedAt: "desc" },
      { id: "desc" }
    ],
    select: aiDeliveryContentDraftSelect
  }) as any;

  if (!existingDraft) {
    const created = (await getAiDeliveryContentDraftDelegate(tx).create({
      data: {
        tenantId: input.tenantId,
        aiDeliveryProjectId: input.aiDeliveryProjectId,
        contentPlanItemId: input.generatedDraft.contentPlanItemId,
        title: input.generatedDraft.title,
        slug: input.generatedDraft.slug,
        draftBody: input.generatedDraft.draftBody,
        status: "DRAFT",
        notes: input.generatedDraft.notes,
        reviewRequestedAt: null,
        approvedAt: null,
        isArchived: false
      },
      select: { id: true }
    })) as { id: string };

    await recordAiDeliverySystemEvent(
      {
        tenantId: input.tenantId,
        aiDeliveryProjectId: input.aiDeliveryProjectId,
        eventName: "AI_DELIVERY_CONTENT_DRAFT_CREATED",
        relatedEntityId: created.id
      },
      tx
    );

    return buildAiDeliveryWorkflowLogEntries(input.finishedAtIso, [
      `Generated content draft created for selected content plan item ${input.generatedDraft.contentPlanItemId}.`
    ]);
  }

  const existingStatus = normalizeAiDeliveryContentDraftStatus(existingDraft.status);
  if (existingStatus === "READY_FOR_REVIEW" || existingStatus === "APPROVED") {
    return buildAiDeliveryWorkflowLogEntries(input.finishedAtIso, [
      `Generated content draft was not persisted because the existing content draft is ${existingStatus}.`
    ]);
  }

  await getAiDeliveryContentDraftDelegate(tx).update({
    where: { id: existingDraft.id },
    data: {
      title: input.generatedDraft.title,
      slug: input.generatedDraft.slug,
      draftBody: input.generatedDraft.draftBody,
      status: "DRAFT",
      notes: input.generatedDraft.notes,
      reviewRequestedAt: null,
      approvedAt: null
    },
    select: { id: true }
  });

  await recordAiDeliverySystemEvent(
    {
      tenantId: input.tenantId,
      aiDeliveryProjectId: input.aiDeliveryProjectId,
      eventName: "AI_DELIVERY_CONTENT_DRAFT_UPDATED",
      relatedEntityId: existingDraft.id
    },
    tx
  );

  return buildAiDeliveryWorkflowLogEntries(input.finishedAtIso, [
    `Generated content draft updated for selected content plan item ${input.generatedDraft.contentPlanItemId}.`
  ]);
}

export async function listAiDeliveryWorkflowRuns(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<AiDeliveryWorkflowRunsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: aiDeliveryProjectId, tenantId, isArchived: false },
    select: { id: true }
  });
  if (!project) return null;

  const workflowRuns = await getAiDeliveryWorkflowRunDelegate(prisma).findMany({
    where: { tenantId, aiDeliveryProjectId },
    orderBy: { createdAt: "desc" },
    select: aiDeliveryWorkflowRunSelect
  });

  return { workflowRuns: workflowRuns.map(toAiDeliveryWorkflowRunSummary) };
}

export async function createAiDeliveryWorkflowRun(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  input: AiDeliveryWorkflowRunInputRequest
): Promise<AiDeliveryWorkflowRunResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await tx.aiDeliveryProject.findFirst({
      where: { id: aiDeliveryProjectId, tenantId, isArchived: false },
      select: { id: true, brief: { select: { id: true } } }
    });
    if (!project?.brief) return null;

    const status = normalizeAiDeliveryWorkflowRunStatus(input.status);
    if (status !== "DRAFT") {
      throw new Error("AI_DELIVERY_WORKFLOW_RUN_INVALID_STATUS_TRANSITION");
    }

    const created = await getAiDeliveryWorkflowRunDelegate(tx).create({
      data: {
        tenantId,
        aiDeliveryProjectId: project.id,
        status,
        adminNotes: toNullableString(input.adminNotes),
        resultPlaceholder: toNullableString(input.resultPlaceholder)
      },
      select: aiDeliveryWorkflowRunSelect
    });

    const createdWorkflowRun = toAiDeliveryWorkflowRunSummary(created);
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId: project.id,
        eventName: "AI_DELIVERY_WORKFLOW_RUN_CREATED",
        relatedEntityId: createdWorkflowRun.id
      },
      tx
    );

    return { workflowRun: createdWorkflowRun };
  });
}

export async function updateAiDeliveryWorkflowRun(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  workflowRunId: string,
  input: AiDeliveryWorkflowRunInputRequest
): Promise<AiDeliveryWorkflowRunResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryWorkflowRunDelegate(tx).findFirst({
      where: { id: workflowRunId, tenantId, aiDeliveryProjectId },
      select: aiDeliveryWorkflowRunSelect
    }) as any;
    if (!existing) return null;

    const currentStatus = normalizeAiDeliveryWorkflowRunStatus(existing.status);
    const nextStatus = normalizeAiDeliveryWorkflowRunStatus(input.status ?? existing.status);
    if (!canTransitionAiDeliveryWorkflowRunStatus(currentStatus, nextStatus)) {
      throw new Error("AI_DELIVERY_WORKFLOW_RUN_INVALID_STATUS_TRANSITION");
    }

    const updated = await getAiDeliveryWorkflowRunDelegate(tx).update({
      where: { id: workflowRunId },
      data: {
        status: nextStatus,
        adminNotes: toNullableString(input.adminNotes),
        resultPlaceholder: toNullableString(input.resultPlaceholder)
      },
      select: aiDeliveryWorkflowRunSelect
    });

    const updatedWorkflowRun = toAiDeliveryWorkflowRunSummary(updated);
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_WORKFLOW_RUN_UPDATED",
        relatedEntityId: updatedWorkflowRun.id
      },
      tx
    );

    return { workflowRun: updatedWorkflowRun };
  });
}

const AI_DELIVERY_GENERATE_CONTENT_PLAN_MARKER = "[generate-content-plan]";

function resolveAiDeliveryWorkflowKnowledgeType(
  adminNotes: string | null,
  hasSelectedContentPlanItem: boolean
): string {
  if (hasSelectedContentPlanItem) {
    return "article_draft";
  }

  return (adminNotes ?? "").toLowerCase().includes(AI_DELIVERY_GENERATE_CONTENT_PLAN_MARKER)
    ? "content_plan_draft"
    : "summary";
}

function toAiDeliveryWorkflowExecutionKnowledgeContext(
  result: Awaited<ReturnType<typeof buildAiWorkflowKnowledgeContext>>
): AiDeliveryWorkflowExecutionKnowledgeContext {
  return {
    used: result.used,
    contextSection: result.contextSection,
    selectedCount: result.selectedCount,
    selectedItemTitles: result.selectedItemTitles,
    skippedReason: result.skippedReason,
    sanitizeFlagCount: result.sanitizeFlagCount,
    trimmed: result.trimmed
  };
}

function buildAiWorkflowObservabilityLogLine(result: AiWorkflowResultV1): string {
  const payload = {
    version: "AI_WORKFLOW_OBSERVABILITY_V1",
    gateway: result.gateway,
    model: result.model,
    outputType: result.outputType,
    liveProviderCalled: result.gateway === "openrouter",
    budgetPolicy: result.budget.budgetPolicy,
    approximateInputTokens: result.budget.approximateInputTokens,
    maxOutputTokens: result.budget.maxOutputTokens,
    safeError: result.safeError
  };
  return `[OBSERVABILITY] ${JSON.stringify(payload)}`;
}

function buildAiWorkflowObservabilityMetadata(result: AiWorkflowResultV1): Prisma.InputJsonValue {
  return {
    gateway: result.gateway,
    model: result.model,
    outputType: result.outputType,
    liveProviderCalled: result.gateway === "openrouter",
    budgetPolicy: result.budget.budgetPolicy,
    approximateInputTokens: result.budget.approximateInputTokens,
    maxOutputTokens: result.budget.maxOutputTokens,
    safeError: result.safeError ?? null
  };
}

export async function executeAiDeliveryWorkflowRun(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  workflowRunId: string,
  input?: { contentPlanItemId?: string | null }
): Promise<AiDeliveryWorkflowRunResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const startedExecution = await prisma.$transaction(async (tx: PrismaTx) => {
    const project = await tx.aiDeliveryProject.findFirst({
      where: { id: aiDeliveryProjectId, tenantId, isArchived: false },
      select: {
        id: true,
        clientId: true,
        name: true,
        targetMonth: true,
        plannedContentScopeNotes: true,
        brief: { select: { id: true, status: true, notes: true } }
      }
    });
    if (!project?.brief) return null;

    const existing = await getAiDeliveryWorkflowRunDelegate(tx).findFirst({
      where: { id: workflowRunId, tenantId, aiDeliveryProjectId },
      select: aiDeliveryWorkflowRunSelect
    }) as any;
    if (!existing) return null;

    const currentStatus = normalizeAiDeliveryWorkflowRunStatus(existing.status);
    if (currentStatus === "ARCHIVED") {
      throw new Error("AI_DELIVERY_WORKFLOW_RUN_EXECUTION_ARCHIVED");
    }
    if (currentStatus === "COMPLETED") {
      throw new Error("AI_DELIVERY_WORKFLOW_RUN_EXECUTION_COMPLETED");
    }
    if (currentStatus === "IN_PROGRESS") {
      throw new Error("AI_DELIVERY_WORKFLOW_RUN_EXECUTION_ALREADY_RUNNING");
    }
    if (currentStatus === "REVIEW") {
      throw new Error("AI_DELIVERY_WORKFLOW_RUN_EXECUTION_REVIEW_PENDING");
    }

    const selectedContentPlanItem = await getContentPlanItemForDraft(tx, tenantId, aiDeliveryProjectId, input?.contentPlanItemId);
    if (input?.contentPlanItemId && !selectedContentPlanItem) {
      throwAiDeliveryBadRequest("AI_DELIVERY_WORKFLOW_RUN_CONTENT_PLAN_ITEM_LINK_INVALID", "Selected content plan item must belong to the same AI Delivery project.");
    }

    const researchSummaries = await getAiDeliveryResearchSummaryDelegate(tx).findMany({
      where: {
        tenantId,
        aiDeliveryProjectId,
        status: "FINALIZED"
      },
      orderBy: [
        { updatedAt: "desc" },
        { id: "desc" }
      ],
      take: 3,
      select: {
        title: true,
        summaryText: true,
        keyFindings: true,
        keywordOpportunities: true,
        contentRecommendations: true
      }
    }) as AiDeliveryWorkflowExecutionResearchSummaryContext[];

    const approvedSourceMetadata = await getAiDeliveryResearchSourceDelegate(tx).findMany({
      where: {
        tenantId,
        aiDeliveryProjectId,
        status: "APPROVED"
      },
      orderBy: [
        { updatedAt: "desc" },
        { id: "desc" }
      ],
      take: 4,
      select: {
        sourceTitle: true,
        sourceType: true,
        reviewNotes: true,
        researchRequest: {
          select: {
            title: true
          }
        }
      }
    }) as Array<{
      sourceTitle: string | null;
      sourceType: string;
      reviewNotes: string | null;
      researchRequest: {
        title: string;
      } | null;
    }>;

    const marketIntelligenceHandoffs = await tx.marketIntelligenceHandoff.findMany({
      where: {
        tenantId,
        aiDeliveryProjectId,
        isArchived: false,
        handoffStatus: "APPLIED"
      },
      orderBy: { updatedAt: "desc" },
      take: 2,
      select: {
        title: true,
        marketSummary: true,
        competitorSummary: true,
        audienceSignals: true,
        opportunities: true,
        risks: true,
        recommendedActions: true,
        sourceNote: true
      }
    });

    const executionAdapter = createAiDeliveryWorkflowExecutionAdapter(getAiProviderConfig());
    const startedAt = new Date();
    const startedLog = appendAiDeliveryWorkflowExecutionLog(existing.executionLog, executionAdapter.createStartedLogEntries({
      projectName: project.name,
      targetMonth: String(project.targetMonth),
      briefStatus: project.brief.status,
      adminNotes: existing.adminNotes,
      selectedContentPlanItem: selectedContentPlanItem
        ? {
            id: selectedContentPlanItem.id,
            title: selectedContentPlanItem.title,
            targetKeyword: selectedContentPlanItem.targetKeyword ?? null,
            contentType: selectedContentPlanItem.contentType,
            notes: selectedContentPlanItem.notes ?? null,
            sortOrder: selectedContentPlanItem.sortOrder,
            approvalStatus: selectedContentPlanItem.approvalStatus ?? null
          }
        : null,
      startedAtIso: startedAt.toISOString()
    }));

    await getAiDeliveryWorkflowRunDelegate(tx).update({
      where: { id: workflowRunId },
      data: {
        status: "IN_PROGRESS",
        startedAt,
        finishedAt: null,
        executionError: null,
        executionLog: startedLog
      }
    });

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_WORKFLOW_RUN_EXECUTION_STARTED",
        relatedEntityId: workflowRunId
      },
      tx
    );

    return {
      executionAdapter,
      clientId: project.clientId,
      projectName: project.name,
      targetMonth: String(project.targetMonth),
      briefStatus: project.brief.status,
      briefNotes: toNullableString(project.brief.notes),
      plannedContentScopeNotes: toNullableString(project.plannedContentScopeNotes),
      adminNotes: existing.adminNotes,
      existingResultPlaceholder: toNullableString(existing.resultPlaceholder),
      researchSummaries,
      approvedSourceMetadata: approvedSourceMetadata.map((source): AiDeliveryWorkflowExecutionSourceContext => ({
        sourceTitle: source.sourceTitle ?? null,
        sourceType: source.sourceType,
        reviewNotes: source.reviewNotes ?? null,
        researchRequestTitle: source.researchRequest?.title ?? null
      })),
      marketIntelligenceHandoffs: marketIntelligenceHandoffs.map(toAiDeliveryWorkflowExecutionMiHandoffContext),
      selectedContentPlanItem: selectedContentPlanItem
        ? {
            id: selectedContentPlanItem.id,
            title: selectedContentPlanItem.title,
            targetKeyword: selectedContentPlanItem.targetKeyword ?? null,
            contentType: selectedContentPlanItem.contentType,
            notes: selectedContentPlanItem.notes ?? null,
            sortOrder: selectedContentPlanItem.sortOrder,
            approvalStatus: selectedContentPlanItem.approvalStatus ?? null
          } satisfies AiDeliveryWorkflowExecutionContentPlanItemContext
        : null,
      startedLog
    };
  });

  if (!startedExecution) return null;

  const workflowKnowledgeType = resolveAiDeliveryWorkflowKnowledgeType(
    startedExecution.adminNotes,
    Boolean(startedExecution.selectedContentPlanItem)
  );
  const workflowKnowledgeResult = await buildAiWorkflowKnowledgeContext({
    tenantId,
    clientId: startedExecution.clientId,
    aiDeliveryProjectId,
    workflowType: workflowKnowledgeType
  });
  const knowledgeContext = toAiDeliveryWorkflowExecutionKnowledgeContext(workflowKnowledgeResult);

  const finishedAt = new Date();
  const executionPlan = await startedExecution.executionAdapter.execute({
    projectName: startedExecution.projectName,
    targetMonth: startedExecution.targetMonth,
    briefStatus: startedExecution.briefStatus,
    briefNotes: startedExecution.briefNotes,
    plannedContentScopeNotes: startedExecution.plannedContentScopeNotes,
    adminNotes: startedExecution.adminNotes,
    existingResultPlaceholder: startedExecution.existingResultPlaceholder,
    researchSummaries: startedExecution.researchSummaries,
    approvedSourceMetadata: startedExecution.approvedSourceMetadata,
    marketIntelligenceHandoffs: startedExecution.marketIntelligenceHandoffs,
    knowledgeContext,
    selectedContentPlanItem: startedExecution.selectedContentPlanItem,
    finishedAtIso: finishedAt.toISOString()
  });

  return prisma.$transaction(async (tx: PrismaTx) => {
    const current = await getAiDeliveryWorkflowRunDelegate(tx).findFirst({
      where: { id: workflowRunId, tenantId, aiDeliveryProjectId },
      select: aiDeliveryWorkflowRunSelect
    }) as any;
    if (!current) return null;

    if (normalizeAiDeliveryWorkflowRunStatus(current.status) !== "IN_PROGRESS") {
      return { workflowRun: toAiDeliveryWorkflowRunSummary(current) };
    }

    if (executionPlan.finalStatus === "FAILED") {
      const failedLog = appendAiDeliveryWorkflowExecutionLog(startedExecution.startedLog, executionPlan.finishedLogEntries);

      const failed = await getAiDeliveryWorkflowRunDelegate(tx).update({
        where: { id: workflowRunId },
        data: {
          status: "FAILED",
          finishedAt,
          executionError: executionPlan.executionError,
          executionLog: failedLog
        },
        select: aiDeliveryWorkflowRunSelect
      });

      await recordAiDeliverySystemEvent(
        {
          tenantId,
          aiDeliveryProjectId,
          eventName: "AI_DELIVERY_WORKFLOW_RUN_EXECUTION_FAILED",
          relatedEntityId: workflowRunId
        },
        tx
      );

      return { workflowRun: toAiDeliveryWorkflowRunSummary(failed) };
    }

    const contentPlanPersistenceLogEntries = executionPlan.generatedContentPlanItems
      ? await persistGeneratedAiDeliveryContentPlan(tx, {
          tenantId,
          aiDeliveryProjectId,
          generatedItems: executionPlan.generatedContentPlanItems,
          finishedAtIso: finishedAt.toISOString()
        })
      : [];
    const contentDraftPersistenceLogEntries = executionPlan.generatedContentDraft
      ? await persistGeneratedAiDeliveryContentDraft(tx, {
          tenantId,
          aiDeliveryProjectId,
          generatedDraft: executionPlan.generatedContentDraft,
          finishedAtIso: finishedAt.toISOString()
        })
      : [];

    const completedLog = appendAiDeliveryWorkflowExecutionLog(
      startedExecution.startedLog,
      [
        ...executionPlan.finishedLogEntries,
        buildAiWorkflowObservabilityLogLine(executionPlan.workflowResult),
        ...contentPlanPersistenceLogEntries,
        ...contentDraftPersistenceLogEntries
      ]
    );

    const reviewed = await getAiDeliveryWorkflowRunDelegate(tx).update({
      where: { id: workflowRunId },
      data: {
        status: "REVIEW",
        finishedAt,
        executionError: null,
        executionLog: completedLog,
        resultPlaceholder: executionPlan.resultPlaceholder
      },
      select: aiDeliveryWorkflowRunSelect
    });

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_WORKFLOW_RUN_EXECUTION_COMPLETED",
        relatedEntityId: workflowRunId
      },
      tx
    );

    await recordPlatformAuditEvent({
      tenantId,
      action: "AI_WORKFLOW_RUN_COMPLETED",
      entityType: "AI_DELIVERY_WORKFLOW_RUN",
      entityId: workflowRunId,
      metadata: buildAiWorkflowObservabilityMetadata(executionPlan.workflowResult)
    });

    return { workflowRun: toAiDeliveryWorkflowRunSummary(reviewed) };
  });
}

const aiDeliveryResearchRequestSelect = {
  id: true,
  tenantId: true,
  aiDeliveryProjectId: true,
  workflowRunId: true,
  title: true,
  description: true,
  requestType: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  workflowRun: {
    select: {
      id: true,
      status: true
    }
  }
} as const;

const aiDeliveryResearchSourceSelect = {
  id: true,
  tenantId: true,
  aiDeliveryProjectId: true,
  researchRequestId: true,
  workflowRunId: true,
  sourceUrl: true,
  sourceTitle: true,
  sourceType: true,
  status: true,
  reviewNotes: true,
  createdAt: true,
  updatedAt: true,
  researchRequest: {
    select: {
      id: true,
      title: true,
      status: true
    }
  },
  workflowRun: {
    select: {
      id: true,
      status: true
    }
  }
} as const;

function normalizeAiDeliveryResearchRequestStatus(value: string | null | undefined): AiDeliveryResearchRequestStatus {
  const status = value ? value.trim().toUpperCase() : null;
  return status && AI_DELIVERY_RESEARCH_REQUEST_STATUSES.includes(status as AiDeliveryResearchRequestStatus)
    ? (status as AiDeliveryResearchRequestStatus)
    : "DRAFT";
}

function normalizeAiDeliveryResearchSourceStatus(value: string | null | undefined): AiDeliveryResearchSourceStatus {
  const status = value ? value.trim().toUpperCase() : null;
  return status && AI_DELIVERY_RESEARCH_SOURCE_STATUSES.includes(status as AiDeliveryResearchSourceStatus)
    ? (status as AiDeliveryResearchSourceStatus)
    : "PROPOSED";
}

function normalizeAiDeliveryResearchSourceType(value: string | null | undefined): AiDeliveryResearchSourceType {
  const sourceType = value ? value.trim().toUpperCase() : null;
  return sourceType && AI_DELIVERY_RESEARCH_SOURCE_TYPES.includes(sourceType as AiDeliveryResearchSourceType)
    ? (sourceType as AiDeliveryResearchSourceType)
    : "WEBSITE";
}

function toAiDeliveryResearchRequestSummary(request: any) {
  return {
    id: request.id,
    tenantId: request.tenantId,
    aiDeliveryProjectId: request.aiDeliveryProjectId,
    workflowRunId: request.workflowRunId ?? null,
    workflowRun: request.workflowRun
      ? {
          id: request.workflowRun.id,
          status: request.workflowRun.status
        }
      : null,
    title: request.title,
    description: request.description ?? null,
    requestType: request.requestType ?? null,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString()
  };
}

function toAiDeliveryResearchSourceSummary(source: any) {
  return {
    id: source.id,
    tenantId: source.tenantId,
    aiDeliveryProjectId: source.aiDeliveryProjectId,
    researchRequestId: source.researchRequestId ?? null,
    workflowRunId: source.workflowRunId ?? null,
    researchRequest: source.researchRequest
      ? {
          id: source.researchRequest.id,
          title: source.researchRequest.title,
          status: source.researchRequest.status
        }
      : null,
    workflowRun: source.workflowRun
      ? {
          id: source.workflowRun.id,
          status: source.workflowRun.status
        }
      : null,
    sourceUrl: source.sourceUrl,
    sourceTitle: source.sourceTitle ?? null,
    sourceType: source.sourceType,
    status: source.status,
    reviewNotes: source.reviewNotes ?? null,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString()
  };
}

async function getAiDeliveryActiveProject(tx: PrismaTx | typeof prisma, tenantId: string, aiDeliveryProjectId: string) {
  return tx.aiDeliveryProject.findFirst({
    where: { id: aiDeliveryProjectId, tenantId, isArchived: false },
    select: { id: true }
  });
}

async function getAiDeliveryProjectResearchRequest(tx: PrismaTx | typeof prisma, tenantId: string, aiDeliveryProjectId: string, researchRequestId: string) {
  return getAiDeliveryResearchRequestDelegate(tx).findFirst({
    where: { id: researchRequestId, tenantId, aiDeliveryProjectId },
    select: { id: true }
  });
}

export async function listAiDeliveryResearchRequests(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<AiDeliveryResearchRequestsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const project = await getAiDeliveryActiveProject(prisma, tenantId, aiDeliveryProjectId);
  if (!project) return null;

  const researchRequests = await getAiDeliveryResearchRequestDelegate(prisma).findMany({
    where: { tenantId, aiDeliveryProjectId },
    orderBy: { updatedAt: "desc" },
    select: aiDeliveryResearchRequestSelect
  });

  return { researchRequests: researchRequests.map(toAiDeliveryResearchRequestSummary) };
}

export async function createAiDeliveryResearchRequest(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  input: AiDeliveryResearchRequestInputRequest
): Promise<AiDeliveryResearchRequestResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await getAiDeliveryActiveProject(tx, tenantId, aiDeliveryProjectId);
    if (!project) return null;

    const workflowRunId = toNullableString(input.workflowRunId);
    if (workflowRunId) {
      const workflowRun = await getAiDeliveryProjectWorkflowRun(tx, tenantId, aiDeliveryProjectId, workflowRunId);
      if (!workflowRun) {
        throwAiDeliveryBadRequest("AI_DELIVERY_RESEARCH_REQUEST_WORKFLOW_RUN_LINK_INVALID", "Workflow run must belong to the same AI Delivery project.");
      }
    }

    const created = await getAiDeliveryResearchRequestDelegate(tx).create({
      data: {
        tenantId,
        aiDeliveryProjectId,
        workflowRunId,
        title: input.title?.trim() ?? "",
        description: toNullableString(input.description),
        requestType: toNullableString(input.requestType),
        status: normalizeAiDeliveryResearchRequestStatus(input.status)
      },
      select: aiDeliveryResearchRequestSelect
    });

    const createdRequest = toAiDeliveryResearchRequestSummary(created);
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_RESEARCH_REQUEST_CREATED",
        relatedEntityId: createdRequest.id
      },
      tx
    );

    return { researchRequest: createdRequest };
  });
}

export async function updateAiDeliveryResearchRequest(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  researchRequestId: string,
  input: AiDeliveryResearchRequestInputRequest
): Promise<AiDeliveryResearchRequestResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await getAiDeliveryActiveProject(tx, tenantId, aiDeliveryProjectId);
    if (!project) return null;

    const existing = await getAiDeliveryResearchRequestDelegate(tx).findFirst({
      where: { id: researchRequestId, tenantId, aiDeliveryProjectId },
      select: aiDeliveryResearchRequestSelect
    }) as any;
    if (!existing) return null;

    let workflowRunId: string | null | undefined;
    if (input.workflowRunId !== undefined) {
      workflowRunId = toNullableString(input.workflowRunId);
      if (workflowRunId) {
        const workflowRun = await getAiDeliveryProjectWorkflowRun(tx, tenantId, aiDeliveryProjectId, workflowRunId);
        if (!workflowRun) {
          throwAiDeliveryBadRequest("AI_DELIVERY_RESEARCH_REQUEST_WORKFLOW_RUN_LINK_INVALID", "Workflow run must belong to the same AI Delivery project.");
        }
      }
    }

    const updated = await getAiDeliveryResearchRequestDelegate(tx).update({
      where: { id: researchRequestId },
      data: {
        title: input.title === undefined ? existing.title : input.title.trim(),
        description: input.description === undefined ? existing.description : toNullableString(input.description),
        requestType: input.requestType === undefined ? existing.requestType : toNullableString(input.requestType),
        status: input.status ? normalizeAiDeliveryResearchRequestStatus(input.status) : existing.status,
        ...(workflowRunId !== undefined ? { workflowRunId } : {})
      },
      select: aiDeliveryResearchRequestSelect
    });

    const updatedRequest = toAiDeliveryResearchRequestSummary(updated);
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_RESEARCH_REQUEST_UPDATED",
        relatedEntityId: updatedRequest.id
      },
      tx
    );

    return { researchRequest: updatedRequest };
  });
}

export async function listAiDeliveryResearchSources(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  researchRequestId?: string | null
): Promise<AiDeliveryResearchSourcesResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const project = await getAiDeliveryActiveProject(prisma, tenantId, aiDeliveryProjectId);
  if (!project) return null;

  const normalizedResearchRequestId = toNullableString(researchRequestId ?? null);
  if (normalizedResearchRequestId) {
    const request = await getAiDeliveryProjectResearchRequest(prisma, tenantId, aiDeliveryProjectId, normalizedResearchRequestId);
    if (!request) {
      throwAiDeliveryBadRequest("AI_DELIVERY_RESEARCH_SOURCE_FILTER_REQUEST_LINK_INVALID", "Research request filter must belong to the same AI Delivery project.");
    }
  }

  const researchSources = await getAiDeliveryResearchSourceDelegate(prisma).findMany({
    where: {
      tenantId,
      aiDeliveryProjectId,
      ...(normalizedResearchRequestId ? { researchRequestId: normalizedResearchRequestId } : {})
    },
    orderBy: { updatedAt: "desc" },
    select: aiDeliveryResearchSourceSelect
  });

  return { researchSources: researchSources.map(toAiDeliveryResearchSourceSummary) };
}

export async function createAiDeliveryResearchSource(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  input: AiDeliveryResearchSourceInputRequest
): Promise<AiDeliveryResearchSourceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await getAiDeliveryActiveProject(tx, tenantId, aiDeliveryProjectId);
    if (!project) return null;

    const researchRequestId = toNullableString(input.researchRequestId);
    if (researchRequestId) {
      const request = await getAiDeliveryProjectResearchRequest(tx, tenantId, aiDeliveryProjectId, researchRequestId);
      if (!request) {
        throwAiDeliveryBadRequest("AI_DELIVERY_RESEARCH_SOURCE_REQUEST_LINK_INVALID", "Research request must belong to the same AI Delivery project.");
      }
    }

    const workflowRunId = toNullableString(input.workflowRunId);
    if (workflowRunId) {
      const workflowRun = await getAiDeliveryProjectWorkflowRun(tx, tenantId, aiDeliveryProjectId, workflowRunId);
      if (!workflowRun) {
        throwAiDeliveryBadRequest("AI_DELIVERY_RESEARCH_SOURCE_WORKFLOW_RUN_LINK_INVALID", "Workflow run must belong to the same AI Delivery project.");
      }
    }

    const created = await getAiDeliveryResearchSourceDelegate(tx).create({
      data: {
        tenantId,
        aiDeliveryProjectId,
        researchRequestId,
        workflowRunId,
        sourceUrl: input.sourceUrl?.trim() ?? "",
        sourceTitle: toNullableString(input.sourceTitle),
        sourceType: normalizeAiDeliveryResearchSourceType(input.sourceType),
        status: normalizeAiDeliveryResearchSourceStatus(input.status),
        reviewNotes: toNullableString(input.reviewNotes)
      },
      select: aiDeliveryResearchSourceSelect
    });

    const createdSource = toAiDeliveryResearchSourceSummary(created);
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_RESEARCH_SOURCE_CREATED",
        relatedEntityId: createdSource.id
      },
      tx
    );

    return { researchSource: createdSource };
  });
}

export async function updateAiDeliveryResearchSource(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  researchSourceId: string,
  input: AiDeliveryResearchSourceInputRequest
): Promise<AiDeliveryResearchSourceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await getAiDeliveryActiveProject(tx, tenantId, aiDeliveryProjectId);
    if (!project) return null;

    const existing = await getAiDeliveryResearchSourceDelegate(tx).findFirst({
      where: { id: researchSourceId, tenantId, aiDeliveryProjectId },
      select: aiDeliveryResearchSourceSelect
    }) as any;
    if (!existing) return null;

    let researchRequestId: string | null | undefined;
    if (input.researchRequestId !== undefined) {
      researchRequestId = toNullableString(input.researchRequestId);
      if (researchRequestId) {
        const request = await getAiDeliveryProjectResearchRequest(tx, tenantId, aiDeliveryProjectId, researchRequestId);
        if (!request) {
          throwAiDeliveryBadRequest("AI_DELIVERY_RESEARCH_SOURCE_REQUEST_LINK_INVALID", "Research request must belong to the same AI Delivery project.");
        }
      }
    }

    let workflowRunId: string | null | undefined;
    if (input.workflowRunId !== undefined) {
      workflowRunId = toNullableString(input.workflowRunId);
      if (workflowRunId) {
        const workflowRun = await getAiDeliveryProjectWorkflowRun(tx, tenantId, aiDeliveryProjectId, workflowRunId);
        if (!workflowRun) {
          throwAiDeliveryBadRequest("AI_DELIVERY_RESEARCH_SOURCE_WORKFLOW_RUN_LINK_INVALID", "Workflow run must belong to the same AI Delivery project.");
        }
      }
    }

    const updated = await getAiDeliveryResearchSourceDelegate(tx).update({
      where: { id: researchSourceId },
      data: {
        sourceUrl: input.sourceUrl === undefined ? existing.sourceUrl : input.sourceUrl.trim(),
        sourceTitle: input.sourceTitle === undefined ? existing.sourceTitle : toNullableString(input.sourceTitle),
        sourceType: input.sourceType ? normalizeAiDeliveryResearchSourceType(input.sourceType) : existing.sourceType,
        status: input.status ? normalizeAiDeliveryResearchSourceStatus(input.status) : existing.status,
        reviewNotes: input.reviewNotes === undefined ? existing.reviewNotes : toNullableString(input.reviewNotes),
        ...(researchRequestId !== undefined ? { researchRequestId } : {}),
        ...(workflowRunId !== undefined ? { workflowRunId } : {})
      },
      select: aiDeliveryResearchSourceSelect
    });

    const updatedSource = toAiDeliveryResearchSourceSummary(updated);
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_RESEARCH_SOURCE_UPDATED",
        relatedEntityId: updatedSource.id
      },
      tx
    );

    return { researchSource: updatedSource };
  });
}

const aiDeliveryResearchSummarySelect = {
  id: true,
  tenantId: true,
  aiDeliveryProjectId: true,
  workflowRunId: true,
  title: true,
  status: true,
  summaryText: true,
  keyFindings: true,
  audienceInsights: true,
  competitorInsights: true,
  keywordOpportunities: true,
  contentRecommendations: true,
  briefRevisionNotes: true,
  sourceNotes: true,
  finalizedAt: true,
  createdAt: true,
  updatedAt: true,
  workflowRun: {
    select: {
      id: true,
      status: true
    }
  }
} as const;

function normalizeAiDeliveryResearchSummaryStatus(value: string | null | undefined): AiDeliveryResearchSummaryStatus {
  const status = value ? value.trim().toUpperCase() : null;
  return status && AI_DELIVERY_RESEARCH_SUMMARY_STATUSES.includes(status as AiDeliveryResearchSummaryStatus)
    ? (status as AiDeliveryResearchSummaryStatus)
    : "DRAFT";
}

function toAiDeliveryResearchSummarySummary(summary: any) {
  return {
    id: summary.id,
    tenantId: summary.tenantId,
    aiDeliveryProjectId: summary.aiDeliveryProjectId,
    workflowRunId: summary.workflowRunId ?? null,
    workflowRun: summary.workflowRun
      ? {
          id: summary.workflowRun.id,
          status: summary.workflowRun.status
        }
      : null,
    title: summary.title,
    status: summary.status,
    summaryText: summary.summaryText,
    keyFindings: summary.keyFindings ?? null,
    audienceInsights: summary.audienceInsights ?? null,
    competitorInsights: summary.competitorInsights ?? null,
    keywordOpportunities: summary.keywordOpportunities ?? null,
    contentRecommendations: summary.contentRecommendations ?? null,
    briefRevisionNotes: summary.briefRevisionNotes ?? null,
    sourceNotes: summary.sourceNotes ?? null,
    finalizedAt: summary.finalizedAt ? summary.finalizedAt.toISOString() : null,
    createdAt: summary.createdAt.toISOString(),
    updatedAt: summary.updatedAt.toISOString()
  };
}

function buildAiDeliveryBriefNotesFromResearchSummary(summary: ReturnType<typeof toAiDeliveryResearchSummarySummary>): string {
  const sections = [
    `Research summary applied: ${summary.title}`,
    `Status: ${summary.status}`,
    `Summary: ${summary.summaryText}`,
    summary.keyFindings ? `Key findings: ${summary.keyFindings}` : null,
    summary.audienceInsights ? `Audience insights: ${summary.audienceInsights}` : null,
    summary.competitorInsights ? `Competitor insights: ${summary.competitorInsights}` : null,
    summary.keywordOpportunities ? `Keyword opportunities: ${summary.keywordOpportunities}` : null,
    summary.contentRecommendations ? `Content recommendations: ${summary.contentRecommendations}` : null,
    summary.briefRevisionNotes ? `Brief revision notes: ${summary.briefRevisionNotes}` : null,
    summary.sourceNotes ? `Source notes: ${summary.sourceNotes}` : null
  ].filter(Boolean) as string[];

  return sections.join("\n");
}

async function getAiDeliveryProjectBrief(tx: PrismaTx, tenantId: string, aiDeliveryProjectId: string) {
  return tx.aiDeliveryBrief.findFirst({
    where: { tenantId, aiDeliveryProjectId },
    select: { id: true, notes: true, updatedAt: true }
  });
}

export async function listAiDeliveryResearchSummaries(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<AiDeliveryResearchSummariesResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const project = await getAiDeliveryActiveProject(prisma, tenantId, aiDeliveryProjectId);
  if (!project) return null;

  const researchSummaries = await getAiDeliveryResearchSummaryDelegate(prisma).findMany({
    where: { tenantId, aiDeliveryProjectId },
    orderBy: { updatedAt: "desc" },
    select: aiDeliveryResearchSummarySelect
  });

  return { researchSummaries: researchSummaries.map(toAiDeliveryResearchSummarySummary) };
}

export async function createAiDeliveryResearchSummary(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  input: AiDeliveryResearchSummaryInputRequest
): Promise<AiDeliveryResearchSummaryResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await getAiDeliveryActiveProject(tx, tenantId, aiDeliveryProjectId);
    if (!project) return null;

    const workflowRunId = toNullableString(input.workflowRunId);
    if (workflowRunId) {
      const workflowRun = await getAiDeliveryProjectWorkflowRun(tx, tenantId, aiDeliveryProjectId, workflowRunId);
      if (!workflowRun) {
        throwAiDeliveryBadRequest("AI_DELIVERY_RESEARCH_SUMMARY_WORKFLOW_RUN_LINK_INVALID", "Workflow run must belong to the same AI Delivery project.");
      }
    }

    const status = normalizeAiDeliveryResearchSummaryStatus(input.status);
    const finalizedAt = status === "FINALIZED" ? new Date() : null;
    const created = await getAiDeliveryResearchSummaryDelegate(tx).create({
      data: {
        tenantId,
        aiDeliveryProjectId,
        workflowRunId,
        title: input.title?.trim() ?? "",
        status,
        summaryText: input.summaryText?.trim() ?? "",
        keyFindings: toNullableString(input.keyFindings),
        audienceInsights: toNullableString(input.audienceInsights),
        competitorInsights: toNullableString(input.competitorInsights),
        keywordOpportunities: toNullableString(input.keywordOpportunities),
        contentRecommendations: toNullableString(input.contentRecommendations),
        briefRevisionNotes: toNullableString(input.briefRevisionNotes),
        sourceNotes: toNullableString(input.sourceNotes),
        finalizedAt
      },
      select: aiDeliveryResearchSummarySelect
    });

    const createdSummary = toAiDeliveryResearchSummarySummary(created);
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_RESEARCH_SUMMARY_CREATED",
        relatedEntityId: createdSummary.id
      },
      tx
    );

    return { researchSummary: createdSummary };
  });
}

export async function updateAiDeliveryResearchSummary(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  researchSummaryId: string,
  input: AiDeliveryResearchSummaryInputRequest
): Promise<AiDeliveryResearchSummaryResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await getAiDeliveryActiveProject(tx, tenantId, aiDeliveryProjectId);
    if (!project) return null;

    const existing = await getAiDeliveryResearchSummaryDelegate(tx).findFirst({
      where: { id: researchSummaryId, tenantId, aiDeliveryProjectId },
      select: aiDeliveryResearchSummarySelect
    }) as any;
    if (!existing) return null;

    let workflowRunId: string | null | undefined;
    if (input.workflowRunId !== undefined) {
      workflowRunId = toNullableString(input.workflowRunId);
      if (workflowRunId) {
        const workflowRun = await getAiDeliveryProjectWorkflowRun(tx, tenantId, aiDeliveryProjectId, workflowRunId);
        if (!workflowRun) {
          throwAiDeliveryBadRequest("AI_DELIVERY_RESEARCH_SUMMARY_WORKFLOW_RUN_LINK_INVALID", "Workflow run must belong to the same AI Delivery project.");
        }
      }
    }

    const nextStatus = input.status ? normalizeAiDeliveryResearchSummaryStatus(input.status) : existing.status;
    const updated = await getAiDeliveryResearchSummaryDelegate(tx).update({
      where: { id: researchSummaryId },
      data: {
        title: input.title === undefined ? existing.title : input.title.trim(),
        status: nextStatus,
        summaryText: input.summaryText === undefined ? existing.summaryText : input.summaryText.trim(),
        keyFindings: input.keyFindings === undefined ? existing.keyFindings : toNullableString(input.keyFindings),
        audienceInsights: input.audienceInsights === undefined ? existing.audienceInsights : toNullableString(input.audienceInsights),
        competitorInsights: input.competitorInsights === undefined ? existing.competitorInsights : toNullableString(input.competitorInsights),
        keywordOpportunities: input.keywordOpportunities === undefined ? existing.keywordOpportunities : toNullableString(input.keywordOpportunities),
        contentRecommendations: input.contentRecommendations === undefined ? existing.contentRecommendations : toNullableString(input.contentRecommendations),
        briefRevisionNotes: input.briefRevisionNotes === undefined ? existing.briefRevisionNotes : toNullableString(input.briefRevisionNotes),
        sourceNotes: input.sourceNotes === undefined ? existing.sourceNotes : toNullableString(input.sourceNotes),
        finalizedAt: nextStatus === "FINALIZED" ? existing.finalizedAt ?? new Date() : existing.finalizedAt,
        ...(workflowRunId !== undefined ? { workflowRunId } : {})
      },
      select: aiDeliveryResearchSummarySelect
    });

    const updatedSummary = toAiDeliveryResearchSummarySummary(updated);
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_RESEARCH_SUMMARY_UPDATED",
        relatedEntityId: updatedSummary.id
      },
      tx
    );

    return { researchSummary: updatedSummary };
  });
}

export async function applyAiDeliveryResearchSummaryToBrief(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  researchSummaryId: string
): Promise<AiDeliveryResearchSummaryApplyResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await getAiDeliveryActiveProject(tx, tenantId, aiDeliveryProjectId);
    if (!project) return null;

    const summary = await getAiDeliveryResearchSummaryDelegate(tx).findFirst({
      where: { id: researchSummaryId, tenantId, aiDeliveryProjectId },
      select: aiDeliveryResearchSummarySelect
    }) as any;
    if (!summary) return null;

    const brief = await getAiDeliveryProjectBrief(tx, tenantId, aiDeliveryProjectId);
    if (!brief) return null;

    const summaryRecord = toAiDeliveryResearchSummarySummary(summary);
    const appliedBlock = buildAiDeliveryBriefNotesFromResearchSummary(summaryRecord);
    const nextNotes = [brief.notes?.trim(), appliedBlock].filter(Boolean).join("\n\n");
    const updatedBrief = await tx.aiDeliveryBrief.update({
      where: { id: brief.id },
      data: {
        notes: nextNotes
      },
      select: {
        id: true,
        notes: true,
        updatedAt: true
      }
    });

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_RESEARCH_SUMMARY_APPLIED_TO_BRIEF",
        relatedEntityId: summaryRecord.id
      },
      tx
    );

    return {
      researchSummary: summaryRecord,
      brief: {
        id: updatedBrief.id,
        notes: updatedBrief.notes ?? null,
        updatedAt: updatedBrief.updatedAt.toISOString()
      }
    };
  });
}

export async function listTasks(
  authSession: AuthResolvedSessionContext
): Promise<TasksResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const tasks = await prisma.task.findMany({
    where: {
      tenantId
    },
    orderBy: [
      {
        isArchived: "asc"
      },
      {
        createdAt: "asc"
      }
    ],
    select: {
      id: true,
      projectId: true,
      project: {
        select: {
          id: true,
          name: true,
          client: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      title: true,
      description: true,
      priority: true,
      status: true,
      dueDate: true,
      recurringType: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return {
    tasks: tasks.map(toTaskSummary)
  };
}

async function getTaskRecord(tx: PrismaTx, tenantId: string, taskId: string) {
  return tx.task.findFirst({
    where: {
      id: taskId,
      tenantId
    },
    select: {
      id: true,
      projectId: true,
      project: {
        select: {
          id: true,
          name: true,
          client: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      title: true,
      description: true,
      priority: true,
      status: true,
      dueDate: true,
      recurringType: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true
    }
  });
}

export async function getTask(
  authSession: AuthResolvedSessionContext,
  taskId: string
): Promise<TaskResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const task = await prisma.$transaction(async (tx: PrismaTx) => getTaskRecord(tx, tenantId, taskId));

  return {
    task: task ? toTaskSummary(task) : null
  };
}

export async function createTask(
  authSession: AuthResolvedSessionContext,
  input: TaskInputRequest
): Promise<TaskResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const projectId = toNullableString(input.projectId);
    const project = projectId
      ? await tx.project.findFirst({
          where: {
            id: projectId,
            tenantId
          },
          select: {
            id: true
          }
        })
      : null;

    if (projectId && !project) {
      return null;
    }

    const created = await tx.task.create({
      data: {
        tenantId,
        projectId: project?.id ?? null,
        title: input.title ?? "",
        description: toNullableString(input.description),
        priority: (input.priority as TaskPriority) ?? "NORMAL",
        status: (input.status as TaskStatus) ?? "TODO",
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        recurringType: (input.recurringType as TaskRecurringType) ?? "NONE"
      },
      select: {
        id: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        title: true,
        description: true,
        priority: true,
        status: true,
        dueDate: true,
        recurringType: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      task: toTaskSummary(created)
    };
  });
}

export async function updateTask(
  authSession: AuthResolvedSessionContext,
  taskId: string,
  input: TaskInputRequest
): Promise<TaskResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getTaskRecord(tx, tenantId, taskId);
    if (!existing) {
      return null;
    }

    const projectId = input.projectId === undefined ? existing.projectId : toNullableString(input.projectId);
    const project = projectId
      ? await tx.project.findFirst({
          where: {
            id: projectId,
            tenantId
          },
          select: {
            id: true
          }
        })
      : null;

    if (projectId && !project) {
      return null;
    }

    const updated = await tx.task.update({
      where: {
        id: taskId
      },
      data: {
        projectId: project?.id ?? null,
        title: input.title ?? existing.title,
        description: toNullableString(input.description),
        priority: (input.priority as TaskPriority) ?? existing.priority,
        status: (input.status as TaskStatus) ?? existing.status,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        recurringType: (input.recurringType as TaskRecurringType) ?? existing.recurringType
      },
      select: {
        id: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        title: true,
        description: true,
        priority: true,
        status: true,
        dueDate: true,
        recurringType: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      task: toTaskSummary(updated)
    };
  });
}

export async function archiveTask(
  authSession: AuthResolvedSessionContext,
  taskId: string
): Promise<TaskResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getTaskRecord(tx, tenantId, taskId);
    if (!existing) {
      return null;
    }

    if (existing.status !== "DONE") {
      throw new Error("TASK_ARCHIVE_BLOCKED");
    }

    const archived = await tx.task.update({
      where: {
        id: taskId
      },
      data: {
        isArchived: true
      },
      select: {
        id: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        title: true,
        description: true,
        priority: true,
        status: true,
        dueDate: true,
        recurringType: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      task: toTaskSummary(archived)
    };
  });
}

export async function restoreTask(
  authSession: AuthResolvedSessionContext,
  taskId: string
): Promise<TaskResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getTaskRecord(tx, tenantId, taskId);
    if (!existing) {
      return null;
    }

    const restored = await tx.task.update({
      where: {
        id: taskId
      },
      data: {
        isArchived: false,
        status: (existing.status as string) === "ARCHIVED" ? "TODO" : existing.status
      },
      select: {
        id: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        title: true,
        description: true,
        priority: true,
        status: true,
        dueDate: true,
        recurringType: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      task: toTaskSummary(restored)
    };
  });
}

const invoiceSelect = {
  id: true,
  clientId: true,
  client: {
    select: {
      id: true,
      name: true
    }
  },
  projectId: true,
  project: {
    select: {
      id: true,
      name: true
    }
  },
  recurringInvoiceId: true,
  invoiceNumber: true,
  status: true,
  issueDate: true,
  dueDate: true,
  paidAt: true,
  currency: true,
  subtotalCents: true,
  taxCents: true,
  discountCents: true,
  totalCents: true,
  amountPaidCents: true,
  title: true,
  notes: true,
  paymentInstructions: true,
  documentUrl: true,
  documentStorageKey: true,
  isArchived: true,
  lineItems: {
    orderBy: {
      sortOrder: "asc" as const
    },
    select: {
      id: true,
      description: true,
      quantity: true,
      unitPriceCents: true,
      totalCents: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true
    }
  },
  payment: {
    select: {
      id: true,
      invoiceId: true,
      paymentMethod: true,
      amountIssuedCents: true,
      amountReceivedCents: true,
      paymentDate: true,
      notes: true,
      createdAt: true,
      updatedAt: true
    }
  },
  creditNotes: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      invoiceId: true,
      creditNoteNumber: true,
      status: true,
      issueDate: true,
      reason: true,
      amountCents: true,
      currency: true,
      subtotalCents: true,
      taxCents: true,
      discountCents: true,
      totalCents: true,
      documentUrl: true,
      documentStorageKey: true,
      isArchived: true,
      lineItems: {
        orderBy: {
          sortOrder: "asc" as const
        },
        select: {
          id: true,
          description: true,
          quantity: true,
          unitPriceCents: true,
          totalCents: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true
        }
      },
      createdAt: true,
      updatedAt: true
    }
  },
  createdAt: true,
  updatedAt: true
} as const;

const recurringInvoiceSelect = {
  id: true,
  clientId: true,
  client: {
    select: {
      id: true,
      name: true
    }
  },
  projectId: true,
  project: {
    select: {
      id: true,
      name: true
    }
  },
  title: true,
  interval: true,
  startDate: true,
  endDate: true,
  nextRunDate: true,
  lastRunDate: true,
  currency: true,
  subtotalCents: true,
  taxCents: true,
  discountCents: true,
  totalCents: true,
  notes: true,
  paymentInstructions: true,
  documentFolderHint: true,
  isActive: true,
  isArchived: true,
  lineItems: {
    orderBy: {
      sortOrder: "asc" as const
    },
    select: {
      id: true,
      description: true,
      quantity: true,
      unitPriceCents: true,
      totalCents: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true
    }
  },
  runs: {
    orderBy: {
      scheduledFor: "desc" as const
    },
    take: 10,
    select: {
      id: true,
      scheduledFor: true,
      generatedInvoiceId: true,
      status: true,
      createdAt: true
    }
  },
  createdAt: true,
  updatedAt: true
} as const;

function toInvoiceSummary(invoice: {
  id: string;
  clientId: string;
  client: { id: string; name: string };
  projectId: string | null;
  project: { id: string; name: string } | null;
  recurringInvoiceId: string | null;
  invoiceNumber: string;
  status: string;
  issueDate: Date | null;
  dueDate: Date | null;
  paidAt: Date | null;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  amountPaidCents: number;
  title: string | null;
  notes: string | null;
  paymentInstructions: string | null;
  documentUrl: string | null;
  documentStorageKey: string | null;
  isArchived: boolean;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  payment: {
    id: string;
    invoiceId: string;
    paymentMethod: string;
    amountIssuedCents: number;
    amountReceivedCents: number;
    paymentDate: Date;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  creditNotes: Array<{
    id: string;
    invoiceId: string;
    creditNoteNumber: string;
    status: string;
    issueDate: Date | null;
    reason: string;
    amountCents: number;
    currency: string;
    subtotalCents: number;
    taxCents: number;
    discountCents: number;
    totalCents: number;
    documentUrl: string | null;
    documentStorageKey: string | null;
    isArchived: boolean;
    lineItems: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPriceCents: number;
      totalCents: number;
      sortOrder: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: invoice.id,
    clientId: invoice.clientId,
    client: invoice.client,
    projectId: invoice.projectId,
    project: invoice.project,
    recurringInvoiceId: invoice.recurringInvoiceId,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issueDate: toDateString(invoice.issueDate),
    dueDate: toDateString(invoice.dueDate),
    paidAt: toDateString(invoice.paidAt),
    currency: invoice.currency,
    subtotalCents: invoice.subtotalCents,
    taxCents: invoice.taxCents,
    discountCents: invoice.discountCents,
    totalCents: invoice.totalCents,
    amountPaidCents: invoice.amountPaidCents,
    title: invoice.title,
    notes: invoice.notes,
    paymentInstructions: invoice.paymentInstructions,
    documentUrl: invoice.documentUrl,
    documentStorageKey: invoice.documentStorageKey,
    isArchived: invoice.isArchived,
    lineItems: invoice.lineItems.map((lineItem) => ({
      ...lineItem,
      createdAt: lineItem.createdAt.toISOString(),
      updatedAt: lineItem.updatedAt.toISOString()
    })),
    payment: invoice.payment
      ? {
          ...invoice.payment,
          differenceCents: invoice.payment.amountReceivedCents - invoice.payment.amountIssuedCents,
          paymentDate: invoice.payment.paymentDate.toISOString(),
          createdAt: invoice.payment.createdAt.toISOString(),
          updatedAt: invoice.payment.updatedAt.toISOString()
        }
      : null,
    creditNotes: invoice.creditNotes.map(toCreditNoteSummary),
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString()
  };
}

function toRecurringInvoiceSummary(recurringInvoice: {
  id: string;
  clientId: string;
  client: { id: string; name: string };
  projectId: string | null;
  project: { id: string; name: string } | null;
  title: string | null;
  interval: string;
  startDate: Date;
  endDate: Date | null;
  nextRunDate: Date;
  lastRunDate: Date | null;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  notes: string | null;
  paymentInstructions: string | null;
  documentFolderHint: string | null;
  isActive: boolean;
  isArchived: boolean;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  runs: Array<{
    id: string;
    scheduledFor: Date;
    generatedInvoiceId: string | null;
    status: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: recurringInvoice.id,
    clientId: recurringInvoice.clientId,
    client: recurringInvoice.client,
    projectId: recurringInvoice.projectId,
    project: recurringInvoice.project,
    title: recurringInvoice.title,
    interval: recurringInvoice.interval,
    startDate: recurringInvoice.startDate.toISOString(),
    endDate: toDateString(recurringInvoice.endDate),
    nextRunDate: recurringInvoice.nextRunDate.toISOString(),
    lastRunDate: toDateString(recurringInvoice.lastRunDate),
    currency: recurringInvoice.currency,
    subtotalCents: recurringInvoice.subtotalCents,
    taxCents: recurringInvoice.taxCents,
    discountCents: recurringInvoice.discountCents,
    totalCents: recurringInvoice.totalCents,
    notes: recurringInvoice.notes,
    paymentInstructions: recurringInvoice.paymentInstructions,
    documentFolderHint: recurringInvoice.documentFolderHint,
    isActive: recurringInvoice.isActive,
    isArchived: recurringInvoice.isArchived,
    lineItems: recurringInvoice.lineItems.map((lineItem) => ({
      ...lineItem,
      createdAt: lineItem.createdAt.toISOString(),
      updatedAt: lineItem.updatedAt.toISOString()
    })),
    runs: recurringInvoice.runs.map((run) => ({
      id: run.id,
      scheduledFor: run.scheduledFor.toISOString(),
      generatedInvoiceId: run.generatedInvoiceId,
      status: run.status,
      createdAt: run.createdAt.toISOString()
    })),
    createdAt: recurringInvoice.createdAt.toISOString(),
    updatedAt: recurringInvoice.updatedAt.toISOString()
  };
}

async function getInvoiceRecord(tx: PrismaTx, tenantId: string, invoiceId: string) {
  return tx.invoice.findFirst({
    where: {
      id: invoiceId,
      tenantId
    },
    select: invoiceSelect
  });
}

async function getRecurringInvoiceRecord(tx: PrismaTx, tenantId: string, recurringInvoiceId: string) {
  return tx.recurringInvoice.findFirst({
    where: {
      id: recurringInvoiceId,
      tenantId
    },
    select: recurringInvoiceSelect
  });
}

async function getTenantClient(tx: PrismaTx, tenantId: string, clientId: string | undefined) {
  if (!clientId) {
    return null;
  }

  return tx.client.findFirst({
    where: {
      id: clientId,
      tenantId
    },
    select: {
      id: true,
      clientKind: true
    }
  });
}

async function getTenantProject(
  tx: PrismaTx,
  tenantId: string,
  clientId: string,
  projectId: string | null | undefined
) {
  if (!projectId) {
    return null;
  }

  return tx.project.findFirst({
    where: {
      id: projectId,
      tenantId,
      clientId
    },
    select: {
      id: true
    }
  });
}

function normalizeInvoiceStatus(value: string | null | undefined): InvoiceStatus {
  if (value === "SENT") {
    return "ISSUED";
  }
  if (value === "CANCELLED") {
    return "VOIDED";
  }
  if (value === "OVERDUE") {
    return "ISSUED";
  }
  if (value === "ISSUED" || value === "PAID" || value === "VOIDED" || value === "UNCOLLECTIBLE") {
    return value;
  }
  return "DRAFT";
}

function getNextRecurringDate(value: Date, interval: RecurringInvoiceInterval): Date {
  const nextDate = new Date(value.getTime());
  if (interval === "DAILY") {
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  } else if (interval === "WEEKLY") {
    nextDate.setUTCDate(nextDate.getUTCDate() + 7);
  } else if (interval === "MONTHLY") {
    nextDate.setUTCMonth(nextDate.getUTCMonth() + 1);
  } else {
    nextDate.setUTCFullYear(nextDate.getUTCFullYear() + 1);
  }
  return nextDate;
}

export async function listInvoices(authSession: AuthResolvedSessionContext): Promise<InvoicesResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId
    },
    orderBy: [
      {
        isArchived: "asc"
      },
      {
        createdAt: "desc"
      }
    ],
    select: invoiceSelect
  });

  return {
    invoices: invoices.map(toInvoiceSummary)
  };
}

export async function getInvoice(authSession: AuthResolvedSessionContext, invoiceId: string): Promise<InvoiceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const invoice = await prisma.$transaction(async (tx: PrismaTx) => getInvoiceRecord(tx, tenantId, invoiceId));
  return {
    invoice: invoice ? toInvoiceSummary(invoice) : null
  };
}

export async function createInvoice(
  authSession: AuthResolvedSessionContext,
  input: InvoiceInputRequest
): Promise<InvoiceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.clientId || !input.invoiceNumber || !input.lineItems?.length) {
    return null;
  }
  const clientId = input.clientId;
  const invoiceNumber = input.invoiceNumber;
  const lineItems = input.lineItems;

  try {
    return await prisma.$transaction(async (tx: PrismaTx) => {
      const client = await getTenantClient(tx, tenantId, clientId);
      if (!client) {
        return null;
      }
      if (client.clientKind === "OWN_DOMAIN") {
        return null;
      }

      const project = await getTenantProject(tx, tenantId, client.id, input.projectId);
      if (input.projectId && !project) {
        return null;
      }

      const created = await tx.invoice.create({
        data: {
          tenantId,
          clientId: client.id,
          projectId: project?.id ?? null,
          invoiceNumber,
          status: normalizeInvoiceStatus(input.status),
          issueDate: input.issueDate ? new Date(input.issueDate) : null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          paidAt: input.paidAt ? new Date(input.paidAt) : null,
          currency: input.currency ?? "USD",
          subtotalCents: input.subtotalCents ?? 0,
          taxCents: input.taxCents ?? 0,
          discountCents: input.discountCents ?? 0,
          totalCents: input.totalCents ?? 0,
          amountPaidCents: input.amountPaidCents ?? 0,
          title: toNullableString(input.title),
          notes: toNullableString(input.notes),
          paymentInstructions: toNullableString(input.paymentInstructions),
          documentUrl: toNullableString(input.documentUrl),
          documentStorageKey: toNullableString(input.documentStorageKey),
          lineItems: {
            create: lineItems.map((lineItem) => ({
              description: lineItem.description ?? "",
              quantity: lineItem.quantity ?? 1,
              unitPriceCents: lineItem.unitPriceCents ?? 0,
              totalCents: lineItem.totalCents ?? 0,
              sortOrder: lineItem.sortOrder ?? 0
            }))
          }
        },
        select: invoiceSelect
      });

      const hydrated = await getInvoiceRecord(tx, tenantId, created.id);
      await syncInvoiceToFinanceEvent(tx, tenantId, created.id);
      return {
        invoice: hydrated ? toInvoiceSummary(hydrated) : null
      };
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return null;
    }
    throw error;
  }
}

export async function updateInvoice(
  authSession: AuthResolvedSessionContext,
  invoiceId: string,
  input: InvoiceInputRequest
): Promise<InvoiceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.clientId || !input.invoiceNumber) {
    return null;
  }

  try {
    return await prisma.$transaction(async (tx: PrismaTx) => {
      const existing = await getInvoiceRecord(tx, tenantId, invoiceId);
      if (!existing) {
        return null;
      }

      const client = await getTenantClient(tx, tenantId, input.clientId);
      if (!client) {
        return null;
      }

      const project = await getTenantProject(tx, tenantId, client.id, input.projectId);
      if (input.projectId && !project) {
        return null;
      }

      if (input.lineItems) {
        await tx.invoiceLineItem.deleteMany({
          where: {
            invoiceId
          }
        });
      }

      const updated = await tx.invoice.update({
        where: {
          id: invoiceId
        },
        data: {
          clientId: client.id,
          projectId: project?.id ?? null,
          invoiceNumber: input.invoiceNumber,
          issueDate: input.issueDate ? new Date(input.issueDate) : null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          paidAt: input.paidAt ? new Date(input.paidAt) : existing.paidAt,
          currency: input.currency ?? existing.currency,
          subtotalCents: input.subtotalCents ?? existing.subtotalCents,
          taxCents: input.taxCents ?? existing.taxCents,
          discountCents: input.discountCents ?? existing.discountCents,
          totalCents: input.totalCents ?? existing.totalCents,
          amountPaidCents: input.amountPaidCents ?? existing.amountPaidCents,
          title: toNullableString(input.title),
          notes: toNullableString(input.notes),
          paymentInstructions: toNullableString(input.paymentInstructions),
          documentUrl: toNullableString(input.documentUrl),
          documentStorageKey: toNullableString(input.documentStorageKey),
          ...(input.lineItems
            ? {
                lineItems: {
                  create: input.lineItems.map((lineItem) => ({
                    description: lineItem.description ?? "",
                    quantity: lineItem.quantity ?? 1,
                    unitPriceCents: lineItem.unitPriceCents ?? 0,
                    totalCents: lineItem.totalCents ?? 0,
                    sortOrder: lineItem.sortOrder ?? 0
                  }))
                }
              }
            : {})
        },
        select: invoiceSelect
      });

      await syncInvoiceToFinanceEvent(tx, tenantId, invoiceId);
      return {
        invoice: toInvoiceSummary(updated)
      };
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return null;
    }
    throw error;
  }
}

export async function archiveInvoice(
  authSession: AuthResolvedSessionContext,
  invoiceId: string
): Promise<InvoiceResponse | null> {
  return updateInvoiceStatus(authSession, invoiceId, { isArchived: true });
}

export async function markInvoiceSent(
  authSession: AuthResolvedSessionContext,
  invoiceId: string
): Promise<InvoiceResponse | null> {
  return updateInvoiceStatus(authSession, invoiceId, { status: "ISSUED", setIssueDateIfMissing: true });
}

export async function markInvoicePaid(
  authSession: AuthResolvedSessionContext,
  invoiceId: string
): Promise<InvoiceResponse | null> {
  return updateInvoiceStatus(authSession, invoiceId, { status: "PAID", setPaidAt: true, markFullPaid: true });
}

export async function cancelInvoice(
  authSession: AuthResolvedSessionContext,
  invoiceId: string
): Promise<InvoiceResponse | null> {
  return updateInvoiceStatus(authSession, invoiceId, { status: "VOIDED" });
}

export async function markInvoiceUncollectible(
  authSession: AuthResolvedSessionContext,
  invoiceId: string
): Promise<InvoiceResponse | null> {
  return updateInvoiceStatus(authSession, invoiceId, { status: "UNCOLLECTIBLE" });
}

async function updateInvoiceStatus(
  authSession: AuthResolvedSessionContext,
  invoiceId: string,
  options: {
    status?: InvoiceStatus;
    isArchived?: boolean;
    setIssueDateIfMissing?: boolean;
    setPaidAt?: boolean;
    markFullPaid?: boolean;
  }
): Promise<InvoiceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getInvoiceRecord(tx, tenantId, invoiceId);
    if (!existing) {
      return null;
    }

    if (
      options.markFullPaid &&
      existing.amountPaidCents > 0 &&
      existing.amountPaidCents < existing.totalCents
    ) {
      throwFinanceConflict(
        "INVOICE_MARK_PAID_BLOCKED_PARTIAL_PAYMENT",
        "Invoice has a partial payment recorded and cannot be marked paid."
      );
    }

    const updated = await tx.invoice.update({
      where: {
        id: invoiceId
      },
      data: {
        ...(options.status ? { status: options.status } : {}),
        ...(options.status === "VOIDED" ? { voidedAt: new Date() } : {}),
        ...(options.status === "UNCOLLECTIBLE" ? { uncollectibleAt: new Date() } : {}),
        ...(options.isArchived === undefined ? {} : { isArchived: options.isArchived }),
        ...(options.setIssueDateIfMissing && !existing.issueDate ? { issueDate: new Date() } : {}),
        ...(options.setPaidAt ? { paidAt: new Date() } : {}),
        ...(options.markFullPaid ? { amountPaidCents: existing.totalCents } : {})
      },
      select: invoiceSelect
    });

    const hydrated = await getInvoiceRecord(tx, tenantId, updated.id);
    await syncInvoiceToFinanceEvent(tx, tenantId, invoiceId);
    return {
      invoice: hydrated ? toInvoiceSummary(hydrated) : null
    };
  });
}

const invoiceItemSelect = {
  id: true,
  name: true,
  description: true,
  unitPriceCents: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true
} as const;

function toInvoiceItemSummary(item: { id: string; name: string; description: string | null; unitPriceCents: number; isArchived: boolean; createdAt: Date; updatedAt: Date }) {
  return {
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  };
}

export async function listInvoiceItems(
  authSession: AuthResolvedSessionContext,
  options: { archived?: boolean } = {}
): Promise<InvoiceItemsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;
  const invoiceItems = await prisma.invoiceItem.findMany({
    where: { tenantId, isArchived: options.archived ?? false },
    orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    select: invoiceItemSelect
  });
  return { invoiceItems: invoiceItems.map(toInvoiceItemSummary) };
}

async function getInvoiceItemRecord(tx: PrismaTx, tenantId: string, itemId: string) {
  return tx.invoiceItem.findFirst({ where: { id: itemId, tenantId }, select: invoiceItemSelect });
}

export async function createInvoiceItem(authSession: AuthResolvedSessionContext, input: InvoiceItemInputRequest): Promise<InvoiceItemResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.name || input.unitPriceCents === undefined) return null;
  try {
    const invoiceItem = await prisma.invoiceItem.create({
      data: { tenantId, name: input.name, description: toNullableString(input.description), unitPriceCents: input.unitPriceCents },
      select: invoiceItemSelect
    });
    return { invoiceItem: toInvoiceItemSummary(invoiceItem) };
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return null;
    throw error;
  }
}

export async function updateInvoiceItem(authSession: AuthResolvedSessionContext, itemId: string, input: InvoiceItemInputRequest): Promise<InvoiceItemResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.name || input.unitPriceCents === undefined) return null;
  return prisma.$transaction(async (tx) => {
    const existing = await getInvoiceItemRecord(tx, tenantId, itemId);
    if (!existing) return null;
    const invoiceItem = await tx.invoiceItem.update({
      where: { id: itemId },
      data: { name: input.name, description: toNullableString(input.description), unitPriceCents: input.unitPriceCents },
      select: invoiceItemSelect
    });
    return { invoiceItem: toInvoiceItemSummary(invoiceItem) };
  });
}

async function updateInvoiceItemArchiveState(authSession: AuthResolvedSessionContext, itemId: string, isArchived: boolean): Promise<InvoiceItemResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;
  return prisma.$transaction(async (tx) => {
    const existing = await getInvoiceItemRecord(tx, tenantId, itemId);
    if (!existing) return null;
    const invoiceItem = await tx.invoiceItem.update({ where: { id: itemId }, data: { isArchived }, select: invoiceItemSelect });
    return { invoiceItem: toInvoiceItemSummary(invoiceItem) };
  });
}

export async function archiveInvoiceItem(authSession: AuthResolvedSessionContext, itemId: string) {
  return updateInvoiceItemArchiveState(authSession, itemId, true);
}

export async function restoreInvoiceItem(authSession: AuthResolvedSessionContext, itemId: string) {
  return updateInvoiceItemArchiveState(authSession, itemId, false);
}

export async function registerInvoicePayment(authSession: AuthResolvedSessionContext, invoiceId: string, input: InvoicePaymentInputRequest): Promise<InvoicePaymentResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.paymentMethod || input.amountIssuedCents === undefined || input.amountReceivedCents === undefined || !input.paymentDate) return null;
  const paymentMethod = input.paymentMethod;
  const amountIssuedCents = input.amountIssuedCents;
  const amountReceivedCents = input.amountReceivedCents;
  const paymentDate = input.paymentDate;
  return prisma.$transaction(async (tx) => {
    const invoice = await getInvoiceRecord(tx, tenantId, invoiceId);
    if (!invoice || invoice.payment || invoice.status === "VOIDED" || invoice.status === "UNCOLLECTIBLE") return null;
    await tx.invoicePayment.create({
      data: {
        tenantId,
        invoiceId,
        paymentMethod: paymentMethod as PaymentMethod,
        amountIssuedCents,
        amountReceivedCents,
        paymentDate: new Date(paymentDate),
        notes: toNullableString(input.notes)
      }
    });
    const updated = await tx.invoice.update({ where: { id: invoiceId }, data: { status: "PAID", paidAt: new Date(paymentDate), amountPaidCents: amountReceivedCents }, select: invoiceSelect });
    await syncInvoiceToFinanceEvent(tx, tenantId, invoiceId);
    return { invoice: toInvoiceSummary(updated) };
  });
}

async function getCompanyPrefixes(tx: PrismaTx, tenantId: string) {
  const profile = await tx.companyProfile.findUnique({ where: { tenantId }, select: { invoicePrefix: true, creditNotePrefix: true } });
  return { invoicePrefix: profile?.invoicePrefix || "DCA-INV", creditNotePrefix: profile?.creditNotePrefix || "DCA-CN" };
}

async function nextCreditNoteNumber(tx: PrismaTx, tenantId: string) {
  const year = new Date().getUTCFullYear();
  const { creditNotePrefix } = await getCompanyPrefixes(tx, tenantId);
  const startsWith = `${creditNotePrefix}-${year}-`;
  const count = await tx.creditNote.count({ where: { tenantId, creditNoteNumber: { startsWith } } });
  return `${startsWith}${String(count + 1).padStart(4, "0")}`;
}

const creditNoteSelect = {
  id: true,
  invoiceId: true,
  creditNoteNumber: true,
  status: true,
  issueDate: true,
  reason: true,
  amountCents: true,
  currency: true,
  subtotalCents: true,
  taxCents: true,
  discountCents: true,
  totalCents: true,
  documentUrl: true,
  documentStorageKey: true,
  isArchived: true,
  lineItems: {
    orderBy: {
      sortOrder: "asc" as const
    },
    select: {
      id: true,
      description: true,
      quantity: true,
      unitPriceCents: true,
      totalCents: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true
    }
  },
  createdAt: true,
  updatedAt: true
} as const;

function toCreditNoteSummary(note: {
  id: string;
  invoiceId: string;
  creditNoteNumber: string;
  status: string;
  issueDate: Date | null;
  reason: string;
  amountCents: number;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  documentUrl: string | null;
  documentStorageKey: string | null;
  isArchived: boolean;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...note,
    subtotalCents: note.subtotalCents || note.amountCents,
    totalCents: note.totalCents || note.amountCents,
    issueDate: toDateString(note.issueDate),
    lineItems: note.lineItems.map((lineItem) => ({
      ...lineItem,
      createdAt: lineItem.createdAt.toISOString(),
      updatedAt: lineItem.updatedAt.toISOString()
    })),
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString()
  };
}

async function getCreditNoteRecord(tx: PrismaTx, tenantId: string, creditNoteId: string) {
  return tx.creditNote.findFirst({ where: { id: creditNoteId, tenantId }, select: creditNoteSelect });
}

function normalizeCreditNoteLineItems(lineItems: CreditNoteLineItemInputRequest[]) {
  return lineItems.map((lineItem, index) => {
    const quantity = Math.max(1, Math.round(lineItem.quantity ?? 1));
    const unitPriceCents = Math.max(0, Math.round(lineItem.unitPriceCents ?? 0));
    return {
      description: lineItem.description ?? "",
      quantity,
      unitPriceCents,
      totalCents: Math.max(0, Math.round(lineItem.totalCents ?? quantity * unitPriceCents)),
      sortOrder: Math.max(0, Math.round(lineItem.sortOrder ?? index))
    };
  });
}

function getCreditNoteTotals(input: CreditNoteInputRequest, lineItems: ReturnType<typeof normalizeCreditNoteLineItems>) {
  const subtotalCents = Math.max(0, Math.round(input.subtotalCents ?? lineItems.reduce((sum, lineItem) => sum + lineItem.totalCents, 0)));
  const taxCents = Math.max(0, Math.round(input.taxCents ?? 0));
  const discountCents = Math.max(0, Math.round(input.discountCents ?? 0));
  const totalCents = Math.max(0, Math.round(input.totalCents ?? subtotalCents + taxCents - discountCents));
  return { subtotalCents, taxCents, discountCents, totalCents };
}

export async function listCreditNotes(authSession: AuthResolvedSessionContext, invoiceId?: string): Promise<CreditNotesResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;
  const creditNotes = await prisma.creditNote.findMany({ where: { tenantId, ...(invoiceId ? { invoiceId } : {}) }, orderBy: { createdAt: "desc" }, select: creditNoteSelect });
  return { creditNotes: creditNotes.map(toCreditNoteSummary) };
}

export async function createCreditNote(authSession: AuthResolvedSessionContext, invoiceId: string, input: CreditNoteInputRequest): Promise<CreditNoteResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.reason) return null;
  const reason = input.reason;
  return prisma.$transaction(async (tx: PrismaTx) => {
    const invoice = await getInvoiceRecord(tx, tenantId, invoiceId);
    if (!invoice || invoice.isArchived) return null;
    const sourceLineItems = input.lineItems?.length ? input.lineItems : invoice.lineItems;
    if (!sourceLineItems.length) return null;
    const lineItems = normalizeCreditNoteLineItems(sourceLineItems);
    const totals = getCreditNoteTotals(input, lineItems);
    if (totals.totalCents <= 0) return null;
    const creditNote = await tx.creditNote.create({
      data: {
        tenantId,
        invoiceId,
        creditNoteNumber: await nextCreditNoteNumber(tx, tenantId),
        status: "DRAFT",
        reason,
        amountCents: totals.totalCents,
        currency: input.currency || invoice.currency,
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        discountCents: totals.discountCents,
        totalCents: totals.totalCents,
        documentUrl: toNullableString(input.documentUrl),
        documentStorageKey: toNullableString(input.documentStorageKey),
        lineItems: {
          create: lineItems
        }
      },
      select: creditNoteSelect
    });
    return { creditNote: toCreditNoteSummary(creditNote) };
  });
}

export async function updateCreditNote(authSession: AuthResolvedSessionContext, creditNoteId: string, input: CreditNoteInputRequest): Promise<CreditNoteResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.reason || !input.lineItems?.length) return null;
  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getCreditNoteRecord(tx, tenantId, creditNoteId);
    if (!existing || existing.status !== "DRAFT" || existing.isArchived) return null;
    const lineItems = normalizeCreditNoteLineItems(input.lineItems ?? []);
    const totals = getCreditNoteTotals(input, lineItems);
    if (totals.totalCents <= 0) return null;

    await tx.creditNoteLineItem.deleteMany({ where: { creditNoteId } });
    const creditNote = await tx.creditNote.update({
      where: { id: creditNoteId },
      data: {
        reason: input.reason,
        amountCents: totals.totalCents,
        currency: input.currency || existing.currency,
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        discountCents: totals.discountCents,
        totalCents: totals.totalCents,
        documentUrl: toNullableString(input.documentUrl),
        documentStorageKey: toNullableString(input.documentStorageKey),
        lineItems: {
          create: lineItems
        }
      },
      select: creditNoteSelect
    });
    return { creditNote: toCreditNoteSummary(creditNote) };
  });
}

async function updateCreditNoteStatus(authSession: AuthResolvedSessionContext, creditNoteId: string, status: CreditNoteStatus): Promise<CreditNoteResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;
  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getCreditNoteRecord(tx, tenantId, creditNoteId);
    if (!existing) return null;
    if (status === "ISSUED") {
      const totalCents = existing.totalCents || existing.amountCents;
      if (existing.status !== "DRAFT" || existing.isArchived || !existing.reason || totalCents <= 0 || existing.lineItems.length === 0) return null;
    }
    const creditNote = await tx.creditNote.update({ where: { id: creditNoteId }, data: { status, ...(status === "ISSUED" ? { issueDate: new Date() } : {}) }, select: creditNoteSelect });
    return { creditNote: toCreditNoteSummary(creditNote) };
  });
}

export async function issueCreditNote(authSession: AuthResolvedSessionContext, creditNoteId: string) { return updateCreditNoteStatus(authSession, creditNoteId, "ISSUED"); }
export async function voidCreditNote(authSession: AuthResolvedSessionContext, creditNoteId: string) { return updateCreditNoteStatus(authSession, creditNoteId, "VOIDED"); }

export async function getInvoiceDocumentDownload(authSession: AuthResolvedSessionContext, invoiceId: string): Promise<DocumentDownloadResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId }, select: { documentStorageKey: true } });
  if (!invoice?.documentStorageKey) return null;
  return getPrivateStorageDownloadReference(invoice.documentStorageKey);
}

export async function getBillDocumentDownload(authSession: AuthResolvedSessionContext, billId: string): Promise<DocumentDownloadResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;
  const bill = await prisma.bill.findFirst({ where: { id: billId, tenantId }, select: { documentStorageKey: true } });
  if (!bill?.documentStorageKey) return null;
  return getPrivateStorageDownloadReference(bill.documentStorageKey);
}

export async function getCreditNoteDocumentDownload(authSession: AuthResolvedSessionContext, creditNoteId: string): Promise<DocumentDownloadResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;
  const creditNote = await prisma.creditNote.findFirst({ where: { id: creditNoteId, tenantId }, select: { documentStorageKey: true } });
  if (!creditNote?.documentStorageKey) return null;
  return getPrivateStorageDownloadReference(creditNote.documentStorageKey);
}

export async function listRecurringInvoices(
  authSession: AuthResolvedSessionContext
): Promise<RecurringInvoicesResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const recurringInvoices = await prisma.recurringInvoice.findMany({
    where: {
      tenantId
    },
    orderBy: [
      {
        isArchived: "asc"
      },
      {
        nextRunDate: "asc"
      }
    ],
    select: recurringInvoiceSelect
  });

  return {
    recurringInvoices: recurringInvoices.map(toRecurringInvoiceSummary)
  };
}

export async function getRecurringInvoice(
  authSession: AuthResolvedSessionContext,
  recurringInvoiceId: string
): Promise<RecurringInvoiceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const recurringInvoice = await prisma.$transaction((tx: PrismaTx) =>
    getRecurringInvoiceRecord(tx, tenantId, recurringInvoiceId)
  );

  return {
    recurringInvoice: recurringInvoice ? toRecurringInvoiceSummary(recurringInvoice) : null
  };
}

export async function createRecurringInvoice(
  authSession: AuthResolvedSessionContext,
  input: RecurringInvoiceInputRequest
): Promise<RecurringInvoiceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.clientId || !input.interval || !input.startDate || !input.lineItems?.length) {
    return null;
  }
  const clientId = input.clientId;
  const interval = input.interval;
  const startDate = input.startDate;
  const lineItems = input.lineItems;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const client = await getTenantClient(tx, tenantId, clientId);
    if (!client) {
      return null;
    }
    if (client.clientKind === "OWN_DOMAIN") {
      return null;
    }

    const project = await getTenantProject(tx, tenantId, client.id, input.projectId);
    if (input.projectId && !project) {
      return null;
    }

    const created = await tx.recurringInvoice.create({
      data: {
        tenantId,
        clientId: client.id,
        projectId: project?.id ?? null,
        title: toNullableString(input.title),
        interval: interval as RecurringInvoiceInterval,
        startDate: new Date(startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        nextRunDate: input.nextRunDate ? new Date(input.nextRunDate) : new Date(startDate),
        currency: input.currency ?? "USD",
        subtotalCents: input.subtotalCents ?? 0,
        taxCents: input.taxCents ?? 0,
        discountCents: input.discountCents ?? 0,
        totalCents: input.totalCents ?? 0,
        notes: toNullableString(input.notes),
        paymentInstructions: toNullableString(input.paymentInstructions),
        documentFolderHint: toNullableString(input.documentFolderHint),
        isActive: input.isActive ?? true,
        lineItems: {
          create: lineItems.map((lineItem) => ({
            description: lineItem.description ?? "",
            quantity: lineItem.quantity ?? 1,
            unitPriceCents: lineItem.unitPriceCents ?? 0,
            totalCents: lineItem.totalCents ?? 0,
            sortOrder: lineItem.sortOrder ?? 0
          }))
        }
      },
      select: recurringInvoiceSelect
    });

    return {
      recurringInvoice: toRecurringInvoiceSummary(created)
    };
  });
}

export async function updateRecurringInvoice(
  authSession: AuthResolvedSessionContext,
  recurringInvoiceId: string,
  input: RecurringInvoiceInputRequest
): Promise<RecurringInvoiceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.clientId || !input.interval || !input.startDate) {
    return null;
  }
  const startDate = input.startDate;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getRecurringInvoiceRecord(tx, tenantId, recurringInvoiceId);
    if (!existing) {
      return null;
    }

    const client = await getTenantClient(tx, tenantId, input.clientId);
    if (!client) {
      return null;
    }
    if (client.clientKind === "OWN_DOMAIN") {
      return null;
    }

    const project = await getTenantProject(tx, tenantId, client.id, input.projectId);
    if (input.projectId && !project) {
      return null;
    }

    if (input.lineItems) {
      await tx.recurringInvoiceLineItem.deleteMany({
        where: {
          recurringInvoiceId
        }
      });
    }

    const updated = await tx.recurringInvoice.update({
      where: {
        id: recurringInvoiceId
      },
      data: {
        clientId: client.id,
        projectId: project?.id ?? null,
        title: toNullableString(input.title),
        interval: input.interval as RecurringInvoiceInterval,
        startDate: new Date(startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        nextRunDate: input.nextRunDate ? new Date(input.nextRunDate) : existing.nextRunDate,
        currency: input.currency ?? existing.currency,
        subtotalCents: input.subtotalCents ?? existing.subtotalCents,
        taxCents: input.taxCents ?? existing.taxCents,
        discountCents: input.discountCents ?? existing.discountCents,
        totalCents: input.totalCents ?? existing.totalCents,
        notes: toNullableString(input.notes),
        paymentInstructions: toNullableString(input.paymentInstructions),
        documentFolderHint: toNullableString(input.documentFolderHint),
        isActive: input.isActive ?? existing.isActive,
        ...(input.lineItems
          ? {
              lineItems: {
                create: input.lineItems.map((lineItem) => ({
                  description: lineItem.description ?? "",
                  quantity: lineItem.quantity ?? 1,
                  unitPriceCents: lineItem.unitPriceCents ?? 0,
                  totalCents: lineItem.totalCents ?? 0,
                  sortOrder: lineItem.sortOrder ?? 0
                }))
              }
            }
          : {})
      },
      select: recurringInvoiceSelect
    });

    return {
      recurringInvoice: toRecurringInvoiceSummary(updated)
    };
  });
}

export async function archiveRecurringInvoice(
  authSession: AuthResolvedSessionContext,
  recurringInvoiceId: string
): Promise<RecurringInvoiceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getRecurringInvoiceRecord(tx, tenantId, recurringInvoiceId);
    if (!existing) {
      return null;
    }

    const updated = await tx.recurringInvoice.update({
      where: {
        id: recurringInvoiceId
      },
      data: {
        isArchived: true,
        isActive: false
      },
      select: recurringInvoiceSelect
    });

    return {
      recurringInvoice: toRecurringInvoiceSummary(updated)
    };
  });
}

export async function generateDueRecurringInvoice(
  authSession: AuthResolvedSessionContext,
  recurringInvoiceId: string,
  targetDate?: string | null
): Promise<InvoiceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  try {
    return await prisma.$transaction(async (tx: PrismaTx) => {
      const recurringInvoice = await tx.recurringInvoice.findFirst({
        where: {
          id: recurringInvoiceId,
          tenantId
        },
        select: recurringInvoiceSelect
      });

      if (!recurringInvoice || recurringInvoice.isArchived || !recurringInvoice.isActive) {
        return null;
      }

      const recurringClient = await tx.client.findFirst({
        where: {
          id: recurringInvoice.clientId,
          tenantId
        },
        select: {
          id: true,
          isArchived: true,
          clientKind: true
        }
      });

      if (!recurringClient) {
        throwFinanceConflict(
          "RECURRING_INVOICE_CLIENT_MISSING",
          "Recurring invoice client is no longer available in the active tenant."
        );
      }

      if (recurringClient.clientKind === "OWN_DOMAIN") {
        throwFinanceConflict(
          "RECURRING_INVOICE_OWN_DOMAIN_BLOCKED",
          "Recurring invoices cannot be generated for own-domain clients in the DCA LLC tenant."
        );
      }

      if (recurringClient.isArchived) {
        throwFinanceConflict(
          "RECURRING_INVOICE_CLIENT_ARCHIVED",
          "Recurring invoice client is archived and cannot receive generated invoices."
        );
      }

      const scheduledFor = targetDate ? new Date(targetDate) : recurringInvoice.nextRunDate;
      const existingRun = await tx.recurringInvoiceRun.findFirst({
        where: {
          recurringInvoiceId,
          scheduledFor
        },
        select: {
          generatedInvoiceId: true
        }
      });

      if (existingRun?.generatedInvoiceId) {
        const existingInvoice = await getInvoiceRecord(tx, tenantId, existingRun.generatedInvoiceId);
        return {
          invoice: existingInvoice ? toInvoiceSummary(existingInvoice) : null
        };
      }

      const invoiceNumber = `REC-${recurringInvoice.id.slice(0, 8)}-${scheduledFor.toISOString().slice(0, 10)}`;
      const createdInvoice = await tx.invoice.create({
        data: {
          tenantId,
          clientId: recurringInvoice.clientId,
          projectId: recurringInvoice.projectId,
          recurringInvoiceId: recurringInvoice.id,
          invoiceNumber,
          status: "DRAFT",
          issueDate: scheduledFor,
          currency: recurringInvoice.currency,
          subtotalCents: recurringInvoice.subtotalCents,
          taxCents: recurringInvoice.taxCents,
          discountCents: recurringInvoice.discountCents,
          totalCents: recurringInvoice.totalCents,
          title: recurringInvoice.title,
          notes: recurringInvoice.notes,
          paymentInstructions: recurringInvoice.paymentInstructions,
          lineItems: {
            create: recurringInvoice.lineItems.map((lineItem) => ({
              description: lineItem.description,
              quantity: lineItem.quantity,
              unitPriceCents: lineItem.unitPriceCents,
              totalCents: lineItem.totalCents,
              sortOrder: lineItem.sortOrder
            }))
          }
        },
        select: invoiceSelect
      });

      await tx.recurringInvoiceRun.create({
        data: {
          tenantId,
          recurringInvoiceId,
          scheduledFor,
          generatedInvoiceId: createdInvoice.id,
          status: "GENERATED"
        }
      });

      const nextRunDate = getNextRecurringDate(scheduledFor, recurringInvoice.interval as RecurringInvoiceInterval);
      const shouldDeactivate = recurringInvoice.endDate ? nextRunDate > recurringInvoice.endDate : false;
      await tx.recurringInvoice.update({
        where: {
          id: recurringInvoiceId
        },
        data: {
          lastRunDate: scheduledFor,
          nextRunDate: shouldDeactivate ? recurringInvoice.nextRunDate : nextRunDate,
          isActive: shouldDeactivate ? false : recurringInvoice.isActive
        }
      });

      return {
        invoice: toInvoiceSummary(createdInvoice)
      };
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      const existingRun = await prisma.recurringInvoiceRun.findFirst({
        where: {
          recurringInvoiceId,
          tenantId,
          scheduledFor: targetDate ? new Date(targetDate) : undefined
        },
        select: {
          generatedInvoiceId: true
        }
      });

      if (existingRun?.generatedInvoiceId) {
        return getInvoice(authSession, existingRun.generatedInvoiceId);
      }

      return null;
    }
    throw error;
  }
}

const vendorSelect = {
  id: true,
  name: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      bills: true
    }
  }
} as const;

const billSelect = {
  id: true,
  vendorId: true,
  vendor: {
    select: {
      id: true,
      name: true
    }
  },
  amountCents: true,
  paymentForm: true,
  paymentDate: true,
  billDate: true,
  dueDate: true,
  referenceNumber: true,
  category: true,
  notes: true,
  documentUrl: true,
  documentStorageKey: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true
} as const;

function toVendorSummary(vendor: {
  id: string;
  name: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    bills: number;
  };
}) {
  return {
    id: vendor.id,
    name: vendor.name,
    isArchived: vendor.isArchived,
    billCount: vendor._count.bills,
    createdAt: vendor.createdAt.toISOString(),
    updatedAt: vendor.updatedAt.toISOString()
  };
}

function toBillSummary(bill: {
  id: string;
  vendorId: string;
  vendor: { id: string; name: string };
  amountCents: number;
  paymentForm: string;
  paymentDate: Date;
  billDate: Date | null;
  dueDate: Date | null;
  referenceNumber: string | null;
  category: string | null;
  notes: string | null;
  documentUrl: string | null;
  documentStorageKey: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: bill.id,
    vendorId: bill.vendorId,
    vendor: bill.vendor,
    amountCents: bill.amountCents,
    paymentForm: bill.paymentForm,
    paymentDate: bill.paymentDate.toISOString(),
    billDate: toDateString(bill.billDate),
    dueDate: toDateString(bill.dueDate),
    referenceNumber: bill.referenceNumber,
    category: bill.category,
    notes: bill.notes,
    documentUrl: bill.documentUrl,
    documentStorageKey: bill.documentStorageKey,
    isArchived: bill.isArchived,
    createdAt: bill.createdAt.toISOString(),
    updatedAt: bill.updatedAt.toISOString()
  };
}

async function getVendorRecord(tx: PrismaTx, tenantId: string, vendorId: string) {
  return tx.vendor.findFirst({
    where: {
      id: vendorId,
      tenantId
    },
    select: vendorSelect
  });
}

async function getBillRecord(tx: PrismaTx, tenantId: string, billId: string) {
  return tx.bill.findFirst({
    where: {
      id: billId,
      tenantId
    },
    select: billSelect
  });
}

export async function listVendors(authSession: AuthResolvedSessionContext): Promise<VendorsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const vendors = await prisma.vendor.findMany({
    where: {
      tenantId
    },
    orderBy: [
      {
        isArchived: "asc"
      },
      {
        name: "asc"
      }
    ],
    select: vendorSelect
  });

  return {
    vendors: vendors.map(toVendorSummary)
  };
}

export async function createVendor(
  authSession: AuthResolvedSessionContext,
  input: VendorInputRequest
): Promise<VendorResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.name) {
    return null;
  }

  try {
    const created = await prisma.vendor.create({
      data: {
        tenantId,
        name: input.name
      },
      select: vendorSelect
    });

    return {
      vendor: toVendorSummary(created)
    };
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return null;
    }
    throw error;
  }
}

export async function updateVendor(
  authSession: AuthResolvedSessionContext,
  vendorId: string,
  input: VendorInputRequest
): Promise<VendorResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !vendorId || !input.name) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getVendorRecord(tx, tenantId, vendorId);
    if (!existing) {
      return null;
    }

    try {
      const updated = await tx.vendor.update({
        where: {
          id: vendorId
        },
        data: {
          name: input.name
        },
        select: vendorSelect
      });

      return {
        vendor: toVendorSummary(updated)
      };
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") {
        return {
          vendor: null
        };
      }
      throw error;
    }
  });
}

async function updateVendorArchiveState(
  authSession: AuthResolvedSessionContext,
  vendorId: string,
  isArchived: boolean
): Promise<VendorResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !vendorId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getVendorRecord(tx, tenantId, vendorId);
    if (!existing) {
      return null;
    }

    const updated = await tx.vendor.update({
      where: {
        id: vendorId
      },
      data: {
        isArchived
      },
      select: vendorSelect
    });

    return {
      vendor: toVendorSummary(updated)
    };
  });
}

export async function archiveVendor(authSession: AuthResolvedSessionContext, vendorId: string) {
  return updateVendorArchiveState(authSession, vendorId, true);
}

export async function restoreVendor(authSession: AuthResolvedSessionContext, vendorId: string) {
  return updateVendorArchiveState(authSession, vendorId, false);
}

export async function listBills(authSession: AuthResolvedSessionContext): Promise<BillsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const bills = await prisma.bill.findMany({
    where: {
      tenantId
    },
    orderBy: [
      {
        isArchived: "asc"
      },
      {
        paymentDate: "desc"
      }
    ],
    select: billSelect
  });

  return {
    bills: bills.map(toBillSummary)
  };
}

export async function createBill(
  authSession: AuthResolvedSessionContext,
  input: BillInputRequest
): Promise<BillResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.vendorId || input.amountCents === undefined || !input.paymentForm || !input.paymentDate) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const vendor = await getVendorRecord(tx, tenantId, input.vendorId ?? "");
    if (!vendor || vendor.isArchived) {
      return null;
    }

    const created = await tx.bill.create({
      data: {
        tenantId,
        vendorId: vendor.id,
        amountCents: input.amountCents ?? 0,
        paymentForm: input.paymentForm as BillPaymentForm,
        paymentDate: new Date(input.paymentDate ?? ""),
        billDate: input.billDate ? new Date(input.billDate) : null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        referenceNumber: toNullableString(input.referenceNumber),
        category: toNullableString(input.category),
        notes: toNullableString(input.notes),
        documentUrl: toNullableString(input.documentUrl),
        documentStorageKey: toNullableString(input.documentStorageKey)
      },
      select: billSelect
    });

    await syncBillToFinanceEvent(tx, tenantId, created.id);
    return {
      bill: toBillSummary(created)
    };
  });
}

export async function updateBill(
  authSession: AuthResolvedSessionContext,
  billId: string,
  input: BillInputRequest
): Promise<BillResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.vendorId || input.amountCents === undefined || !input.paymentForm || !input.paymentDate) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getBillRecord(tx, tenantId, billId);
    if (!existing) {
      return null;
    }

    const vendor = await getVendorRecord(tx, tenantId, input.vendorId ?? "");
    if (!vendor || vendor.isArchived) {
      return null;
    }

    const updated = await tx.bill.update({
      where: {
        id: billId
      },
      data: {
        vendorId: vendor.id,
        amountCents: input.amountCents ?? existing.amountCents,
        paymentForm: input.paymentForm as BillPaymentForm,
        paymentDate: new Date(input.paymentDate ?? existing.paymentDate),
        billDate: input.billDate ? new Date(input.billDate) : null,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        referenceNumber: toNullableString(input.referenceNumber),
        category: toNullableString(input.category),
        notes: toNullableString(input.notes),
        documentUrl: toNullableString(input.documentUrl),
        documentStorageKey: toNullableString(input.documentStorageKey)
      },
      select: billSelect
    });

    await syncBillToFinanceEvent(tx, tenantId, billId);
    return {
      bill: toBillSummary(updated)
    };
  });
}

export async function uploadBillDocument(
  authSession: AuthResolvedSessionContext,
  billId: string,
  input: BillDocumentUploadRequest
): Promise<BillResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !billId || !input.fileName || !input.mimeType || !input.contentBase64) {
    return null;
  }

  const bill = await prisma.bill.findFirst({
    where: {
      id: billId,
      tenantId
    },
    select: {
      id: true,
      paymentDate: true,
      billDate: true
    }
  });

  if (!bill) {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId
    },
    select: {
      id: true,
      slug: true
    }
  });

  if (!tenant) {
    return null;
  }

  const upload = await putPrivateStorageObject({
    body: Buffer.from(input.contentBase64, "base64"),
    documentDate: bill.paymentDate ?? bill.billDate ?? new Date(),
    mimeType: input.mimeType,
    namespace: "bill-document",
    originalFileName: input.fileName,
    projectSlugOrId: null,
    tenantSlugOrId: tenant.slug || tenant.id
  });

  if (!upload) {
    throw new Error("Private storage is not configured.");
  }

  const updated = await prisma.bill.update({
    where: {
      id: bill.id
    },
    data: {
      documentStorageKey: upload.storageKey,
      documentUrl: null
    },
    select: billSelect
  });

  return {
    bill: toBillSummary(updated)
  };
}

async function updateBillArchiveState(
  authSession: AuthResolvedSessionContext,
  billId: string,
  isArchived: boolean
): Promise<BillResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getBillRecord(tx, tenantId, billId);
    if (!existing) {
      return null;
    }

    const updated = await tx.bill.update({
      where: {
        id: billId
      },
      data: {
        isArchived
      },
      select: billSelect
    });

    await syncBillToFinanceEvent(tx, tenantId, billId);
    return {
      bill: toBillSummary(updated)
    };
  });
}

export async function archiveBill(
  authSession: AuthResolvedSessionContext,
  billId: string
): Promise<BillResponse | null> {
  return updateBillArchiveState(authSession, billId, true);
}

export async function restoreBill(
  authSession: AuthResolvedSessionContext,
  billId: string
): Promise<BillResponse | null> {
  return updateBillArchiveState(authSession, billId, false);
}

// AiDeliveryDeliverable runtime functions
function getAiDeliveryDeliverableDelegate(client: PrismaTx | typeof prisma) {
  return (client as unknown as { aiDeliveryDeliverable: { findFirst: (args: unknown) => Promise<unknown>; findMany: (args: unknown) => Promise<unknown[]>; create: (args: unknown) => Promise<unknown>; update: (args: unknown) => Promise<unknown>; } }).aiDeliveryDeliverable;
}

const aiDeliveryDeliverableSelect = {
  id: true,
  tenantId: true,
  aiDeliveryProjectId: true,
  contentDraftId: true,
  articleImageId: true,
  title: true,
  description: true,
  bodyContent: true,
  clientRejectionReason: true,
  deliveryType: true,
  status: true,
  exportUrl: true,
  storageKey: true,
  notes: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
  contentDraft: {
    select: { id: true, title: true, status: true, approvedAt: true }
  },
  articleImage: {
    select: { id: true, title: true, status: true }
  }
} as const;

const AI_DELIVERY_READY_DELIVERABLE_STATUSES = new Set<AiDeliveryDeliverableStatus>(["READY", "DELIVERED", "ACCEPTED"]);
const AI_DELIVERY_READY_ARTICLE_IMAGE_STATUSES = new Set(["APPROVED", "FINAL_READY"]);

function normalizeAiDeliveryDeliverableDeliveryType(value: string | null | undefined): AiDeliveryDeliverableDeliveryType {
  const v = value ? value.trim().toUpperCase() : null;
  return v && ["CONTENT_PACKAGE", "ARTICLE_DRAFT", "ARTICLE_IMAGE", "CLIENT_HANDOFF", "OTHER"].includes(v) ? (v as AiDeliveryDeliverableDeliveryType) : "CONTENT_PACKAGE";
}

function normalizeAiDeliveryDeliverableStatus(value: string | null | undefined): AiDeliveryDeliverableStatus {
  const v = value ? value.trim().toUpperCase() : null;
  return v && ["DRAFT", "READY", "DELIVERED", "REVISION_REQUESTED", "ACCEPTED", "ARCHIVED", "PENDING_CLIENT_REVIEW", "APPROVED_BY_CLIENT"].includes(v) ? (v as AiDeliveryDeliverableStatus) : "DRAFT";
}

function toAiDeliveryDeliverableSummary(d: any) {
  return {
    id: d.id,
    tenantId: d.tenantId,
    aiDeliveryProjectId: d.aiDeliveryProjectId,
    contentDraftId: d.contentDraftId ?? null,
    articleImageId: d.articleImageId ?? null,
    title: d.title,
    description: d.description ?? null,
    bodyContent: d.bodyContent ?? null,
    clientRejectionReason: d.clientRejectionReason ?? null,
    deliveryType: d.deliveryType,
    status: d.status,
    exportUrl: d.exportUrl ?? null,
    storageKey: d.storageKey ?? null,
    notes: d.notes ?? null,
    isArchived: d.isArchived,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    contentDraft: d.contentDraft ? {
      id: d.contentDraft.id,
      title: d.contentDraft.title,
      status: d.contentDraft.status,
      approvedAt: d.contentDraft.approvedAt ? d.contentDraft.approvedAt.toISOString() : null
    } : null,
    articleImage: d.articleImage ? {
      id: d.articleImage.id,
      title: d.articleImage.title,
      status: d.articleImage.status
    } : null
  };
}

async function getAiDeliveryProjectForDeliverable(tx: PrismaTx, tenantId: string, aiDeliveryProjectId: string) {
  return tx.aiDeliveryProject.findFirst({
    where: { id: aiDeliveryProjectId, tenantId, isArchived: false },
    select: { id: true }
  });
}

async function getContentDraftForDeliverable(tx: PrismaTx, tenantId: string, aiDeliveryProjectId: string, contentDraftId: string) {
  return tx.aiDeliveryContentDraft.findFirst({
    where: { id: contentDraftId, tenantId, aiDeliveryProjectId },
    select: { id: true, title: true, status: true, approvedAt: true, isArchived: true }
  });
}

async function getArticleImageForDeliverable(tx: PrismaTx, tenantId: string, aiDeliveryProjectId: string, articleImageId: string) {
  return tx.aiDeliveryArticleImage.findFirst({
    where: { id: articleImageId, tenantId, aiDeliveryProjectId },
    select: { id: true, title: true, status: true, isArchived: true }
  });
}

function canPackageContentDraftForDeliverable(draft: { status: string; isArchived: boolean } | null) {
  return !!draft && draft.isArchived !== true && draft.status === "APPROVED";
}

function canPackageArticleImageForDeliverable(image: { status: string; isArchived: boolean } | null) {
  return !!image && image.isArchived !== true && AI_DELIVERY_READY_ARTICLE_IMAGE_STATUSES.has(image.status);
}

function deliverableStatusRequiresReadyLinks(status: AiDeliveryDeliverableStatus) {
  return AI_DELIVERY_READY_DELIVERABLE_STATUSES.has(status);
}

function validateDeliverableReadyLinks(
  status: AiDeliveryDeliverableStatus,
  contentDraft: { status: string; isArchived: boolean } | null,
  articleImage: { status: string; isArchived: boolean } | null
) {
  if (!deliverableStatusRequiresReadyLinks(status)) {
    return true;
  }

  if (!contentDraft && !articleImage) {
    return false;
  }

  if (contentDraft && !canPackageContentDraftForDeliverable(contentDraft)) {
    return false;
  }

  if (articleImage && !canPackageArticleImageForDeliverable(articleImage)) {
    return false;
  }

  return true;
}

async function updateAiDeliveryDeliverableStatus(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string,
  nextStatus: AiDeliveryDeliverableStatus,
  eventName:
    | "AI_DELIVERY_DELIVERABLE_READY"
    | "AI_DELIVERY_DELIVERABLE_REVISION_REQUESTED"
    | "AI_DELIVERY_DELIVERABLE_ACCEPTED"
) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryDeliverableDelegate(tx).findFirst({
      where: { id: deliverableId, tenantId, aiDeliveryProjectId },
      select: aiDeliveryDeliverableSelect as any
    }) as any;
    if (!existing) return null;
    if (existing.isArchived) {
      throwAiDeliveryConflict("AI_DELIVERY_DELIVERABLE_ARCHIVED_ACTION_BLOCKED", "Archived deliverables cannot be moved through active workflow actions.");
    }

    if (nextStatus === "READY" && !["DRAFT", "REVISION_REQUESTED"].includes(existing.status)) {
      throwAiDeliveryConflict("AI_DELIVERY_DELIVERABLE_ACTION_BLOCKED", `Deliverable action is not allowed from status ${existing.status}.`);
    }
    if (nextStatus === "REVISION_REQUESTED" && !["READY", "ACCEPTED", "DELIVERED"].includes(existing.status)) {
      throwAiDeliveryConflict("AI_DELIVERY_DELIVERABLE_ACTION_BLOCKED", `Deliverable action is not allowed from status ${existing.status}.`);
    }
    if (nextStatus === "ACCEPTED" && !["READY", "DELIVERED"].includes(existing.status)) {
      throwAiDeliveryConflict("AI_DELIVERY_DELIVERABLE_ACTION_BLOCKED", `Deliverable action is not allowed from status ${existing.status}.`);
    }

    const contentDraft = existing.contentDraftId
      ? await getContentDraftForDeliverable(tx, tenantId, aiDeliveryProjectId, existing.contentDraftId)
      : null;
    const articleImage = existing.articleImageId
      ? await getArticleImageForDeliverable(tx, tenantId, aiDeliveryProjectId, existing.articleImageId)
      : null;
    if (!validateDeliverableReadyLinks(nextStatus, contentDraft, articleImage)) {
      throwAiDeliveryConflict("AI_DELIVERY_DELIVERABLE_READY_LINKS_BLOCKED", "Ready, delivered, and accepted deliverables require approved same-project draft or image links.");
    }

    const updated = await getAiDeliveryDeliverableDelegate(tx).update({
      where: { id: deliverableId },
      data: { status: nextStatus },
      select: aiDeliveryDeliverableSelect
    }) as any;

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName,
        relatedEntityId: updated.id
      },
      tx
    );

    return { deliverable: toAiDeliveryDeliverableSummary(updated) };
  });
}

export async function listAiDeliveryDeliverables(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<AiDeliveryDeliverablesResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const project = await prisma.aiDeliveryProject.findFirst({ where: { id: aiDeliveryProjectId, tenantId }, select: { id: true, isArchived: true } });
  if (!project || project.isArchived) return null;

  const deliverables = await getAiDeliveryDeliverableDelegate(prisma).findMany({
    where: { tenantId, aiDeliveryProjectId },
    orderBy: [{ isArchived: "asc" }, { updatedAt: "desc" }],
    select: aiDeliveryDeliverableSelect
  });

  return { deliverables: deliverables.map(toAiDeliveryDeliverableSummary) };
}

const aiDeliveryMonthlySummaryDeliverableSelect = {
  id: true,
  title: true,
  description: true,
  deliveryType: true,
  status: true,
  exportUrl: true,
  createdAt: true,
  updatedAt: true
} as const;

const aiDeliveryMonthlySummaryContentPlanItemSelect = {
  id: true,
  title: true,
  contentType: true,
  targetKeyword: true,
  approvalStatus: true
} as const;

export async function getAiDeliveryMonthlySummary(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<AiDeliveryMonthlySummaryResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: projectId, tenantId },
    select: {
      id: true,
      name: true,
      targetMonth: true,
      clientId: true,
      client: { select: { id: true, name: true } },
      isArchived: true
    }
  });

  if (!project) return null;

  const deliverables = await prisma.aiDeliveryDeliverable.findMany({
    where: {
      tenantId,
      aiDeliveryProjectId: projectId,
      status: { in: ["DELIVERED", "ACCEPTED"] },
      isArchived: false
    },
    select: aiDeliveryMonthlySummaryDeliverableSelect,
    orderBy: [{ updatedAt: "desc" }]
  });

  const contentPlan = await prisma.aiDeliveryContentPlan.findFirst({
    where: { tenantId, aiDeliveryProjectId: projectId },
    select: {
      items: {
        select: aiDeliveryMonthlySummaryContentPlanItemSelect,
        orderBy: { sortOrder: "asc" }
      }
    }
  });

  const deliveredCount = deliverables.filter((d) => d.status === "DELIVERED").length;
  const acceptedCount = deliverables.filter((d) => d.status === "ACCEPTED").length;

  return {
    summary: {
      project: {
        id: project.id,
        name: project.name,
        targetMonth: formatAiDeliveryTargetMonth(project.targetMonth),
        clientId: project.clientId,
        clientName: project.client?.name ?? null
      },
      deliverables: deliverables.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description ?? null,
        deliveryType: d.deliveryType,
        status: d.status,
        exportUrl: d.exportUrl ?? null,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString()
      })),
      totals: {
        deliverableCount: deliverables.length,
        deliveredCount,
        acceptedCount
      },
      contentPlanItems: (contentPlan?.items ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        contentType: item.contentType,
        targetKeyword: item.targetKeyword ?? null,
        approvalStatus: item.approvalStatus ?? null
      })),
      deferred: {
        gaGscMetricsStatus: "DEFERRED",
        trendMonthsStatus: "DEFERRED",
        recommendationsStatus: "DEFERRED_REQUIRES_PERSISTED_REPORT"
      }
    }
  };
}

type AiDeliveryMonthlyReportStatus = "DRAFT" | "ADMIN_REVIEW" | "FINAL" | "ARCHIVED";

const AI_DELIVERY_MONTHLY_REPORT_STATUSES: AiDeliveryMonthlyReportStatus[] = ["DRAFT", "ADMIN_REVIEW", "FINAL", "ARCHIVED"];

const ALLOWED_MONTHLY_REPORT_TRANSITIONS: Record<AiDeliveryMonthlyReportStatus, AiDeliveryMonthlyReportStatus[]> = {
  DRAFT: ["ADMIN_REVIEW", "FINAL"],
  ADMIN_REVIEW: ["FINAL"],
  FINAL: ["ARCHIVED"],
  ARCHIVED: []
};

const aiDeliveryMonthlyReportSelect = {
  id: true,
  aiDeliveryProjectId: true,
  clientId: true,
  status: true,
  title: true,
  adminSummaryNotes: true,
  recommendationsText: true,
  exportUrl: true,
  storageKey: true,
  isArchived: true,
  finalizedAt: true,
  miHandoffId: true,
  miContextDraft: true,
  createdAt: true,
  updatedAt: true,
  aiDeliveryProject: {
    select: {
      name: true,
      targetMonth: true,
      client: { select: { name: true } }
    }
  }
} as const;

function toAiDeliveryMonthlyReportSummary(r: {
  id: string;
  aiDeliveryProjectId: string;
  clientId: string;
  status: string;
  title: string | null;
  adminSummaryNotes: string | null;
  recommendationsText: string | null;
  exportUrl: string | null;
  storageKey: string | null;
  isArchived: boolean;
  finalizedAt: Date | null;
  miHandoffId: string | null;
  miContextDraft: string | null;
  createdAt: Date;
  updatedAt: Date;
  aiDeliveryProject: {
    name: string;
    targetMonth: Date;
    client: { name: string } | null;
  } | null;
}): AiDeliveryMonthlyReportSummary {
  return {
    id: r.id,
    aiDeliveryProjectId: r.aiDeliveryProjectId,
    clientId: r.clientId,
    status: r.status,
    title: r.title ?? null,
    adminSummaryNotes: r.adminSummaryNotes ?? null,
    recommendationsText: r.recommendationsText ?? null,
    exportUrl: r.exportUrl ?? null,
    storageKey: r.storageKey ?? null,
    hasDocument: !!r.storageKey,
    isArchived: r.isArchived,
    finalizedAt: r.finalizedAt ? r.finalizedAt.toISOString() : null,
    miHandoffId: r.miHandoffId ?? null,
    miContextDraft: r.miContextDraft ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    project: r.aiDeliveryProject
      ? {
          name: r.aiDeliveryProject.name,
          targetMonth: formatAiDeliveryTargetMonth(r.aiDeliveryProject.targetMonth),
          clientName: r.aiDeliveryProject.client?.name ?? null
        }
      : null
  };
}

export async function getAiDeliveryMonthlyReport(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<AiDeliveryMonthlyReportResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: projectId, tenantId },
    select: { id: true }
  });
  if (!project) return null;

  const report = await (prisma as any).aiDeliveryMonthlyReport.findFirst({
    where: { tenantId, aiDeliveryProjectId: projectId },
    select: aiDeliveryMonthlyReportSelect
  }) as any;

  return { report: report ? toAiDeliveryMonthlyReportSummary(report) : null };
}

export async function createAiDeliveryMonthlyReport(
  authSession: AuthResolvedSessionContext,
  projectId: string,
  input: AiDeliveryMonthlyReportInputRequest
): Promise<AiDeliveryMonthlyReportResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: projectId, tenantId },
    select: { id: true, clientId: true }
  });
  if (!project) return null;

  const existing = await (prisma as any).aiDeliveryMonthlyReport.findFirst({
    where: { tenantId, aiDeliveryProjectId: projectId },
    select: { id: true }
  }) as any;
  if (existing) {
    throwAiDeliveryConflict("AI_DELIVERY_MONTHLY_REPORT_CONFLICT", "A monthly report already exists for this project.");
  }

  const created = await (prisma as any).aiDeliveryMonthlyReport.create({
    data: {
      tenantId,
      aiDeliveryProjectId: project.id,
      clientId: project.clientId,
      status: "DRAFT",
      title: toNullableString(input.title),
      adminSummaryNotes: toNullableString(input.adminSummaryNotes),
      recommendationsText: toNullableString(input.recommendationsText),
      exportUrl: toNullableString(input.exportUrl)
    },
    select: aiDeliveryMonthlyReportSelect
  }) as any;

  return { report: toAiDeliveryMonthlyReportSummary(created) };
}

export async function updateAiDeliveryMonthlyReport(
  authSession: AuthResolvedSessionContext,
  reportId: string,
  input: AiDeliveryMonthlyReportInputRequest
): Promise<AiDeliveryMonthlyReportResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const existing = await (prisma as any).aiDeliveryMonthlyReport.findFirst({
    where: { id: reportId, tenantId },
    select: { id: true, status: true, isArchived: true }
  }) as any;
  if (!existing) return null;
  if (existing.isArchived) {
    throwAiDeliveryBadRequest("AI_DELIVERY_MONTHLY_REPORT_ARCHIVED", "Cannot edit an archived monthly report.");
  }

  const updated = await (prisma as any).aiDeliveryMonthlyReport.update({
    where: { id: reportId },
    data: {
      title: input.title === undefined ? undefined : toNullableString(input.title),
      adminSummaryNotes: input.adminSummaryNotes === undefined ? undefined : toNullableString(input.adminSummaryNotes),
      recommendationsText: input.recommendationsText === undefined ? undefined : toNullableString(input.recommendationsText),
      exportUrl: input.exportUrl === undefined ? undefined : toNullableString(input.exportUrl)
    },
    select: aiDeliveryMonthlyReportSelect
  }) as any;

  return { report: toAiDeliveryMonthlyReportSummary(updated) };
}

export async function updateAiDeliveryMonthlyReportStatus(
  authSession: AuthResolvedSessionContext,
  reportId: string,
  input: AiDeliveryMonthlyReportStatusRequest
): Promise<AiDeliveryMonthlyReportResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const existing = await (prisma as any).aiDeliveryMonthlyReport.findFirst({
    where: { id: reportId, tenantId },
    select: { id: true, status: true, isArchived: true }
  }) as any;
  if (!existing) return null;

  const newStatus = (input.status ?? "").trim().toUpperCase() as AiDeliveryMonthlyReportStatus;
  if (!AI_DELIVERY_MONTHLY_REPORT_STATUSES.includes(newStatus)) {
    throwAiDeliveryBadRequest("AI_DELIVERY_MONTHLY_REPORT_STATUS_INVALID", `Status "${newStatus}" is not valid.`);
  }

  const allowedNext = ALLOWED_MONTHLY_REPORT_TRANSITIONS[existing.status as AiDeliveryMonthlyReportStatus] ?? [];
  if (!allowedNext.includes(newStatus)) {
    throwAiDeliveryBadRequest(
      "AI_DELIVERY_MONTHLY_REPORT_TRANSITION_INVALID",
      `Cannot transition from ${existing.status} to ${newStatus}.`
    );
  }

  const finalizedAt = newStatus === "FINAL" ? new Date() : undefined;

  const updated = await (prisma as any).aiDeliveryMonthlyReport.update({
    where: { id: reportId },
    data: { status: newStatus, ...(finalizedAt !== undefined ? { finalizedAt } : {}) },
    select: aiDeliveryMonthlyReportSelect
  }) as any;

  return { report: toAiDeliveryMonthlyReportSummary(updated) };
}

export async function generateAiDeliveryMonthlyReportRecommendations(
  authSession: AuthResolvedSessionContext,
  reportId: string
): Promise<AiDeliveryMonthlyReportResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const report = await (prisma as any).aiDeliveryMonthlyReport.findFirst({
    where: { id: reportId, tenantId, isArchived: false },
    select: {
      id: true,
      aiDeliveryProjectId: true,
      title: true,
      adminSummaryNotes: true,
      miContextDraft: true,
      status: true
    }
  }) as any;
  if (!report) return null;

  const project = await prisma.aiDeliveryProject.findFirst({
    where: { id: report.aiDeliveryProjectId, tenantId },
    select: { name: true, targetMonth: true }
  });
  if (!project) return null;

  const deliverableCount = await prisma.aiDeliveryDeliverable.count({
    where: { tenantId, aiDeliveryProjectId: report.aiDeliveryProjectId, isArchived: false, status: { in: ["READY", "DELIVERED", "ACCEPTED"] } }
  });

  const metricsCount = await (prisma as any).aiDeliveryMonthlyMetricSnapshot.count({
    where: { tenantId, aiDeliveryMonthlyReportId: reportId }
  }).catch(() => 0);

  const latestApprovedSnapshot = await (prisma as any).aiDeliveryMonthlyMetricSnapshot.findFirst({
    where: { tenantId, aiDeliveryMonthlyReportId: reportId, status: "APPROVED" },
    orderBy: [{ importedAt: "desc" }, { updatedAt: "desc" }],
    select: {
      targetMonth: true,
      gscClicks: true,
      gscImpressions: true,
      ga4Sessions: true,
      ga4Users: true,
      notes: true
    }
  }).catch(() => null);

  const miContextLine = report.miContextDraft
    ? "- Internal MI context draft was included in this recommendation draft (admin-only source; not copied verbatim to client view)."
    : "- Internal MI context draft: not attached";

  const metricsLine = latestApprovedSnapshot
    ? `- Latest approved metrics snapshot (${latestApprovedSnapshot.targetMonth}): GSC clicks ${latestApprovedSnapshot.gscClicks ?? "n/a"}, impressions ${latestApprovedSnapshot.gscImpressions ?? "n/a"}, GA4 sessions ${latestApprovedSnapshot.ga4Sessions ?? "n/a"}.`
    : metricsCount > 0
      ? `- Metric snapshots on file: ${metricsCount} (none approved yet for recommendation emphasis).`
      : "- Metric snapshots: none on file (manual/import path only; live GA/GSC deferred).";

  const lines = [
    `# Admin recommendation summary (${project.name})`,
    "",
    "Local deterministic recommendation draft for admin review only. No live provider calls were made.",
    "Token/cost figures elsewhere in the system are estimates from execution metadata — not billing records.",
    "",
    `- Project month focus: ${String(project.targetMonth)}`,
    `- Final/ready deliverables in scope: ${deliverableCount}`,
    metricsLine,
    report.adminSummaryNotes ? `- Admin summary notes considered: ${report.adminSummaryNotes.trim()}` : "- Admin summary notes: not provided",
    miContextLine,
    "",
    "Recommended next actions:",
    "1. Review final deliverables and confirm client-safe wording before external sharing.",
    "2. Align next-month content priorities with approved plan items and applied MI context.",
    "3. Update this report to FINAL only after admin review of recommendations and metrics."
  ];

  const updated = await (prisma as any).aiDeliveryMonthlyReport.update({
    where: { id: reportId },
    data: { recommendationsText: lines.join("\n") },
    select: aiDeliveryMonthlyReportSelect
  }) as any;

  return { report: toAiDeliveryMonthlyReportSummary(updated) };
}

export async function archiveAiDeliveryMonthlyReport(
  authSession: AuthResolvedSessionContext,
  reportId: string
): Promise<AiDeliveryMonthlyReportResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const existing = await (prisma as any).aiDeliveryMonthlyReport.findFirst({
    where: { id: reportId, tenantId },
    select: { id: true }
  }) as any;
  if (!existing) return null;

  const updated = await (prisma as any).aiDeliveryMonthlyReport.update({
    where: { id: reportId },
    data: { isArchived: true, status: "ARCHIVED" },
    select: aiDeliveryMonthlyReportSelect
  }) as any;

  return { report: toAiDeliveryMonthlyReportSummary(updated) };
}

export async function restoreAiDeliveryMonthlyReport(
  authSession: AuthResolvedSessionContext,
  reportId: string
): Promise<AiDeliveryMonthlyReportResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const existing = await (prisma as any).aiDeliveryMonthlyReport.findFirst({
    where: { id: reportId, tenantId },
    select: { id: true, isArchived: true }
  }) as any;
  if (!existing) return null;

  const updated = await (prisma as any).aiDeliveryMonthlyReport.update({
    where: { id: reportId },
    data: { isArchived: false, status: "DRAFT" },
    select: aiDeliveryMonthlyReportSelect
  }) as any;

  return { report: toAiDeliveryMonthlyReportSummary(updated) };
}

export async function uploadAiDeliveryMonthlyReportDocument(
  authSession: AuthResolvedSessionContext,
  reportId: string,
  input: AiDeliveryMonthlyReportUploadRequest
): Promise<AiDeliveryMonthlyReportResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !reportId || !input.fileName || !input.mimeType || !input.contentBase64) {
    return null;
  }
  const { contentBase64, fileName, mimeType } = input;

  const existing = await (prisma as any).aiDeliveryMonthlyReport.findFirst({
    where: { id: reportId, tenantId },
    select: { id: true, isArchived: true }
  }) as any;
  if (!existing) return null;
  if (existing.isArchived) {
    throwAiDeliveryBadRequest("AI_DELIVERY_MONTHLY_REPORT_ARCHIVED", "Cannot upload to an archived monthly report.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, slug: true }
  });
  if (!tenant) return null;

  const upload = await putPrivateStorageObject({
    body: Buffer.from(contentBase64, "base64"),
    documentDate: new Date(),
    mimeType,
    namespace: "ai-delivery-report",
    originalFileName: fileName,
    projectSlugOrId: reportId,
    tenantSlugOrId: tenant.slug || tenant.id
  });

  if (!upload) {
    throw new Error("Private storage is not configured.");
  }

  const updated = await (prisma as any).aiDeliveryMonthlyReport.update({
    where: { id: reportId },
    data: { storageKey: upload.storageKey },
    select: aiDeliveryMonthlyReportSelect
  }) as any;

  return { report: toAiDeliveryMonthlyReportSummary(updated) };
}

export async function getAiDeliveryMonthlyReportDownloadReference(
  authSession: AuthResolvedSessionContext,
  reportId: string
): Promise<AiDeliveryMonthlyReportDownloadReferenceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !reportId) return null;

  const report = await (prisma as any).aiDeliveryMonthlyReport.findFirst({
    where: { id: reportId, tenantId },
    select: { id: true, storageKey: true }
  }) as { id: string; storageKey: string | null } | null;

  if (!report) return null;

  if (!report.storageKey) {
    return { downloadReference: null };
  }

  const downloadRef = getPrivateStorageDownloadReference(report.storageKey);
  return {
    downloadReference: downloadRef
      ? { downloadUrl: downloadRef.downloadUrl, expiresSeconds: downloadRef.expiresSeconds }
      : null
  };
}

export async function generateAiDeliveryMonthlyReportPdfForReport(
  authSession: AuthResolvedSessionContext,
  reportId: string
): Promise<AiDeliveryMonthlyReportGeneratePdfResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !reportId) return null;

  const report = await (prisma as any).aiDeliveryMonthlyReport.findFirst({
    where: { id: reportId, tenantId },
    select: aiDeliveryMonthlyReportSelect
  }) as any;
  if (!report) return null;
  if (report.isArchived) {
    throwAiDeliveryBadRequest("AI_DELIVERY_MONTHLY_REPORT_ARCHIVED", "Cannot generate a PDF for an archived monthly report.");
  }

  const generatedAt = new Date();
  const [monthlySummaryResponse, metricsResponse, tenant] = await Promise.all([
    getAiDeliveryMonthlySummary(authSession, report.aiDeliveryProjectId),
    getAiDeliveryMonthlyReportMetrics(authSession, reportId),
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true }
    })
  ]);

  if (!tenant) {
    return null;
  }

  const reportSummary = toAiDeliveryMonthlyReportSummary(report);
  const pdf = await generateAiDeliveryMonthlyReportPdf({
    generatedAt,
    metrics: metricsResponse?.metrics ?? null,
    monthlySummary: monthlySummaryResponse?.summary ?? null,
    report: reportSummary
  });

  const upload = await putPrivateStorageObject({
    body: pdf.pdfBuffer,
    documentDate: generatedAt,
    mimeType: "application/pdf",
    namespace: "ai-delivery-report",
    originalFileName: pdf.fileName,
    projectSlugOrId: reportId,
    tenantSlugOrId: tenant.slug || tenant.id
  });

  if (!upload) {
    throw new Error("Private storage is not configured.");
  }

  const updated = await (prisma as any).aiDeliveryMonthlyReport.update({
    where: { id: reportId },
    data: { storageKey: upload.storageKey },
    select: aiDeliveryMonthlyReportSelect
  }) as any;

  return {
    report: {
      reportId: updated.id,
      hasDocument: !!updated.storageKey,
      updatedAt: updated.updatedAt.toISOString(),
      generatedAt: generatedAt.toISOString(),
      fileName: pdf.fileName
    }
  };
}

const MONTHLY_METRIC_SOURCE_TYPES: MonthlyMetricSourceType[] = ["MANUAL", "CSV_IMPORT", "GA4", "GSC", "HYBRID"];
const MONTHLY_METRIC_MUTABLE_STATUSES: MonthlyMetricSnapshotStatus[] = ["DRAFT", "IMPORTED"];

const aiDeliveryMonthlyMetricSnapshotSelect = {
  id: true,
  aiDeliveryProjectId: true,
  aiDeliveryMonthlyReportId: true,
  targetMonth: true,
  sourceType: true,
  status: true,
  gscClicks: true,
  gscImpressions: true,
  gscAverageCtr: true,
  gscAveragePosition: true,
  ga4Sessions: true,
  ga4Users: true,
  ga4PageViews: true,
  notes: true,
  importedByUserId: true,
  importedAt: true,
  approvedByUserId: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true
} as const;

const aiDeliveryMonthlyMetricsReportContextSelect = {
  id: true,
  aiDeliveryProjectId: true,
  clientId: true,
  status: true,
  isArchived: true,
  aiDeliveryProject: {
    select: {
      id: true,
      name: true,
      targetMonth: true,
      projectId: true,
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } }
    }
  }
} as const;

function normalizeMonthlyMetricTargetMonth(value: string): string | null {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

function normalizeMonthlyMetricSourceType(value: string | undefined): MonthlyMetricSourceType | null {
  if (!value) return "MANUAL";
  const normalized = value.trim().toUpperCase() as MonthlyMetricSourceType;
  return MONTHLY_METRIC_SOURCE_TYPES.includes(normalized) ? normalized : null;
}

function normalizeMonthlyMetricSnapshotStatus(value: string | undefined): MonthlyMetricSnapshotStatus | null {
  if (!value) return "IMPORTED";
  const normalized = value.trim().toUpperCase() as MonthlyMetricSnapshotStatus;
  return MONTHLY_METRIC_MUTABLE_STATUSES.includes(normalized) ? normalized : null;
}

function toAiDeliveryMonthlyMetricSnapshotSummary(snapshot: {
  id: string;
  aiDeliveryProjectId: string;
  aiDeliveryMonthlyReportId: string;
  targetMonth: string;
  sourceType: string;
  status: string;
  gscClicks: number | null;
  gscImpressions: number | null;
  gscAverageCtr: number | null;
  gscAveragePosition: number | null;
  ga4Sessions: number | null;
  ga4Users: number | null;
  ga4PageViews: number | null;
  notes: string | null;
  importedByUserId: string | null;
  importedAt: Date;
  approvedByUserId: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): AiDeliveryMonthlyMetricSnapshotSummary {
  return {
    id: snapshot.id,
    aiDeliveryProjectId: snapshot.aiDeliveryProjectId,
    aiDeliveryMonthlyReportId: snapshot.aiDeliveryMonthlyReportId,
    targetMonth: snapshot.targetMonth,
    sourceType: snapshot.sourceType as MonthlyMetricSourceType,
    status: snapshot.status as MonthlyMetricSnapshotStatus,
    gscClicks: snapshot.gscClicks,
    gscImpressions: snapshot.gscImpressions,
    gscAverageCtr: snapshot.gscAverageCtr,
    gscAveragePosition: snapshot.gscAveragePosition,
    ga4Sessions: snapshot.ga4Sessions,
    ga4Users: snapshot.ga4Users,
    ga4PageViews: snapshot.ga4PageViews,
    notes: snapshot.notes,
    importedByUserId: snapshot.importedByUserId,
    importedAt: snapshot.importedAt.toISOString(),
    approvedByUserId: snapshot.approvedByUserId,
    approvedAt: snapshot.approvedAt ? snapshot.approvedAt.toISOString() : null,
    createdAt: snapshot.createdAt.toISOString(),
    updatedAt: snapshot.updatedAt.toISOString()
  };
}

function toTrendMonthSummary(snapshot: AiDeliveryMonthlyMetricSnapshotSummary): AiDeliveryMonthlyMetricsTrendMonthSummary {
  return {
    targetMonth: snapshot.targetMonth,
    sourceType: snapshot.sourceType,
    gscClicks: snapshot.gscClicks,
    gscImpressions: snapshot.gscImpressions,
    gscAverageCtr: snapshot.gscAverageCtr,
    gscAveragePosition: snapshot.gscAveragePosition,
    ga4Sessions: snapshot.ga4Sessions,
    ga4Users: snapshot.ga4Users,
    ga4PageViews: snapshot.ga4PageViews
  };
}

function buildAiDeliveryMonthlyMetricsTrendSummary(snapshots: AiDeliveryMonthlyMetricSnapshotSummary[]): AiDeliveryMonthlyMetricsTrendSummary {
  const last12Months = snapshots.slice(-12).map(toTrendMonthSummary);
  const totals = last12Months.reduce(
    (acc, month) => ({
      gscClicks: acc.gscClicks + (month.gscClicks ?? 0),
      gscImpressions: acc.gscImpressions + (month.gscImpressions ?? 0),
      ga4Sessions: acc.ga4Sessions + (month.ga4Sessions ?? 0),
      ga4Users: acc.ga4Users + (month.ga4Users ?? 0),
      ga4PageViews: acc.ga4PageViews + (month.ga4PageViews ?? 0)
    }),
    { gscClicks: 0, gscImpressions: 0, ga4Sessions: 0, ga4Users: 0, ga4PageViews: 0 }
  );

  const ctrValues = last12Months.map((month) => month.gscAverageCtr).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const positionValues = last12Months.map((month) => month.gscAveragePosition).filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  return {
    dataStatus: last12Months.length === 0 ? "NO_DATA" : last12Months.length < 12 ? "PARTIAL" : "READY",
    latestMonth: last12Months.length > 0 ? last12Months[last12Months.length - 1].targetMonth : null,
    last12Months,
    totals,
    averages: {
      gscAverageCtr: ctrValues.length > 0 ? ctrValues.reduce((sum, value) => sum + value, 0) / ctrValues.length : null,
      gscAveragePosition: positionValues.length > 0 ? positionValues.reduce((sum, value) => sum + value, 0) / positionValues.length : null
    }
  };
}

async function getAiDeliveryMonthlyMetricsReportContext(authSession: AuthResolvedSessionContext, reportId: string) {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !reportId) return null;

  return (prisma as any).aiDeliveryMonthlyReport.findFirst({
    where: { id: reportId, tenantId },
    select: aiDeliveryMonthlyMetricsReportContextSelect
  }) as Promise<{
    id: string;
    aiDeliveryProjectId: string;
    clientId: string;
    status: string;
    isArchived: boolean;
    aiDeliveryProject: {
      id: string;
      name: string;
      targetMonth: Date;
      projectId: string | null;
      client: { id: string; name: string } | null;
      project: { id: string; name: string } | null;
    };
  } | null>;
}

export async function getAiDeliveryMonthlyReportMetrics(
  authSession: AuthResolvedSessionContext,
  reportId: string
): Promise<AiDeliveryMonthlyMetricsResponse | null> {
  const report = await getAiDeliveryMonthlyMetricsReportContext(authSession, reportId);
  if (!report) return null;

  const currentSnapshots = await (prisma as any).aiDeliveryMonthlyMetricSnapshot.findMany({
    where: {
      tenantId: getActiveTenantId(authSession),
      aiDeliveryMonthlyReportId: report.id
    },
    orderBy: [{ createdAt: "desc" }],
    select: aiDeliveryMonthlyMetricSnapshotSelect
  }) as any[];

  const current = currentSnapshots.map(toAiDeliveryMonthlyMetricSnapshotSummary);
  const reportClient = report.aiDeliveryProject.client;
  const trendSnapshots = reportClient
    ? await (prisma as any).aiDeliveryMonthlyMetricSnapshot.findMany({
        where: {
          tenantId: getActiveTenantId(authSession),
          status: "APPROVED",
          aiDeliveryMonthlyReport: {
            isArchived: false,
            aiDeliveryProject: {
              clientId: reportClient.id,
              projectId: report.aiDeliveryProject.projectId
            }
          }
        },
        orderBy: [{ targetMonth: "desc" }, { createdAt: "desc" }],
        take: 12,
        select: aiDeliveryMonthlyMetricSnapshotSelect
      }) as any[]
    : [];
  const approvedTrendSnapshots = trendSnapshots.map(toAiDeliveryMonthlyMetricSnapshotSummary).reverse();

  return {
    metrics: {
      report: {
        id: report.id,
        aiDeliveryProjectId: report.aiDeliveryProjectId,
        targetMonth: formatAiDeliveryTargetMonth(report.aiDeliveryProject.targetMonth),
        project: report.aiDeliveryProject.project ? { id: report.aiDeliveryProject.project.id, name: report.aiDeliveryProject.project.name } : null,
        client: reportClient ? { id: reportClient.id, name: reportClient.name } : null
      },
      snapshots: current,
      computedTrendSummary: buildAiDeliveryMonthlyMetricsTrendSummary(approvedTrendSnapshots)
    }
  };
}

export async function importAiDeliveryMonthlyReportMetrics(
  authSession: AuthResolvedSessionContext,
  reportId: string,
  input: AiDeliveryMonthlyMetricSnapshotInputRequest
): Promise<AiDeliveryMonthlyMetricSnapshotResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const report = await getAiDeliveryMonthlyMetricsReportContext(authSession, reportId);
  if (!report) return null;
  if (report.isArchived) {
    throwAiDeliveryBadRequest("AI_DELIVERY_MONTHLY_METRIC_SNAPSHOT_REPORT_ARCHIVED", "Cannot import metrics for an archived monthly report.");
  }

  const targetMonth = normalizeMonthlyMetricTargetMonth(input.targetMonth ?? "");
  if (!targetMonth) {
    throwAiDeliveryBadRequest("AI_DELIVERY_MONTHLY_METRIC_SNAPSHOT_TARGET_MONTH_INVALID", "Target month must use YYYY-MM format.");
  }

  const reportTargetMonth = formatAiDeliveryTargetMonth(report.aiDeliveryProject.targetMonth);
  if (targetMonth !== reportTargetMonth) {
    throwAiDeliveryBadRequest("AI_DELIVERY_MONTHLY_METRIC_SNAPSHOT_TARGET_MONTH_MISMATCH", "Target month must match the monthly report target month.");
  }

  const sourceType = normalizeMonthlyMetricSourceType(input.sourceType);
  if (!sourceType) {
    throwAiDeliveryBadRequest("AI_DELIVERY_MONTHLY_METRIC_SNAPSHOT_SOURCE_TYPE_INVALID", "Source type is not valid.");
  }

  const status = normalizeMonthlyMetricSnapshotStatus(input.status);
  if (!status) {
    throwAiDeliveryBadRequest("AI_DELIVERY_MONTHLY_METRIC_SNAPSHOT_STATUS_INVALID", "Status is not valid.");
  }

  const numericFields: Array<[string, number | null | undefined]> = [
    ["gscClicks", input.gscClicks],
    ["gscImpressions", input.gscImpressions],
    ["gscAverageCtr", input.gscAverageCtr],
    ["gscAveragePosition", input.gscAveragePosition],
    ["ga4Sessions", input.ga4Sessions],
    ["ga4Users", input.ga4Users],
    ["ga4PageViews", input.ga4PageViews]
  ];

  for (const [field, value] of numericFields) {
    if (value !== undefined && value !== null && (!Number.isFinite(value) || value < 0)) {
      throwAiDeliveryBadRequest("AI_DELIVERY_MONTHLY_METRIC_SNAPSHOT_VALUE_INVALID", `${field} must be a finite non-negative number.`);
    }
  }

  const snapshotData = {
    targetMonth,
    sourceType,
    status,
    gscClicks: input.gscClicks ?? null,
    gscImpressions: input.gscImpressions ?? null,
    gscAverageCtr: input.gscAverageCtr ?? null,
    gscAveragePosition: input.gscAveragePosition ?? null,
    ga4Sessions: input.ga4Sessions ?? null,
    ga4Users: input.ga4Users ?? null,
    ga4PageViews: input.ga4PageViews ?? null,
    notes: toNullableString(input.notes),
    importedByUserId: authSession.user.id,
    importedAt: new Date(),
    approvedByUserId: null,
    approvedAt: null
  };

  const snapshot = await (prisma as any).aiDeliveryMonthlyMetricSnapshot.upsert({
    where: { tenantId_aiDeliveryMonthlyReportId: { tenantId, aiDeliveryMonthlyReportId: report.id } },
    create: {
      tenantId,
      aiDeliveryProjectId: report.aiDeliveryProjectId,
      aiDeliveryMonthlyReportId: report.id,
      ...snapshotData
    },
    update: {
      aiDeliveryProjectId: report.aiDeliveryProjectId,
      ...snapshotData
    },
    select: aiDeliveryMonthlyMetricSnapshotSelect
  }) as any;

  return { snapshot: toAiDeliveryMonthlyMetricSnapshotSummary(snapshot) };
}

export async function approveAiDeliveryMonthlyReportMetrics(
  authSession: AuthResolvedSessionContext,
  reportId: string,
  snapshotId: string
): Promise<AiDeliveryMonthlyMetricSnapshotResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const report = await getAiDeliveryMonthlyMetricsReportContext(authSession, reportId);
  if (!report) return null;
  if (report.isArchived) {
    throwAiDeliveryBadRequest("AI_DELIVERY_MONTHLY_METRIC_SNAPSHOT_REPORT_ARCHIVED", "Cannot approve metrics for an archived monthly report.");
  }

  const existing = await (prisma as any).aiDeliveryMonthlyMetricSnapshot.findFirst({
    where: { id: snapshotId, tenantId, aiDeliveryMonthlyReportId: report.id },
    select: { id: true }
  }) as { id: string } | null;
  if (!existing) return null;

  const snapshot = await (prisma as any).aiDeliveryMonthlyMetricSnapshot.update({
    where: { id: snapshotId },
    data: {
      status: "APPROVED",
      approvedByUserId: authSession.user.id,
      approvedAt: new Date()
    },
    select: aiDeliveryMonthlyMetricSnapshotSelect
  }) as any;

  return { snapshot: toAiDeliveryMonthlyMetricSnapshotSummary(snapshot) };
}

export async function archiveAiDeliveryMonthlyReportMetrics(
  authSession: AuthResolvedSessionContext,
  reportId: string,
  snapshotId: string
): Promise<AiDeliveryMonthlyMetricSnapshotResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const report = await getAiDeliveryMonthlyMetricsReportContext(authSession, reportId);
  if (!report) return null;

  const existing = await (prisma as any).aiDeliveryMonthlyMetricSnapshot.findFirst({
    where: { id: snapshotId, tenantId, aiDeliveryMonthlyReportId: report.id },
    select: { id: true }
  }) as { id: string } | null;
  if (!existing) return null;

  const snapshot = await (prisma as any).aiDeliveryMonthlyMetricSnapshot.update({
    where: { id: snapshotId },
    data: { status: "ARCHIVED" },
    select: aiDeliveryMonthlyMetricSnapshotSelect
  }) as any;

  return { snapshot: toAiDeliveryMonthlyMetricSnapshotSummary(snapshot) };
}

export async function createAiDeliveryDeliverable(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  input: AiDeliveryDeliverableInputRequest
): Promise<AiDeliveryDeliverableResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.title) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await getAiDeliveryProjectForDeliverable(tx, tenantId, aiDeliveryProjectId);
    if (!project) return null;

    const contentDraftId = toNullableString(input.contentDraftId);
    const articleImageId = toNullableString(input.articleImageId);
    const status = normalizeAiDeliveryDeliverableStatus(input.status);
    const contentDraft = contentDraftId
      ? await getContentDraftForDeliverable(tx, tenantId, aiDeliveryProjectId, contentDraftId)
      : null;
    const articleImage = articleImageId
      ? await getArticleImageForDeliverable(tx, tenantId, aiDeliveryProjectId, articleImageId)
      : null;
    if ((contentDraftId && !contentDraft) || (articleImageId && !articleImage)) {
      if (contentDraftId && !contentDraft) {
        throwAiDeliveryBadRequest("AI_DELIVERY_DELIVERABLE_CONTENT_DRAFT_LINK_INVALID", "Content draft must belong to the same AI Delivery project.");
      }
      throwAiDeliveryBadRequest("AI_DELIVERY_DELIVERABLE_ARTICLE_IMAGE_LINK_INVALID", "Article image must belong to the same AI Delivery project.");
    }
    if (!validateDeliverableReadyLinks(status, contentDraft, articleImage)) {
      throwAiDeliveryBadRequest("AI_DELIVERY_DELIVERABLE_READY_LINKS_BLOCKED", "Ready, delivered, and accepted deliverables require approved same-project draft or image links.");
    }

    const created = await getAiDeliveryDeliverableDelegate(tx).create({
      data: {
        tenantId,
        aiDeliveryProjectId: project.id,
        contentDraftId,
        articleImageId,
        title: input.title,
        description: toNullableString(input.description),
        deliveryType: normalizeAiDeliveryDeliverableDeliveryType(input.deliveryType),
        status,
        exportUrl: toNullableString(input.exportUrl),
        storageKey: toNullableString(input.storageKey),
        notes: toNullableString(input.notes)
      },
      select: aiDeliveryDeliverableSelect
    }) as any;

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_DELIVERABLE_CREATED",
        relatedEntityId: created.id
      },
      tx
    );

    return { deliverable: toAiDeliveryDeliverableSummary(created) };
  });
}

export async function updateAiDeliveryDeliverable(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string,
  input: AiDeliveryDeliverableInputRequest
): Promise<AiDeliveryDeliverableResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.title) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryDeliverableDelegate(tx).findFirst({ where: { id: deliverableId, tenantId }, select: aiDeliveryDeliverableSelect as any }) as any;
    if (!existing) return null;
    if (existing.aiDeliveryProjectId !== aiDeliveryProjectId) return null;

    const contentDraftId = input.contentDraftId === undefined ? existing.contentDraftId ?? null : toNullableString(input.contentDraftId);
    const articleImageId = input.articleImageId === undefined ? existing.articleImageId ?? null : toNullableString(input.articleImageId);
    const contentDraft = contentDraftId
      ? await getContentDraftForDeliverable(tx, tenantId, aiDeliveryProjectId, contentDraftId)
      : null;
    const articleImage = articleImageId
      ? await getArticleImageForDeliverable(tx, tenantId, aiDeliveryProjectId, articleImageId)
      : null;
    if ((contentDraftId && !contentDraft) || (articleImageId && !articleImage)) {
      if (contentDraftId && !contentDraft) {
        throwAiDeliveryBadRequest("AI_DELIVERY_DELIVERABLE_CONTENT_DRAFT_LINK_INVALID", "Content draft must belong to the same AI Delivery project.");
      }
      throwAiDeliveryBadRequest("AI_DELIVERY_DELIVERABLE_ARTICLE_IMAGE_LINK_INVALID", "Article image must belong to the same AI Delivery project.");
    }
    const status = normalizeAiDeliveryDeliverableStatus(input.status);
    if (!validateDeliverableReadyLinks(status, contentDraft, articleImage)) {
      throwAiDeliveryBadRequest("AI_DELIVERY_DELIVERABLE_READY_LINKS_BLOCKED", "Ready, delivered, and accepted deliverables require approved same-project draft or image links.");
    }

    const updated = await getAiDeliveryDeliverableDelegate(tx).update({
      where: { id: deliverableId },
      data: {
        contentDraftId,
        articleImageId,
        title: input.title,
        description: input.description === undefined ? existing.description : toNullableString(input.description),
        deliveryType: normalizeAiDeliveryDeliverableDeliveryType(input.deliveryType),
        status,
        exportUrl: input.exportUrl === undefined ? existing.exportUrl : toNullableString(input.exportUrl),
        storageKey: input.storageKey === undefined ? existing.storageKey : toNullableString(input.storageKey),
        notes: input.notes === undefined ? existing.notes : toNullableString(input.notes),
        isArchived: status === "ARCHIVED" ? true : existing.isArchived
      },
      select: aiDeliveryDeliverableSelect
    }) as any;

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_DELIVERABLE_UPDATED",
        relatedEntityId: updated.id
      },
      tx
    );

    return { deliverable: toAiDeliveryDeliverableSummary(updated) };
  });
}

export async function markAiDeliveryDeliverableReady(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string
): Promise<AiDeliveryDeliverableResponse | null> {
  return updateAiDeliveryDeliverableStatus(authSession, aiDeliveryProjectId, deliverableId, "READY", "AI_DELIVERY_DELIVERABLE_READY");
}

export async function requestAiDeliveryDeliverableRevision(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string
): Promise<AiDeliveryDeliverableResponse | null> {
  return updateAiDeliveryDeliverableStatus(authSession, aiDeliveryProjectId, deliverableId, "REVISION_REQUESTED", "AI_DELIVERY_DELIVERABLE_REVISION_REQUESTED");
}

export async function acceptAiDeliveryDeliverable(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string
): Promise<AiDeliveryDeliverableResponse | null> {
  return updateAiDeliveryDeliverableStatus(authSession, aiDeliveryProjectId, deliverableId, "ACCEPTED", "AI_DELIVERY_DELIVERABLE_ACCEPTED");
}

export async function getAiDeliveryDeliverableDownload(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string
): Promise<DocumentDownloadResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !aiDeliveryProjectId || !deliverableId) {
    return null;
  }

  const deliverable = await getAiDeliveryDeliverableDelegate(prisma).findFirst({
    where: {
      id: deliverableId,
      tenantId,
      aiDeliveryProjectId,
      isArchived: false
    },
    select: {
      storageKey: true
    }
  }) as { storageKey?: string | null } | null;

  if (!deliverable?.storageKey) {
    return null;
  }

  return getPrivateStorageDownloadReference(deliverable.storageKey);
}

export async function getAiDeliveryDeliverableDownloadReference(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string
): Promise<AiDeliveryDeliverableDownloadReferenceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !aiDeliveryProjectId || !deliverableId) {
    return null;
  }

  const deliverable = await getAiDeliveryDeliverableDelegate(prisma).findFirst({
    where: {
      id: deliverableId,
      tenantId,
      aiDeliveryProjectId,
      isArchived: false
    },
    select: {
      storageKey: true
    }
  }) as { storageKey?: string | null } | null;

  if (!deliverable?.storageKey) {
    return { downloadReference: null };
  }

  const downloadRef = getPrivateStorageDownloadReference(deliverable.storageKey);
  return {
    downloadReference: downloadRef
      ? {
          storageKey: deliverable.storageKey,
          downloadUrl: downloadRef.downloadUrl || null,
          expiresSeconds: downloadRef.expiresSeconds || null
        }
      : null
  };
}

export async function prepareAiDeliveryDeliverableWordPressDraft(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string,
  publicationTargetId?: string | null
): Promise<AiDeliveryWordPressDraftResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !aiDeliveryProjectId || !deliverableId) {
    return null;
  }

  const project = await prisma.aiDeliveryProject.findFirst({
    where: {
      id: aiDeliveryProjectId,
      tenantId,
      isArchived: false
    },
    select: {
      id: true,
      clientId: true
    }
  });
  if (!project) {
    return null;
  }

  const publicationTarget = await resolvePublicationTargetForClient(tenantId, project.clientId, publicationTargetId);
  if (!publicationTarget) {
    throwAiDeliveryConflict(
      "AI_DELIVERY_WORDPRESS_TARGET_REQUIRED",
      "A publication target must be configured for this client before preparing a WordPress draft."
    );
  }

  const deliverable = await getAiDeliveryDeliverableDelegate(prisma).findFirst({
    where: {
      id: deliverableId,
      tenantId,
      aiDeliveryProjectId,
      isArchived: false
    },
    select: {
      id: true,
      title: true,
      description: true,
      notes: true,
      contentDraft: {
        select: {
          id: true,
          title: true,
          draftBody: true,
          status: true,
          approvedAt: true,
          isArchived: true
        }
      }
    }
  }) as {
    id: string;
    title: string;
    description?: string | null;
    notes?: string | null;
    contentDraft?: {
      id: string;
      title: string;
      draftBody: string;
      status: string;
      approvedAt?: Date | null;
      isArchived: boolean;
    } | null;
  } | null;
  if (!deliverable) {
    return null;
  }

  const linkedDraft = deliverable.contentDraft ?? null;
  if (linkedDraft?.isArchived) {
    throwAiDeliveryConflict("AI_DELIVERY_WORDPRESS_DRAFT_SOURCE_BLOCKED", "Linked content draft is archived.");
  }

  const useContentDraftSource = Boolean(linkedDraft && linkedDraft.approvedAt);
  const sourceType: "DELIVERABLE" | "CONTENT_DRAFT" = useContentDraftSource ? "CONTENT_DRAFT" : "DELIVERABLE";
  const sourceId = useContentDraftSource ? linkedDraft!.id : deliverable.id;
  const title = useContentDraftSource
    ? (linkedDraft!.title || "").trim()
    : (deliverable.title || "").trim();
  const body = useContentDraftSource
    ? (linkedDraft!.draftBody || "").trim()
    : ((deliverable.description ?? deliverable.notes ?? "") || "").trim();

  if (!title) {
    throwAiDeliveryConflict("AI_DELIVERY_WORDPRESS_DRAFT_TITLE_REQUIRED", "A title is required to prepare a WordPress draft.");
  }
  if (!body) {
    throwAiDeliveryConflict("AI_DELIVERY_WORDPRESS_DRAFT_BODY_REQUIRED", "Content is required to prepare a WordPress draft.");
  }

  const excerptCandidate = (deliverable.description ?? "").trim();
  let siteUrlHost: string | null = null;
  try {
    siteUrlHost = new URL(publicationTarget!.siteUrl).hostname;
  } catch {
    siteUrlHost = null;
  }

  await recordPublicationLog({
    tenantId,
    clientId: project.clientId,
    publicationTargetId: publicationTarget!.id,
    aiDeliveryProjectId,
    deliverableId,
    action: "PREPARE_WORDPRESS_DRAFT",
    status: "PREPARED",
    siteUrlHost,
    actorUserId: authSession.user.id,
    note: `Prepared draft for ${publicationTarget!.label}`
  });

  return {
    wordpressDraft: {
      status: "PREPARED",
      title,
      body,
      excerpt: excerptCandidate || null,
      sourceType,
      sourceId,
      externalPostId: null,
      externalEditUrl: null,
      publicationTargetId: publicationTarget!.id,
      publicationTargetLabel: publicationTarget!.label,
      publicationSiteUrl: publicationTarget!.siteUrl,
      note: "WordPress API execution uses the client publication target. Live publish remains env-gated."
    }
  };
}

export async function publishAiDeliveryDeliverableToWordPress(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string,
  publicationTargetId?: string | null
): Promise<{ publishResult: AiDeliveryWordPressPublishResult } | null> {
  const { publishAiDeliveryDeliverableToWordPress: publishToWordPressService } = await import("../services/wordpress.service");
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !aiDeliveryProjectId || !deliverableId) {
    return null;
  }

  const project = await prisma.aiDeliveryProject.findFirst({
    where: {
      id: aiDeliveryProjectId,
      tenantId,
      isArchived: false
    },
    select: {
      id: true,
      clientId: true,
      projectId: true
    }
  });
  if (!project) {
    return null;
  }

  const publicationTarget = await resolvePublicationTargetForClient(tenantId, project.clientId, publicationTargetId);
  if (!publicationTarget) {
    throwAiDeliveryConflict(
      "AI_DELIVERY_WORDPRESS_TARGET_REQUIRED",
      "A publication target must be configured for this client before publishing to WordPress."
    );
  }

  const deliverable = await getAiDeliveryDeliverableDelegate(prisma).findFirst({
    where: {
      id: deliverableId,
      tenantId,
      aiDeliveryProjectId,
      isArchived: false
    },
    select: {
      id: true,
      title: true,
      description: true,
      notes: true,
      contentDraft: {
        select: {
          id: true,
          title: true,
          draftBody: true,
          status: true,
          approvedAt: true,
          isArchived: true
        }
      }
    }
  }) as {
    id: string;
    title: string;
    description?: string | null;
    notes?: string | null;
    contentDraft?: {
      id: string;
      title: string;
      draftBody: string;
      status: string;
      approvedAt?: Date | null;
      isArchived: boolean;
    } | null;
  } | null;

  if (!deliverable) {
    return null;
  }

  const linkedDraft = deliverable.contentDraft ?? null;
  if (linkedDraft?.isArchived) {
    throwAiDeliveryConflict("AI_DELIVERY_WORDPRESS_PUBLISH_SOURCE_BLOCKED", "Linked content draft is archived.");
  }

  const useContentDraftSource = Boolean(linkedDraft && linkedDraft.approvedAt);
  const sourceType: "DELIVERABLE" | "CONTENT_DRAFT" = useContentDraftSource ? "CONTENT_DRAFT" : "DELIVERABLE";
  const sourceId = useContentDraftSource ? linkedDraft!.id : deliverable.id;
  const title = useContentDraftSource
    ? (linkedDraft!.title || "").trim()
    : (deliverable.title || "").trim();
  const body = useContentDraftSource
    ? (linkedDraft!.draftBody || "").trim()
    : ((deliverable.description ?? deliverable.notes ?? "") || "").trim();

  if (!title || !body) {
    throwAiDeliveryConflict("AI_DELIVERY_WORDPRESS_PUBLISH_CONTENT_INVALID", "Title and body are required to publish.");
  }

  const excerptCandidate = (deliverable.description ?? "").trim();
  const applicationPassword = await getDecryptedPublicationTargetPassword(tenantId, publicationTarget!.id);
  const publishResult = await publishToWordPressService(
    {
      deliverableId: deliverable.id,
      title,
      body,
      excerpt: excerptCandidate || null
    },
    {
      siteConfig: {
        siteUrl: publicationTarget!.siteUrl,
        siteSlug: publicationTarget!.siteSlug ?? undefined,
        wordPressComSite: publicationTarget!.wordPressComSite
      },
      applicationPassword
    }
  );

  let siteUrlHost: string | null = null;
  try {
    siteUrlHost = new URL(publicationTarget!.siteUrl).hostname;
  } catch {
    siteUrlHost = null;
  }

  await recordPublicationLog({
    tenantId,
    clientId: project.clientId,
    publicationTargetId: publicationTarget!.id,
    aiDeliveryProjectId,
    deliverableId,
    action: "PUBLISH_WORDPRESS",
    status: publishResult.status === "published" ? "PUBLISHED" : publishResult.status === "error" ? "FAILED" : "PROVIDER_DISABLED",
    siteUrlHost,
    externalPostId: publishResult.wordpressPostId,
    actorUserId: authSession.user.id,
    note: publishResult.providerDisabledReason ?? publishResult.errorMessage
  });

  if (publishResult.status === "published") {
    await prisma.$transaction(async (tx) => {
      await linkDeliveryRevenueAttribution(tx, {
        tenantId,
        deliverableId,
        aiDeliveryProjectId,
        clientId: project.clientId,
        projectId: project.projectId,
        publishedAt: new Date(),
        metadata: {
          publicationTargetId: publicationTarget!.id,
          wordpressPostId: publishResult.wordpressPostId ?? null,
          action: "PUBLISH_WORDPRESS"
        }
      });
    });
  }

  return {
    publishResult
  };
}

export async function exportAiDeliveryDeliverableToGoogleDoc(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string
): Promise<AiDeliveryGoogleDocExportResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !aiDeliveryProjectId || !deliverableId) {
    return null;
  }

  const project = await getAiDeliveryProjectDelegate(prisma).findFirst({
    where: {
      id: aiDeliveryProjectId,
      tenantId,
      isArchived: false
    },
    select: {
      id: true,
      name: true,
      targetMonth: true,
      client: {
        select: { id: true, name: true }
      }
    }
  }) as {
    id: string;
    name: string;
    targetMonth: string | null;
    client: { id: string; name: string } | null;
  } | null;
  if (!project) {
    return null;
  }

  const deliverable = await getAiDeliveryDeliverableDelegate(prisma).findFirst({
    where: {
      id: deliverableId,
      tenantId,
      aiDeliveryProjectId,
      isArchived: false
    },
    select: {
      id: true,
      title: true,
      description: true,
      notes: true,
      contentDraft: {
        select: {
          id: true,
          title: true,
          draftBody: true,
          status: true,
          approvedAt: true,
          isArchived: true
        }
      }
    }
  }) as {
    id: string;
    title: string;
    description: string | null;
    notes: string | null;
    contentDraft: {
      id: string;
      title: string;
      draftBody: string;
      status: string;
      approvedAt: Date | null;
      isArchived: boolean;
    } | null;
  } | null;
  if (!deliverable) {
    return null;
  }

  const { exportDeliverableToGoogleDoc } = await import("../services/google-drive.service");

  const draft = deliverable.contentDraft && !deliverable.contentDraft.isArchived
    ? deliverable.contentDraft
    : null;

  const result = await exportDeliverableToGoogleDoc({
    deliverableId: deliverable.id,
    deliverableTitle: deliverable.title,
    deliverableDescription: deliverable.description,
    deliverableNotes: deliverable.notes,
    contentDraftTitle: draft?.title ?? null,
    contentDraftBody: draft?.draftBody ?? null,
    clientName: project.client?.name ?? "Unknown Client",
    projectName: project.name,
    targetMonth: project.targetMonth ?? "unknown"
  });

  return result;
}

export async function uploadAiDeliveryDeliverableDocument(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string,
  input: AiDeliveryDeliverableUploadRequest
): Promise<AiDeliveryDeliverableResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !aiDeliveryProjectId || !deliverableId || !input.fileName || !input.mimeType || !input.contentBase64) {
    return null;
  }
  const { contentBase64, fileName, mimeType } = input;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await tx.aiDeliveryProject.findFirst({
      where: {
        id: aiDeliveryProjectId,
        tenantId,
        isArchived: false
      },
      select: {
        id: true
      }
    });
    if (!project) {
      return null;
    }

    const existing = await getAiDeliveryDeliverableDelegate(tx).findFirst({
      where: {
        id: deliverableId,
        tenantId,
        aiDeliveryProjectId,
        isArchived: false
      },
      select: aiDeliveryDeliverableSelect as any
    }) as any;
    if (!existing) {
      return null;
    }

    const tenant = await tx.tenant.findUnique({
      where: {
        id: tenantId
      },
      select: {
        id: true,
        slug: true
      }
    });
    if (!tenant) {
      return null;
    }

    const upload = await putPrivateStorageObject({
      body: Buffer.from(contentBase64, "base64"),
      documentDate: new Date(),
      mimeType,
      namespace: "ai-delivery-deliverable",
      originalFileName: fileName,
      projectSlugOrId: aiDeliveryProjectId,
      tenantSlugOrId: tenant.slug || tenant.id
    });

    if (!upload) {
      throw new Error("Private storage is not configured.");
    }

    const updated = await getAiDeliveryDeliverableDelegate(tx).update({
      where: {
        id: existing.id
      },
      data: {
        storageKey: upload.storageKey,
        exportUrl: null
      },
      select: aiDeliveryDeliverableSelect
    }) as any;

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_DELIVERABLE_UPDATED",
        relatedEntityId: updated.id
      },
      tx
    );

    return {
      deliverable: toAiDeliveryDeliverableSummary(updated)
    };
  });
}

export async function archiveAiDeliveryDeliverable(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string
): Promise<AiDeliveryDeliverableResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryDeliverableDelegate(tx).findFirst({ where: { id: deliverableId, tenantId }, select: aiDeliveryDeliverableSelect as any }) as any;
    if (!existing) return null;
    if (existing.aiDeliveryProjectId !== aiDeliveryProjectId) return null;

    const archived = await getAiDeliveryDeliverableDelegate(tx).update({
      where: { id: existing.id },
      data: { isArchived: true, status: "ARCHIVED" },
      select: aiDeliveryDeliverableSelect
    }) as any;

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_DELIVERABLE_ARCHIVED",
        relatedEntityId: archived.id
      },
      tx
    );

    return { deliverable: toAiDeliveryDeliverableSummary(archived) };
  });
}

export async function restoreAiDeliveryDeliverable(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string
): Promise<AiDeliveryDeliverableResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryDeliverableDelegate(tx).findFirst({
      where: { id: deliverableId, tenantId, aiDeliveryProjectId },
      select: aiDeliveryDeliverableSelect as any
    }) as any;
    if (!existing) return null;
    if (!existing.isArchived) {
      throwAiDeliveryConflict("AI_DELIVERY_DELIVERABLE_RESTORE_BLOCKED", "Only archived deliverables can be restored.");
    }

    const restored = await getAiDeliveryDeliverableDelegate(tx).update({
      where: { id: deliverableId },
      data: { isArchived: false, status: "DRAFT" },
      select: aiDeliveryDeliverableSelect
    }) as any;

    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_DELIVERABLE_RESTORED",
        relatedEntityId: restored.id
      },
      tx
    );

    return { deliverable: toAiDeliveryDeliverableSummary(restored) };
  });
}

// AiDeliveryDeliverableReview runtime functions
function getAiDeliveryDeliverableReviewDelegate(client: PrismaTx | typeof prisma) {
  return (client as unknown as { aiDeliveryDeliverableReview: { findFirst: (args: unknown) => Promise<unknown>; findMany: (args: unknown) => Promise<unknown[]>; create: (args: unknown) => Promise<unknown>; update: (args: unknown) => Promise<unknown>; } }).aiDeliveryDeliverableReview;
}

const aiDeliveryDeliverableReviewSelect = {
  id: true,
  tenantId: true,
  aiDeliveryProjectId: true,
  deliverableId: true,
  workflowRunId: true,
  status: true,
  reviewerName: true,
  reviewNotes: true,
  createdAt: true,
  updatedAt: true
} as const;

function normalizeAiDeliveryDeliverableReviewStatus(value: string | null | undefined): AiDeliveryDeliverableReviewStatus {
  const v = value ? value.trim().toUpperCase() : null;
  return v && ["NOT_STARTED", "ADMIN_REVIEW", "CHANGES_REQUESTED", "APPROVED", "ARCHIVED"].includes(v) ? (v as AiDeliveryDeliverableReviewStatus) : "NOT_STARTED";
}

function toAiDeliveryDeliverableReviewSummary(review: any) {
  return {
    id: review.id,
    tenantId: review.tenantId,
    aiDeliveryProjectId: review.aiDeliveryProjectId,
    deliverableId: review.deliverableId,
    workflowRunId: review.workflowRunId ?? null,
    status: review.status,
    reviewerName: review.reviewerName ?? null,
    reviewNotes: review.reviewNotes ?? null,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString()
  };
}

async function getAiDeliveryProjectDeliverable(tx: PrismaTx, tenantId: string, aiDeliveryProjectId: string, deliverableId: string) {
  const project = await tx.aiDeliveryProject.findFirst({ where: { id: aiDeliveryProjectId, tenantId, isArchived: false }, select: { id: true } });
  if (!project) return null;

  return getAiDeliveryDeliverableDelegate(tx).findFirst({ where: { id: deliverableId, tenantId, aiDeliveryProjectId }, select: { id: true } });
}

async function getAiDeliveryProjectWorkflowRun(tx: PrismaTx, tenantId: string, aiDeliveryProjectId: string, workflowRunId: string) {
  return getAiDeliveryWorkflowRunDelegate(tx).findFirst({ where: { id: workflowRunId, tenantId, aiDeliveryProjectId }, select: { id: true } });
}

export async function listAiDeliveryDeliverableReviews(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string
): Promise<AiDeliveryDeliverableReviewsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const deliverable = await prisma.$transaction((tx: PrismaTx) => getAiDeliveryProjectDeliverable(tx, tenantId, aiDeliveryProjectId, deliverableId));
  if (!deliverable) return null;

  const deliverableReviews = await getAiDeliveryDeliverableReviewDelegate(prisma).findMany({
    where: { tenantId, aiDeliveryProjectId, deliverableId },
    orderBy: { createdAt: "asc" },
    select: aiDeliveryDeliverableReviewSelect
  });

  return { deliverableReviews: deliverableReviews.map(toAiDeliveryDeliverableReviewSummary) };
}

export async function createAiDeliveryDeliverableReview(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string,
  input: AiDeliveryDeliverableReviewInputRequest
): Promise<AiDeliveryDeliverableReviewResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;
  if ((input.aiDeliveryProjectId && input.aiDeliveryProjectId !== aiDeliveryProjectId) || (input.deliverableId && input.deliverableId !== deliverableId)) {
    throwAiDeliveryBadRequest("AI_DELIVERY_DELIVERABLE_REVIEW_ROUTE_LINK_INVALID", "Deliverable review payload links must match the route project and deliverable.");
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const deliverable = await getAiDeliveryProjectDeliverable(tx, tenantId, aiDeliveryProjectId, deliverableId);
    if (!deliverable) return null;

    const workflowRunId = toNullableString(input.workflowRunId);
    if (workflowRunId) {
      const workflowRun = await getAiDeliveryProjectWorkflowRun(tx, tenantId, aiDeliveryProjectId, workflowRunId);
      if (!workflowRun) {
        throwAiDeliveryBadRequest("AI_DELIVERY_DELIVERABLE_REVIEW_WORKFLOW_RUN_LINK_INVALID", "Workflow run must belong to the same AI Delivery project.");
      }
    }

    const created = await getAiDeliveryDeliverableReviewDelegate(tx).create({
      data: {
        tenantId,
        aiDeliveryProjectId,
        deliverableId,
        workflowRunId,
        status: normalizeAiDeliveryDeliverableReviewStatus(input.status),
        reviewerName: toNullableString(input.reviewerName),
        reviewNotes: toNullableString(input.reviewNotes)
      },
      select: aiDeliveryDeliverableReviewSelect
    });

    const createdReview = toAiDeliveryDeliverableReviewSummary(created);
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_DELIVERABLE_REVIEW_CREATED",
        relatedEntityId: createdReview.id
      },
      tx
    );

    return { deliverableReview: createdReview };
  });
}

export async function updateAiDeliveryDeliverableReview(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  deliverableId: string,
  reviewId: string,
  input: AiDeliveryDeliverableReviewInputRequest
): Promise<AiDeliveryDeliverableReviewResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;
  if ((input.aiDeliveryProjectId && input.aiDeliveryProjectId !== aiDeliveryProjectId) || (input.deliverableId && input.deliverableId !== deliverableId)) {
    throwAiDeliveryBadRequest("AI_DELIVERY_DELIVERABLE_REVIEW_ROUTE_LINK_INVALID", "Deliverable review payload links must match the route project and deliverable.");
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const deliverable = await getAiDeliveryProjectDeliverable(tx, tenantId, aiDeliveryProjectId, deliverableId);
    if (!deliverable) return null;

    const existing = await getAiDeliveryDeliverableReviewDelegate(tx).findFirst({ where: { id: reviewId, tenantId, aiDeliveryProjectId, deliverableId }, select: aiDeliveryDeliverableReviewSelect }) as any;
    if (!existing) return null;

    let workflowRunId: string | null | undefined;
    if (input.workflowRunId !== undefined) {
      workflowRunId = toNullableString(input.workflowRunId);
      if (workflowRunId) {
        const workflowRun = await getAiDeliveryProjectWorkflowRun(tx, tenantId, aiDeliveryProjectId, workflowRunId);
        if (!workflowRun) {
          throwAiDeliveryBadRequest("AI_DELIVERY_DELIVERABLE_REVIEW_WORKFLOW_RUN_LINK_INVALID", "Workflow run must belong to the same AI Delivery project.");
        }
      }
    }

    const updated = await getAiDeliveryDeliverableReviewDelegate(tx).update({
      where: { id: reviewId },
      data: {
        status: input.status ? normalizeAiDeliveryDeliverableReviewStatus(input.status) : existing.status,
        reviewerName: input.reviewerName === undefined ? existing.reviewerName : toNullableString(input.reviewerName),
        reviewNotes: input.reviewNotes === undefined ? existing.reviewNotes : toNullableString(input.reviewNotes),
        ...(workflowRunId !== undefined ? { workflowRunId } : {})
      },
      select: aiDeliveryDeliverableReviewSelect
    });

    const updatedReview = toAiDeliveryDeliverableReviewSummary(updated);
    await recordAiDeliverySystemEvent(
      {
        tenantId,
        aiDeliveryProjectId,
        eventName: "AI_DELIVERY_DELIVERABLE_REVIEW_UPDATED",
        relatedEntityId: updatedReview.id
      },
      tx
    );

    return { deliverableReview: updatedReview };
  });
}

// WordPress non-secret tenant config functions
export interface AiDeliveryWordPressTenantConfig {
  siteUrl: string;
  siteSlug?: string | null;
  wordPressComSite: boolean;
}

export interface AiDeliveryWordPressTenantConfigResponse {
  config: AiDeliveryWordPressTenantConfig | null;
  validation: { ok: boolean; issues: string[]; warnings: string[] };
}

const WORDPRESS_CONFIG_KEY = "ai_delivery_wordpress_connection";
const FORBIDDEN_SECRET_KEYWORDS = ["password", "token", "apikey", "applicati onpassword", "bearertoken", "authheader", "secret", "clientsecret", "refreshtoken", "accesstoken"];

function isForbiddenSecretField(obj: Record<string, any>): boolean {
  const keys = Object.keys(obj || {}).map((k) => k.toLowerCase());
  return keys.some((key) => FORBIDDEN_SECRET_KEYWORDS.some((secret) => key.includes(secret)));
}

export async function getAiDeliveryWordPressConfigForTenant(
  authSession: AuthResolvedSessionContext
): Promise<AiDeliveryWordPressTenantConfigResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const setting = await prisma.tenantSetting.findUnique({
    where: {
      tenantId_key: {
        tenantId,
        key: WORDPRESS_CONFIG_KEY
      }
    },
    select: {
      value: true
    }
  });

  if (!setting) {
    return {
      config: null,
      validation: {
        ok: false,
        issues: ["WordPress configuration not yet configured."],
        warnings: []
      }
    };
  }

  const config = setting.value as any;
  return {
    config: {
      siteUrl: config.siteUrl || "",
      siteSlug: config.siteSlug || null,
      wordPressComSite: Boolean(config.wordPressComSite)
    },
    validation: {
      ok: true,
      issues: [],
      warnings: []
    }
  };
}

export async function saveAiDeliveryWordPressConfigForTenant(
  authSession: AuthResolvedSessionContext,
  input: Record<string, any>
): Promise<AiDeliveryWordPressTenantConfigResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  if (isForbiddenSecretField(input)) {
    return {
      config: null,
      validation: {
        ok: false,
        issues: ["Request contains forbidden secret-like fields (password, token, apiKey, etc)."],
        warnings: []
      }
    };
  }

  const siteUrl = String(input.siteUrl || "").trim();
  const siteSlug = String(input.siteSlug || "").trim() || null;
  const wordPressComSite = Boolean(input.wordPressComSite);

  if (!siteUrl) {
    return {
      config: null,
      validation: {
        ok: false,
        issues: ["WordPress site URL is required."],
        warnings: []
      }
    };
  }

  try {
    new URL(siteUrl);
  } catch {
    return {
      config: null,
      validation: {
        ok: false,
        issues: ["WordPress site URL must be a valid HTTP/HTTPS URL."],
        warnings: []
      }
    };
  }

  const normalizedUrl = siteUrl.replace(/\/+$/, "");
  const config: AiDeliveryWordPressTenantConfig = {
    siteUrl: normalizedUrl,
    siteSlug,
    wordPressComSite
  };

  await prisma.tenantSetting.upsert({
    where: {
      tenantId_key: {
        tenantId,
        key: WORDPRESS_CONFIG_KEY
      }
    },
    update: {
      value: config as any,
      updatedAt: new Date()
    },
    create: {
      tenantId,
      key: WORDPRESS_CONFIG_KEY,
      valueType: "JSON",
      value: config as any
    }
  });

  await recordPlatformAuditEvent({
    tenantId,
    action: "WORDPRESS_CONFIG_UPDATED",
    entityType: "WORDPRESS_TENANT_CONFIG",
    entityId: tenantId,
    metadata: {
      configPresent: true,
      siteUrlHost: new URL(normalizedUrl).hostname
    }
  });

  return {
    config,
    validation: {
      ok: true,
      issues: [],
      warnings: []
    }
  };
}

// Market Intelligence functions

const marketIntelligenceProjectSelect = {
  id: true,
  clientId: true,
  client: {
    select: {
      id: true,
      name: true,
      website: true
    }
  },
  title: true,
  description: true,
  keywords: true,
  competitors: true,
  niche: true,
  productServiceFocus: true,
  targetClientName: true,
  targetMonth: true,
  status: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true
} as const;

function mapMarketIntelligenceProjectSummary(project: {
  id: string;
  clientId: string | null;
  client: { id: string; name: string; website: string | null } | null;
  title: string;
  description: string | null;
  keywords: string | null;
  competitors: string | null;
  niche: string | null;
  productServiceFocus: string | null;
  targetClientName: string | null;
  targetMonth: string | null;
  status: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}): MarketIntelligenceProjectSummary {
  return {
    id: project.id,
    clientId: project.clientId,
    client: project.client,
    title: project.title,
    description: project.description,
    keywords: project.keywords,
    competitors: project.competitors,
    niche: project.niche,
    productServiceFocus: project.productServiceFocus,
    targetClientName: project.client?.name ?? project.targetClientName,
    targetMonth: project.targetMonth,
    status: project.status,
    isArchived: project.isArchived,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}

export async function listMarketIntelligenceProjects(
  authSession: AuthResolvedSessionContext
): Promise<MarketIntelligenceProjectsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const projects = await tx.marketIntelligenceProject.findMany({
      where: {
        tenantId,
        isArchived: false
      },
      select: marketIntelligenceProjectSelect,
      orderBy: { createdAt: "desc" }
    });

    return {
      projects: projects.map(mapMarketIntelligenceProjectSummary)
    };
  });
}

export async function createMarketIntelligenceProject(
  authSession: AuthResolvedSessionContext,
  input: MarketIntelligenceProjectInputRequest
): Promise<MarketIntelligenceProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId || !input.clientId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const client = await tx.client.findFirst({
      where: { id: input.clientId!, tenantId, isArchived: false },
      select: { id: true, name: true }
    });
    if (!client) {
      return { project: null };
    }

    const project = await tx.marketIntelligenceProject.create({
      data: {
        tenantId,
        clientId: client.id,
        title: input.title ?? "New Project",
        description: toNullableString(input.description),
        keywords: toNullableString(input.keywords),
        competitors: toNullableString(input.competitors),
        niche: toNullableString(input.niche),
        productServiceFocus: toNullableString(input.productServiceFocus),
        targetClientName: client.name,
        targetMonth: toNullableString(input.targetMonth),
        status: input.status ?? "ACTIVE"
      },
      select: marketIntelligenceProjectSelect
    });

    return {
      project: mapMarketIntelligenceProjectSummary(project)
    };
  });
}

export async function updateMarketIntelligenceProject(
  authSession: AuthResolvedSessionContext,
  projectId: string,
  input: MarketIntelligenceProjectInputRequest
): Promise<MarketIntelligenceProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.marketIntelligenceProject.findFirst({
      where: { id: projectId, tenantId },
      select: { id: true }
    });
    if (!existing) {
      return { project: null };
    }

    const updateData: any = {};
    if (input.title !== undefined && input.title !== null) {
      updateData.title = input.title;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.keywords !== undefined) {
      updateData.keywords = input.keywords;
    }
    if (input.competitors !== undefined) {
      updateData.competitors = input.competitors;
    }
    if (input.niche !== undefined) {
      updateData.niche = input.niche;
    }
    if (input.productServiceFocus !== undefined) {
      updateData.productServiceFocus = input.productServiceFocus;
    }
    if (input.clientId !== undefined && input.clientId !== null) {
      const client = await tx.client.findFirst({
        where: { id: input.clientId, tenantId, isArchived: false },
        select: { id: true, name: true }
      });
      if (!client) {
        return { project: null };
      }
      updateData.clientId = client.id;
      updateData.targetClientName = client.name;
    }
    if (input.targetMonth !== undefined) {
      updateData.targetMonth = input.targetMonth;
    }
    if (input.status !== undefined && input.status !== null) {
      updateData.status = input.status;
    }

    const project = await tx.marketIntelligenceProject.update({
      where: { id: projectId },
      data: updateData,
      select: marketIntelligenceProjectSelect
    });

    return {
      project: mapMarketIntelligenceProjectSummary(project)
    };
  });
}

export async function archiveMarketIntelligenceProject(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<MarketIntelligenceProjectResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.marketIntelligenceProject.findFirst({
      where: { id: projectId, tenantId },
      select: { id: true }
    });
    if (!existing) {
      return { project: null };
    }

    const project = await tx.marketIntelligenceProject.update({
      where: { id: projectId },
      data: { isArchived: true },
      select: marketIntelligenceProjectSelect
    });

    return {
      project: mapMarketIntelligenceProjectSummary(project)
    };
  });
}

export async function listMarketIntelligenceSources(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<MarketIntelligenceSourcesResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const sources = await tx.marketIntelligenceSource.findMany({
      where: {
        tenantId,
        projectId,
        isArchived: false
      },
      select: {
        id: true,
        projectId: true,
        title: true,
        sourceType: true,
        sourceUrl: true,
        sourceNotes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      sources: sources.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString()
      }))
    };
  });
}

// Helper: verify that a project exists, belongs to the active tenant, and is not archived.
// Returns true only when the caller may create or modify children of the project.
async function verifyMiProjectAccess(tx: PrismaTx, tenantId: string, projectId: string): Promise<boolean> {
  const project = await tx.marketIntelligenceProject.findFirst({
    where: { id: projectId, tenantId, isArchived: false },
    select: { id: true }
  });
  return !!project;
}

export async function createMarketIntelligenceSource(
  authSession: AuthResolvedSessionContext,
  input: MarketIntelligenceSourceInputRequest
): Promise<MarketIntelligenceSourceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    if (!await verifyMiProjectAccess(tx, tenantId, input.projectId ?? "")) {
      return null;
    }

    const source = await tx.marketIntelligenceSource.create({
      data: {
        tenantId,
        projectId: input.projectId ?? "",
        title: input.title ?? "New Source",
        sourceType: toNullableString(input.sourceType),
        sourceUrl: toNullableString(input.sourceUrl),
        sourceNotes: toNullableString(input.sourceNotes)
      },
      select: {
        id: true,
        projectId: true,
        title: true,
        sourceType: true,
        sourceUrl: true,
        sourceNotes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      source: {
        ...source,
        createdAt: source.createdAt.toISOString(),
        updatedAt: source.updatedAt.toISOString()
      }
    };
  });
}

export async function updateMarketIntelligenceSource(
  authSession: AuthResolvedSessionContext,
  sourceId: string,
  projectId: string,
  input: MarketIntelligenceSourceInputRequest
): Promise<MarketIntelligenceSourceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.marketIntelligenceSource.findFirst({
      where: { id: sourceId, tenantId, projectId },
      select: { id: true }
    });
    if (!existing) {
      return { source: null };
    }

    const updateData: any = {};
    if (input.title !== undefined && input.title !== null) {
      updateData.title = input.title;
    }
    if (input.sourceType !== undefined) {
      updateData.sourceType = input.sourceType;
    }
    if (input.sourceUrl !== undefined) {
      updateData.sourceUrl = input.sourceUrl;
    }
    if (input.sourceNotes !== undefined) {
      updateData.sourceNotes = input.sourceNotes;
    }

    const source = await tx.marketIntelligenceSource.update({
      where: { id: sourceId },
      data: updateData,
      select: {
        id: true,
        projectId: true,
        title: true,
        sourceType: true,
        sourceUrl: true,
        sourceNotes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      source: {
        ...source,
        createdAt: source.createdAt.toISOString(),
        updatedAt: source.updatedAt.toISOString()
      }
    };
  });
}

export async function archiveMarketIntelligenceSource(
  authSession: AuthResolvedSessionContext,
  sourceId: string,
  projectId: string
): Promise<MarketIntelligenceSourceResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.marketIntelligenceSource.findFirst({
      where: { id: sourceId, tenantId, projectId },
      select: { id: true }
    });
    if (!existing) {
      return { source: null };
    }

    const source = await tx.marketIntelligenceSource.update({
      where: { id: sourceId },
      data: { isArchived: true },
      select: {
        id: true,
        projectId: true,
        title: true,
        sourceType: true,
        sourceUrl: true,
        sourceNotes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      source: {
        ...source,
        createdAt: source.createdAt.toISOString(),
        updatedAt: source.updatedAt.toISOString()
      }
    };
  });
}

export async function listMarketIntelligenceResearchRuns(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<MarketIntelligenceResearchRunsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    // Get source count for evidence context
    const sourceCount = await tx.marketIntelligenceSource.count({
      where: {
        tenantId,
        projectId,
        isArchived: false
      }
    });

    const runs = await tx.marketIntelligenceResearchRun.findMany({
      where: {
        tenantId,
        projectId
      },
      select: {
        id: true,
        projectId: true,
        status: true,
        resultSummary: true,
        executionLog: true,
        executedAt: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    // For each executed run, try to find the generated insight by matching timestamps
    const runsWithInsightLinks = await Promise.all(
      runs.map(async (run) => {
        let generatedInsightId: string | null = null;
        if (run.status === "EXECUTED" && run.executedAt) {
          // Find insights created shortly after this run executed
          const insights = await tx.marketIntelligenceInsight.findMany({
            where: {
              tenantId,
              projectId,
              createdAt: {
                gte: new Date(run.executedAt.getTime() - 1000), // 1 second before
                lte: new Date(run.executedAt.getTime() + 60000) // 1 minute after
              }
            },
            orderBy: { createdAt: "asc" },
            take: 1
          });
          if (insights.length > 0) {
            generatedInsightId = insights[0].id;
          }
        }

        return {
          ...run,
          sourceCount, // Include source count for evidence context
          generatedInsightId,
          executedAt: run.executedAt?.toISOString() ?? null,
          createdAt: run.createdAt.toISOString(),
          updatedAt: run.updatedAt.toISOString()
        };
      })
    );

    return {
      researchRuns: runsWithInsightLinks
    };
  });
}

export async function createMarketIntelligenceResearchRun(
  authSession: AuthResolvedSessionContext,
  projectId: string,
  input: MarketIntelligenceResearchRunInputRequest
): Promise<MarketIntelligenceResearchRunResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    if (!await verifyMiProjectAccess(tx, tenantId, projectId)) {
      return null;
    }

    const run = await tx.marketIntelligenceResearchRun.create({
      data: {
        tenantId,
        projectId,
        status: input.status ?? "PENDING",
        resultSummary: toNullableString(input.resultSummary),
        executionLog: toNullableString(input.executionLog)
      },
      select: {
        id: true,
        projectId: true,
        status: true,
        resultSummary: true,
        executionLog: true,
        executedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      researchRun: {
        ...run,
        executedAt: run.executedAt?.toISOString() ?? null,
        createdAt: run.createdAt.toISOString(),
        updatedAt: run.updatedAt.toISOString()
      }
    };
  });
}

export async function executeMarketIntelligenceResearchRun(
  authSession: AuthResolvedSessionContext,
  runId: string,
  projectId: string
): Promise<MarketIntelligenceResearchRunResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const existingRun = await prisma.marketIntelligenceResearchRun.findUnique({
    where: { id: runId },
    select: { tenantId: true, projectId: true }
  });

  if (!existingRun || existingRun.tenantId !== tenantId || existingRun.projectId !== projectId) {
    return null;
  }

  const sources = await prisma.marketIntelligenceSource.findMany({
    where: { tenantId, projectId: existingRun.projectId, isArchived: false }
  });

  const project = await prisma.marketIntelligenceProject.findFirst({
    where: { id: existingRun.projectId, tenantId }
  });

  // Deterministic placeholder generation — no live crawling, no external provider calls.
  // Uses admin-provided research inputs (keywords, competitors, niche, productServiceFocus) to
  // build a structured result. Live research execution is intentionally deferred.
  const projectTitle = project?.title ?? "Project";
  const keywordList = project?.keywords
    ? project.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : ["general market trends"];
  const competitorList = project?.competitors
    ? project.competitors.split(",").map((c) => c.trim()).filter(Boolean)
    : sources.filter((s) => s.sourceType === "COMPETITOR" || s.sourceType === "BLOG").map((s) => s.title);
  const nicheContext = project?.niche ?? "general market";
  const productFocus = project?.productServiceFocus ?? "the product/service";
  const clientContext = project?.targetClientName ? ` for ${project.targetClientName}` : "";

  const mockResultData = {
    summary: `Admin-reviewed market analysis${clientContext} for ${projectTitle}. Based on ${sources.length} curated source(s) covering ${nicheContext}.`,
    competitors: competitorList.length > 0
      ? competitorList.map((c, i) => `${c} (Competitor ${i + 1})`)
      : [`No named competitors provided — add competitor sources for richer output`],
    audienceSignals: [
      `Target niche: ${nicheContext}`,
      `Primary product/service focus: ${productFocus}`,
      `Audience likely researching: ${keywordList.slice(0, 3).join(", ")}`,
    ],
    marketTrends: [
      `Keyword signals: ${keywordList.join(", ")}`,
      "Shift to AI-assisted admin workflows",
      "Demand for bounded, deterministic research tooling"
    ],
    opportunities: [
      `Differentiate ${productFocus} in ${nicheContext}`,
      "Expand content coverage for priority keywords",
      "Leverage admin-reviewed insights for strategic planning"
    ],
    threats: [
      "Competitor positioning not fully mapped — add competitor sources",
      "Data freshness risk — sources should be reviewed regularly"
    ],
    pricingSignals: ["Pricing data not available without live provider — manual review recommended"],
    contentOrSeoAngles: keywordList.map((kw) => `Content angle: ${kw}`),
    recommendedNextActions: [
      "Review and approve this insight record",
      "Add or update competitor sources for richer analysis",
      "Link approved insights to AI Delivery or monthly report handoff"
    ],
    sourceNotes: `Analyzed ${sources.length} active source(s). Deterministic placeholder — live research deferred.`,
    confidenceNotes: "Admin-reviewed deterministic mock. Confidence reflects curated source quality, not live data."
  };

  const executionLog = `[INFO] Started research run ${runId}
[INFO] Project: ${projectTitle}${clientContext}
[INFO] Found ${sources.length} active sources.
[INFO] Keywords: ${keywordList.join(", ")}
[INFO] Niche: ${nicheContext}
[INFO] Generating deterministic insight placeholder (no live provider).
[INFO] Finished generation successfully.`;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const run = await tx.marketIntelligenceResearchRun.update({
      where: { id: runId },
      data: {
        status: "EXECUTED",
        executedAt: new Date(),
        resultSummary: mockResultData.summary,
        executionLog: executionLog
      },
      select: {
        id: true,
        projectId: true,
        status: true,
        resultSummary: true,
        executionLog: true,
        executedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // create insight linked to this run's results
    await tx.marketIntelligenceInsight.create({
      data: {
        tenantId,
        projectId: existingRun.projectId,
        title: `Generated Insight ${new Date().toISOString().substring(0, 10)}`,
        summary: mockResultData.summary,
        resultData: mockResultData as any,
        status: "DRAFT"
      }
    });

    return {
      researchRun: {
        ...run,
        executedAt: run.executedAt?.toISOString() ?? null,
        createdAt: run.createdAt.toISOString(),
        updatedAt: run.updatedAt.toISOString()
      }
    };
  });
}

export async function listMarketIntelligenceInsights(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<MarketIntelligenceInsightsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    // Get source count for evidence context
    const sourceCount = await tx.marketIntelligenceSource.count({
      where: {
        tenantId,
        projectId,
        isArchived: false
      }
    });

    const insights = await tx.marketIntelligenceInsight.findMany({
      where: {
        tenantId,
        projectId,
        isArchived: false
      },
      select: {
        id: true,
        projectId: true,
        title: true,
        summary: true,
        resultData: true,
        status: true,
        reviewerNotes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      insights: insights.map((i) => ({
        ...i,
        resultData: i.resultData as any,
        sourceCount, // Include source count for evidence context
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString()
      }))
    };
  });
}

export async function createMarketIntelligenceInsight(
  authSession: AuthResolvedSessionContext,
  input: MarketIntelligenceInsightInputRequest
): Promise<MarketIntelligenceInsightResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    if (!await verifyMiProjectAccess(tx, tenantId, input.projectId ?? "")) {
      return null;
    }

    const insight = await tx.marketIntelligenceInsight.create({
      data: {
        tenantId,
        projectId: input.projectId ?? "",
        title: input.title ?? "New Insight",
        summary: toNullableString(input.summary),
        resultData: input.resultData !== undefined ? (input.resultData as any) : null,
        status: input.status ?? "DRAFT",
        reviewerNotes: toNullableString(input.reviewerNotes)
      },
      select: {
        id: true,
        projectId: true,
        title: true,
        summary: true,
        resultData: true,
        status: true,
        reviewerNotes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      insight: {
        ...insight,
        createdAt: insight.createdAt.toISOString(),
        updatedAt: insight.updatedAt.toISOString()
      }
    };
  });
}

export async function updateMarketIntelligenceInsight(
  authSession: AuthResolvedSessionContext,
  insightId: string,
  projectId: string,
  input: MarketIntelligenceInsightInputRequest
): Promise<MarketIntelligenceInsightResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.marketIntelligenceInsight.findFirst({
      where: { id: insightId, tenantId, projectId },
      select: { id: true }
    });
    if (!existing) {
      return { insight: null };
    }

    const updateData: any = {};
    if (input.title !== undefined && input.title !== null) {
      updateData.title = input.title;
    }
    if (input.summary !== undefined) {
      updateData.summary = input.summary;
    }
    if (input.resultData !== undefined) {
      updateData.resultData = input.resultData;
    }
    if (input.status !== undefined && input.status !== null) {
      updateData.status = input.status;
    }
    if (input.reviewerNotes !== undefined) {
      updateData.reviewerNotes = input.reviewerNotes;
    }

    const insight = await tx.marketIntelligenceInsight.update({
      where: { id: insightId },
      data: updateData,
      select: {
        id: true,
        projectId: true,
        title: true,
        summary: true,
        resultData: true,
        status: true,
        reviewerNotes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      insight: {
        ...insight,
        resultData: insight.resultData as any,
        createdAt: insight.createdAt.toISOString(),
        updatedAt: insight.updatedAt.toISOString()
      }
    };
  });
}

export async function archiveMarketIntelligenceInsight(
  authSession: AuthResolvedSessionContext,
  insightId: string,
  projectId: string
): Promise<MarketIntelligenceInsightResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.marketIntelligenceInsight.findFirst({
      where: { id: insightId, tenantId, projectId },
      select: { id: true }
    });
    if (!existing) {
      return { insight: null };
    }

    const insight = await tx.marketIntelligenceInsight.update({
      where: { id: insightId },
      data: { isArchived: true },
      select: {
        id: true,
        projectId: true,
        title: true,
        summary: true,
        resultData: true,
        status: true,
        reviewerNotes: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      insight: {
        ...insight,
        resultData: insight.resultData as any,
        createdAt: insight.createdAt.toISOString(),
        updatedAt: insight.updatedAt.toISOString()
      }
    };
  });
}

// ── Market Intelligence Handoff ───────────────────────────────────────────────
// Internal admin-only bridge from approved MI insight → delivery planning.
// Not exposed to Client Portal. No file export, no public links.

function toHandoffSummary(h: {
  id: string;
  projectId: string;
  insightId: string;
  title: string;
  marketSummary: string | null;
  competitorSummary: string | null;
  audienceSignals: unknown;
  opportunities: unknown;
  risks: unknown;
  recommendedActions: unknown;
  sourceNote: string | null;
  targetClientName: string | null;
  targetMonth: string | null;
  handoffStatus: string;
  isArchived: boolean;
  aiDeliveryProjectId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MarketIntelligenceHandoffSummary {
  return {
    id: h.id,
    projectId: h.projectId,
    insightId: h.insightId,
    title: h.title,
    marketSummary: h.marketSummary,
    competitorSummary: h.competitorSummary,
    audienceSignals: Array.isArray(h.audienceSignals) ? (h.audienceSignals as string[]) : null,
    opportunities: Array.isArray(h.opportunities) ? (h.opportunities as string[]) : null,
    risks: Array.isArray(h.risks) ? (h.risks as string[]) : null,
    recommendedActions: Array.isArray(h.recommendedActions) ? (h.recommendedActions as string[]) : null,
    sourceNote: h.sourceNote,
    targetClientName: h.targetClientName,
    targetMonth: h.targetMonth,
    handoffStatus: h.handoffStatus,
    isArchived: h.isArchived,
    aiDeliveryProjectId: h.aiDeliveryProjectId,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString()
  };
}

const HANDOFF_SELECT = {
  id: true,
  projectId: true,
  insightId: true,
  title: true,
  marketSummary: true,
  competitorSummary: true,
  audienceSignals: true,
  opportunities: true,
  risks: true,
  recommendedActions: true,
  sourceNote: true,
  targetClientName: true,
  targetMonth: true,
  handoffStatus: true,
  isArchived: true,
  aiDeliveryProjectId: true,
  createdAt: true,
  updatedAt: true
} as const;

export async function prepareMarketIntelligenceHandoff(
  authSession: AuthResolvedSessionContext,
  projectId: string,
  insightId: string
): Promise<MarketIntelligenceHandoffResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    // Verify project belongs to tenant
    if (!await verifyMiProjectAccess(tx, tenantId, projectId)) {
      return null;
    }

    // Fetch insight — must be APPROVED and belong to this project/tenant
    const insight = await tx.marketIntelligenceInsight.findFirst({
      where: { id: insightId, tenantId, projectId, isArchived: false },
      select: {
        id: true,
        title: true,
        summary: true,
        resultData: true,
        status: true
      }
    });
    if (!insight || insight.status !== "APPROVED") {
      return { handoff: null };
    }

    // Fetch project for context fields
    const project = await tx.marketIntelligenceProject.findFirst({
      where: { id: projectId, tenantId },
      select: {
        clientId: true,
        targetClientName: true,
        targetMonth: true,
        client: {
          select: {
            name: true
          }
        }
      }
    });

    // Extract structured fields from resultData (MARKET_INTELLIGENCE_RESULT_V1 shape)
    const result = (insight.resultData ?? {}) as Record<string, unknown>;
    const competitorList: string[] = Array.isArray(result.competitors) ? result.competitors as string[] : [];
    const competitorSummary = competitorList.length > 0
      ? competitorList.slice(0, 5).join("; ")
      : null;

    // Deterministically build handoff content — no external calls
    const handoff = await tx.marketIntelligenceHandoff.create({
      data: {
        tenantId,
        projectId,
        insightId,
        title: `Handoff: ${insight.title}`,
        marketSummary: typeof result.summary === "string" ? result.summary : (insight.summary ?? null),
        competitorSummary,
        audienceSignals: Array.isArray(result.audienceSignals) ? result.audienceSignals as any : null,
        opportunities: Array.isArray(result.opportunities) ? result.opportunities as any : null,
        risks: Array.isArray(result.threats) ? result.threats as any : null,
        recommendedActions: Array.isArray(result.recommendedNextActions) ? result.recommendedNextActions as any : null,
        sourceNote: typeof result.sourceNotes === "string" ? result.sourceNotes : null,
        clientId: project?.clientId ?? null,
        targetClientName: project?.client?.name ?? project?.targetClientName ?? null,
        targetMonth: project?.targetMonth ?? null,
        handoffStatus: "DRAFT"
      },
      select: HANDOFF_SELECT
    });

    return { handoff: toHandoffSummary(handoff) };
  });
}

export async function listMarketIntelligenceHandoffs(
  authSession: AuthResolvedSessionContext,
  projectId: string
): Promise<MarketIntelligenceHandoffsResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    if (!await verifyMiProjectAccess(tx, tenantId, projectId)) {
      return null;
    }

    const handoffs = await tx.marketIntelligenceHandoff.findMany({
      where: { tenantId, projectId, isArchived: false },
      select: HANDOFF_SELECT,
      orderBy: { createdAt: "desc" }
    });

    return { handoffs: handoffs.map(toHandoffSummary) };
  });
}

export async function updateMarketIntelligenceHandoffStatus(
  authSession: AuthResolvedSessionContext,
  projectId: string,
  handoffId: string,
  input: MarketIntelligenceHandoffStatusRequest
): Promise<MarketIntelligenceHandoffResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  const VALID_STATUSES = ["DRAFT", "READY", "APPLIED", "ARCHIVED"];
  const newStatus = input.handoffStatus?.trim() ?? "";
  if (!VALID_STATUSES.includes(newStatus)) {
    return { handoff: null };
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.marketIntelligenceHandoff.findFirst({
      where: { id: handoffId, tenantId, projectId },
      select: { id: true, handoffStatus: true }
    });
    if (!existing) {
      return { handoff: null };
    }

    const currentStatus = existing.handoffStatus;
    if (currentStatus === newStatus) {
      const handoff = await tx.marketIntelligenceHandoff.findFirst({
        where: { id: handoffId },
        select: HANDOFF_SELECT
      });
      return handoff ? { handoff: toHandoffSummary(handoff) } : { handoff: null };
    }

    if (currentStatus === "ARCHIVED") {
      throw new Error("MARKET_INTELLIGENCE_HANDOFF_STATUS_GATE_BLOCKED");
    }

    if (newStatus === "ARCHIVED") {
      const handoff = await tx.marketIntelligenceHandoff.update({
        where: { id: handoffId },
        data: { handoffStatus: "ARCHIVED" },
        select: HANDOFF_SELECT
      });
      return { handoff: toHandoffSummary(handoff) };
    }

    if (currentStatus === "APPLIED" && newStatus === "READY") {
      const handoff = await tx.marketIntelligenceHandoff.update({
        where: { id: handoffId },
        data: { handoffStatus: "READY", aiDeliveryProjectId: null },
        select: HANDOFF_SELECT
      });
      return { handoff: toHandoffSummary(handoff) };
    }

    const allowedForward: Record<string, string> = {
      DRAFT: "READY",
      READY: "APPLIED"
    };
    if (allowedForward[currentStatus] !== newStatus) {
      throw new Error("MARKET_INTELLIGENCE_HANDOFF_STATUS_GATE_BLOCKED");
    }

    const handoff = await tx.marketIntelligenceHandoff.update({
      where: { id: handoffId },
      data: { handoffStatus: newStatus },
      select: HANDOFF_SELECT
    });

    return { handoff: toHandoffSummary(handoff) };
  });
}

export async function archiveMarketIntelligenceHandoff(
  authSession: AuthResolvedSessionContext,
  projectId: string,
  handoffId: string
): Promise<MarketIntelligenceHandoffResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) {
    return null;
  }

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await tx.marketIntelligenceHandoff.findFirst({
      where: { id: handoffId, tenantId, projectId },
      select: { id: true }
    });
    if (!existing) {
      return { handoff: null };
    }

    const handoff = await tx.marketIntelligenceHandoff.update({
      where: { id: handoffId },
      data: { isArchived: true },
      select: HANDOFF_SELECT
    });

    return { handoff: toHandoffSummary(handoff) };
  });
}

// ─── AI Delivery — Market Intelligence Context ────────────────────────────────

/** List handoffs currently linked to an AI Delivery project (admin-only, tenant-safe). */
export async function listAiDeliveryMiContext(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string
): Promise<AiDeliveryMiContextResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await tx.aiDeliveryProject.findFirst({
      where: { id: aiDeliveryProjectId, tenantId },
      select: { id: true }
    });
    if (!project) return null;

    const handoffs = await tx.marketIntelligenceHandoff.findMany({
      where: { tenantId, aiDeliveryProjectId, isArchived: false },
      select: HANDOFF_SELECT,
      orderBy: { updatedAt: "desc" }
    });
    return { handoffs: handoffs.map(toHandoffSummary) };
  });
}

/** Apply a READY or APPLIED MI handoff to an AI Delivery project (admin-only, tenant-safe). */
export async function applyMiHandoffToAiDelivery(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  handoffId: string
): Promise<AiDeliveryMiContextResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await tx.aiDeliveryProject.findFirst({
      where: { id: aiDeliveryProjectId, tenantId },
      select: { id: true, clientId: true }
    });
    if (!project) return null;

    const handoff = await tx.marketIntelligenceHandoff.findFirst({
      where: { id: handoffId, tenantId, isArchived: false },
      select: { id: true, handoffStatus: true, aiDeliveryProjectId: true, clientId: true, project: { select: { clientId: true } } }
    });
    if (!handoff) return null;

    const handoffClientId = handoff.clientId ?? handoff.project.clientId;
    if (handoffClientId && handoffClientId !== project.clientId) {
      return null;
    }

    // Only READY or APPLIED handoffs can be linked; DRAFT/ARCHIVED cannot.
    if (handoff.handoffStatus !== "READY" && handoff.handoffStatus !== "APPLIED") {
      return null;
    }

    await tx.marketIntelligenceHandoff.update({
      where: { id: handoffId },
      data: { aiDeliveryProjectId, handoffStatus: "APPLIED" }
    });

    const handoffs = await tx.marketIntelligenceHandoff.findMany({
      where: { tenantId, aiDeliveryProjectId, isArchived: false },
      select: HANDOFF_SELECT,
      orderBy: { updatedAt: "desc" }
    });
    return { handoffs: handoffs.map(toHandoffSummary) };
  });
}

/** Remove a MI handoff linkage from an AI Delivery project (clears aiDeliveryProjectId, reverts to READY). */
export async function removeMiHandoffFromAiDelivery(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  handoffId: string
): Promise<AiDeliveryMiContextResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await tx.aiDeliveryProject.findFirst({
      where: { id: aiDeliveryProjectId, tenantId },
      select: { id: true }
    });
    if (!project) return null;

    const handoff = await tx.marketIntelligenceHandoff.findFirst({
      where: { id: handoffId, tenantId, aiDeliveryProjectId },
      select: { id: true }
    });
    if (!handoff) return null;

    await tx.marketIntelligenceHandoff.update({
      where: { id: handoffId },
      data: { aiDeliveryProjectId: null, handoffStatus: "READY" }
    });

    const handoffs = await tx.marketIntelligenceHandoff.findMany({
      where: { tenantId, aiDeliveryProjectId, isArchived: false },
      select: HANDOFF_SELECT,
      orderBy: { updatedAt: "desc" }
    });

    return { handoffs: handoffs.map(toHandoffSummary) };
  });
}

// ─── Monthly Report — Market Intelligence Context ─────────────────────────────

const MI_CONTEXT_HANDOFF_SELECT = {
  id: true,
  title: true,
  handoffStatus: true,
  isArchived: true,
  aiDeliveryProjectId: true,
  marketSummary: true,
  audienceSignals: true,
  opportunities: true,
  risks: true,
  recommendedActions: true,
  sourceNote: true
} as const;

/** Build deterministic MI context draft from handoff fields (no external calls). */
function buildMiContextDraft(handoff: {
  title: string;
  marketSummary: string | null;
  audienceSignals: unknown;
  opportunities: unknown;
  risks: unknown;
  recommendedActions: unknown;
  sourceNote: string | null;
}): string {
  const lines: string[] = [`# Market Intelligence report context: ${handoff.title}`];
  if (handoff.marketSummary) {
    lines.push(`\n## Market Summary\n${handoff.marketSummary}`);
  }
  const fmtList = (label: string, value: unknown) => {
    if (!value) return;
    const items = Array.isArray(value) ? value : (typeof value === "object" ? Object.values(value as object) : []);
    if (items.length > 0) {
      lines.push(`\n## ${label}\n${items.map((i: unknown) => `- ${String(i)}`).join("\n")}`);
    }
  };
  fmtList("Audience Signals", handoff.audienceSignals);
  fmtList("Opportunities", handoff.opportunities);
  fmtList("Risks", handoff.risks);
  fmtList("Recommended Actions", handoff.recommendedActions);
  if (handoff.sourceNote) {
    lines.push(`\n## Source Note\n${handoff.sourceNote}`);
  }
  return lines.join("");
}

/** Get MI context currently attached to a monthly report (admin-only). */
export async function getAiDeliveryMonthlyReportMiContext(
  authSession: AuthResolvedSessionContext,
  reportId: string
): Promise<AiDeliveryMonthlyReportMiContextResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  const report = await (prisma as any).aiDeliveryMonthlyReport.findFirst({
    where: { id: reportId, tenantId },
    select: {
      id: true,
      miHandoffId: true,
      miContextDraft: true,
      miHandoff: { select: MI_CONTEXT_HANDOFF_SELECT }
    }
  });
  if (!report) return null;

  return {
    miHandoffId: report.miHandoffId ?? null,
    miContextDraft: report.miContextDraft ?? null,
    handoff: report.miHandoff
      ? {
          id: report.miHandoff.id,
          title: report.miHandoff.title,
          handoffStatus: report.miHandoff.handoffStatus,
          marketSummary: report.miHandoff.marketSummary ?? null,
          audienceSignals: report.miHandoff.audienceSignals ?? null,
          opportunities: report.miHandoff.opportunities ?? null,
          risks: report.miHandoff.risks ?? null,
          recommendedActions: report.miHandoff.recommendedActions ?? null,
          sourceNote: report.miHandoff.sourceNote ?? null
        }
      : null
  };
}

/** Apply a READY/APPLIED MI handoff to a monthly report as internal context (admin-only). */
export async function applyMiHandoffToMonthlyReport(
  authSession: AuthResolvedSessionContext,
  reportId: string,
  body: AiDeliveryMonthlyReportMiApplyRequest
): Promise<AiDeliveryMonthlyReportMiContextResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const report = await (tx as any).aiDeliveryMonthlyReport.findFirst({
      where: { id: reportId, tenantId },
      select: { id: true, aiDeliveryProjectId: true }
    });
    if (!report) return null;

    const handoff = await tx.marketIntelligenceHandoff.findFirst({
      where: { id: body.handoffId, tenantId, aiDeliveryProjectId: report.aiDeliveryProjectId, isArchived: false },
      select: MI_CONTEXT_HANDOFF_SELECT
    });
    if (!handoff) return null;

    // Only READY or APPLIED handoffs may be referenced
    if (handoff.handoffStatus !== "READY" && handoff.handoffStatus !== "APPLIED") {
      return null;
    }

    const draft = buildMiContextDraft(handoff);

    await (tx as any).aiDeliveryMonthlyReport.update({
      where: { id: reportId },
      data: { miHandoffId: body.handoffId, miContextDraft: draft }
    });

    return {
      miHandoffId: body.handoffId,
      miContextDraft: draft,
      handoff: {
        id: handoff.id,
        title: handoff.title,
        handoffStatus: handoff.handoffStatus,
        marketSummary: handoff.marketSummary ?? null,
        audienceSignals: handoff.audienceSignals ?? null,
        opportunities: handoff.opportunities ?? null,
        risks: handoff.risks ?? null,
        recommendedActions: handoff.recommendedActions ?? null,
        sourceNote: handoff.sourceNote ?? null
      }
    };
  });
}

/** Update (admin-edit) the MI context draft text on a monthly report (admin-only). */
export async function updateMonthlyReportMiContextDraft(
  authSession: AuthResolvedSessionContext,
  reportId: string,
  body: AiDeliveryMonthlyReportMiDraftRequest
): Promise<AiDeliveryMonthlyReportMiContextResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const report = await (tx as any).aiDeliveryMonthlyReport.findFirst({
      where: { id: reportId, tenantId },
      select: { id: true, miHandoffId: true }
    });
    if (!report) return null;

    await (tx as any).aiDeliveryMonthlyReport.update({
      where: { id: reportId },
      data: { miContextDraft: body.miContextDraft }
    });

    let handoffData = null;
    if (report.miHandoffId) {
      const h = await tx.marketIntelligenceHandoff.findFirst({
        where: { id: report.miHandoffId, tenantId },
        select: MI_CONTEXT_HANDOFF_SELECT
      });
      if (h) {
        handoffData = {
          id: h.id,
          title: h.title,
          handoffStatus: h.handoffStatus,
          marketSummary: h.marketSummary ?? null,
          audienceSignals: h.audienceSignals ?? null,
          opportunities: h.opportunities ?? null,
          risks: h.risks ?? null,
          recommendedActions: h.recommendedActions ?? null,
          sourceNote: h.sourceNote ?? null
        };
      }
    }

    return {
      miHandoffId: report.miHandoffId ?? null,
      miContextDraft: body.miContextDraft,
      handoff: handoffData
    };
  });
}

/** Remove MI handoff reference from a monthly report (clears both miHandoffId and miContextDraft). */
export async function removeMiHandoffFromMonthlyReport(
  authSession: AuthResolvedSessionContext,
  reportId: string
): Promise<AiDeliveryMonthlyReportMiContextResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const report = await (tx as any).aiDeliveryMonthlyReport.findFirst({
      where: { id: reportId, tenantId },
      select: { id: true }
    });
    if (!report) return null;

    await (tx as any).aiDeliveryMonthlyReport.update({
      where: { id: reportId },
      data: { miHandoffId: null, miContextDraft: null }
    });

    return { miHandoffId: null, miContextDraft: null, handoff: null };
  });
}