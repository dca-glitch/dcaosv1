/**
 * Fake OpenAI Images transport for local no-live tests/smoke.
 * Never contacts api.openai.com.
 */

import type { OpenAIFetch } from "./openai-image.adapter";
import { buildFakePngBuffer } from "./bfl-flux.fake-transport";

export type FakeOpenAITransportStats = {
  submitCount: number;
  hosts: string[];
  methods: string[];
  lastBody: Record<string, unknown> | null;
};

export type CreateFakeOpenAITransportOptions = {
  width?: number;
  height?: number;
  failSubmit?: boolean;
  emptyB64?: boolean;
  htmlAsB64?: boolean;
  multipleOutputs?: boolean;
  returnUrl?: boolean;
};

export function createFakeOpenAITransport(options: CreateFakeOpenAITransportOptions = {}): {
  fetchImpl: OpenAIFetch;
  stats: FakeOpenAITransportStats;
  imageBytes: Buffer;
} {
  const width = options.width ?? 1024;
  const height = options.height ?? 1024;
  const imageBytes = buildFakePngBuffer(width, height);
  const stats: FakeOpenAITransportStats = {
    submitCount: 0,
    hosts: [],
    methods: [],
    lastBody: null
  };

  const fetchImpl: OpenAIFetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method ?? "GET").toUpperCase();
    const parsed = new URL(url);
    stats.hosts.push(parsed.hostname);
    stats.methods.push(method);

    if (parsed.pathname.endsWith("/images/generations") && method === "POST") {
      stats.submitCount += 1;
      stats.lastBody = init?.body ? JSON.parse(String(init.body)) : null;
      if (options.failSubmit) {
        return new Response(JSON.stringify({ error: { message: "fail" } }), { status: 500 });
      }
      if (options.returnUrl) {
        return new Response(
          JSON.stringify({
            id: "fake-openai-img-1",
            data: [{ url: "https://api.openai.com/v1/not-allowed" }]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (options.multipleOutputs) {
        return new Response(
          JSON.stringify({
            id: "fake-openai-img-1",
            data: [
              { b64_json: imageBytes.toString("base64") },
              { b64_json: imageBytes.toString("base64") }
            ]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (options.emptyB64) {
        return new Response(
          JSON.stringify({ id: "fake-openai-img-1", data: [{ b64_json: "" }] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (options.htmlAsB64) {
        return new Response(
          JSON.stringify({
            id: "fake-openai-img-1",
            data: [{ b64_json: Buffer.from("<!doctype html><html>err</html>").toString("base64") }]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          id: "fake-openai-img-1",
          created: 1,
          data: [{ b64_json: imageBytes.toString("base64") }]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "unexpected" }), { status: 404 });
  };

  return { fetchImpl, stats, imageBytes };
}
