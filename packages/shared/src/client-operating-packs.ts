/**
 * Client Operating Pack constants (G124-G126, G209-G216, G349-G368).
 * Configuration only: no workflow execution, live provider calls, or runtime entitlement enforcement.
 * Agency OS first — not a SaaS product surface.
 * Puriva is the first Client Operating Pack proof — not a Core fork.
 */

export const CLIENT_OPERATING_PACKS_VERSION = "CLIENT_OPERATING_PACKS_V1";

/** Truth label: pack config is Agency OS scaffolding, not multi-tenant SaaS readiness. */
export const CLIENT_OPERATING_PACK_SAAS_READINESS = {
  label: "saas_later",
  agencyOsFirst: true,
  multiTenantSaasReady: false,
  notes:
    "Client Operating Packs configure internal agency delivery. They do not claim SaaS tenancy, self-serve onboarding, or productized multi-client billing."
} as const;

export type ClientOperatingPackKey = "puriva";

export type ClientOperatingPackStatus = "local_admin_scaffolded" | "launch_blocked";

/**
 * Pack module entitlement keys (G210 matrix).
 * Includes foundation `core` plus Puriva delivery surfaces.
 */
export type ClientOperatingPackModuleKey =
  | "core"
  | "ai-workflow"
  | "ai-seo"
  | "monthly-reports"
  | "client-portal"
  | "wordpress-draft"
  | "image-generation"
  | "ga-gsc"
  | "notifications"
  | "market-intelligence"
  | "revenue-hub"
  | "pod-toolkit"
  | "finance-lite";

/** enabled = active for pack ops; partial = scaffolded/limited; future = deferred; disabled = off */
export type ClientOperatingPackEntitlementStatus = "enabled" | "partial" | "future" | "disabled";

export interface ClientOperatingPackModuleEntitlement {
  moduleKey: ClientOperatingPackModuleKey;
  status: ClientOperatingPackEntitlementStatus;
  requiredForLaunch: boolean;
  /** When true, entitled+active modules may appear on client-safe surfaces (G213). */
  clientVisibleSurface: boolean;
  notes: string;
}

export type ClientOperatingPackWorkflowTemplateKey =
  | "puriva_seo_article_v1"
  | "puriva_image_set_v1"
  | "puriva_wordpress_draft_v1"
  | "puriva_monthly_report_flow_v1"
  | "puriva_market_intelligence_v1"
  | "puriva_revenue_insight_v1"
  | "puriva_pod_listing_v1"
  /** Legacy composite catalog entry retained for G124-G126 continuity. */
  | "puriva_article_image_package_v1";

export interface ClientOperatingPackWorkflowStep {
  order: number;
  key: string;
  label: string;
  actor: "system" | "admin" | "client";
  approvalGate: boolean;
  clientVisible: boolean;
}

export interface ClientOperatingPackWorkflowTemplate {
  templateKey: ClientOperatingPackWorkflowTemplateKey;
  label: string;
  status: "catalog_only";
  executionEnabled: false;
  liveProviderCalls: false;
  executionAdapter: null;
  steps: ClientOperatingPackWorkflowStep[];
  rules: string[];
}

export type PurivaComplianceRiskClass =
  | "medical_aesthetic_claims"
  | "prescription_weight_management"
  | "stem_cell_therapy"
  | "before_after_results"
  | "hospital_partner_claims"
  | "report_metrics_narrative";

export type PurivaComplianceContentChannel = "website" | "social";

export type PurivaCompliancePaidAdsScope = "future_out_of_scope";

export interface PurivaComplianceProfile {
  profileKey: "puriva_compliance_profile_v1";
  packKey: "puriva";
  clientDomain: "puriva.id";
  status: "locked_pending_live_proof";
  medicalContent: true;
  contentChannels: readonly PurivaComplianceContentChannel[];
  paidAdsScope: PurivaCompliancePaidAdsScope;
  riskClasses: PurivaComplianceRiskClass[];
  requiredHumanReview: true;
  adminReviewRequired: true;
  clientApprovalRequiredForArticleAndImages: true;
  finalReportClientApprovalRequired: false;
  prohibitedClaimPatterns: readonly string[];
  requiredBoundaries: readonly string[];
}

