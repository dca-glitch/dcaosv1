/*
 * Canonical STATUS map (SPEC §3.1).
 * Colors reference P1A CSS custom properties only — no hex/rgba literals here.
 */

import type { CSSProperties } from "react";

export const STATUS_KEYS = [
  "draft",
  "ready",
  "in_progress",
  "in_review",
  "awaiting_client",
  "changes_requested",
  "approved",
  "completed",
  "published",
  "blocked",
  "failed",
  "overdue",
  "archived",
] as const;

export type StatusKey = (typeof STATUS_KEYS)[number];

export type StatusVisual = {
  label: string;
  /** CSS custom property for text color */
  text: string;
  /** CSS custom property for background */
  bg: string;
  /** CSS custom property for border */
  border: string;
};

/** kebab-case token suffix used in --status-{token}-* */
export function statusTokenSuffix(key: StatusKey): string {
  return key.replace(/_/g, "-");
}

function statusVars(key: StatusKey): Pick<StatusVisual, "text" | "bg" | "border"> {
  const token = statusTokenSuffix(key);
  return {
    text: `var(--status-${token}-text)`,
    bg: `var(--status-${token}-bg)`,
    border: `var(--status-${token}-border)`,
  };
}

export const STATUS: Record<StatusKey, StatusVisual> = {
  draft: { label: "Draft", ...statusVars("draft") },
  ready: { label: "Ready for review", ...statusVars("ready") },
  in_progress: { label: "In progress", ...statusVars("in_progress") },
  in_review: { label: "Needs review", ...statusVars("in_review") },
  awaiting_client: { label: "Pending approval", ...statusVars("awaiting_client") },
  changes_requested: { label: "Changes requested", ...statusVars("changes_requested") },
  approved: { label: "Approved", ...statusVars("approved") },
  completed: { label: "Completed", ...statusVars("completed") },
  published: { label: "Published", ...statusVars("published") },
  blocked: { label: "Blocked", ...statusVars("blocked") },
  failed: { label: "Failed", ...statusVars("failed") },
  overdue: { label: "Overdue", ...statusVars("overdue") },
  archived: { label: "Archived", ...statusVars("archived") },
};

/** Client-safe labels (SPEC §3.2). `null` = hide from client surfaces. */
export const CLIENT_STATUS_LABELS: Record<StatusKey, string | null> = {
  draft: "Planning",
  ready: "Ready for review",
  in_progress: "In progress",
  in_review: "Ready for review",
  awaiting_client: "Awaiting your response",
  changes_requested: null,
  approved: "Approved",
  completed: "Delivered",
  published: "Published",
  blocked: null,
  failed: null,
  overdue: null,
  archived: "Archived",
};

export function isClientVisibleStatus(key: StatusKey): boolean {
  return CLIENT_STATUS_LABELS[key] != null;
}

export function getClientStatusLabel(key: StatusKey): string | null {
  return CLIENT_STATUS_LABELS[key];
}

/** Normalize free-form status strings toward a canonical key. */
export function normalizeStatusKey(input: string): StatusKey | null {
  const raw = input.trim();
  if (!raw) return null;

  const normalized = raw
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_");

  if ((STATUS_KEYS as readonly string[]).includes(normalized)) {
    return normalized as StatusKey;
  }

  const aliases: Record<string, StatusKey> = {
    // Workflow / deliverable enums
    pending_client_review: "awaiting_client",
    needs_review: "in_review",
    needs_your_review: "awaiting_client",
    awaiting_your_approval: "awaiting_client",
    awaiting_your_response: "awaiting_client",
    admin_review: "in_review",
    review: "in_review",
    sent_to_client: "awaiting_client",
    shared_with_you: "awaiting_client",
    client_review_requested: "awaiting_client",
    client_approved: "approved",
    client_changes_requested: "changes_requested",
    revision_requested: "changes_requested",
    changes_req: "changes_requested",
    // Progress synonyms
    todo: "ready",
    to_do: "ready",
    pending: "ready",
    in_production: "in_progress",
    being_prepared: "in_progress",
    ready_for_generation: "in_progress",
    preparing_preview: "in_progress",
    preview_ready: "ready",
    final_ready: "completed",
    // Positive resolution
    accepted: "approved",
    delivered: "completed",
    done: "completed",
    success: "completed",
    final: "completed",
    complete: "completed",
    submitted: "completed",
    paid: "approved",
    active: "in_progress",
    enabled: "approved",
    // Negative
    rejected: "changes_requested",
    cancelled: "blocked",
    canceled: "blocked",
    missing: "failed",
    // Muted
    deferred: "archived",
    disabled: "archived",
    paused: "archived",
    // Finance
    issued: "ready",
    sent: "ready",
    // Task lifecycle
    not_started: "ready",
    // Publishing / credentials
    draft_prepared: "draft",
    provider_disabled: "archived",
    provider_not_configured: "failed",
    publish_error: "failed",
    error: "failed",
    published_to_wordpress: "published",
    exported: "completed",
    scheduled: "in_progress",
    publishing: "in_progress",
    not_scheduled: "ready",
    configured: "approved",
    not_configured: "failed",
    credentials_missing: "failed",
    target_configured: "approved",
    publication_target_missing: "blocked",
    default: "ready",
    // Approval / queue
    waiting: "awaiting_client",
    // Admin ops chips
    warning: "in_review",
    system: "draft",
    inactive: "archived",
    withdrawn: "archived",
    // Display labels already title-cased
    planning: "draft",
    ready_for_review: "ready",
  };

  return aliases[normalized] ?? null;
}

