import { createHash, createHmac, randomUUID } from "node:crypto";
import { getR2Config, type R2Config } from "./r2.config";

export type R2DocumentType = "invoices" | "bills" | "documents";

export type R2HttpMethod = "GET" | "PUT" | "HEAD" | "DELETE";

export interface StorageKeyInput {
  tenantSlugOrId: string;
  projectSlugOrId?: string | null;
  documentType: R2DocumentType;
  documentDate?: Date | null;
  originalFileName: string;
  /** When set, used for extension fallback when the filename has no allowed extension. */
  mimeType?: string;
}

export interface UploadObjectInput extends StorageKeyInput {
  body: Buffer;
  mimeType: string;
}

export interface UploadObjectResult {
  storageKey: string;
  publicUrl: string | null;
}

export type R2ExactKeyFailureReason = "not_configured" | "invalid_key" | "provider_error";

export type R2ObjectHeadResult =
  | {
      ok: true;
      exists: true;
      storageKey: string;
      contentLength: number | null;
      contentType: string | null;
      etag: string | null;
      lastModified: string | null;
    }
  | {
      ok: true;
      exists: false;
      storageKey: string;
      reason: "not_found";
    }
  | {
      ok: false;
      exists: false;
      storageKey: string;
      reason: R2ExactKeyFailureReason;
      safeMessage: string;
    };

/**
 * Delete contract: success is idempotent for provider not-found (404),
 * surfaced via `alreadyAbsent=true`. Unrelated provider failures remain `ok:false`.
 */
export type R2ObjectDeleteResult =
  | {
      ok: true;
      deleted: true;
      alreadyAbsent: boolean;
      storageKey: string;
    }
  | {
      ok: false;
      deleted: false;
      storageKey: string;
      reason: R2ExactKeyFailureReason;
      safeMessage: string;
    };

export type R2HttpTransport = (input: string | URL, init?: RequestInit) => Promise<Response>;

const ALLOWED_DOCUMENT_TYPES = new Set<R2DocumentType>(["invoices", "bills", "documents"]);
const ALLOWED_MIME_TYPES = new Map([
  ["application/pdf", "pdf"],
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"]
]);
const ALLOWED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "webp"]);
export const R2_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const R2_REGION = "auto";
const R2_SERVICE = "s3";
const EMPTY_BODY_SHA256 = createHash("sha256").update("").digest("hex");

let r2HttpTransport: R2HttpTransport = (input, init) => fetch(input, init);

/**
 * Test-only transport injection. Pass null to restore global fetch.
 * Never used for production live paths unless tests/harness explicitly set it.
 */
export function setR2HttpTransportForTests(transport: R2HttpTransport | null): void {
  r2HttpTransport = transport ?? ((input, init) => fetch(input, init));
}

export function getR2HttpTransportForTests(): R2HttpTransport {
  return r2HttpTransport;
}

function sanitizePathSegment(value: string, fallback: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    // Dots are not allowed in path segments — prevents "../" surviving as ".."
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized.slice(0, 96) || fallback;
}

