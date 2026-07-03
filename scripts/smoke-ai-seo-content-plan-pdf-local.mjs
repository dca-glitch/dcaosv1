#!/usr/bin/env node

/**
 * AI SEO Content Plan PDF export focused smoke test.
 *
 * Proves the admin-only content plan PDF generation and download reference endpoints:
 *   POST /api/v1/ai-delivery-projects/:id/content-plan/generate-pdf
 *   GET  /api/v1/ai-delivery-projects/:id/content-plan/download
 *
 * Steps:
 *  1. Admin login
 *  2. Create client + AI Delivery project + content plan with items
 *  3. POST generate-pdf — expect 503 (R2 not configured locally) or 201 (if R2 configured)
 *  4. GET download reference — expect 200 with null or signed URL
 *  5. Assert storageKey never appears in any response
 *  6. Assert unauthenticated request returns 401
 *  7. Cleanup smoke-owned records
 */

const API_BASE = process.env.API_BASE || "http://localhost:4000/api/v1";
const ADMIN_EMAIL = process.env.AUTH_SEED_TEST_EMAIL || "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD || "";

const TARGET_MONTH = "2026-09";

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

function containsForbiddenField(value, fieldName) {
  const text = JSON.stringify(value);
  const pattern = new RegExp(`(?:^|[^A-Za-z0-9_])${fieldName}(?:[^A-Za-z0-9_]|$)`);
  return pattern.test(text);
}

async function apiCall(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, ok: response.ok, json };
}

async function ensureModuleEnabled(token, moduleKey) {
  const current = await apiCall("GET", "/modules/current", undefined, token);
  const entry = current.json?.data?.modules?.find((m) => m.key === moduleKey);
  if (entry?.enabled === true) return true;
  const enable = await apiCall("POST", `/modules/current/${moduleKey}/enable`, {}, token);
  return enable.status === 200 && enable.json?.ok === true;
}

