/**
 * WordPress author / tenant mapping design (local-only, no HTTP).
 *
 * Documents the intended mapping between DCA OS Lite tenants/users and
 * WordPress authors. No live user lookup or author assignment occurs here.
 */

export const WORDPRESS_AUTHOR_MAPPING_MODE = "deferred_design" as const;

export type WordPressAuthorMappingMode = typeof WORDPRESS_AUTHOR_MAPPING_MODE;

export type WordPressAuthorMappingStrategy =
  | "publication_target_default_author"
  | "tenant_owner_fallback"
  | "explicit_operator_override";

export interface WordPressAuthorTenantMappingDesign {
  mode: WordPressAuthorMappingMode;
  /**
   * Preferred future strategies in evaluation order (design-only).
   */
  preferredStrategies: WordPressAuthorMappingStrategy[];
  /**
   * Local draft payloads never embed a live WordPress author ID.
   */
  draftAuthorId: null;
  /**
   * Tenant → PublicationTarget → WordPress site is the ownership boundary.
   */
  ownershipBoundary: "tenant_client_publication_target";
  /**
   * Forbidden until a separate owner-approved live block.
   */
  forbiddenNow: readonly string[];
  note: string;
}

export const WORDPRESS_AUTHOR_TENANT_MAPPING_DESIGN: WordPressAuthorTenantMappingDesign = {
  mode: WORDPRESS_AUTHOR_MAPPING_MODE,
  preferredStrategies: [
    "publication_target_default_author",
    "tenant_owner_fallback",
    "explicit_operator_override"
  ],
  draftAuthorId: null,
  ownershipBoundary: "tenant_client_publication_target",
  forbiddenNow: [
    "live_wordpress_user_lookup",
    "hardcoded_global_author_id",
    "cross_tenant_author_reuse",
    "author_id_in_prepared_draft_payload"
  ],
  note:
    "Design-only. Local draft preparation does not assign WordPress authors. Live author mapping requires a separate owner-approved block after PublicationTarget credentials and staging proof."
};

/**
 * Resolve the design-time author mapping shape for a draft payload.
 * Always returns draftAuthorId null — no live WordPress user ID.
 */
export function resolveWordPressDraftAuthorMapping(_input?: {
  tenantId?: string | null;
  publicationTargetId?: string | null;
  operatorUserId?: string | null;
}): Pick<WordPressAuthorTenantMappingDesign, "mode" | "draftAuthorId" | "note"> {
  return {
    mode: WORDPRESS_AUTHOR_TENANT_MAPPING_DESIGN.mode,
    draftAuthorId: null,
    note: WORDPRESS_AUTHOR_TENANT_MAPPING_DESIGN.note
  };
}
