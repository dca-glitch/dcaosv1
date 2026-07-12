/**
 * Image provider adapter registry — workflows resolve adapters by AI Policy provider id.
 */

import type { ImageProviderAdapter } from "@dca-os-v1/shared";
import { createBflFluxAdapter, type BflFluxAdapterOptions } from "../services/bfl-flux.adapter";

export function resolveImageProviderAdapter(
  providerId: string,
  options?: BflFluxAdapterOptions
): ImageProviderAdapter | null {
  if (providerId === "bfl") {
    return createBflFluxAdapter(options);
  }
  return null;
}
