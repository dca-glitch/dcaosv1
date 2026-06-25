#!/usr/bin/env node

/**
 * Monthly Report Phase 1 focused smoke test.
 *
 * Proves the schema-free admin-only computed monthly summary endpoint:
 *   GET /api/v1/ai-delivery/reports/monthly-summary?projectId=<id>
 *
 * Steps:
 *  1. Admin login
 *  2. Create client + AI Delivery project with targetMonth
 *  3. Create a DELIVERED deliverable (final — must appear in summary)
 *  4. Create a DRAFT deliverable (internal — must NOT appear in summary)
 *  5. Call GET /api/v1/ai-delivery/reports/monthly-summary?projectId=...
 *  6. Assert: 200, project header, final deliverable present, DRAFT excluded, totals correct
 *  7. Assert: deferred GA/GSC/trends/recommendations statuses are explicit
 *  8. Assert: forbidden fields absent in full response JSON
 *  9. Missing projectId returns 400
 * 10. Fake/random projectId returns 404
 * 11. Cross-tenant spoof: reported accurately if second-tenant fixture unavailable
 */

const API_BASE = process.env.API_BASE || "http://localhost:4000/api/v1";
const ADMIN_EMAIL = "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD || "";

const FORBIDDEN_FIELDS = [
  "storageKey",
  "tenantId",
  "workflowRunId",
  "executionLog",
  "executionError",
  "draftBody",
  "prompt",
  "styleNotes",
  "reviewNotes",
  "reviewerName",
  "resultPlaceholder",
  "adminNotes"
];

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
  const json = await response.json();
  return { status: response.status, ok: response.ok, json };
}

function containsForbiddenField(obj, fieldName) {
  const text = JSON.stringify(obj);
  // Use word-boundary equivalent: field name preceded/followed by non-alphanumeric
  const pattern = new RegExp(`(?:^|[^A-Za-z0-9_])${fieldName}(?:[^A-Za-z0-9_]|$)`);
  return pattern.test(text);
}

