#!/usr/bin/env node

/**
 * Monthly Report PDF generation focused smoke test.
 *
 * Proves the admin-only PDF generation endpoint:
 *   POST /api/v1/ai-delivery/reports/monthly/:reportId/generate-pdf
 *
 * Steps:
 *  1. Admin login
 *  2. Create client + AI Delivery project + monthly report
 *  3. Create a DELIVERED deliverable for the computed summary
 *  4. Import + approve a monthly metrics snapshot
 *  5. Generate the monthly report PDF
 *  6. Confirm report.hasDocument becomes true and response stays safe
 *  7. Confirm the admin download reference works and yields PDF bytes
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

function containsForbiddenField(value, fieldName) {
  const text = JSON.stringify(value);
  const pattern = new RegExp(`(?:^|[^A-Za-z0-9_])${fieldName}(?:[^A-Za-z0-9_]|$)`);
  return pattern.test(text);
}

async function main() {
  console.log("🔍 Monthly Report PDF smoke test\n");

  if (!ADMIN_PASSWORD) {
    throw new Error("AUTH_SEED_TEST_PASSWORD environment variable is required");
  }

  let token = "";
  let clientId = "";
  let projectId = "";
  let reportId = "";
  let contentDraftId = "";
  let articleImageId = "";
  let deliverableId = "";
  let snapshotId = "";

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
    if (!token) {
      return;
    }
    console.log("Cleanup: archive smoke-owned records");
    const tasks = [
      contentDraftId ? ["POST", `/ai-delivery-projects/${projectId}/content-drafts/${contentDraftId}/archive`] : null,
      articleImageId ? ["POST", `/ai-delivery-projects/${projectId}/article-images/${articleImageId}/archive`] : null,
      deliverableId ? ["POST", `/ai-delivery-projects/${projectId}/deliverables/${deliverableId}/archive`] : null,
      snapshotId ? ["POST", `/ai-delivery/reports/monthly/${reportId}/metrics/${snapshotId}/archive`] : null,
      reportId ? ["POST", `/ai-delivery/reports/monthly/${reportId}/archive`] : null,
      projectId ? ["POST", `/ai-delivery-projects/${projectId}/archive`] : null,
      clientId ? ["POST", `/clients/${clientId}/archive`] : null
    ].filter(Boolean);

    for (const [method, path] of tasks) {
      await apiCall(method, path, undefined, token);
    }
  };

  try {
    console.log("Step 2: Create client");
    {
      const { ok, json } = await apiCall(
        "POST",
        "/clients",
        {
          name: "Smoke PDF Client",
          email: "smoke-pdf-client@dca.local"
        },
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

    console.log("Step 3: Create AI Delivery project");
    {
      const { ok, json } = await apiCall(
        "POST",
        "/ai-delivery-projects",
        {
          clientId,
          name: "Smoke PDF Project",
          targetMonth: "2026-06"
        },
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

    console.log("Step 4: Create persisted monthly report");
    {
      const { ok, json } = await apiCall(
        "POST",
        `/ai-delivery/reports/monthly/${projectId}`,
        {
          title: "Smoke PDF Monthly Report",
          adminSummaryNotes: "PDF smoke summary notes.",
          recommendationsText: "Keep shipping the monthly report PDF path."
        },
        token
      );
      reportId = json?.data?.report?.id ?? "";
      if (ok && reportId) {
        pass(`Monthly report created: ${reportId}`);
      } else {
        fail("Create monthly report", JSON.stringify(json?.error ?? json));
        throw new Error("Cannot continue without monthly report");
      }
    }
    console.log();

    console.log("Step 5a: Create DRAFT content draft");
    {
      const { ok, json } = await apiCall(
        "POST",
        `/ai-delivery-projects/${projectId}/content-drafts`,
        {
          title: "Smoke PDF Content Draft",
          draftBody: "Smoke PDF content draft body.",
          status: "DRAFT"
        },
        token
      );
      contentDraftId = json?.data?.contentDraft?.id ?? "";
      if (ok && contentDraftId) {
        pass(`Content draft created: ${contentDraftId}`);
      } else {
        fail("Create content draft", JSON.stringify(json?.error ?? json));
        throw new Error("Cannot continue without content draft");
      }
    }
    console.log();

    console.log("Step 5b: Create APPROVED article image");
    {
      const { ok, json } = await apiCall(
        "POST",
        `/ai-delivery-projects/${projectId}/article-images`,
        {
          contentDraftId,
          title: "Smoke PDF Article Image",
          prompt: "Simple admin-safe image reference for PDF smoke.",
          status: "APPROVED"
        },
        token
      );
      articleImageId = json?.data?.articleImage?.id ?? "";
      if (ok && articleImageId) {
        pass(`Article image created: ${articleImageId}`);
      } else {
        fail("Create article image", JSON.stringify(json?.error ?? json));
        throw new Error("Cannot continue without article image");
      }
    }
    console.log();

    console.log("Step 5c: Create DELIVERED deliverable");
    {
      const { ok, json } = await apiCall(
        "POST",
        `/ai-delivery-projects/${projectId}/deliverables`,
        {
          title: "Smoke PDF Deliverable",
          deliveryType: "ARTICLE_IMAGE",
          status: "DELIVERED",
          articleImageId,
          exportUrl: "https://docs.example.com/smoke-pdf-deliverable"
        },
        token
      );
      deliverableId = json?.data?.deliverable?.id ?? "";
      if (ok && deliverableId) {
        pass(`Deliverable created: ${deliverableId}`);
      } else {
        fail("Create deliverable", JSON.stringify(json?.error ?? json));
        throw new Error("Cannot continue without delivered deliverable");
      }
    }
    console.log();

    console.log("Step 6: Import monthly metrics snapshot");
    {
      const { ok, json } = await apiCall(
        "POST",
        `/ai-delivery/reports/monthly/${reportId}/metrics/import`,
        {
          targetMonth: "2026-06",
          sourceType: "HYBRID",
          status: "IMPORTED",
          gscClicks: 123,
          gscImpressions: 4567,
          gscAverageCtr: 2.5,
          gscAveragePosition: 8.75,
          ga4Sessions: 321,
          ga4Users: 210,
          ga4PageViews: 654,
          notes: "PDF smoke metrics snapshot."
        },
        token
      );
      snapshotId = json?.data?.snapshot?.id ?? "";
      if (ok && snapshotId) {
        pass(`Metrics snapshot imported: ${snapshotId}`);
      } else {
        fail("Import metrics snapshot", JSON.stringify(json?.error ?? json));
        throw new Error("Cannot continue without metrics snapshot");
      }
    }
    console.log();

    console.log("Step 7: Approve monthly metrics snapshot");
    {
      const { ok, json } = await apiCall(
        "POST",
        `/ai-delivery/reports/monthly/${reportId}/metrics/${snapshotId}/approve`,
        undefined,
        token
      );
      const status = json?.data?.snapshot?.status ?? "";
      if (ok && status === "APPROVED") {
        pass("Metrics snapshot approved");
      } else {
        fail("Approve metrics snapshot", JSON.stringify(json?.error ?? json));
        throw new Error("Cannot continue without approved metrics snapshot");
      }
    }
    console.log();

    console.log("Step 8: Generate PDF");
    let pdfGenerated = false;
    {
      const response = await apiCall("POST", `/ai-delivery/reports/monthly/${reportId}/generate-pdf`, undefined, token);
      const report = response.json?.data?.report ?? null;
      if (
        response.ok &&
        response.status === 201 &&
        report?.reportId === reportId &&
        report?.hasDocument === true &&
        typeof report?.generatedAt === "string" &&
        typeof report?.updatedAt === "string" &&
        typeof report?.fileName === "string" &&
        !containsForbiddenField(response.json, "storageKey")
      ) {
        pass("Generate PDF returned a safe admin response with hasDocument=true");
        pdfGenerated = true;
      } else if (
        response.status === 503 &&
        response.json?.error?.code === "R2_STORAGE_NOT_CONFIGURED"
      ) {
        pass("Generate PDF blocked by R2 not configured (local expected without R2 creds)");
      } else {
        fail("Generate PDF", JSON.stringify(response.json?.error ?? response.json ?? response.text));
        throw new Error("Cannot continue without successful PDF generation or expected local R2 gate");
      }
    }
    console.log();

    if (pdfGenerated) {
      console.log("Step 9: Download reference + PDF bytes");
      {
        const { ok, json } = await apiCall("GET", `/ai-delivery/reports/monthly/${reportId}/download`, undefined, token);
        const downloadReference = json?.data?.downloadReference ?? null;
        if (!ok || !downloadReference?.downloadUrl) {
          fail("Admin download reference", JSON.stringify(json?.error ?? json));
          throw new Error("Cannot continue without download reference");
        }
        pass("Admin download reference returned a safe signed URL");

        const downloadResponse = await fetch(downloadReference.downloadUrl);
        const bytes = Buffer.from(await downloadResponse.arrayBuffer());
        if (downloadResponse.ok && bytes.subarray(0, 4).toString("utf8") === "%PDF") {
          pass("Downloaded object starts with %PDF");
        } else {
          fail("Downloaded PDF bytes", `status=${downloadResponse.status}, firstBytes=${bytes.subarray(0, 4).toString("utf8")}`);
        }

        const pdfText = bytes.toString("latin1");
        if (!pdfText.includes("PDF smoke summary notes.")) {
          pass("Downloaded PDF does not embed admin-only adminSummaryNotes");
        } else {
          fail("Downloaded PDF admin field leak", "adminSummaryNotes text found in PDF bytes");
        }
      }
      console.log();
    } else {
      console.log("Step 9: Download reference + PDF bytes");
      console.log("  ⏭ SKIP: R2 not configured locally; PDF byte proof deferred to staging with bucket creds.");
      console.log();
    }

    console.log(`Summary: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await cleanup();
  }
}

main().catch((error) => {
  console.error("\nSmoke test failed:", error);
  process.exitCode = 1;
});
