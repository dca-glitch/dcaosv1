/**
 * Google Drive / Google Docs provider service
 *
 * Service-account-based export foundation for AI Delivery deliverables.
 * Returns provider_disabled when credentials are not configured.
 *
 * Required env vars (all must be present to enable exports):
 *   GOOGLE_DRIVE_EXPORT_ENABLED=true
 *   GOOGLE_DRIVE_ROOT_FOLDER_ID   — ID of the "DCA OS Lite Exports" root folder in Drive
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL  — service account client_email
 *   GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY — service account private_key (PEM, \n allowed)
 *
 * Folder path created per export:
 *   <root>/Clients/<clientName>/<targetMonth> - <projectName>/Deliverables/
 *
 * Security rules:
 *   - Admin/owner only (enforced at route level)
 *   - No client public sharing in this block
 *   - storageKey and credentials never appear in responses
 *   - Credentials are read from env only, never committed or logged
 */

export type GoogleDocExportProviderStatus =
  | "exported"
  | "provider_disabled"
  | "provider_not_configured"
  | "error";

export interface GoogleDocExportResult {
  ok: boolean;
  deliverableId: string;
  hasGoogleDocExport: boolean;
  exportUrl: string | null;
  docTitle: string | null;
  folderPath: string | null;
  providerStatus: GoogleDocExportProviderStatus;
  providerDisabledReason?: string | null;
  errorMessage: string | null;
  generatedAt: string | null;
}

export interface GoogleDriveExportInput {
  deliverableId: string;
  deliverableTitle: string;
  deliverableDescription: string | null;
  deliverableNotes: string | null;
  contentDraftTitle: string | null;
  contentDraftBody: string | null;
  clientName: string;
  projectName: string;
  targetMonth: string;
}

