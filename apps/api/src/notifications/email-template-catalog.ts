/**
 * G507–G508 / G511–G512 — email template catalogue + launch/admin matrices.
 * Read-only over shared taxonomy; no schema changes, no provider calls.
 */

import type {
  NotificationEventType,
  SchemaEmailTemplateKey,
  TypedNotificationTemplateKey
} from "@dca-os-v1/shared";
import {
  EMAIL_TEMPLATE_INVENTORY,
  NOTIFICATION_EVENT_DEFINITIONS,
  TYPED_NOTIFICATION_TEMPLATE_CATALOG,
  isSchemaEmailTemplateKey,
  isTypedNotificationTemplateKey,
  resolveTypedTemplateToSchemaKey
} from "@dca-os-v1/shared";

export const EMAIL_TEMPLATE_CATALOG_VERSION = "EMAIL_TEMPLATE_CATALOG_V1";

export const SCHEMA_EMAIL_TEMPLATE_KEYS = Object.keys(
  EMAIL_TEMPLATE_INVENTORY
) as SchemaEmailTemplateKey[];

export const TYPED_EMAIL_TEMPLATE_KEYS = Object.keys(
  TYPED_NOTIFICATION_TEMPLATE_CATALOG
) as TypedNotificationTemplateKey[];

/** Required typed launch templates (G166 / G507). */
export const REQUIRED_TYPED_LAUNCH_EMAIL_TEMPLATES: readonly TypedNotificationTemplateKey[] = [
  "CLIENT_APPROVAL_REQUIRED",
  "CONTENT_CHANGES_REQUESTED",
  "IMAGE_REPLACEMENT_READY",
  "MONTHLY_REPORT_AVAILABLE",
  "WORDPRESS_DRAFT_PREPARED",
  "INTEGRATION_PROOF_FAILED",
  "BUDGET_CAP_BLOCKED"
] as const;

export interface EmailTemplateResolution {
  inputKey: string;
  schemaTemplateKey: SchemaEmailTemplateKey | null;
  typedTemplateKey: TypedNotificationTemplateKey | null;
  templateResolved: boolean;
  templateMissing: boolean;
  /** Safe to continue no-send path even when missing. */
  noSendSafe: true;
}

/**
 * Resolve a template key for email no-send paths.
 * Unknown / empty keys are missing but never throw and remain no-send safe (G508).
 */
export function resolveEmailTemplateKey(templateKey: string): EmailTemplateResolution {
  const trimmed = templateKey.trim();
  if (!trimmed) {
    return {
      inputKey: templateKey,
      schemaTemplateKey: null,
      typedTemplateKey: null,
      templateResolved: false,
      templateMissing: true,
      noSendSafe: true
    };
  }

  if (isTypedNotificationTemplateKey(trimmed)) {
    return {
      inputKey: trimmed,
      schemaTemplateKey: resolveTypedTemplateToSchemaKey(trimmed),
      typedTemplateKey: trimmed,
      templateResolved: true,
      templateMissing: false,
      noSendSafe: true
    };
  }

  if (isSchemaEmailTemplateKey(trimmed)) {
    const present = Boolean(EMAIL_TEMPLATE_INVENTORY[trimmed]);
    return {
      inputKey: trimmed,
      schemaTemplateKey: trimmed,
      typedTemplateKey: null,
      templateResolved: present,
      templateMissing: !present,
      noSendSafe: true
    };
  }

  return {
    inputKey: trimmed,
    schemaTemplateKey: null,
    typedTemplateKey: null,
    templateResolved: false,
    templateMissing: true,
    noSendSafe: true
  };
}

export interface EmailTemplateCatalogCompleteness {
  schemaKeysComplete: boolean;
  typedKeysComplete: boolean;
  requiredTypedLaunchTemplatesPresent: boolean;
  missingRequiredTypedKeys: TypedNotificationTemplateKey[];
  schemaKeyCount: number;
  typedKeyCount: number;
}

