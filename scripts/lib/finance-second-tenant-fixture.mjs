/**
 * Phase F Block 69 — documents second-tenant finance isolation fixture expectations.
 * Seed adds AUTH_SEED_TEST_EMAIL admin membership on digital-cube-agency tenant.
 */

export const FINANCE_SECOND_TENANT_FIXTURE = {
  primaryTenantSlug: "dca-local",
  secondaryTenantSlug: "digital-cube-agency",
  adminEmailEnv: "AUTH_SEED_TEST_EMAIL",
  optionalTesterEmailEnv: "AUTH_SEED_TESTER_EMAIL"
};

export function describeFinanceIsolationFixture(loginMemberships) {
  const tenantIds = new Set((loginMemberships ?? []).map((membership) => membership.tenantId));
  return {
    distinctTenantCount: tenantIds.size,
    crossTenantProofReady: tenantIds.size >= 2
  };
}
