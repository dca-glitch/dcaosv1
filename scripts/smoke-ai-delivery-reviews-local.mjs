import { chromium } from "@playwright/test";

const defaultLocalApiBaseUrl = "http://127.0.0.1:4000/api/v1";
const defaultLocalWebUrl = "http://localhost:5173/#/ai-delivery";
const apiBaseUrl = process.env.AI_DELIVERY_REVIEW_SMOKE_API_BASE_URL ?? defaultLocalApiBaseUrl;
const webUrl = process.env.AI_DELIVERY_REVIEW_SMOKE_WEB_URL ?? defaultLocalWebUrl;
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL;
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const allowedLocalHosts = new Set(["127.0.0.1", "localhost"]);

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function note(message) {
  console.log(`NOTE: ${message}`);
}

function responseHasSensitiveFields(response) {
  return /passwordHash|sessionTokenHash/i.test(response.text);
}

function requireOkResponse(name, response) {
  if (![200, 201].includes(response.status) || response.body?.ok !== true) {
    fail(`${name} failed with HTTP ${response.status}.`);
  }

  if (responseHasSensitiveFields(response)) {
    fail(`${name} response exposed sensitive fields.`);
  }

  return response.body.data;
}

function requireLocalUrl(name, value, expectedPathPrefix = "") {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${name} is not a valid URL.`);
  }

  if (!allowedLocalHosts.has(parsed.hostname)) {
    fail(`${name} must target localhost or 127.0.0.1.`);
  }

  if (expectedPathPrefix && !parsed.pathname.startsWith(expectedPathPrefix)) {
    fail(`${name} must use path prefix ${expectedPathPrefix}.`);
  }

  return parsed;
}

function requireEnv(name, value) {
  if (typeof value !== "string" || value.length === 0) {
    fail(`Missing required environment variable ${name}.`);
  }
}

async function request(path, options = {}) {
  const headers = {
    Accept: "application/json"
  };

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

  return {
    body,
    status: response.status,
    text
  };
}

async function login() {
  const response = await request("/auth/login", {
    method: "POST",
    body: {
      email: adminEmail,
      password: adminPassword
    }
  });

  const token = response.body?.data?.session?.token;
  if (response.status !== 200 || response.body?.ok !== true || typeof token !== "string") {
    fail(`Admin login failed with HTTP ${response.status}.`);
  }

  return token;
}

async function runAiDeliveryApiRegression(token) {
  const projectsData = requireOkResponse(
    "AI Delivery projects list",
    await request("/ai-delivery-projects", { token })
  );
  const projects = projectsData?.aiDeliveryProjects;

  if (!Array.isArray(projects)) {
    fail("AI Delivery projects list did not return an aiDeliveryProjects array.");
  }
  pass("AI Delivery projects/brief foundation list endpoint returned cleanly.");

  const project = projects.find((item) => item && item.isArchived !== true) ?? null;
  if (!project) {
    note("No active AI Delivery project is available in local data. Project list base flow passed; brief, workflow run, deliverable, and review detail checks were skipped.");
    return;
  }

  if (!project.brief?.id || typeof project.brief.status !== "string") {
    fail("Selected active AI Delivery project is missing its brief summary.");
  }

  const briefData = requireOkResponse(
    "AI Delivery brief detail",
    await request(`/ai-delivery-projects/${project.id}/brief`, { token })
  );
  if (!briefData?.brief?.id || typeof briefData.brief.status !== "string") {
    fail("AI Delivery brief detail did not return a valid brief.");
  }
  pass("AI Delivery project brief detail endpoint returned cleanly.");

  const existingContentPlanResponse = await request(`/ai-delivery-projects/${project.id}/content-plan`, { token });
  let contentPlan = null;
  if (existingContentPlanResponse.status === 404) {
    contentPlan = requireOkResponse(
      "AI Delivery content plan create",
      await request(`/ai-delivery-projects/${project.id}/content-plan`, {
        method: "POST",
        token,
        body: { items: [] }
      })
    )?.contentPlan;
    if (!contentPlan?.id || contentPlan.status !== "DRAFT") {
      fail("AI Delivery content plan create did not return the expected draft plan.");
    }
    pass("AI Delivery content plan create returned the expected draft plan.");
  } else {
    contentPlan = requireOkResponse("AI Delivery content plan detail", existingContentPlanResponse)?.contentPlan;
    if (!contentPlan?.id || !Array.isArray(contentPlan.items)) {
      fail("AI Delivery content plan detail did not return a valid plan.");
    }
    pass("AI Delivery content plan detail endpoint returned cleanly.");
  }

  const updatedContentPlan = requireOkResponse(
    "AI Delivery content plan update",
    await request(`/ai-delivery-projects/${project.id}/content-plan`, {
      method: "PUT",
      token,
      body: {
        items: [
          {
            title: "Smoke monthly content topic",
            targetKeyword: "monthly content approval foundation",
            contentType: "article",
            notes: "Admin-only planning record from local smoke.",
            sortOrder: 1,
            approvalStatus: "CLIENT_CHANGES_REQUESTED",
            clientComment: "Needs revision before approval."
          }
        ]
      }
    })
  )?.contentPlan;
  if (
    !updatedContentPlan?.id ||
    !Array.isArray(updatedContentPlan.items) ||
    updatedContentPlan.items.length !== 1 ||
    updatedContentPlan.items[0]?.approvalStatus !== "CLIENT_CHANGES_REQUESTED" ||
    updatedContentPlan.items[0]?.clientComment !== "Needs revision before approval."
  ) {
    fail("AI Delivery content plan update did not persist the expected item approval status and note.");
  }
  pass("AI Delivery content plan update persisted the expected item approval status and note.");

  const reviewRequestedContentPlan = requireOkResponse(
    "AI Delivery content plan mark ready for review",
    await request(`/ai-delivery-projects/${project.id}/content-plan/request-client-review`, {
      method: "POST",
      token
    })
  )?.contentPlan;
  if (!reviewRequestedContentPlan || reviewRequestedContentPlan.status !== "CLIENT_REVIEW_REQUESTED" || typeof reviewRequestedContentPlan.reviewRequestedAt !== "string") {
    fail("AI Delivery content plan ready-for-review action did not persist the expected status.");
  }
  pass("AI Delivery content plan ready-for-review action persisted the expected status.");

  const changesRequestedContentPlan = requireOkResponse(
    "AI Delivery content plan request changes",
    await request(`/ai-delivery-projects/${project.id}/content-plan/request-changes`, {
      method: "POST",
      token
    })
  )?.contentPlan;
  if (!changesRequestedContentPlan || changesRequestedContentPlan.status !== "CLIENT_CHANGES_REQUESTED") {
    fail("AI Delivery content plan request-changes action did not persist the expected status.");
  }
  pass("AI Delivery content plan request-changes action persisted the expected status.");

  const approvedContentPlan = requireOkResponse(
    "AI Delivery content plan approve",
    await request(`/ai-delivery-projects/${project.id}/content-plan/approve`, {
      method: "POST",
      token
    })
  )?.contentPlan;
  if (!approvedContentPlan || approvedContentPlan.status !== "CLIENT_APPROVED" || typeof approvedContentPlan.approvedAt !== "string") {
    fail("AI Delivery content plan approve action did not persist the expected approved state.");
  }
  pass("AI Delivery content plan approve action persisted the expected approved state.");

  const workflowRunsData = requireOkResponse(
    "AI Delivery workflow runs list",
    await request(`/ai-delivery/projects/${project.id}/workflow-runs`, { token })
  );
  if (!Array.isArray(workflowRunsData?.workflowRuns)) {
    fail("AI Delivery workflow runs list did not return a workflowRuns array.");
  }
  pass(`AI Delivery workflow runs list endpoint returned cleanly (${workflowRunsData.workflowRuns.length} local run(s)).`);

  const createdSuccessRun = requireOkResponse(
    "AI Delivery workflow run create success candidate",
    await request(`/ai-delivery/projects/${project.id}/workflow-runs`, {
      method: "POST",
      token,
      body: {
        status: "DRAFT",
        adminNotes: "Smoke stub execution success path",
        resultPlaceholder: ""
      }
    })
  );
  const successRun = createdSuccessRun?.workflowRun;
  if (!successRun?.id) {
    fail("AI Delivery workflow run create did not return a workflowRun id for success execution.");
  }

  const executedSuccess = requireOkResponse(
    "AI Delivery workflow run execute success path",
    await request(`/ai-delivery/projects/${project.id}/workflow-runs/${successRun.id}/execute`, {
      method: "POST",
      token
    })
  )?.workflowRun;
  if (
    !executedSuccess ||
    executedSuccess.status !== "REVIEW" ||
    typeof executedSuccess.executionLog !== "string" ||
    executedSuccess.executionLog.length === 0 ||
    typeof executedSuccess.startedAt !== "string" ||
    typeof executedSuccess.finishedAt !== "string" ||
    typeof executedSuccess.resultPlaceholder !== "string" ||
    executedSuccess.resultPlaceholder.length === 0 ||
    executedSuccess.executionError !== null
  ) {
    fail("AI Delivery workflow run execute success path did not persist the expected status/result/log fields.");
  }
  pass("AI Delivery workflow run execute success path persisted status, timestamps, and stub result fields.");

  const createdFailureRun = requireOkResponse(
    "AI Delivery workflow run create failure candidate",
    await request(`/ai-delivery/projects/${project.id}/workflow-runs`, {
      method: "POST",
      token,
      body: {
        status: "DRAFT",
        adminNotes: "[stub-fail] Smoke stub execution failure path",
        resultPlaceholder: ""
      }
    })
  );
  const failureRun = createdFailureRun?.workflowRun;
  if (!failureRun?.id) {
    fail("AI Delivery workflow run create did not return a workflowRun id for failure execution.");
  }

  const executedFailure = requireOkResponse(
    "AI Delivery workflow run execute failure path",
    await request(`/ai-delivery/projects/${project.id}/workflow-runs/${failureRun.id}/execute`, {
      method: "POST",
      token
    })
  )?.workflowRun;
  if (
    !executedFailure ||
    executedFailure.status !== "FAILED" ||
    typeof executedFailure.executionError !== "string" ||
    executedFailure.executionError.length === 0 ||
    typeof executedFailure.executionLog !== "string" ||
    executedFailure.executionLog.length === 0 ||
    typeof executedFailure.finishedAt !== "string"
  ) {
    fail("AI Delivery workflow run execute failure path did not persist the expected failed/error/log fields.");
  }
  pass("AI Delivery workflow run execute failure path persisted failed status and error/log fields.");

  const researchRequestsData = requireOkResponse(
    "AI Delivery research requests list",
    await request(`/ai-delivery/projects/${project.id}/research-requests`, { token })
  );
  if (!Array.isArray(researchRequestsData?.researchRequests)) {
    fail("AI Delivery research requests list did not return a researchRequests array.");
  }
  pass(`AI Delivery research requests list endpoint returned cleanly (${researchRequestsData.researchRequests.length} local request(s)).`);

  const createdResearchRequest = requireOkResponse(
    "AI Delivery research request create",
    await request(`/ai-delivery/projects/${project.id}/research-requests`, {
      method: "POST",
      token,
      body: {
        title: "Smoke manual source review request",
        description: "Manual-only source validation record from local smoke.",
        requestType: "COMPETITOR_REVIEW",
        status: "DRAFT",
        workflowRunId: successRun.id
      }
    })
  )?.researchRequest;
  if (
    !createdResearchRequest?.id
    || createdResearchRequest.title !== "Smoke manual source review request"
    || createdResearchRequest.workflowRunId !== successRun.id
  ) {
    fail("AI Delivery research request create did not return the expected project-scoped request.");
  }
  pass("AI Delivery research request create returned the expected project-scoped record.");

  const updatedResearchRequest = requireOkResponse(
    "AI Delivery research request update",
    await request(`/ai-delivery/projects/${project.id}/research-requests/${createdResearchRequest.id}`, {
      method: "PUT",
      token,
      body: {
        status: "READY",
        title: "Smoke manual source review request",
        description: "Manual-only source validation record updated by local smoke.",
        requestType: "COMPETITOR_REVIEW",
        workflowRunId: successRun.id
      }
    })
  )?.researchRequest;
  if (!updatedResearchRequest || updatedResearchRequest.status !== "READY") {
    fail("AI Delivery research request update did not persist the expected READY status.");
  }
  pass("AI Delivery research request update persisted the expected status.");

  const researchSummariesData = requireOkResponse(
    "AI Delivery research summaries list",
    await request(`/ai-delivery/projects/${project.id}/research-summaries`, { token })
  );
  if (!Array.isArray(researchSummariesData?.researchSummaries)) {
    fail("AI Delivery research summaries list did not return a researchSummaries array.");
  }
  pass(`AI Delivery research summaries list endpoint returned cleanly (${researchSummariesData.researchSummaries.length} local summary record(s)).`);

  const researchSourcesData = requireOkResponse(
    "AI Delivery research sources list",
    await request(`/ai-delivery/projects/${project.id}/research-sources`, { token })
  );
  if (!Array.isArray(researchSourcesData?.researchSources)) {
    fail("AI Delivery research sources list did not return a researchSources array.");
  }
  pass(`AI Delivery research sources list endpoint returned cleanly (${researchSourcesData.researchSources.length} local source(s)).`);

  const createdResearchSource = requireOkResponse(
    "AI Delivery research source create",
    await request(`/ai-delivery/projects/${project.id}/research-sources`, {
      method: "POST",
      token,
      body: {
        researchRequestId: createdResearchRequest.id,
        workflowRunId: successRun.id,
        sourceUrl: "https://example.com/manual-research-source",
        sourceTitle: "Smoke manual source",
        sourceType: "WEBSITE",
        status: "PROPOSED",
        reviewNotes: "Manual-only source record from local smoke."
      }
    })
  )?.researchSource;
  if (
    !createdResearchSource?.id
    || createdResearchSource.sourceUrl !== "https://example.com/manual-research-source"
    || createdResearchSource.researchRequestId !== createdResearchRequest.id
  ) {
    fail("AI Delivery research source create did not return the expected project-scoped source record.");
  }
  pass("AI Delivery research source create returned the expected project-scoped source record.");

  const filteredResearchSources = requireOkResponse(
    "AI Delivery research sources list by request",
    await request(`/ai-delivery/projects/${project.id}/research-sources?researchRequestId=${createdResearchRequest.id}`, { token })
  )?.researchSources;
  if (!Array.isArray(filteredResearchSources) || !filteredResearchSources.some((source) => source.id === createdResearchSource.id)) {
    fail("AI Delivery research sources list by request did not return the created source.");
  }
  pass("AI Delivery research sources list by request returned the expected manual source.");

  const invalidResearchSourceResponse = await request(`/ai-delivery/projects/${project.id}/research-sources`, {
    method: "POST",
    token,
    body: {
      sourceUrl: "ftp://example.com/not-allowed",
      sourceType: "WEBSITE",
      status: "PROPOSED"
    }
  });
  if (invalidResearchSourceResponse.status !== 400 || invalidResearchSourceResponse.body?.ok !== false) {
    fail("AI Delivery research source invalid scheme was not rejected.");
  }
  pass("AI Delivery research source invalid scheme was rejected without any external fetch.");

  const updatedResearchSource = requireOkResponse(
    "AI Delivery research source update",
    await request(`/ai-delivery/projects/${project.id}/research-sources/${createdResearchSource.id}`, {
      method: "PUT",
      token,
      body: {
        researchRequestId: createdResearchRequest.id,
        workflowRunId: successRun.id,
        sourceUrl: "https://example.com/manual-research-source",
        sourceTitle: "Smoke manual source",
        sourceType: "WEBSITE",
        status: "APPROVED",
        reviewNotes: "Approved by local smoke."
      }
    })
  )?.researchSource;
  if (!updatedResearchSource || updatedResearchSource.status !== "APPROVED" || updatedResearchSource.reviewNotes !== "Approved by local smoke.") {
    fail("AI Delivery research source update did not persist the expected approval fields.");
  }
  pass("AI Delivery research source update persisted the expected approval fields.");

  const createdResearchSummary = requireOkResponse(
    "AI Delivery research summary create",
    await request(`/ai-delivery/projects/${project.id}/research-summaries`, {
      method: "POST",
      token,
      body: {
        workflowRunId: successRun.id,
        title: "Smoke SEO research summary",
        status: "DRAFT",
        summaryText: "Manual summary from local smoke for brief revision coverage.",
        keyFindings: "Manual-only findings captured locally.",
        audienceInsights: "Audience needs concise service explanations.",
        competitorInsights: "Competitors under-explain implementation process.",
        keywordOpportunities: "Project brief foundation, delivery workflow, admin review.",
        contentRecommendations: "Keep deliverables platform-neutral for future publishing connectors.",
        briefRevisionNotes: "Append these findings into brief notes only when explicitly approved.",
        sourceNotes: "Approved manual source: Smoke manual source."
      }
    })
  )?.researchSummary;
  if (
    !createdResearchSummary?.id
    || createdResearchSummary.title !== "Smoke SEO research summary"
    || createdResearchSummary.workflowRunId !== successRun.id
    || createdResearchSummary.status !== "DRAFT"
  ) {
    fail("AI Delivery research summary create did not return the expected project-scoped summary.");
  }
  pass("AI Delivery research summary create returned the expected project-scoped record.");

  const updatedResearchSummary = requireOkResponse(
    "AI Delivery research summary update",
    await request(`/ai-delivery/projects/${project.id}/research-summaries/${createdResearchSummary.id}`, {
      method: "PUT",
      token,
      body: {
        workflowRunId: successRun.id,
        title: "Smoke SEO research summary",
        status: "FINALIZED",
        summaryText: "Manual summary from local smoke for brief revision coverage.",
        keyFindings: "Manual-only findings captured locally.",
        audienceInsights: "Audience needs concise service explanations.",
        competitorInsights: "Competitors under-explain implementation process.",
        keywordOpportunities: "Project brief foundation, delivery workflow, admin review.",
        contentRecommendations: "Keep deliverables platform-neutral for future publishing connectors.",
        briefRevisionNotes: "Append these findings into brief notes only when explicitly approved.",
        sourceNotes: "Approved manual source: Smoke manual source."
      }
    })
  )?.researchSummary;
  if (!updatedResearchSummary || updatedResearchSummary.status !== "FINALIZED" || typeof updatedResearchSummary.finalizedAt !== "string") {
    fail("AI Delivery research summary update did not persist the expected finalized state.");
  }
  pass("AI Delivery research summary update persisted the expected finalized state.");

  const appliedResearchSummary = requireOkResponse(
    "AI Delivery research summary apply to brief",
    await request(`/ai-delivery/projects/${project.id}/research-summaries/${createdResearchSummary.id}/apply-to-brief`, {
      method: "POST",
      token
    })
  );
  if (
    !appliedResearchSummary?.researchSummary?.id
    || !appliedResearchSummary?.brief?.id
    || typeof appliedResearchSummary?.brief?.notes !== "string"
    || !appliedResearchSummary.brief.notes.includes("Research summary applied: Smoke SEO research summary")
  ) {
    fail("AI Delivery research summary apply-to-brief did not append the expected brief notes.");
  }
  pass("AI Delivery research summary apply-to-brief appended the expected brief notes.");

  const deliverablesData = requireOkResponse(
    "AI Delivery deliverables list",
    await request(`/ai-delivery-projects/${project.id}/deliverables`, { token })
  );
  const deliverables = deliverablesData?.deliverables;
  if (!Array.isArray(deliverables)) {
    fail("AI Delivery deliverables list did not return a deliverables array.");
  }
  pass(`AI Delivery deliverables list endpoint returned cleanly (${deliverables.length} local deliverable(s)).`);

  const deliverable = deliverables.find((item) => item && item.isArchived !== true) ?? deliverables[0] ?? null;
  if (!deliverable) {
    note("No deliverable is available for the selected local AI Delivery project. Deliverables base flow passed; deliverable review detail API check was skipped.");
    return;
  }

  const reviewsData = requireOkResponse(
    "AI Delivery deliverable reviews list",
    await request(`/ai-delivery-projects/${project.id}/deliverables/${deliverable.id}/reviews`, { token })
  );
  if (!Array.isArray(reviewsData?.deliverableReviews)) {
    fail("AI Delivery deliverable reviews list did not return a deliverableReviews array.");
  }
  pass(`AI Delivery deliverable reviews list endpoint returned cleanly (${reviewsData.deliverableReviews.length} local review(s)).`);
}

async function main() {
  requireLocalUrl("AI_DELIVERY_REVIEW_SMOKE_API_BASE_URL", apiBaseUrl, "/api/v1");
  requireLocalUrl("AI_DELIVERY_REVIEW_SMOKE_WEB_URL", webUrl);
  requireEnv("AUTH_SEED_TEST_EMAIL", adminEmail);
  requireEnv("AUTH_SEED_TEST_PASSWORD", adminPassword);

  const health = await request("/health");
  if (health.status !== 200 || health.body?.ok !== true || health.body?.data?.database?.status !== "ready") {
    fail(`API health/database check failed with HTTP ${health.status}.`);
  }
  pass("Local API health/database ready.");

  const token = await login();
  pass("Local admin API login succeeded.");

  await runAiDeliveryApiRegression(token);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const browserErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    browserErrors.push(error.message);
  });

  try {
    await page.addInitScript((authToken) => {
      window.sessionStorage.setItem("dcaosv1.authToken", authToken);
      window.localStorage.removeItem("dcaosv1.authToken");
    }, token);

    await page.goto(webUrl, { waitUntil: "domcontentloaded" });
    await page.getByRole("heading", { name: "AI Delivery" }).waitFor({ state: "visible", timeout: 15000 });
    pass("AI Delivery admin UI loaded without crashing.");

    const workflowRunButtons = page.getByRole("button", { name: "Workflow runs" });
    const workflowRunButtonCount = await workflowRunButtons.count();
    if (workflowRunButtonCount > 0) {
      await workflowRunButtons.first().click();
      await page.getByRole("dialog", { name: "Workflow Runs" }).waitFor({ state: "visible", timeout: 15000 });
      await page.getByRole("heading", { name: "Existing workflow runs" }).waitFor({ state: "visible", timeout: 15000 });
      await page.getByText("Execution log").first().waitFor({ state: "visible", timeout: 15000 });
      pass("Workflow runs panel opened and rendered execution details.");
      await page.getByRole("button", { name: "Close" }).first().click();
    }

    const contentPlanButtons = page.getByRole("button", { name: "AI SEO / Content Plan" });
    const contentPlanButtonCount = await contentPlanButtons.count();
    if (contentPlanButtonCount > 0) {
      await contentPlanButtons.first().click();
      await page.getByRole("dialog", { name: "AI SEO / Content Plan" }).waitFor({ state: "visible", timeout: 15000 });
      await page.getByRole("heading", { name: "Approval workflow status" }).waitFor({ state: "visible", timeout: 15000 });
      await page.getByText("This is an approval workflow foundation. Use these monthly content plan items to capture target topics, keywords, research notes, and content type intent. Visible only to admin team from this screen. No AI generation, crawling, publishing, or external services are performed.").first().waitFor({ state: "visible", timeout: 15000 });
      await page.getByRole("button", { name: "Mark ready for review" }).first().waitFor({ state: "visible", timeout: 15000 });
      pass("AI SEO / Content Plan panel opened and rendered approval workflow helper text.");
      await page.getByRole("button", { name: "Close" }).first().click();
    }

    const researchButtons = page.getByRole("button", { name: "Research / Sources" });
    const researchButtonCount = await researchButtons.count();
    if (researchButtonCount > 0) {
      await researchButtons.first().click();
      await page.getByRole("dialog", { name: "Research / Sources" }).waitFor({ state: "visible", timeout: 15000 });
      await page.getByRole("heading", { name: "Existing research requests" }).waitFor({ state: "visible", timeout: 15000 });
      await page.getByRole("heading", { name: "Existing research summaries" }).waitFor({ state: "visible", timeout: 15000 });
      await page.getByText("Source records are manual only in this foundation. No crawling or external fetching is performed.").first().waitFor({ state: "visible", timeout: 15000 });
      await page.getByText("Research summaries are admin-authored in this foundation. No AI generation, crawling, or external fetching is performed.").first().waitFor({ state: "visible", timeout: 15000 });
      pass("Research / Sources panel opened and rendered request, summary, and source foundation helper text.");
      await page.getByRole("button", { name: "Close" }).first().click();
    }

    const deliverablesButtons = page.getByRole("button", { name: "Deliverables" });
    const deliverablesButtonCount = await deliverablesButtons.count();
    if (deliverablesButtonCount === 0) {
      note("No AI Delivery project is available in local data. Manual precondition for full review smoke: create an active AI Delivery project with at least one deliverable.");
      return;
    }

    await deliverablesButtons.first().click();
    await page.getByRole("dialog", { name: "Deliverables" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Existing deliverables" }).waitFor({ state: "visible", timeout: 15000 });
    pass("Deliverables panel opened.");

    const reviewsButtons = page.getByRole("button", { name: "Reviews" });
    const reviewsButtonCount = await reviewsButtons.count();
    if (reviewsButtonCount === 0) {
      note("No deliverable is available for the selected local AI Delivery project. Manual precondition for full review smoke: add at least one deliverable to an AI Delivery project.");
      return;
    }

    await reviewsButtons.first().click();
    await page.getByRole("heading", { name: /Deliverable reviews:/ }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Admin/operator placeholders only.").waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Existing review placeholders").waitFor({ state: "visible", timeout: 15000 });
    pass("Deliverable reviews panel opened and rendered.");
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  if (browserErrors.length > 0) {
    fail(`Browser console/page errors detected: ${browserErrors.join(" | ")}`);
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : "AI Delivery review smoke failed.");
});