export interface PurivaComplianceValidationResult {
  ok: boolean;
  errors: readonly string[];
}

export interface ClientOperatingPackConfig {
  version: typeof CLIENT_OPERATING_PACKS_VERSION;
  packKey: ClientOperatingPackKey;
  label: string;
  clientDomain: string;
  status: ClientOperatingPackStatus;
  firstPackProof: true;
  coreForkAllowed: false;
  saasReadiness: typeof CLIENT_OPERATING_PACK_SAAS_READINESS;
  complianceProfile: PurivaComplianceProfile;
  moduleEntitlements: readonly ClientOperatingPackModuleEntitlement[];
  workflowTemplates: readonly ClientOperatingPackWorkflowTemplate[];
}

export const PURIVA_COMPLIANCE_PROFILE_V1 = {
  profileKey: "puriva_compliance_profile_v1",
  packKey: "puriva",
  clientDomain: "puriva.id",
  status: "locked_pending_live_proof",
  medicalContent: true,
  contentChannels: ["website", "social"] as const,
  paidAdsScope: "future_out_of_scope",
  riskClasses: [
    "medical_aesthetic_claims",
    "prescription_weight_management",
    "stem_cell_therapy",
    "before_after_results",
    "hospital_partner_claims",
    "report_metrics_narrative"
  ],
  requiredHumanReview: true,
  adminReviewRequired: true,
  clientApprovalRequiredForArticleAndImages: true,
  finalReportClientApprovalRequired: false,
  prohibitedClaimPatterns: [
    "guaranteed outcome",
    "cure claim",
    "universal suitability",
    "permanent result",
    "unsafe rapid weight-loss promise",
    "unverified hospital partner claim"
  ],
  requiredBoundaries: [
    "Content stays educational and consultative.",
    "Medical/aesthetic claims require admin compliance review.",
    "Prescription and stem-cell content requires licensed-provider framing.",
    "Delivery channels are website and social only; paid ads are future/out of scope.",
    "Metrics and trends must come from GA/GSC or another approved source.",
    "Learning notes cannot weaken compliance boundaries."
  ]
} as const satisfies PurivaComplianceProfile;

/**
 * G211 — Compliance profile validator (pure; no I/O).
 * Ensures medical content, website/social-only channels, paid-ads out of scope, admin review required.
 */
export function validatePurivaComplianceProfile(
  profile: PurivaComplianceProfile
): PurivaComplianceValidationResult {
  const errors: string[] = [];

  if (profile.profileKey !== "puriva_compliance_profile_v1") {
    errors.push("profileKey must be puriva_compliance_profile_v1");
  }
  if (profile.packKey !== "puriva") {
    errors.push("packKey must be puriva");
  }
  if (profile.medicalContent !== true) {
    errors.push("medicalContent must be true for Puriva");
  }
  if (profile.adminReviewRequired !== true || profile.requiredHumanReview !== true) {
    errors.push("admin review is required for Puriva medical content");
  }

  const channels = new Set(profile.contentChannels);
  if (!channels.has("website") || !channels.has("social")) {
    errors.push("contentChannels must include website and social");
  }
  for (const channel of profile.contentChannels) {
    if (channel !== "website" && channel !== "social") {
      errors.push(`unsupported content channel: ${String(channel)}`);
    }
  }

  if (profile.paidAdsScope !== "future_out_of_scope") {
    errors.push("paidAdsScope must be future_out_of_scope");
  }

  if (!profile.riskClasses.includes("medical_aesthetic_claims")) {
    errors.push("riskClasses must include medical_aesthetic_claims");
  }

  if (!profile.requiredBoundaries.some((boundary) => /paid ads/i.test(boundary))) {
    errors.push("requiredBoundaries must state paid ads are future/out of scope");
  }

  return { ok: errors.length === 0, errors };
}

/**
 * G210 — Puriva pack entitlement matrix.
 * Status is configuration truth only; runtime tenant enforcement remains deferred.
 */
