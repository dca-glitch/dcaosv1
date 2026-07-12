export interface CompanyProfileSummary {
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
  createdAt: string;
  currency: string;
  invoiceTemplateKey: string;
  invoicePrefix: string | null;
  creditNotePrefix: string | null;
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
  country?: string | null;
  registrationNumber?: string | null;
  billingAddress?: string | null;
  paymentInstructions?: string | null;
  logoUrl?: string | null;
  currency?: string;
  invoiceTemplateKey?: string;
  invoicePrefix?: string | null;
  creditNotePrefix?: string | null;
}

export interface ClientSummary {
  id: string;
  name: string;
  email: string | null;
  website: string | null;
  contactPerson: string | null;
  billingAddress: string | null;
  taxId: string | null;
  country: string | null;
  clientKind: "AGENCY_CLIENT" | "OWN_DOMAIN";
  legalEntityName: string | null;
  accountGroupName: string | null;
  migrationStatus: "ACTIVE" | "PLANNED_LICENSEE_TENANT" | "MIGRATED";
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
  website?: string | null;
  contactPerson?: string | null;
  billingAddress?: string | null;
  taxId?: string | null;
  country?: string | null;
  clientKind?: "AGENCY_CLIENT" | "OWN_DOMAIN";
  legalEntityName?: string | null;
  accountGroupName?: string | null;
  migrationStatus?: "ACTIVE" | "PLANNED_LICENSEE_TENANT" | "MIGRATED";
}

