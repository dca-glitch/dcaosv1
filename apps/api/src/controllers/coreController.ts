import type { RequestHandler } from "express";
import {
  aiDeliveryProjectInvalidFailure,
  aiDeliveryProjectNotFoundFailure,
  billInvalidFailure,
  billNotFoundFailure,
  clientInvalidFailure,
  clientNotFoundFailure,
  companyProfileInvalidFailure,
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
import {
  archiveAiDeliveryProject,
  archiveClient,
  archiveBill,
  archiveInvoice,
  archiveProject,
  archiveRecurringInvoice,
  archiveTask,
  cancelInvoice,
  archiveInvoiceItem,
  createBill,
  createAiDeliveryProject,
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
  getClient,
  getCompanyProfile,
  getBillDocumentDownload,
  getCreditNoteDocumentDownload,
  getInvoiceDocumentDownload,
  getInvoice,
  getProject,
  getRecurringInvoice,
  getTask,
  listAiDeliveryProjects,
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
  markInvoicePaid,
  markInvoiceSent,
  markInvoiceUncollectible,
  registerInvoicePayment,
  restoreInvoiceItem,
  restoreBill,
  restoreClient,
  restoreProject,
  restoreTask,
  saveCompanyProfile,
  updateAiDeliveryProject,
  updateBill,
  updateClient,
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
  saveAiDeliveryBrief
} from "../core/core.runtime";
import type {
  AiDeliveryProjectInputRequest,
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
  VendorInputRequest
} from "../core/core.types";

const TEXT_FIELD_MAX_LENGTH = 4000;
const SHORT_TEXT_FIELD_MAX_LENGTH = 500;
const LOGO_URL_MAX_LENGTH = 2048;
const NAME_MAX_LENGTH = 255;
const CLIENT_COUNTRIES = new Set(["Indonesia", "Poland", "United States", "United Kingdom", "Singapore", "Australia"]);
const PROJECT_STATUSES = new Set(["Active", "Paused", "Completed", "Archived"]);

function getAuthSession(resLocals: unknown) {
  return (resLocals as AuthSessionLocals | undefined)?.authSession;
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

  return {
    name,
    email: getOptionalString(value.email, SHORT_TEXT_FIELD_MAX_LENGTH),
    contactPerson: getOptionalString(value.contactPerson, SHORT_TEXT_FIELD_MAX_LENGTH),
    billingAddress: getOptionalString(value.billingAddress, TEXT_FIELD_MAX_LENGTH),
    taxId: getOptionalString(value.taxId, SHORT_TEXT_FIELD_MAX_LENGTH),
    country
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

function getInvoiceLineItems(value: unknown): InvoiceLineItemInputRequest[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  return value.map((item, index) => {
    const record = (item ?? {}) as Record<string, unknown>;
    const description = getRequiredString(record.description, SHORT_TEXT_FIELD_MAX_LENGTH);
    const quantity = getPositiveInteger(record.quantity);
    const unitPriceCents = getNonNegativeInteger(record.unitPriceCents);
    const totalCents = getNonNegativeInteger(record.totalCents);
    const sortOrder = getNonNegativeInteger(record.sortOrder, index);
    if (!description || quantity === null || unitPriceCents === null || totalCents === null || sortOrder === null) {
      return null;
    }
    return { description, quantity, unitPriceCents, totalCents, sortOrder };
  }).filter(Boolean) as InvoiceLineItemInputRequest[];
}

function getRecurringInvoiceLineItems(value: unknown): RecurringInvoiceLineItemInputRequest[] | null {
  const lineItems = getInvoiceLineItems(value);
  return lineItems;
}

function getCreditNoteLineItems(value: unknown): CreditNoteLineItemInputRequest[] | null {
  const lineItems = getInvoiceLineItems(value);
  return lineItems;
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

function getCreditNoteInput(body: unknown): CreditNoteInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const reason = getRequiredString(value.reason, TEXT_FIELD_MAX_LENGTH);
  const currency = getCurrency(value.currency);
  const amountCents = getNonNegativeInteger(value.amountCents);
  const subtotalCents = getNonNegativeInteger(value.subtotalCents);
  const taxCents = getNonNegativeInteger(value.taxCents);
  const discountCents = getNonNegativeInteger(value.discountCents);
  const totalCents = getNonNegativeInteger(value.totalCents);
  const lineItems = getCreditNoteLineItems(value.lineItems);
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
  } catch {
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
  } catch {
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
  if (!invoiceId || !input) return void res.status(400).json(invoiceInvalidFailure());
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
  if (!creditNoteId || !input) return void res.status(400).json(invoiceInvalidFailure());
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
  } catch {
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
  } catch {
    res.status(500).json(failure("RECURRING_INVOICE_RUNTIME_ERROR", "Recurring invoice generation could not be completed."));
  }
};
