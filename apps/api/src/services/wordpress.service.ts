import type { AiDeliveryWordPressDraftPrepared } from "../core/core.types";

/**
 * WordPress provider service scaffold
 *
 * This service defines the interface for WordPress provider integration.
 * Credential management, external API calls, and persistence are intentionally deferred.
 * Currently returns mock responses only.
 */

/**
 * WordPress site connection configuration (non-secret fields)
 * Secret fields (tokens, auth) are stored separately in TenantSetting
 */
export interface AiDeliveryWordPressSiteConfig {
  /**
   * WordPress site base URL, e.g., "https://example.com" or "https://example.wordpress.com"
   */
  siteUrl: string;
  /**
   * Site slug or identifier for reference
   */
  siteSlug?: string;
  /**
   * Whether this is a WordPress.com site (multi-site) or self-hosted
   */
  wordPressComSite?: boolean;
}

/**
 * WordPress draft publish request
 * Content and metadata to publish to WordPress
 */
export interface AiDeliveryWordPressPublishRequest {
  /**
   * DCA OS Lite deliverable ID
   */
  deliverableId: string;
  /**
   * WordPress post title
   */
  title: string;
  /**
   * WordPress post body/content
   */
  body: string;
  /**
   * WordPress post excerpt (optional)
   */
  excerpt?: string | null;
  /**
   * WordPress post slug for URL (optional, auto-generated if not provided)
   */
  slug?: string;
  /**
   * WordPress categories/tags for taxonomy (optional)
   */
  categories?: string[];
  tags?: string[];
  /**
   * SEO metadata (optional)
   */
  seoKeywords?: string[];
  metaDescription?: string;
  /**
   * Featured image reference or URL (optional, not yet processed)
   */
  featuredImageUrl?: string | null;
  /**
   * WordPress post status; default "draft"
   */
  status?: "draft" | "pending" | "publish" | "future";
  /**
   * If publish status is "future", set the publish date
   */
  publishedDate?: Date;
}

/**
 * WordPress draft publish result
 */
export interface AiDeliveryWordPressPublishResult {
  /**
   * Whether the operation succeeded (true = published, false = failed or not executed)
   */
  ok: boolean;
  /**
   * WordPress post ID if created; null if not published
   */
  wordpressPostId: string | null;
  /**
   * WordPress post URL if published; null otherwise
   */
  wordpressPostUrl: string | null;
  /**
   * WordPress post edit URL if published; null otherwise
   */
  wordpressEditUrl: string | null;
  /**
   * Operation result status: "published", "draft_prepared", "provider_disabled", "error"
   */
  status: "published" | "draft_prepared" | "provider_disabled" | "error";
  /**
   * Error message if applicable
   */
  errorMessage: string | null;
  /**
   * Reason for provider disabled state (if applicable)
   */
  providerDisabledReason?: string;
}

export type AiDeliveryWordPressDraftSourceType = "DELIVERABLE" | "CONTENT_DRAFT";
export type AiDeliveryWordPressPublishGateStatus = "disabled" | "credentials_missing" | "target_configured";

export interface AiDeliveryWordPressDraftPayloadInput {
  title: string;
  body: string;
  excerpt?: string | null;
  sourceType: AiDeliveryWordPressDraftSourceType;
  sourceId: string;
  publicationTargetId?: string;
  publicationTargetLabel?: string;
  publicationSiteUrl?: string;
  publishGateStatus: AiDeliveryWordPressPublishGateStatus;
  credentialConfigured: boolean;
}

export interface AiDeliveryWordPressCredentialPolicyShape {
  configured: boolean;
  encryptionAvailable: boolean;
  updatedAt: string | null;
}

export interface AiDeliveryWordPressCredentialPolicyMetadata {
  credentialsPresent: boolean;
  siteUrlHost: string | null;
}

export const WORDPRESS_LIVE_HTTP_FROZEN = true as const;
export const WORDPRESS_LIVE_HTTP_FROZEN_REASON =
  "WordPress live HTTP is frozen for this gate. Draft preparation remains local-only and publish is disabled.";

