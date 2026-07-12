import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { AI_OPENROUTER_HTTP_CONTRACT } from "../config/ai-provider.config";
import {
  executeOpenRouterTextRequest,
  getSafeOpenRouterError,
  OPENROUTER_REQUEST_RETRY_COUNT,
  OPENROUTER_REQUEST_TIMEOUT_MS
} from "./openrouter-text.service";

const FAKE_API_KEY = "sk-or-v1-unit-test-fake-key-not-real";

describe("openrouter-text.service HTTP contract", () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.OPENROUTER_API_KEY;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = originalKey;
    }
  });

  it("exports timeout and retry=0 aligned with AI_OPENROUTER_HTTP_CONTRACT", () => {
    assert.equal(OPENROUTER_REQUEST_TIMEOUT_MS, 20_000);
    assert.equal(OPENROUTER_REQUEST_RETRY_COUNT, 0);
    assert.equal(OPENROUTER_REQUEST_TIMEOUT_MS, AI_OPENROUTER_HTTP_CONTRACT.timeoutMs);
    assert.equal(OPENROUTER_REQUEST_RETRY_COUNT, AI_OPENROUTER_HTTP_CONTRACT.retryCount);
    assert.equal(AI_OPENROUTER_HTTP_CONTRACT.retryPolicy, "none");
  });

  it("safe HTTP errors never include status body or API key material", () => {
    const message = getSafeOpenRouterError(401);
    assert.equal(message, "OpenRouter request failed with HTTP 401.");
    assert.equal(message.includes(FAKE_API_KEY), false);
    assert.equal(message.toLowerCase().includes("authorization"), false);
  });

  it("failed fetch responses discard bodies that may echo the API key", async () => {
    process.env.OPENROUTER_API_KEY = FAKE_API_KEY;
    let fetchCalls = 0;

    globalThis.fetch = (async () => {
      fetchCalls += 1;
      return new Response(
        JSON.stringify({
          error: {
            message: `Unauthorized key=${FAKE_API_KEY}`,
            type: "authentication_error"
          }
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const result = await executeOpenRouterTextRequest({
      config: {
        textGateway: "openrouter",
        preferredTextGateway: "openrouter",
        hasOpenRouterApiKey: true,
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
        openRouterTextPrimaryModel: "anthropic/claude-haiku-4.5",
        openRouterTextSecondaryModel: null,
        openRouterTextReviewerModel: null,
        openRouterTextLongContextModel: null
      },
      model: "anthropic/claude-haiku-4.5",
      systemPrompt: "sys",
      userPrompt: "user",
      maxOutputTokens: 16,
      temperature: 0
    });

    assert.equal(result.ok, false);
    assert.equal(fetchCalls, 1);
    assert.equal(result.errorMessage, "OpenRouter request failed with HTTP 401.");
    assert.equal(result.errorMessage?.includes(FAKE_API_KEY), false);
    assert.equal(JSON.stringify(result).includes(FAKE_API_KEY), false);
  });

  it("network failures return a generic safe error without leaking the key", async () => {
    process.env.OPENROUTER_API_KEY = FAKE_API_KEY;

    globalThis.fetch = (async () => {
      throw new Error(`upstream failed for ${FAKE_API_KEY}`);
    }) as typeof fetch;

    const result = await executeOpenRouterTextRequest({
      config: {
        textGateway: "openrouter",
        preferredTextGateway: "openrouter",
        hasOpenRouterApiKey: true,
        openRouterBaseUrl: "https://openrouter.ai/api/v1",
        openRouterTextPrimaryModel: "anthropic/claude-haiku-4.5",
        openRouterTextSecondaryModel: null,
        openRouterTextReviewerModel: null,
        openRouterTextLongContextModel: null
      },
      model: "anthropic/claude-haiku-4.5",
      systemPrompt: "sys",
      userPrompt: "user",
      maxOutputTokens: 16,
      temperature: 0
    });

    assert.equal(result.ok, false);
    assert.equal(result.errorMessage, "OpenRouter request could not be completed.");
    assert.equal(JSON.stringify(result).includes(FAKE_API_KEY), false);
  });
});
