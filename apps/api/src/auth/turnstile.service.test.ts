import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { verifyTurnstileToken } from "./turnstile.service";

const ORIGINAL_ENABLED = process.env.TURNSTILE_ENABLED;
const ORIGINAL_SECRET = process.env.TURNSTILE_SECRET_KEY;

afterEach(() => {
  if (ORIGINAL_ENABLED === undefined) {
    delete process.env.TURNSTILE_ENABLED;
  } else {
    process.env.TURNSTILE_ENABLED = ORIGINAL_ENABLED;
  }
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.TURNSTILE_SECRET_KEY;
  } else {
    process.env.TURNSTILE_SECRET_KEY = ORIGINAL_SECRET;
  }
});

describe("verifyTurnstileToken", () => {
  it("accepts any token when Turnstile is disabled", async () => {
    process.env.TURNSTILE_ENABLED = "false";
    assert.equal(await verifyTurnstileToken(""), true);
    assert.equal(await verifyTurnstileToken("ignored"), true);
  });

  it("rejects missing token when Turnstile is enabled", async () => {
    process.env.TURNSTILE_ENABLED = "true";
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    assert.equal(await verifyTurnstileToken(""), false);
  });

  it("rejects invalid token when Turnstile is enabled", async () => {
    process.env.TURNSTILE_ENABLED = "true";
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })) as typeof fetch;
    try {
      assert.equal(await verifyTurnstileToken("bad-token"), false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("accepts valid token when Turnstile is enabled", async () => {
    process.env.TURNSTILE_ENABLED = "true";
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })) as typeof fetch;
    try {
      assert.equal(await verifyTurnstileToken("good-token"), true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("rejects when enabled but secret key is missing", async () => {
    process.env.TURNSTILE_ENABLED = "true";
    delete process.env.TURNSTILE_SECRET_KEY;
    assert.equal(await verifyTurnstileToken("any-token"), false);
  });
});
