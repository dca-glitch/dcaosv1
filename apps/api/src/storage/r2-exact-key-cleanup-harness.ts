/**
 * Local exact-key R2 create → HEAD → read checksum → delete → absence harness.
 * Default path uses an in-memory fake transport (no live R2, no credentials required).
 * Live mode is opt-in via env and is intentionally not executed by unit tests.
 */

import { createHash } from "node:crypto";
import {
  deleteR2Object,
  headR2Object,
  setR2HttpTransportForTests,
  uploadR2Object,
  type R2HttpTransport
} from "./r2.service";

export type R2ExactKeyHarnessResult = {
  ok: boolean;
  liveMode: false;
  createCount: number;
  deleteCount: number;
  headCount: number;
  storageKey: string | null;
  checksumMatched: boolean;
  absenceConfirmed: boolean;
  safeErrors: string[];
};

type FakeObject = {
  body: Buffer;
  contentType: string;
};

function parseObjectKeyFromUrl(url: string, bucketName: string): string | null {
  try {
    const parsed = new URL(url);
    const prefix = `/${bucketName}/`;
    if (!parsed.pathname.startsWith(prefix)) {
      return null;
    }
    return decodeURIComponent(parsed.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

export function createInMemoryR2Transport(input: {
  endpoint: string;
  bucketName: string;
}): {
  transport: R2HttpTransport;
  getObject: (key: string) => FakeObject | undefined;
  requestLog: Array<{ method: string; key: string | null }>;
} {
  const store = new Map<string, FakeObject>();
  const requestLog: Array<{ method: string; key: string | null }> = [];

  const transport: R2HttpTransport = async (requestUrl, init) => {
    const method = (init?.method ?? "GET").toUpperCase();
    const url = String(requestUrl);
    const key = parseObjectKeyFromUrl(url, input.bucketName);
    requestLog.push({ method, key });

    if (!url.startsWith(input.endpoint.replace(/\/+$/, ""))) {
      return new Response(null, { status: 400, statusText: "Bad Request" });
    }

    if (!key) {
      return new Response(null, { status: 400, statusText: "Bad Request" });
    }

    if (method === "PUT") {
      const body = Buffer.from(await new Response(init?.body ?? null).arrayBuffer());
      const contentType =
        (init?.headers && "Content-Type" in (init.headers as Record<string, string>)
          ? (init.headers as Record<string, string>)["Content-Type"]
          : null) ?? "application/octet-stream";
      store.set(key, { body, contentType });
      return new Response(null, { status: 200, statusText: "OK" });
    }

    if (method === "HEAD") {
      const object = store.get(key);
      if (!object) {
        return new Response(null, { status: 404, statusText: "Not Found" });
      }
      return new Response(null, {
        status: 200,
        statusText: "OK",
        headers: {
          "content-length": String(object.body.length),
          "content-type": object.contentType,
          etag: `"${createHash("sha256").update(object.body).digest("hex").slice(0, 16)}"`,
          "last-modified": "Wed, 01 Jan 2020 00:00:00 GMT"
        }
      });
    }

    if (method === "GET") {
      const object = store.get(key);
      if (!object) {
        return new Response(null, { status: 404, statusText: "Not Found" });
      }
      return new Response(new Uint8Array(object.body), {
        status: 200,
        statusText: "OK",
        headers: {
          "content-type": object.contentType,
          "content-length": String(object.body.length)
        }
      });
    }

    if (method === "DELETE") {
      const existed = store.delete(key);
      return new Response(null, {
        status: existed ? 204 : 404,
        statusText: existed ? "No Content" : "Not Found"
      });
    }

    return new Response(null, { status: 405, statusText: "Method Not Allowed" });
  };

  return {
    transport,
    getObject: (key) => store.get(key),
    requestLog
  };
}

/**
 * Runs one create/read/checksum/delete/absence sequence against the in-memory transport.
 * Never enables live R2.
 */
export async function runR2ExactKeyFakeRoundtripHarness(): Promise<R2ExactKeyHarnessResult> {
  const safeErrors: string[] = [];
  const endpoint = "https://example-account.r2.cloudflarestorage.com";
  const bucketName = "dca-fake-bucket";

  const previous = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    endpoint: process.env.R2_ENDPOINT
  };

  process.env.R2_ACCOUNT_ID = "example-account";
  process.env.R2_ACCESS_KEY_ID = "fake-access-key-id";
  process.env.R2_SECRET_ACCESS_KEY = "fake-secret-access-key";
  process.env.R2_BUCKET_NAME = bucketName;
  process.env.R2_ENDPOINT = endpoint;

  const fake = createInMemoryR2Transport({ endpoint, bucketName });
  setR2HttpTransportForTests(fake.transport);

  let storageKey: string | null = null;
  let createCount = 0;
  let deleteCount = 0;
  let headCount = 0;
  let checksumMatched = false;
  let absenceConfirmed = false;

  try {
    const payload = Buffer.from("%PDF-1.4\nDCA-R2-FAKE-ROUNDTRIP\n", "utf8");
    const expectedSha = createHash("sha256").update(payload).digest("hex");

    const uploaded = await uploadR2Object({
      body: payload,
      mimeType: "application/pdf",
      originalFileName: "proof-roundtrip.pdf",
      documentType: "documents",
      tenantSlugOrId: "proof-tenant",
      projectSlugOrId: "proof-project",
      documentDate: new Date("2026-07-12T00:00:00.000Z")
    });
    createCount = 1;
    storageKey = uploaded.storageKey;

    if (uploaded.publicUrl !== null) {
      safeErrors.push("Upload must not return a public URL.");
    }

    headCount += 1;
    const headBefore = await headR2Object(storageKey);
    if (!(headBefore.ok && headBefore.exists)) {
      safeErrors.push("HEAD before delete must report exists=true.");
    }

    const stored = fake.getObject(storageKey);
    if (!stored) {
      safeErrors.push("Fake store missing uploaded object.");
    } else {
      const actualSha = createHash("sha256").update(stored.body).digest("hex");
      checksumMatched = actualSha === expectedSha && stored.body.equals(payload);
      if (!checksumMatched) {
        safeErrors.push("Byte checksum mismatch after create.");
      }
    }

    deleteCount = 1;
    const deleted = await deleteR2Object(storageKey);
    if (!(deleted.ok && deleted.deleted && deleted.alreadyAbsent === false)) {
      safeErrors.push("DELETE must succeed for the exact proof key.");
    }

    headCount += 1;
    const headAfter = await headR2Object(storageKey);
    absenceConfirmed = headAfter.ok && !headAfter.exists && headAfter.reason === "not_found";
    if (!absenceConfirmed) {
      safeErrors.push("HEAD after delete must report not_found.");
    }

    const putCount = fake.requestLog.filter((entry) => entry.method === "PUT").length;
    const deleteRequests = fake.requestLog.filter((entry) => entry.method === "DELETE").length;
    if (putCount !== 1 || deleteRequests !== 1) {
      safeErrors.push(`Expected exactly one PUT and one DELETE; got PUT=${putCount} DELETE=${deleteRequests}.`);
    }
  } catch (error) {
    safeErrors.push(error instanceof Error ? "Harness failed with a safe Error." : "Harness failed.");
  } finally {
    setR2HttpTransportForTests(null);

    const restore = (key: keyof typeof previous, envKey: string) => {
      const value = previous[key];
      if (value === undefined) {
        delete process.env[envKey];
      } else {
        process.env[envKey] = value;
      }
    };
    restore("accountId", "R2_ACCOUNT_ID");
    restore("accessKeyId", "R2_ACCESS_KEY_ID");
    restore("secretAccessKey", "R2_SECRET_ACCESS_KEY");
    restore("bucketName", "R2_BUCKET_NAME");
    restore("endpoint", "R2_ENDPOINT");
  }

  return {
    ok: safeErrors.length === 0 && createCount === 1 && deleteCount === 1 && checksumMatched && absenceConfirmed,
    liveMode: false,
    createCount,
    deleteCount,
    headCount,
    storageKey,
    checksumMatched,
    absenceConfirmed,
    safeErrors
  };
}
