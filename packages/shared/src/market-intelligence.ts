export interface MarketIntelligenceProjectSummary {
  id: string;
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

export interface MarketIntelligenceResearchRunSummary {
  id: string;
  projectId: string;
  status: string;
  resultSummary: string | null;
  executionLog: string | null;
  executedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sourceCount?: number; // Number of sources analyzed (evidence context)
  generatedInsightId?: string | null; // ID of the insight generated from this run
}

export interface MarketIntelligenceInsightResultV1 {
  summary: string | null;
  competitors: string[] | null;
  audienceSignals: string[] | null;
  marketTrends: string[] | null;
  opportunities: string[] | null;
  threats: string[] | null;
  pricingSignals: string[] | null;
  contentOrSeoAngles: string[] | null;
  recommendedNextActions: string[] | null;
  sourceNotes: string | null;
  confidenceNotes: string | null;
}

export interface MarketIntelligenceInsightSummary {
  id: string;
  projectId: string;
  title: string;
  summary: string | null;
  resultData: MarketIntelligenceInsightResultV1 | null;
  status: string;
  reviewerNotes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  sourceCount?: number; // Number of sources in the project (evidence context)
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
  handoffStatus: string; // DRAFT | READY | APPLIED | ARCHIVED
  isArchived: boolean;
  aiDeliveryProjectId: string | null;
  createdAt: string;
  updatedAt: string;
}
