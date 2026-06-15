export interface CompanyProfileSummary {
  id: string;
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  taxId: string | null;
  registrationNumber: string | null;
  billingAddress: string | null;
  paymentInstructions: string | null;
  logoUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfileResponse {
  companyProfile: CompanyProfileSummary | null;
}

export interface CompanyProfileUpdateRequest {
  name?: string;
  legalName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  taxId?: string | null;
  registrationNumber?: string | null;
  billingAddress?: string | null;
  paymentInstructions?: string | null;
  logoUrl?: string | null;
}

export interface ClientSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  billingDetails: string | null;
  contactPerson: string | null;
  notes: string | null;
  isArchived: boolean;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientResponse {
  client: ClientSummary | null;
}

export interface ClientsResponse {
  clients: ClientSummary[];
}

export interface ClientInputRequest {
  name?: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  billingDetails?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
}

export interface ProjectSummary {
  id: string;
  clientId: string;
  client: {
    id: string;
    name: string;
  };
  name: string;
  description: string | null;
  startDate: string | null;
  dueDate: string | null;
  isArchived: boolean;
  taskCount: number;
  openTaskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResponse {
  project: ProjectSummary | null;
}

export interface ProjectsResponse {
  projects: ProjectSummary[];
}

export interface ProjectInputRequest {
  clientId?: string;
  name?: string;
  description?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
}

export interface TaskSummary {
  id: string;
  projectId: string;
  project: {
    id: string;
    name: string;
    client: {
      id: string;
      name: string;
    };
  };
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  recurringType: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskResponse {
  task: TaskSummary | null;
}

export interface TasksResponse {
  tasks: TaskSummary[];
}

export interface TaskInputRequest {
  projectId?: string;
  title?: string;
  description?: string | null;
  priority?: string;
  status?: string;
  dueDate?: string | null;
  recurringType?: string;
}

export interface InvoiceLineItemSummary {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceSummary {
  id: string;
  clientId: string;
  client: {
    id: string;
    name: string;
  };
  projectId: string | null;
  project: {
    id: string;
    name: string;
  } | null;
  recurringInvoiceId: string | null;
  invoiceNumber: string;
  status: string;
  issueDate: string | null;
  dueDate: string | null;
  paidAt: string | null;
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
  lineItems: InvoiceLineItemSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceResponse {
  invoice: InvoiceSummary | null;
}

export interface InvoicesResponse {
  invoices: InvoiceSummary[];
}

export interface InvoiceLineItemInputRequest {
  description?: string;
  quantity?: number;
  unitPriceCents?: number;
  totalCents?: number;
  sortOrder?: number;
}

export interface InvoiceInputRequest {
  clientId?: string;
  projectId?: string | null;
  invoiceNumber?: string;
  status?: string;
  issueDate?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  currency?: string;
  subtotalCents?: number;
  taxCents?: number;
  discountCents?: number;
  totalCents?: number;
  amountPaidCents?: number;
  title?: string | null;
  notes?: string | null;
  paymentInstructions?: string | null;
  documentUrl?: string | null;
  documentStorageKey?: string | null;
  lineItems?: InvoiceLineItemInputRequest[];
}

export interface RecurringInvoiceLineItemSummary {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringInvoiceRunSummary {
  id: string;
  scheduledFor: string;
  generatedInvoiceId: string | null;
  status: string;
  createdAt: string;
}

export interface RecurringInvoiceSummary {
  id: string;
  clientId: string;
  client: {
    id: string;
    name: string;
  };
  projectId: string | null;
  project: {
    id: string;
    name: string;
  } | null;
  title: string | null;
  interval: string;
  startDate: string;
  endDate: string | null;
  nextRunDate: string;
  lastRunDate: string | null;
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
  lineItems: RecurringInvoiceLineItemSummary[];
  runs: RecurringInvoiceRunSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface RecurringInvoiceResponse {
  recurringInvoice: RecurringInvoiceSummary | null;
}

export interface RecurringInvoicesResponse {
  recurringInvoices: RecurringInvoiceSummary[];
}

export interface RecurringInvoiceLineItemInputRequest {
  description?: string;
  quantity?: number;
  unitPriceCents?: number;
  totalCents?: number;
  sortOrder?: number;
}

export interface RecurringInvoiceInputRequest {
  clientId?: string;
  projectId?: string | null;
  title?: string | null;
  interval?: string;
  startDate?: string;
  endDate?: string | null;
  nextRunDate?: string;
  currency?: string;
  subtotalCents?: number;
  taxCents?: number;
  discountCents?: number;
  totalCents?: number;
  notes?: string | null;
  paymentInstructions?: string | null;
  documentFolderHint?: string | null;
  isActive?: boolean;
  lineItems?: RecurringInvoiceLineItemInputRequest[];
}

export interface VendorSummary {
  id: string;
  name: string;
  isArchived: boolean;
  billCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorResponse {
  vendor: VendorSummary | null;
}

export interface VendorsResponse {
  vendors: VendorSummary[];
}

export interface VendorInputRequest {
  name?: string;
}

export interface BillSummary {
  id: string;
  vendorId: string;
  vendor: {
    id: string;
    name: string;
  };
  amountCents: number;
  paymentForm: string;
  paymentDate: string;
  billDate: string | null;
  dueDate: string | null;
  referenceNumber: string | null;
  category: string | null;
  notes: string | null;
  documentUrl: string | null;
  documentStorageKey: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillResponse {
  bill: BillSummary | null;
}

export interface BillsResponse {
  bills: BillSummary[];
}

export interface BillInputRequest {
  vendorId?: string;
  amountCents?: number;
  paymentForm?: string;
  paymentDate?: string;
  billDate?: string | null;
  dueDate?: string | null;
  referenceNumber?: string | null;
  category?: string | null;
  notes?: string | null;
  documentUrl?: string | null;
  documentStorageKey?: string | null;
}
