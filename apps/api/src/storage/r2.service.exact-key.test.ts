import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import {
  assertExactR2ObjectKey,
  buildR2SignedRequestForTests,
  deleteR2Object,
  headR2Object,
  setR2HttpTransportForTests,
  type R2HttpTransport
} from "./r2.service";

const VALID_KEY = "tenants/proof/years/2026/projects/demo/months/07/documents/file-1.pdf";

const ENV_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_ENDPOINT"
] as const;

const previousEnv = new Map<string, string | undefined>();

function snapshotEnv(): void {
  for (const key of ENV_KEYS) {
    previousEnv.set(key, process.env[key]);
  }
}

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    const value = previousEnv.get(key);
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function setConfiguredEnv(): void {
  process.env.R2_ACCOUNT_ID = "acct123";
  process.env.R2_ACCESS_KEY_ID = "AKIATESTKEYID";
  process.env.R2_SECRET_ACCESS_KEY = "super-secret-value-do-not-leak";
  process.env.R2_BUCKET_NAME = "staging-proof-bucket";
  process.env.R2_ENDPOINT = "https://acct123.r2.cloudflarestorage.com";
}

function clearConfiguredEnv(): void {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

afterEach(() => {
  setR2HttpTransportForTests(null);
  restoreEnv();
});

describe("assertExactR2ObjectKey", () => {
  it("accepts a canonical multi-segment object key", () => {
    const result = assertExactR2ObjectKey(VALID_KEY);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.storageKey, VALID_KEY);
    }
  });

  it("rejects empty, wildcard, traversal, and prefix-only keys", () => {
    const rejected = ["", "   ", "*", "tenants/*", "tenants/../x", "/", "tenants/proof/", "tenants//proof/a.pdf", "?"];
    for (const key of rejected) {
      const result = assertExactR2ObjectKey(key);
      assert.equal(result.ok, false, `expected reject for ${JSON.stringify(key)}`);
    }
  });
});

