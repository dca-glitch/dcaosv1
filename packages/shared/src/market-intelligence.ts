export interface MarketIntelligenceProjectSummary {
  id: string;
  title: string;
  description: string | null;
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
  executedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
