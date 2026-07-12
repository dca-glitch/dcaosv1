import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import {
  BOUNDED_PROOF_MANIFEST_VERSION,
  cleanupBoundedProofExactIds,
  continueBoundedProof,
  inspectBoundedProof,
  prepareBoundedProofData,
  startBoundedProof,
  type BoundedProofManifest
} from "../../src/core/ai-delivery-bounded-execution-bridge";
import { BoundedWorkflowError } from "../../src/core/ai-delivery-bounded-workflow.service";
import { createBoundedFakeWorkflowProviders } from "../../src/services/ai-delivery-bounded-workflow.fake-providers";
import { createPrismaWordPressDraftLiveAttemptStore } from "../../src/services/wordpress-live-draft-attempt.store";

const enabled = process.env.BOUNDED_BRIDGE_PRISMA_TEST === "true";
const prisma = new PrismaClient();

async function seedSharedScope() {
  const tenant = await prisma.tenant.create({
    data: { name: "Bounded Bridge Tenant", slug: `bounded-bridge-${randomUUID()}`, status: "ACTIVE" }
  });
  const owner = await prisma.user.create({
    data: { email: `owner-${randomUUID()}@example.test`, name: "Proof Owner", status: "ACTIVE" }
  });
  const clientUser = await prisma.user.create({
    data: { email: `client-${randomUUID()}@example.test`, name: "Client User", status: "ACTIVE" }
  });
  const ownerRole = await prisma.role.create({
    data: { tenantId: tenant.id, key: "owner", name: "Owner", status: "ACTIVE" }
  });
  const ownerMembership = await prisma.tenantMembership.create({
    data: { tenantId: tenant.id, userId: owner.id, status: "ACTIVE" }
  });
  await prisma.membershipRole.create({
    data: { tenantMembershipId: ownerMembership.id, roleId: ownerRole.id }
  });
  await prisma.tenantMembership.create({
    data: { tenantId: tenant.id, userId: clientUser.id, status: "ACTIVE" }
  });
  const client = await prisma.client.create({
    data: { tenantId: tenant.id, name: "Bounded Bridge Client" }
  });
  const foreignClient = await prisma.client.create({
    data: { tenantId: tenant.id, name: "Foreign Client" }
  });
  const target = await prisma.publicationTarget.create({
    data: {
      tenantId: tenant.id,
      clientId: client.id,
      label: "Exact Proof WordPress",
      connectorType: "WORDPRESS",
      siteUrl: "https://fake-wordpress.local",
      wordpressUsername: "proof-author"
    }
  });
  return { tenant, owner, clientUser, client, foreignClient, target };
}

function newManifest(scope: Awaited<ReturnType<typeof seedSharedScope>>): BoundedProofManifest {
  return {
    schemaVersion: BOUNDED_PROOF_MANIFEST_VERSION,
    proofCorrelationId: randomUUID(),
    tenantId: scope.tenant.id,
    clientId: scope.client.id,
    projectId: randomUUID(),
    contentDraftId: randomUUID(),
    publicationTargetId: scope.target.id,
    initiatingUserId: scope.owner.id,
    workflowRunId: null,
    articleImageId: null,
    wordpressAttemptId: null,
    emailLogId: null,
    wordpressPostId: null,
    storageKey: null,
    wordpressIdempotencyKey: null
  };
}