/** G507 — catalogue completeness against schema inventory + typed launch set. */
export function assertEmailTemplateCatalogCompleteness(): EmailTemplateCatalogCompleteness {
  const expectedSchema = [
    "CLIENT_INVITE",
    "PASSWORD_RESET",
    "AI_DELIVERY_BRIEF_REQUEST",
    "AI_DELIVERY_REVIEW_REQUEST",
    "AI_DELIVERY_APPROVED",
    "INVOICE_ISSUED"
  ] as const satisfies readonly SchemaEmailTemplateKey[];

  const schemaKeysComplete = expectedSchema.every((key) =>
    Object.prototype.hasOwnProperty.call(EMAIL_TEMPLATE_INVENTORY, key)
  );

  const missingRequiredTypedKeys = REQUIRED_TYPED_LAUNCH_EMAIL_TEMPLATES.filter(
    (key) => !Object.prototype.hasOwnProperty.call(TYPED_NOTIFICATION_TEMPLATE_CATALOG, key)
  );

  const typedKeysComplete = TYPED_EMAIL_TEMPLATE_KEYS.every((key) => {
    const def = TYPED_NOTIFICATION_TEMPLATE_CATALOG[key];
    return isSchemaEmailTemplateKey(def.schemaTemplateKey);
  });

  return {
    schemaKeysComplete,
    typedKeysComplete,
    requiredTypedLaunchTemplatesPresent: missingRequiredTypedKeys.length === 0,
    missingRequiredTypedKeys,
    schemaKeyCount: SCHEMA_EMAIL_TEMPLATE_KEYS.length,
    typedKeyCount: TYPED_EMAIL_TEMPLATE_KEYS.length
  };
}

export interface LaunchCriticalEmailMatrixRow {
  eventType: NotificationEventType;
  launchCritical: true;
  auditOnly: false;
  emailRequired: true;
  schemaTemplateKey: SchemaEmailTemplateKey;
  typedTemplateKey: TypedNotificationTemplateKey | null;
  recipientRoles: readonly string[];
}

export interface AdminOnlyEmailMatrixRow {
  eventType: NotificationEventType;
  adminFacing: true;
  includesClientRecipient: false;
  launchCritical: boolean;
  auditOnly: boolean;
  emailRequired: boolean;
  schemaTemplateKey: SchemaEmailTemplateKey;
  typedTemplateKey: TypedNotificationTemplateKey | null;
  recipientRoles: readonly string[];
}

function isAdminFacingWithoutClient(roles: readonly string[]): boolean {
  const hasAdminish = roles.includes("admin") || roles.includes("owner_operator");
  const hasClient = roles.includes("client");
  return hasAdminish && !hasClient;
}

/** G511 — every launch-critical, non-audit event that requires email (local remains no-send). */
export function buildLaunchCriticalEmailMatrix(): LaunchCriticalEmailMatrixRow[] {
  const rows: LaunchCriticalEmailMatrixRow[] = [];
  for (const definition of Object.values(NOTIFICATION_EVENT_DEFINITIONS)) {
    if (!definition.launchCritical || definition.auditOnly) {
      continue;
    }
    rows.push({
      eventType: definition.eventType,
      launchCritical: true,
      auditOnly: false,
      emailRequired: true,
      schemaTemplateKey: definition.schemaTemplateKey,
      typedTemplateKey: definition.typedTemplateKey,
      recipientRoles: [...definition.recipientRoles]
    });
  }
  return rows;
}

/**
 * G512 — admin/owner-operator email events that do not include client recipients.
 * Includes both launch-critical admin alerts and non-critical admin ops signals.
 */
export function buildAdminOnlyEmailEventMatrix(): AdminOnlyEmailMatrixRow[] {
  const rows: AdminOnlyEmailMatrixRow[] = [];
  for (const definition of Object.values(NOTIFICATION_EVENT_DEFINITIONS)) {
    if (!isAdminFacingWithoutClient(definition.recipientRoles)) {
      continue;
    }
    const emailRequired = definition.launchCritical && !definition.auditOnly;
    rows.push({
      eventType: definition.eventType,
      adminFacing: true,
      includesClientRecipient: false,
      launchCritical: definition.launchCritical,
      auditOnly: definition.auditOnly,
      emailRequired,
      schemaTemplateKey: definition.schemaTemplateKey,
      typedTemplateKey: definition.typedTemplateKey,
      recipientRoles: [...definition.recipientRoles]
    });
  }
  return rows;
}
