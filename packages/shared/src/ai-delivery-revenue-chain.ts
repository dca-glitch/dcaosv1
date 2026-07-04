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
