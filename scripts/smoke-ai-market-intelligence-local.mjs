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

async function main() {
  console.log("🔍 Starting Market Intelligence smoke test...\n");

  if (!ADMIN_PASSWORD) {
    throw new Error("AUTH_SEED_TEST_PASSWORD environment variable is required");
  }

  let token = "";
  let projectId = "";
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

    // Step 2: List projects (should start empty or with existing projects)
    console.log("📋 Step 2: Listing market intelligence projects...");
    const projectsResponse = await apiCall("GET", "/market-intelligence-projects", undefined, token);
    console.log(`✅ Found ${projectsResponse.data?.projects?.length || 0} projects\n`);

    // Step 3: Create a research project
    console.log("📋 Step 3: Creating research project...");
    const createProjectResponse = await apiCall(
      "POST",
      "/market-intelligence-projects",
      {
        title: "Q2 2026 Competitive Analysis",
        description: "Track competitor product launches and market positioning",
        status: "ACTIVE"
      },
      token
    );

    projectId = createProjectResponse.data?.project?.id;
    if (!projectId) {
      throw new Error("Failed to create project");
    }
    console.log(`✅ Created project: ${projectId}\n`);

    // Step 4: Add research sources
    console.log("📋 Step 4: Adding research sources...");
    const createSourceResponse = await apiCall(
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

    sourceId = createSourceResponse.data?.source?.id;
    if (!sourceId) {
      throw new Error("Failed to create source");
    }
    console.log(`✅ Created source: ${sourceId}\n`);

    // Step 5: List sources
    console.log("📋 Step 5: Listing research sources...");
    const sourcesResponse = await apiCall(
      "GET",
      `/market-intelligence-projects/${projectId}/sources`,
      undefined,
      token
    );
    console.log(`✅ Found ${sourcesResponse.data?.sources?.length || 0} sources\n`);

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
    console.log(`✅ Research run executed: ${runId}\n`);

    // Step 8: List research runs
    console.log("📋 Step 8: Listing research runs...");
    const runsResponse = await apiCall(
      "GET",
      `/market-intelligence-projects/${projectId}/research-runs`,
      undefined,
      token
    );
    console.log(`✅ Found ${runsResponse.data?.researchRuns?.length || 0} research runs\n`);

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

    // Step 10: List insights
    console.log("📋 Step 10: Listing market insights...");
    const insightsResponse = await apiCall(
      "GET",
      `/market-intelligence-projects/${projectId}/insights`,
      undefined,
      token
    );
    console.log(`✅ Found ${insightsResponse.data?.insights?.length || 0} insights\n`);

    // Step 11: Browser test (optional, requires playwright)
    if (process.env.BROWSER_TEST === "true") {
      console.log("📋 Step 11: Browser smoke test (optional)...");
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
