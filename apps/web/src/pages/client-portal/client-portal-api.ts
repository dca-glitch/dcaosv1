const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";
const SESSION_STORAGE_KEY = "dcaosv1.authToken";

export type ApiSuccess<T> = {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

export function getClientPortalAuthToken(): string | null {
  return sessionStorage.getItem(SESSION_STORAGE_KEY);
}

function isApiEnvelope<T>(value: unknown): value is ApiResponse<T> {
  if (!value || typeof value !== "object") return false;
  const envelope = value as { ok: unknown };
  return envelope.ok === true || envelope.ok === false;
}

export async function clientPortalApiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const token = options.token ?? getClientPortalAuthToken();
  const headers = new Headers();
  headers.set("Accept", "application/json");

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/client-portal${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  } catch {
    return {
      ok: false,
      error: {
        code: "NETWORK_ERROR",
        message: "Could not reach the client portal. Check your connection and try again."
      }
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      error: {
        code: "INVALID_RESPONSE",
        message: "The server returned an unreadable response."
      }
    };
  }

  if (!isApiEnvelope<T>(payload)) {
    return {
      ok: false,
      error: {
        code: "INVALID_ENVELOPE",
        message: "The server response was not in the expected format."
      }
    };
  }

  if (!response.ok && payload.ok) {
    return {
      ok: false,
      error: {
        code: "REQUEST_FAILED",
        message: "Request could not be completed."
      }
    };
  }

  return payload;
}

export type PendingApprovalSummary = {
  id: string;
  title: string;
  status: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string | null;
  createdAt: string;
};

export type PendingApprovalsResponse = {
  pendingApprovals: PendingApprovalSummary[];
  count: number;
};

export type DeliverableImageApproval = {
  id: string;
  title: string;
  altText: string;
  imageUrl: string | null;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
};

export type DeliverableForApproval = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  category: string | null;
  scheduledPublishAt: string | null;
  status: string;
  bodyContent: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string | null;
  createdAt: string;
  images: DeliverableImageApproval[];
};

export type DeliverableMetadataPatchResponse = {
  deliverable: {
    id: string;
    title: string;
    description: string | null;
    tags: string[];
    category: string | null;
    scheduledPublishAt: string | null;
    updatedAt: string;
  };
};

export type DeliverableForApprovalResponse = {
  deliverable: DeliverableForApproval;
};

export function navigateToClientPortalHash(path: string) {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  window.location.hash = `#/${normalized}`;
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function parseClientPortalHash(hash: string): { view: "archive" | "pending-approvals" | "approve"; deliverableId?: string } {
  const value = hash.replace(/^#\/?/, "");
  if (value === "client-portal/pending-approvals") {
    return { view: "pending-approvals" };
  }
  const approveMatch = value.match(/^client-portal\/deliverables\/([^/]+)\/approve$/);
  if (approveMatch) {
    return { view: "approve", deliverableId: approveMatch[1] };
  }
  return { view: "archive" };
}

export function formatApprovalDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value.slice(0, 10) : parsed.toLocaleDateString();
}
