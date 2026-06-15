import type { RequestHandler } from "express";
import {
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
  archiveClient,
  archiveInvoice,
  archiveProject,
  archiveRecurringInvoice,
  archiveTask,
  cancelInvoice,
  createClient,
  createInvoice,
  createProject,
  createRecurringInvoice,
  createTask,
  generateDueRecurringInvoice,
  getClient,
  getCompanyProfile,
  getInvoice,
  getProject,
  getRecurringInvoice,
  getTask,
  listInvoices,
  listClients,
  listProjects,
  listRecurringInvoices,
  listTasks,
  markInvoicePaid,
  markInvoiceSent,
  saveCompanyProfile,
  updateClient,
  updateInvoice,
  updateProject,
  updateRecurringInvoice,
  updateTask
} from "../core/core.runtime";
import type {
  ClientInputRequest,
  CompanyProfileUpdateRequest,
  InvoiceInputRequest,
  InvoiceLineItemInputRequest,
  ProjectInputRequest,
  RecurringInvoiceInputRequest,
  RecurringInvoiceLineItemInputRequest,
  TaskInputRequest
} from "../core/core.types";

const TEXT_FIELD_MAX_LENGTH = 4000;
const SHORT_TEXT_FIELD_MAX_LENGTH = 500;
const LOGO_URL_MAX_LENGTH = 2048;
const NAME_MAX_LENGTH = 255;

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

  if (!name) {
    return null;
  }

  return {
    name,
    legalName: getOptionalString(value.legalName, SHORT_TEXT_FIELD_MAX_LENGTH),
    email: getOptionalString(value.email, SHORT_TEXT_FIELD_MAX_LENGTH),
    phone: getOptionalString(value.phone, SHORT_TEXT_FIELD_MAX_LENGTH),
    website: getOptionalString(value.website, LOGO_URL_MAX_LENGTH),
    taxId: getOptionalString(value.taxId, SHORT_TEXT_FIELD_MAX_LENGTH),
    registrationNumber: getOptionalString(value.registrationNumber, SHORT_TEXT_FIELD_MAX_LENGTH),
    billingAddress: getOptionalString(value.billingAddress, TEXT_FIELD_MAX_LENGTH),
    paymentInstructions: getOptionalString(value.paymentInstructions, TEXT_FIELD_MAX_LENGTH),
    logoUrl: getOptionalUrl(value.logoUrl)
  };
}

function getClientInput(body: unknown): ClientInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const name = getRequiredString(value.name, SHORT_TEXT_FIELD_MAX_LENGTH);

  if (!name) {
    return null;
  }

  return {
    name,
    email: getOptionalString(value.email, SHORT_TEXT_FIELD_MAX_LENGTH),
    phone: getOptionalString(value.phone, SHORT_TEXT_FIELD_MAX_LENGTH),
    website: getOptionalUrl(value.website),
    billingDetails: getOptionalString(value.billingDetails, TEXT_FIELD_MAX_LENGTH),
    contactPerson: getOptionalString(value.contactPerson, SHORT_TEXT_FIELD_MAX_LENGTH),
    notes: getOptionalString(value.notes, TEXT_FIELD_MAX_LENGTH)
  };
}

function getProjectInput(body: unknown): ProjectInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const clientId = getRequiredString(value.clientId, SHORT_TEXT_FIELD_MAX_LENGTH);
  const name = getRequiredString(value.name, SHORT_TEXT_FIELD_MAX_LENGTH);

  if (!clientId || !name) {
    return null;
  }

  const startDate = parseDateInput(value.startDate);
  const dueDate = parseDateInput(value.dueDate);
  if (startDate === undefined || dueDate === undefined) {
    return null;
  }

  return {
    clientId,
    name,
    description: getOptionalString(value.description, TEXT_FIELD_MAX_LENGTH),
    startDate: startDate?.toISOString() ?? null,
    dueDate: dueDate?.toISOString() ?? null
  };
}

const TASK_PRIORITIES = new Set(["LOW", "NORMAL", "HIGH"]);
const TASK_STATUSES = new Set(["TODO", "IN_PROGRESS", "DONE"]);
const TASK_RECURRING_TYPES = new Set(["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
const INVOICE_STATUSES = new Set(["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED", "VOIDED"]);
const RECURRING_INVOICE_INTERVALS = new Set(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

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

function getTaskInput(body: unknown): TaskInputRequest | null {
  const value = (body ?? {}) as Record<string, unknown>;
  const projectId = getRequiredString(value.projectId, SHORT_TEXT_FIELD_MAX_LENGTH);
  const title = getRequiredString(value.title, SHORT_TEXT_FIELD_MAX_LENGTH);

  if (!projectId || !title) {
    return null;
  }

  const priority = typeof value.priority === "string" ? value.priority.trim().toUpperCase() : "NORMAL";
  const status = typeof value.status === "string" ? value.status.trim().toUpperCase() : "TODO";
  const recurringType =
    typeof value.recurringType === "string" ? value.recurringType.trim().toUpperCase() : "NONE";

  if (!TASK_PRIORITIES.has(priority) || !TASK_STATUSES.has(status) || !TASK_RECURRING_TYPES.has(recurringType)) {
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
    res.json(success(await getCompanyProfile(), { phase: "runtime", scope: "core-module-skeleton" }));
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
        await saveCompanyProfile(input as Parameters<typeof saveCompanyProfile>[0]),
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
  } catch {
    res.status(500).json(failure("CLIENT_RUNTIME_ERROR", "Client archive could not be completed."));
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
  } catch {
    res.status(500).json(failure("PROJECT_RUNTIME_ERROR", "Project archive could not be completed."));
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
  } catch {
    res.status(500).json(failure("TASK_RUNTIME_ERROR", "Task archive could not be completed."));
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
