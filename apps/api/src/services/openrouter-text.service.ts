import type { AiProviderConfig } from "../config";
import { AI_OPENROUTER_HTTP_CONTRACT } from "../config/ai-provider.config";

/**
 * OpenRouter request timeout (ms). Exported for contract tests and gateway metadata.
 * Retry count is always 0 — this client never retries failed/timed-out requests.
 */
export const OPENROUTER_REQUEST_TIMEOUT_MS = AI_OPENROUTER_HTTP_CONTRACT.timeoutMs;
export const OPENROUTER_REQUEST_RETRY_COUNT = AI_OPENROUTER_HTTP_CONTRACT.retryCount;

export interface OpenRouterTextRequestInput {
  config: AiProviderConfig;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens: number;
  temperature: number;
}

export interface OpenRouterTextRequestResult {
  ok: boolean;
  content: string | null;
  model: string;
  errorMessage: string | null;
}

type OpenRouterChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

function readOpenRouterApiKey(): string | null {
  const value = process.env.OPENROUTER_API_KEY?.trim();
  return value ? value : null;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

/** Safe, status-only error — never includes response body or Authorization material. */
export function getSafeOpenRouterError(status: number): string {
  return `OpenRouter request failed with HTTP ${status}.`;
}

export async function executeOpenRouterTextRequest(input: OpenRouterTextRequestInput): Promise<OpenRouterTextRequestResult> {
  const apiKey = readOpenRouterApiKey();

  if (!apiKey || !input.model) {
    return {
      ok: false,
      content: null,
      model: input.model,
      errorMessage: "OpenRouter is not fully configured."
    };
  }

  // Contract: single attempt only (OPENROUTER_REQUEST_RETRY_COUNT === 0). No retry loop.
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), OPENROUTER_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${normalizeBaseUrl(input.config.openRouterBaseUrl)}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "DCA OS Lite"
      },
      body: JSON.stringify({
        model: input.model,
        messages: [
          {
            role: "system",
            content: input.systemPrompt
          },
          {
            role: "user",
            content: input.userPrompt
          }
        ],
        temperature: input.temperature,
        max_tokens: input.maxOutputTokens
      }),
      signal: abortController.signal
    });

    if (!response.ok) {
      // Intentionally discard response body — may echo secrets; never surface to callers.
      return {
        ok: false,
        content: null,
        model: input.model,
        errorMessage: getSafeOpenRouterError(response.status)
      };
    }

    const payload = (await response.json()) as OpenRouterChatCompletionResponse;
    const content = payload.choices?.[0]?.message?.content;
    const text = typeof content === "string" ? content.trim() : "";

    if (!text) {
      return {
        ok: false,
        content: null,
        model: input.model,
        errorMessage: "OpenRouter response did not include text content."
      };
    }

    return {
      ok: true,
      content: text,
      model: input.model,
      errorMessage: null
    };
  } catch (error) {
    const errorName = (error as { name?: string }).name;
    return {
      ok: false,
      content: null,
      model: input.model,
      errorMessage: errorName === "AbortError" ? "OpenRouter request timed out." : "OpenRouter request could not be completed."
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
