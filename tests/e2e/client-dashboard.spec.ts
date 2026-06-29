import { test, expect, type Page } from "@playwright/test";
import { login } from "../helpers/api-client";
import { getWebBaseUrl, isApiReachable, isWebReachable } from "../helpers/test-env";

const PURIVA_EMAIL = "puriva@puriva.id";
const PURIVA_PASSWORD = process.env.PURIVA_CLIENT_TEST_PASSWORD ?? "Puriva123!";

function webHashUrl(path: string): string {
  const base = getWebBaseUrl().replace(/\/$/, "");
  const normalized = path.replace(/^#\/?/, "").replace(/^\//, "");
  return `${base}/#/${normalized}`;
}

async function completeForcePasswordChangeIfPresent(page: Page, password: string) {
  const newPasswordField = page.locator('input[autocomplete="new-password"], input[name="newPassword"]').first();
  const visible = await newPasswordField.isVisible({ timeout: 3000 }).catch(() => false);
  if (!visible) {
    return;
  }

  const passwordInputs = page.locator('input[type="password"]');
  const count = await passwordInputs.count();
  if (count >= 2) {
    await passwordInputs.nth(0).fill(password);
    await passwordInputs.nth(1).fill(password);
    await page.getByRole("button", { name: /sign in|update|save|continue/i }).click();
    await page.getByRole("button", { name: "Logout" }).waitFor({ state: "visible", timeout: 30000 });
  }
}

async function loginAsPurivaClient(page: Page) {
  await page.goto(webHashUrl("login"), { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', PURIVA_EMAIL);
  await page.fill('input[name="password"]', PURIVA_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await completeForcePasswordChangeIfPresent(page, PURIVA_PASSWORD);
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 30000 });
}

async function seedPurivaSession(page: Page) {
  const { token } = await login(PURIVA_EMAIL, PURIVA_PASSWORD);
  test.skip(!token, "Puriva client login failed — check puriva@puriva.id credentials");
  await page.addInitScript((authToken: string) => {
    window.sessionStorage.setItem("dcaosv1.authToken", authToken);
  }, token!);
}

test.describe("Client Dashboard — Puriva flow", () => {
  test.beforeAll(async () => {
    test.skip(!(await isApiReachable()), "API not reachable — start dev:api");
    test.skip(!(await isWebReachable()), "Web not reachable — start dev:web");
  });

  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }, testInfo) => {
    if (testInfo.title.startsWith("TEST 1")) {
      return;
    }
    await seedPurivaSession(page);
  });

  test("TEST 1 — Login and redirect", async ({ page }) => {
    await loginAsPurivaClient(page);

    await expect(page).toHaveURL(/#\/dashboard/, { timeout: 30000 });
    await expect(page.getByText("Finance", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Quick links", { exact: false })).toHaveCount(0);
    await expect(page.getByText(/current tenant/i)).toHaveCount(0);
  });

  test("TEST 2 — Left sidebar navigation", async ({ page }) => {
    await page.goto(webHashUrl("dashboard"), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 30000 });

    const sidebar = page.locator("aside.sidebar");

    await expect(sidebar.getByRole("link", { name: "Briefs" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Pending Approvals" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Monthly Reports" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Archive" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Clients" })).toHaveCount(0);
    await expect(sidebar.getByRole("link", { name: "Invoices" })).toHaveCount(0);
    await expect(sidebar.getByRole("link", { name: "AI Delivery" })).toHaveCount(0);
  });

  test("TEST 3 — Dashboard widgets", async ({ page }) => {
    await page.goto(webHashUrl("dashboard"), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 30000 });

    await expect(page.getByRole("heading", { name: "Recent Briefs" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Awaiting Your Action" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent Activity" })).toBeVisible();
  });

  test("TEST 4 — Navigate to Briefs", async ({ page }) => {
    await page.goto(webHashUrl("dashboard"), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 30000 });

    await page.locator("aside.sidebar").getByRole("link", { name: "Briefs" }).click();
    await expect(page).toHaveURL(/#\/briefs/, { timeout: 30000 });

    await expect(page.getByRole("heading", { name: /brief/i }).first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Loading briefs")).toHaveCount(0, { timeout: 30000 });

    const briefContent = page
      .getByText("Initial Brief")
      .or(page.getByText("Create Brief"))
      .or(page.getByText("Target Group"));
    await expect(briefContent.first()).toBeVisible({ timeout: 30000 });
  });

  test("TEST 5 — Navigate to Pending Approvals", async ({ page }) => {
    await page.goto(webHashUrl("dashboard"), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 30000 });

    await page.locator("aside.sidebar").getByRole("link", { name: "Pending Approvals" }).click();
    await expect(page).toHaveURL(/#\/pending-approvals/, { timeout: 30000 });
    await expect(page.getByText("500", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Internal Server Error", { exact: false })).toHaveCount(0);
  });

  test("TEST 6 — Navigate to Monthly Reports", async ({ page }) => {
    await page.goto(webHashUrl("dashboard"), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 30000 });

    await page.locator("aside.sidebar").getByRole("link", { name: "Monthly Reports" }).click();
    await expect(page).toHaveURL(/#\/monthly-reports/, { timeout: 30000 });
    await expect(page.getByRole("heading", { name: "Monthly Reports" })).toBeVisible();
  });

  test("TEST 7 — Navigate to Archive", async ({ page }) => {
    await page.goto(webHashUrl("dashboard"), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 30000 });

    await page.locator("aside.sidebar").getByRole("link", { name: "Archive" }).click();
    await expect(page).toHaveURL(/#\/archive/, { timeout: 30000 });
    await expect(page.getByText("500", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Internal Server Error", { exact: false })).toHaveCount(0);
  });

  test("TEST 8 — User panel visible and logout", async ({ page }) => {
    await page.goto(webHashUrl("dashboard"), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 30000 });

    await expect(page.getByText(PURIVA_EMAIL)).toBeVisible();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/#\/login/, { timeout: 30000 });
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  });
});
