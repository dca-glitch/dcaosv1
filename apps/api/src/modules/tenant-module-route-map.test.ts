import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getTenantModuleEnforcementMode, resolveModuleKeyForPath } from "./tenant-module-route-map";

describe("tenant module route map", () => {
  it("resolves exact and nested prefixes", () => {
    assert.equal(resolveModuleKeyForPath("/clients"), "core");
    assert.equal(resolveModuleKeyForPath("/clients/abc"), "core");
    assert.equal(resolveModuleKeyForPath("ai-delivery/projects"), "ai-delivery");
    assert.equal(resolveModuleKeyForPath("/finance/reports"), "finance-lite");
  });

  it("returns null for unmapped paths", () => {
    assert.equal(resolveModuleKeyForPath("/client-portal/projects"), null);
    assert.equal(resolveModuleKeyForPath("/auth/me"), null);
  });

  it("reads enforcement mode from env with safe default", () => {
    const original = process.env.TENANT_MODULE_ENFORCEMENT;
    process.env.TENANT_MODULE_ENFORCEMENT = "enforce";
    assert.equal(getTenantModuleEnforcementMode(), "enforce");
    process.env.TENANT_MODULE_ENFORCEMENT = "dry_run";
    assert.equal(getTenantModuleEnforcementMode(), "dry_run");
    process.env.TENANT_MODULE_ENFORCEMENT = "invalid";
    assert.equal(getTenantModuleEnforcementMode(), "off");
    if (original === undefined) {
      delete process.env.TENANT_MODULE_ENFORCEMENT;
    } else {
      process.env.TENANT_MODULE_ENFORCEMENT = original;
    }
  });
});