function getSafeExtension(fileName: string, mimeType: string): string | null {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (extension && ALLOWED_EXTENSIONS.has(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  return ALLOWED_MIME_TYPES.get(mimeType) ?? null;
}

function toAmzDate(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function toDateStamp(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function getSigningKey(secretAccessKey: string, dateStamp: string): Buffer {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, R2_REGION);
  const serviceKey = hmac(regionKey, R2_SERVICE);
  return hmac(serviceKey, "aws4_request");
}

function encodePath(path: string): string {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function getObjectUrl(config: R2Config, storageKey: string): URL {
  return new URL(`${config.bucketName}/${encodePath(storageKey)}`, `${config.endpoint}/`);
}

/**
 * Strict exact-object-key guard for HEAD/DELETE.
 * Rejects empty, wildcard, traversal, and prefix/directory-only keys.
 * Does not accept arrays, bucket names, or endpoint overrides (not in signature).
 */
export function assertExactR2ObjectKey(storageKey: string): { ok: true; storageKey: string } | { ok: false; safeMessage: string } {
  if (typeof storageKey !== "string") {
    return { ok: false, safeMessage: "Storage key must be a single exact object key string." };
  }

  if (storageKey !== storageKey.trim() || storageKey.trim().length === 0) {
    return { ok: false, safeMessage: "Storage key must be a non-empty exact object key." };
  }

  const key = storageKey.trim();

  if (key === "/" || key.startsWith("/") || key.endsWith("/") || key.includes("//")) {
    return { ok: false, safeMessage: "Storage key must be a full object key, not a path prefix." };
  }

  if (key.includes("..") || key.includes("*") || key.includes("?") || key.includes("\\")) {
    return { ok: false, safeMessage: "Storage key contains forbidden exact-key characters." };
  }

  const segments = key.split("/");
  if (segments.length < 2 || segments.some((segment) => segment.length === 0)) {
    return { ok: false, safeMessage: "Storage key must include a multi-segment exact object path." };
  }

  return { ok: true, storageKey: key };
}

function signRequest({
  config,
  method,
  url,
  bodyHash,
  contentType,
  expiresSeconds
}: {
  config: R2Config;
  method: R2HttpMethod;
  url: URL;
  bodyHash: string;
  contentType?: string;
  expiresSeconds?: number;
}): Record<string, string> {
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = toDateStamp(now);
  const credentialScope = `${dateStamp}/${R2_REGION}/${R2_SERVICE}/aws4_request`;
  const host = url.host;
  const isPresigned = Boolean(expiresSeconds);
  // PUT keeps content-type in the signature; HEAD/DELETE/GET header auth use empty-body hash without content-type.
  const includeContentType = method === "PUT" && !isPresigned;

  if (isPresigned) {
    url.searchParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    url.searchParams.set("X-Amz-Credential", `${config.accessKeyId}/${credentialScope}`);
    url.searchParams.set("X-Amz-Date", amzDate);
    url.searchParams.set("X-Amz-Expires", String(expiresSeconds));
    url.searchParams.set("X-Amz-SignedHeaders", "host");
  }

  const signedHeaders = isPresigned
    ? "host"
    : includeContentType
      ? "content-type;host;x-amz-content-sha256;x-amz-date"
      : "host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = isPresigned
    ? `host:${host}\n`
    : includeContentType
      ? `content-type:${contentType ?? "application/octet-stream"}\nhost:${host}\nx-amz-content-sha256:${bodyHash}\nx-amz-date:${amzDate}\n`
      : `host:${host}\nx-amz-content-sha256:${bodyHash}\nx-amz-date:${amzDate}\n`;
  const canonicalQuery = Array.from(url.searchParams.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  const canonicalRequest = [
    method,
    url.pathname,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    isPresigned ? "UNSIGNED-PAYLOAD" : bodyHash
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex")
  ].join("\n");
  const signature = createHmac("sha256", getSigningKey(config.secretAccessKey, dateStamp))
    .update(stringToSign)
    .digest("hex");

  if (isPresigned) {
    url.searchParams.set("X-Amz-Signature", signature);
    return {};
  }

  const headers: Record<string, string> = {
    Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "x-amz-content-sha256": bodyHash,
    "x-amz-date": amzDate
  };

  if (includeContentType) {
    headers["Content-Type"] = contentType ?? "application/octet-stream";
  }

  return headers;
}

/**
 * Builds signed request headers for unit tests without performing network IO.
 * Never returns the secret access key; Authorization contains a signature only.
 */
export function buildR2SignedRequestForTests(input: {
  method: R2HttpMethod;
  storageKey: string;
  bodyHash?: string;
  contentType?: string;
  expiresSeconds?: number;
}): {
  method: R2HttpMethod;
  url: string;
  pathname: string;
  headers: Record<string, string>;
  signedHeaderNames: string[];
} | null {
  const config = getR2Config();
  if (!config) {
    return null;
  }

  const keyCheck = assertExactR2ObjectKey(input.storageKey);
  if (!keyCheck.ok && input.method !== "PUT") {
    return null;
  }

  const storageKey = keyCheck.ok ? keyCheck.storageKey : input.storageKey.trim();
  const url = getObjectUrl(config, storageKey);
  const bodyHash = input.bodyHash ?? EMPTY_BODY_SHA256;
  const headers = signRequest({
    bodyHash,
    config,
    contentType: input.contentType,
    expiresSeconds: input.expiresSeconds,
    method: input.method,
    url
  });

  return {
    method: input.method,
    url: url.toString(),
    pathname: url.pathname,
    headers,
    signedHeaderNames: Object.keys(headers).sort()
  };
}

export function validateR2DocumentType(value: string): value is R2DocumentType {
  return ALLOWED_DOCUMENT_TYPES.has(value as R2DocumentType);
}

export function validateR2Upload(file: { body: Buffer; mimeType: string; originalFileName: string }) {
  if (file.body.length === 0 || file.body.length > R2_MAX_FILE_SIZE_BYTES) {
    return false;
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
    return false;
  }

  return Boolean(getSafeExtension(file.originalFileName, file.mimeType));
}

export function buildR2StorageKey(input: StorageKeyInput): string {
  if (!validateR2DocumentType(input.documentType)) {
    throw new Error("Invalid R2 document type.");
  }

  const date = input.documentDate && !Number.isNaN(input.documentDate.getTime()) ? input.documentDate : new Date();
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const tenantSegment = sanitizePathSegment(input.tenantSlugOrId, "tenant");
  const projectSegment = input.projectSlugOrId ? sanitizePathSegment(input.projectSlugOrId, "no-project") : "no-project";
  const mimeType = input.mimeType ?? "application/octet-stream";
  const extension = getSafeExtension(input.originalFileName, mimeType) ?? "bin";
  const baseName = sanitizePathSegment(input.originalFileName.replace(/\.[^.]+$/, ""), "document");
  const safeFileName = `${baseName}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;

  return [
    "tenants",
    tenantSegment,
    "years",
    year,
    "projects",
    projectSegment,
    "months",
    month,
    input.documentType,
    safeFileName
  ].join("/");
}

export async function uploadR2Object(input: UploadObjectInput): Promise<UploadObjectResult> {
  const config = getR2Config();
  if (!config) {
    throw new Error("R2 storage is not configured.");
  }

  if (!validateR2Upload({ body: input.body, mimeType: input.mimeType, originalFileName: input.originalFileName })) {
    throw new Error("R2 upload validation failed.");
  }

  const storageKey = buildR2StorageKey(input);
  const url = getObjectUrl(config, storageKey);
  const bodyHash = createHash("sha256").update(input.body).digest("hex");
  const headers = signRequest({
    bodyHash,
    config,
    contentType: input.mimeType,
    method: "PUT",
    url
  });

  const response = await r2HttpTransport(url, {
    body: input.body.buffer.slice(input.body.byteOffset, input.body.byteOffset + input.body.byteLength) as ArrayBuffer,
    headers,
    method: "PUT"
  });

  if (!response.ok) {
    throw new Error("R2 upload request failed.");
  }

  return {
    storageKey,
    publicUrl: null
  };
}

export function getSignedR2ReadUrl(storageKey: string, expiresSeconds = 300): string | null {
  const config = getR2Config();
  if (!config || !storageKey) {
    return null;
  }

  const keyCheck = assertExactR2ObjectKey(storageKey);
  if (!keyCheck.ok) {
    return null;
  }

  const url = getObjectUrl(config, keyCheck.storageKey);
  signRequest({
    bodyHash: EMPTY_BODY_SHA256,
    config,
    expiresSeconds,
    method: "GET",
    url
  });

  return url.toString();
}

function parseOptionalPositiveInt(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * Exact-key HEAD. Never lists the bucket. Never mutates the object.
 * 404 → ok/exists false (not_found). Auth/5xx → provider_error (not absence).
 */
export async function headR2Object(storageKey: string): Promise<R2ObjectHeadResult> {
  const keyCheck = assertExactR2ObjectKey(storageKey);
  if (!keyCheck.ok) {
    return {
      ok: false,
      exists: false,
      storageKey: typeof storageKey === "string" ? storageKey.trim() : "",
      reason: "invalid_key",
      safeMessage: keyCheck.safeMessage
    };
  }

  const config = getR2Config();
  if (!config) {
    return {
      ok: false,
      exists: false,
      storageKey: keyCheck.storageKey,
      reason: "not_configured",
      safeMessage: "R2 storage is not configured."
    };
  }

  const url = getObjectUrl(config, keyCheck.storageKey);
  const headers = signRequest({
    bodyHash: EMPTY_BODY_SHA256,
    config,
    method: "HEAD",
    url
  });

  let response: Response;
  try {
    response = await r2HttpTransport(url, {
      headers,
      method: "HEAD"
    });
  } catch {
    return {
      ok: false,
      exists: false,
      storageKey: keyCheck.storageKey,
      reason: "provider_error",
      safeMessage: "R2 HEAD request failed."
    };
  }

  if (response.status === 404) {
    return {
      ok: true,
      exists: false,
      storageKey: keyCheck.storageKey,
      reason: "not_found"
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      exists: false,
      storageKey: keyCheck.storageKey,
      reason: "provider_error",
      safeMessage: `R2 HEAD request failed with status ${response.status}.`
    };
  }

  return {
    ok: true,
    exists: true,
    storageKey: keyCheck.storageKey,
    contentLength: parseOptionalPositiveInt(response.headers.get("content-length")),
    contentType: response.headers.get("content-type"),
    etag: response.headers.get("etag"),
    lastModified: response.headers.get("last-modified")
  };
}

/**
 * Exact-key DELETE. One request only. No prefix/batch/list.
 * Provider 404 is treated as idempotent success with alreadyAbsent=true.
 */
export async function deleteR2Object(storageKey: string): Promise<R2ObjectDeleteResult> {
  const keyCheck = assertExactR2ObjectKey(storageKey);
  if (!keyCheck.ok) {
    return {
      ok: false,
      deleted: false,
      storageKey: typeof storageKey === "string" ? storageKey.trim() : "",
      reason: "invalid_key",
      safeMessage: keyCheck.safeMessage
    };
  }

  const config = getR2Config();
  if (!config) {
    return {
      ok: false,
      deleted: false,
      storageKey: keyCheck.storageKey,
      reason: "not_configured",
      safeMessage: "R2 storage is not configured."
    };
  }

  const url = getObjectUrl(config, keyCheck.storageKey);
  const headers = signRequest({
    bodyHash: EMPTY_BODY_SHA256,
    config,
    method: "DELETE",
    url
  });

  let response: Response;
  try {
    response = await r2HttpTransport(url, {
      headers,
      method: "DELETE"
    });
  } catch {
    return {
      ok: false,
      deleted: false,
      storageKey: keyCheck.storageKey,
      reason: "provider_error",
      safeMessage: "R2 DELETE request failed."
    };
  }

  if (response.status === 404) {
    return {
      ok: true,
      deleted: true,
      alreadyAbsent: true,
      storageKey: keyCheck.storageKey
    };
  }

  // S3/R2 typically return 204 No Content on successful delete; also accept 200.
  if (response.status === 204 || response.status === 200) {
    return {
      ok: true,
      deleted: true,
      alreadyAbsent: false,
      storageKey: keyCheck.storageKey
    };
  }

  return {
    ok: false,
    deleted: false,
    storageKey: keyCheck.storageKey,
    reason: "provider_error",
    safeMessage: `R2 DELETE request failed with status ${response.status}.`
  };
}