export const PURIVA_MODULE_ENTITLEMENTS = [
  {
    moduleKey: "core",
    status: "enabled",
    requiredForLaunch: true,
    clientVisibleSurface: false,
    notes: "Tenant, client, audit, settings, and module registry foundation."
  },
  {
    moduleKey: "ai-workflow",
    status: "enabled",
    requiredForLaunch: true,
    clientVisibleSurface: false,
    notes: "AI workflow orchestration scaffolds for article/image/report delivery; admin-operated."
  },
  {
    moduleKey: "ai-seo",
    status: "enabled",
    requiredForLaunch: true,
    clientVisibleSurface: false,
    notes: "AI SEO planning and content plan scaffolds; FINAL deliverables may surface via Client Portal."
  },
  {
    moduleKey: "monthly-reports",
    status: "partial",
    requiredForLaunch: true,
    clientVisibleSurface: true,
    notes: "Monthly report scaffolds and final-only portal delivery; live GA/GSC proof still blocked."
  },
  {
    moduleKey: "client-portal",
    status: "enabled",
    requiredForLaunch: true,
    clientVisibleSurface: true,
    notes: "Client-safe final deliverables, approvals, archive, and monthly reports."
  },
  {
    moduleKey: "wordpress-draft",
    status: "partial",
    requiredForLaunch: true,
    clientVisibleSurface: false,
    notes: "Draft/handoff package path only; live WordPress publish remains blocked."
  },
  {
    moduleKey: "image-generation",
    status: "partial",
    requiredForLaunch: true,
    clientVisibleSurface: true,
    notes: "Image package scaffolds and client image review; live provider staging proof still blocked."
  },
  {
    moduleKey: "ga-gsc",
    status: "future",
    requiredForLaunch: true,
    clientVisibleSurface: false,
    notes: "Live analytics sync and reporting proof deferred; metrics must use approved sources when live."
  },
  {
    moduleKey: "notifications",
    status: "future",
    requiredForLaunch: true,
    clientVisibleSurface: false,
    notes: "In-system + email transactional notification proof deferred."
  },
  {
    moduleKey: "market-intelligence",
    status: "enabled",
    requiredForLaunch: true,
    clientVisibleSurface: false,
    notes: "Client-linked MI context for content planning and reporting; admin-operated."
  },
  {
    moduleKey: "revenue-hub",
    status: "future",
    requiredForLaunch: false,
    clientVisibleSurface: false,
    notes: "Revenue insight surfaces deferred; not part of Puriva launch MVP."
  },
  {
    moduleKey: "pod-toolkit",
    status: "future",
    requiredForLaunch: false,
    clientVisibleSurface: false,
    notes: "POD listing toolkit deferred; catalog template only."
  },
  {
    moduleKey: "finance-lite",
    status: "enabled",
    requiredForLaunch: false,
    clientVisibleSurface: false,
    notes: "Agency billing bridge for DCA LLC; not a client-visible pack surface."
  }
] as const satisfies readonly ClientOperatingPackModuleEntitlement[];

export const CLIENT_OPERATING_PACK_MODULE_ENTITLEMENT_CONFIG = {
  puriva: PURIVA_MODULE_ENTITLEMENTS
} as const satisfies Record<ClientOperatingPackKey, readonly ClientOperatingPackModuleEntitlement[]>;

/** Active for client visibility: enabled or partial (scaffolded but client-facing). */
const CLIENT_VISIBLE_ACTIVE_STATUSES: ReadonlySet<ClientOperatingPackEntitlementStatus> = new Set([
  "enabled",
  "partial"
]);

/**
 * G213 — Pure helper: client may only see entitled + active surfaces.
 * Does not enforce auth/portal runtime; filters pack entitlement config only.
 */
export function isClientVisiblePackSurface(
  entitlement: Pick<ClientOperatingPackModuleEntitlement, "status" | "clientVisibleSurface">
): boolean {
  return entitlement.clientVisibleSurface === true && CLIENT_VISIBLE_ACTIVE_STATUSES.has(entitlement.status);
}

export function filterClientVisiblePackSurfaces(
  entitlements: readonly ClientOperatingPackModuleEntitlement[]
): ClientOperatingPackModuleEntitlement[] {
  return entitlements.filter((entry) => isClientVisiblePackSurface(entry));
}

