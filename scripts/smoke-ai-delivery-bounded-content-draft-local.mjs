import assert from "node:assert/strict";
import { WORDPRESS_LIVE_HTTP_FROZEN } from "../apps/api/src/services/wordpress.service.ts";
import { createBoundedFakeWorkflowProviders } from "../apps/api/src/services/ai-delivery-bounded-workflow.fake-providers.ts";
import { createBoundedMemoryWorkflowStore } from "../apps/api/src/core/ai-delivery-bounded-workflow.memory-store.ts";
import {
  continueBoundedContentToDraftWorkflowAfterImageApproval,
  startBoundedContentToDraftWorkflow
} from "../apps/api/src/core/ai-delivery-bounded-workflow.service.ts";

const marker = "[SMOKE][AI_DELIVERY_BOUNDED_CONTENT_DRAFT]";

const fixture = {
  tenantId: "smoke-tenant",
  actorUserId: "smoke-owner",
  aiDeliveryProjectId: "smoke-project",
  clientId: "smoke-client",
  contentDraftId: "smoke-draft",
  contentTitle: "Neutral bounded workflow proof",
  contentBody: "<p>Local fake-provider proof content.</p>",
  imagePrompt: "Neutral abstract editorial hero image with no people or claims.",
  contentApproved: true,
  contentArchived: false,
  projectArchived: false,
  publicationTargetId: "smoke-wordpress-target",
  publicationTarget: {
    id: "smoke-wordpress-target",
    tenantId: "smoke-tenant",
    clientId: "smoke-client",
    connectorType: "WORDPRESS",
    siteUrl: "https://fake-wordpress.local",
    wordpressUsername: "smoke-author",
    isArchived: false
  },
  ownerRecipient: {
    userId: "smoke-owner",
    email: "owner-smoke@example.test"
  }
};

console.log(`${marker} starting`);

const memory = createBoundedMemoryWorkflowStore([fixture]);
const fake = createBoundedFakeWorkflowProviders();
const input = {
  tenantId: fixture.tenantId,
  contentDraftId: fixture.contentDraftId,
  actorUserId: fixture.actorUserId
};

const [started, duplicateStart] = await Promise.all([
  startBoundedContentToDraftWorkflow(input, { store: memory.store, providers: fake.providers }),
  startBoundedContentToDraftWorkflow(input, { store: memory.store, providers: fake.providers })
]);

assert.equal(started.id, duplicateStart.id);
assert.equal(memory.runs.size, 1);
assert.equal(memory.runs.get(started.id)?.state, "WAITING_FOR_IMAGE_APPROVAL");
assert.equal(memory.images.size, 1);
assert.equal(fake.stats.imageRequests, 1);
assert.equal(fake.stats.storageUploads, 1);
assert.equal(fake.stats.storageKeys.length, 1);
assert.match(fake.stats.storageKeys[0], /^tenants\/smoke-tenant\/ai-delivery\/smoke-draft\//);
console.log(`${marker} PASS start is idempotent and pauses for image approval`);

memory.approveImage(started.id);
const [continued] = await Promise.all([
  continueBoundedContentToDraftWorkflowAfterImageApproval(
    { tenantId: fixture.tenantId, workflowRunId: started.id },
    { store: memory.store, providers: fake.providers }
  ),
  continueBoundedContentToDraftWorkflowAfterImageApproval(
    { tenantId: fixture.tenantId, workflowRunId: started.id },
    { store: memory.store, providers: fake.providers }
  )
]);

const completed = memory.runs.get(started.id);
assert.equal(continued.id, started.id);
assert.equal(completed?.state, "COMPLETED");
assert.equal(fake.stats.wordpressCreates, 1);
assert.equal(fake.stats.emailSends, 1);
assert.deepEqual(fake.stats.emailRecipients, [fixture.ownerRecipient.email]);
assert.equal(memory.emailLogs.length, 1);
assert.ok(completed?.wordpressPostId);
assert.ok(completed?.emailProviderMessageId);
assert.equal(completed?.retryCount, 0);
assert.equal(completed?.fallbackUsed, false);
assert.equal(WORDPRESS_LIVE_HTTP_FROZEN, true);
console.log(`${marker} PASS one draft-only create and one owner email complete the workflow`);

await continueBoundedContentToDraftWorkflowAfterImageApproval(
  { tenantId: fixture.tenantId, workflowRunId: started.id },
  { store: memory.store, providers: fake.providers }
);
assert.equal(fake.stats.imageRequests, 1);
assert.equal(fake.stats.storageUploads, 1);
assert.equal(fake.stats.wordpressCreates, 1);
assert.equal(fake.stats.emailSends, 1);
console.log(`${marker} PASS terminal rerun creates no external side effects`);
console.log(`${marker} PASS LOCAL IMPLEMENTED / FAKE-PROVIDER PROVEN`);
