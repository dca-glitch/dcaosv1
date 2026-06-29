import { test, expect } from "@playwright/test";
import { getAdminEmail, getWebBaseUrl, hasSeedPassword, isApiReachable, isWebReachable } from "../helpers/test-env";
import { login } from "../helpers/api-client";

test.describe("Navigation & RBAC — admin shell", () => {
  test.beforeAll(async () => {
    test.skip(!(await isApiReachable()), "API not reachable");
    test.skip(!(await isWebReachable()), "Web not reachable");
    test.skip(!hasSeedPassword(), "AUTH_SEED_TEST_PASSWORD not set");
  });

  test("owner/admin sees core navigation items", async ({ page }) => {
    const { token } = await login(getAdminEmail(), process.env.AUTH_SEED_TEST_PASSWORD!);
    test.skip(!token, "Login failed");

    await page.addInitScript((authToken: string) => {
      window.sessionStorage.setItem("dcaosv1.authToken", authToken);
    }, token!);

    const base = getWebBaseUrl().replace(/\/$/, "");
    await page.goto(`${base}/#/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 30000 });

    await expect(page.getByRole("link", { name: "Clients" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Team" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Client Portal" })).toBeVisible();
  });

  test("team page is reachable for admin", async ({ page }) => {
    const { token } = await login(getAdminEmail(), process.env.AUTH_SEED_TEST_PASSWORD!);
    test.skip(!token, "Login failed");

    await page.addInitScript((authToken: string) => {
      window.sessionStorage.setItem("dcaosv1.authToken", authToken);
    }, token!);

    const base = getWebBaseUrl().replace(/\/$/, "");
    await page.goto(`${base}/#/team`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /team/i })).toBeVisible({ timeout: 30000 });
  });
});
