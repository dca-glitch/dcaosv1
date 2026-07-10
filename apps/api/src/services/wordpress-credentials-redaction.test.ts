import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertWordPressCredentialsNeverSerialize,
  redactWordPressCredentialMetadata,
  redactWordPressCredentialShape,
  redactWordPressSerializableValue
} from "./wordpress-credentials-redaction";

describe("wordpress-credentials-redaction (G293 / G545)", () => {
  it("redacts credential policy shape to presence flags only", () => {
    const raw = "wp-app-password-plain";
    const shape = redactWordPressCredentialShape({
      configured: true,
      encryptionAvailable: true,
      updatedAt: new Date("2026-07-10T00:00:00.000Z"),
      applicationPassword: raw,
      ciphertext: "ciphertext-blob",
      token: "secret-token"
    });

    const serialized = JSON.stringify(shape);
    assert.deepEqual(shape, {
      configured: true,
      encryptionAvailable: true,
      updatedAt: "2026-07-10T00:00:00.000Z"
    });
    assert.equal(serialized.includes(raw), false);
    assert.equal(serialized.includes("applicationPassword"), false);
    assert.equal(serialized.includes("ciphertext"), false);
    assert.equal(serialized.includes("token"), false);
    assert.equal(assertWordPressCredentialsNeverSerialize(shape), true);
  });

  it("redacts metadata to host and presence only", () => {
    const metadata = redactWordPressCredentialMetadata({
      credentialsPresent: true,
      siteUrl: "https://example.test/client-blog/path?token=do-not-serialize",
      applicationPassword: "must-not-appear"
    });

    const serialized = JSON.stringify(metadata);
    assert.deepEqual(metadata, {
      credentialsPresent: true,
      siteUrlHost: "example.test"
    });
    assert.equal(serialized.includes("do-not-serialize"), false);
    assert.equal(serialized.includes("must-not-appear"), false);
    assert.equal(serialized.includes("client-blog"), false);
  });

  it("strips credential keys from nested serializable values", () => {
    const redacted = redactWordPressSerializableValue({
      ok: true,
      nested: {
        applicationPassword: "raw-secret",
        ciphertext: "blob",
        label: "staging"
      }
    });

    const serialized = JSON.stringify(redacted);
    assert.equal(serialized.includes("raw-secret"), false);
    assert.equal(serialized.includes("applicationPassword"), false);
    assert.equal(serialized.includes("ciphertext"), false);
    assert.equal((redacted as { nested: { label: string } }).nested.label, "staging");
  });

  it("redacts sensitive string value hints", () => {
    const redacted = redactWordPressSerializableValue({
      note: "bearer abc.def.ghi leaked",
      path: "/safe"
    });
    assert.equal((redacted as { note: string }).note, "[REDACTED]");
    assert.equal((redacted as { path: string }).path, "/safe");
  });

  it("G545 drops authHeader / apiKey / masterKey keys from nested objects", () => {
    const redacted = redactWordPressSerializableValue({
      status: "ok",
      authHeader: "Basic abc123",
      apiKey: "key-value",
      masterKey: "master-value",
      safe: true
    });
    const serialized = JSON.stringify(redacted);
    assert.equal(serialized.includes("authHeader"), false);
    assert.equal(serialized.includes("apiKey"), false);
    assert.equal(serialized.includes("masterKey"), false);
    assert.equal(serialized.includes("Basic abc123"), false);
    assert.equal((redacted as { safe: boolean }).safe, true);
  });

  it("G545 treats invalid siteUrl as null host without leaking path", () => {
    const metadata = redactWordPressCredentialMetadata({
      credentialsPresent: false,
      siteUrl: "not-a-url/with/path?token=x"
    });
    assert.equal(metadata.siteUrlHost, null);
    assert.equal(JSON.stringify(metadata).includes("token"), false);
  });
});
