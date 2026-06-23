import type { AiProviderConfig } from "../config";

const OPENROUTER_REQUEST_TIMEOUT_MS = 20000;

export interface OpenRouterTextSummaryInput {
  config: AiProviderConfig;
  projectName: string;
  targetMonth: string;
  briefStatus: string;
  adminNotes: string | null;
}

export interface OpenRouterTextSummaryResult {
  ok: boolean;
  content: string | null;
  model: string | null;
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

function buildOpenRouterPrompt(input: OpenRouterTextSummaryInput): string {
  return [
    "Create a short admin-facing execution summary for this DCA OS Lite AI Delivery workflow run.",
    "Do not claim client-facing delivery, publication, approval, scraping, or autonomous execution.",
    "",
    `Project: ${input.projectName}`,
    `Target month: ${input.targetMonth}`,
    `Brief status: ${input.briefStatus}`,
    `Admin notes: ${input.adminNotes?.trim() || "None"}`
  ].join("\n");
}

function getSafeOpenRouterError(status: number): string {
  return `OpenRouter request failed with HTTP ${status}.`;
}

export async function executeOpenRouterTextSummary(input: OpenRouterTextSummaryInput): Promise<OpenRouterTextSummaryResult> {
  const apiKey = readOpenRouterApiKey();
  const model = input.config.openRouterTextPrimaryModel;

  if (!apiKey || !model) {
    return {
      ok: false,
      content: null,
      model,
      errorMessage: "OpenRouter is not fully configured."
    };
  }

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
        model,
        messages: [
          {
            role: "system",
            content: "You write concise admin-only workflow execution summaries. Do not include secrets or claim client delivery."
          },
          {
            role: "user",
            content: buildOpenRouterPrompt(input)
          }
        ],
        temperature: 0.2,
        max_tokens: 350
      }),
      signal: abortController.signal
    });

    if (!response.ok) {
      return {
        ok: false,
        content: null,
        model,
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
        model,
        errorMessage: "OpenRouter response did not include text content."
      };
    }

    return {
      ok: true,
      content: text,
      model,
      errorMessage: null
    };
  } catch (error) {
    const errorName = (error as { name?: string }).name;
    return {
      ok: false,
      content: null,
      model,
      errorMessage: errorName === "AbortError" ? "OpenRouter request timed out." : "OpenRouter request could not be completed."
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
