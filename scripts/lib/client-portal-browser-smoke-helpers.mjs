/** Shared selectors for Client Portal browser smokes (Dark Nebula archive shell). */

export const CLIENT_ARCHIVE_PAGE_HEADING = "Archive";
export const CLIENT_PORTAL_PAGE_HEADING = "Your archive";
export const CLIENT_PORTAL_DELIVERY_SUMMARY_HEADING = "Delivery summary";
export const CLIENT_PORTAL_MONTHLY_REPORTS_HEADING = "Monthly reports";
export const CLIENT_PORTAL_RECOMMENDATIONS_HEADING = "Recommendations";

export async function seedClientPortalAuth(page, token) {
  await page.addInitScript((authToken) => {
    window.sessionStorage.setItem("dcaosv1.authToken", authToken);
  }, token);
}

export async function gotoClientPortal(page, webBaseUrl, options = {}) {
  const hash = options.hash ?? "#/client-portal";
  const heading = options.heading ?? CLIENT_PORTAL_PAGE_HEADING;
  await page.goto(`${webBaseUrl.replace(/\/$/, "")}/${hash.replace(/^#?\/?/, "#/")}`, {
    waitUntil: "domcontentloaded"
  });
  await page.getByRole("heading", { name: heading, exact: true }).waitFor({ state: "visible", timeout: 30000 });
  await page.getByRole("button", { name: "Logout" }).waitFor({ state: "visible", timeout: 30000 });
}

export function clientPortalSection(page) {
  return page.locator('section[aria-labelledby="client-portal-title"]');
}

export async function selectPortalProject(page, projectName) {
  const portalSection = clientPortalSection(page);
  const projectCard = portalSection
    .locator(".cf-project-list .cf-project-item, .cf-project-list article, .portal-project-list article", {
      hasText: projectName
    })
    .first();
  await projectCard.waitFor({ state: "visible", timeout: 20000 });
  const viewButton = projectCard.getByRole("button", { name: /^View$/ });
  if ((await viewButton.count()) > 0) {
    await viewButton.click();
  } else {
    await projectCard.click();
  }
  return portalSection;
}