export interface PublicationTargetSummary {
  id: string;
  clientId: string;
  label: string;
  connectorType: string;
  siteUrl: string;
  siteSlug: string | null;
  /** Non-secret WordPress Application Password username. Never the password. */
  wordpressUsername: string | null;
  wordPressComSite: boolean;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicationTargetsResponse {
  publicationTargets: PublicationTargetSummary[];
}

export interface PublicationTargetResponse {
  publicationTarget: PublicationTargetSummary | null;
}

export interface PublicationTargetInputRequest {
  label?: string;
  siteUrl?: string;
  siteSlug?: string | null;
  /** Non-secret WordPress username for Application Password Basic auth. */
  wordpressUsername?: string | null;
  wordPressComSite?: boolean;
  isDefault?: boolean;
}

export interface PublicationTargetCredentialUpsertRequest {
  applicationPassword?: string;
}

export interface PublicationTargetCredentialStatusResponse {
  configured: boolean;
  encryptionAvailable: boolean;
  updatedAt: string | null;
}

export interface ClientAnalyticsProfileSummary {
  id: string;
  clientId: string;
  gscSiteUrl: string | null;
  ga4PropertyId: string | null;
  defaultSourceType: string;
  connectionStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientAnalyticsProfileResponse {
  profile: ClientAnalyticsProfileSummary | null;
}

export interface ClientAnalyticsProfileInputRequest {
  gscSiteUrl?: string | null;
  ga4PropertyId?: string | null;
  defaultSourceType?: "MANUAL" | "CSV_IMPORT" | "GA4" | "GSC" | "HYBRID";
  connectionStatus?: "MANUAL" | "CONFIGURED" | "LIVE_DEFERRED";
}

export interface ClientCatalogProductSummary {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  sku: string | null;
  priceLabel: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isVisibleInPortal: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientCatalogProductsResponse {
  catalogProducts: ClientCatalogProductSummary[];
}

export interface ClientCatalogProductResponse {
  catalogProduct: ClientCatalogProductSummary | null;
}

export interface ClientCatalogProductInputRequest {
  name?: string;
  description?: string | null;
  sku?: string | null;
  priceLabel?: string | null;
  imageUrl?: string | null;
  sortOrder?: number | null;
  isVisibleInPortal?: boolean;
}

export type ClientCatalogInquiryStatus = "NEW" | "ACKNOWLEDGED" | "CLOSED";

export interface ClientCatalogInquirySummary {
  id: string;
  clientId: string;
  productId: string | null;
  productName: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  message: string;
  status: ClientCatalogInquiryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClientCatalogInquiriesResponse {
  catalogInquiries: ClientCatalogInquirySummary[];
}

export interface ClientCatalogInquiryResponse {
  catalogInquiry: ClientCatalogInquirySummary | null;
}

export interface ClientCatalogInquiryInputRequest {
  productId?: string | null;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string | null;
  message?: string;
}

export interface ClientCatalogInquiryStatusInputRequest {
  status?: ClientCatalogInquiryStatus;
}

export interface PublicationLogSummary {
  id: string;
  clientId: string;
  publicationTargetId: string | null;
  aiDeliveryProjectId: string | null;
  deliverableId: string | null;
  action: string;
  status: string;
  siteUrlHost: string | null;
  externalPostId: string | null;
  note: string | null;
  createdAt: string;
}

export interface PublicationLogsResponse {
  publicationLogs: PublicationLogSummary[];
}

export interface ProjectSummary {
  id: string;
  clientId: string | null;
  client: {
    id: string;
    name: string;
  } | null;
  name: string;
  description: string | null;
  startDate: string | null;
  dueDate: string | null;
  status: string;
  isArchived: boolean;
  taskCount: number;
  openTaskCount: number;
  documents?: ProjectDocumentSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocumentSummary {
  id: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  documentType: string | null;
  documentDate: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocumentsResponse {
  documents: ProjectDocumentSummary[];
}

export interface ProjectDocumentResponse {
  document: ProjectDocumentSummary | null;
}

export interface ProjectDocumentUploadRequest {
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  documentType?: string | null;
  documentDate?: string | null;
  contentBase64?: string;
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
  status?: string;
}

export interface AiDeliveryBriefSummary {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiDeliveryProjectSummary {
  id: string;
  clientId: string;
  client: {
    id: string;
    name: string;
  } | null;
  projectId: string | null;
  project: {
    id: string;
    name: string;
  } | null;
  name: string;
  targetMonth: string;
  plannedContentScopeNotes: string | null;
  isArchived: boolean;
  brief: AiDeliveryBriefSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiDeliveryProjectsResponse {
  aiDeliveryProjects: AiDeliveryProjectSummary[];
}

export interface AiDeliveryProjectResponse {
  aiDeliveryProject: AiDeliveryProjectSummary | null;
}

export interface AiDeliveryProjectInputRequest {
  clientId?: string;
  projectId?: string | null;
  name?: string;
  targetMonth?: string;
  plannedContentScopeNotes?: string | null;
}

export interface AiDeliveryWorkflowRunSummary {
  id: string;
  tenantId: string;
  aiDeliveryProjectId: string;
  status: string;
  adminNotes: string | null;
  resultPlaceholder: string | null;
  executionLog: string | null;
  executionError: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  brief: AiDeliveryBriefSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiDeliveryWorkflowRunsResponse {
  workflowRuns: AiDeliveryWorkflowRunSummary[];
}

export interface AiDeliveryWorkflowRunResponse {
  workflowRun: AiDeliveryWorkflowRunSummary | null;
}

export interface AiDeliveryWorkflowRunInputRequest {
  status?: string;
  adminNotes?: string | null;
  resultPlaceholder?: string | null;
}

export interface AiDeliveryResearchRequestSummary {
  id: string;
  tenantId: string;
  aiDeliveryProjectId: string;
  workflowRunId: string | null;
  workflowRun: { id: string; status: string } | null;
  title: string;
  description: string | null;
  requestType: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiDeliveryResearchRequestsResponse {
  researchRequests: AiDeliveryResearchRequestSummary[];
}

export interface AiDeliveryResearchRequestResponse {
  researchRequest: AiDeliveryResearchRequestSummary | null;
}

export interface AiDeliveryResearchRequestInputRequest {
  workflowRunId?: string | null;
  title?: string;
  description?: string | null;
  requestType?: string | null;
  status?: string;
}

export interface AiDeliveryResearchSourceSummary {
  id: string;
  tenantId: string;
  aiDeliveryProjectId: string;
  researchRequestId: string | null;
  workflowRunId: string | null;
  researchRequest: { id: string; title: string; status: string } | null;
  workflowRun: { id: string; status: string } | null;
  sourceUrl: string;
  sourceTitle: string | null;
  sourceType: string;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiDeliveryResearchSourcesResponse {
  researchSources: AiDeliveryResearchSourceSummary[];
}

export interface AiDeliveryResearchSourceResponse {
  researchSource: AiDeliveryResearchSourceSummary | null;
}

export interface AiDeliveryResearchSourceInputRequest {
  researchRequestId?: string | null;
  workflowRunId?: string | null;
  sourceUrl?: string;
  sourceTitle?: string | null;
  sourceType?: string;
  status?: string;
  reviewNotes?: string | null;
}

export interface AiDeliveryResearchSummarySummary {
  id: string;
  tenantId: string;
  aiDeliveryProjectId: string;
  workflowRunId: string | null;
  workflowRun: { id: string; status: string } | null;
  title: string;
  status: string;
  summaryText: string;
  keyFindings: string | null;
  audienceInsights: string | null;
  competitorInsights: string | null;
  keywordOpportunities: string | null;
  contentRecommendations: string | null;
  briefRevisionNotes: string | null;
  sourceNotes: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiDeliveryResearchSummariesResponse {
  researchSummaries: AiDeliveryResearchSummarySummary[];
}

export interface AiDeliveryResearchSummaryResponse {
  researchSummary: AiDeliveryResearchSummarySummary | null;
}

export interface AiDeliveryResearchSummaryApplyResponse {
  researchSummary: AiDeliveryResearchSummarySummary | null;
  brief: {
    id: string;
    notes: string | null;
    updatedAt: string;
  } | null;
}

export interface AiDeliveryResearchSummaryInputRequest {
  workflowRunId?: string | null;
  title?: string;
  status?: string;
  summaryText?: string;
  keyFindings?: string | null;
  audienceInsights?: string | null;
  competitorInsights?: string | null;
  keywordOpportunities?: string | null;
  contentRecommendations?: string | null;
  briefRevisionNotes?: string | null;
  sourceNotes?: string | null;
}

export interface AiDeliveryContentDraftSummary {
  id: string;
  aiDeliveryProjectId: string;
  contentPlanItemId: string | null;
  contentPlanItem: { id: string; title: string; sortOrder: number } | null;
  title: string;
  slug: string | null;
  draftBody: string;
  status: string;
  notes: string | null;
  reviewRequestedAt: string | null;
  approvedAt: string | null;
  revisionCount: number;
  clientComment: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiDeliveryContentDraftsResponse {
  contentDrafts: AiDeliveryContentDraftSummary[];
}

export interface AiDeliveryContentDraftResponse {
  contentDraft: AiDeliveryContentDraftSummary | null;
}

export interface AiDeliveryContentDraftInputRequest {
  contentPlanItemId?: string | null;
  title?: string;
  slug?: string | null;
  draftBody?: string;
  status?: string;
  notes?: string | null;
}

export interface AiDeliveryArticleImageSummary {
  id: string;
  aiDeliveryProjectId: string;
  contentDraftId: string;
  contentDraft: { id: string; title: string };
  title: string;
  prompt: string;
  styleNotes: string | null;
  status: string;
  previewImageUrl: string | null;
  finalImageUrl: string | null;
  hasDocument: boolean;
  notes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiDeliveryArticleImagesResponse {
  articleImages: AiDeliveryArticleImageSummary[];
}

export interface AiDeliveryArticleImageResponse {
  articleImage: AiDeliveryArticleImageSummary | null;
}

export interface AiDeliveryArticleImageInputRequest {
  contentDraftId?: string;
  title?: string;
  prompt?: string;
  styleNotes?: string | null;
  status?: string;
  previewImageUrl?: string | null;
  finalImageUrl?: string | null;
  storageKey?: string | null;
  notes?: string | null;
}

export interface AiDeliveryArticleImageUploadRequest {
  fileName?: string;
  mimeType?: string;
  contentBase64?: string;
}

export interface TaskSummary {
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
  projectId?: string | null;
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

export interface InvoicePaymentSummary {
  id: string;
  invoiceId: string;
  paymentMethod: string;
  amountIssuedCents: number;
  amountReceivedCents: number;
  differenceCents: number;
  paymentDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditNoteLineItemSummary {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditNoteSummary {
  id: string;
  invoiceId: string;
  creditNoteNumber: string;
  status: string;
  issueDate: string | null;
  reason: string;
  amountCents: number;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  isArchived: boolean;
  lineItems: CreditNoteLineItemSummary[];
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
  payment: InvoicePaymentSummary | null;
  creditNotes: CreditNoteSummary[];
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

export interface InvoiceItemSummary {
  id: string;
  name: string;
  description: string | null;
  unitPriceCents: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItemsResponse {
  invoiceItems: InvoiceItemSummary[];
}

export interface InvoiceItemResponse {
  invoiceItem: InvoiceItemSummary | null;
}

export interface InvoiceItemInputRequest {
  name?: string;
  description?: string | null;
  unitPriceCents?: number;
}

export interface InvoicePaymentResponse {
  invoice: InvoiceSummary | null;
}

export interface InvoicePaymentInputRequest {
  paymentMethod?: string;
  amountIssuedCents?: number;
  amountReceivedCents?: number;
  paymentDate?: string;
  notes?: string | null;
}

export interface CreditNotesResponse {
  creditNotes: CreditNoteSummary[];
}

export interface CreditNoteResponse {
  creditNote: CreditNoteSummary | null;
}

export interface CreditNoteLineItemInputRequest {
  description?: string;
  quantity?: number;
  unitPriceCents?: number;
  totalCents?: number;
  sortOrder?: number;
}

export interface CreditNoteInputRequest {
  reason?: string;
  amountCents?: number;
  currency?: string;
  subtotalCents?: number;
  taxCents?: number;
  discountCents?: number;
  totalCents?: number;
  documentUrl?: string | null;
  documentStorageKey?: string | null;
  lineItems?: CreditNoteLineItemInputRequest[];
}

export interface DocumentDownloadResponse {
  downloadUrl: string;
  expiresSeconds: number;
}

export interface AiDeliveryDeliverableDownloadReferenceResponse {
  downloadReference: {
    storageKey: string;
    downloadUrl: string | null;
    expiresSeconds: number | null;
  } | null;
}

export interface AiDeliveryWordPressDraftPrepared {
  status: "PREPARED";
  title: string;
  body: string;
  excerpt: string | null;
  sourceType: "DELIVERABLE" | "CONTENT_DRAFT";
  sourceId: string;
  slug: string | null;
  postStatus: "draft";
  externalPostId: null;
  externalEditUrl: null;
  publicationTargetId?: string;
  publicationTargetLabel?: string;
  publicationSiteUrl?: string;
  publishGateStatus: "disabled" | "credentials_missing" | "target_configured";
  credentialConfigured: boolean;
  note: string;
}

export interface AiDeliveryWordPressDraftResponse {
  wordpressDraft: AiDeliveryWordPressDraftPrepared;
}

export interface AiDeliveryGoogleDocExportResponse {
  deliverableId: string;
  hasGoogleDocExport: boolean;
  exportUrl: string | null;
  docTitle: string | null;
  folderPath: string | null;
  providerStatus: "exported" | "provider_disabled" | "provider_not_configured" | "error";
  providerDisabledReason?: string | null;
  errorMessage: string | null;
  generatedAt: string | null;
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

export interface BillDocumentUploadRequest {
  fileName?: string;
  mimeType?: string;
  contentBase64?: string;
}

export interface AiDeliveryDeliverableSummary {
  id: string;
  tenantId: string;
  aiDeliveryProjectId: string;
  contentDraftId?: string | null;
  articleImageId?: string | null;
  contentDraft?: {
    id: string;
    title: string;
    status: string;
    approvedAt?: string | null;
  } | null;
  articleImage?: {
    id: string;
    title: string;
    status: string;
  } | null;
  title: string;
  description?: string | null;
  deliveryType: string;
  status: string;
  exportUrl?: string | null;
  hasDocument: boolean;
  notes?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiDeliveryDeliverablesResponse {
  deliverables: AiDeliveryDeliverableSummary[];
}

export interface AiDeliveryDeliverableResponse {
  deliverable: AiDeliveryDeliverableSummary | null;
}

export interface AiDeliveryDeliverableInputRequest {
  contentDraftId?: string | null;
  articleImageId?: string | null;
  title?: string;
  description?: string | null;
  deliveryType?: string;
  status?: string;
  exportUrl?: string | null;
  storageKey?: string | null;
  notes?: string | null;
}

export interface AiDeliveryDeliverableUploadRequest {
  fileName?: string;
  mimeType?: string;
  contentBase64?: string;
}

export interface AiDeliveryDeliverableReviewSummary {
  id: string;
  tenantId: string;
  aiDeliveryProjectId: string;
  deliverableId: string;
  workflowRunId?: string | null;
  status: string;
  reviewerName?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiDeliveryDeliverableReviewsResponse {
  deliverableReviews: AiDeliveryDeliverableReviewSummary[];
}

export interface AiDeliveryDeliverableReviewResponse {
  deliverableReview: AiDeliveryDeliverableReviewSummary | null;
}

export interface AiDeliveryDeliverableReviewInputRequest {
  status?: string;
  reviewerName?: string | null;
  reviewNotes?: string | null;
  deliverableId?: string | null;
  aiDeliveryProjectId?: string | null;
  workflowRunId?: string | null;
}


export interface AiDeliveryMonthlySummaryDeliverableItem {
  id: string;
  title: string;
  description: string | null;
  deliveryType: string;
  status: string;
  exportUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiDeliveryMonthlySummaryContentPlanItem {
  id: string;
  title: string;
  contentType: string;
  targetKeyword: string | null;
  approvalStatus: string | null;
}

export interface AiDeliveryMonthlySummaryResponse {
  summary: {
    project: {
      id: string;
      name: string;
      targetMonth: string;
      clientId: string;
      clientName: string | null;
    };
    deliverables: AiDeliveryMonthlySummaryDeliverableItem[];
    totals: {
      deliverableCount: number;
      deliveredCount: number;
      acceptedCount: number;
    };
    contentPlanItems: AiDeliveryMonthlySummaryContentPlanItem[];
    deferred: {
      gaGscMetricsStatus: "DEFERRED";
      trendMonthsStatus: "DEFERRED";
      recommendationsStatus: "DEFERRED_REQUIRES_PERSISTED_REPORT";
    };
  };
}

export interface AiDeliveryMonthlyReportSummary {
  id: string;
  aiDeliveryProjectId: string;
  clientId: string;
  status: string;
  title: string | null;
  adminSummaryNotes: string | null;
  recommendationsText: string | null;
  exportUrl: string | null;
  hasDocument: boolean;
  isArchived: boolean;
  finalizedAt: string | null;
  // Market Intelligence internal context (admin-only)
  miHandoffId: string | null;
  miSummaryId: string | null;
  miContextDraft: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    name: string;
    targetMonth: string;
    clientName: string | null;
  } | null;
}

export interface AiDeliveryMonthlyReportResponse {
  report: AiDeliveryMonthlyReportSummary | null;
}

export interface AiDeliveryMonthlyReportInputRequest {
  title?: string | null;
  adminSummaryNotes?: string | null;
  recommendationsText?: string | null;
  exportUrl?: string | null;
}

export interface AiDeliveryMonthlyReportUploadRequest {
  fileName?: string;
  mimeType?: string;
  contentBase64?: string;
}

export interface AiDeliveryMonthlyReportDownloadReferenceResponse {
  downloadReference: {
    downloadUrl: string;
    expiresSeconds: number;
  } | null;
}

export interface AiDeliveryMonthlyReportGeneratePdfSummary {
  reportId: string;
  hasDocument: boolean;
  updatedAt: string;
  generatedAt: string;
  fileName: string;
}

export interface AiDeliveryMonthlyReportGeneratePdfResponse {
  report: AiDeliveryMonthlyReportGeneratePdfSummary | null;
}

export interface AiDeliveryMonthlyReportStatusRequest {
  status?: string | null;
}

export interface AiDeliveryMonthlyReportMiContextResponse {
  miHandoffId: string | null;
  miSummaryId: string | null;
  miContextDraft: string | null;
  handoff: {
    id: string;
    title: string;
    handoffStatus: string;
    marketSummary: string | null;
    audienceSignals: unknown;
    opportunities: unknown;
    risks: unknown;
    recommendedActions: unknown;
    sourceNote: string | null;
  } | null;
  summary: {
    id: string;
    title: string;
    status: string;
    sourceNotes: string | null;
    projectId: string;
    finalizedAt: string | null;
  } | null;
}

export interface AiDeliveryMonthlyReportMiApplyRequest {
  handoffId?: string | null;
  summaryId?: string | null;
}

export interface AiDeliveryMonthlyReportMiDraftRequest {
  miContextDraft: string;
}

export type MonthlyMetricSourceType = "MANUAL" | "CSV_IMPORT" | "GA4" | "GSC" | "HYBRID";

export type MonthlyMetricSnapshotStatus = "DRAFT" | "IMPORTED" | "APPROVED" | "ARCHIVED";

export interface AiDeliveryMonthlyMetricSnapshotSummary {
  id: string;
  aiDeliveryProjectId: string;
  aiDeliveryMonthlyReportId: string;
  targetMonth: string;
  sourceType: MonthlyMetricSourceType;
  status: MonthlyMetricSnapshotStatus;
  gscClicks: number | null;
  gscImpressions: number | null;
  gscAverageCtr: number | null;
  gscAveragePosition: number | null;
  ga4Sessions: number | null;
  ga4Users: number | null;
  ga4PageViews: number | null;
  notes: string | null;
  importedByUserId: string | null;
  importedAt: string;
  approvedByUserId: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiDeliveryMonthlyMetricSnapshotInputRequest {
  targetMonth?: string;
  sourceType?: MonthlyMetricSourceType;
  status?: "DRAFT" | "IMPORTED";
  gscClicks?: number | null;
  gscImpressions?: number | null;
  gscAverageCtr?: number | null;
  gscAveragePosition?: number | null;
  ga4Sessions?: number | null;
  ga4Users?: number | null;
  ga4PageViews?: number | null;
  notes?: string | null;
}

export interface AiDeliveryMonthlyMetricsTrendMonthSummary {
  targetMonth: string;
  sourceType: MonthlyMetricSourceType;
  gscClicks: number | null;
  gscImpressions: number | null;
  gscAverageCtr: number | null;
  gscAveragePosition: number | null;
  ga4Sessions: number | null;
  ga4Users: number | null;
  ga4PageViews: number | null;
}

export interface AiDeliveryMonthlyMetricsTrendSummary {
  dataStatus: "NO_DATA" | "PARTIAL" | "READY";
  latestMonth: string | null;
  last12Months: AiDeliveryMonthlyMetricsTrendMonthSummary[];
  totals: {
    gscClicks: number;
    gscImpressions: number;
    ga4Sessions: number;
    ga4Users: number;
    ga4PageViews: number;
  };
  averages: {
    gscAverageCtr: number | null;
    gscAveragePosition: number | null;
  };
}

export interface AiDeliveryMonthlyMetricsSummary {
  report: {
    id: string;
    aiDeliveryProjectId: string;
    targetMonth: string;
    project: { id: string; name: string } | null;
    client: { id: string; name: string } | null;
  };
  snapshots: AiDeliveryMonthlyMetricSnapshotSummary[];
  computedTrendSummary: AiDeliveryMonthlyMetricsTrendSummary;
}

export interface AiDeliveryMonthlyMetricsResponse {
  metrics: AiDeliveryMonthlyMetricsSummary | null;
}

export interface AiDeliveryMonthlyMetricSnapshotResponse {
  snapshot: AiDeliveryMonthlyMetricSnapshotSummary | null;
}

export interface MarketIntelligenceProjectSummary {
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
  createdAt: string;
  updatedAt: string;
}

export interface MarketIntelligenceProjectResponse {
  project: MarketIntelligenceProjectSummary | null;
}

export interface MarketIntelligenceProjectsResponse {
  projects: MarketIntelligenceProjectSummary[];
}

export interface MarketIntelligenceProjectInputRequest {
  title?: string | null;
  clientId?: string | null;
  description?: string | null;
  keywords?: string | null;
  competitors?: string | null;
  niche?: string | null;
  productServiceFocus?: string | null;
  targetClientName?: string | null;
  targetMonth?: string | null;
  status?: string | null;
}

export interface MarketIntelligenceSourceSummary {
  id: string;
  projectId: string;
  title: string;
  sourceType: string | null;
  sourceUrl: string | null;
  sourceNotes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketIntelligenceSourceResponse {
  source: MarketIntelligenceSourceSummary | null;
}

export interface MarketIntelligenceSourcesResponse {
  sources: MarketIntelligenceSourceSummary[];
}

export interface MarketIntelligenceSourceInputRequest {
  projectId?: string | null;
  title?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  sourceNotes?: string | null;
}

export interface MarketIntelligenceResearchRunSummary {
  id: string;
  projectId: string;
  status: string;
  resultSummary: string | null;
  executionLog: string | null;
  executedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketIntelligenceResearchRunResponse {
  researchRun: MarketIntelligenceResearchRunSummary | null;
}

export interface MarketIntelligenceResearchRunsResponse {
  researchRuns: MarketIntelligenceResearchRunSummary[];
}

export interface MarketIntelligenceResearchRunInputRequest {
  projectId?: string | null;
  status?: string | null;
  resultSummary?: string | null;
  executionLog?: string | null;
}

export interface MarketIntelligenceInsightSummary {
  id: string;
  projectId: string;
  title: string;
  summary: string | null;
  resultData: unknown | null;
  status: string;
  reviewerNotes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketIntelligenceInsightResponse {
  insight: MarketIntelligenceInsightSummary | null;
}

export interface MarketIntelligenceInsightsResponse {
  insights: MarketIntelligenceInsightSummary[];
}

export interface MarketIntelligenceInsightInputRequest {
  projectId?: string | null;
  title?: string | null;
  summary?: string | null;
  resultData?: unknown | null;
  status?: string | null;
  reviewerNotes?: string | null;
}

// Internal handoff bridge — admin-only, not client-facing
export interface MarketIntelligenceHandoffSummary {
  id: string;
  projectId: string;
  insightId: string;
  title: string;
  marketSummary: string | null;
  competitorSummary: string | null;
  audienceSignals: string[] | null;
  opportunities: string[] | null;
  risks: string[] | null;
  recommendedActions: string[] | null;
  sourceNote: string | null;
  targetClientName: string | null;
  targetMonth: string | null;
  handoffStatus: string;
  isArchived: boolean;
  aiDeliveryProjectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketIntelligenceHandoffResponse {
  handoff: MarketIntelligenceHandoffSummary | null;
}

export interface MarketIntelligenceHandoffsResponse {
  handoffs: MarketIntelligenceHandoffSummary[];
}

export interface MarketIntelligenceHandoffStatusRequest {
  handoffStatus?: string | null;
}

export interface MarketIntelligenceFindingInputRequest {
  projectId?: string | null;
  researchRunId?: string | null;
  sourceId?: string | null;
  findingCategory?: string | null;
  findingText?: string | null;
  priority?: string | null;
}

export interface MarketIntelligenceFindingSummary {
  id: string;
  projectId: string;
  researchRunId: string | null;
  sourceId: string | null;
  findingCategory: string;
  findingText: string;
  priority: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MarketIntelligenceFindingResponse {
  finding: MarketIntelligenceFindingSummary | null;
}

export interface MarketIntelligenceFindingsResponse {
  findings: MarketIntelligenceFindingSummary[];
}

export interface MarketIntelligenceSummaryInputRequest {
  title?: string | null;
  summaryText?: string | null;
  status?: string | null;
  sourceNotes?: string | null;
}

export interface MarketIntelligenceSummaryRecord {
  id: string;
  projectId: string;
  clientId: string | null;
  title: string;
  summaryText: string;
  status: string;
  sourceNotes: string | null;
  integrationContext: Record<string, unknown> | null;
  isArchived: boolean;
  finalizedAt: string | null;
  aiDeliveryProjectId: string | null;
  appliedAt: string | null;
  linkage?: MarketIntelligenceSummaryLinkageSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketIntelligenceSummaryLinkageSummary {
  aiDeliveryProjectId: string | null;
  aiDeliveryProjectName: string | null;
  monthlyReportId: string | null;
  monthlyReportTitle: string | null;
  appliedAt: string | null;
}

export interface MarketIntelligenceFinalizedSummaryPickerItem {
  id: string;
  projectId: string;
  title: string;
  status: string;
  clientId: string | null;
  finalizedAt: string | null;
  appliedAt: string | null;
  aiDeliveryProjectId: string | null;
}

export interface MarketIntelligenceFinalizedSummariesResponse {
  summaries: MarketIntelligenceFinalizedSummaryPickerItem[];
}

export interface MarketIntelligenceSummaryApplyTargetRequest {
  target?: "delivery" | "brief" | "seo" | "monthly_report" | null;
  aiDeliveryProjectId?: string | null;
  reportId?: string | null;
}

export interface MarketIntelligenceSummaryApplyResponse {
  summary: MarketIntelligenceSummaryRecord | null;
  brief?: { id: string; notes: string | null; updatedAt: string } | null;
  aiDeliveryProject?: { id: string; plannedContentScopeNotes: string | null; updatedAt: string } | null;
  report?: AiDeliveryMonthlyReportMiContextResponse | null;
  summaries?: AiDeliveryMiSummaryContextSummary[];
}

export interface AiDeliveryMiSummaryContextSummary {
  id: string;
  projectId: string;
  title: string;
  status: string;
  sourceNotes: string | null;
  aiDeliveryProjectId: string | null;
  appliedAt: string | null;
  finalizedAt: string | null;
}

export interface AiDeliveryMiSummaryContextResponse {
  summaries: AiDeliveryMiSummaryContextSummary[];
}

export type AiDeliveryRevenueChainReadinessStatus = "ready" | "warning" | "missing" | "optional";

export interface AiDeliveryRevenueChainReadinessCheck {
  key: string;
  label: string;
  status: AiDeliveryRevenueChainReadinessStatus;
  detail: string;
}

export interface AiDeliveryRevenueChainReadinessResponse {
  projectId: string;
  projectName: string;
  targetMonth: string;
  overallStatus: "ready" | "partial" | "blocked";
  checks: AiDeliveryRevenueChainReadinessCheck[];
  warnings: string[];
}

export interface AiDeliveryMiSummaryApplyRequest {
  summaryId?: string | null;
}

export interface AiDeliveryMiSummaryBriefApplyResponse {
  summary: MarketIntelligenceSummaryRecord;
  brief: { id: string; notes: string | null; updatedAt: string };
}

export interface MarketIntelligenceSummaryResponse {
  summary: MarketIntelligenceSummaryRecord | null;
}

export interface MarketIntelligenceSummariesResponse {
  summaries: MarketIntelligenceSummaryRecord[];
}

export interface MarketIntelligenceSummaryGenerateResponse {
  preview: {
    title: string;
    summaryText: string;
    sourceNotes: string;
    integrationContext: Record<string, unknown>;
  };
  summary: MarketIntelligenceSummaryRecord | null;
}

export interface AiDeliveryMiContextApplyRequest {
  handoffId?: string | null;
}

export interface AiDeliveryMiContextResponse {
  handoffs: MarketIntelligenceHandoffSummary[];
}
