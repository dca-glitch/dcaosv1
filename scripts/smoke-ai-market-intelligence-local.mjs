#!/usr/bin/env node

/**
 * Market Intelligence focused smoke test.
 *
 * This script tests the admin-only Market Intelligence foundation:
 * - Login as admin (admin@dca.local)
 * - Create a research project
 * - Add research sources
 * - Create and execute a research run
 * - Create and list market insights
 * - Cross-project negative isolation proof
 * - Body projectId spoof proof
 */

import { chromium } from "playwright";

const API_BASE = process.env.API_BASE || "http://localhost:4000/api/v1";
const WEB_BASE = process.env.WEB_BASE || "http://localhost:5173";
const ADMIN_EMAIL = "admin@dca.local";
const ADMIN_PASSWORD = process.env.AUTH_SEED_TEST_PASSWORD || "";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiCall(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${method} ${path} - ${response.status}`);
  }

  return response.json();
}

// Used for negative tests: asserts the request fails (non-2xx) and returns the status code.
async function apiCallExpectFailure(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (response.ok) {
    throw new Error(
      `Expected failure for ${method} ${path} but got ${response.status} (expected 4xx)`
    );
  }

  return response.status;
}

function makeSmokeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function main() {
  console.log("🔍 Starting Market Intelligence smoke test...\n");

  if (!ADMIN_PASSWORD) {
    throw new Error("AUTH_SEED_TEST_PASSWORD environment variable is required");
  }

  let token = "";
  let smokeClientId = "";
  let projectId = "";
  let projectBId = "";
  let sourceId = "";
  let runId = "";

  try {
    // Step 1: Login
    console.log("📋 Step 1: Logging in as admin...");
    const loginResponse = await apiCall("POST", "/auth/login", {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    token = loginResponse.data?.session?.token;
    if (!token) {
      throw new Error("Failed to get auth token");
    }
    console.log("✅ Admin login successful\n");

    console.log("📋 Step 1b: Creating smoke client for MI project linkage...");
    const createClientResponse = await apiCall(
      "POST",
      "/clients",
      {
        name: `[SMOKE][MI] ${Date.now()}`,
        country: "United States",
        clientKind: "AGENCY_CLIENT"
      },
      token
    );
    smokeClientId = createClientResponse.data?.client?.id;
    if (!smokeClientId) {
      throw new Error("Failed to create smoke client for Market Intelligence");
    }
    console.log(`✅ Created smoke client: ${smokeClientId}\n`);

    // Step 2: List projects (should start empty or with existing projects)
    console.log("📋 Step 2: Listing market intelligence projects...");
    const projectsResponse = await apiCall("GET", "/market-intelligence-projects", undefined, token);
    console.log(`✅ Found ${projectsResponse.data?.projects?.length || 0} projects\n`);

    // Step 3: Create a research project with research input fields
    console.log("📋 Step 3: Creating research project with research inputs...");
    const createProjectResponse = await apiCall(
      "POST",
      "/market-intelligence-projects",
      {
        title: "Q2 2026 Competitive Analysis",
        description: "Track competitor product launches and market positioning",
        keywords: "AI tools, market research, competitive analysis",
        competitors: "Acme Corp, Rival AI, DataInsights Ltd",
        niche: "B2B SaaS market research tools",
        productServiceFocus: "admin-operated market intelligence platform",
        clientId: smokeClientId,
        targetMonth: "2026-07",
        status: "ACTIVE"
      },
      token
    );

    projectId = createProjectResponse.data?.project?.id;
    if (!projectId) {
      throw new Error("Failed to create project");
    }
    // Verify new research input fields are returned
    const createdProject = createProjectResponse.data?.project;
    if (!createdProject?.keywords?.includes("AI tools")) {
      throw new Error("keywords field not persisted/returned");
    }
    if (!createdProject?.competitors?.includes("Acme Corp")) {
      throw new Error("competitors field not persisted/returned");
    }
    if (!createdProject?.niche) {
      throw new Error("niche field not persisted/returned");
    }
    if (!createdProject?.productServiceFocus) {
      throw new Error("productServiceFocus field not persisted/returned");
    }
    if (!createdProject?.clientId) {
      throw new Error("clientId field not persisted/returned");
    }
    if (!createdProject?.client?.name) {
      throw new Error("client relation not persisted/returned");
    }
    if (!createdProject?.targetMonth) {
      throw new Error("targetMonth field not persisted/returned");
    }
    console.log(`✅ Created project A with research inputs: ${projectId}\n`);

    // Step 4: Add multiple research sources for evidence context
    console.log("📋 Step 4: Adding multiple research sources...");
    const createSourceResponse1 = await apiCall(
      "POST",
      `/market-intelligence-projects/${projectId}/sources`,
      {
        title: "Competitor Blog",
        sourceType: "BLOG",
        sourceUrl: "https://competitor.example.com/blog",
        sourceNotes: "Monitor for product announcements"
      },
      token
    );

    const sourceId1 = createSourceResponse1.data?.source?.id;
    if (!sourceId1) {
      throw new Error("Failed to create source 1");
    }
    console.log(`✅ Created source 1: ${sourceId1}`);

    const createSourceResponse2 = await apiCall(
      "POST",
      `/market-intelligence-projects/${projectId}/sources`,
      {
        title: "Industry Report",
        sourceType: "REPORT",
        sourceUrl: "https://industry-analysis.example.com/q2-2026",
        sourceNotes: "Market trends and forecasts"
      },
      token
    );

    const sourceId2 = createSourceResponse2.data?.source?.id;
    if (!sourceId2) {
      throw new Error("Failed to create source 2");
    }
    console.log(`✅ Created source 2: ${sourceId2}`);

    const createSourceResponse3 = await apiCall(
      "POST",
      `/market-intelligence-projects/${projectId}/sources`,
      {
        title: "Customer Feedback Survey",
        sourceType: "SURVEY",
        sourceUrl: "https://internal.example.com/survey-results",
        sourceNotes: "Pain points and feature requests"
      },
      token
    );

    const sourceId3 = createSourceResponse3.data?.source?.id;
    if (!sourceId3) {
      throw new Error("Failed to create source 3");
    }
    console.log(`✅ Created source 3: ${sourceId3}\n`);

    // Step 5: List sources and verify count
    console.log("📋 Step 5: Listing research sources...");
    const sourcesResponse = await apiCall(
      "GET",
      `/market-intelligence-projects/${projectId}/sources`,
      undefined,
      token
    );
    const sourceCount = sourcesResponse.data?.sources?.length || 0;
    if (sourceCount !== 3) {
      throw new Error(`Expected 3 sources, found ${sourceCount}`);
    }
    console.log(`✅ Found ${sourceCount} sources (evidence context)\n`);

    // Step 6: Create research run
    console.log("📋 Step 6: Creating research run...");
    const createRunResponse = await apiCall(
      "POST",
      `/market-intelligence-projects/${projectId}/research-runs`,
      {
        projectId,
        status: "PENDING"
      },
      token
    );

    runId = createRunResponse.data?.researchRun?.id;
    if (!runId) {
      throw new Error("Failed to create research run");
    }
    console.log(`✅ Created research run: ${runId}\n`);

    // Step 7: Execute research run
    console.log("📋 Step 7: Executing research run...");
    const executeRunResponse = await apiCall(
      "POST",
      `/market-intelligence-projects/${projectId}/research-runs/${runId}/execute`,
      {},
      token
    );

    if (executeRunResponse.data?.researchRun?.status !== "EXECUTED") {
      throw new Error("Failed to execute research run");
    }
    if (!executeRunResponse.data?.researchRun?.resultSummary || !executeRunResponse.data?.researchRun?.executionLog) {
      throw new Error("Execution did not produce resultSummary or executionLog");
    }
    // Verify execution log mentions research inputs
    const execLog = executeRunResponse.data?.researchRun?.executionLog;
    if (!execLog?.includes("Keywords:") || !execLog?.includes("Niche:")) {
      throw new Error("Execution log does not reflect research input fields (keywords/niche)");
    }
    console.log(`✅ Research run executed with research-input-aware log: ${runId}\n`);

    console.log("📋 Step 7.5: Verifying auto-generated insight with evidence context and audienceSignals...");
    const autoInsightsResponse = await apiCall("GET", `/market-intelligence-projects/${projectId}/insights`, undefined, token);
    const autoInsight = autoInsightsResponse.data?.insights?.find(i => i.title.startsWith("Generated Insight"));
    if (!autoInsight || !autoInsight.resultData) {
      throw new Error("Failed to find auto-generated insight with structured resultData");
    }
    if (autoInsight.sourceCount !== 3) {
      throw new Error(`Expected insight to have sourceCount=3, found ${autoInsight.sourceCount}`);
    }
    // Verify audienceSignals is present in MARKET_INTELLIGENCE_RESULT_V1
    if (!autoInsight.resultData.audienceSignals || !Array.isArray(autoInsight.resultData.audienceSignals)) {
      throw new Error("auto-generated insight missing audienceSignals array in resultData");
    }
    if (!autoInsight.resultData.audienceSignals.some(s => s.includes("B2B SaaS"))) {
      throw new Error("audienceSignals does not reflect niche from research inputs");
    }
    console.log(`✅ Auto-generated insight has sourceCount=${autoInsight.sourceCount}, audienceSignals present (evidence context)`);

    // Update to APPROVED status
    await apiCall("PUT", `/market-intelligence-projects/${projectId}/insights/${autoInsight.id}`, {
      status: "APPROVED",
      reviewerNotes: "Verified - evidence from 3 sources looks solid"
    }, token);
    console.log(`✅ Auto-generated insight updated to APPROVED with reviewer notes: ${autoInsight.id}\n`);

    // Verify status update persisted
    const updatedInsightResponse = await apiCall("GET", `/market-intelligence-projects/${projectId}/insights`, undefined, token);
    const updatedInsight = updatedInsightResponse.data?.insights?.find(i => i.id === autoInsight.id);
    if (updatedInsight?.status !== "APPROVED") {
      throw new Error(`Expected status APPROVED, found ${updatedInsight?.status}`);
    }
    if (!updatedInsight?.reviewerNotes?.includes("Verified")) {
      throw new Error("Reviewer notes not persisted");
    }
    console.log(`✅ Status update persisted: ${updatedInsight.status}\n`);

    // Step 8: List research runs with traceability
    console.log("📋 Step 8: Listing research runs with evidence context...");
    const runsResponse = await apiCall(
      "GET",
      `/market-intelligence-projects/${projectId}/research-runs`,
      undefined,
      token
    );
    const runsCount = runsResponse.data?.researchRuns?.length || 0;
    if (runsCount < 1) {
      throw new Error("Expected at least 1 research run");
    }
    console.log(`✅ Found ${runsCount} research run(s)`);

    const executedRun = runsResponse.data?.researchRuns?.find(r => r.id === runId);
    if (!executedRun) {
      throw new Error("Failed to find executed run in list");
    }
    if (executedRun.sourceCount !== 3) {
      throw new Error(`Expected run to have sourceCount=3, found ${executedRun.sourceCount}`);
    }
    if (!executedRun.generatedInsightId) {
      throw new Error("Expected run to have generatedInsightId");
    }
    console.log(`✅ Run has sourceCount=${executedRun.sourceCount} and generatedInsightId=${executedRun.generatedInsightId} (traceability)\n`);

    // Step 9: Create market insight
    console.log("📋 Step 9: Creating market insight...");
    const createInsightResponse = await apiCall(
      "POST",
      `/market-intelligence-projects/${projectId}/insights`,
      {
        title: "Competitor Feature Gap",
        summary: "Competitor lacks AI-powered content optimization. Market opportunity for DCA OS Lite.",
        status: "DRAFT"
      },
      token
    );

    const insightId = createInsightResponse.data?.insight?.id;
    if (!insightId) {
      throw new Error("Failed to create insight");
    }
    console.log(`✅ Created insight: ${insightId}\n`);

    // Step 10: List insights with evidence context
    console.log("📋 Step 10: Listing market insights with evidence context...");
    const insightsResponse = await apiCall(
      "GET",
      `/market-intelligence-projects/${projectId}/insights`,
      undefined,
      token
    );
    const insightsCount = insightsResponse.data?.insights?.length || 0;
    if (insightsCount < 2) {
      throw new Error(`Expected at least 2 insights (1 manual + 1 auto-generated), found ${insightsCount}`);
    }
    console.log(`✅ Found ${insightsCount} insights`);

    // Verify all insights include source count
    const insightsWithoutSourceCount = insightsResponse.data?.insights?.filter(i => i.sourceCount === undefined);
    if (insightsWithoutSourceCount && insightsWithoutSourceCount.length > 0) {
      throw new Error(`Found ${insightsWithoutSourceCount.length} insights without sourceCount`);
    }
    console.log(`✅ All insights include sourceCount evidence context\n`);

    // =========================================================================
    // Step 11: Cross-project negative isolation proof
    // Resources from Project A must not be accessible or mutable via Project B URL.
    // =========================================================================
    console.log("📋 Step 11: Cross-project negative isolation proof...");

    const createProjectBResponse = await apiCall(
      "POST",
      "/market-intelligence-projects",
      {
        title: "Isolation Test Project B",
        description: "Used only for cross-project isolation proof",
        clientId: smokeClientId,
        status: "ACTIVE"
      },
      token
    );

    projectBId = createProjectBResponse.data?.project?.id;
    if (!projectBId) {
      throw new Error("Failed to create project B for isolation test");
    }
    console.log(`✅ Created project B: ${projectBId}`);

    // 11a: Update Project A source via Project B URL must fail
    const s11a = await apiCallExpectFailure(
      "PUT",
      `/market-intelligence-projects/${projectBId}/sources/${sourceId1}`,
      { title: "Should Not Update" },
      token
    );
    if (s11a < 400 || s11a >= 600) {
      throw new Error(`Expected 4xx for cross-project source update, got ${s11a}`);
    }
    console.log(`✅ Cross-project source update correctly rejected (${s11a})`);

    // 11b: Archive Project A source via Project B URL must fail
    const s11b = await apiCallExpectFailure(
      "POST",
      `/market-intelligence-projects/${projectBId}/sources/${sourceId1}/archive`,
      {},
      token
    );
    if (s11b < 400 || s11b >= 600) {
      throw new Error(`Expected 4xx for cross-project source archive, got ${s11b}`);
    }
    console.log(`✅ Cross-project source archive correctly rejected (${s11b})`);

    // 11c: Execute Project A run via Project B URL must fail
    const s11c = await apiCallExpectFailure(
      "POST",
      `/market-intelligence-projects/${projectBId}/research-runs/${runId}/execute`,
      {},
      token
    );
    if (s11c < 400 || s11c >= 600) {
      throw new Error(`Expected 4xx for cross-project run execute, got ${s11c}`);
    }
    console.log(`✅ Cross-project run execute correctly rejected (${s11c})`);

    // 11d: Update Project A insight via Project B URL must fail
    const s11d = await apiCallExpectFailure(
      "PUT",
      `/market-intelligence-projects/${projectBId}/insights/${insightId}`,
      { status: "APPROVED" },
      token
    );
    if (s11d < 400 || s11d >= 600) {
      throw new Error(`Expected 4xx for cross-project insight update, got ${s11d}`);
    }
    console.log(`✅ Cross-project insight update correctly rejected (${s11d})`);

    // 11e: Archive Project A insight via Project B URL must fail
    const s11e = await apiCallExpectFailure(
      "POST",
      `/market-intelligence-projects/${projectBId}/insights/${insightId}/archive`,
      {},
      token
    );
    if (s11e < 400 || s11e >= 600) {
      throw new Error(`Expected 4xx for cross-project insight archive, got ${s11e}`);
    }
    console.log(`✅ Cross-project insight archive correctly rejected (${s11e})\n`);

    // =========================================================================
    // Step 12: Body projectId spoof proof
    // Creating resources via Project A URL with body.projectId set to Project B
    // must attach records to Project A, never Project B.
    // =========================================================================
    console.log("📋 Step 12: Body projectId spoof proof...");

    // 12a: Create source via Project A URL, body contains projectBId
    const spoofSourceResponse = await apiCall(
      "POST",
      `/market-intelligence-projects/${projectId}/sources`,
      {
        projectId: projectBId,
        title: "Spoof Source Test",
        sourceType: "OTHER",
        sourceNotes: "Must belong to project A despite body projectId"
      },
      token
    );
    const spoofSourceProjectId = spoofSourceResponse.data?.source?.projectId;
    if (spoofSourceProjectId !== projectId) {
      throw new Error(
        `Spoof source attached to wrong project: expected ${projectId}, got ${spoofSourceProjectId}`
      );
    }
    console.log(`✅ Source spoof rejected — source belongs to project A (${spoofSourceProjectId})`);

    // 12b: Create research run via Project A URL, body contains projectBId
    const spoofRunResponse = await apiCall(
      "POST",
      `/market-intelligence-projects/${projectId}/research-runs`,
      {
        projectId: projectBId,
        status: "PENDING"
      },
      token
    );
    const spoofRunProjectId = spoofRunResponse.data?.researchRun?.projectId;
    if (spoofRunProjectId !== projectId) {
      throw new Error(
        `Spoof run attached to wrong project: expected ${projectId}, got ${spoofRunProjectId}`
      );
    }
    console.log(`✅ Run spoof rejected — run belongs to project A (${spoofRunProjectId})`);

    // 12c: Create insight via Project A URL, body contains projectBId
    const spoofInsightResponse = await apiCall(
      "POST",
      `/market-intelligence-projects/${projectId}/insights`,
      {
        projectId: projectBId,
        title: "Spoof Insight Test",
        summary: "Must belong to project A despite body projectId",
        status: "DRAFT"
      },
      token
    );
    const spoofInsightProjectId = spoofInsightResponse.data?.insight?.projectId;
    if (spoofInsightProjectId !== projectId) {
      throw new Error(
        `Spoof insight attached to wrong project: expected ${projectId}, got ${spoofInsightProjectId}`
      );
    }
    console.log(`✅ Insight spoof rejected — insight belongs to project A (${spoofInsightProjectId})\n`);

    // =========================================================================
    // Step 13: Internal Handoff lifecycle proof
    // =========================================================================
    console.log("📋 Step 13: Internal handoff prepare from approved insight...");

    // List handoffs (should be empty for this project initially)
    const handoffsEmptyRes = await apiCall("GET", `/market-intelligence-projects/${projectId}/handoffs`, undefined, token);
    console.log(`✅ Handoffs list endpoint accessible (${handoffsEmptyRes.data?.handoffs?.length ?? 0} handoffs before prepare)`);

    // Prepare handoff from the APPROVED auto-generated insight
    const prepareHandoffRes = await apiCall(
      "POST",
      `/market-intelligence-projects/${projectId}/handoffs/prepare`,
      { insightId: autoInsight.id },
      token
    );
    const handoff = prepareHandoffRes.data?.handoff;
    if (!handoff?.id) {
      throw new Error("Failed to prepare handoff from approved insight");
    }
    if (handoff.handoffStatus !== "DRAFT") {
      throw new Error(`Expected handoffStatus DRAFT, got ${handoff.handoffStatus}`);
    }
    if (!handoff.marketSummary) {
      throw new Error("handoff.marketSummary is missing");
    }
    if (!Array.isArray(handoff.audienceSignals) || handoff.audienceSignals.length === 0) {
      throw new Error("handoff.audienceSignals is missing or empty");
    }
    if (!Array.isArray(handoff.opportunities) || handoff.opportunities.length === 0) {
      throw new Error("handoff.opportunities is missing or empty");
    }
    if (!Array.isArray(handoff.risks) || handoff.risks.length === 0) {
      throw new Error("handoff.risks is missing or empty");
    }
    if (!Array.isArray(handoff.recommendedActions) || handoff.recommendedActions.length === 0) {
      throw new Error("handoff.recommendedActions is missing or empty");
    }
    if (!handoff.sourceNote) {
      throw new Error("handoff.sourceNote is missing");
    }
    if (handoff.projectId !== projectId) {
      throw new Error(`handoff.projectId mismatch: expected ${projectId}, got ${handoff.projectId}`);
    }
    if (handoff.insightId !== autoInsight.id) {
      throw new Error(`handoff.insightId mismatch`);
    }
    console.log(`✅ Handoff prepared: ${handoff.id} (DRAFT, audienceSignals/opportunities/risks/actions/sourceNote all present)`);

    // Verify targetClientName and targetMonth are populated from project
    if (!handoff.targetClientName) {
      throw new Error("handoff.targetClientName should be populated from project research inputs");
    }
    if (!handoff.targetMonth) {
      throw new Error("handoff.targetMonth should be populated from project research inputs");
    }
    console.log(`✅ Handoff has client context: ${handoff.targetClientName} / ${handoff.targetMonth}`);

    // Step 13b: Update handoff status to READY
    console.log("📋 Step 13b: Update handoff status DRAFT → READY...");
    const readyRes = await apiCall(
      "PUT",
      `/market-intelligence-projects/${projectId}/handoffs/${handoff.id}/status`,
      { handoffStatus: "READY" },
      token
    );
    if (readyRes.data?.handoff?.handoffStatus !== "READY") {
      throw new Error("Handoff status did not update to READY");
    }
    console.log(`✅ Handoff status updated to READY`);

    // Step 13c: Update handoff status to APPLIED
    const appliedRes = await apiCall(
      "PUT",
      `/market-intelligence-projects/${projectId}/handoffs/${handoff.id}/status`,
      { handoffStatus: "APPLIED" },
      token
    );
    if (appliedRes.data?.handoff?.handoffStatus !== "APPLIED") {
      throw new Error("Handoff status did not update to APPLIED");
    }
    console.log(`✅ Handoff status updated to APPLIED`);

    // Step 13d: List handoffs — should now have 1
    const handoffsListRes = await apiCall("GET", `/market-intelligence-projects/${projectId}/handoffs`, undefined, token);
    const handoffsList = handoffsListRes.data?.handoffs ?? [];
    if (handoffsList.length < 1) {
      throw new Error("Expected at least 1 handoff in list after prepare");
    }
    const listedHandoff = handoffsList.find(h => h.id === handoff.id);
    if (!listedHandoff) {
      throw new Error("Prepared handoff not found in list");
    }
    if (listedHandoff.handoffStatus !== "APPLIED") {
      throw new Error(`Expected APPLIED status in list, got ${listedHandoff.handoffStatus}`);
    }
    console.log(`✅ Handoffs list shows ${handoffsList.length} handoff(s), status=APPLIED`);

    // Step 13e: Reject non-APPROVED insight handoff prepare
    console.log("📋 Step 13e: Reject prepare from non-APPROVED insight...");
    const draftInsightRes = await apiCall(
      "POST",
      `/market-intelligence-projects/${projectId}/insights`,
      { title: "Draft Insight For Rejection Test", status: "DRAFT" },
      token
    );
    const draftInsightId = draftInsightRes.data?.insight?.id;
    if (!draftInsightId) {
      throw new Error("Failed to create draft insight for rejection test");
    }
    const rejectedStatus = await apiCallExpectFailure(
      "POST",
      `/market-intelligence-projects/${projectId}/handoffs/prepare`,
      { insightId: draftInsightId },
      token
    );
    if (rejectedStatus < 400 || rejectedStatus >= 600) {
      throw new Error(`Expected 4xx for non-approved insight handoff prepare, got ${rejectedStatus}`);
    }
    console.log(`✅ Non-approved insight handoff correctly rejected (${rejectedStatus})`);

    // Step 13f: Cross-project handoff isolation
    console.log("📋 Step 13f: Cross-project handoff isolation...");
    const crossHandoffStatus = await apiCallExpectFailure(
      "PUT",
      `/market-intelligence-projects/${projectBId}/handoffs/${handoff.id}/status`,
      { handoffStatus: "ARCHIVED" },
      token
    );
    if (crossHandoffStatus < 400 || crossHandoffStatus >= 600) {
      throw new Error(`Expected 4xx for cross-project handoff status update, got ${crossHandoffStatus}`);
    }
    console.log(`✅ Cross-project handoff status update correctly rejected (${crossHandoffStatus})\n`);

    // Step 14: AI Delivery MI context integration
    console.log("📋 Step 14: AI Delivery MI context integration...");

    const createAdProjectResp = await apiCall(
      "POST",
      "/ai-delivery-projects",
      {
        clientId: smokeClientId,
        name: `[SMOKE][MI] ${makeSmokeId("ai-delivery")}`,
        targetMonth: "2026-07"
      },
      token
    );
    const aiDeliveryProjectId = createAdProjectResp.data?.aiDeliveryProject?.id ?? null;
    if (!aiDeliveryProjectId) {
      throw new Error("Failed to create AI Delivery project for MI integration proof");
    }
    console.log(`✅ AI Delivery project linked to smoke client: ${aiDeliveryProjectId}`);

    // 14b: Reset handoff to READY so we can test apply
    const readyResp = await apiCall("PUT",
      `/market-intelligence-projects/${projectId}/handoffs/${handoff.id}/status`,
      { handoffStatus: "READY" }, token);
    if (!readyResp.ok) throw new Error(`Could not reset handoff to READY: ${readyResp.status}`);

    // Pre-clean: remove any existing handoffs from the AI Delivery project (from previous smoke runs)
    const precleanResp = await apiCall("GET", `/ai-delivery/projects/${aiDeliveryProjectId}/market-intelligence-context`, null, token);
    if (precleanResp.ok) {
      for (const existingH of (precleanResp.data?.handoffs ?? [])) {
        await apiCall("POST", `/ai-delivery/projects/${aiDeliveryProjectId}/market-intelligence-context/${existingH.id}/remove`, null, token);
      }
    }

    // 14c: List MI context for the AI Delivery project (expect 0)
    const ctxBeforeResp = await apiCall("GET", `/ai-delivery/projects/${aiDeliveryProjectId}/market-intelligence-context`, null, token);
    if (!ctxBeforeResp.ok) throw new Error(`Could not list MI context: ${ctxBeforeResp.status}`);
    if (ctxBeforeResp.data.handoffs.length !== 0) {
      throw new Error(`Expected 0 handoffs before apply, got ${ctxBeforeResp.data.handoffs.length}`);
    }
    console.log("✅ MI context empty before apply");

    // 14d: Apply handoff to AI Delivery project
    const applyResp = await apiCall("POST",
      `/ai-delivery/projects/${aiDeliveryProjectId}/market-intelligence-context/apply`,
      { handoffId: handoff.id }, token);
    if (!applyResp.ok) throw new Error(`Could not apply MI handoff: ${applyResp.status}`);
    const appliedHandoffs = applyResp.data?.handoffs ?? [];
    if (!appliedHandoffs.find(h => h.id === handoff.id)) {
      throw new Error("Applied handoff not in response list");
    }
    const applied = appliedHandoffs.find(h => h.id === handoff.id);
    if (applied.aiDeliveryProjectId !== aiDeliveryProjectId) {
      throw new Error(`aiDeliveryProjectId mismatch: ${applied.aiDeliveryProjectId}`);
    }
    if (!applied.audienceSignals?.length) throw new Error("audienceSignals missing from applied context");
    if (!applied.opportunities?.length) throw new Error("opportunities missing from applied context");
    if (!applied.risks?.length) throw new Error("risks missing from applied context");
    if (!applied.recommendedActions?.length) throw new Error("recommendedActions missing from applied context");
    if (!applied.sourceNote) throw new Error("sourceNote missing from applied context");
    console.log("✅ Handoff applied to AI Delivery project; all content fields present");

    // 14e: List MI context after apply
    const ctxAfterResp = await apiCall("GET", `/ai-delivery/projects/${aiDeliveryProjectId}/market-intelligence-context`, null, token);
    if (!ctxAfterResp.ok) throw new Error(`Could not list MI context after apply: ${ctxAfterResp.status}`);
    if (!ctxAfterResp.data.handoffs.find(h => h.id === handoff.id)) {
      throw new Error("Handoff not in MI context list after apply");
    }
    console.log("✅ MI context list shows applied handoff");

    // 14i: Workflow execution consumes applied MI handoff context
    console.log("📋 Step 14i: Workflow execution uses applied MI handoff context...");
    const workflowRunResp = await apiCall("POST",
      `/ai-delivery/projects/${aiDeliveryProjectId}/workflow-runs`,
      {
        status: "DRAFT",
        adminNotes: "[generate-content-plan] Smoke MI handoff context consumption proof",
        resultPlaceholder: ""
      },
      token);
    const workflowRunId = workflowRunResp.data?.workflowRun?.id ?? null;
    if (!workflowRunId) {
      throw new Error("Failed to create workflow run for MI handoff context proof");
    }

    const executeRunResp = await apiCall("POST",
      `/ai-delivery/projects/${aiDeliveryProjectId}/workflow-runs/${workflowRunId}/execute`,
      null,
      token);
    const executedWorkflowRun = executeRunResp.data?.workflowRun ?? null;
    if (!executedWorkflowRun?.id) {
      throw new Error("Failed to execute workflow run for MI handoff context proof");
    }
    const executionLog = executedWorkflowRun.executionLog ?? "";
    if (!executionLog.includes("Applied market intelligence handoff context")) {
      throw new Error("Workflow execution log missing applied MI handoff context marker");
    }
    console.log("✅ Workflow execution log includes applied MI handoff context");

    // 14f: Reject DRAFT handoff apply
    const handoff2Resp = await apiCall("GET", `/market-intelligence-projects/${projectId}/handoffs`, null, token);
    if (!handoff2Resp.ok) throw new Error(`Could not list handoffs: ${handoff2Resp.status}`);
    // Prepare a second handoff and leave it DRAFT
    const approvedInsight2Resp = await apiCall("GET", `/market-intelligence-projects/${projectId}/insights`, null, token);
    if (approvedInsight2Resp.ok && approvedInsight2Resp.data?.insights?.length > 0) {
      const insightToUse = approvedInsight2Resp.data.insights.find(i => i.status === "APPROVED");
      if (insightToUse) {
        const draftHandoffResp = await apiCall("POST",
          `/market-intelligence-projects/${projectId}/handoffs/prepare`,
          { insightId: insightToUse.id }, token);
        if (draftHandoffResp.ok && draftHandoffResp.data?.handoff?.id) {
          const draftHandoffId = draftHandoffResp.data.handoff.id;
          // DRAFT handoff should be rejected (applyMiHandoffToAiDelivery returns null for DRAFT → 403)
          const rejectDraftStatus = await apiCallExpectFailure("POST",
            `/ai-delivery/projects/${aiDeliveryProjectId}/market-intelligence-context/apply`,
            { handoffId: draftHandoffId }, token);
          if (rejectDraftStatus < 400 || rejectDraftStatus >= 600) {
            throw new Error(`Expected 4xx for DRAFT handoff apply, got ${rejectDraftStatus}`);
          }
          console.log(`✅ DRAFT handoff correctly rejected (${rejectDraftStatus})`);
        }
      }
    }

    // 14g: Remove handoff linkage
    const removeResp = await apiCall("POST",
      `/ai-delivery/projects/${aiDeliveryProjectId}/market-intelligence-context/${handoff.id}/remove`,
      null, token);
    if (!removeResp.ok) throw new Error(`Could not remove MI handoff: ${removeResp.status}`);
    const afterRemove = removeResp.data?.handoffs ?? [];
    if (afterRemove.find(h => h.id === handoff.id)) {
      throw new Error("Handoff still in list after remove");
    }
    console.log("✅ Handoff removed from AI Delivery project");

    // 14h: Verify handoff reverted to READY
    const verifyHandoffResp = await apiCall("GET", `/market-intelligence-projects/${projectId}/handoffs`, null, token);
    if (!verifyHandoffResp.ok) throw new Error(`Could not list handoffs after remove: ${verifyHandoffResp.status}`);
    const revertedHandoff = verifyHandoffResp.data.handoffs.find(h => h.id === handoff.id);
    if (!revertedHandoff) throw new Error("Could not find handoff after remove");
    if (revertedHandoff.handoffStatus !== "READY") {
      throw new Error(`Expected READY after remove, got ${revertedHandoff.handoffStatus}`);
    }
    if (revertedHandoff.aiDeliveryProjectId !== null) {
      throw new Error(`Expected aiDeliveryProjectId null after remove, got ${revertedHandoff.aiDeliveryProjectId}`);
    }
    console.log("✅ Handoff reverted to READY with aiDeliveryProjectId=null after remove\n");

    // Step 14: Browser test (optional, requires playwright)
    if (process.env.BROWSER_TEST === "true") {
      console.log("📋 Step 14: Browser smoke test (optional)...");
      const browser = await chromium.launch();
      const page = await browser.newPage();

      try {
        await page.goto(WEB_BASE);
        await sleep(1000);
        await page.fill('input[type="email"]', ADMIN_EMAIL);
        await page.fill('input[type="password"]', ADMIN_PASSWORD);
        await page.click('button:has-text("Sign In")');
        await page.waitForNavigation();
        await sleep(2000);

        // Navigate to Market Intelligence
        await page.goto(`${WEB_BASE}#/ai-market-intelligence`);
        await page.waitForLoadState("networkidle");

        const pageTitle = await page.title();
        if (!pageTitle) {
          throw new Error("Failed to load Market Intelligence page");
        }
        console.log(`✅ Market Intelligence page loaded\n`);
      } finally {
        await browser.close();
      }
    }

    console.log("🎉 All smoke tests passed!\n");
    process.exit(0);
  } catch (error) {
    console.error(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

main();