export function getClientVisiblePackModuleKeys(
  packKey: ClientOperatingPackKey
): ClientOperatingPackModuleKey[] {
  const entitlements = CLIENT_OPERATING_PACK_MODULE_ENTITLEMENT_CONFIG[packKey];
  return filterClientVisiblePackSurfaces(entitlements).map((entry) => entry.moduleKey);
}

function catalogTemplate(
  templateKey: ClientOperatingPackWorkflowTemplateKey,
  label: string,
  steps: ClientOperatingPackWorkflowStep[],
  rules: string[]
): ClientOperatingPackWorkflowTemplate {
  return {
    templateKey,
    label,
    status: "catalog_only",
    executionEnabled: false,
    liveProviderCalls: false,
    executionAdapter: null,
    steps,
    rules
  };
}

/**
 * G212 — Workflow template catalog (catalog-only; no execution adapters).
 */
export const PURIVA_WORKFLOW_TEMPLATE_CATALOG = [
  catalogTemplate(
    "puriva_seo_article_v1",
    "Puriva SEO Article Workflow v1",
    [
      { order: 1, key: "seo_brief_prepared", label: "SEO brief prepared", actor: "admin", approvalGate: false, clientVisible: false },
      { order: 2, key: "article_draft_generated", label: "Article draft generated", actor: "system", approvalGate: false, clientVisible: false },
      { order: 3, key: "admin_article_review", label: "Admin article review", actor: "admin", approvalGate: true, clientVisible: false },
      { order: 4, key: "client_article_approval", label: "Client article approval", actor: "client", approvalGate: true, clientVisible: true }
    ],
    [
      "Medical/aesthetic claims require admin compliance review before client visibility.",
      "Reject reason required for admin and client rejections.",
      "Client sees FINAL article approval surface only."
    ]
  ),
  catalogTemplate(
    "puriva_image_set_v1",
    "Puriva Image Set Workflow v1",
    [
      { order: 1, key: "image_package_generated", label: "Image package generated", actor: "system", approvalGate: false, clientVisible: false },
      { order: 2, key: "admin_image_review", label: "Admin image review", actor: "admin", approvalGate: true, clientVisible: false },
      { order: 3, key: "client_image_review", label: "Client image review", actor: "client", approvalGate: true, clientVisible: true },
      { order: 4, key: "approved_images_upscaled", label: "Approved images upscaled", actor: "system", approvalGate: false, clientVisible: false },
      { order: 5, key: "social_preview_generated", label: "Social preview generated from hero", actor: "system", approvalGate: false, clientVisible: false }
    ],
    [
      "Regenerate only rejected images unless the full package is rejected.",
      "Upscale only after admin and client image approval.",
      "Social preview derives from the approved hero image.",
      "Website and social channels only; paid ads creative is out of scope."
    ]
  ),
  catalogTemplate(
    "puriva_wordpress_draft_v1",
    "Puriva WordPress Draft Workflow v1",
    [
      { order: 1, key: "admin_final_package_approval", label: "Admin final package approval", actor: "admin", approvalGate: true, clientVisible: false },
      { order: 2, key: "wordpress_draft_handoff_created", label: "WordPress draft/handoff package created", actor: "system", approvalGate: false, clientVisible: false }
    ],
    [
      "WordPress draft/handoff only after admin final package approval.",
      "Live WordPress publish is not enabled by this catalog template."
    ]
  ),
  catalogTemplate(
    "puriva_monthly_report_flow_v1",
    "Puriva Monthly Report Flow v1",
    [
      { order: 1, key: "admin_selects_date_range", label: "Admin selects date range", actor: "admin", approvalGate: false, clientVisible: false },
      { order: 2, key: "approved_metrics_collected", label: "Approved metrics collected", actor: "system", approvalGate: false, clientVisible: false },
      { order: 3, key: "report_generated", label: "Report generated", actor: "system", approvalGate: false, clientVisible: false },
      { order: 4, key: "narrative_prepared", label: "Narrative prepared", actor: "system", approvalGate: false, clientVisible: false },
      { order: 5, key: "admin_report_review", label: "Admin reviews report", actor: "admin", approvalGate: true, clientVisible: false },
      { order: 6, key: "admin_final_report_approval", label: "Admin approves final report", actor: "admin", approvalGate: true, clientVisible: false },
      { order: 7, key: "client_final_report_notification", label: "Client final report notification", actor: "system", approvalGate: false, clientVisible: true },
      { order: 8, key: "client_portal_final_report", label: "Final report appears in Client Portal", actor: "system", approvalGate: false, clientVisible: true }
    ],
    [
      "Client receives final report only.",
      "No client approval, reject, comments, or request changes for monthly reports.",
      "AI cannot invent metrics; trends must come from GA/GSC or another approved source.",
      "Admin rejection or revision of AI narrative requires a reason."
    ]
  ),
  catalogTemplate(
    "puriva_market_intelligence_v1",
    "Puriva Market Intelligence Workflow v1",
    [
      { order: 1, key: "mi_context_selected", label: "MI context selected for client", actor: "admin", approvalGate: false, clientVisible: false },
      { order: 2, key: "mi_insights_prepared", label: "MI insights prepared", actor: "system", approvalGate: false, clientVisible: false },
      { order: 3, key: "admin_mi_review", label: "Admin MI review", actor: "admin", approvalGate: true, clientVisible: false }
    ],
    [
      "Market intelligence remains admin-operated for Puriva v1.",
      "Client-visible MI excerpts only via approved FINAL deliverables when entitled."
    ]
  ),
  catalogTemplate(
    "puriva_revenue_insight_v1",
    "Puriva Revenue Insight Workflow v1",
    [
      { order: 1, key: "revenue_inputs_collected", label: "Revenue inputs collected", actor: "admin", approvalGate: false, clientVisible: false },
      { order: 2, key: "revenue_insight_drafted", label: "Revenue insight drafted", actor: "system", approvalGate: false, clientVisible: false },
      { order: 3, key: "admin_revenue_review", label: "Admin revenue insight review", actor: "admin", approvalGate: true, clientVisible: false }
    ],
    [
      "Catalog-only future template; Revenue Hub entitlement is future.",
      "No client-visible revenue surface in Puriva launch scope."
    ]
  ),
  catalogTemplate(
    "puriva_pod_listing_v1",
    "Puriva POD Listing Workflow v1",
    [
      { order: 1, key: "pod_listing_drafted", label: "POD listing drafted", actor: "system", approvalGate: false, clientVisible: false },
      { order: 2, key: "admin_pod_review", label: "Admin POD listing review", actor: "admin", approvalGate: true, clientVisible: false }
    ],
    [
      "Catalog-only future template; POD Toolkit entitlement is future.",
      "No live marketplace publish from this catalog entry."
    ]
  ),
  catalogTemplate(
    "puriva_article_image_package_v1",
    "Puriva Article + Image Package Workflow v1",
    [
      { order: 1, key: "article_draft_generated", label: "Article draft generated", actor: "system", approvalGate: false, clientVisible: false },
      { order: 2, key: "admin_article_review", label: "Admin article review", actor: "admin", approvalGate: true, clientVisible: false },
      { order: 3, key: "client_article_approval", label: "Client article approval", actor: "client", approvalGate: true, clientVisible: true },
      { order: 4, key: "image_package_generated", label: "Image package generated", actor: "system", approvalGate: false, clientVisible: false },
      { order: 5, key: "admin_image_review", label: "Admin image review", actor: "admin", approvalGate: true, clientVisible: false },
      { order: 6, key: "client_image_review", label: "Client image review", actor: "client", approvalGate: true, clientVisible: true },
      { order: 7, key: "approved_images_upscaled", label: "Approved images upscaled", actor: "system", approvalGate: false, clientVisible: false },
      { order: 8, key: "social_preview_generated", label: "Social preview generated from hero", actor: "system", approvalGate: false, clientVisible: false },
      { order: 9, key: "admin_final_package_approval", label: "Admin final package approval", actor: "admin", approvalGate: true, clientVisible: false },
      { order: 10, key: "wordpress_draft_handoff_created", label: "WordPress draft/handoff package created", actor: "system", approvalGate: false, clientVisible: false },
      { order: 11, key: "feedback_learning_note_recorded", label: "Feedback learning note recorded", actor: "system", approvalGate: false, clientVisible: false }
    ],
    [
      "Reject reason required for admin and client rejections.",
      "Regenerate only rejected images unless the full package is rejected.",
      "Upscale only after admin and client image approval.",
      "Social preview derives from the approved hero image.",
      "WordPress draft/handoff only after admin final package approval."
    ]
  )
] as const satisfies readonly ClientOperatingPackWorkflowTemplate[];

