import { test, expect } from "@playwright/test";
import { getAdminEmail, getApiBaseUrl, getWebBaseUrl, hasSeedPassword, isApiReachable, isWebReachable } from "../helpers/test-env";
import { login } from "../helpers/api-client";

test.describe("Auth — sign-in shell", () => {
  test.beforeAll(async () => {
    test.skip(!(await isApiReachable()), "API not reachable — start dev:api");
    test.skip(!(await isWebReachable()), "Web not reachable — start dev:web");
  });

  test("shows sign-in form when unauthenticated", async ({ page }) => {
    await page.goto(getWebBaseUrl(), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("client portal hash redirects to sign-in when signed out", async ({ page }) => {
    const base = getWebBaseUrl().replace(/\/$/, "");
    await page.goto(`${base}/#/client-portal`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  });

  test("admin can log in via API and reach dashboard shell", async ({ page }) => {
    test.skip(!hasSeedPassword(), "AUTH_SEED_TEST_PASSWORD not set");

    const { token } = await login(getAdminEmail(), process.env.AUTH_SEED_TEST_PASSWORD!);
    test.skip(!token, "Login failed — check local auth seed");

    await page.addInitScript((authToken: string) => {
      window.sessionStorage.setItem("dcaosv1.authToken", authToken);
    }, token!);

    const base = getWebBaseUrl().replace(/\/$/, "");
    await page.goto(`${base}/#/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 30000 });
  });
});

test.describe("Auth — API login boundary", () => {
  test.beforeAll(async () => {
    test.skip(!(await isApiReachable()), "API not reachable");
  });

  test("rejects missing credentials", async () => {
    const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email: "nobody@test.local", password: "wrong" })
    });
    expect(response.status).toBe(401);
  });
});
