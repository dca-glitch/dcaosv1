import { test, expect } from "@playwright/test";
import { login } from "../helpers/api-client";
import {
  getAdminEmail,
  getApiBaseUrl,
  getWebBaseUrl,
  hasSeedPassword,
  isApiReachable,
  isWebReachable
} from "../helpers/test-env";

const SCREENSHOT_DIR = "test-results/design-system-screenshots";

function hashUrl(path: string): string {
  const base = getWebBaseUrl().replace(/\/$/, "");
  return `${base}/#/${path.replace(/^\//, "")}`;
}

async function seedAdminSession(page: import("@playwright/test").Page, token: string) {
  await page.addInitScript((t: string) => {
    window.sessionStorage.setItem("dcaosv1.authToken", t);
  }, token);
}

async function visitAndScreenshot(
  page: import("@playwright/test").Page,
  path: string,
  name: string,
  heading?: RegExp | string
) {
  await page.goto(hashUrl(path), { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 30000 });
  if (heading) {
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible({ timeout: 30000 });
  }
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: true });
}

test.describe("Design system — migrated pages (visual smoke)", () => {
  test.beforeAll(async () => {
    test.skip(!(await isApiReachable()), "API not reachable");
    test.skip(!(await isWebReachable()), "Web not reachable");
    test.skip(!hasSeedPassword(), "AUTH_SEED_TEST_PASSWORD not set");
  });

  test.beforeEach(async ({ page }) => {
    const { token } = await login(getAdminEmail(), process.env.AUTH_SEED_TEST_PASSWORD!);
    test.skip(!token, "Admin login failed");
    await seedAdminSession(page, token!);
  });

  const pages = [
    { path: "clients", name: "clients", heading: /clients/i },
    { path: "invoices", name: "invoices", heading: /invoices/i },
    { path: "bills", name: "bills", heading: /bills/i },
    { path: "credit-notes", name: "credit-notes", heading: /credit notes/i },
    { path: "briefs", name: "briefs", heading: /brief/i },
    { path: "client-portal", name: "client-portal", heading: /archive/i }
  ];

  for (const p of pages) {
    test(`screenshot ${p.name}`, async ({ page }) => {
      await visitAndScreenshot(page, p.path, p.name, p.heading);
    });
  }

  test("Add Invoice modal — Select chevron sizing and className integrity", async ({ page }) => {
    await page.goto(hashUrl("invoices"), { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("heading", { name: /invoices/i }).first()).toBeVisible({ timeout: 30000 });

    const addInvoiceButton = page.getByRole("button", { name: "Add Invoice" });
    await expect(addInvoiceButton).toBeVisible({ timeout: 30000 });
    await addInvoiceButton.click();

    const modal = page.getByRole("dialog");
    await expect(modal.getByRole("heading", { name: "Add Invoice" })).toBeVisible({ timeout: 30000 });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/invoices-add-invoice-modal.png`,
      fullPage: true
    });

    const clientSelect = modal.getByRole("combobox", { name: /Client - Required/i });
    await expect(clientSelect).toBeVisible({ timeout: 10000 });

    const chevron = modal.locator('svg path[d="M19 9l-7 7-7-7"]').locator("xpath=..").first();
    await expect(chevron).toBeVisible({ timeout: 10000 });

    const className = await chevron.getAttribute("class");
    expect(className).toBeTruthy();
    expect(className).not.toContain("\\/");
    expect(className).not.toContain("\\.");

    const rect = await chevron.evaluate((el) => el.getBoundingClientRect());
    expect(rect.height).toBeLessThan(30);
  });

  test("screenshot article-approval editor (read-only, if deliverable exists)", async ({ page, request }) => {
    await page.goto(getWebBaseUrl(), { waitUntil: "domcontentloaded" });
    const token = await page.evaluate(() => sessionStorage.getItem("dcaosv1.authToken"));
    const res = await request.get(`${getApiBaseUrl()}/client-portal/pending-approvals`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
    });
    test.skip(!res.ok(), "Could not load pending approvals");
    const body = await res.json();
    const id = body?.data?.deliverables?.[0]?.id;
    test.skip(!id, "No pending deliverable in seed data");
    await visitAndScreenshot(
      page,
      `client-portal/deliverables/${id}/approve`,
      "article-approval-editor",
      /approval|article/i
    );
  });
});
