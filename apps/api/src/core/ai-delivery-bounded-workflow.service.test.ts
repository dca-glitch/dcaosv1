import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WORDPRESS_LIVE_HTTP_FROZEN } from "../services/wordpress.service";
import { createBoundedFakeWorkflowProviders } from "../services/ai-delivery-bounded-workflow.fake-providers";
import {
  BoundedWorkflowError,
  continueBoundedContentToDraftWorkflowAfterImageApproval,
  startBoundedContentToDraftWorkflow
} from "./ai-delivery-bounded-workflow.service";
import {
  createBoundedMemoryWorkflowStore,
  type BoundedMemoryFixture
} from "./ai-delivery-bounded-workflow.memory-store";

function fixture(overrides: Partial<BoundedMemoryFixture> = {}): BoundedMemoryFixture {
  const tenantId = overrides.tenantId ?? "tenant-a";
  const actorUserId = overrides.actorUserId ?? "owner-a";
  const clientId = overrides.clientId ?? "client-a";
  const publicationTargetId = overrides.publicationTargetId ?? "target-a";
  return {
    tenantId,
    actorUserId,
    aiDeliveryProjectId: "project-a",
    clientId,
    contentDraftId: "draft-a",
    contentTitle: "Bounded workflow article",
    contentBody: "<p>Approved content.</p>",
    imagePrompt: "A neutral editorial hero image.",
    contentApproved: true,
    contentArchived: false,
    projectArchived: false,
    publicationTargetId,
    publicationTarget: {
      id: publicationTargetId,
      tenantId,
      clientId,
      connectorType: "WORDPRESS",
      siteUrl: "https://fake-wordpress.local",
      wordpressUsername: "bounded-author",
      isArchived: false
    },
    ownerRecipient: {
      userId: actorUserId,
      email: "owner@example.test"
    },
    ...overrides
  };
}

async function startHappy(options: Parameters<typeof createBoundedFakeWorkflowProviders>[0] = {}) {
  const memory = createBoundedMemoryWorkflowStore([fixture()]);
  const fake = createBoundedFakeWorkflowProviders(options);
  const run = await startBoundedContentToDraftWorkflow(
    { tenantId: "tenant-a", contentDraftId: "draft-a", actorUserId: "owner-a" },
    { store: memory.store, providers: fake.providers }
  );
  return { memory, fake, run };
}

