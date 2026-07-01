import {
  currentTargetMonth,
  ensurePurivaLocalSetup,
  PURIVA_SETUP_MARKER
} from "./lib/puriva-local-setup.mjs";
import { ensureLocalBrowserSmokeServices, getApiBaseUrl } from "./lib/local-browser-smoke-service-helpers.mjs";

const apiBaseUrl = getApiBaseUrl();
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;

async function request(path, options = {}) {
  const headers = { Accept: "application/json" };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
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
  console.log(`${PURIVA_SETUP_MARKER} starting local Puriva client setup`);

  if (typeof adminPassword !== "string" || adminPassword.length === 0) {
    console.error("FAIL env AUTH_SEED_TEST_PASSWORD missing");
    process.exitCode = 1;
    return;
  }

  try {
    await ensureLocalBrowserSmokeServices((line) => console.log(line));
  } catch (error) {
    console.error(`FAIL local api/web readiness - ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
    return;
  }

  const loginResponse = await login(adminEmail, adminPassword);
  const token = loginResponse.body?.data?.session?.token ?? null;
  if (loginResponse.status !== 200 || !token) {
    console.error(`FAIL admin login HTTP ${loginResponse.status}`);
    process.exitCode = 1;
    return;
  }

  const targetMonth = currentTargetMonth();
  const setup = await ensurePurivaLocalSetup({
    request,
    token,
    targetMonth,
    log: (line) => console.log(`OK ${line}`)
  });

  console.log(`${PURIVA_SETUP_MARKER} finished`);
  console.log(`clientId=${setup.client.id}`);
  console.log(`publicationTargetId=${setup.publicationTarget.id}`);
  console.log(`aiDeliveryProjectId=${setup.aiDeliveryProject.id}`);
  console.log(`workflowBriefId=${setup.workflowBrief.id}`);
  console.log(`taxonomyVersion=${setup.taxonomy?.version ?? "missing"}`);
  console.log(`taxonomyCategories=${setup.taxonomy?.serviceCategoryCount ?? 0}`);
  console.log(`targetMonth=${targetMonth}`);
  console.log(
    `created=${JSON.stringify(setup.created)} skipped=${setup.skipped.length ? setup.skipped.join("; ") : "none"}`
  );
}

main().catch((error) => {
  console.error(`${PURIVA_SETUP_MARKER} fatal - ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
