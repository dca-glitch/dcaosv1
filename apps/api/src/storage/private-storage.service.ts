import { getR2Config, getR2EnvPresence } from "./r2.config";
import { getSignedR2ReadUrl, uploadR2Object, type R2DocumentType } from "./r2.service";

export type PrivateStorageNamespace =
  | "invoice-document"
  | "bill-document"
  | "credit-note-document"
  | "ai-delivery-deliverable"
  | "ai-delivery-asset"
  | "ai-delivery-report"
  | "generic-document";

export interface PrivateStorageStatus {
  configured: boolean;
  missingEnvKeys: string[];
  mode: "disabled" | "private-r2";
  provider: "r2";
}

export interface PutPrivateStorageObjectInput {
  body: Buffer;
  documentDate?: Date | null;
  mimeType: string;
  namespace: PrivateStorageNamespace;
  originalFileName: string;
  projectSlugOrId?: string | null;
  tenantSlugOrId: string;
}

export interface PutPrivateStorageObjectResult {
  provider: "r2";
  storageKey: string;
}

export interface PrivateStorageDownloadReference {
  downloadUrl: string;
  expiresSeconds: number;
  provider: "r2";
}

const DEFAULT_DOWNLOAD_EXPIRY_SECONDS = 300;

function getDocumentType(namespace: PrivateStorageNamespace): R2DocumentType {
  if (namespace === "invoice-document") {
    return "invoices";
  }

  if (namespace === "bill-document") {
    return "bills";
  }

  if (namespace === "ai-delivery-asset" || namespace === "ai-delivery-report") {
    return "documents";
  }

  return "documents";
}

function getFileNamePrefix(namespace: PrivateStorageNamespace): string {
  switch (namespace) {
    case "credit-note-document":
      return "credit-note";
    case "ai-delivery-deliverable":
      return "deliverable";
    case "ai-delivery-report":
      return "report";
    case "ai-delivery-asset":
      return "asset";
    case "generic-document":
      return "document";
    default:
      return "";
  }
}

function getMissingStorageEnvKeys() {
  const presence = getR2EnvPresence();
  return Object.entries(presence)
    .filter(([, present]) => !present)
    .map(([key]) => key);
}

function prefixFileName(fileName: string, namespace: PrivateStorageNamespace): string {
  const prefix = getFileNamePrefix(namespace);
  return prefix ? `${prefix}-${fileName}` : fileName;
}

export function getPrivateStorageStatus(): PrivateStorageStatus {
  const configured = Boolean(getR2Config());

  return {
    configured,
    missingEnvKeys: configured ? [] : getMissingStorageEnvKeys(),
    mode: configured ? "private-r2" : "disabled",
    provider: "r2"
  };
}

export async function putPrivateStorageObject(
  input: PutPrivateStorageObjectInput
): Promise<PutPrivateStorageObjectResult | null> {
  if (!getR2Config()) {
    return null;
  }

  const upload = await uploadR2Object({
    body: input.body,
    documentDate: input.documentDate,
    documentType: getDocumentType(input.namespace),
    mimeType: input.mimeType,
    originalFileName: prefixFileName(input.originalFileName, input.namespace),
    projectSlugOrId: input.projectSlugOrId ?? null,
    tenantSlugOrId: input.tenantSlugOrId
  });

  return {
    provider: "r2",
    storageKey: upload.storageKey
  };
}

export function getPrivateStorageDownloadReference(
  storageKey: string,
  expiresSeconds = DEFAULT_DOWNLOAD_EXPIRY_SECONDS
): PrivateStorageDownloadReference | null {
  if (!storageKey) {
    return null;
  }

  const downloadUrl = getSignedR2ReadUrl(storageKey, expiresSeconds);
  if (!downloadUrl) {
    return null;
  }

  return {
    downloadUrl,
    expiresSeconds,
    provider: "r2"
  };
}