describe("r2.service HEAD/DELETE exact-key operations", () => {
  snapshotEnv();

  it("builds HEAD and DELETE signed requests without body and with exact encoded key", () => {
    setConfiguredEnv();
    const head = buildR2SignedRequestForTests({ method: "HEAD", storageKey: VALID_KEY });
    const del = buildR2SignedRequestForTests({ method: "DELETE", storageKey: VALID_KEY });
    const put = buildR2SignedRequestForTests({
      method: "PUT",
      storageKey: VALID_KEY,
      bodyHash: createHash("sha256").update("x").digest("hex"),
      contentType: "application/pdf"
    });
    const get = buildR2SignedRequestForTests({
      method: "GET",
      storageKey: VALID_KEY,
      expiresSeconds: 300
    });

    assert.ok(head);
    assert.ok(del);
    assert.ok(put);
    assert.ok(get);

    assert.equal(head.method, "HEAD");
    assert.equal(del.method, "DELETE");
    assert.match(head.pathname, /\/staging-proof-bucket\/tenants\/proof\//);
    assert.equal(head.headers["Content-Type"], undefined);
    assert.equal(del.headers["Content-Type"], undefined);
    assert.ok(put.headers["Content-Type"]);
    assert.equal(Object.keys(get.headers).length, 0);
    assert.match(get.url, /X-Amz-Signature=/);

    const serialized = JSON.stringify({ head, del, put, get });
    assert.equal(serialized.includes("super-secret-value-do-not-leak"), false);
    assert.equal(serialized.includes("R2_SECRET_ACCESS_KEY"), false);
  });

  it("HEAD existing object returns metadata without secrets", async () => {
    setConfiguredEnv();
    const transport: R2HttpTransport = async (_url, init) => {
      assert.equal(init?.method, "HEAD");
      assert.equal(init?.body, undefined);
      return new Response(null, {
        status: 200,
        headers: {
          "content-length": "42",
          "content-type": "application/pdf",
          etag: '"abc"',
          "last-modified": "Wed, 01 Jan 2020 00:00:00 GMT"
        }
      });
    };
    setR2HttpTransportForTests(transport);

    const result = await headR2Object(VALID_KEY);
    assert.equal(result.ok, true);
    assert.equal(result.exists, true);
    if (result.ok && result.exists) {
      assert.equal(result.contentLength, 42);
      assert.equal(result.contentType, "application/pdf");
      assert.equal(result.etag, '"abc"');
      assert.equal(result.lastModified, "Wed, 01 Jan 2020 00:00:00 GMT");
    }
    assert.equal(JSON.stringify(result).includes("super-secret"), false);
  });

  it("HEAD 404 returns typed not_found", async () => {
    setConfiguredEnv();
    setR2HttpTransportForTests(async () => new Response(null, { status: 404 }));
    const result = await headR2Object(VALID_KEY);
    assert.equal(result.ok, true);
    assert.equal(result.exists, false);
    if (result.ok && !result.exists) {
      assert.equal(result.reason, "not_found");
    }
  });

  it("HEAD 403 remains provider_error (not absence)", async () => {
    setConfiguredEnv();
    setR2HttpTransportForTests(async () => new Response(null, { status: 403 }));
    const result = await headR2Object(VALID_KEY);
    assert.equal(result.ok, false);
    assert.equal(result.exists, false);
    if (!result.ok) {
      assert.equal(result.reason, "provider_error");
    }
  });

  it("HEAD 500 remains provider_error", async () => {
    setConfiguredEnv();
    setR2HttpTransportForTests(async () => new Response(null, { status: 500 }));
    const result = await headR2Object(VALID_KEY);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "provider_error");
    }
  });

  it("DELETE success returns typed success with one request", async () => {
    setConfiguredEnv();
    let calls = 0;
    setR2HttpTransportForTests(async (_url, init) => {
      calls += 1;
      assert.equal(init?.method, "DELETE");
      assert.equal(init?.body, undefined);
      return new Response(null, { status: 204 });
    });
    const result = await deleteR2Object(VALID_KEY);
    assert.equal(calls, 1);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.deleted, true);
      assert.equal(result.alreadyAbsent, false);
    }
  });

  it("DELETE 404 is idempotent alreadyAbsent success", async () => {
    setConfiguredEnv();
    setR2HttpTransportForTests(async () => new Response(null, { status: 404 }));
    const result = await deleteR2Object(VALID_KEY);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.alreadyAbsent, true);
      assert.equal(result.deleted, true);
    }
  });

  it("DELETE 500 is not collapsed into success", async () => {
    setConfiguredEnv();
    setR2HttpTransportForTests(async () => new Response(null, { status: 500 }));
    const result = await deleteR2Object(VALID_KEY);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "provider_error");
    }
  });

  it("rejects unsafe keys without issuing a provider request", async () => {
    setConfiguredEnv();
    let calls = 0;
    setR2HttpTransportForTests(async () => {
      calls += 1;
      return new Response(null, { status: 200 });
    });
    const head = await headR2Object("tenants/*");
    const del = await deleteR2Object("../evil");
    assert.equal(calls, 0);
    assert.equal(head.ok, false);
    assert.equal(del.ok, false);
    if (!head.ok) assert.equal(head.reason, "invalid_key");
    if (!del.ok) assert.equal(del.reason, "invalid_key");
  });

  it("does not call provider when R2 is not configured", async () => {
    clearConfiguredEnv();
    let calls = 0;
    setR2HttpTransportForTests(async () => {
      calls += 1;
      return new Response(null, { status: 200 });
    });
    const head = await headR2Object(VALID_KEY);
    const del = await deleteR2Object(VALID_KEY);
    assert.equal(calls, 0);
    assert.equal(head.ok, false);
    assert.equal(del.ok, false);
    if (!head.ok) assert.equal(head.reason, "not_configured");
    if (!del.ok) assert.equal(del.reason, "not_configured");
  });
});
