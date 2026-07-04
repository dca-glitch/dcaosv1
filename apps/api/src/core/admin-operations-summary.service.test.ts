import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_RECOVERY_HINTS,
  buildAdminCloseoutGuidance,
  isOperationalAuditAction
} from "./admin-operations-summary.service";

describe("admin-operations-summary.service", () => {
  it("flags operational audit actions", () => {
    assert.equal(isOperationalAuditAction("AI_WORKFLOW_RUN_COMPLETED"), true);
    assert.equal(isOperationalAuditAction("WORDPRESS_CONFIG_UPDATED"), true);
    assert.equal(isOperationalAuditAction("module.enabled"), true);
    assert.equal(isOperationalAuditAction("auth.login.success"), false);
  });

  it("closeout guidance does not claim runtime pass/fail", () => {
    const guidance = buildAdminCloseoutGuidance();
    assert.equal(guidance.status, "manual_run_required");
    assert.ok(guidance.recommendedCommands.length >= 2);
    assert.match(guidance.note, /not stored at runtime/i);
  });

  it("recovery hints avoid secret placeholders", () => {
    const serialized = JSON.stringify(ADMIN_RECOVERY_HINTS);
    assert.doesNotMatch(serialized, /sk-or-/i);
    assert.ok(ADMIN_RECOVERY_HINTS.some((hint) => hint.key === "prisma_eperm"));
  });
});