export const PURIVA_OPERATING_PACK_V1 = {
  version: CLIENT_OPERATING_PACKS_VERSION,
  packKey: "puriva",
  label: "Puriva Operating Pack v1",
  clientDomain: "puriva.id",
  status: "launch_blocked",
  firstPackProof: true,
  coreForkAllowed: false,
  saasReadiness: CLIENT_OPERATING_PACK_SAAS_READINESS,
  complianceProfile: PURIVA_COMPLIANCE_PROFILE_V1,
  moduleEntitlements: PURIVA_MODULE_ENTITLEMENTS,
  workflowTemplates: PURIVA_WORKFLOW_TEMPLATE_CATALOG
} as const satisfies ClientOperatingPackConfig;

export const CLIENT_OPERATING_PACK_CONFIGS = {
  puriva: PURIVA_OPERATING_PACK_V1
} as const satisfies Record<ClientOperatingPackKey, ClientOperatingPackConfig>;

/**
 * G349/G350 — Pack config lookup helpers (pure; no I/O).
 */
export function getClientOperatingPackConfig(
  packKey: ClientOperatingPackKey
): ClientOperatingPackConfig {
  return CLIENT_OPERATING_PACK_CONFIGS[packKey];
}

export function listClientOperatingPackKeys(): ClientOperatingPackKey[] {
  return Object.keys(CLIENT_OPERATING_PACK_CONFIGS) as ClientOperatingPackKey[];
}

