export type AiKnowledgeScope = "SYSTEM" | "CLIENT" | "PROJECT" | "INDUSTRY";

export type AiKnowledgeType =
  | "CLIENT_FACT"
  | "BRAND_VOICE"
  | "TARGET_AUDIENCE"
  | "PRODUCT_SERVICE"
  | "OFFER"
  | "COMPETITOR"
  | "RESEARCH_NOTE"
  | "MARKET_INSIGHT"
  | "SEO_KEYWORD_GROUP"
  | "CONTENT_EXAMPLE"
  | "IMAGE_STYLE"
  | "REPORT_INSIGHT"
  | "PERFORMANCE_LEARNING"
  | "FORBIDDEN_CLAIM"
  | "APPROVED_LINK"
  | "PROJECT_CONTEXT"
  | "INDUSTRY_NOTE";

export type AiKnowledgeStatus = "RAW" | "REVIEWED" | "APPROVED" | "EXPIRED" | "ARCHIVED" | "REPLACED";

export interface AiKnowledgeItemSummary {
  id: string;
  tenantId: string;
  clientId: string | null;
  aiDeliveryProjectId: string | null;
  scope: AiKnowledgeScope;
  type: AiKnowledgeType;
  status: AiKnowledgeStatus;
  title: string;
  summary: string | null;
  body: string | null;
  sourceType: string | null;
  sourceUrl: string | null;
  sourceDate: string | null;
  confidence: string | null;
  expiresAt: string | null;
  evergreen: boolean;
  allowedForPrompt: boolean;
  clientVisible: boolean;
  version: number;
  replacedById: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiKnowledgeItemsResponse {
  knowledgeItems: AiKnowledgeItemSummary[];
}

export interface AiKnowledgeItemResponse {
  knowledgeItem: AiKnowledgeItemSummary;
}

export interface AiKnowledgeItemInputRequest {
  clientId?: string | null;
  aiDeliveryProjectId?: string | null;
  scope: AiKnowledgeScope;
  type: AiKnowledgeType;
  status?: AiKnowledgeStatus;
  title: string;
  summary?: string | null;
  body?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  sourceDate?: string | null;
  confidence?: string | null;
  expiresAt?: string | null;
  evergreen?: boolean;
  allowedForPrompt?: boolean;
  clientVisible?: boolean;
  changeReason?: string | null;
}

export interface AiKnowledgePromoteInputRequest {
  sourceType: "AI_DELIVERY_RESEARCH_SUMMARY" | "AI_DELIVERY_DELIVERABLE" | "AI_DELIVERY_MONTHLY_REPORT";
  sourceId: string;
  aiDeliveryProjectId: string;
  scope?: AiKnowledgeScope;
  type?: AiKnowledgeType;
  status?: AiKnowledgeStatus;
  allowedForPrompt?: boolean;
  clientVisible?: boolean;
  changeReason?: string | null;
}

export type AiContextMissingSeverity = "info" | "warning" | "blocking";

export interface AiContextMissingContextItem {
  severity: AiContextMissingSeverity;
  code: string;
  message: string;
}

export interface AiContextSelectedSource {
  knowledgeItemId: string;
  version: number;
  type: AiKnowledgeType;
  scope: AiKnowledgeScope;
  status: AiKnowledgeStatus;
  title: string;
}

export interface AiContextPreviewInputRequest {
  clientId?: string | null;
  aiDeliveryProjectId?: string | null;
  workflowType: string;
  requestedKnowledgeTypes?: AiKnowledgeType[];
  includeRaw?: boolean;
  includeExpired?: boolean;
  maxTokens?: number;
  oneOffInstruction?: string | null;
  saveSnapshot?: boolean;
}

export interface AiContextPreviewResponse {
  canRun: boolean;
  blockingReasons: string[];
  contextPreview: string;
  selectedSources: AiContextSelectedSource[];
  warnings: string[];
  missingContext: AiContextMissingContextItem[];
  tokenEstimate: number;
  contextHash: string;
  snapshotId: string | null;
  budget: {
    budgetPolicy: string;
    approximateInputTokens: number;
  };
}
