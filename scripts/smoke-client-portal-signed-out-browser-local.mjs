import { chromium } from "@playwright/test";

const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const sessionStorageKey = "dcaosv1.authToken";

const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "OK" : "FAIL"} ${name}${detail ? ` - ${detail}` : ""}`);
}

function requireEnv(name, value) {
  if (typeof value !== "string" || value.length === 0) {
    record(`env ${name}`, false, "missing");
    return false;
  }

  record(`env ${name}`, true, "present");
  return true;
}

async function request(path, options = {}) {
  const headers = { Accept: "application/json" };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers["Authorization"] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { status: response.status, body, text };
}

async function login(email, password) {
  return request("/auth/login", { method: "POST", body: { email, password } });
}

function getErrorCode(response) {
  return response.body?.error?.code ?? "";
}

async function expectSignIn(page) {
  await page.getByRole("heading", { name: "Sign In", exact: true }).waitFor({ state: "visible", timeout: 15000 });
  const portalVisible = await page.getByRole("heading", { name: "Client Portal", exact: true }).isVisible().catch(() => false);
  return !portalVisible;
}

async function expectClientPortal(page) {
  await page.getByRole("button", { name: "Logout" }).waitFor({ state: "visible", timeout: 25000 });
  await page.getByRole("heading", { name: "Client Portal", exact: true }).waitFor({ state: "visible", timeout: 15000 });
  return true;
}

function attachConsoleCollector(page, consoleErrors) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });
}

function assertCleanConsole(consoleErrors) {
  const ignoredConsolePatterns = [/favicon/i, /turnstile/i, /401 \(Unauthorized\)/i, /429 \(Too Many Requests\)/i];
  const relevantConsoleErrors = consoleErrors.filter(
    (message) => !ignoredConsolePatterns.some((pattern) => pattern.test(message))
  );
  record("no relevant browser console errors", relevantConsoleErrors.length === 0, relevantConsoleErrors.join(" | ") || "clean");
}

async function main() {
  if (!requireEnv("AUTH_SEED_TEST_PASSWORD", adminPassword)) {
    console.error("STOP: AUTH_SEED_TEST_PASSWORD is required.");
    process.exitCode = 1;
    return;
  }

  const health = await request("/health");
  record(
    "api health ready",
    health.status === 200 && health.body?.ok === true && health.body?.data?.database?.status === "ready",
    `${health.status}`
  );
  if (health.status !== 200 || health.body?.data?.database?.status !== "ready") {
    process.exitCode = 1;
    return;
  }

  let unauthedProjects = await request("/client-portal/projects");
  if (unauthedProjects.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    unauthedProjects = await request("/client-portal/projects");
  }
  record(
    "client portal projects unauthenticated 401",
    unauthedProjects.status === 401 && getErrorCode(unauthedProjects) === "AUTH_UNAUTHORIZED",
    `${unauthedProjects.status} ${getErrorCode(unauthedProjects)}`
  );

  const loginResponse = await login(adminEmail, adminPassword);
  const adminToken = loginResponse.body?.data?.session?.token ?? null;
  record("admin login (api)", loginResponse.status === 200 && typeof adminToken === "string", `${loginResponse.status}`);
  if (!adminToken) {
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];

  const signedOutPage = await browser.newPage();
  attachConsoleCollector(signedOutPage, consoleErrors);

  const authedPage = await browser.newPage();
  attachConsoleCollector(authedPage, consoleErrors);
  await authedPage.addInitScript(({ tokenKey, tokenValue }) => {
    window.sessionStorage.setItem(tokenKey, tokenValue);
  }, { tokenKey: sessionStorageKey, tokenValue: adminToken });

  try {
    await signedOutPage.goto(`${webBaseUrl}/#/client-portal`, { waitUntil: "domcontentloaded" });
    record("unsigned client-portal route shows sign-in", await expectSignIn(signedOutPage), "#/client-portal without token");

    await authedPage.goto(`${webBaseUrl}/#/client-portal`, { waitUntil: "domcontentloaded" });
    record("authenticated client portal loads", await expectClientPortal(authedPage), "Client Portal heading visible");

    await authedPage.getByRole("button", { name: "Logout" }).click();
    record("logout returns to sign-in", await expectSignIn(authedPage), "Client Portal hidden after logout");

    const tokenAfterLogout = await authedPage.evaluate((tokenKey) => window.sessionStorage.getItem(tokenKey), sessionStorageKey);
    record("logout clears session token", tokenAfterLogout === null, tokenAfterLogout ? "token still present" : "cleared");

    const afterLogoutApi = await request("/client-portal/projects");
    record(
      "client portal API still 401 after browser logout",
      afterLogoutApi.status === 401 && getErrorCode(afterLogoutApi) === "AUTH_UNAUTHORIZED",
      `${afterLogoutApi.status} ${getErrorCode(afterLogoutApi)}`
    );

    await authedPage.evaluate(({ tokenKey }) => {
      window.sessionStorage.setItem(tokenKey, "invalid-smoke-token");
    }, { tokenKey: sessionStorageKey });
    await authedPage.reload({ waitUntil: "domcontentloaded" });
    record("invalid session token shows sign-in", await expectSignIn(authedPage), "stale token rejected");

    assertCleanConsole(consoleErrors);

    const failed = results.filter((entry) => !entry.ok);
    if (failed.length > 0) {
      console.error(`\nSTOP: ${failed.length} signed-out browser gate check(s) failed.`);
      process.exitCode = 1;
      return;
    }

    console.log("\nPROVEN: Client Portal signed-out browser gate — login shell blocks archive UI without a valid session.");
  } catch (error) {
    console.error(`FAIL: ${error instanceof Error ? error.message : "Browser QA failed."}`);
    process.exitCode = 1;
  } finally {
    await signedOutPage.close().catch(() => {});
    await authedPage.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

await main();
