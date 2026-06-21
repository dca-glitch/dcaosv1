import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const { PrismaClient } = await import("@prisma/client");

const defaultLocalApiBaseUrl = "http://127.0.0.1:4000/api/v1";
const defaultLocalWebUrl = "http://localhost:5173/#/ai-delivery";
const apiBaseUrl = process.env.AI_DELIVERY_REVIEW_SMOKE_API_BASE_URL ?? defaultLocalApiBaseUrl;
const webUrl = process.env.AI_DELIVERY_REVIEW_SMOKE_WEB_URL ?? defaultLocalWebUrl;
const adminEmail = process.env.AUTH_SEED_TEST_EMAIL;
const adminPassword = process.env.AUTH_SEED_TEST_PASSWORD;
const allowedLocalHosts = new Set(["127.0.0.1", "localhost"]);
const smokeProjectMarker = "[SMOKE][AI_DELIVERY_REVIEWS]";
const smokeMainProjectName = `${smokeProjectMarker} Main project`;
const smokeCrossProjectName = `${smokeProjectMarker} Cross-project guard`;
const smokeProjectTargetMonth = "2026-06";

function loadRepoEnvForPrismaSmoke() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const envText = readFileSync(envPath, "utf8");
  for (const rawLine of envText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const eq = line.indexOf("=");
    if (eq <= 0) {
      continue;
    }

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadRepoEnvForPrismaSmoke();

const prisma = new PrismaClient();

function fail(message) {
  throw new Error(message);
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

function requireExactSmokeProjectMarker() {
  const marker = smokeProjectMarker.trim();
  if (marker.length < 12) {
    fail("Smoke cleanup marker must be at least 12 characters long.");
  }
  if (marker !== "[SMOKE][AI_DELIVERY_REVIEWS]") {
    fail("Smoke cleanup marker must match the exact AI Delivery reviews marker.");
  }
  return marker;
}

function projectHasSmokeMarker(project, marker) {
  return project.name.includes(marker) || project.plannedContentScopeNotes?.includes(marker);
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

async function getActiveTenantId(token) {
  const authContext = requireOkResponse(
    "Auth context",
    await request("/auth/context", { token })
  );
  const tenantId = authContext?.tenantContext?.activeTenant?.tenantId;
  if (typeof tenantId !== "string" || tenantId.length === 0) {
    fail("Auth context did not return an active tenant id for smoke cleanup.");
  }
  return tenantId;
}

async function resolveSmokeFixtureBase(tenantId) {
  const client = await prisma.client.findFirst({
    where: {
      tenantId,
      isArchived: false
    },
    orderBy: [
      { createdAt: "asc" },
      { id: "asc" }
    ],
    select: {
      id: true,
      name: true
    }
  });
  if (!client?.id) {
    fail("AI Delivery smoke requires at least one active client in the active tenant.");
  }

  const project = await prisma.project.findFirst({
    where: {
      tenantId,
      clientId: client.id,
      isArchived: false
    },
    orderBy: [
      { createdAt: "asc" },
      { id: "asc" }
    ],
    select: {
      id: true,
      name: true
    }
  });

  note(`Resolved smoke fixture base client: ${client.name}${project?.name ? ` (linked project: ${project.name})` : ""}.`);

  return {
    clientId: client.id,
    projectId: project?.id ?? null
  };
}

function getSmokeProjectWhere(tenantId, marker) {
  return {
    tenantId,
    OR: [
      { name: { contains: marker } },
      { plannedContentScopeNotes: { contains: marker } }
    ]
  };
}

async function cleanupSmokeProjects(tenantId, phaseLabel) {
  const marker = requireExactSmokeProjectMarker();
  const matchingProjects = await prisma.aiDeliveryProject.findMany({
    where: getSmokeProjectWhere(tenantId, marker),
    orderBy: [
      { createdAt: "asc" },
      { id: "asc" }
    ],
    select: {
      id: true,
      name: true,
      plannedContentScopeNotes: true
    }
  });

  for (const project of matchingProjects) {
    if (!projectHasSmokeMarker(project, marker)) {
      fail(`${phaseLabel} found a project without the exact smoke marker.`);
    }
  }

  if (matchingProjects.length === 0) {
    note(`${phaseLabel}: removed 0 smoke-owned AI Delivery project(s).`);
    return 0;
  }

  const deleted = await prisma.aiDeliveryProject.deleteMany({
    where: {
      tenantId,
      id: {
        in: matchingProjects.map((project) => project.id)
      }
    }
  });

  if (deleted.count !== matchingProjects.length) {
    fail(`${phaseLabel} removed ${deleted.count} smoke-owned project(s) but expected ${matchingProjects.length}.`);
  }

  const remaining = await prisma.aiDeliveryProject.count({
    where: getSmokeProjectWhere(tenantId, marker)
  });
  if (remaining !== 0) {
    fail(`${phaseLabel} left ${remaining} smoke-owned AI Delivery project(s) behind.`);
  }

  pass(`${phaseLabel}: removed ${deleted.count} smoke-owned AI Delivery project(s).`);
  return deleted.count;
}

async function createSmokeProject(token, fixtureBase, projectName, plannedContentScopeNotes) {
  const aiDeliveryProject = requireOkResponse(
    `AI Delivery smoke project create (${projectName})`,
    await request("/ai-delivery-projects", {
      method: "POST",
      token,
      body: {
        clientId: fixtureBase.clientId,
        projectId: fixtureBase.projectId,
        name: projectName,
        targetMonth: smokeProjectTargetMonth,
        plannedContentScopeNotes
      }
    })
  )?.aiDeliveryProject;

  if (
    !aiDeliveryProject?.id ||
    aiDeliveryProject.name !== projectName ||
    !projectHasSmokeMarker(
      {
        name: aiDeliveryProject.name,
        plannedContentScopeNotes: aiDeliveryProject.plannedContentScopeNotes ?? null
      },
      requireExactSmokeProjectMarker()
    )
  ) {
    fail(`AI Delivery smoke project create did not return the expected marked project for ${projectName}.`);
  }

  pass(`AI Delivery smoke project create returned the expected marked project for ${projectName}.`);
  return aiDeliveryProject;
}

async function createSmokeProjects(token, fixtureBase) {
  const mainProject = await createSmokeProject(
    token,
    fixtureBase,
    smokeMainProjectName,
    `${smokeProjectMarker} Dedicated main fixture for local AI Delivery review smoke only.`
  );
  const crossProject = await createSmokeProject(
    token,
    fixtureBase,
    smokeCrossProjectName,
    `${smokeProjectMarker} Dedicated cross-project guard fixture for local AI Delivery review smoke only.`
  );

  return { mainProject, crossProject };
}

async function runAiDeliveryApiRegression(token, fixtureProjects) {
  const projectsData = requireOkResponse(
    "AI Delivery projects list",
    await request("/ai-delivery-projects", { token })
  );
  const projects = projectsData?.aiDeliveryProjects;

  if (!Array.isArray(projects)) {
    fail("AI Delivery projects list did not return an aiDeliveryProjects array.");
  }
  pass("AI Delivery projects/brief foundation list endpoint returned cleanly.");

  const project = projects.find((item) => item?.id === fixtureProjects.mainProject.id) ?? null;
  if (!project) {
    fail("AI Delivery projects list did not return the dedicated smoke-owned main project.");
  }

  if (!project.brief?.id || typeof project.brief.status !== "string") {
    fail("Dedicated smoke-owned AI Delivery project is missing its brief summary.");
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

  const contentPlanItem = approvedContentPlan.items?.[0] ?? null;
  if (!contentPlanItem?.id) {
    fail("AI Delivery content plan approval flow did not leave a reusable content plan item for content draft smoke.");
  }

  const initialContentDrafts = requireOkResponse(
    "AI Delivery content drafts list",
    await request(`/ai-delivery-projects/${project.id}/content-drafts`, { token })
  )?.contentDrafts;
  if (!Array.isArray(initialContentDrafts)) {
    fail("AI Delivery content drafts list did not return a contentDrafts array.");
  }
  pass(`AI Delivery content drafts list endpoint returned cleanly (${initialContentDrafts.length} local draft(s)).`);

  const createdContentDraft = requireOkResponse(
    "AI Delivery content draft create",
    await request(`/ai-delivery-projects/${project.id}/content-drafts`, {
      method: "POST",
      token,
      body: {
        contentPlanItemId: contentPlanItem.id,
        title: "Smoke content draft",
        slug: "smoke-content-draft",
        draftBody: "Manual smoke draft body for client review coverage.",
        status: "DRAFT",
        notes: "Linked to the approved monthly content plan item."
      }
    })
  )?.contentDraft;
  if (
    !createdContentDraft?.id ||
    createdContentDraft.contentPlanItemId !== contentPlanItem.id ||
    createdContentDraft.status !== "DRAFT"
  ) {
    fail("AI Delivery content draft create did not return the expected project-scoped draft record.");
  }
  pass("AI Delivery content draft create returned the expected linked draft.");

  const updatedContentDraft = requireOkResponse(
    "AI Delivery content draft update",
    await request(`/ai-delivery-projects/${project.id}/content-drafts/${createdContentDraft.id}`, {
      method: "PUT",
      token,
      body: {
        contentPlanItemId: contentPlanItem.id,
        title: "Smoke content draft",
        slug: "smoke-content-draft",
        draftBody: "Manual smoke draft body updated for review coverage.",
        status: "DRAFT",
        notes: "Updated admin draft notes from local smoke."
      }
    })
  )?.contentDraft;
  if (
    !updatedContentDraft ||
    updatedContentDraft.draftBody !== "Manual smoke draft body updated for review coverage." ||
    updatedContentDraft.notes !== "Updated admin draft notes from local smoke."
  ) {
    fail("AI Delivery content draft update did not persist the expected draft body and notes.");
  }
  pass("AI Delivery content draft update persisted the expected body and admin notes.");

  const reviewableDraftsBeforeRequest = requireOkResponse(
    "AI Delivery content draft client review list before request",
    await request(`/ai-delivery-projects/${project.id}/content-drafts/client-review`, { token })
  )?.contentDrafts;
  if (!Array.isArray(reviewableDraftsBeforeRequest)) {
    fail("AI Delivery content draft client review list did not return a contentDrafts array.");
  }
  if (reviewableDraftsBeforeRequest.some((draft) => draft.id === createdContentDraft.id)) {
    fail("Client content draft review list exposed a draft that was not yet marked ready for review.");
  }
  pass("Client content draft review list excluded draft-only records before review was requested.");

  const reviewRequestedDraft = requireOkResponse(
    "AI Delivery content draft request client review",
    await request(`/ai-delivery-projects/${project.id}/content-drafts/${createdContentDraft.id}/request-client-review`, {
      method: "POST",
      token
    })
  )?.contentDraft;
  if (!reviewRequestedDraft || reviewRequestedDraft.status !== "READY_FOR_REVIEW" || typeof reviewRequestedDraft.reviewRequestedAt !== "string") {
    fail("AI Delivery content draft ready-for-review action did not persist the expected review state.");
  }
  pass("AI Delivery content draft ready-for-review action persisted the expected review state.");

  const reviewableDraftsAfterRequest = requireOkResponse(
    "AI Delivery content draft client review list after request",
    await request(`/ai-delivery-projects/${project.id}/content-drafts/client-review`, { token })
  )?.contentDrafts;
  if (
    !Array.isArray(reviewableDraftsAfterRequest) ||
    !reviewableDraftsAfterRequest.some((draft) => draft.id === createdContentDraft.id) ||
    reviewableDraftsAfterRequest.some((draft) => !["READY_FOR_REVIEW", "APPROVED", "CHANGES_REQUESTED"].includes(draft.status))
  ) {
    fail("Client content draft review list did not contain only reviewable draft states after review was requested.");
  }
  pass("Client content draft review list returned only reviewable draft states after review was requested.");

  const invalidRevisionRequest = await request(`/ai-delivery-projects/${project.id}/content-drafts/${createdContentDraft.id}/client-review/request-revision`, {
    method: "POST",
    token,
    body: { comment: "" }
  });
  if (invalidRevisionRequest.status !== 400 || invalidRevisionRequest.body?.ok !== false) {
    fail("Client content draft revision request accepted an empty comment.");
  }
  pass("Client content draft revision request rejected an empty comment.");

  const changesRequestedDraft = requireOkResponse(
    "AI Delivery content draft client revision request",
    await request(`/ai-delivery-projects/${project.id}/content-drafts/${createdContentDraft.id}/client-review/request-revision`, {
      method: "POST",
      token,
      body: { comment: "Please tighten the opening section and CTA." }
    })
  )?.contentDraft;
  if (
    !changesRequestedDraft ||
    changesRequestedDraft.status !== "CHANGES_REQUESTED" ||
    changesRequestedDraft.clientComment !== "Please tighten the opening section and CTA." ||
    (changesRequestedDraft.revisionCount ?? 0) < 1
  ) {
    fail("Client content draft revision request did not persist the expected revision status and comment.");
  }
  pass("Client content draft revision request persisted the expected revision status and comment.");

  const returnedToDraft = requireOkResponse(
    "AI Delivery content draft return to draft",
    await request(`/ai-delivery-projects/${project.id}/content-drafts/${createdContentDraft.id}/return-to-draft`, {
      method: "POST",
      token
    })
  )?.contentDraft;
  if (
    !returnedToDraft ||
    returnedToDraft.status !== "DRAFT" ||
    returnedToDraft.reviewRequestedAt !== null ||
    returnedToDraft.approvedAt !== null
  ) {
    fail("AI Delivery content draft return-to-draft action did not restore the expected draft state.");
  }
  pass("AI Delivery content draft return-to-draft action restored the expected draft state.");

  const reviewableDraftsAfterReturn = requireOkResponse(
    "AI Delivery content draft client review list after return to draft",
    await request(`/ai-delivery-projects/${project.id}/content-drafts/client-review`, { token })
  )?.contentDrafts;
  if (!Array.isArray(reviewableDraftsAfterReturn) || reviewableDraftsAfterReturn.some((draft) => draft.id === createdContentDraft.id)) {
    fail("Client content draft review list still exposed a draft after it was returned to draft.");
  }
  pass("Client content draft review list excluded a draft returned to draft.");

  requireOkResponse(
    "AI Delivery content draft request client review again",
    await request(`/ai-delivery-projects/${project.id}/content-drafts/${createdContentDraft.id}/request-client-review`, {
      method: "POST",
      token
    })
  );
  const approvedDraft = requireOkResponse(
    "AI Delivery content draft client approve",
    await request(`/ai-delivery-projects/${project.id}/content-drafts/${createdContentDraft.id}/client-review/approve`, {
      method: "POST",
      token
    })
  )?.contentDraft;
  if (!approvedDraft || approvedDraft.status !== "APPROVED" || typeof approvedDraft.approvedAt !== "string") {
    fail("Client content draft approve path did not persist the expected approved state.");
  }
  pass("Client content draft approve path persisted the expected approved state.");

  const initialArticleImages = requireOkResponse(
    "AI Delivery article images list",
    await request(`/ai-delivery-projects/${project.id}/article-images`, { token })
  )?.articleImages;
  if (!Array.isArray(initialArticleImages)) {
    fail("AI Delivery article images list did not return an articleImages array.");
  }
  pass(`AI Delivery article images list endpoint returned cleanly (${initialArticleImages.length} local image record(s)).`);

  const createdArticleImageResponse = await request(`/ai-delivery-projects/${project.id}/article-images`, {
    method: "POST",
    token,
    body: {
      contentDraftId: createdContentDraft.id,
      title: "Smoke article header image",
      prompt: "Clean service-themed header image for smoke coverage.",
      styleNotes: "Use a polished admin-safe preview reference only.",
      status: "DRAFT",
      previewImageUrl: "",
      finalImageUrl: "",
      storageKey: "",
      notes: "Manual-only image planning record from local smoke."
    }
  });
  const createdArticleImage = requireOkResponse(
    "AI Delivery article image create",
    createdArticleImageResponse
  )?.articleImage;
  if (
    !createdArticleImage?.id ||
    createdArticleImage.contentDraftId !== createdContentDraft.id ||
    createdArticleImage.status !== "DRAFT" ||
    /downloadUrl/i.test(createdArticleImageResponse.text)
  ) {
    fail("AI Delivery article image create did not return the expected same-project draft linkage or leaked a download field.");
  }
  pass("AI Delivery article image create returned the expected linked admin-only image record.");

  const updatedArticleImage = requireOkResponse(
    "AI Delivery article image update",
    await request(`/ai-delivery-projects/${project.id}/article-images/${createdArticleImage.id}`, {
      method: "PUT",
      token,
      body: {
        contentDraftId: createdContentDraft.id,
        title: "Smoke article header image",
        prompt: "Clean service-themed header image for smoke coverage.",
        styleNotes: "Updated style notes for smoke coverage.",
        status: "DRAFT",
        previewImageUrl: "https://example.com/smoke-image-preview.png",
        finalImageUrl: "",
        storageKey: "",
        notes: "Updated admin-only image notes."
      }
    })
  )?.articleImage;
  if (
    !updatedArticleImage ||
    updatedArticleImage.previewImageUrl !== "https://example.com/smoke-image-preview.png" ||
    updatedArticleImage.styleNotes !== "Updated style notes for smoke coverage."
  ) {
    fail("AI Delivery article image update did not persist the expected preview reference and style notes.");
  }
  pass("AI Delivery article image update persisted the expected preview reference and style notes.");

  const previewReadyArticleImage = requireOkResponse(
    "AI Delivery article image preview ready",
    await request(`/ai-delivery-projects/${project.id}/article-images/${createdArticleImage.id}/mark-preview-ready`, {
      method: "POST",
      token
    })
  )?.articleImage;
  if (!previewReadyArticleImage || previewReadyArticleImage.status !== "PREVIEW_READY") {
    fail("AI Delivery article image preview-ready action did not persist the expected status.");
  }
  pass("AI Delivery article image preview-ready action persisted the expected status.");

  const changesRequestedArticleImage = requireOkResponse(
    "AI Delivery article image request changes",
    await request(`/ai-delivery-projects/${project.id}/article-images/${createdArticleImage.id}/request-changes`, {
      method: "POST",
      token
    })
  )?.articleImage;
  if (!changesRequestedArticleImage || changesRequestedArticleImage.status !== "CHANGES_REQUESTED") {
    fail("AI Delivery article image request-changes action did not persist the expected status.");
  }
  pass("AI Delivery article image request-changes action persisted the expected status.");

  const approvedArticleImage = requireOkResponse(
    "AI Delivery article image approve",
    await request(`/ai-delivery-projects/${project.id}/article-images/${createdArticleImage.id}/approve`, {
      method: "POST",
      token
    })
  )?.articleImage;
  if (!approvedArticleImage || approvedArticleImage.status !== "APPROVED") {
    fail("AI Delivery article image approve action did not persist the expected approved state.");
  }
  pass("AI Delivery article image approve action persisted the expected approved state.");

  const finalReadyUpdatedImage = requireOkResponse(
    "AI Delivery article image final reference update",
    await request(`/ai-delivery-projects/${project.id}/article-images/${createdArticleImage.id}`, {
      method: "PUT",
      token,
      body: {
        contentDraftId: createdContentDraft.id,
        title: "Smoke article header image",
        prompt: "Clean service-themed header image for smoke coverage.",
        styleNotes: "Updated style notes for smoke coverage.",
        status: "APPROVED",
        previewImageUrl: "https://example.com/smoke-image-preview.png",
        finalImageUrl: "https://example.com/smoke-image-final.png",
        storageKey: "ai-delivery/smoke/final-image-reference.png",
        notes: "Final asset references recorded without any upload flow."
      }
    })
  )?.articleImage;
  if (
    !finalReadyUpdatedImage ||
    finalReadyUpdatedImage.finalImageUrl !== "https://example.com/smoke-image-final.png" ||
    finalReadyUpdatedImage.storageKey !== "ai-delivery/smoke/final-image-reference.png"
  ) {
    fail("AI Delivery article image final reference update did not persist the expected final URL and storage key.");
  }
  pass("AI Delivery article image final reference update persisted the expected final URL and storage key.");

  const finalReadyArticleImage = requireOkResponse(
    "AI Delivery article image final ready",
    await request(`/ai-delivery-projects/${project.id}/article-images/${createdArticleImage.id}/mark-final-ready`, {
      method: "POST",
      token
    })
  )?.articleImage;
  if (!finalReadyArticleImage || finalReadyArticleImage.status !== "FINAL_READY") {
    fail("AI Delivery article image final-ready action did not persist the expected status.");
  }
  pass("AI Delivery article image final-ready action persisted the expected status.");

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

  const crossProject = fixtureProjects.crossProject;
  if (!crossProject?.id) {
    fail("AI Delivery project create did not return a reusable cross-project record.");
  }
  pass("AI Delivery smoke setup returned a second project for cross-project deliverable linkage coverage.");

  const crossProjectContentPlan = requireOkResponse(
    "Cross-project content plan create",
    await request(`/ai-delivery-projects/${crossProject.id}/content-plan`, {
      method: "POST",
      token,
      body: {
        items: [
          {
            title: "Cross-project smoke topic",
            targetKeyword: "cross project deliverable guard",
            contentType: "article",
            notes: "Guard-only item.",
            sortOrder: 1,
            approvalStatus: "CLIENT_APPROVED",
            clientComment: "Approved for guard coverage."
          }
        ]
      }
    })
  )?.contentPlan;
  const crossProjectContentPlanItem = crossProjectContentPlan?.items?.[0] ?? null;
  if (!crossProjectContentPlanItem?.id) {
    fail("Cross-project content plan create did not return a reusable item.");
  }

  const crossProjectDraft = requireOkResponse(
    "Cross-project content draft create",
    await request(`/ai-delivery-projects/${crossProject.id}/content-drafts`, {
      method: "POST",
      token,
      body: {
        contentPlanItemId: crossProjectContentPlanItem.id,
        title: "Cross-project draft",
        slug: "cross-project-draft",
        draftBody: "Cross-project content draft for linkage guard coverage.",
        status: "DRAFT",
        notes: "Guard-only draft."
      }
    })
  )?.contentDraft;
  if (!crossProjectDraft?.id || crossProjectDraft.status !== "DRAFT") {
    fail("Cross-project content draft create did not return a valid guard draft.");
  }
  pass("Cross-project content draft create returned a guard draft for linkage coverage.");

  const invalidCrossProjectDeliverable = await request(`/ai-delivery-projects/${project.id}/deliverables`, {
    method: "POST",
    token,
    body: {
      contentDraftId: crossProjectDraft.id,
      title: "Invalid cross-project deliverable",
      description: "Should be rejected because the linked draft belongs to another project.",
      deliveryType: "ARTICLE_DRAFT",
      status: "DRAFT",
      notes: "Cross-project linkage must fail."
    }
  });
  if (![404, 400].includes(invalidCrossProjectDeliverable.status) || invalidCrossProjectDeliverable.body?.ok !== false) {
    fail("AI Delivery deliverable create accepted a cross-project content draft link.");
  }
  pass("AI Delivery deliverable create rejected a cross-project content draft link.");

  const notReadyLocalDraft = requireOkResponse(
    "Same-project draft create for ready guard",
    await request(`/ai-delivery-projects/${project.id}/content-drafts`, {
      method: "POST",
      token,
      body: {
        contentPlanItemId: contentPlanItem.id,
        title: "Same-project draft guard",
        slug: "same-project-draft-guard",
        draftBody: "Local draft used to prove ready packaging requires approval.",
        status: "DRAFT",
        notes: "Guard-only local draft."
      }
    })
  )?.contentDraft;
  if (!notReadyLocalDraft?.id || notReadyLocalDraft.status !== "DRAFT") {
    fail("Same-project guard draft create did not return a draft record.");
  }
  pass("Same-project guard draft create returned a draft record for ready-state validation.");

  const invalidReadyDeliverableResponse = await request(`/ai-delivery-projects/${project.id}/deliverables`, {
    method: "POST",
    token,
    body: {
      contentDraftId: notReadyLocalDraft.id,
      title: "Invalid ready deliverable",
      description: "Should be rejected because the linked draft is not approved.",
      deliveryType: "ARTICLE_DRAFT",
      status: "READY",
      notes: "Ready state must require approved links."
    }
  });
  if (![404, 400].includes(invalidReadyDeliverableResponse.status) || invalidReadyDeliverableResponse.body?.ok !== false) {
    fail("AI Delivery deliverable create accepted a ready status without approved assets.");
  }
  pass("AI Delivery deliverable create rejected a ready status without approved assets.");

  const createdDeliverable = requireOkResponse(
    "AI Delivery deliverable create",
    await request(`/ai-delivery-projects/${project.id}/deliverables`, {
      method: "POST",
      token,
      body: {
        contentDraftId: approvedDraft.id,
        articleImageId: finalReadyArticleImage.id,
        title: "Smoke admin packaging deliverable",
        description: "Admin-only package record for approved draft and final-ready image coverage.",
        deliveryType: "CONTENT_PACKAGE",
        status: "DRAFT",
        exportUrl: "https://example.com/admin-reference-only",
        notes: "Admin-only packaging notes."
      }
    })
  )?.deliverable;
  if (
    !createdDeliverable?.id ||
    createdDeliverable.contentDraftId !== approvedDraft.id ||
    createdDeliverable.articleImageId !== finalReadyArticleImage.id ||
    createdDeliverable.status !== "DRAFT" ||
    createdDeliverable.storageKey !== null
  ) {
    fail("AI Delivery deliverable create did not return the expected project-scoped package record.");
  }
  pass("AI Delivery deliverable create returned the expected linked admin package record.");

  const updatedDeliverable = requireOkResponse(
    "AI Delivery deliverable update",
    await request(`/ai-delivery-projects/${project.id}/deliverables/${createdDeliverable.id}`, {
      method: "PUT",
      token,
      body: {
        contentDraftId: approvedDraft.id,
        articleImageId: finalReadyArticleImage.id,
        title: "Smoke admin packaging deliverable",
        description: "Updated admin-only package record for approved draft and final-ready image coverage.",
        deliveryType: "CONTENT_PACKAGE",
        status: "DRAFT",
        exportUrl: "https://example.com/admin-reference-only-updated",
        notes: "Updated admin-only packaging notes."
      }
    })
  )?.deliverable;
  if (
    !updatedDeliverable ||
    updatedDeliverable.exportUrl !== "https://example.com/admin-reference-only-updated" ||
    updatedDeliverable.storageKey !== null
  ) {
    fail("AI Delivery deliverable update did not persist the expected admin references.");
  }
  pass("AI Delivery deliverable update persisted the expected admin reference fields.");

  const deliverableUploadResponse = await request(`/ai-delivery-projects/${project.id}/deliverables/${createdDeliverable.id}/document`, {
    method: "POST",
    token,
    body: {
      fileName: "smoke-deliverable-proof.pdf",
      mimeType: "application/pdf",
      contentBase64: Buffer.from("Smoke deliverable private upload proof.", "utf8").toString("base64")
    }
  });

  if (deliverableUploadResponse.status === 503) {
    if (
      deliverableUploadResponse.body?.ok !== false ||
      deliverableUploadResponse.body?.error?.code !== "R2_STORAGE_NOT_CONFIGURED"
    ) {
      fail("AI Delivery deliverable document upload did not return the expected storage-not-configured guard.");
    }

    const deliverablesAfterRejectedUpload = requireOkResponse(
      "AI Delivery deliverables list after guarded upload",
      await request(`/ai-delivery-projects/${project.id}/deliverables`, { token })
    )?.deliverables;
    const deliverableAfterRejectedUpload = Array.isArray(deliverablesAfterRejectedUpload)
      ? deliverablesAfterRejectedUpload.find((deliverable) => deliverable.id === createdDeliverable.id)
      : null;
    if (
      !deliverableAfterRejectedUpload ||
      deliverableAfterRejectedUpload.storageKey !== null ||
      deliverableAfterRejectedUpload.exportUrl !== "https://example.com/admin-reference-only-updated"
    ) {
      fail("AI Delivery deliverable document upload guard changed persisted references while storage was unavailable.");
    }

    pass("AI Delivery deliverable document upload returned the expected storage-not-configured guard without persisting a storage key.");
  } else {
    const uploadedDeliverable = requireOkResponse(
      "AI Delivery deliverable document upload",
      deliverableUploadResponse
    )?.deliverable;
    if (
      !uploadedDeliverable ||
      uploadedDeliverable.id !== createdDeliverable.id ||
      typeof uploadedDeliverable.storageKey !== "string" ||
      uploadedDeliverable.storageKey.length === 0 ||
      uploadedDeliverable.exportUrl !== null
    ) {
      fail("AI Delivery deliverable document upload did not return the expected private storage reference.");
    }

    const deliverablesAfterUpload = requireOkResponse(
      "AI Delivery deliverables list after upload",
      await request(`/ai-delivery-projects/${project.id}/deliverables`, { token })
    )?.deliverables;
    const persistedUploadedDeliverable = Array.isArray(deliverablesAfterUpload)
      ? deliverablesAfterUpload.find((deliverable) => deliverable.id === createdDeliverable.id)
      : null;
    if (
      !persistedUploadedDeliverable ||
      persistedUploadedDeliverable.storageKey !== uploadedDeliverable.storageKey ||
      persistedUploadedDeliverable.exportUrl !== null
    ) {
      fail("AI Delivery deliverable document upload did not persist the expected private storage key.");
    }

    const deliverableDownload = requireOkResponse(
      "AI Delivery deliverable secure download",
      await request(`/ai-delivery-projects/${project.id}/deliverables/${createdDeliverable.id}/download`, { token })
    );
    if (
      typeof deliverableDownload?.downloadUrl !== "string" ||
      deliverableDownload.downloadUrl.length === 0 ||
      typeof deliverableDownload.expiresSeconds !== "number" ||
      deliverableDownload.expiresSeconds <= 0
    ) {
      fail("AI Delivery deliverable secure download did not return a signed download reference.");
    }

    pass("AI Delivery deliverable document upload persisted a private storage key, cleared exportUrl, and returned a secure download reference.");
  }

  const readyDeliverable = requireOkResponse(
    "AI Delivery deliverable mark ready",
    await request(`/ai-delivery-projects/${project.id}/deliverables/${createdDeliverable.id}/mark-ready`, {
      method: "POST",
      token
    })
  )?.deliverable;
  if (!readyDeliverable || readyDeliverable.status !== "READY") {
    fail("AI Delivery deliverable mark-ready action did not persist the expected ready state.");
  }
  pass("AI Delivery deliverable mark-ready action persisted the expected ready state.");

  const acceptedDeliverable = requireOkResponse(
    "AI Delivery deliverable accept",
    await request(`/ai-delivery-projects/${project.id}/deliverables/${createdDeliverable.id}/accept`, {
      method: "POST",
      token
    })
  )?.deliverable;
  if (!acceptedDeliverable || acceptedDeliverable.status !== "ACCEPTED") {
    fail("AI Delivery deliverable accept action did not persist the expected accepted state.");
  }
  pass("AI Delivery deliverable accept action persisted the expected accepted state.");

  const revisionRequestedDeliverable = requireOkResponse(
    "AI Delivery deliverable request revision",
    await request(`/ai-delivery-projects/${project.id}/deliverables/${createdDeliverable.id}/request-revision`, {
      method: "POST",
      token
    })
  )?.deliverable;
  if (!revisionRequestedDeliverable || revisionRequestedDeliverable.status !== "REVISION_REQUESTED") {
    fail("AI Delivery deliverable request-revision action did not persist the expected revision state.");
  }
  pass("AI Delivery deliverable request-revision action persisted the expected revision state.");

  const archivedDeliverable = requireOkResponse(
    "AI Delivery deliverable archive",
    await request(`/ai-delivery-projects/${project.id}/deliverables/${createdDeliverable.id}/archive`, {
      method: "POST",
      token
    })
  )?.deliverable;
  if (!archivedDeliverable || archivedDeliverable.isArchived !== true || archivedDeliverable.status !== "ARCHIVED") {
    fail("AI Delivery deliverable archive action did not persist the expected archived state.");
  }
  pass("AI Delivery deliverable archive action persisted the expected archived state.");

  const restoredDeliverable = requireOkResponse(
    "AI Delivery deliverable restore",
    await request(`/ai-delivery-projects/${project.id}/deliverables/${createdDeliverable.id}/restore`, {
      method: "POST",
      token
    })
  )?.deliverable;
  if (!restoredDeliverable || restoredDeliverable.isArchived !== false || restoredDeliverable.status !== "DRAFT") {
    fail("AI Delivery deliverable restore action did not persist the expected draft state.");
  }
  pass("AI Delivery deliverable restore action persisted the expected draft state.");

  const readyDeliverableAgain = requireOkResponse(
    "AI Delivery deliverable mark ready again",
    await request(`/ai-delivery-projects/${project.id}/deliverables/${createdDeliverable.id}/mark-ready`, {
      method: "POST",
      token
    })
  )?.deliverable;
  if (!readyDeliverableAgain || readyDeliverableAgain.status !== "READY") {
    fail("AI Delivery deliverable second mark-ready action did not persist the expected ready state.");
  }
  pass("AI Delivery deliverable second mark-ready action persisted the expected ready state.");

  const createdDeliverableReview = requireOkResponse(
    "AI Delivery deliverable review create",
    await request(`/ai-delivery-projects/${project.id}/deliverables/${createdDeliverable.id}/reviews`, {
      method: "POST",
      token,
      body: {
        status: "ADMIN_REVIEW",
        reviewerName: "Smoke Reviewer",
        reviewNotes: "Internal packaging QA placeholder."
      }
    })
  )?.deliverableReview;
  if (!createdDeliverableReview?.id || createdDeliverableReview.status !== "ADMIN_REVIEW") {
    fail("AI Delivery deliverable review create did not return the expected admin placeholder.");
  }
  pass("AI Delivery deliverable review create returned the expected admin placeholder.");

  const updatedDeliverableReview = requireOkResponse(
    "AI Delivery deliverable review update",
    await request(`/ai-delivery-projects/${project.id}/deliverables/${createdDeliverable.id}/reviews/${createdDeliverableReview.id}`, {
      method: "PUT",
      token,
      body: {
        status: "APPROVED",
        reviewerName: "Smoke Reviewer",
        reviewNotes: "Approved for internal packaging handoff preparation."
      }
    })
  )?.deliverableReview;
  if (!updatedDeliverableReview || updatedDeliverableReview.status !== "APPROVED") {
    fail("AI Delivery deliverable review update did not persist the expected approved placeholder state.");
  }
  pass("AI Delivery deliverable review update persisted the expected approved placeholder state.");

  const deliverable = readyDeliverableAgain;

  const reviewsData = requireOkResponse(
    "AI Delivery deliverable reviews list",
    await request(`/ai-delivery-projects/${project.id}/deliverables/${deliverable.id}/reviews`, { token })
  );
  if (!Array.isArray(reviewsData?.deliverableReviews)) {
    fail("AI Delivery deliverable reviews list did not return a deliverableReviews array.");
  }
  if (!reviewsData.deliverableReviews.some((review) => review.id === createdDeliverableReview.id)) {
    fail("AI Delivery deliverable reviews list did not return the created admin review placeholder.");
  }
  pass(`AI Delivery deliverable reviews list endpoint returned cleanly (${reviewsData.deliverableReviews.length} local review(s)).`);
}

async function runAiDeliveryBrowserRegression(token, mainProject) {
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
    await page.getByRole("heading", { name: "AI Delivery Projects" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Operator summary").first().waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Workflow runs in focus").first().waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Research in focus").first().waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Content plan in focus").first().waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Production in focus").first().waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Deliverables in focus").first().waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Reviews in focus").first().waitFor({ state: "visible", timeout: 15000 });
    pass("AI Delivery admin UI loaded without crashing.");

    const smokeProjectCard = page.locator("article.entity-card").filter({ hasText: mainProject.name }).first();
    await smokeProjectCard.waitFor({ state: "visible", timeout: 15000 });
    await smokeProjectCard.getByText("Planning workflow").waitFor({ state: "visible", timeout: 15000 });
    await smokeProjectCard.getByText("Review / packaging").waitFor({ state: "visible", timeout: 15000 });
    await smokeProjectCard.getByText("Project actions").waitFor({ state: "visible", timeout: 15000 });
    await smokeProjectCard.getByText("Admin workflow order").waitFor({ state: "visible", timeout: 15000 });
    await smokeProjectCard.getByRole("button", { name: "Workflow runs" }).waitFor({ state: "visible", timeout: 15000 });
    await smokeProjectCard.getByRole("button", { name: "Research / Sources" }).waitFor({ state: "visible", timeout: 15000 });
    await smokeProjectCard.getByRole("button", { name: "AI SEO / Content Plan" }).waitFor({ state: "visible", timeout: 15000 });
    await smokeProjectCard.getByRole("button", { name: "Content production" }).waitFor({ state: "visible", timeout: 15000 });
    await smokeProjectCard.getByRole("button", { name: "Deliverables" }).waitFor({ state: "visible", timeout: 15000 });
    pass("AI Delivery smoke-owned project card rendered grouped workflow navigation.");

    await smokeProjectCard.getByRole("button", { name: "Workflow runs" }).click();
    await page.getByRole("dialog", { name: "Workflow Runs" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Existing workflow runs" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Workflow run editor").first().waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Execution log").first().waitFor({ state: "visible", timeout: 15000 });
    pass("Workflow runs panel opened and rendered execution details.");
    await page.getByRole("button", { name: "Close" }).first().click();

    await smokeProjectCard.getByRole("button", { name: "AI SEO / Content Plan" }).click();
    await page.getByRole("dialog", { name: "AI SEO / Content Plan" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Current content plan status" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "SEO topics / research records" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("button", { name: "Mark ready for review" }).first().waitFor({ state: "visible", timeout: 15000 });
    pass("AI SEO / Content Plan panel opened and rendered stable approval workflow structure.");
    await page.getByRole("button", { name: "Close" }).first().click();

    await smokeProjectCard.getByRole("button", { name: "Content production" }).click();
    await page.getByRole("dialog", { name: "AI Content Production Foundation" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Article production planning" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Approved / planned content plan items" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Existing article production records" }).waitFor({ state: "visible", timeout: 15000 });
    pass("AI Content Production panel opened and rendered stable draft workflow structure.");
    await page.getByRole("button", { name: "Close" }).first().click();

    await smokeProjectCard.getByRole("button", { name: "Article images" }).click();
    await page.getByRole("dialog", { name: "Image Production Planning" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Image production planning" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Existing image production records" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("button", { name: "Mark preview ready" }).first().waitFor({ state: "visible", timeout: 15000 });
    pass("Image Production Planning panel opened and rendered stable image workflow structure.");
    await page.getByRole("button", { name: "Close" }).first().click();

    await smokeProjectCard.getByRole("button", { name: "Research / Sources" }).click();
    await page.getByRole("dialog", { name: "Research / Sources" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Research request editor" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Existing research requests" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Research summary editor" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Existing research summaries" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Research source editor" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Existing research sources" }).waitFor({ state: "visible", timeout: 15000 });
    pass("Research / Sources panel opened and rendered stable request, summary, and source structure.");
    await page.getByRole("button", { name: "Close" }).first().click();

    await smokeProjectCard.getByRole("button", { name: "Deliverables" }).click();
    await page.getByRole("dialog", { name: "Deliverables" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Deliverable editor" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("heading", { name: "Existing deliverables" }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByRole("button", { name: "Mark ready" }).first().waitFor({ state: "visible", timeout: 15000 });
    pass("Deliverables panel opened and rendered stable packaging structure.");

    const reviewsButtons = page.getByRole("button", { name: "Reviews" });
    const reviewsButtonCount = await reviewsButtons.count();
    if (reviewsButtonCount === 0) {
      fail("Deliverables dialog did not render a Reviews button for the smoke-owned project.");
    }

    await reviewsButtons.first().click();
    await page.getByRole("heading", { name: /Deliverable reviews:/ }).waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Deliverable context").first().waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Review placeholders").first().waitFor({ state: "visible", timeout: 15000 });
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

async function main() {
  requireLocalUrl("AI_DELIVERY_REVIEW_SMOKE_API_BASE_URL", apiBaseUrl, "/api/v1");
  requireLocalUrl("AI_DELIVERY_REVIEW_SMOKE_WEB_URL", webUrl);
  requireEnv("AUTH_SEED_TEST_EMAIL", adminEmail);
  requireEnv("AUTH_SEED_TEST_PASSWORD", adminPassword);
  requireExactSmokeProjectMarker();

  let tenantId = null;

  try {
    const health = await request("/health");
    if (health.status !== 200 || health.body?.ok !== true || health.body?.data?.database?.status !== "ready") {
      fail(`API health/database check failed with HTTP ${health.status}.`);
    }
    pass("Local API health/database ready.");

    const token = await login();
    pass("Local admin API login succeeded.");

    tenantId = await getActiveTenantId(token);
    pass(`Active tenant resolved for smoke cleanup: ${tenantId}.`);

    const fixtureBase = await resolveSmokeFixtureBase(tenantId);
    await cleanupSmokeProjects(tenantId, "Pre-run cleanup");
    const fixtureProjects = await createSmokeProjects(token, fixtureBase);

    await runAiDeliveryApiRegression(token, fixtureProjects);
    await runAiDeliveryBrowserRegression(token, fixtureProjects.mainProject);
  } finally {
    if (tenantId) {
      await cleanupSmokeProjects(tenantId, "Post-run cleanup");
    }
    await prisma.$disconnect().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : "AI Delivery review smoke failed."}`);
  process.exit(1);
});