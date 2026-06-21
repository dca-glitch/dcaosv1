import type { Prisma } from "@prisma/client";
import { createPrismaClient } from "../../../../packages/data/src/client";
import type {
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
  AiDeliveryResearchSourceInputRequest,
  AiDeliveryResearchSourceResponse,
  AiDeliveryResearchSourcesResponse,
  AiDeliveryWorkflowRunInputRequest,
  AiDeliveryWorkflowRunResponse,
  AiDeliveryWorkflowRunsResponse,
  AiDeliveryDeliverableInputRequest,
  AiDeliveryDeliverableResponse,
  AiDeliveryDeliverablesResponse,
  AiDeliveryDeliverableReviewInputRequest,
  AiDeliveryDeliverableReviewResponse,
  AiDeliveryDeliverableReviewsResponse,
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
  VendorsResponse
} from "./core.types";
import type { AuthResolvedSessionContext } from "../auth/types";
import {
  getPrivateStorageDownloadReference,
  putPrivateStorageObject
} from "../storage/private-storage.service";
import { recordAiDeliverySystemEvent } from "../services/system-events.service";

const prisma = createPrismaClient();

type PrismaTx = Prisma.TransactionClient;
type TaskPriority = "LOW" | "NORMAL" | "HIGH";
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskRecurringType = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "VOIDED" | "UNCOLLECTIBLE";
type AiDeliveryWorkflowRunStatus = "DRAFT" | "READY" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "FAILED" | "ARCHIVED";
type AiDeliveryResearchRequestStatus = "DRAFT" | "READY" | "IN_REVIEW" | "COMPLETED" | "ARCHIVED";
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
const AI_DELIVERY_RESEARCH_SOURCE_STATUSES: AiDeliveryResearchSourceStatus[] = ["PROPOSED", "APPROVED", "REJECTED", "ARCHIVED"];
const AI_DELIVERY_RESEARCH_SOURCE_TYPES: AiDeliveryResearchSourceType[] = ["WEBSITE", "DOCUMENT", "OTHER"];
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
  billingDetails: string | null;
  contactPerson: string | null;
  taxId: string | null;
  country: string | null;
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
    contactPerson: client.contactPerson,
    billingAddress: client.billingDetails,
    taxId: client.taxId,
    country: client.country,
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
      billingDetails: true,
      contactPerson: true,
      taxId: true,
      country: true,
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
      billingDetails: true,
      contactPerson: true,
      taxId: true,
      country: true,
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
    const created = await tx.client.create({
      data: {
        tenantId,
        name: input.name ?? "",
        email: toNullableString(input.email),
        contactPerson: toNullableString(input.contactPerson),
        billingDetails: toNullableString(input.billingAddress),
        taxId: toNullableString(input.taxId),
        country: toNullableString(input.country)
      },
      select: {
        id: true,
        name: true,
        email: true,
        billingDetails: true,
        contactPerson: true,
        taxId: true,
        country: true,
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
        email: toNullableString(input.email),
        contactPerson: toNullableString(input.contactPerson),
        billingDetails: toNullableString(input.billingAddress),
        taxId: toNullableString(input.taxId),
        country: toNullableString(input.country)
      },
      select: {
        id: true,
        name: true,
        email: true,
        billingDetails: true,
        contactPerson: true,
        taxId: true,
        country: true,
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
        billingDetails: true,
        contactPerson: true,
        taxId: true,
        country: true,
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
        billingDetails: true,
        contactPerson: true,
        taxId: true,
        country: true,
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
  clientId: string
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

  const users = await prisma.clientUserAccess.findMany({
    where: { tenantId, clientId, isArchived: false },
    orderBy: { createdAt: "asc" },
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
      return null;
    }

    const project = await getAiDeliveryTenantProject(tx, tenantId, client.id, input.projectId);
    if (input.projectId && !project) {
      return null;
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
    select: { id: true }
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
    if (input.contentPlanItemId && !contentPlanItem) return null;
    const created = await getAiDeliveryContentDraftDelegate(tx).create({
      data: {
        tenantId,
        aiDeliveryProjectId,
        contentPlanItemId: contentPlanItem?.id ?? null,
        title: input.title,
        slug: toNullableString(input.slug),
        draftBody: input.draftBody,
        status: normalizeAiDeliveryContentDraftStatus(input.status),
        notes: toNullableString(input.notes)
      },
      select: aiDeliveryContentDraftSelect
    }) as any;
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
    if (input.contentPlanItemId && !contentPlanItem) return null;
    const updated = await getAiDeliveryContentDraftDelegate(tx).update({
      where: { id: contentDraftId },
      data: {
        contentPlanItemId: contentPlanItem?.id ?? null,
        title: input.title,
        slug: toNullableString(input.slug),
        draftBody: input.draftBody,
        status: normalizeAiDeliveryContentDraftStatus(input.status),
        notes: toNullableString(input.notes),
        isArchived: normalizeAiDeliveryContentDraftStatus(input.status) === "ARCHIVED" ? true : existing.isArchived
      },
      select: aiDeliveryContentDraftSelect
    }) as any;
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
      where: { id: contentDraftId, tenantId, aiDeliveryProjectId, isArchived: false },
      select: { id: true }
    }) as any;
    if (!existing) return null;
    const updated = await getAiDeliveryContentDraftDelegate(tx).update({
      where: { id: contentDraftId },
      data: { status: "READY_FOR_REVIEW", reviewRequestedAt: new Date(), approvedAt: null },
      select: aiDeliveryContentDraftSelect
    }) as any;
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
  const drafts = await getClientAccessibleContentDrafts(authSession, aiDeliveryProjectId);
  const draft = drafts?.find((item) => item.id === contentDraftId);
  if (!draft) return null;

  const updated = await getAiDeliveryContentDraftDelegate(prisma).update({
    where: { id: contentDraftId },
    data: { status: "APPROVED", approvedAt: new Date() },
    select: aiDeliveryContentDraftSelect
  }) as any;

  return { contentDraft: toAiDeliveryContentDraftSummary(updated) };
}

export async function requestClientAiDeliveryContentDraftRevision(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  contentDraftId: string,
  comment: string
): Promise<AiDeliveryContentDraftResponse | null> {
  const drafts = await getClientAccessibleContentDrafts(authSession, aiDeliveryProjectId);
  const draft = drafts?.find((item) => item.id === contentDraftId);
  if (!draft || !comment.trim()) return null;

  const updated = await getAiDeliveryContentDraftDelegate(prisma).update({
    where: { id: contentDraftId },
    data: { status: "CHANGES_REQUESTED", revisionCount: { increment: 1 }, clientComment: comment.trim() },
    select: aiDeliveryContentDraftSelect
  }) as any;

  return { contentDraft: toAiDeliveryContentDraftSummary(updated) };
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
    if (!contentDraft) return null;
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
    if (!contentDraft) return null;
    const status = normalizeAiDeliveryArticleImageStatus(input.status);
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
    return { articleImage: toAiDeliveryArticleImageSummary(updated) };
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
            approvalStatus: it.approvalStatus ? (it.approvalStatus as any) : null,
            clientComment: it.clientComment ?? null,
            tenant: { connect: { id: tenantId } }
          }))
        } : undefined
      },
      select: aiDeliveryContentPlanSelect
    });

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

    const updated = await tx.aiDeliveryContentPlan.update({
      where: { id: existing.id },
      data: {
        status: typeof input.status === "string" ? (input.status as any) : existing.status,
        revisionCount: typeof input.revisionCount === "number" ? input.revisionCount : existing.revisionCount
      },
      select: { id: true }
    });

    // replace items deterministically
    await tx.aiDeliveryContentPlanItem.deleteMany({ where: { contentPlanId: updated.id, tenantId } });

    if (Array.isArray(input.items) && input.items.length > 0) {
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
            approvalStatus: it.approvalStatus ? (it.approvalStatus as any) : null,
            clientComment: it.clientComment ?? null
          }
        });
      }
    }

    const found = await tx.aiDeliveryContentPlan.findFirst({ where: { id: updated.id }, select: aiDeliveryContentPlanSelect });
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
      return null;
    }

    const project = await getAiDeliveryTenantProject(tx, tenantId, client.id, input.projectId);
    if (input.projectId && !project) {
      return null;
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

function shouldSimulateAiDeliveryWorkflowFailure(adminNotes: string | null | undefined): boolean {
  return (adminNotes ?? "").toLowerCase().includes("[stub-fail]");
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

export async function executeAiDeliveryWorkflowRun(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  workflowRunId: string
): Promise<AiDeliveryWorkflowRunResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await tx.aiDeliveryProject.findFirst({
      where: { id: aiDeliveryProjectId, tenantId, isArchived: false },
      select: {
        id: true,
        name: true,
        targetMonth: true,
        brief: { select: { id: true, status: true } }
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

    const startedAt = new Date();
    const startedLog = appendAiDeliveryWorkflowExecutionLog(existing.executionLog, [
      `[${startedAt.toISOString()}] Stub execution started.`,
      `[${startedAt.toISOString()}] Project "${project.name}" for ${project.targetMonth}; brief status ${project.brief.status}.`,
      `[${startedAt.toISOString()}] Local deterministic execution only. No external AI services were called.`
    ]);

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

    const finishedAt = new Date();
    const shouldFail = shouldSimulateAiDeliveryWorkflowFailure(existing.adminNotes);

    if (shouldFail) {
      const executionError = "Stub execution failed because admin notes include [stub-fail].";
      const failedLog = appendAiDeliveryWorkflowExecutionLog(startedLog, [
        `[${finishedAt.toISOString()}] Stub execution failed: ${executionError}`
      ]);

      const failed = await getAiDeliveryWorkflowRunDelegate(tx).update({
        where: { id: workflowRunId },
        data: {
          status: "FAILED",
          finishedAt,
          executionError,
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

    const resultPlaceholder = toNullableString(existing.resultPlaceholder)
      ?? `Stub workflow output prepared for admin review for ${project.name} (${project.targetMonth}). No external AI services were called.`;
    const completedLog = appendAiDeliveryWorkflowExecutionLog(startedLog, [
      `[${finishedAt.toISOString()}] Stub execution completed successfully.`,
      `[${finishedAt.toISOString()}] Result placeholder prepared and moved to admin review.`
    ]);

    const reviewed = await getAiDeliveryWorkflowRunDelegate(tx).update({
      where: { id: workflowRunId },
      data: {
        status: "REVIEW",
        finishedAt,
        executionError: null,
        executionLog: completedLog,
        resultPlaceholder
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
      if (!workflowRun) return null;
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
        if (!workflowRun) return null;
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
    if (!request) return null;
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
      if (!request) return null;
    }

    const workflowRunId = toNullableString(input.workflowRunId);
    if (workflowRunId) {
      const workflowRun = await getAiDeliveryProjectWorkflowRun(tx, tenantId, aiDeliveryProjectId, workflowRunId);
      if (!workflowRun) return null;
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
        if (!request) return null;
      }
    }

    let workflowRunId: string | null | undefined;
    if (input.workflowRunId !== undefined) {
      workflowRunId = toNullableString(input.workflowRunId);
      if (workflowRunId) {
        const workflowRun = await getAiDeliveryProjectWorkflowRun(tx, tenantId, aiDeliveryProjectId, workflowRunId);
        if (!workflowRun) return null;
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
      id: true
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
  deliveryType: true,
  status: true,
  exportUrl: true,
  storageKey: true,
  notes: true,
  isArchived: true,
  createdAt: true,
  updatedAt: true,
  contentDraft: {
    select: { id: true, title: true }
  },
  articleImage: {
    select: { id: true, title: true }
  }
} as const;

function normalizeAiDeliveryDeliverableDeliveryType(value: string | null | undefined): AiDeliveryDeliverableDeliveryType {
  const v = value ? value.trim().toUpperCase() : null;
  return v && ["CONTENT_PACKAGE", "ARTICLE_DRAFT", "ARTICLE_IMAGE", "CLIENT_HANDOFF", "OTHER"].includes(v) ? (v as AiDeliveryDeliverableDeliveryType) : "CONTENT_PACKAGE";
}

function normalizeAiDeliveryDeliverableStatus(value: string | null | undefined): AiDeliveryDeliverableStatus {
  const v = value ? value.trim().toUpperCase() : null;
  return v && ["DRAFT", "READY", "DELIVERED", "REVISION_REQUESTED", "ACCEPTED", "ARCHIVED"].includes(v) ? (v as AiDeliveryDeliverableStatus) : "DRAFT";
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
    deliveryType: d.deliveryType,
    status: d.status,
    exportUrl: d.exportUrl ?? null,
    storageKey: d.storageKey ?? null,
    notes: d.notes ?? null,
    isArchived: d.isArchived,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    contentDraft: d.contentDraft ? { id: d.contentDraft.id, title: d.contentDraft.title } : null,
    articleImage: d.articleImage ? { id: d.articleImage.id, title: d.articleImage.title } : null
  };
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
    orderBy: { createdAt: "asc" },
    select: aiDeliveryDeliverableSelect
  });

  return { deliverables: deliverables.map(toAiDeliveryDeliverableSummary) };
}

export async function createAiDeliveryDeliverable(
  authSession: AuthResolvedSessionContext,
  aiDeliveryProjectId: string,
  input: AiDeliveryDeliverableInputRequest
): Promise<AiDeliveryDeliverableResponse | null> {
  const tenantId = getActiveTenantId(authSession);
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const project = await tx.aiDeliveryProject.findFirst({ where: { id: aiDeliveryProjectId, tenantId, isArchived: false }, select: { id: true } });
    if (!project) return null;

      const payload = input as any;

      if (payload.contentDraftId) {
        const draft = await tx.aiDeliveryContentDraft.findFirst({ where: { id: payload.contentDraftId, tenantId, aiDeliveryProjectId } });
        if (!draft) return null;
      }

      if (payload.articleImageId) {
        const image = await tx.aiDeliveryArticleImage.findFirst({ where: { id: payload.articleImageId, tenantId, aiDeliveryProjectId } });
        if (!image) return null;
      }

      const created = await getAiDeliveryDeliverableDelegate(tx).create({
        data: {
          tenantId,
          aiDeliveryProjectId: project.id,
          contentDraftId: payload.contentDraftId ?? null,
          articleImageId: payload.articleImageId ?? null,
          title: payload.title ?? "",
          description: payload.description ?? null,
          deliveryType: normalizeAiDeliveryDeliverableDeliveryType(payload.deliveryType),
          status: normalizeAiDeliveryDeliverableStatus(payload.status),
          exportUrl: payload.exportUrl ?? null,
          storageKey: payload.storageKey ?? null,
          notes: payload.notes ?? null
        },
        select: aiDeliveryDeliverableSelect
      });

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
  if (!tenantId) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const existing = await getAiDeliveryDeliverableDelegate(tx).findFirst({ where: { id: deliverableId, tenantId }, select: aiDeliveryDeliverableSelect as any }) as any;
    if (!existing) return null;
    if (existing.aiDeliveryProjectId !== aiDeliveryProjectId) return null;

    const payload = input as any;

    if (payload.contentDraftId) {
      const draft = await tx.aiDeliveryContentDraft.findFirst({ where: { id: payload.contentDraftId, tenantId, aiDeliveryProjectId } });
      if (!draft) return null;
    }

    if (payload.articleImageId) {
      const image = await tx.aiDeliveryArticleImage.findFirst({ where: { id: payload.articleImageId, tenantId, aiDeliveryProjectId } });
      if (!image) return null;
    }

    const updated = await getAiDeliveryDeliverableDelegate(tx).update({
      where: { id: deliverableId },
      data: {
        contentDraftId: payload.contentDraftId ?? existing.contentDraftId,
        articleImageId: payload.articleImageId ?? existing.articleImageId,
        title: payload.title ?? existing.title,
        description: payload.description ?? existing.description,
        deliveryType: normalizeAiDeliveryDeliverableDeliveryType(payload.deliveryType),
        status: normalizeAiDeliveryDeliverableStatus(payload.status),
        exportUrl: payload.exportUrl ?? existing.exportUrl,
        storageKey: payload.storageKey ?? existing.storageKey,
        notes: payload.notes ?? existing.notes
      },
      select: aiDeliveryDeliverableSelect
    });

    return { deliverable: toAiDeliveryDeliverableSummary(updated) };
  });
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
    });

    return { deliverable: toAiDeliveryDeliverableSummary(archived) };
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
  if ((input.aiDeliveryProjectId && input.aiDeliveryProjectId !== aiDeliveryProjectId) || (input.deliverableId && input.deliverableId !== deliverableId)) return null;

  return prisma.$transaction(async (tx: PrismaTx) => {
    const deliverable = await getAiDeliveryProjectDeliverable(tx, tenantId, aiDeliveryProjectId, deliverableId);
    if (!deliverable) return null;

    const workflowRunId = toNullableString(input.workflowRunId);
    if (workflowRunId) {
      const workflowRun = await getAiDeliveryProjectWorkflowRun(tx, tenantId, aiDeliveryProjectId, workflowRunId);
      if (!workflowRun) return null;
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
  if ((input.aiDeliveryProjectId && input.aiDeliveryProjectId !== aiDeliveryProjectId) || (input.deliverableId && input.deliverableId !== deliverableId)) return null;

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
        if (!workflowRun) return null;
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
