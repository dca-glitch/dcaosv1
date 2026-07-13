/**
 * Staging-only operator CLI for the bounded AI Delivery workflow.
 * No public route. No env mutation. No approval command.
 */
import { randomUUID } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createPrismaClient } from "../packages/data/src/client/index.ts";
import {
  assertBoundedStagingDatabaseGuard,
  assertBoundedStagingLiveExecutionGuards,
  redactBoundedProofOwnerRecipientEmail,
  resolveBoundedProofOwnerRecipientOverride
} from "../apps/api/src/config/ai-delivery-bounded-execution.config.ts";
import {
  BOUNDED_PROOF_MANIFEST_VERSION,
  cleanupBoundedProofExactIds,
  continueBoundedProof,
  inspectBoundedProof,
  parseBoundedProofManifest,
  prepareBoundedProofData,
  startBoundedProof
} from "../apps/api/src/core/ai-delivery-bounded-execution-bridge.ts";
import {
  createBoundedLiveWorkflowProviders
} from "../apps/api/src/services/ai-delivery-bounded-workflow.live-providers.ts";

const modulePath = fileURLToPath(import.meta.url);
const isMain = Boolean(process.argv[1] && path.resolve(process.argv[1]) === path.resolve(modulePath));
const COMMANDS = new Set([
  "prepare-proof-data",
  "start",
  "inspect",
  "continue-after-image-approval",
  "cleanup-exact-ids"
]);

function parseFlags(args) {
  const flags = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (!key?.startsWith("--") || !value || value.startsWith("--")) {
      throw new Error("Every CLI option must be an explicit --name value pair.");
    }
    if (flags.has(key)) {
      throw new Error(`Duplicate CLI option refused: ${key}`);
    }
    flags.set(key, value);
  }
  return flags;
}

function requireFlag(flags, key) {
  const value = flags.get(key)?.trim();
  if (!value) {
    throw new Error(`${key} is required.`);
  }
  return value;
}

async function readManifest(manifestPath) {
  let raw;
  try {
    raw = await readFile(manifestPath, "utf8");
  } catch {
    throw new Error("Proof manifest is required and could not be read.");
  }
  try {
    return parseBoundedProofManifest(JSON.parse(raw));
  } catch (error) {
    throw new Error(
      `Proof manifest is malformed: ${error instanceof Error ? error.message : "invalid JSON"}`
    );
  }
}

