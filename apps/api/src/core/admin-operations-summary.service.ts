/**
 * Block 2 — admin operations summary (read-only, no live external calls).
 */

import { probeDbReadiness, type DbReadinessResult } from "../health/db-readiness";
import {
  getExternalIntegrationsReadinessSnapshot,
  type ExternalIntegrationsReadinessSnapshot
} from "./external-integrations-readiness.service";
import { listTenantAuditLogs, type TenantAuditLogListItem } from "../security/audit-log.service";

export type AdminCloseoutGuidanceStatus = "manual_run_required";

export interface AdminCloseoutGuidance {
  status: AdminCloseoutGuidanceStatus;
  note: string;
  runbookPath: string;
  recommendedCommands: string[];
  logHint: string;
}

export interface AdminRecoveryHint {
  key: string;
  title: string;
  symptoms: string;
  steps: string[];
}

export interface AdminOperationsSummary {
  generatedAtIso: string;
  database: DbReadinessResult;
  externalIntegrations: ExternalIntegrationsReadinessSnapshot;
  closeoutGuidance: AdminCloseoutGuidance;
  recoveryHints: AdminRecoveryHint[];
  operationalAuditEvents: TenantAuditLogListItem[];
  operationalAuditNote: string;
  readOnly: true;
}

const OPERATIONAL_AUDIT_ACTION_MARKERS = [
  "AI_WORKFLOW",
  "WORDPRESS",
  "PUBLICATION",
  "MARKET_INTELLIGENCE",
  "module.enabled",
  "module.disabled"
] as const;

export const ADMIN_RECOVERY_HINTS: AdminRecoveryHint[] = [
  {
    key: "validate_failed",
    title: "Validate failed",
    symptoms: "npm run validate exits non-zero during prisma:generate, check, or build.",
    steps: [
      "Read the first failing workspace in the validate log (stop on first failure).",
      "If Prisma EPERM appears, stop Program Files node.exe only and retry validate once.",
      "If typecheck fails, fix the reported file before rerunning smokes."
    ]
  },
  {
    key: "smoke_failed",
    title: "Smoke failed",
    symptoms: "A focused smoke script exits non-zero after validate passed.",
    steps: [
      "Confirm local API (:4000) and web (:5173) are running only when the smoke requires them.",
      "Set AUTH_SEED_TEST_PASSWORD in the shell only; never commit or print it.",
      "Rerun the single failing smoke; check $env:TEMP log opened by the orchestrator."
    ]
  },
  {
    key: "prisma_eperm",
    title: "Prisma EPERM / DLL lock",
    symptoms: "prisma generate cannot rename query_engine-windows.dll.node.",
    steps: [
      "Stop only C:\\Program Files\\nodejs\\node.exe processes (leave IDE helpers running).",
      "Wait 2 seconds, then rerun npm.cmd run validate once.",
      "If still blocked, stop local dev:api/dev:web and retry."
    ]
  },
  {
    key: "missing_env",
    title: "Missing env / config",
    symptoms: "Readiness shows missing_config or smoke reports required env absent.",
    steps: [
      "Check docs/operator/ENV_READINESS_INVENTORY.md for variable names only.",
      "Set values in shell or local .env; restart API after provider/storage env changes.",
      "Rerun npm.cmd run smoke:external-integrations-readiness:local for config-shape proof."
    ]
  },
  {
    key: "integration_disabled",
    title: "Disabled integration",
    symptoms: "External integrations readiness status is disabled.",
    steps: [
      "This is the safe local default for OpenRouter, WordPress publish, R2, and GA/GSC sync.",
      "Enable only through owner-approved env gates; live calls remain deferred in readiness layer.",
      "Use dedicated smokes (openrouter-guarded, wordpress-publish, r2-byte-roundtrip) only when intentionally probing."
    ]
  },
  {
    key: "wordpress_publish_disabled",
    title: "WordPress publish disabled",
    symptoms: "WORDPRESS_PUBLISH_ENABLED is not true or credentials are missing.",
    steps: [
      "Draft prep remains local-only; live publish stays off by default.",
      "Configure CREDENTIAL_ENCRYPTION_MASTER_KEY before encrypted publication targets.",
      "Use smoke:wordpress-publish:local for disabled-safe gate proof only."
    ]
  },
  {
    key: "r2_disabled",
    title: "R2 disabled or missing",
    symptoms: "Private storage readiness is disabled or R2 env keys are partial.",
    steps: [
      "Upload/download endpoints remain guarded when R2 is not configured.",
      "Provide full R2 env set only for local bucket proof with owner approval.",
      "Strict byte roundtrip requires SMOKE_EXPECT_R2_ROUNDTRIP=true plus configured bucket."
    ]
  }
];

export function isOperationalAuditAction(action: string): boolean {
  const normalized = action.trim();
  if (!normalized) {
    return false;
  }

  return OPERATIONAL_AUDIT_ACTION_MARKERS.some(
    (marker) => normalized === marker || normalized.startsWith(marker) || normalized.includes(marker)
  );
}

export function buildAdminCloseoutGuidance(): AdminCloseoutGuidance {
  return {
    status: "manual_run_required",
    note: "Local closeout results are not stored at runtime. Run commands manually and read logs from $env:TEMP.",
    runbookPath: "docs/runbooks/ADMIN_OPERATIONS_RECOVERY.md",
    recommendedCommands: [
      "npm.cmd run validate",
      "npm.cmd run smoke:external-integrations-readiness:local",
      "npm.cmd run smoke:production-readiness:local"
    ],
    logHint: "Orchestrator smokes write PASS/FAIL/SKIP summaries to $env:TEMP and open Notepad."
  };
}

export async function buildAdminOperationsSummary(tenantId: string): Promise<AdminOperationsSummary> {
  const [database, auditResponse] = await Promise.all([
    probeDbReadiness(),
    listTenantAuditLogs({ tenantId, limit: 40 })
  ]);

  const operationalAuditEvents = auditResponse.auditLogs.filter((entry) => isOperationalAuditAction(entry.action));

  return {
    generatedAtIso: new Date().toISOString(),
    database,
    externalIntegrations: getExternalIntegrationsReadinessSnapshot(),
    closeoutGuidance: buildAdminCloseoutGuidance(),
    recoveryHints: ADMIN_RECOVERY_HINTS,
    operationalAuditEvents: operationalAuditEvents.slice(0, 12),
    operationalAuditNote:
      "Audit feed includes platform WordPress/publication/workflow/module events when recorded. MI handoff, client approval, and delivery system events may appear in AI Operations or email outbox — not duplicated here.",
    readOnly: true
  };
}
