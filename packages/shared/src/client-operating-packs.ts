/**
 * Client Operating Pack constants (G124-G126).
 * Configuration only: no workflow execution, live provider calls, or entitlement enforcement.
 */

export const CLIENT_OPERATING_PACKS_VERSION = "CLIENT_OPERATING_PACKS_V1";

export type ClientOperatingPackKey = "puriva";

export type ClientOperatingPackStatus = "local_admin_scaffolded" | "launch_blocked";

export type ClientOperatingPackModuleKey =
  | "core"
  | "ai-delivery"
  | "market-intelligence"
  | "client-portal"
  | "finance-lite";

export type ClientOperatingPackEntitlementStatus = "enabled" | "disabled" | "future";

export interface ClientOperatingPackModuleEntitlement {
  moduleKey: ClientOperatingPackModuleKey;
  status: ClientOperatingPackEntitlementStatus;
  requiredForLaunch: boolean;
  notes: string;
}

export type ClientOperatingPackWorkflowTemplateKey =
  | "puriva_article_image_package_v1"
  | "puriva_monthly_report_flow_v1";

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

export interface PurivaComplianceProfile {
  profileKey: "puriva_compliance_profile_v1";
  packKey: "puriva";
  clientDomain: "puriva.id";
  status: "locked_pending_live_proof";
  riskClasses: PurivaComplianceRiskClass[];
  requiredHumanReview: true;
  clientApprovalRequiredForArticleAndImages: true;
  finalReportClientApprovalRequired: false;
  prohibitedClaimPatterns: readonly string[];
  requiredBoundaries: readonly string[];
}

export interface ClientOperatingPackConfig {
  version: typeof CLIENT_OPERATING_PACKS_VERSION;
  packKey: ClientOperatingPackKey;
  label: string;
  clientDomain: string;
  status: ClientOperatingPackStatus;
  firstPackProof: true;
  coreForkAllowed: false;
  complianceProfile: PurivaComplianceProfile;
  moduleEntitlements: readonly ClientOperatingPackModuleEntitlement[];
  workflowTemplates: readonly ClientOperatingPackWorkflowTemplate[];
}

export const PURIVA_COMPLIANCE_PROFILE_V1 = {
  profileKey: "puriva_compliance_profile_v1",
  packKey: "puriva",
  clientDomain: "puriva.id",
  status: "locked_pending_live_proof",
  riskClasses: [
    "medical_aesthetic_claims",
    "prescription_weight_management",
    "stem_cell_therapy",
    "before_after_results",
    "hospital_partner_claims",
    "report_metrics_narrative"
  ],
  requiredHumanReview: true,
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
    "Metrics and trends must come from GA/GSC or another approved source.",
    "Learning notes cannot weaken compliance boundaries."
  ]
} as const satisfies PurivaComplianceProfile;

export const PURIVA_MODULE_ENTITLEMENTS = [
  {
    moduleKey: "core",
    status: "enabled",
    requiredForLaunch: true,
    notes: "Tenant, client, audit, settings, and module registry foundation."
  },
  {
    moduleKey: "ai-delivery",
    status: "enabled",
    requiredForLaunch: true,
    notes: "Monthly content plan, articles, deliverables, reviews, and handoff scaffolds."
  },
  {
    moduleKey: "market-intelligence",
    status: "enabled",
    requiredForLaunch: true,
    notes: "Client-linked MI context for content planning and reporting."
  },
  {
    moduleKey: "client-portal",
    status: "enabled",
    requiredForLaunch: true,
    notes: "Client-safe final deliverables, approvals, archive, and monthly reports."
  },
  {
    moduleKey: "finance-lite",
    status: "enabled",
    requiredForLaunch: false,
    notes: "Agency billing bridge for DCA LLC; not a client-visible pack surface."
  }
] as const satisfies readonly ClientOperatingPackModuleEntitlement[];

export const CLIENT_OPERATING_PACK_MODULE_ENTITLEMENT_CONFIG = {
  puriva: PURIVA_MODULE_ENTITLEMENTS
} as const satisfies Record<ClientOperatingPackKey, readonly ClientOperatingPackModuleEntitlement[]>;

export const PURIVA_WORKFLOW_TEMPLATE_CATALOG = [
  {
    templateKey: "puriva_article_image_package_v1",
    label: "Puriva Article + Image Package Workflow v1",
    status: "catalog_only",
    executionEnabled: false,
    liveProviderCalls: false,
    executionAdapter: null,
    steps: [
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
    rules: [
      "Reject reason required for admin and client rejections.",
      "Regenerate only rejected images unless the full package is rejected.",
      "Upscale only after admin and client image approval.",
      "Social preview derives from the approved hero image.",
      "WordPress draft/handoff only after admin final package approval."
    ]
  },
  {
    templateKey: "puriva_monthly_report_flow_v1",
    label: "Puriva Monthly Report Flow v1",
    status: "catalog_only",
    executionEnabled: false,
    liveProviderCalls: false,
    executionAdapter: null,
    steps: [
      { order: 1, key: "admin_selects_date_range", label: "Admin selects date range", actor: "admin", approvalGate: false, clientVisible: false },
      { order: 2, key: "approved_metrics_collected", label: "Approved metrics collected", actor: "system", approvalGate: false, clientVisible: false },
      { order: 3, key: "report_generated", label: "Report generated", actor: "system", approvalGate: false, clientVisible: false },
      { order: 4, key: "narrative_prepared", label: "Narrative prepared", actor: "system", approvalGate: false, clientVisible: false },
      { order: 5, key: "admin_report_review", label: "Admin reviews report", actor: "admin", approvalGate: true, clientVisible: false },
      { order: 6, key: "admin_final_report_approval", label: "Admin approves final report", actor: "admin", approvalGate: true, clientVisible: false },
      { order: 7, key: "client_final_report_notification", label: "Client final report notification", actor: "system", approvalGate: false, clientVisible: true },
      { order: 8, key: "client_portal_final_report", label: "Final report appears in Client Portal", actor: "system", approvalGate: false, clientVisible: true }
    ],
    rules: [
      "Client receives final report only.",
      "No client approval, reject, comments, or request changes for monthly reports.",
      "AI cannot invent metrics; trends must come from GA/GSC or another approved source.",
      "Admin rejection or revision of AI narrative requires a reason."
    ]
  }
] as const satisfies readonly ClientOperatingPackWorkflowTemplate[];

export const PURIVA_OPERATING_PACK_V1 = {
  version: CLIENT_OPERATING_PACKS_VERSION,
  packKey: "puriva",
  label: "Puriva Operating Pack v1",
  clientDomain: "puriva.id",
  status: "launch_blocked",
  firstPackProof: true,
  coreForkAllowed: false,
  complianceProfile: PURIVA_COMPLIANCE_PROFILE_V1,
  moduleEntitlements: PURIVA_MODULE_ENTITLEMENTS,
  workflowTemplates: PURIVA_WORKFLOW_TEMPLATE_CATALOG
} as const satisfies ClientOperatingPackConfig;

export const CLIENT_OPERATING_PACK_CONFIGS = {
  puriva: PURIVA_OPERATING_PACK_V1
} as const satisfies Record<ClientOperatingPackKey, ClientOperatingPackConfig>;
