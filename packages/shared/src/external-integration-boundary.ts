/**
 * External integration boundary snapshots (G63–G67).
 * Read-only contracts — no live service calls.
 */

export const EXTERNAL_INTEGRATION_BOUNDARY_VERSION = "EXTERNAL_INTEGRATION_BOUNDARY_V1";

export type ExternalIntegrationCategory =
  | "ai_provider"
  | "wordpress"
  | "private_storage"
  | "image_generation";

export interface ExternalIntegrationBoundaryItem {
  category: ExternalIntegrationCategory;
  status: "disabled" | "missing_config" | "configured_shape_ok";
  liveCallsDeferred: true;
  ownerCredentialsRequired: boolean;
  notes: string[];
}

export interface PurivaIntegrationBoundaryIndex {
  operatingPackKey: "puriva";
  boundaryVersion: typeof EXTERNAL_INTEGRATION_BOUNDARY_VERSION;
  monthlyAiCapUsd: number;
  categories: ExternalIntegrationBoundaryItem[];
  purivaBlockers: string[];
  liveProofPending: true;
}

export function buildPurivaIntegrationBoundaryIndex(input: {
  monthlyAiCapUsd: number;
  categories: Array<{
    key: ExternalIntegrationCategory;
    status: "disabled" | "missing_config" | "configured_shape_ok";
    notes?: string[];
  }>;
}): PurivaIntegrationBoundaryIndex {
  const categoryNotes: Record<ExternalIntegrationCategory, string[]> = {
    ai_provider: ["Local deterministic default; OpenRouter live proof deferred."],
    wordpress: ["Draft prep local-only; live draft/publish proof deferred."],
    private_storage: ["R2 disabled-safe; real bucket IO proof deferred."],
    image_generation: ["Foundation scaffold; live provider calls deferred."]
  };

  return {
    operatingPackKey: "puriva",
    boundaryVersion: EXTERNAL_INTEGRATION_BOUNDARY_VERSION,
    monthlyAiCapUsd: input.monthlyAiCapUsd,
    categories: input.categories.map((entry) => ({
      category: entry.key,
      status: entry.status,
      liveCallsDeferred: true,
      ownerCredentialsRequired: entry.status !== "disabled",
      notes: entry.notes ?? categoryNotes[entry.key]
    })),
    purivaBlockers: [
      "Live AI provider proof",
      "Image generation live proof",
      "WordPress live draft proof",
      "R2 real-bucket proof",
      "Transactional email live proof"
    ],
    liveProofPending: true
  };
}
