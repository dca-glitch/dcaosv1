import { test, expect } from "@playwright/test";
import { getAdminEmail, getApiBaseUrl, getWebBaseUrl, hasSeedPassword, isApiReachable, isWebReachable } from "../helpers/test-env";
import { login, responseHasSensitiveFields } from "../helpers/api-client";
import { gotoClientPortal, seedClientPortalAuth } from "../helpers/portal-helpers";

test.describe("Puriva Client Portal — browser", () => {
  test.beforeAll(async () => {
    test.skip(!(await isApiReachable()), "API not reachable");
    test.skip(!(await isWebReachable()), "Web not reachable");
    test.skip(!hasSeedPassword(), "AUTH_SEED_TEST_PASSWORD not set");
  });

  test("authenticated admin can open client portal archive shell", async ({ page }) => {
    const { token } = await login(getAdminEmail(), process.env.AUTH_SEED_TEST_PASSWORD!);
    test.skip(!token, "Login failed");

    await seedClientPortalAuth(page, token!);
    await gotoClientPortal(page, getWebBaseUrl());
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
  });

  test("portal API responses do not expose storageKey", async () => {
    const { token } = await login(getAdminEmail(), process.env.AUTH_SEED_TEST_PASSWORD!);
    test.skip(!token, "Login failed");

    const response = await fetch(`${getApiBaseUrl()}/client-portal/projects`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`
      }
    });

    const text = await response.text();
    expect(response.ok).toBe(true);
    expect(responseHasSensitiveFields(text)).toBe(false);
  });
});
