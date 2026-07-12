/**
 * Fake BFL transport for local no-live tests/smoke.
 * Never contacts api.bfl.ai.
 */

import type { BflFetch } from "../services/bfl-flux.adapter";

/** Minimal valid 1x1 PNG (IHDR 1x1). */
export const FAKE_BFL_PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

/** Minimal valid PNG with IHDR 64x64 for dimension-matching tests. */
export function buildFakePngBuffer(width: number, height: number): Buffer {
  // For non-1x1 sizes used in tests we still return a structurally valid PNG header with IHDR overridden.
  // Tests that need exact dimensions use width/height that match extractImageDimensions — for 64x64 we craft IHDR.
  if (width === 1 && height === 1) {
    return FAKE_BFL_PNG_1X1;
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type RGB
  const ihdrLen = Buffer.alloc(4);
  ihdrLen.writeUInt32BE(13, 0);
  const ihdrType = Buffer.from("IHDR");
  const crc = Buffer.alloc(4); // CRC not validated by our extractor
  const iend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  // Add minimal IDAT so file isn't empty after IHDR — extractor only needs IHDR.
  return Buffer.concat([signature, ihdrLen, ihdrType, ihdrData, crc, iend]);
}

export type FakeBflTransportStats = {
  submitCount: number;
  pollCount: number;
  downloadCount: number;
  hosts: string[];
  methods: string[];
};

export type CreateFakeBflTransportOptions = {
  width?: number;
  height?: number;
  pendingPolls?: number;
  failSubmit?: boolean;
  failPoll?: boolean;
  failDownload?: boolean;
  unsafePollingUrl?: string;
  unsafeSampleUrl?: string;
  emptyDownload?: boolean;
  htmlDownload?: boolean;
  multipleSamples?: boolean;
};

export function createFakeBflTransport(options: CreateFakeBflTransportOptions = {}): {
  fetchImpl: BflFetch;
  stats: FakeBflTransportStats;
  imageBytes: Buffer;
} {
  const width = options.width ?? 64;
  const height = options.height ?? 64;
  const imageBytes = buildFakePngBuffer(width, height);
  const stats: FakeBflTransportStats = {
    submitCount: 0,
    pollCount: 0,
    downloadCount: 0,
    hosts: [],
    methods: []
  };
  let pendingRemaining = options.pendingPolls ?? 1;

  const fetchImpl: BflFetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method ?? "GET").toUpperCase();
    const parsed = new URL(url);
    stats.hosts.push(parsed.hostname);
    stats.methods.push(method);

    if (parsed.pathname.endsWith("/v1/flux-2-pro") && method === "POST") {
      stats.submitCount += 1;
      if (options.failSubmit) {
        return new Response(JSON.stringify({ error: "fail" }), { status: 500 });
      }
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      if (body.width !== width || body.height !== height) {
        // Allow request dimensions to drive response sample sizing when not overridden
      }
      return new Response(
        JSON.stringify({
          id: "fake-bfl-job-1",
          polling_url: options.unsafePollingUrl ?? "https://api.us1.bfl.ai/v1/get_result?id=fake-bfl-job-1"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (parsed.pathname.includes("/v1/get_result") && method === "GET") {
      stats.pollCount += 1;
      if (options.failPoll) {
        return new Response(JSON.stringify({ status: "Error" }), { status: 200 });
      }
      if (pendingRemaining > 0) {
        pendingRemaining -= 1;
        return new Response(JSON.stringify({ status: "Pending" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      const sample = options.unsafeSampleUrl ?? "https://delivery.bfl.ai/fake-sample.png";
      return new Response(
        JSON.stringify({
          status: "Ready",
          result: options.multipleSamples ? { sample, extra: sample } : { sample }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (parsed.hostname.includes("delivery.bfl.ai") || parsed.pathname.endsWith(".png")) {
      stats.downloadCount += 1;
      if (options.failDownload) {
        return new Response("nope", { status: 500 });
      }
      if (options.emptyDownload) {
        return new Response(Buffer.alloc(0), { status: 200, headers: { "Content-Type": "image/png" } });
      }
      if (options.htmlDownload) {
        return new Response("<html>error</html>", { status: 200, headers: { "Content-Type": "text/html" } });
      }
      return new Response(new Uint8Array(imageBytes), { status: 200, headers: { "Content-Type": "image/png" } });
    }

    return new Response(JSON.stringify({ error: "unexpected" }), { status: 404 });
  };

  return { fetchImpl, stats, imageBytes };
}
