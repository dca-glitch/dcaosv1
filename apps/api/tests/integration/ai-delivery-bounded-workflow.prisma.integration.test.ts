import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import { createPrismaBoundedWorkflowStore } from "../../src/core/ai-delivery-bounded-workflow.store";
import {
  BoundedWorkflowError,
  BOUNDED_CONTENT_TO_DRAFT_WORKFLOW_TYPE,
  continueBoundedContentToDraftWorkflowAfterImageApproval,
  startBoundedContentToDraftWorkflow
} from "../../src/core/ai-delivery-bounded-workflow.service";
import { createBoundedFakeWorkflowProviders } from "../../src/services/ai-delivery-bounded-workflow.fake-providers";
import { createPrismaWordPressDraftLiveAttemptStore } from "../../src/services/wordpress-live-draft-attempt.store";

const enabled = process.env.BOUNDED_WORKFLOW_PRISMA_TEST === "true";
const clients: PrismaClient[] = [];

function createClient(): PrismaClient {
  const client = new PrismaClient();
  clients.push(client);
  return client;
}

async function seedTenantGraph(prisma: PrismaClient, suffix: string) {
  const tenant = await prisma.tenant.create({
    data: {
      name: `Bounded Test ${suffix}`,
      slug: `bounded-test-${suffix}`,
      status: "ACTIVE"
    }
  });
  const user = await prisma.user.create({
    data: {
      email: `owner-${suffix}@example.test`,
      name: `Owner ${suffix}`,
      status: "ACTIVE"
    }
  });
  const role = await prisma.role.create({
    data: {
      tenantId: tenant.id,
      key: "owner",
      name: "Owner",
      status: "ACTIVE"
    }
  });
  const membership = await prisma.tenantMembership.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      status: "ACTIVE"
    }
  });
  await prisma.membershipRole.create({
    data: {
      tenantMembershipId: membership.id,
      roleId: role.id
    }
  });
  const client = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: `Client ${suffix}`
    }
  });
  const project = await prisma.aiDeliveryProject.create({
    data: {
      tenantId: tenant.id,
      clientId: client.id,
      name: `Bounded Project ${suffix}`,
      targetMonth: new Date("2026-07-01T00:00:00.000Z")
    }
  });
  const target = await prisma.publicationTarget.create({
    data: {
      tenantId: tenant.id,
      clientId: client.id,
      label: `WordPress ${suffix}`,
      connectorType: "WORDPRESS",
      siteUrl: "https://fake-wordpress.local",
      wordpressUsername: "bounded-author",
      isDefault: true
    }
  });
  return { tenant, user, client, project, target };
}

async function createApprovedDraft(
  prisma: PrismaClient,
  input: { tenantId: string; projectId: string; suffix: string }
) {
  return prisma.aiDeliveryContentDraft.create({
    data: {
      tenantId: input.tenantId,
      aiDeliveryProjectId: input.projectId,
      title: `Approved bounded draft ${input.suffix}`,
      draftBody: `<p>Durable fake-provider proof ${input.suffix}.</p>`,
      status: "APPROVED",
      approvedAt: new Date()
    }
  });
}

