import type { FinanceEventSource, FinanceEventType } from "@prisma/client";

export interface FinanceEventSummary {
  id: string;
  type: FinanceEventType;
  source: FinanceEventSource;
  sourceEntityId: string | null;
  amount: number;
  currency: string;
  clientId: string | null;
  projectId: string | null;
  timestamp: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceMonthlySnapshotSummary {
  month: string;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  marginPercent: number;
  reportStorageKey: string | null;
  updatedAt: string;
}

export interface FinanceSummaryResponse {
  month: string;
  snapshot: FinanceMonthlySnapshotSummary;
}

export interface FinanceClientSummaryResponse {
  clientId: string;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  marginPercent: number;
  eventCount: number;
}

export interface FinanceProjectSummaryResponse {
  projectId: string;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  marginPercent: number;
  eventCount: number;
}

export interface FinanceEventsResponse {
  events: FinanceEventSummary[];
}

export interface FinanceIntegrityCheck {
  code: string;
  severity: "warning" | "error";
  message: string;
  entityId?: string;
}

export interface FinanceIntegrityResponse {
  checks: FinanceIntegrityCheck[];
  ok: boolean;
}

export interface RevenueAttributionSummary {
  id: string;
  financeEventId: string;
  deliveryId: string | null;
  clientId: string | null;
  projectId: string | null;
  metadata: Record<string, unknown>;
}

export interface CreateFinanceEventInput {
  type: FinanceEventType;
  source: FinanceEventSource;
  sourceEntityId?: string | null;
  amountCents: number;
  currency?: string;
  clientId?: string | null;
  projectId?: string | null;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}
