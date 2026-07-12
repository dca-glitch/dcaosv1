import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { runBoundedProofCli } from "./ai-delivery-bounded-proof.mjs";
import { createBoundedFakeWorkflowProviders } from "../apps/api/src/services/ai-delivery-bounded-workflow.fake-providers.ts";
import { createPrismaWordPressDraftLiveAttemptStore } from "../apps/api/src/services/wordpress-live-draft-attempt.store.ts";

if (process.env.BOUNDED_BRIDGE_SMOKE !== "true") {
  throw new Error("Bounded bridge smoke must run through its isolated database runner.");
}

const marker = "[SMOKE][AI_DELIVERY_BOUNDED_EXECUTION_BRIDGE]";
const prisma = new PrismaClient();
const manifestPath = path.join(os.tmpdir(), `dca-bounded-proof-${randomUUID()}.json`);

try {
  const tenant = await prisma.tenant.create({
    data: { name: "Bridge Smoke Tenant", slug: `bridge-smoke-${randomUUID()}`, status: "ACTIVE" }
  });
  const owner = await prisma.user.create({
    data: { email: `bridge-owner-${randomUUID()}@example.test`, name: "Bridge Owner", status: "ACTIVE" }
  });
  const role = await prisma.role.create({
    data: { tenantId: tenant.id, key: "owner", name: "Owner", status: "ACTIVE" }
  });
  const membership = await prisma.tenantMembership.create({
    data: { tenantId: tenant.id, userId: owner.id, status: "ACTIVE" }
  });
  await prisma.membershipRole.create({
    data: { tenantMembershipId: membership.id, roleId: role.id }
  });
  const client = await prisma.client.create({
    data: { tenantId: tenant.id, name: "Bridge Smoke Client" }
  });
  const target = await prisma.publicationTarget.create({
    data: {
      tenantId: tenant.id,
      clientId: client.id,
      label: "Bridge Smoke WordPress",
      connectorType: "WORDPRESS",
      siteUrl: "https://fake-wordpress.local",
      wordpressUsername: "bridge-smoke-author"
    }
  });
  const fake = createBoundedFakeWorkflowProviders({
    wordpressAttemptStore: createPrismaWordPressDraftLiveAttemptStore(prisma)
  });
  const output = [];
  const options = {
    prisma,
    providers: fake.providers,
    cleanupProviders: fake.cleanupProviders,
    testOnlyBypassStagingGuards: true,
    emit: (value) => output.push(value)
  };
  const manifestArgs = ["--manifest", manifestPath];

  await assert.rejects(
    runBoundedProofCli("cleanup-exact-ids", manifestArgs, options),
    /manifest is required/
  );
  await writeFile(manifestPath, "{\"schemaVersion\":\"bad\"}\n", "utf8");
  await assert.rejects(
    runBoundedProofCli("cleanup-exact-ids", manifestArgs, options),
    /manifest is malformed/
  );
  await rm(manifestPath, { force: true });
  console.log(`${marker} PASS cleanup refuses missing and malformed manifests`);

  const prepared = await runBoundedProofCli(
    "prepare-proof-data",
    [
      ...manifestArgs,
      "--tenant-id",
      tenant.id,
      "--client-id",
      client.id,
      "--publication-target-id",
      target.id,
      "--initiating-user-id",
      owner.id
    ],
    options
  );
  console.log(`${marker} PASS prepare-proof-data`);
  await assert.rejects(
    runBoundedProofCli(
      "prepare-proof-data",
      [
        ...manifestArgs,
        "--tenant-id",
        tenant.id,
        "--client-id",
        client.id,
        "--publication-target-id",
        target.id,
        "--initiating-user-id",
        owner.id,
        "--project-id",
        randomUUID()
      ],
      options
    ),
    /does not match supplied projectId/
  );
  console.log(`${marker} PASS prepare refuses existing-manifest ID overrides`);

  const started = await runBoundedProofCli("start", manifestArgs, options);
  assert.equal(started.state, "WAITING_FOR_IMAGE_APPROVAL");
  console.log(`${marker} PASS start`);

  const waiting = await runBoundedProofCli("inspect", manifestArgs, options);
  assert.equal(waiting.state, "WAITING_FOR_IMAGE_APPROVAL");
  assert.equal(waiting.retryCount, 0);
  assert.equal(waiting.fallbackUsed, false);
  console.log(`${marker} PASS inspect WAITING_FOR_IMAGE_APPROVAL`);

  await prisma.aiDeliveryArticleImage.update({
    where: { id: started.articleImageId },
    data: { status: "APPROVED" }
  });
  console.log(`${marker} PASS local test approval fixture`);

  const completed = await runBoundedProofCli(
    "continue-after-image-approval",
    manifestArgs,
    options
  );
  assert.equal(completed.state, "COMPLETED");
  console.log(`${marker} PASS continue-after-image-approval`);

  const finalInspection = await runBoundedProofCli("inspect", manifestArgs, options);
  assert.equal(finalInspection.state, "COMPLETED");
  console.log(`${marker} PASS inspect COMPLETED`);

  await prisma.aiDeliveryBoundedWorkflowRun.update({
    where: { id: finalInspection.workflowRunId },
    data: { retryCount: 1 }
  });
  await assert.rejects(
    runBoundedProofCli("start", manifestArgs, options),
    /retry\/fallback invariants/
  );
  await assert.rejects(
    runBoundedProofCli("continue-after-image-approval", manifestArgs, options),
    /retry\/fallback invariants/
  );
  await prisma.aiDeliveryBoundedWorkflowRun.update({
    where: { id: finalInspection.workflowRunId },
    data: { retryCount: 0 }
  });
  console.log(`${marker} PASS CLI enforces post-execution retry/fallback invariants`);

  await runBoundedProofCli("start", manifestArgs, options);
  await runBoundedProofCli("continue-after-image-approval", manifestArgs, options);
  assert.equal(fake.stats.imageRequests, 1);
  assert.equal(fake.stats.storageUploads, 1);
  assert.equal(fake.stats.wordpressCreates, 1);
  assert.equal(fake.stats.emailSends, 1);
  assert.deepEqual(fake.stats.emailRecipients, [owner.email.toLowerCase()]);
  console.log(`${marker} PASS duplicate start and continue are idempotent`);

  const cleanup = await runBoundedProofCli("cleanup-exact-ids", manifestArgs, options);
  assert.equal(cleanup.residualRows, 0);
  assert.equal(fake.stats.storageDeletes, 1);
  assert.equal(fake.stats.wordpressTrashes, 1);
  assert.equal(
    await prisma.aiDeliveryProject.count({ where: { id: prepared.projectId } }),
    0
  );
  assert.equal(
    await prisma.aiDeliveryContentDraft.count({ where: { id: prepared.contentDraftId } }),
    0
  );
  console.log(`${marker} PASS cleanup-exact-ids and zero residual proof rows`);
  console.log(`${marker} PASS LOCAL IMPLEMENTED / FAKE-PROVIDER AND REAL-PRISMA PROVEN`);
} finally {
  await rm(manifestPath, { force: true });
  await prisma.$disconnect();
}
