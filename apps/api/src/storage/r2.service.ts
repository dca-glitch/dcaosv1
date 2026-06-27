import { createHash, createHmac, randomUUID } from "node:crypto";
import { getR2Config, type R2Config } from "./r2.config";

export type R2DocumentType = "invoices" | "bills" | "documents";

export interface StorageKeyInput {
  tenantSlugOrId: string;
  projectSlugOrId?: string | null;
  documentType: R2DocumentType;
  documentDate?: Date | null;
  originalFileName: string;
}

export interface UploadObjectInput extends StorageKeyInput {
  body: Buffer;
  mimeType: string;
}

export interface UploadObjectResult {
  storageKey: string;
  publicUrl: string | null;
}

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

function sanitizePathSegment(value: string, fallback: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
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

function signRequest({
  config,
  method,
  url,
  bodyHash,
  contentType,
  expiresSeconds
}: {
  config: R2Config;
  method: "GET" | "PUT";
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

  if (expiresSeconds) {
    url.searchParams.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
    url.searchParams.set("X-Amz-Credential", `${config.accessKeyId}/${credentialScope}`);
    url.searchParams.set("X-Amz-Date", amzDate);
    url.searchParams.set("X-Amz-Expires", String(expiresSeconds));
    url.searchParams.set("X-Amz-SignedHeaders", "host");
  }

  const signedHeaders = expiresSeconds ? "host" : "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders = expiresSeconds
    ? `host:${host}\n`
    : `content-type:${contentType ?? "application/octet-stream"}\nhost:${host}\nx-amz-content-sha256:${bodyHash}\nx-amz-date:${amzDate}\n`;
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
    expiresSeconds ? "UNSIGNED-PAYLOAD" : bodyHash
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

  if (expiresSeconds) {
    url.searchParams.set("X-Amz-Signature", signature);
    return {};
  }

  return {
    Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    "Content-Type": contentType ?? "application/octet-stream",
    "x-amz-content-sha256": bodyHash,
    "x-amz-date": amzDate
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
  const extension = getSafeExtension(input.originalFileName, "application/octet-stream") ?? "bin";
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

  const response = await fetch(url, {
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

  const url = getObjectUrl(config, storageKey);
  signRequest({
    bodyHash: EMPTY_BODY_SHA256,
    config,
    expiresSeconds,
    method: "GET",
    url
  });

  return url.toString();
}