export const WORDPRESS_TEST_DRAFT_PROOF_MARKER = "[DCA-OS-PROOF-DO-NOT-PUBLISH]";
export const WORDPRESS_TEST_DRAFT_PROOF_TAG = "dca-proof";
export const WORDPRESS_TEST_DRAFT_ROLLBACK_PLAN = {
  marker: WORDPRESS_TEST_DRAFT_PROOF_MARKER,
  tag: WORDPRESS_TEST_DRAFT_PROOF_TAG,
  allowedStatus: "draft",
  cleanupAction: "trash_or_delete_staging_test_draft",
  restorePublishEnv: "WORDPRESS_PUBLISH_ENABLED=false",
  evidenceRequired: [
    "ownerApprovalReference",
    "stagingOnlyTarget",
    "wordpressPostIdOrEditUrl",
    "cleanupActionAndTimestamp",
    "disabledSafeSmokeResult"
  ]
} as const;

/**
 * WordPress configuration validation result
 */
export interface AiDeliveryWordPressValidationResult {
  ok: boolean;
  issues: string[];
  warnings: string[];
}

/**
 * Validate WordPress site URL format
 * (does not verify connectivity or external access)
 */
function validateWordPressSiteUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalize WordPress site URL (trim trailing slash)
 */
function normalizeWordPressSiteUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function buildDraftSlug(title: string): string | null {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized ? normalized.slice(0, 80) : null;
}

function buildDraftNote(gateStatus: AiDeliveryWordPressPublishGateStatus): string {
  if (gateStatus === "disabled") {
    return "Local WordPress draft payload only. Live publish is disabled by default (WORDPRESS_PUBLISH_ENABLED is not true).";
  }

  if (gateStatus === "credentials_missing") {
    return "Local WordPress draft payload prepared. Save publication target credentials before guarded publish.";
  }

  return "Local WordPress draft payload prepared. Live publish remains confirm-gated and env-controlled.";
}

export function buildAiDeliveryWordPressDraftPayload(
  input: AiDeliveryWordPressDraftPayloadInput
): AiDeliveryWordPressDraftPrepared {
  const title = input.title.trim();
  const body = input.body.trim();
  const excerpt = input.excerpt?.trim() || null;

  return {
    status: "PREPARED",
    title,
    body,
    excerpt,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    slug: buildDraftSlug(title),
    postStatus: "draft",
    externalPostId: null,
    externalEditUrl: null,
    publicationTargetId: input.publicationTargetId,
    publicationTargetLabel: input.publicationTargetLabel,
    publicationSiteUrl: input.publicationSiteUrl,
    publishGateStatus: input.publishGateStatus,
    credentialConfigured: input.credentialConfigured,
    note: buildDraftNote(input.publishGateStatus)
  };
}

export function isAiDeliveryWordPressPublishFrozen(): boolean {
  return WORDPRESS_LIVE_HTTP_FROZEN;
}

export function buildWordPressCredentialPolicyShape(input: {
  configured?: boolean;
  encryptionAvailable?: boolean;
  updatedAt?: string | Date | null;
}): AiDeliveryWordPressCredentialPolicyShape {
  return {
    configured: input.configured === true,
    encryptionAvailable: input.encryptionAvailable === true,
    updatedAt: input.updatedAt instanceof Date ? input.updatedAt.toISOString() : input.updatedAt ?? null
  };
}

export function buildWordPressCredentialPolicyMetadata(input: {
  credentialsPresent?: boolean;
  siteUrl?: string | null;
}): AiDeliveryWordPressCredentialPolicyMetadata {
  let siteUrlHost: string | null = null;
  if (input.siteUrl) {
    try {
      siteUrlHost = new URL(input.siteUrl).hostname;
    } catch {
      siteUrlHost = null;
    }
  }

  return {
    credentialsPresent: input.credentialsPresent === true,
    siteUrlHost
  };
}

/**
 * Validate WordPress configuration
 * Checks non-secret fields only (site URL format, slug format, etc.)
 */
export function validateAiDeliveryWordPressConfig(
  config: AiDeliveryWordPressSiteConfig
): AiDeliveryWordPressValidationResult {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!config.siteUrl) {
    issues.push("WordPress site URL is required.");
  } else if (!validateWordPressSiteUrl(config.siteUrl)) {
    issues.push("WordPress site URL must be a valid HTTP/HTTPS URL.");
  }

  if (config.siteSlug && !/^[a-z0-9_-]+$/.test(config.siteSlug)) {
    warnings.push("WordPress site slug should contain only lowercase alphanumeric characters, hyphens, and underscores.");
  }

  return {
    ok: issues.length === 0,
    issues,
    warnings
  };
}

/**
 * Publish AI Delivery deliverable to WordPress
 *
 * Current implementation: returns mock "provider disabled" result
 * Future implementation: will call real WordPress API after credential/auth design is approved
 *
 * @param request - WordPress publish request with title, body, metadata
 * @returns Promise<AiDeliveryWordPressPublishResult> - publication result or provider-disabled indicator
 */
