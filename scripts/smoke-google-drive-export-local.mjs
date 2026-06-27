#!/usr/bin/env node

/**
 * Google Drive export foundation focused smoke test.
 *
 * Proves the admin-only Google Doc export endpoint:
 *   POST /api/v1/ai-delivery-projects/:id/deliverables/:deliverableId/export-google-doc
 *
 * This smoke runs without real Google credentials and confirms:
 *  1. Admin authentication works.
 *  2. Endpoint exists and requires auth (401 without token).
 *  3. With auth but no Google credentials configured, returns providerStatus: provider_disabled.
 *  4. Response shape is correct and contains no forbidden internal fields.
 *  5. Provider-disabled response is smoke-stable regardless of credentials.
 *
 * Steps:
 *  1. Admin login
 *  2. Create smoke-owned client + AI Delivery project + deliverable
 *  3. Verify 401 without token
 *  4. POST export-google-doc with auth → confirm provider_disabled response
 *  5. Confirm no forbidden fields in response
 *  6. Cleanup smoke records
 */

const API_BASE = process.env.API_BASE || "http://localhost:4000/api/v1";
const ADMIN_EMAIL = "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD || "";

let passed = 0;
let failed = 0;

function pass(label) {
  console.log(`  ✅ PASS: ${label}`);
  passed++;
}

function fail(label, detail) {
  console.log(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
  failed++;
}

async function apiCall(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, ok: response.ok, json, text };
}

const FORBIDDEN_FIELDS = [
  "storageKey", "workflowRunId", "executionLog", "executionError",
  "tenantId", "prompt", "reviewNotes", "reviewerName", "draftBody",
  "privateKey", "serviceAccountEmail"
];

function containsForbiddenField(value, fieldName) {
  const text = JSON.stringify(value);
  const pattern = new RegExp(`(?:^|[^A-Za-z0-9_])${fieldName}(?:[^A-Za-z0-9_]|$)`);
  return pattern.test(text);
}

