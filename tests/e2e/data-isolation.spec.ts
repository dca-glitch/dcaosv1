import { test, expect } from "@playwright/test";
import { getAdminEmail, getApiBaseUrl, hasSeedPassword, isApiReachable } from "../helpers/test-env";
import { login } from "../helpers/api-client";

test.describe("Data isolation — API boundaries", () => {
  test.beforeAll(async () => {
    test.skip(!(await isApiReachable()), "API not reachable");
  });

  test("unauthenticated tenant routes return 401", async () => {
    const endpoints = [
      "/client-portal/projects",
      "/tenants/current/members",
      "/tenants/current/authorization-summary"
    ];

    for (const path of endpoints) {
      const response = await fetch(`${getApiBaseUrl()}${path}`, {
        headers: { Accept: "application/json" }
      });
      expect(response.status, path).toBe(401);
    }
  });

  test("invalid project id does not return 200 for authenticated user", async () => {
    test.skip(!hasSeedPassword(), "AUTH_SEED_TEST_PASSWORD not set");

    const { token } = await login(getAdminEmail(), process.env.AUTH_SEED_TEST_PASSWORD!);
    test.skip(!token, "Login failed");

    const response = await fetch(`${getApiBaseUrl()}/client-portal/projects/nonexistent-project-id`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    expect([403, 404]).toContain(response.status);
  });

  test("module catalog remains public while tenant routes stay protected", async () => {
    const publicModules = await fetch(`${getApiBaseUrl()}/modules`, {
      headers: { Accept: "application/json" }
    });
    expect(publicModules.status).toBe(200);

    const protectedMembers = await fetch(`${getApiBaseUrl()}/tenants/current/members`, {
      headers: { Accept: "application/json" }
    });
    expect(protectedMembers.status).toBe(401);
  });
});
