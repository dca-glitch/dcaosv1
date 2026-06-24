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
  contactPerson: string | null;
  billingAddress: string | null;
  taxId: string | null;
  country: string | null;
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
  contactPerson?: string | null;
  billingAddress?: string | null;
  taxId?: string | null;
  country?: string | null;
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
  storageKey: string | null;
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
  externalPostId: null;
  externalEditUrl: null;
  note: string;
}

export interface AiDeliveryWordPressDraftResponse {
  wordpressDraft: AiDeliveryWordPressDraftPrepared;
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
  storageKey?: string | null;
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

export interface MarketIntelligenceProjectSummary {
  id: string;
  title: string;
  description: string | null;
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
  description?: string | null;
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
}

export interface MarketIntelligenceInsightSummary {
  id: string;
  projectId: string;
  title: string;
  summary: string | null;
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
  status?: string | null;
  reviewerNotes?: string | null;
}