interface GoogleDriveConfig {
  rootFolderId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

function readEnvString(key: string): string | null {
  const value = process.env[key]?.trim();
  return value ? value : null;
}

/**
 * Returns the Google Drive config if all required env vars are present and export is enabled.
 * Returns null when any required config is absent (safe provider_disabled path).
 */
export function getGoogleDriveConfig(): GoogleDriveConfig | null {
  const enabled = readEnvString("GOOGLE_DRIVE_EXPORT_ENABLED");
  if (enabled !== "true") {
    return null;
  }

  const rootFolderId = readEnvString("GOOGLE_DRIVE_ROOT_FOLDER_ID");
  const serviceAccountEmail = readEnvString("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKeyRaw = readEnvString("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");

  if (!rootFolderId || !serviceAccountEmail || !privateKeyRaw) {
    return null;
  }

  // Env variables often encode newlines as literal \n — normalize to real newlines
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  return { rootFolderId, serviceAccountEmail, privateKey };
}

/**
 * Returns a summary of which Google Drive env vars are present (no values, presence only).
 * Safe to include in provider_not_configured responses.
 */
export function getGoogleDriveEnvPresence(): Record<string, boolean> {
  return {
    GOOGLE_DRIVE_EXPORT_ENABLED: Boolean(readEnvString("GOOGLE_DRIVE_EXPORT_ENABLED")),
    GOOGLE_DRIVE_ROOT_FOLDER_ID: Boolean(readEnvString("GOOGLE_DRIVE_ROOT_FOLDER_ID")),
    GOOGLE_SERVICE_ACCOUNT_EMAIL: Boolean(readEnvString("GOOGLE_SERVICE_ACCOUNT_EMAIL")),
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: Boolean(readEnvString("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"))
  };
}

/**
 * Sanitize a string for use as a Google Drive folder or file name.
 * Removes characters that can cause Drive API issues.
 * Trims and collapses whitespace.
 */
export function sanitizeDriveName(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100) || "Untitled";
}

/**
 * Build the ordered folder path segments for a deliverable export.
 * Structure: Clients / <client> / <targetMonth> - <project> / Deliverables
 */
export function buildDeliverableFolderSegments(
  clientName: string,
  projectName: string,
  targetMonth: string
): string[] {
  const clientSegment = sanitizeDriveName(clientName);
  // Use "YYYY-MM - Project Name" as the subfolder for easy sorting
  const monthProjectSegment = sanitizeDriveName(`${targetMonth} - ${projectName}`);
  return ["Clients", clientSegment, monthProjectSegment, "Deliverables"];
}

/**
 * Find or create a Drive folder by name within a given parent folder.
 * Deterministic: when multiple folders share the same name, uses the first result (oldest).
 * Never deletes or renames existing folders.
 */
async function resolveOrCreateFolder(
  drive: import("googleapis").drive_v3.Drive,
  parentId: string,
  folderName: string
): Promise<string> {
  const safeName = sanitizeDriveName(folderName);

  // Lookup first to avoid duplicates
  const list = await drive.files.list({
    q: `name='${safeName.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id,name)",
    spaces: "drive"
  });

  const existing = list.data.files?.[0];
  if (existing?.id) {
    return existing.id;
  }

  const created = await drive.files.create({
    requestBody: {
      name: safeName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId]
    },
    fields: "id"
  });

  if (!created.data.id) {
    throw new Error(`Failed to create Drive folder: ${safeName}`);
  }

  return created.data.id;
}

/**
 * Resolve the full folder path, creating any missing folders along the way.
 * Returns the final folder ID and the human-readable path string.
 */
async function resolveFolderPath(
  drive: import("googleapis").drive_v3.Drive,
  rootFolderId: string,
  segments: string[]
): Promise<{ folderId: string; folderPath: string }> {
  let currentId = rootFolderId;
  const resolvedSegments: string[] = ["DCA OS Lite Exports"];

  for (const segment of segments) {
    currentId = await resolveOrCreateFolder(drive, currentId, segment);
    resolvedSegments.push(segment);
  }

  return {
    folderId: currentId,
    folderPath: resolvedSegments.join(" / ")
  };
}

/**
 * Build a plain-text document body from deliverable content.
 * Used as the initial Google Doc content.
 */
function buildDocBody(input: GoogleDriveExportInput): string {
  const lines: string[] = [];
  lines.push(input.deliverableTitle);
  lines.push("");
  if (input.deliverableDescription) {
    lines.push(input.deliverableDescription);
    lines.push("");
  }
  if (input.contentDraftTitle) {
    lines.push(`Content Draft: ${input.contentDraftTitle}`);
    lines.push("");
  }
  if (input.contentDraftBody) {
    lines.push(input.contentDraftBody);
    lines.push("");
  }
  if (input.deliverableNotes) {
    lines.push("Admin notes:");
    lines.push(input.deliverableNotes);
    lines.push("");
  }
  lines.push(`Exported: ${new Date().toISOString()}`);
  return lines.join("\n");
}

/**
 * Export an AI Delivery deliverable to Google Docs.
 *
 * When credentials are not configured, returns provider_disabled immediately.
 * When configured, creates the deterministic folder path and a new Google Doc.
 * Does not share the document — visibility stays internal/admin-only.
 */
export async function exportDeliverableToGoogleDoc(
  input: GoogleDriveExportInput
): Promise<GoogleDocExportResult> {
  const config = getGoogleDriveConfig();

  if (!config) {
    const presence = getGoogleDriveEnvPresence();
    const hasEnabledFlag = presence["GOOGLE_DRIVE_EXPORT_ENABLED"];
    return {
      ok: false,
      deliverableId: input.deliverableId,
      hasGoogleDocExport: false,
      exportUrl: null,
      docTitle: null,
      folderPath: null,
      providerStatus: hasEnabledFlag ? "provider_not_configured" : "provider_disabled",
      providerDisabledReason: hasEnabledFlag
        ? "Google Drive export is enabled but required credentials are missing. Set GOOGLE_DRIVE_ROOT_FOLDER_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY."
        : "Google Drive export is not enabled. Set GOOGLE_DRIVE_EXPORT_ENABLED=true and provide service account credentials to activate.",
      errorMessage: null,
      generatedAt: null
    };
  }

  try {
    // Dynamic import keeps googleapis out of the module graph when not configured
    const { google } = await import("googleapis");

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.serviceAccountEmail,
        private_key: config.privateKey
      },
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/documents"
      ]
    });

    const drive = google.drive({ version: "v3", auth });
    const docs = google.docs({ version: "v1", auth });

    const segments = buildDeliverableFolderSegments(
      input.clientName,
      input.projectName,
      input.targetMonth
    );

    const { folderId, folderPath } = await resolveFolderPath(drive, config.rootFolderId, segments);

    const docTitle = sanitizeDriveName(`${input.deliverableTitle} - ${input.targetMonth}`);

    // Create the Google Doc in the resolved Deliverables folder
    const docFile = await drive.files.create({
      requestBody: {
        name: docTitle,
        mimeType: "application/vnd.google-apps.document",
        parents: [folderId]
      },
      fields: "id,webViewLink"
    });

    const docId = docFile.data.id;
    const exportUrl = docFile.data.webViewLink ?? null;

    if (!docId) {
      throw new Error("Google Drive file creation did not return a document ID.");
    }

    // Insert initial content into the document
    const bodyText = buildDocBody(input);
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: bodyText
            }
          }
        ]
      }
    });

    return {
      ok: true,
      deliverableId: input.deliverableId,
      hasGoogleDocExport: true,
      exportUrl,
      docTitle,
      folderPath,
      providerStatus: "exported",
      providerDisabledReason: null,
      errorMessage: null,
      generatedAt: new Date().toISOString()
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error during Google Drive export.";

    return {
      ok: false,
      deliverableId: input.deliverableId,
      hasGoogleDocExport: false,
      exportUrl: null,
      docTitle: null,
      folderPath: null,
      providerStatus: "error",
      providerDisabledReason: null,
      errorMessage,
      generatedAt: null
    };
  }
}
