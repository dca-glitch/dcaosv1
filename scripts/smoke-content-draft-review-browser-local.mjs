import { chromium } from "@playwright/test";

const webBaseUrl = (process.env.MVP_SMOKE_WEB_BASE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

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
  const apiBaseUrl = (process.env.MVP_SMOKE_API_BASE_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
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

async function main() {
  if (!requireEnv("AUTH_SEED_TEST_PASSWORD", adminPassword)) {
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

  const loginResponse = await login(adminEmail, adminPassword);
  const adminToken = loginResponse.body?.data?.session?.token ?? null;
  record("admin login", loginResponse.status === 200 && typeof adminToken === "string", `${loginResponse.status}`);
  if (!adminToken) {
    process.exitCode = 1;
    return;
  }

  const deferredApi = await request("/ai-delivery-projects/deferred-scope-smoke/content-drafts/client-review", {
    token: adminToken
  });
  record(
    "content draft client review API deferred",
    deferredApi.status === 403 && deferredApi.body?.error?.code === "CLIENT_REVIEW_DEFERRED",
    `${deferredApi.status}`
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.addInitScript((token) => {
      window.sessionStorage.setItem("dcaosv1.authToken", token);
    }, adminToken);

    await page.goto(`${webBaseUrl}/#/content-draft-review`, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "Content Draft Review", exact: true }).waitFor({ state: "visible", timeout: 20000 });

    await page.getByRole("heading", { name: "Deferred for MVP", exact: true }).waitFor({ state: "visible", timeout: 10000 });
    record("content draft review deferred panel visible", true, "Deferred for MVP");

    const viewText = await page.locator(".view-section").innerText();
    record(
      "content draft review shows deferred message",
      (viewText.includes("Client review deferred") || viewText.includes("Client review actions are not active")) &&
        (viewText.includes("Client Portal") || viewText.includes("Admin remains responsible")),
      "deferred copy"
    );
    record(
      "content draft review hides approve/request actions",
      !viewText.includes("Approve draft") && !viewText.includes("Request changes"),
      "no client actions"
    );

    const allPassed = results.every((result) => result.ok);
    if (allPassed) {
      console.log("PROVEN: Content draft review route shows deferred MVP message without client actions.");
    } else {
      console.log("NOT PROVEN: one or more content draft review browser checks failed.");
    }

    process.exitCode = allPassed ? 0 : 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL content draft review browser proof runtime - ${error instanceof Error ? error.message : "unknown error"}`);
  process.exitCode = 1;
});