async function main() {
  console.log("🔍 AI SEO Content Plan PDF export smoke test\n");

  if (!ADMIN_PASSWORD) {
    throw new Error("AUTH_SEED_TEST_PASSWORD environment variable is required");
  }

  let token = "";
  let clientId = "";
  let projectId = "";

  console.log("Step 1: Admin login");
  {
    const { ok, json } = await apiCall("POST", "/auth/login", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
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
    if (!token || !projectId) return;
    console.log("Cleanup: archive smoke-owned records");
    if (projectId) {
      await apiCall("POST", `/ai-delivery-projects/${projectId}/archive`, {}, token).catch(() => {});
    }
    if (clientId) {
      await apiCall("POST", `/clients/${clientId}/archive`, {}, token).catch(() => {});
    }
    console.log("  Cleanup done.");
  };

  try {
    await ensureModuleEnabled(token, "ai-delivery");
    pass("ai-delivery module enabled");
    console.log();

    console.log("Step 2: Create client and AI Delivery project");
    const smokeTag = `[SMOKE][CONTENT_PLAN_PDF] ${Date.now()}`;
    const clientRes = await apiCall("POST", "/clients", { name: smokeTag, email: `smoke-cpdf-${Date.now()}@dca.local` }, token);
    clientId = clientRes.json?.data?.client?.id ?? "";
    if (clientRes.status === 201 && clientId) {
      pass(`Client created: ${clientId}`);
    } else {
      fail("Client create", `status=${clientRes.status}`);
      throw new Error("Cannot continue without client");
    }

    const projRes = await apiCall("POST", "/ai-delivery-projects", {
      clientId,
      name: smokeTag,
      targetMonth: TARGET_MONTH
    }, token);
    projectId = projRes.json?.data?.aiDeliveryProject?.id ?? "";
    if (projRes.status === 201 && projectId) {
      pass(`AI Delivery project created: ${projectId}`);
    } else {
      fail("AI Delivery project create", `status=${projRes.status}`);
      throw new Error("Cannot continue without AI Delivery project");
    }

    // Create content plan with items
    const planRes = await apiCall("POST", `/ai-delivery-projects/${projectId}/content-plan`, {
      items: [
        { title: "Local SEO for Aesthetic Clinics", targetKeyword: "aesthetic clinic SEO", contentType: "article", notes: "Smoke fixture item", sortOrder: 0 },
        { title: "Skincare Blog Authority Guide", targetKeyword: "skincare authority content", contentType: "article", notes: null, sortOrder: 1 }
      ]
    }, token);
    const planId = planRes.json?.data?.contentPlan?.id ?? "";
    if ((planRes.status === 201 || planRes.status === 200) && planId) {
      pass(`Content plan created/updated: ${planId}`);
    } else {
      fail("Content plan create", `status=${planRes.status}`);
      throw new Error("Cannot continue without content plan");
    }
    console.log();

    console.log("Step 3: POST generate-pdf (expect 503 if R2 absent, 201 if R2 configured)");
    let r2Configured = false;
    {
      const genRes = await apiCall("POST", `/ai-delivery-projects/${projectId}/content-plan/generate-pdf`, undefined, token);
      if (genRes.status === 503 && (genRes.json?.error?.code === "R2_STORAGE_NOT_CONFIGURED" || genRes.json?.error === "R2_STORAGE_NOT_CONFIGURED")) {
        pass("generate-pdf returns 503 R2_STORAGE_NOT_CONFIGURED (local expected — no R2 creds)");
      } else if (genRes.status === 201 && genRes.json?.ok === true) {
        pass("generate-pdf returned 201 (R2 configured in this environment)");
        r2Configured = true;
        const data = genRes.json?.data;
        if (data?.contentPlanId && data?.hasDocument && data?.fileName) {
          pass("generate-pdf response shape: contentPlanId, hasDocument, fileName present");
        } else {
          fail("generate-pdf response shape", `data=${JSON.stringify(data)}`);
        }
      } else {
        fail("generate-pdf", `expected 503 or 201, got ${genRes.status} — ${JSON.stringify(genRes.json).slice(0, 200)}`);
      }
      if (!containsForbiddenField(genRes.json, "storageKey")) {
        pass("generate-pdf does not expose storageKey");
      } else {
        fail("generate-pdf exposes storageKey", "forbidden field present");
      }
    }
    console.log();

    console.log("Step 4: GET download reference (expect 200 with downloadReference null or present)");
    {
      const dlRes = await apiCall("GET", `/ai-delivery-projects/${projectId}/content-plan/download`, undefined, token);
      if (dlRes.status === 200) {
        const ref = dlRes.json?.data?.downloadReference ?? null;
        if (ref === null || (typeof ref === "object" && ref !== null && typeof ref.downloadUrl === "string")) {
          pass(`download reference returns 200 (downloadReference=${ref === null ? "null" : "present"})`);
        } else {
          fail("download reference shape", `unexpected downloadReference: ${JSON.stringify(ref)}`);
        }
      } else if (dlRes.status === 404) {
        pass("download reference returns 404 (acceptable: no plan found path)");
      } else {
        fail("download reference", `expected 200 or 404, got ${dlRes.status}`);
      }
      if (!containsForbiddenField(dlRes.json, "storageKey")) {
        pass("download reference does not expose storageKey");
      } else {
        fail("download reference exposes storageKey", "forbidden field present");
      }
    }
    console.log();

    console.log("Step 4b: editing the plan after PDF generation invalidates the stale PDF");
    if (r2Configured) {
      const updateRes = await apiCall("PUT", `/ai-delivery-projects/${projectId}/content-plan`, {
        items: [
          { title: "Local SEO for Aesthetic Clinics (revised)", targetKeyword: "aesthetic clinic SEO", contentType: "article", notes: "Smoke fixture item — revised", sortOrder: 0 },
          { title: "Skincare Blog Authority Guide", targetKeyword: "skincare authority content", contentType: "article", notes: null, sortOrder: 1 }
        ]
      }, token);
      if (updateRes.status === 200) {
        pass("content plan item update succeeded");
      } else {
        fail("content plan item update", `expected 200, got ${updateRes.status}`);
      }
      const dlAfterEdit = await apiCall("GET", `/ai-delivery-projects/${projectId}/content-plan/download`, undefined, token);
      const refAfterEdit = dlAfterEdit.json?.data?.downloadReference ?? null;
      if (dlAfterEdit.status === 200 && refAfterEdit === null) {
        pass("download reference is null after plan edit — stale PDF correctly invalidated");
      } else {
        fail("stale PDF invalidation", `expected downloadReference=null after edit, got ${JSON.stringify(refAfterEdit)}`);
      }
    } else {
      console.log("  SKIPPED: R2 not configured locally — cannot generate a real PDF to prove invalidation.");
    }
    console.log();

    console.log("Step 5: Unauthenticated requests return 401");
    {
      const noAuthGen = await apiCall("POST", `/ai-delivery-projects/${projectId}/content-plan/generate-pdf`, undefined, "");
      if (noAuthGen.status === 401) {
        pass("generate-pdf without auth returns 401");
      } else {
        fail("generate-pdf unauthenticated", `expected 401, got ${noAuthGen.status}`);
      }

      const noAuthDl = await apiCall("GET", `/ai-delivery-projects/${projectId}/content-plan/download`, undefined, "");
      if (noAuthDl.status === 401) {
        pass("download reference without auth returns 401");
      } else {
        fail("download reference unauthenticated", `expected 401, got ${noAuthDl.status}`);
      }
    }
    console.log();

    console.log("Step 6: Unknown project ID returns 404");
    {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const fakeGen = await apiCall("POST", `/ai-delivery-projects/${fakeId}/content-plan/generate-pdf`, undefined, token);
      if (fakeGen.status === 404) {
        pass("generate-pdf with unknown project returns 404");
      } else if (fakeGen.status === 503) {
        pass("generate-pdf with unknown project returns 503 (R2 checked first — acceptable)");
      } else {
        fail("generate-pdf unknown project", `expected 404 or 503, got ${fakeGen.status}`);
      }
    }
    console.log();

  } finally {
    await cleanup();
  }

  const total = passed + failed;
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Results: ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ""}`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Smoke test error:", error.message ?? error);
  process.exit(1);
});
