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
  request: AiDeliveryWordPressPublishRequest
): Promise<AiDeliveryWordPressPublishResult> {
  // Validate request shape
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

  // MOCK IMPLEMENTATION: Provider disabled, no external calls made
  // Future integration will:
  // 1. Retrieve WordPress credentials from TenantSetting (encrypted/secure)
  // 2. Call WordPress REST API to create/update post
  // 3. Handle authentication, rate limiting, retries
  // 4. Return real WordPress post ID and edit URL
  // 5. Record publication history in AuditLog

  return {
    ok: false,
    wordpressPostId: null,
    wordpressPostUrl: null,
    wordpressEditUrl: null,
    status: "provider_disabled",
    errorMessage: null,
    providerDisabledReason:
      "WordPress publication is not yet configured. Real WordPress API integration is a future implementation block. " +
      "Local draft preparation is available via /prepare-wordpress-draft endpoint."
  };
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