export async function publishAiDeliveryDeliverableToWordPress(
  request: AiDeliveryWordPressPublishRequest,
  options?: {
    siteConfig?: AiDeliveryWordPressSiteConfig | null;
    applicationPassword?: string | null;
  }
): Promise<AiDeliveryWordPressPublishResult> {
  if (!request.deliverableId || !request.title || !request.body) {
    return {
      ok: false,
      wordpressPostId: null,
      wordpressPostUrl: null,
      wordpressEditUrl: null,
      status: "error",
      errorMessage: "Deliverable ID, title, and body are required.",
      providerDisabledReason: undefined
    };
  }

  const publishEnabled = (process.env.WORDPRESS_PUBLISH_ENABLED ?? "").trim().toLowerCase() === "true";
  const siteConfig = options?.siteConfig ?? null;
  const applicationPassword = options?.applicationPassword ?? null;

  if (isAiDeliveryWordPressPublishFrozen()) {
    return {
      ok: false,
      wordpressPostId: null,
      wordpressPostUrl: null,
      wordpressEditUrl: null,
      status: "provider_disabled",
      errorMessage: null,
      providerDisabledReason: WORDPRESS_LIVE_HTTP_FROZEN_REASON
    };
  }

  if (!publishEnabled || !siteConfig?.siteUrl || !applicationPassword) {
    return {
      ok: false,
      wordpressPostId: null,
      wordpressPostUrl: null,
      wordpressEditUrl: null,
      status: "provider_disabled",
      errorMessage: null,
      providerDisabledReason:
        "WordPress publish is disabled or publication target credentials are not configured. Enable WORDPRESS_PUBLISH_ENABLED only after credential encryption is configured."
    };
  }

  const normalizedSiteUrl = normalizeWordPressSiteUrl(siteConfig.siteUrl);
  const endpoint = `${normalizedSiteUrl}/wp-json/wp/v2/posts`;
  const authHeader = `Basic ${Buffer.from(`:${applicationPassword}`).toString("base64")}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        title: request.title,
        content: request.body,
        excerpt: request.excerpt ?? undefined,
        slug: request.slug ?? undefined,
        status: request.status ?? "draft"
      })
    });

    if (!response.ok) {
      return {
        ok: false,
        wordpressPostId: null,
        wordpressPostUrl: null,
        wordpressEditUrl: null,
        status: "error",
        errorMessage: `WordPress API responded with status ${response.status}.`,
        providerDisabledReason: undefined
      };
    }

    const payload = (await response.json()) as { id?: number; link?: string };
    const postId = payload.id ? String(payload.id) : null;
    const postUrl = payload.link ?? null;

    return {
      ok: true,
      wordpressPostId: postId,
      wordpressPostUrl: postUrl,
      wordpressEditUrl: postId ? `${normalizedSiteUrl}/wp-admin/post.php?post=${postId}&action=edit` : null,
      status: "published",
      errorMessage: null,
      providerDisabledReason: undefined
    };
  } catch {
    return {
      ok: false,
      wordpressPostId: null,
      wordpressPostUrl: null,
      wordpressEditUrl: null,
      status: "error",
      errorMessage: "WordPress API request failed.",
      providerDisabledReason: undefined
    };
  }
}

/**
 * Validate and retrieve WordPress configuration from tenant settings
 *
 * Current implementation: returns validation-failed result (credentials not implemented)
 * Future implementation: will retrieve TenantSetting entries for WordPress connection
 *
 * @param tenantId - Tenant ID to retrieve settings for
 * @returns Promise<{ config: AiDeliveryWordPressSiteConfig | null; validation: AiDeliveryWordPressValidationResult }>
 */
export async function getAiDeliveryWordPressConfigForTenant(
  tenantId: string
): Promise<{ config: AiDeliveryWordPressSiteConfig | null; validation: AiDeliveryWordPressValidationResult }> {
  if (!tenantId) {
    return {
      config: null,
      validation: {
        ok: false,
        issues: ["Tenant ID is required."],
        warnings: []
      }
    };
  }

  // MOCK IMPLEMENTATION: Not configured
  // Future implementation will:
  // 1. Query TenantSetting table for key="wordpress_connection"
  // 2. Decrypt credentials from secure storage
  // 3. Return config + validation result

  return {
    config: null,
    validation: {
      ok: false,
      issues: ["WordPress connection is not configured for this tenant. Setup is a future implementation block."],
      warnings: []
    }
  };
}
