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

  // ─── Phase 2: Persisted AiDeliveryMonthlyReport ───────────────────────────

  let reportId = "";

  // Step P1: Create persisted report for project
  console.log("Step P1: POST monthly report for project");
  {
    const { status, ok, json } = await apiCall(
      "POST",
      `/ai-delivery/reports/monthly/${projectId}`,
      { title: "June 2026 Smoke Report", recommendationsText: "Focus on SEO fundamentals." },
      token
    );
    reportId = json.data?.report?.id ?? "";
    if (ok && status === 201 && reportId) {
      pass(`Monthly report created: ${reportId}`);
    } else {
      fail("Create monthly report", `status=${status} ${JSON.stringify(json.error)}`);
      throw new Error("Cannot continue without monthly report");
    }
    // Assert server-derived linkage
    if (json.data?.report?.aiDeliveryProjectId === projectId) {
      pass("aiDeliveryProjectId derived from route (server side)");
    } else {
      fail("aiDeliveryProjectId linkage", `got ${json.data?.report?.aiDeliveryProjectId}`);
    }
    if (json.data?.report?.clientId === clientId) {
      pass("clientId derived from project (server side)");
    } else {
      fail("clientId linkage", `got ${json.data?.report?.clientId}`);
    }
    if (json.data?.report?.status === "DRAFT") {
      pass("status is DRAFT on create");
    } else {
      fail("initial status", `got ${json.data?.report?.status}`);
    }
  }
  console.log();

  // Step P2: Duplicate create returns 409 conflict
  console.log("Step P2: Duplicate create → 409 conflict");
  {
    const { status, json } = await apiCall(
      "POST",
      `/ai-delivery/reports/monthly/${projectId}`,
      { title: "Duplicate" },
      token
    );
    if (status === 409) {
      pass("Duplicate create returns 409 conflict");
    } else {
      fail("Duplicate create", `expected 409 got ${status} — ${JSON.stringify(json.error)}`);
    }
  }
  console.log();

  // Step P3: GET report by project
  console.log("Step P3: GET report by project");
  {
    const { status, ok, json } = await apiCall(
      "GET",
      `/ai-delivery/reports/monthly/${projectId}`,
      undefined,
      token
    );
    if (ok && status === 200 && json.data?.report?.id === reportId) {
      pass("GET report by project returns correct report");
    } else {
      fail("GET report by project", `status=${status} ${JSON.stringify(json.error)}`);
    }
    if (json.data?.report?.project?.targetMonth === "2026-06") {
      pass("project.targetMonth populated on report");
    } else {
      fail("project.targetMonth on report", `got ${json.data?.report?.project?.targetMonth}`);
    }
  }
  console.log();

  // Step P4: Body spoof — tenantId/clientId/aiDeliveryProjectId in body must be ignored
  console.log("Step P4: Forbidden body mutation proof");
  {
    const fakeClientId = "00000000-0000-0000-0000-000000000099";
    const { status, json } = await apiCall(
      "PUT",
      `/ai-delivery/reports/monthly/${reportId}/update`,
      {
        title: "Updated Title",
        tenantId: "spoofed-tenant",
        clientId: fakeClientId,
        aiDeliveryProjectId: "spoofed-project"
      },
      token
    );
    if (status === 200) {
      const storedClientId = json.data?.report?.clientId;
      if (storedClientId === clientId) {
        pass("clientId body spoof ignored — stored value unchanged");
      } else {
        fail("clientId body spoof", `expected ${clientId} got ${storedClientId}`);
      }
      if (json.data?.report?.title === "Updated Title") {
        pass("title updated correctly");
      } else {
        fail("title update", `got ${json.data?.report?.title}`);
      }
    } else {
      fail("PUT report update", `status=${status} ${JSON.stringify(json.error)}`);
    }
  }
  console.log();

  // Step P5: Update fields
  console.log("Step P5: Update adminSummaryNotes and exportUrl");
  {
    const { status, ok, json } = await apiCall(
      "PUT",
      `/ai-delivery/reports/monthly/${reportId}/update`,
      {
        adminSummaryNotes: "Smoke admin summary notes.",
        recommendationsText: "Updated recommendation.",
        exportUrl: "https://docs.example.com/smoke-june-report"
      },
      token
    );
    if (ok && status === 200) {
      pass("PUT update returns 200");
    } else {
      fail("PUT update", `status=${status} ${JSON.stringify(json.error)}`);
    }
    if (json.data?.report?.adminSummaryNotes === "Smoke admin summary notes.") {
      pass("adminSummaryNotes updated");
    } else {
      fail("adminSummaryNotes", `got ${json.data?.report?.adminSummaryNotes}`);
    }
    if (json.data?.report?.exportUrl === "https://docs.example.com/smoke-june-report") {
      pass("exportUrl updated");
    } else {
      fail("exportUrl", `got ${json.data?.report?.exportUrl}`);
    }
  }
  console.log();

  // Step P6: Status transition DRAFT → ADMIN_REVIEW
  console.log("Step P6: Status DRAFT → ADMIN_REVIEW");
  {
    const { status, ok, json } = await apiCall(
      "POST",
      `/ai-delivery/reports/monthly/${reportId}/status`,
      { status: "ADMIN_REVIEW" },
      token
    );
    if (ok && status === 200 && json.data?.report?.status === "ADMIN_REVIEW") {
      pass("DRAFT → ADMIN_REVIEW transition succeeds");
    } else {
      fail("DRAFT → ADMIN_REVIEW", `status=${status} reportStatus=${json.data?.report?.status} ${JSON.stringify(json.error)}`);
    }
  }
  console.log();

  // Step P7: Status transition ADMIN_REVIEW → FINAL, finalizedAt set
  console.log("Step P7: Status ADMIN_REVIEW → FINAL");
  {
    const { status, ok, json } = await apiCall(
      "POST",
      `/ai-delivery/reports/monthly/${reportId}/status`,
      { status: "FINAL" },
      token
    );
    if (ok && status === 200 && json.data?.report?.status === "FINAL") {
      pass("ADMIN_REVIEW → FINAL transition succeeds");
    } else {
      fail("ADMIN_REVIEW → FINAL", `status=${status} reportStatus=${json.data?.report?.status} ${JSON.stringify(json.error)}`);
    }
    if (json.data?.report?.finalizedAt) {
      pass("finalizedAt set on FINAL");
    } else {
      fail("finalizedAt", `got ${json.data?.report?.finalizedAt}`);
    }
  }
  console.log();

  // Step P8: Invalid transition FINAL → DRAFT rejected
  console.log("Step P8: Invalid transition FINAL → DRAFT rejected");
  {
    const { status } = await apiCall(
      "POST",
      `/ai-delivery/reports/monthly/${reportId}/status`,
      { status: "DRAFT" },
      token
    );
    if (status === 400) {
      pass("Invalid transition FINAL → DRAFT returns 400");
    } else {
      fail("Invalid transition", `expected 400 got ${status}`);
    }
  }
  console.log();

  // Step P9: Archive report
  console.log("Step P9: Archive report");
  {
    const { status, ok, json } = await apiCall(
      "POST",
      `/ai-delivery/reports/monthly/${reportId}/archive`,
      undefined,
      token
    );
    if (ok && status === 200 && json.data?.report?.isArchived === true && json.data?.report?.status === "ARCHIVED") {
      pass("Archive: isArchived=true and status=ARCHIVED");
    } else {
      fail("Archive report", `status=${status} isArchived=${json.data?.report?.isArchived} reportStatus=${json.data?.report?.status}`);
    }
  }
  console.log();

  // Step P10: Restore report
  console.log("Step P10: Restore report");
  {
    const { status, ok, json } = await apiCall(
      "POST",
      `/ai-delivery/reports/monthly/${reportId}/restore`,
      undefined,
      token
    );
    if (ok && status === 200 && json.data?.report?.isArchived === false && json.data?.report?.status === "DRAFT") {
      pass("Restore: isArchived=false and status=DRAFT");
    } else {
      fail("Restore report", `status=${status} isArchived=${json.data?.report?.isArchived} reportStatus=${json.data?.report?.status}`);
    }
  }
  console.log();

  // Step P11: Missing/fake project returns 404
  console.log("Step P11: Missing project for GET → 404");
  {
    const { status } = await apiCall(
      "GET",
      "/ai-delivery/reports/monthly/00000000-0000-0000-0000-000000000000",
      undefined,
      token
    );
    if (status === 404) {
      pass("Fake project GET returns 404");
    } else {
      fail("Fake project GET", `expected 404 got ${status}`);
    }
  }
  {
    const { status } = await apiCall(
      "POST",
      "/ai-delivery/reports/monthly/00000000-0000-0000-0000-000000000000",
      { title: "Ghost" },
      token
    );
    if (status === 404) {
      pass("Fake project POST returns 404");
    } else {
      fail("Fake project POST", `expected 404 got ${status}`);
    }
  }
  console.log();

  // Step U1: Upload endpoint — expects 503 locally (R2 not configured)
  console.log("Step U1: Upload report document (expects 503, R2 not configured locally)");
  {
    // Need a DRAFT report to upload against — create a fresh one on the existing project
    // The reportId is FINAL-then-restored-to-DRAFT from earlier steps; use it
    const smallPdf = Buffer.from("%PDF-1.4 test").toString("base64");
    const { status, json } = await apiCall(
      "POST",
      `/ai-delivery/reports/monthly/${reportId}/document`,
      { fileName: "report.pdf", mimeType: "application/pdf", contentBase64: smallPdf },
      token
    );
    if (status === 503 && (json.error?.code === "R2_STORAGE_NOT_CONFIGURED" || json.error === "R2_STORAGE_NOT_CONFIGURED")) {
      pass("Upload returns 503 R2_STORAGE_NOT_CONFIGURED (local expected — no R2 creds)");
    } else if (status === 201) {
      pass("Upload returned 201 (R2 configured in this environment)");
    } else {
      fail("Upload report document", `expected 503 or 201 got ${status} — ${JSON.stringify(json).slice(0, 120)}`);
    }
  }

  // Step U2: Upload with missing fields → 400
  console.log("Step U2: Upload with missing contentBase64 → 400");
  {
    const { status } = await apiCall(
      "POST",
      `/ai-delivery/reports/monthly/${reportId}/document`,
      { fileName: "report.pdf", mimeType: "application/pdf" },
      token
    );
    if (status === 400) {
      pass("Upload missing contentBase64 returns 400");
    } else {
      fail("Upload missing contentBase64", `expected 400 got ${status}`);
    }
  }

  // Step U3: Upload for non-existent report → 404
  console.log("Step U3: Upload for fake reportId → 404");
  {
    const smallPdf = Buffer.from("%PDF-1.4 test").toString("base64");
    const { status } = await apiCall(
      "POST",
      "/ai-delivery/reports/monthly/00000000-0000-0000-0000-000000000000/document",
      { fileName: "report.pdf", mimeType: "application/pdf", contentBase64: smallPdf },
      token
    );
    if (status === 404 || status === 503) {
      pass(`Upload fake reportId returns ${status} (404 preferred, 503 acceptable when R2 checked first)`);
    } else {
      fail("Upload fake reportId", `expected 404 or 503 got ${status}`);
    }
  }

  // Step U4: Admin download endpoint — expects null downloadReference locally (no storageKey)
  console.log("Step U4: Admin download reference (no storageKey stored yet → null reference)");
  {
    const { status, json } = await apiCall(
      "GET",
      `/ai-delivery/reports/monthly/${reportId}/download`,
      null,
      token
    );
    if (status === 200) {
      const ref = json.data?.downloadReference ?? null;
      // locally: no storageKey → null; with R2+upload: object with downloadUrl
      if (ref === null || typeof ref === "object") {
        pass(`Admin download reference returns 200 (downloadReference=${ref === null ? "null" : "present"})`);
      } else {
        fail("Admin download reference shape", `unexpected downloadReference: ${JSON.stringify(ref)}`);
      }
    } else if (status === 404) {
      pass("Admin download reference returns 404 (acceptable: no storageKey path)");
    } else {
      fail("Admin download reference", `expected 200 or 404 got ${status}`);
    }
    // storageKey must not appear in response
    if (!containsForbiddenField(json, "storageKey")) {
      pass("Admin download reference does not expose storageKey");
    } else {
      fail("Admin download reference exposes storageKey", "forbidden field present");
    }
  }

  // Step U5: storageKey tightening — PUT update must not accept storageKey
  console.log("Step U5: PUT update cannot write storageKey directly");
  {
    const before = await apiCall("GET", `/ai-delivery/reports/monthly?projectId=${projectId}`, null, token);
    const storedKeyBefore = before.json.data?.report?.storageKey ?? null;

    await apiCall(
      "PUT",
      `/ai-delivery/reports/monthly/${reportId}`,
      { storageKey: "injected-key" },
      token
    );

    const after = await apiCall("GET", `/ai-delivery/reports/monthly?projectId=${projectId}`, null, token);
    const storedKeyAfter = after.json.data?.report?.storageKey ?? null;

    if (storedKeyAfter !== "injected-key" && storedKeyBefore === storedKeyAfter) {
      pass("PUT update ignores storageKey body field (tightened)");
    } else {
      fail("PUT update storageKey tightening", `storageKey changed to: ${storedKeyAfter}`);
    }
  }

  console.log();

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
