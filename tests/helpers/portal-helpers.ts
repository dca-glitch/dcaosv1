import type { Page } from "@playwright/test";

export const CLIENT_PORTAL_PAGE_HEADING = "Your archive";

export async function seedClientPortalAuth(page: Page, token: string): Promise<void> {
  await page.addInitScript((authToken: string) => {
    window.sessionStorage.setItem("dcaosv1.authToken", authToken);
  }, token);
}

export async function gotoClientPortal(page: Page, webBaseUrl: string): Promise<void> {
  const base = webBaseUrl.replace(/\/$/, "");
  await page.goto(`${base}/#/client-portal`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: CLIENT_PORTAL_PAGE_HEADING }).waitFor({ state: "visible", timeout: 30000 });
}
