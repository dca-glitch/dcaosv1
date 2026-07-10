import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMAIL_TEMPLATE_CATALOG_VERSION,
  REQUIRED_TYPED_LAUNCH_EMAIL_TEMPLATES,
  SCHEMA_EMAIL_TEMPLATE_KEYS,
  TYPED_EMAIL_TEMPLATE_KEYS,
  assertEmailTemplateCatalogCompleteness,
  buildAdminOnlyEmailEventMatrix,
  buildLaunchCriticalEmailMatrix,
  resolveEmailTemplateKey
} from "./email-template-catalog";

describe("G507 email template catalogue completeness", () => {
  it("reports complete schema + typed launch catalogues", () => {
    assert.equal(EMAIL_TEMPLATE_CATALOG_VERSION, "EMAIL_TEMPLATE_CATALOG_V1");
    const completeness = assertEmailTemplateCatalogCompleteness();
    assert.equal(completeness.schemaKeysComplete, true);
    assert.equal(completeness.typedKeysComplete, true);
    assert.equal(completeness.requiredTypedLaunchTemplatesPresent, true);
    assert.deepEqual(completeness.missingRequiredTypedKeys, []);
    assert.equal(completeness.schemaKeyCount, SCHEMA_EMAIL_TEMPLATE_KEYS.length);
    assert.equal(completeness.typedKeyCount, TYPED_EMAIL_TEMPLATE_KEYS.length);
    assert.equal(SCHEMA_EMAIL_TEMPLATE_KEYS.length, 6);
    assert.ok(TYPED_EMAIL_TEMPLATE_KEYS.length >= REQUIRED_TYPED_LAUNCH_EMAIL_TEMPLATES.length);
  });

  it("maps every required typed launch template onto a schema key", () => {
    for (const key of REQUIRED_TYPED_LAUNCH_EMAIL_TEMPLATES) {
      const resolved = resolveEmailTemplateKey(key);
      assert.equal(resolved.templateMissing, false, key);
      assert.equal(resolved.templateResolved, true, key);
      assert.ok(resolved.schemaTemplateKey, key);
      assert.equal(resolved.typedTemplateKey, key);
      assert.equal(resolved.noSendSafe, true);
    }
  });
});

describe("G508 missing template safe behavior", () => {
  it("treats empty, whitespace, and unknown keys as missing but no-send safe", () => {
    for (const key of ["", "   ", "NOT_A_REAL_TEMPLATE_KEY"]) {
      const resolved = resolveEmailTemplateKey(key);
      assert.equal(resolved.templateMissing, true, key);
      assert.equal(resolved.templateResolved, false, key);
      assert.equal(resolved.schemaTemplateKey, null, key);
      assert.equal(resolved.noSendSafe, true, key);
    }
  });

  it("resolves known schema keys without requiring typed catalog membership", () => {
    const resolved = resolveEmailTemplateKey("AI_DELIVERY_APPROVED");
    assert.equal(resolved.templateMissing, false);
    assert.equal(resolved.templateResolved, true);
    assert.equal(resolved.schemaTemplateKey, "AI_DELIVERY_APPROVED");
    assert.equal(resolved.typedTemplateKey, null);
  });
});

describe("G511 launch-critical email matrix", () => {
  it("lists only launch-critical non-audit events and marks email required", () => {
    const matrix = buildLaunchCriticalEmailMatrix();
    assert.ok(matrix.length > 0);
    for (const row of matrix) {
      assert.equal(row.launchCritical, true, row.eventType);
      assert.equal(row.auditOnly, false, row.eventType);
      assert.equal(row.emailRequired, true, row.eventType);
      assert.ok(row.schemaTemplateKey, row.eventType);
    }

    const eventTypes = new Set(matrix.map((row) => row.eventType));
    assert.equal(eventTypes.has("client_approval_needed"), true);
    assert.equal(eventTypes.has("content_approved"), true);
    assert.equal(eventTypes.has("monthly_report_available"), true);
    assert.equal(eventTypes.has("admin_action_required"), true);
    // Audit-only / non-launch must not appear.
    assert.equal(eventTypes.has("external_proof_failed"), false);
    assert.equal(eventTypes.has("kill_switch"), false);
    assert.equal(eventTypes.has("wordpress_draft_prepared"), false);
  });
});

describe("G512 admin-only email event matrix", () => {
  it("includes admin/owner events without client recipients", () => {
    const matrix = buildAdminOnlyEmailEventMatrix();
    assert.ok(matrix.length > 0);
    for (const row of matrix) {
      assert.equal(row.adminFacing, true, row.eventType);
      assert.equal(row.includesClientRecipient, false, row.eventType);
      assert.equal(row.recipientRoles.includes("client"), false, row.eventType);
      assert.ok(
        row.recipientRoles.includes("admin") || row.recipientRoles.includes("owner_operator"),
        row.eventType
      );
      assert.equal(row.emailRequired, row.launchCritical && !row.auditOnly, row.eventType);
    }

    const eventTypes = new Set(matrix.map((row) => row.eventType));
    assert.equal(eventTypes.has("admin_alert_after_client_action"), true);
    assert.equal(eventTypes.has("admin_action_required"), true);
    assert.equal(eventTypes.has("content_changes_requested"), true);
    assert.equal(eventTypes.has("budget_cap_blocked"), true);
    // Client-facing events must not appear.
    assert.equal(eventTypes.has("client_approval_needed"), false);
    assert.equal(eventTypes.has("image_set_ready"), false);
  });
});
