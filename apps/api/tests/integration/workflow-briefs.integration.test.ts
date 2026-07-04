import assert from "node:assert/strict";
import { describe, it } from "node:test";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("API integration — workflow briefs foundation", () => {
  it("requires auth for workflow brief listing", async () => {
    const response = await request(app).get("/api/v1/workflow-briefs").expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });

  it("requires auth for workflow brief creation", async () => {
    const response = await request(app)
      .post("/api/v1/workflow-briefs")
      .send({ clientId: "x", title: "Test" })
      .expect(401);
    assert.equal(response.body.error?.code, "AUTH_UNAUTHORIZED");
  });
});

describe("API integration — workflow briefs lifecycle (optional)", () => {
  const password = process.env.AUTH_SEED_TEST_PASSWORD;
  const email = process.env.AUTH_SEED_TEST_EMAIL ?? "admin@dca.local";

  if (!password) {
    it("protected workflow brief lifecycle checks", { skip: "AUTH_SEED_TEST_PASSWORD unset" }, () => {});
    return;
  }

  it("creates, submits, runs AI, and attaches reports + production plan", async () => {
    const login = await request(app).post("/api/v1/auth/login").send({ email, password }).expect(200);
    const token = login.body.data?.session?.token as string;
    assert.ok(token);

    const clientsResponse = await request(app)
      .get("/api/v1/clients")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    const clients = clientsResponse.body.data?.clients as Array<{ id: string; name: string }> | undefined;
    assert.ok(Array.isArray(clients) && clients.length > 0, "expected at least one client for workflow brief smoke");
    const clientId = clients[0].id;

    const createResponse = await request(app)
      .post("/api/v1/workflow-briefs")
      .set("Authorization", `Bearer ${token}`)
      .send({
        clientId,
        title: "[SMOKE] Workflow brief foundation",
        goal: "Validate brief-centered workflow foundation",
        businessContext: "Smoke test context",
        targetAudience: "Test audience"
      })
      .expect(201);

    assert.equal(createResponse.body.ok, true);
    const briefId = createResponse.body.data?.id as string;
    assert.ok(briefId);

    const submitResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(submitResponse.body.data?.status, "READY_FOR_AI");

    const runResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/run-ai`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(runResponse.body.ok, true);
    assert.equal(runResponse.body.data?.run?.status, "COMPLETED");
    assert.ok(runResponse.body.data?.miReport?.id);
    assert.ok(runResponse.body.data?.seoReport?.id);
    assert.equal(runResponse.body.data?.brief?.status, "AI_RESULTS_READY");

    const miReportJson = runResponse.body.data?.miReport?.reportJson as Record<string, unknown> | undefined;
    assert.ok(miReportJson, "expected MI reportJson");
    assert.equal(miReportJson.kind, "mi");
    assert.ok(typeof miReportJson.summary === "string" && miReportJson.summary.length > 0);
    assert.ok(Array.isArray(miReportJson.opportunities) && miReportJson.opportunities.length > 0);
    assert.ok(Array.isArray(miReportJson.recommendedActions) && miReportJson.recommendedActions.length > 0);
    assert.equal(miReportJson.isDeterministic, true, "local proof should use deterministic path");

    const seoReportJson = runResponse.body.data?.seoReport?.reportJson as Record<string, unknown> | undefined;
    assert.ok(seoReportJson, "expected SEO reportJson");
    assert.equal(seoReportJson.kind, "seo");
    assert.ok(Array.isArray(seoReportJson.keywordClusters) && seoReportJson.keywordClusters.length > 0);
    assert.ok(Array.isArray(seoReportJson.topicIdeas) && seoReportJson.topicIdeas.length > 0);
    assert.equal(seoReportJson.isDeterministic, true, "local proof should use deterministic path");

    const miResponse = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/mi-report`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    assert.equal(miResponse.body.ok, true);
    assert.ok(miResponse.body.data?.summaryText);

    const seoResponse = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/seo-report`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    assert.equal(seoResponse.body.ok, true);
    assert.ok(seoResponse.body.data?.summaryText);

    const generatePlanResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/production-plan/generate`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(generatePlanResponse.body.ok, true);
    assert.match(generatePlanResponse.body.data?.title ?? "", /Production Plan —/);
    assert.ok(generatePlanResponse.body.data?.body);
    const planJson = generatePlanResponse.body.data?.planJson as Record<string, unknown> | undefined;
    assert.ok(planJson, "expected planJson");
    assert.equal(planJson.kind, "production_plan");
    assert.ok(Array.isArray(planJson.priorityTopics) && planJson.priorityTopics.length > 0);
    assert.ok(generatePlanResponse.body.data?.clientVisibleSnapshotJson);

    const sendPlanResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/production-plan/send`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    assert.equal(sendPlanResponse.body.data?.status, "SENT_TO_CLIENT");
    assert.ok(sendPlanResponse.body.data?.sentToClientAt);

    const approvePlanResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/production-plan/approve`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    assert.equal(approvePlanResponse.body.data?.plan?.status, "APPROVED");
    assert.equal(approvePlanResponse.body.data?.brief?.status, "APPROVED_FOR_PRODUCTION");

    const createProjectResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/create-project`)
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(201);

    assert.equal(createProjectResponse.body.ok, true);
    assert.ok(createProjectResponse.body.data?.project?.id);
    assert.equal(createProjectResponse.body.data?.created, true);
    assert.equal(createProjectResponse.body.data?.project?.sourceBriefId, briefId);

    const duplicateProjectResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/create-project`)
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(200);
    assert.equal(duplicateProjectResponse.body.data?.created, false);
    assert.equal(duplicateProjectResponse.body.data?.project?.id, createProjectResponse.body.data?.project?.id);

    const seedResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/seed-content-production`)
      .set("Authorization", `Bearer ${token}`)
      .expect(201);

    assert.equal(seedResponse.body.ok, true);
    assert.equal(seedResponse.body.data?.seeded, true);
    assert.ok(seedResponse.body.data?.itemsCreated > 0);
    assert.ok(seedResponse.body.data?.contentPlan?.itemCount > 0);
    assert.equal(seedResponse.body.data?.lineage?.briefId, briefId);

    const duplicateSeedResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/seed-content-production`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(duplicateSeedResponse.body.data?.itemsCreated, 0);
    assert.equal(
      duplicateSeedResponse.body.data?.contentPlan?.id,
      seedResponse.body.data?.contentPlan?.id
    );

    const seedStatusResponse = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/content-production-seed`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(seedStatusResponse.body.data?.isSeeded, true);
    assert.ok(seedStatusResponse.body.data?.itemCount > 0);
    assert.equal(seedStatusResponse.body.data?.canSeed, false);

    const generateDraftsResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/generate-content-drafts`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(generateDraftsResponse.body.ok, true);
    assert.ok(generateDraftsResponse.body.data?.created > 0);
    assert.equal(generateDraftsResponse.body.data?.isDeterministic, true);
    assert.ok(generateDraftsResponse.body.data?.status?.draftCount > 0);
    assert.equal(generateDraftsResponse.body.data?.status?.pendingCount, 0);

    const duplicateDraftsResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/generate-content-drafts`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(duplicateDraftsResponse.body.data?.created, 0);
    assert.ok(duplicateDraftsResponse.body.data?.reused > 0);
    assert.equal(
      duplicateDraftsResponse.body.data?.status?.draftCount,
      generateDraftsResponse.body.data?.status?.draftCount
    );

    const draftStatusResponse = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/content-drafts`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(draftStatusResponse.body.data?.isSeeded, true);
    assert.ok(draftStatusResponse.body.data?.draftCount > 0);
    assert.ok(draftStatusResponse.body.data?.packageReadiness !== "none");
    assert.ok(Array.isArray(draftStatusResponse.body.data?.items));

    const firstSeedItemId = draftStatusResponse.body.data?.items?.[0]?.contentPlanItemId as string;
    assert.ok(firstSeedItemId);

    const regenerateResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/regenerate-content-draft`)
      .set("Authorization", `Bearer ${token}`)
      .send({ contentPlanItemId: firstSeedItemId })
      .expect(200);

    assert.equal(regenerateResponse.body.ok, true);
    assert.equal(regenerateResponse.body.data?.regenerated, true);
    assert.equal(regenerateResponse.body.data?.outcome, "updated");
    assert.equal(regenerateResponse.body.data?.isDeterministic, true);

    const packagingStatusResponse = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/deliverable-packaging`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(packagingStatusResponse.body.ok, true);
    assert.ok(packagingStatusResponse.body.data?.eligibleDraftCount > 0);
    assert.equal(packagingStatusResponse.body.data?.packagedCount, 0);

    const packageResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/package-deliverables`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(packageResponse.body.ok, true);
    assert.ok(packageResponse.body.data?.outcomes?.created > 0);
    assert.ok(packageResponse.body.data?.status?.packagedCount > 0);
    assert.equal(packageResponse.body.data?.status?.unpackagedCount, 0);

    const duplicatePackageResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/package-deliverables`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(duplicatePackageResponse.body.ok, true);
    assert.equal(duplicatePackageResponse.body.data?.outcomes?.created, 0);
    assert.ok(duplicatePackageResponse.body.data?.outcomes?.reused > 0);
    assert.equal(
      duplicatePackageResponse.body.data?.status?.packagedCount,
      packageResponse.body.data?.status?.packagedCount
    );

    const repackageResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/repackage-deliverable`)
      .set("Authorization", `Bearer ${token}`)
      .send({ contentPlanItemId: firstSeedItemId })
      .expect(200);

    assert.equal(repackageResponse.body.ok, true);
    assert.equal(repackageResponse.body.data?.outcome, "updated");
    assert.ok(repackageResponse.body.data?.deliverableId);

    const imageSetStatusResponse = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/image-sets`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(imageSetStatusResponse.body.ok, true);
    assert.ok(imageSetStatusResponse.body.data?.eligibleCount > 0);
    assert.equal(imageSetStatusResponse.body.data?.preparedCount, 0);

    const prepareImagesResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/prepare-image-sets`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(prepareImagesResponse.body.ok, true);
    assert.ok(prepareImagesResponse.body.data?.outcomes?.created > 0);
    assert.ok(prepareImagesResponse.body.data?.status?.preparedCount > 0);
    assert.ok(prepareImagesResponse.body.data?.completeness?.items?.[0]?.hasImageCandidate);

    const duplicateImagesResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/prepare-image-sets`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(duplicateImagesResponse.body.data?.outcomes?.created, 0);
    assert.ok(duplicateImagesResponse.body.data?.outcomes?.reused > 0);

    const refreshImageResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/refresh-image-set`)
      .set("Authorization", `Bearer ${token}`)
      .send({ contentPlanItemId: firstSeedItemId })
      .expect(200);

    assert.equal(refreshImageResponse.body.ok, true);
    assert.equal(refreshImageResponse.body.data?.outcome, "updated");
    assert.ok(refreshImageResponse.body.data?.articleImageId);

    const completenessResponse = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/package-completeness`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(completenessResponse.body.ok, true);
    assert.ok(completenessResponse.body.data?.items?.length > 0);
    assert.ok(completenessResponse.body.data?.items?.[0]?.hasTextDeliverable);
    assert.ok(completenessResponse.body.data?.items?.[0]?.hasImageCandidate);

    const releasePrepResponse = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/release-prep`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(releasePrepResponse.body.ok, true);
    assert.equal(releasePrepResponse.body.data?.releasePrepStage, "not_ready");

    const prepareReleaseBlocked = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/prepare-release`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    assert.equal(prepareReleaseBlocked.body.error?.code, "RELEASE_PREP_NOT_READY");

    const firstDeliverableId = packageResponse.body.data?.status?.items?.[0]?.deliverableId as string;
    assert.ok(firstDeliverableId);

    const projectId = createProjectResponse.body.data?.project?.id as string;
    assert.ok(projectId);

    const releasePackageBeforeFinalize = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/release-package`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(releasePackageBeforeFinalize.body.ok, true);
    assert.equal(releasePackageBeforeFinalize.body.data?.releasePackageFinalized, false);

    const finalizeBlocked = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/finalize-release-package`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);

    assert.equal(finalizeBlocked.body.error?.code, "RELEASE_PACKAGE_PREP_MISSING");

    const sendReviewResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/deliverables/${firstDeliverableId}/send-for-client-review`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(sendReviewResponse.body.ok, true);
    assert.equal(sendReviewResponse.body.data?.deliverable?.status, "PENDING_CLIENT_REVIEW");
    assert.ok((sendReviewResponse.body.data?.deliverable?.bodyContent ?? "").length > 0);

    const completenessAfterReview = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/package-completeness`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    assert.equal(completenessAfterReview.body.data?.clientReviewInProgressCount > 0, true);
    assert.ok(completenessAfterReview.body.data?.items?.[0]?.articleImageId);

    const lockedRepackageResponse = await request(app)
      .post(`/api/v1/workflow-briefs/${briefId}/repackage-deliverable`)
      .set("Authorization", `Bearer ${token}`)
      .send({ contentPlanItemId: firstSeedItemId })
      .expect(409);

    assert.equal(lockedRepackageResponse.body.error?.code, "DELIVERABLE_REPACKAGE_LOCKED");

    const getPlanResponse = await request(app)
      .get(`/api/v1/workflow-briefs/${briefId}/production-plan`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    assert.equal(getPlanResponse.body.data?.status, "APPROVED");
    assert.ok(getPlanResponse.body.data?.body);

    const listResponse = await request(app)
      .get("/api/v1/workflow-briefs")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    assert.equal(listResponse.body.ok, true);
    const listed = listResponse.body.data as Array<{ id: string }>;
    assert.ok(listed.some((item) => item.id === briefId));
  });
});