async function writeManifest(manifestPath, manifest) {
  const parsed = parseBoundedProofManifest(manifest);
  const directory = path.dirname(manifestPath);
  const temporaryPath = path.join(directory, `.${path.basename(manifestPath)}.${randomUUID()}.tmp`);
  await writeFile(temporaryPath, `${JSON.stringify(parsed, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx"
  });
  await rename(temporaryPath, manifestPath);
}

function scopeFromManifest(manifest) {
  return {
    tenantId: manifest.tenantId,
    clientId: manifest.clientId,
    projectId: manifest.projectId,
    contentDraftId: manifest.contentDraftId,
    publicationTargetId: manifest.publicationTargetId,
    initiatingUserId: manifest.initiatingUserId
  };
}

async function assertLiveGuardsForManifest(prisma, manifest, env) {
  const target = await prisma.publicationTarget.findFirst({
    where: {
      id: manifest.publicationTargetId,
      tenantId: manifest.tenantId,
      clientId: manifest.clientId,
      connectorType: "WORDPRESS",
      isArchived: false
    },
    select: { siteUrl: true }
  });
  if (!target) {
    throw new Error("Exact WordPress publication target was not found.");
  }
  assertBoundedStagingLiveExecutionGuards({
    env,
    scope: scopeFromManifest(manifest),
    wordpressSiteUrl: target.siteUrl,
    retryCount: 0,
    fallbackUsed: false
  });
}

export async function runBoundedProofCli(command, args, options = {}) {
  if (!COMMANDS.has(command)) {
    throw new Error("Unknown bounded proof command.");
  }
  const flags = parseFlags(args);
  const manifestPath = path.resolve(requireFlag(flags, "--manifest"));
  const env = options.env ?? process.env;
  const prisma = options.prisma ?? createPrismaClient();
  const ownsPrisma = !options.prisma;
  const emit = options.emit ?? ((value) => console.log(JSON.stringify(value)));
  const bypass = options.testOnlyBypassStagingGuards === true;
  if (bypass && (!options.prisma || !options.providers || !options.cleanupProviders)) {
    throw new Error("Test-only guard bypass requires injected Prisma and all fake providers.");
  }

  try {
    if (!bypass) {
      assertBoundedStagingDatabaseGuard(env);
    }

    if (command === "prepare-proof-data") {
      const existing = await readFile(manifestPath, "utf8")
        .then((raw) => parseBoundedProofManifest(JSON.parse(raw)))
        .catch((error) => {
          if (error?.code === "ENOENT") {
            return null;
          }
          throw new Error("Existing proof manifest is malformed.");
        });
      const supplied = {
        tenantId: requireFlag(flags, "--tenant-id"),
        clientId: requireFlag(flags, "--client-id"),
        publicationTargetId: requireFlag(flags, "--publication-target-id"),
        initiatingUserId: requireFlag(flags, "--initiating-user-id")
      };
      const manifest = existing ?? {
        schemaVersion: BOUNDED_PROOF_MANIFEST_VERSION,
        proofCorrelationId: flags.get("--proof-correlation-id")?.trim() || randomUUID(),
        ...supplied,
        projectId: flags.get("--project-id")?.trim() || randomUUID(),
        contentDraftId: flags.get("--content-draft-id")?.trim() || randomUUID(),
        workflowRunId: null,
        articleImageId: null,
        wordpressAttemptId: null,
        emailLogId: null,
        wordpressPostId: null,
        storageKey: null,
        wordpressIdempotencyKey: null
      };
      for (const [key, value] of Object.entries(supplied)) {
        if (manifest[key] !== value) {
          throw new Error(`Existing proof manifest does not match supplied ${key}.`);
        }
      }
      for (const [flag, key] of [
        ["--project-id", "projectId"],
        ["--content-draft-id", "contentDraftId"],
        ["--proof-correlation-id", "proofCorrelationId"]
      ]) {
        const value = flags.get(flag)?.trim();
        if (value && manifest[key] !== value) {
          throw new Error(`Existing proof manifest does not match supplied ${key}.`);
        }
      }
      const prepared = await prepareBoundedProofData(manifest, prisma);
      await writeManifest(manifestPath, prepared);
      emit({ ok: true, command, manifest: prepared });
      return prepared;
    }

    let manifest = await readManifest(manifestPath);
    let liveProviders = null;
    if (command === "start" || command === "continue-after-image-approval" || command === "cleanup-exact-ids") {
      if (!bypass) {
        await assertLiveGuardsForManifest(prisma, manifest, env);
      }
      liveProviders = options.providers && options.cleanupProviders
        ? { providers: options.providers, cleanupProviders: options.cleanupProviders }
        : createBoundedLiveWorkflowProviders(prisma, { env });
    }

    if (command === "start") {
      manifest = await startBoundedProof(manifest, {
        prisma,
        providers: liveProviders.providers
      });
      await writeManifest(manifestPath, manifest);
      const inspection = await inspectBoundedProof(manifest, prisma);
      if (inspection.retryCount !== 0 || inspection.fallbackUsed) {
        throw new Error("Bounded execution violated retry/fallback invariants.");
      }
      emit({ ok: true, command, ...inspection });
      return inspection;
    }
    if (command === "inspect") {
      const inspection = await inspectBoundedProof(manifest, prisma);
      if (inspection.retryCount !== 0 || inspection.fallbackUsed) {
        throw new Error("Bounded execution violated retry/fallback invariants.");
      }
      emit({ ok: true, command, ...inspection });
      return inspection;
    }
    if (command === "continue-after-image-approval") {
      const ownerRecipientEmailOverride = resolveBoundedProofOwnerRecipientOverride({
        cliValue: flags.get("--owner-recipient-email"),
        env
      });
      if (!ownerRecipientEmailOverride) {
        throw new Error(
          "continue-after-image-approval requires --owner-recipient-email <address> or DCA_AI_DELIVERY_BOUNDED_PROOF_OWNER_RECIPIENT_EMAIL."
        );
      }
      manifest = await continueBoundedProof(manifest, {
        prisma,
        providers: liveProviders.providers,
        ownerRecipientEmailOverride
      });
      await writeManifest(manifestPath, manifest);
      const inspection = await inspectBoundedProof(manifest, prisma);
      if (inspection.retryCount !== 0 || inspection.fallbackUsed) {
        throw new Error("Bounded execution violated retry/fallback invariants.");
      }
      emit({
        ok: true,
        command,
        ownerRecipientEmailRedacted: redactBoundedProofOwnerRecipientEmail(ownerRecipientEmailOverride),
        ...inspection
      });
      return inspection;
    }

    const cleanup = await cleanupBoundedProofExactIds(manifest, {
      prisma,
      cleanupProviders: liveProviders.cleanupProviders
    });
    emit({ ok: true, command, ...cleanup });
    return cleanup;
  } finally {
    if (ownsPrisma) {
      await prisma.$disconnect();
    }
  }
}

if (isMain) {
  const [command, ...args] = process.argv.slice(2);
  runBoundedProofCli(command, args).catch((error) => {
    const safeMessage = (error instanceof Error ? error.message : "Bounded proof command failed.")
      .replace(/Basic\s+[A-Za-z0-9+/=]+/gi, "Basic [REDACTED]")
      .replace(/(password|secret|token|api[_-]?key)\s*[=:]\s*\S+/gi, "$1=[REDACTED]")
      .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, "[REDACTED_EMAIL]");
    console.error(JSON.stringify({ ok: false, safeError: safeMessage }));
    process.exitCode = 1;
  });
}