async function main() {
  console.log("🔍 Monthly Report Phase 1 smoke test\n");

  if (!ADMIN_PASSWORD) {
    throw new Error("AUTH_SEED_TEST_PASSWORD environment variable is required");
  }

  let token = "";
  let clientId = "";
  let projectId = "";
  let deliverableDeliveredId = "";

  // Step 1: Admin login
  console.log("Step 1: Admin login");
  {
    const { ok, json } = await apiCall("POST", "/auth/login", {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    token = json.data?.session?.token ?? "";
    if (ok && token) {
      pass("Admin login returned auth token");
    } else {
      fail("Admin login", `status ${json.status}`);
      throw new Error("Cannot continue without auth token");
    }
  }
  console.log();

  // Step 2a: Create a client
  console.log("Step 2a: Create smoke client");
  {
    const { ok, json } = await apiCall("POST", "/clients", {
      name: "Smoke Monthly Report Client",
      email: "smoke-monthly-report@dca.local"
    }, token);
    clientId = json.data?.client?.id ?? "";
    if (ok && clientId) {
      pass(`Client created: ${clientId}`);
    } else {
      fail("Create client", JSON.stringify(json.error));
      throw new Error("Cannot continue without client");
    }
  }
  console.log();

  // Step 2b: Create AI Delivery project with targetMonth
  console.log("Step 2b: Create AI Delivery project");
  {
    const { ok, json } = await apiCall("POST", "/ai-delivery-projects", {
      clientId,
      name: "Smoke Monthly Report Project",
      targetMonth: "2026-06"
    }, token);
    projectId = json.data?.aiDeliveryProject?.id ?? "";
    if (ok && projectId) {
      pass(`Project created: ${projectId}, targetMonth=2026-06`);
    } else {
      fail("Create AI Delivery project", JSON.stringify(json.error));
      throw new Error("Cannot continue without project");
    }
  }
  console.log();

  // Step 3a: Create DRAFT content draft (anchor for article image)
  console.log("Step 3a: Create DRAFT content draft");
  let contentDraftId = "";
  {
    const { ok, json } = await apiCall(
      "POST",
      `/ai-delivery-projects/${projectId}/content-drafts`,
      { title: "Smoke Article Draft", draftBody: "Smoke test article body.", status: "DRAFT" },
      token
    );
    contentDraftId = json.data?.contentDraft?.id ?? "";
    if (ok && contentDraftId) {
      pass(`Content draft created: ${contentDraftId}`);
    } else {
      fail("Create content draft", JSON.stringify(json.error));
      throw new Error("Cannot continue without content draft");
    }
  }
  console.log();

  // Step 3b: Create article image with status APPROVED (valid at create time per proven browser proof)
  console.log("Step 3b: Create APPROVED article image");
  let articleImageId = "";
  {
    const { ok, json } = await apiCall(
      "POST",
      `/ai-delivery-projects/${projectId}/article-images`,
      { title: "Smoke Header Image", prompt: "Minimal smoke test image", contentDraftId, status: "APPROVED" },
      token
    );
    articleImageId = json.data?.articleImage?.id ?? "";
    if (ok && articleImageId) {
      pass(`Article image created APPROVED: ${articleImageId}`);
    } else {
      fail("Create APPROVED article image", JSON.stringify(json.error));
      throw new Error("Cannot continue without approved article image");
    }
  }
  console.log();

  // Step 3c: Create DELIVERED deliverable linked to APPROVED image
  console.log("Step 3c: Create DELIVERED deliverable");
  {
    const { ok, json } = await apiCall(
      "POST",
      `/ai-delivery-projects/${projectId}/deliverables`,
      {
        title: "Smoke Delivered Article",
        deliveryType: "ARTICLE_IMAGE",
        status: "DELIVERED",
        articleImageId,
        exportUrl: "https://docs.example.com/smoke-article"
      },
      token
    );
    deliverableDeliveredId = json.data?.deliverable?.id ?? "";
    if (ok && deliverableDeliveredId) {
      pass(`DELIVERED deliverable created: ${deliverableDeliveredId}`);
    } else {
      fail("Create DELIVERED deliverable", JSON.stringify(json.error));
      throw new Error("Cannot continue without DELIVERED deliverable");
    }
  }
  console.log();

  // Step 4: Create DRAFT deliverable (must NOT appear in summary)
  console.log("Step 4: Create DRAFT deliverable");
  {
    const { ok, json } = await apiCall(
      "POST",
      `/ai-delivery-projects/${projectId}/deliverables`,
      {
        title: "Smoke Draft Internal",
        deliveryType: "CONTENT_PACKAGE",
        status: "DRAFT"
      },
      token
    );
    const draftId = json.data?.deliverable?.id ?? "";
    if (ok && draftId) {
      pass(`DRAFT deliverable created: ${draftId}`);
    } else {
      fail("Create DRAFT deliverable", JSON.stringify(json.error));
      throw new Error("Cannot continue without DRAFT deliverable");
    }
  }
  console.log();

  // Step 5-8: Call monthly summary endpoint and validate
  console.log("Step 5: GET /ai-delivery/reports/monthly-summary");
  let summaryData = null;
  {
    const { status, ok, json } = await apiCall(
      "GET",
      `/ai-delivery/reports/monthly-summary?projectId=${projectId}`,
      undefined,
      token
    );
    if (ok && status === 200) {
      pass("200 OK returned");
    } else {
      fail("Monthly summary 200", `status=${status}, error=${JSON.stringify(json.error)}`);
      throw new Error("Cannot validate response shape without 200");
    }
    summaryData = json.data?.summary;

    // Step 6a: Project header
    if (summaryData?.project?.id === projectId) {
      pass("project.id matches requested project");
    } else {
      fail("project.id", `got ${summaryData?.project?.id}`);
    }
    if (summaryData?.project?.targetMonth === "2026-06") {
      pass("project.targetMonth = 2026-06");
    } else {
      fail("project.targetMonth", `got ${summaryData?.project?.targetMonth}`);
    }
    if (summaryData?.project?.clientName === "Smoke Monthly Report Client") {
      pass("project.clientName populated");
    } else {
      fail("project.clientName", `got ${summaryData?.project?.clientName}`);
    }

    // Step 6b: DELIVERED deliverable appears
    const deliverables = summaryData?.deliverables ?? [];
    const foundDelivered = deliverables.find((d) => d.id === deliverableDeliveredId);
    if (foundDelivered) {
      pass("DELIVERED deliverable appears in summary.deliverables");
    } else {
      fail("DELIVERED deliverable missing from summary.deliverables");
    }
    if (foundDelivered?.exportUrl === "https://docs.example.com/smoke-article") {
      pass("exportUrl preserved on deliverable row");
    } else {
      fail("exportUrl on deliverable row", `got ${foundDelivered?.exportUrl}`);
    }

    // Step 6c: DRAFT deliverable excluded
    const hasDraft = deliverables.some((d) => d.status === "DRAFT");
    if (!hasDraft) {
      pass("DRAFT deliverable excluded from summary.deliverables");
    } else {
      fail("DRAFT deliverable incorrectly appears in summary.deliverables");
    }

    // Step 6d: Totals match final deliverables only
    const totals = summaryData?.totals;
    if (totals?.deliverableCount === 1 && totals?.deliveredCount === 1 && totals?.acceptedCount === 0) {
      pass(`totals correct: deliverableCount=1, deliveredCount=1, acceptedCount=0`);
    } else {
      fail("totals", JSON.stringify(totals));
    }

    // Step 7: Deferred statuses explicit
    const deferred = summaryData?.deferred;
    if (deferred?.gaGscMetricsStatus === "DEFERRED") {
      pass("deferred.gaGscMetricsStatus = DEFERRED");
    } else {
      fail("deferred.gaGscMetricsStatus", `got ${deferred?.gaGscMetricsStatus}`);
    }
    if (deferred?.trendMonthsStatus === "DEFERRED") {
      pass("deferred.trendMonthsStatus = DEFERRED");
    } else {
      fail("deferred.trendMonthsStatus", `got ${deferred?.trendMonthsStatus}`);
    }
    if (deferred?.recommendationsStatus === "DEFERRED_REQUIRES_PERSISTED_REPORT") {
      pass("deferred.recommendationsStatus = DEFERRED_REQUIRES_PERSISTED_REPORT");
    } else {
      fail("deferred.recommendationsStatus", `got ${deferred?.recommendationsStatus}`);
    }

    // Step 8: Forbidden fields absent in full JSON response
    const rawJson = JSON.stringify(json);
    for (const field of FORBIDDEN_FIELDS) {
      if (containsForbiddenField(rawJson, field)) {
        fail(`Forbidden field "${field}" found in response`);
      } else {
        pass(`Forbidden field "${field}" absent`);
      }
    }
  }
  console.log();

  // Step 9: Missing projectId returns 400
  console.log("Step 9: Missing projectId → 400");
  {
    const { status } = await apiCall(
      "GET",
      "/ai-delivery/reports/monthly-summary",
      undefined,
      token
    );
    if (status === 400) {
      pass("Missing projectId returns 400");
    } else {
      fail("Missing projectId", `expected 400 got ${status}`);
    }
  }
  console.log();

  // Step 10: Fake projectId returns 404
  console.log("Step 10: Fake projectId → 404");
  {
    const { status } = await apiCall(
      "GET",
      "/ai-delivery/reports/monthly-summary?projectId=00000000-0000-0000-0000-000000000000",
      undefined,
      token
    );
    if (status === 404) {
      pass("Fake projectId returns 404");
    } else {
      fail("Fake projectId", `expected 404 got ${status}`);
    }
  }
  console.log();

  // Step 11: Cross-tenant spoof note (no second tenant available locally by default)
  console.log("Step 11: Cross-tenant spoof (recorded, not faked)");
  console.log("  ℹ️  NOTE: Cross-tenant negative proof requires a real second-tenant fixture.");
  console.log("  ℹ️  Tenant isolation is enforced at runtime by tenantId scoping (same pattern as all other AI Delivery endpoints).");
  console.log("  ℹ️  Not claiming PASS here; a full cross-tenant proof should be added when a second-tenant smoke fixture is available.\n");

  // Summary
  console.log("─────────────────────────────────────────────");
  console.log(`Monthly Report smoke: ${passed} PASS / ${failed} FAIL`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌ Smoke test error:", err.message ?? err);
  process.exit(1);
});