describe("bounded staging execution bridge with isolated Prisma", { skip: !enabled }, () => {
  it("proves exact scope, concurrency, manual approval, idempotency, and exact cleanup", async () => {
    const scope = await seedSharedScope();
    let manifest = newManifest(scope);
    manifest = await prepareBoundedProofData(manifest, prisma);

    await assert.rejects(
      prepareBoundedProofData(
        {
          ...newManifest(scope),
          clientId: scope.foreignClient.id
        },
        prisma
      ),
      /scope did not match/
    );
    await assert.rejects(
      prepareBoundedProofData(
        {
          ...newManifest(scope),
          initiatingUserId: scope.clientUser.id
        },
        prisma
      ),
      /scope did not match/
    );

    const fake = createBoundedFakeWorkflowProviders({
      wordpressAttemptStore: createPrismaWordPressDraftLiveAttemptStore(prisma)
    });
    const [firstStart, secondStart] = await Promise.all([
      startBoundedProof(manifest, { prisma, providers: fake.providers }),
      startBoundedProof(manifest, { prisma, providers: fake.providers })
    ]);
    manifest = firstStart.articleImageId ? firstStart : secondStart;
    assert.equal(firstStart.workflowRunId, secondStart.workflowRunId);
    assert.equal(fake.stats.imageRequests, 1);
    assert.equal(fake.stats.storageUploads, 1);

    let inspected = await inspectBoundedProof(manifest, prisma);
    assert.equal(inspected.state, "WAITING_FOR_IMAGE_APPROVAL");
    assert.equal(inspected.requestCounts.image, 1);
    assert.equal(inspected.requestCounts.storage, 1);
    assert.equal(inspected.retryCount, 0);
    assert.equal(inspected.fallbackUsed, false);

    await assert.rejects(
      continueBoundedProof(manifest, { prisma, providers: fake.providers }),
      (error: unknown) =>
        error instanceof BoundedWorkflowError && error.code === "image_not_approved"
    );
    assert.equal(fake.stats.wordpressCreates, 0);
    assert.equal(fake.stats.emailSends, 0);

    await prisma.aiDeliveryArticleImage.update({
      where: { id: manifest.articleImageId! },
      data: { status: "APPROVED" }
    });
    const [firstContinue, secondContinue] = await Promise.all([
      continueBoundedProof(manifest, { prisma, providers: fake.providers }),
      continueBoundedProof(manifest, { prisma, providers: fake.providers })
    ]);
    manifest =
      firstContinue.emailLogId && firstContinue.wordpressAttemptId
        ? firstContinue
        : secondContinue;
    inspected = await inspectBoundedProof(manifest, prisma);
    assert.equal(inspected.state, "COMPLETED");
    assert.equal(inspected.requestCounts.wordpress, 1);
    assert.equal(inspected.requestCounts.email, 1);
    assert.equal(fake.stats.wordpressCreates, 1);
    assert.equal(fake.stats.emailSends, 1);
    assert.deepEqual(fake.stats.emailRecipients, [scope.owner.email.toLowerCase()]);
    assert.equal(fake.stats.wordpressTrashes, 0);
    await assert.rejects(
      inspectBoundedProof(
        { ...manifest, wordpressAttemptId: randomUUID() },
        prisma
      ),
      /external linkage/
    );

    const duplicateStart = await startBoundedProof(manifest, {
      prisma,
      providers: fake.providers
    });
    const duplicateContinue = await continueBoundedProof(manifest, {
      prisma,
      providers: fake.providers
    });
    assert.equal(duplicateStart.workflowRunId, manifest.workflowRunId);
    assert.equal(duplicateContinue.workflowRunId, manifest.workflowRunId);
    assert.equal(fake.stats.imageRequests, 1);
    assert.equal(fake.stats.wordpressCreates, 1);
    assert.equal(fake.stats.emailSends, 1);

    const wrongProjectManifest = {
      ...manifest,
      projectId: randomUUID()
    };
    await assert.rejects(
      inspectBoundedProof(wrongProjectManifest, prisma),
      /not found/
    );
    await assert.rejects(
      inspectBoundedProof(
        { ...manifest, contentDraftId: randomUUID() },
        prisma
      ),
      /not found|exact bounded/
    );

    const cleanup = await cleanupBoundedProofExactIds(manifest, {
      prisma,
      cleanupProviders: fake.cleanupProviders
    });
    assert.equal(cleanup.residualRows, 0);
    assert.equal(fake.stats.storageDeletes, 1);
    assert.equal(fake.stats.wordpressTrashes, 1);
    assert.equal(await prisma.tenant.count({ where: { id: scope.tenant.id } }), 1);
    assert.equal(await prisma.client.count({ where: { id: scope.client.id } }), 1);
    assert.equal(await prisma.user.count({ where: { id: scope.owner.id } }), 1);
    assert.equal(
      await prisma.publicationTarget.count({ where: { id: scope.target.id } }),
      1
    );
  });

  it("preserves ambiguous image, WordPress, and email terminal states", async () => {
    const scope = await seedSharedScope();

    let imageManifest = await prepareBoundedProofData(newManifest(scope), prisma);
    const imageFake = createBoundedFakeWorkflowProviders({
      image: { failSubmit: true },
      wordpressAttemptStore: createPrismaWordPressDraftLiveAttemptStore(prisma)
    });
    imageManifest = await startBoundedProof(imageManifest, {
      prisma,
      providers: imageFake.providers
    });
    assert.equal((await inspectBoundedProof(imageManifest, prisma)).state, "AMBIGUOUS_IMAGE");
    await cleanupBoundedProofExactIds(imageManifest, {
      prisma,
      cleanupProviders: imageFake.cleanupProviders
    });

    let wordpressManifest = await prepareBoundedProofData(newManifest(scope), prisma);
    const wordpressFake = createBoundedFakeWorkflowProviders({
      ambiguousWordPress: true,
      wordpressAttemptStore: createPrismaWordPressDraftLiveAttemptStore(prisma)
    });
    wordpressManifest = await startBoundedProof(wordpressManifest, {
      prisma,
      providers: wordpressFake.providers
    });
    await prisma.aiDeliveryArticleImage.update({
      where: { id: wordpressManifest.articleImageId! },
      data: { status: "APPROVED" }
    });
    wordpressManifest = await continueBoundedProof(wordpressManifest, {
      prisma,
      providers: wordpressFake.providers
    });
    assert.equal(
      (await inspectBoundedProof(wordpressManifest, prisma)).state,
      "AMBIGUOUS_WORDPRESS"
    );
    await continueBoundedProof(wordpressManifest, {
      prisma,
      providers: wordpressFake.providers
    });
    assert.equal(wordpressFake.stats.wordpressCreates, 1);
    await cleanupBoundedProofExactIds(wordpressManifest, {
      prisma,
      cleanupProviders: wordpressFake.cleanupProviders
    });

    let emailManifest = await prepareBoundedProofData(newManifest(scope), prisma);
    const emailFake = createBoundedFakeWorkflowProviders({
      ambiguousEmail: true,
      wordpressAttemptStore: createPrismaWordPressDraftLiveAttemptStore(prisma)
    });
    emailManifest = await startBoundedProof(emailManifest, {
      prisma,
      providers: emailFake.providers
    });
    await prisma.aiDeliveryArticleImage.update({
      where: { id: emailManifest.articleImageId! },
      data: { status: "APPROVED" }
    });
    emailManifest = await continueBoundedProof(emailManifest, {
      prisma,
      providers: emailFake.providers
    });
    assert.equal((await inspectBoundedProof(emailManifest, prisma)).state, "AMBIGUOUS_EMAIL");
    await continueBoundedProof(emailManifest, {
      prisma,
      providers: emailFake.providers
    });
    assert.equal(emailFake.stats.wordpressCreates, 1);
    assert.equal(emailFake.stats.emailSends, 1);
    await cleanupBoundedProofExactIds(emailManifest, {
      prisma,
      cleanupProviders: emailFake.cleanupProviders
    });
  });
});

after(async () => {
  await prisma.$disconnect();
});