describe(
  "bounded AI Delivery workflow — isolated Prisma persistence",
  { skip: !enabled },
  () => {
    it("persists concurrency, restart, linkage, ambiguity, and tenant/client guards", async () => {
      const setupPrisma = createClient();
      const primary = await seedTenantGraph(setupPrisma, "primary");
      const foreign = await seedTenantGraph(setupPrisma, "foreign");
      const secondClient = await setupPrisma.client.create({
        data: {
          tenantId: primary.tenant.id,
          name: "Cross-client target owner"
        }
      });
      const crossClientTarget = await setupPrisma.publicationTarget.create({
        data: {
          tenantId: primary.tenant.id,
          clientId: secondClient.id,
          label: "Wrong client WordPress",
          connectorType: "WORDPRESS",
          siteUrl: "https://fake-wordpress.local",
          wordpressUsername: "wrong-client-author"
        }
      });
      const happyDraft = await createApprovedDraft(setupPrisma, {
        tenantId: primary.tenant.id,
        projectId: primary.project.id,
        suffix: "happy"
      });

      const firstPrisma = createClient();
      const concurrentPrisma = createClient();
      const firstStore = createPrismaBoundedWorkflowStore(firstPrisma);
      const concurrentStore = createPrismaBoundedWorkflowStore(concurrentPrisma);
      const startFake = createBoundedFakeWorkflowProviders();
      const startInput = {
        tenantId: primary.tenant.id,
        contentDraftId: happyDraft.id,
        actorUserId: primary.user.id
      };

      await Promise.all([
        startBoundedContentToDraftWorkflow(startInput, {
          store: firstStore,
          providers: startFake.providers
        }),
        startBoundedContentToDraftWorkflow(startInput, {
          store: concurrentStore,
          providers: startFake.providers
        })
      ]);

      assert.equal(startFake.stats.imageRequests, 1);
      assert.equal(startFake.stats.storageUploads, 1);
      assert.equal(
        await setupPrisma.aiDeliveryBoundedWorkflowRun.count({
          where: {
            tenantId: primary.tenant.id,
            contentDraftId: happyDraft.id,
            workflowType: BOUNDED_CONTENT_TO_DRAFT_WORKFLOW_TYPE
          }
        }),
        1
      );

      await firstPrisma.$disconnect();
      await concurrentPrisma.$disconnect();
      const reloadPrisma = createClient();
      const reloadStore = createPrismaBoundedWorkflowStore(reloadPrisma);
      const persisted = await reloadPrisma.aiDeliveryBoundedWorkflowRun.findUniqueOrThrow({
        where: {
          tenantId_contentDraftId_workflowType: {
            tenantId: primary.tenant.id,
            contentDraftId: happyDraft.id,
            workflowType: BOUNDED_CONTENT_TO_DRAFT_WORKFLOW_TYPE
          }
        }
      });
      assert.equal(persisted.state, "WAITING_FOR_IMAGE_APPROVAL");
      assert.ok(persisted.articleImageId);
      assert.equal(persisted.imageRequestCount, 1);
      assert.equal(persisted.storageUploadCount, 1);
      const persistedImage = await reloadPrisma.aiDeliveryArticleImage.findUniqueOrThrow({
        where: { id: persisted.articleImageId! }
      });
      assert.equal(persistedImage.status, "PREVIEW_READY");
      assert.equal(persistedImage.contentDraftId, happyDraft.id);
      assert.equal(persistedImage.storageKey, persisted.storageKey);

      const continuationFake = createBoundedFakeWorkflowProviders({
        wordpressAttemptStore: createPrismaWordPressDraftLiveAttemptStore(reloadPrisma)
      });
      await assert.rejects(
        continueBoundedContentToDraftWorkflowAfterImageApproval(
          { tenantId: primary.tenant.id, workflowRunId: persisted.id },
          { store: reloadStore, providers: continuationFake.providers }
        ),
        (error: unknown) =>
          error instanceof BoundedWorkflowError && error.code === "image_not_approved"
      );
      assert.equal(continuationFake.stats.wordpressCreates, 0);

      await reloadPrisma.aiDeliveryArticleImage.update({
        where: { id: persisted.articleImageId! },
        data: { status: "APPROVED" }
      });

      const secondContinuationPrisma = createClient();
      const secondContinuationStore = createPrismaBoundedWorkflowStore(secondContinuationPrisma);
      await Promise.all([
        continueBoundedContentToDraftWorkflowAfterImageApproval(
          { tenantId: primary.tenant.id, workflowRunId: persisted.id },
          { store: reloadStore, providers: continuationFake.providers }
        ),
        continueBoundedContentToDraftWorkflowAfterImageApproval(
          { tenantId: primary.tenant.id, workflowRunId: persisted.id },
          { store: secondContinuationStore, providers: continuationFake.providers }
        )
      ]);

      const completed = await reloadPrisma.aiDeliveryBoundedWorkflowRun.findUniqueOrThrow({
        where: { id: persisted.id }
      });
      assert.equal(completed.state, "COMPLETED");
      assert.equal(completed.wordpressRequestCount, 1);
      assert.equal(completed.emailRequestCount, 1);
      assert.ok(completed.wordpressAttemptId);
      assert.ok(completed.wordpressPostId);
      assert.ok(completed.emailLogId);
      assert.ok(completed.emailProviderMessageId);
      assert.equal(continuationFake.stats.wordpressCreates, 1);
      assert.equal(continuationFake.stats.emailSends, 1);
      assert.equal(
        await reloadPrisma.wordPressDraftLiveAttempt.count({
          where: {
            tenantId: primary.tenant.id,
            idempotencyKey: completed.wordpressIdempotencyKey
          }
        }),
        1
      );
      const emailLog = await reloadPrisma.emailLog.findUniqueOrThrow({
        where: { id: completed.emailLogId! }
      });
      assert.equal(emailLog.status, "SENT");
      assert.equal(emailLog.providerMessageId, completed.emailProviderMessageId);

      const duplicateStart = await startBoundedContentToDraftWorkflow(startInput, {
        store: reloadStore,
        providers: startFake.providers
      });
      const duplicateContinuation = await continueBoundedContentToDraftWorkflowAfterImageApproval(
        { tenantId: primary.tenant.id, workflowRunId: persisted.id },
        { store: reloadStore, providers: continuationFake.providers }
      );
      assert.equal(duplicateStart.id, completed.id);
      assert.equal(duplicateContinuation.state, "COMPLETED");
      assert.equal(startFake.stats.imageRequests, 1);
      assert.equal(continuationFake.stats.wordpressCreates, 1);
      assert.equal(continuationFake.stats.emailSends, 1);

      const ambiguousDraft = await createApprovedDraft(reloadPrisma, {
        tenantId: primary.tenant.id,
        projectId: primary.project.id,
        suffix: "ambiguous"
      });
      const ambiguousFake = createBoundedFakeWorkflowProviders({
        ambiguousWordPress: true,
        wordpressAttemptStore: createPrismaWordPressDraftLiveAttemptStore(reloadPrisma)
      });
      let ambiguousRun = await startBoundedContentToDraftWorkflow(
        {
          tenantId: primary.tenant.id,
          contentDraftId: ambiguousDraft.id,
          actorUserId: primary.user.id
        },
        { store: reloadStore, providers: ambiguousFake.providers }
      );
      await reloadPrisma.aiDeliveryArticleImage.update({
        where: { id: ambiguousRun.articleImageId! },
        data: { status: "APPROVED" }
      });
      ambiguousRun = await continueBoundedContentToDraftWorkflowAfterImageApproval(
        { tenantId: primary.tenant.id, workflowRunId: ambiguousRun.id },
        { store: reloadStore, providers: ambiguousFake.providers }
      );
      assert.equal(ambiguousRun.state, "AMBIGUOUS_WORDPRESS");
      await continueBoundedContentToDraftWorkflowAfterImageApproval(
        { tenantId: primary.tenant.id, workflowRunId: ambiguousRun.id },
        { store: reloadStore, providers: ambiguousFake.providers }
      );
      assert.equal(ambiguousFake.stats.wordpressCreates, 1);
      assert.equal(ambiguousFake.stats.emailSends, 0);

      assert.equal(await reloadStore.getRun(foreign.tenant.id, completed.id), null);
      await assert.rejects(
        startBoundedContentToDraftWorkflow(
          {
            tenantId: foreign.tenant.id,
            contentDraftId: happyDraft.id,
            actorUserId: foreign.user.id
          },
          { store: reloadStore, providers: startFake.providers }
        ),
        (error: unknown) => error instanceof BoundedWorkflowError && error.code === "not_found"
      );

      const crossClientDraft = await createApprovedDraft(reloadPrisma, {
        tenantId: primary.tenant.id,
        projectId: primary.project.id,
        suffix: "cross-client"
      });
      const crossClientFake = createBoundedFakeWorkflowProviders({
        wordpressAttemptStore: createPrismaWordPressDraftLiveAttemptStore(reloadPrisma)
      });
      const crossClientRun = await startBoundedContentToDraftWorkflow(
        {
          tenantId: primary.tenant.id,
          contentDraftId: crossClientDraft.id,
          actorUserId: primary.user.id
        },
        { store: reloadStore, providers: crossClientFake.providers }
      );
      await reloadPrisma.aiDeliveryArticleImage.update({
        where: { id: crossClientRun.articleImageId! },
        data: { status: "APPROVED" }
      });
      await reloadPrisma.aiDeliveryBoundedWorkflowRun.update({
        where: { id: crossClientRun.id },
        data: { publicationTargetId: crossClientTarget.id }
      });
      await assert.rejects(
        continueBoundedContentToDraftWorkflowAfterImageApproval(
          { tenantId: primary.tenant.id, workflowRunId: crossClientRun.id },
          { store: reloadStore, providers: crossClientFake.providers }
        ),
        (error: unknown) =>
          error instanceof BoundedWorkflowError && error.code === "publication_target_mismatch"
      );
      assert.equal(crossClientFake.stats.wordpressCreates, 0);
      assert.equal(crossClientFake.stats.emailSends, 0);
    });
  }
);

after(async () => {
  await Promise.allSettled(clients.map((client) => client.$disconnect()));
});