async function main() {
  console.log("🔍 Google Drive export foundation smoke test\n");

  if (!ADMIN_PASSWORD) {
    throw new Error("AUTH_SEED_TEST_PASSWORD environment variable is required");
  }

  let token = "";
  let clientId = "";
  let projectId = "";
  let deliverableId = "";

  console.log("Step 1: Admin login");
  {
    const { ok, json } = await apiCall("POST", "/auth/login", {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    token = json?.data?.session?.token ?? "";
    if (ok && token) {
      pass("Admin login returned auth token");
    } else {
      fail("Admin login", JSON.stringify(json?.error ?? json));
      throw new Error("Cannot continue without auth token");
    }
  }
  console.log();

  const cleanup = async () => {
    if (!token) return;
    console.log("Cleanup: archive smoke-owned records");
    const tasks = [
      deliverableId ? ["POST", `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/archive`] : null,
      projectId ? ["POST", `/ai-delivery-projects/${projectId}/archive`] : null,
      clientId ? ["POST", `/clients/${clientId}/archive`] : null
    ].filter(Boolean);

    for (const [method, path] of tasks) {
      await apiCall(method, path, undefined, token);
    }
  };

  try {
    console.log("Step 2: Create smoke-owned client");
    {
      const { ok, json } = await apiCall(
        "POST",
        "/clients",
        { name: "Smoke GDrive Client", email: "smoke-gdrive-client@dca.local" },
        token
      );
      clientId = json?.data?.client?.id ?? "";
      if (ok && clientId) {
        pass(`Client created: ${clientId}`);
      } else {
        fail("Create client", JSON.stringify(json?.error ?? json));
        throw new Error("Cannot continue without client");
      }
    }
    console.log();

    console.log("Step 3: Create smoke-owned AI Delivery project");
    {
      const { ok, json } = await apiCall(
        "POST",
        "/ai-delivery-projects",
        { clientId, name: "Smoke GDrive Project", targetMonth: "2026-07" },
        token
      );
      projectId = json?.data?.aiDeliveryProject?.id ?? "";
      if (ok && projectId) {
        pass(`Project created: ${projectId}`);
      } else {
        fail("Create project", JSON.stringify(json?.error ?? json));
        throw new Error("Cannot continue without project");
      }
    }
    console.log();

    console.log("Step 4: Create smoke-owned deliverable");
    {
      const { ok, json } = await apiCall(
        "POST",
        `/ai-delivery-projects/${projectId}/deliverables`,
        {
          title: "Smoke GDrive Deliverable",
          description: "Google Drive export smoke deliverable.",
          status: "DRAFT"
        },
        token
      );
      deliverableId = json?.data?.deliverable?.id ?? "";
      if (ok && deliverableId) {
        pass(`Deliverable created: ${deliverableId}`);
      } else {
        fail("Create deliverable", JSON.stringify(json?.error ?? json));
        throw new Error("Cannot continue without deliverable");
      }
    }
    console.log();

    console.log("Step 5: Verify 401 without token");
    {
      const { status } = await apiCall(
        "POST",
        `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/export-google-doc`,
        {},
        null
      );
      if (status === 401) {
        pass("Unauthenticated request returns 401");
      } else {
        fail("Unauthenticated guard", `Expected 401, got ${status}`);
      }
    }
    console.log();

    console.log("Step 6: POST export-google-doc — expect provider_disabled");
    let exportResponse = null;
    {
      const { ok, status, json } = await apiCall(
        "POST",
        `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/export-google-doc`,
        {},
        token
      );

      exportResponse = json?.data ?? null;

      if (ok && exportResponse) {
        pass(`Export endpoint responded: HTTP ${status}`);
      } else if (status === 200 && !exportResponse) {
        fail("Export endpoint response missing data", JSON.stringify(json));
      } else {
        // Endpoint may return 200 with provider_disabled or 503-style — check data
        if (json?.data) {
          exportResponse = json.data;
          pass(`Export endpoint responded with data (status ${status})`);
        } else {
          fail("Export endpoint unexpected failure", `status=${status} body=${JSON.stringify(json ?? {}).slice(0, 200)}`);
        }
      }
    }
    console.log();

    console.log("Step 7: Verify provider_disabled response shape");
    if (exportResponse) {
      const status = exportResponse.providerStatus;
      const validDisabledStatuses = ["provider_disabled", "provider_not_configured"];
      if (validDisabledStatuses.includes(status)) {
        pass(`providerStatus is disabled: "${status}"`);
      } else if (status === "exported") {
        // Real credentials configured — still verify shape
        pass(`providerStatus is "exported" (real credentials present in env)`);
        if (exportResponse.exportUrl) {
          pass("exportUrl is present");
        } else {
          fail("exportUrl missing when providerStatus=exported");
        }
      } else {
        fail("providerStatus unexpected value", status);
      }

      if (exportResponse.deliverableId === deliverableId) {
        pass("deliverableId matches smoke deliverable");
      } else {
        fail("deliverableId mismatch", `got ${exportResponse.deliverableId}`);
      }

      if (typeof exportResponse.hasGoogleDocExport === "boolean") {
        pass("hasGoogleDocExport is boolean");
      } else {
        fail("hasGoogleDocExport missing or wrong type", typeof exportResponse.hasGoogleDocExport);
      }

      // exportUrl must be null or a string (no object/array)
      if (exportResponse.exportUrl === null || typeof exportResponse.exportUrl === "string") {
        pass("exportUrl is null or string (no raw object leak)");
      } else {
        fail("exportUrl unexpected type", typeof exportResponse.exportUrl);
      }
    } else {
      fail("No export response to verify shape");
    }
    console.log();

    console.log("Step 8: Check no forbidden fields in response");
    {
      const responseText = JSON.stringify(exportResponse ?? {});
      let allClear = true;
      for (const field of FORBIDDEN_FIELDS) {
        if (containsForbiddenField(exportResponse, field)) {
          fail(`Forbidden field found in response: ${field}`);
          allClear = false;
        }
      }
      if (allClear) {
        pass("No forbidden internal fields in export response");
      }
      // Also check raw response text doesn't contain private key patterns
      if (responseText.includes("-----BEGIN")) {
        fail("Response contains private key PEM data");
      } else {
        pass("No PEM private key data in response");
      }
    }
    console.log();

  } finally {
    await cleanup();
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`Google Drive Export Smoke: ${passed} passed / ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Smoke script error:", err.message || err);
  process.exit(1);
});
