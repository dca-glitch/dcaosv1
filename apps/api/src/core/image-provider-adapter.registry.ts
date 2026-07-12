/**
 * Image provider adapter registry — workflows resolve adapters by AI Policy provider id.
 */

import type { ImageProviderAdapter } from "@dca-os-v1/shared";
import { createBflFluxAdapter, type BflFluxAdapterOptions } from "../services/bfl-flux.adapter";
import { createOpenAIImageAdapter, type OpenAIImageAdapterOptions } from "../services/openai-image.adapter";

export type ImageProviderAdapterResolveOptions = BflFluxAdapterOptions & OpenAIImageAdapterOptions;

export function resolveImageProviderAdapter(
  providerId: string,
  options?: ImageProviderAdapterResolveOptions
): ImageProviderAdapter | null {
  if (providerId === "openai") {
    return createOpenAIImageAdapter(options);
  }
  if (providerId === "bfl") {
    return createBflFluxAdapter(options);
  }
  return null;
}