export function getStatusVisual(input: string): StatusVisual | null {
  const key = normalizeStatusKey(input);
  return key ? STATUS[key] : null;
}

export function statusBadgeStyle(visual: StatusVisual): CSSProperties {
  return {
    color: visual.text,
    background: visual.bg,
    border: `1px solid ${visual.border}`,
  };
}

export type LegacyStatusTone = "success" | "info" | "danger" | "muted" | "neutral";

/**
 * Compatibility tone mapper used by existing call sites and unit tests.
 * Legacy keyword buckets run first so historical outputs stay stable;
 * canonical STATUS keys fill gaps the legacy map never covered.
 */
export function getStatusTone(status: string): LegacyStatusTone {
  const normalized = status.trim().toLowerCase().replace(/[\s_]+/g, "-");

  if (
    [
      "accepted",
      "active",
      "approved",
      "delivered",
      "enabled",
      "final",
      "paid",
      "ready",
      "done",
      "success",
      "submitted",
    ].includes(normalized)
  ) {
    return "success";
  }

  if (
    [
      "admin-review",
      "draft",
      "pending",
      "to-do",
      "todo",
      "due",
      "in-progress",
      "issued",
      "sent",
      "review",
      "awaiting-your-approval",
    ].includes(normalized)
  ) {
    return "info";
  }

  if (["missing", "overdue", "failed", "cancelled", "canceled", "rejected", "revision-requested"].includes(normalized)) {
    return "danger";
  }

  if (["archived", "deferred", "disabled", "paused"].includes(normalized)) {
    return "muted";
  }

  const key = normalizeStatusKey(status);
  if (key) {
    switch (key) {
      case "approved":
      case "completed":
      case "published":
        return "success";
      case "draft":
      case "ready":
      case "in_progress":
      case "in_review":
      case "awaiting_client":
        return "info";
      case "changes_requested":
      case "blocked":
      case "failed":
      case "overdue":
        return "danger";
      case "archived":
        return "muted";
    }
  }

  return "neutral";
}

/** Map legacy tone → nearest STATUS key for CSS-var styling fallback. */
export function toneToStatusKey(tone: LegacyStatusTone): StatusKey {
  switch (tone) {
    case "success":
      return "approved";
    case "info":
      return "in_progress";
    case "danger":
      return "blocked";
    case "muted":
      return "archived";
    case "neutral":
    default:
      return "draft";
  }
}

/** Unambiguous client/admin labels for publishing and export enums. */
const PUBLISHING_STATUS_LABELS: Record<string, string> = {
  published: "Published",
  draft_prepared: "Draft prepared",
  provider_disabled: "Publishing disabled",
  provider_not_configured: "Provider not configured",
  exported: "Exported",
  error: "Publish failed",
  publish_error: "Publish failed",
  disabled: "Publishing disabled",
  credentials_missing: "Credentials missing",
  target_configured: "Target configured",
};

export function getPublishingStatusLabel(status: string | null | undefined): string | null {
  if (!status?.trim()) {
    return null;
  }
  const normalized = status.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return PUBLISHING_STATUS_LABELS[normalized] ?? null;
}

export function formatStatusLabel(value?: string | null): string {
  if (!value) return "Not set";
  const normalized = String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "Not set";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}