describe("bounded AI Delivery content-to-draft workflow", () => {
  it("runs one fake image and private upload, pauses for approval, then creates one draft and owner email", async () => {
    const { memory, fake, run } = await startHappy();
    assert.equal(run.state, "WAITING_FOR_IMAGE_APPROVAL");
    assert.equal(run.imageRequestCount, 1);
    assert.equal(run.storageUploadCount, 1);
    assert.equal(fake.stats.imageRequests, 1);
    assert.equal(fake.stats.storageUploads, 1);
    assert.equal(memory.images.size, 1);
    const image = memory.images.get(run.articleImageId!)!;
    assert.equal(image.status, "PREVIEW_READY");
    assert.match(image.storageKey, /^tenants\/tenant-a\/ai-delivery\/draft-a\//);
    assert.equal(image.generation.outputCount, 1);
    assert.equal(image.generation.retryCount, 0);
    assert.equal(image.generation.fallbackUsed, false);

    memory.approveImage(run.id);
    const completed = await continueBoundedContentToDraftWorkflowAfterImageApproval(
      { tenantId: "tenant-a", workflowRunId: run.id },
      { store: memory.store, providers: fake.providers }
    );
    assert.equal(completed.state, "COMPLETED");
    assert.equal(completed.wordpressRequestCount, 1);
    assert.equal(completed.emailRequestCount, 1);
    assert.equal(fake.stats.wordpressCreates, 1);
    assert.equal(fake.stats.emailSends, 1);
    assert.deepEqual(fake.stats.emailRecipients, ["owner@example.test"]);
    assert.equal(memory.emailLogs.length, 1);
    assert.ok(completed.wordpressPostId);
    assert.ok(completed.emailProviderMessageId);
    assert.equal(completed.retryCount, 0);
    assert.equal(completed.fallbackUsed, false);
    assert.equal(WORDPRESS_LIVE_HTTP_FROZEN, true);

    const rerun = await continueBoundedContentToDraftWorkflowAfterImageApproval(
      { tenantId: "tenant-a", workflowRunId: run.id },
      { store: memory.store, providers: fake.providers }
    );
    assert.equal(rerun.state, "COMPLETED");
    assert.equal(fake.stats.wordpressCreates, 1);
    assert.equal(fake.stats.emailSends, 1);
  });

  it("deduplicates concurrent and repeated starts before any second external call", async () => {
    const memory = createBoundedMemoryWorkflowStore([fixture()]);
    const fake = createBoundedFakeWorkflowProviders();
    const input = { tenantId: "tenant-a", contentDraftId: "draft-a", actorUserId: "owner-a" };
    const [first, second] = await Promise.all([
      startBoundedContentToDraftWorkflow(input, { store: memory.store, providers: fake.providers }),
      startBoundedContentToDraftWorkflow(input, { store: memory.store, providers: fake.providers })
    ]);
    assert.equal(first.id, second.id);
    assert.equal(memory.runs.size, 1);
    assert.equal(fake.stats.imageRequests, 1);
    assert.equal(fake.stats.storageUploads, 1);

    await startBoundedContentToDraftWorkflow(input, { store: memory.store, providers: fake.providers });
    assert.equal(fake.stats.imageRequests, 1);
    assert.equal(fake.stats.storageUploads, 1);
  });

  it("deduplicates concurrent continuation with one WordPress create and one email", async () => {
    const { memory, fake, run } = await startHappy();
    memory.approveImage(run.id);
    await Promise.all([
      continueBoundedContentToDraftWorkflowAfterImageApproval(
        { tenantId: "tenant-a", workflowRunId: run.id },
        { store: memory.store, providers: fake.providers }
      ),
      continueBoundedContentToDraftWorkflowAfterImageApproval(
        { tenantId: "tenant-a", workflowRunId: run.id },
        { store: memory.store, providers: fake.providers }
      )
    ]);
    assert.equal(memory.runs.get(run.id)?.state, "COMPLETED");
    assert.equal(fake.stats.wordpressCreates, 1);
    assert.equal(fake.stats.emailSends, 1);
  });

  it("rejects cross-tenant starts and cross-client publication targets", async () => {
    const memory = createBoundedMemoryWorkflowStore([fixture()]);
    const fake = createBoundedFakeWorkflowProviders();
    await assert.rejects(
      startBoundedContentToDraftWorkflow(
        { tenantId: "tenant-b", contentDraftId: "draft-a", actorUserId: "owner-a" },
        { store: memory.store, providers: fake.providers }
      ),
      (error: unknown) => error instanceof BoundedWorkflowError && error.code === "not_found"
    );

    const mismatchFixture = fixture({
      publicationTarget: {
        ...fixture().publicationTarget,
        clientId: "client-b"
      }
    });
    const mismatchMemory = createBoundedMemoryWorkflowStore([mismatchFixture]);
    const mismatchFake = createBoundedFakeWorkflowProviders();
    const run = await startBoundedContentToDraftWorkflow(
      { tenantId: "tenant-a", contentDraftId: "draft-a", actorUserId: "owner-a" },
      { store: mismatchMemory.store, providers: mismatchFake.providers }
    );
    mismatchMemory.approveImage(run.id);
    await assert.rejects(
      continueBoundedContentToDraftWorkflowAfterImageApproval(
        { tenantId: "tenant-a", workflowRunId: run.id },
        { store: mismatchMemory.store, providers: mismatchFake.providers }
      ),
      (error: unknown) =>
        error instanceof BoundedWorkflowError && error.code === "publication_target_mismatch"
    );
    assert.equal(mismatchFake.stats.wordpressCreates, 0);
  });

  it("blocks continuation until the existing image approval status is APPROVED", async () => {
    const { memory, fake, run } = await startHappy();
    await assert.rejects(
      continueBoundedContentToDraftWorkflowAfterImageApproval(
        { tenantId: "tenant-a", workflowRunId: run.id },
        { store: memory.store, providers: fake.providers }
      ),
      (error: unknown) => error instanceof BoundedWorkflowError && error.code === "image_not_approved"
    );
    assert.equal(fake.stats.wordpressCreates, 0);
    assert.equal(fake.stats.emailSends, 0);
  });

  it("blocks archived content before continuation", async () => {
    const { memory, fake, run } = await startHappy();
    memory.approveImage(run.id);
    memory.archiveContent("draft-a");
    await assert.rejects(
      continueBoundedContentToDraftWorkflowAfterImageApproval(
        { tenantId: "tenant-a", workflowRunId: run.id },
        { store: memory.store, providers: fake.providers }
      ),
      (error: unknown) => error instanceof BoundedWorkflowError && error.code === "content_not_approved"
    );
    assert.equal(fake.stats.wordpressCreates, 0);
  });

  it("records image provider ambiguity and never retries", async () => {
    const { fake, run } = await startHappy({ image: { failSubmit: true } });
    assert.equal(run.state, "AMBIGUOUS_IMAGE");
    assert.equal(fake.stats.imageRequests, 1);
    assert.equal(fake.stats.storageUploads, 0);
  });

  it("records storage ambiguity after one image request and never regenerates", async () => {
    const { memory, fake, run } = await startHappy({ failStorage: true });
    assert.equal(run.state, "AMBIGUOUS_IMAGE");
    assert.equal(fake.stats.imageRequests, 1);
    assert.equal(fake.stats.storageUploads, 0);
    await startBoundedContentToDraftWorkflow(
      { tenantId: "tenant-a", contentDraftId: "draft-a", actorUserId: "owner-a" },
      { store: memory.store, providers: fake.providers }
    );
    assert.equal(fake.stats.imageRequests, 1);
  });

  it("records checksum verification ambiguity", async () => {
    const { run } = await startHappy({ corruptStorageChecksum: true });
    assert.equal(run.state, "AMBIGUOUS_IMAGE");
  });

  it("records ambiguity when image storage succeeds but preview persistence fails", async () => {
    const memory = createBoundedMemoryWorkflowStore([fixture()], {
      failImagePersistenceAfterStorage: true
    });
    const fake = createBoundedFakeWorkflowProviders();
    const run = await startBoundedContentToDraftWorkflow(
      { tenantId: "tenant-a", contentDraftId: "draft-a", actorUserId: "owner-a" },
      { store: memory.store, providers: fake.providers }
    );
    assert.equal(run.state, "AMBIGUOUS_IMAGE");
    assert.equal(fake.stats.imageRequests, 1);
    assert.equal(fake.stats.storageUploads, 1);
  });

  it("records WordPress ambiguity and sends no email", async () => {
    const { memory, fake, run } = await startHappy({ ambiguousWordPress: true });
    memory.approveImage(run.id);
    const result = await continueBoundedContentToDraftWorkflowAfterImageApproval(
      { tenantId: "tenant-a", workflowRunId: run.id },
      { store: memory.store, providers: fake.providers }
    );
    assert.equal(result.state, "AMBIGUOUS_WORDPRESS");
    assert.equal(fake.stats.wordpressCreates, 1);
    assert.equal(fake.stats.emailSends, 0);
  });

  it("records ambiguity when WordPress succeeds but workflow persistence fails", async () => {
    const memory = createBoundedMemoryWorkflowStore([fixture()], {
      failWordpressPersistenceAfterCreate: true
    });
    const fake = createBoundedFakeWorkflowProviders();
    const run = await startBoundedContentToDraftWorkflow(
      { tenantId: "tenant-a", contentDraftId: "draft-a", actorUserId: "owner-a" },
      { store: memory.store, providers: fake.providers }
    );
    memory.approveImage(run.id);
    const result = await continueBoundedContentToDraftWorkflowAfterImageApproval(
      { tenantId: "tenant-a", workflowRunId: run.id },
      { store: memory.store, providers: fake.providers }
    );
    assert.equal(result.state, "AMBIGUOUS_WORDPRESS");
    assert.equal(fake.stats.wordpressCreates, 1);
    assert.equal(fake.stats.emailSends, 0);
  });

  it("records ambiguous email acceptance and never resends", async () => {
    const { memory, fake, run } = await startHappy({ ambiguousEmail: true });
    memory.approveImage(run.id);
    const result = await continueBoundedContentToDraftWorkflowAfterImageApproval(
      { tenantId: "tenant-a", workflowRunId: run.id },
      { store: memory.store, providers: fake.providers }
    );
    assert.equal(result.state, "AMBIGUOUS_EMAIL");
    assert.equal(fake.stats.emailSends, 1);
    await continueBoundedContentToDraftWorkflowAfterImageApproval(
      { tenantId: "tenant-a", workflowRunId: run.id },
      { store: memory.store, providers: fake.providers }
    );
    assert.equal(fake.stats.emailSends, 1);
  });

  it("records ambiguity when provider accepted but EmailLog persistence fails", async () => {
    const memory = createBoundedMemoryWorkflowStore([fixture()], {
      failEmailPersistenceAfterAcceptance: true
    });
    const fake = createBoundedFakeWorkflowProviders();
    const run = await startBoundedContentToDraftWorkflow(
      { tenantId: "tenant-a", contentDraftId: "draft-a", actorUserId: "owner-a" },
      { store: memory.store, providers: fake.providers }
    );
    memory.approveImage(run.id);
    const result = await continueBoundedContentToDraftWorkflowAfterImageApproval(
      { tenantId: "tenant-a", workflowRunId: run.id },
      { store: memory.store, providers: fake.providers }
    );
    assert.equal(result.state, "AMBIGUOUS_EMAIL");
    assert.equal(fake.stats.emailSends, 1);
    assert.equal(memory.emailLogs.length, 0);
  });

  it("records provider rejection as BLOCKED without a resend", async () => {
    const { memory, fake, run } = await startHappy({ rejectEmail: true });
    memory.approveImage(run.id);
    const result = await continueBoundedContentToDraftWorkflowAfterImageApproval(
      { tenantId: "tenant-a", workflowRunId: run.id },
      { store: memory.store, providers: fake.providers }
    );
    assert.equal(result.state, "BLOCKED");
    assert.equal(fake.stats.emailSends, 1);
    assert.equal(memory.emailLogs.length, 0);
  });
});