/**
 * G351 — Launch-required module keys from entitlement matrix (config truth only).
 */
export function getLaunchRequiredPackModuleKeys(
  packKey: ClientOperatingPackKey
): ClientOperatingPackModuleKey[] {
  return CLIENT_OPERATING_PACK_MODULE_ENTITLEMENT_CONFIG[packKey]
    .filter((entry) => entry.requiredForLaunch)
    .map((entry) => entry.moduleKey);
}

/**
 * G356 — Workflow template catalog lookup (catalog-only; no execution).
 */
export function getPurivaWorkflowTemplate(
  templateKey: ClientOperatingPackWorkflowTemplateKey
): ClientOperatingPackWorkflowTemplate | undefined {
  return PURIVA_WORKFLOW_TEMPLATE_CATALOG.find((template) => template.templateKey === templateKey);
}

export function listPurivaWorkflowTemplateKeys(): ClientOperatingPackWorkflowTemplateKey[] {
  return PURIVA_WORKFLOW_TEMPLATE_CATALOG.map((template) => template.templateKey);
}

/** Primary Puriva delivery templates used for launch mapping (excludes future/legacy composites). */
export const PURIVA_PRIMARY_WORKFLOW_TEMPLATE_KEYS = [
  "puriva_seo_article_v1",
  "puriva_image_set_v1",
  "puriva_wordpress_draft_v1",
  "puriva_monthly_report_flow_v1"
] as const satisfies readonly ClientOperatingPackWorkflowTemplateKey[];

/**
 * G353 — Website/social allowed scope + paid-ads out-of-scope check (pure).
 */
export function isPurivaPaidAdsOutOfScope(
  profile: PurivaComplianceProfile = PURIVA_COMPLIANCE_PROFILE_V1
): boolean {
  return profile.paidAdsScope === "future_out_of_scope";
}

export function getPurivaAllowedContentChannels(
  profile: PurivaComplianceProfile = PURIVA_COMPLIANCE_PROFILE_V1
): readonly PurivaComplianceContentChannel[] {
  return profile.contentChannels;
}

/**
 * G354 — Admin review required for Puriva medical content (pure).
 */
export function isPurivaAdminReviewRequired(
  profile: PurivaComplianceProfile = PURIVA_COMPLIANCE_PROFILE_V1
): boolean {
  return profile.adminReviewRequired === true && profile.requiredHumanReview === true;
}