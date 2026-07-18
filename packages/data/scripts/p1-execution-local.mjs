import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

export const APPROVED_TENANT_ID = "76bdf4c6-8e60-4e62-aba3-5c0eb1b0027f";
export const OWNER_MEMBERSHIP_ID = "5605bc86-2f22-4925-9e3b-9e9931d86bbd";
export const CLIENT_MEMBERSHIP_IDS = Object.freeze(["2f80f01b-e084-4663-843e-aa21f222bdec", "4f24b13d-08a4-41a4-b1c3-57b0c1e59953", "5803359f-49ff-410f-9e89-8a3846aa0d7a", "6da0d8ef-71b0-4812-8787-1a578f478e48", "ba7fde39-d3aa-4d9a-99c2-8f317ebc55b5", "f4bd548c-c20e-4000-8367-a04f18687700"]);
export const EXPECTED_CLIENT_HASH = "6be8f2fdd4ad4b5e9b3a6b4a2753f5c4f0d8415a1e0c1259ce9b34052f7411de";
export const EXPECTED_ACCESS_HASH = "3f601f28d418b419313ac6f5aa65173a52d5c4a42bd0e94f09bfff80bc4aa05f";
export const EXECUTION_FLAGS = new Set(["--apply", "--approve", "--authorize", "--backfill", "--cleanup", "--reconcile", "--switch", "--write"]);

const hash = (ids) => createHash("sha256").update([...ids].sort().join("\n")).digest("hex");
const activeRoles = (membership) => membership.membershipRoles.filter(({ role }) => role.status === "ACTIVE").map(({ role }) => role.key).sort();

export function parseExecutionArgs(args) {
  const parsed = { command: "plan", execute: false, target: null, format: "summary" };
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (EXECUTION_FLAGS.has(value) || [...EXECUTION_FLAGS].some((flag) => value.startsWith(`${flag}=`))) throw new Error(`Unsupported execution flag ${value}. Use --execute only for the approved local command.`);
    if (value === "--execute") { parsed.execute = true; continue; }
    if (value === "--command") { parsed.command = args[++index] ?? ""; continue; }
    if (value === "--target") { parsed.target = args[++index] ?? ""; continue; }
    if (value === "--format") { parsed.format = args[++index] ?? ""; continue; }
    if (value === "--help") return { help: true };
    throw new Error(`Unsupported argument ${value}.`);
  }
  if (!["plan", "backfill", "reconcile"].includes(parsed.command)) throw new Error("--command must be plan, backfill, or reconcile.");
  if (!["source", "restore"].includes(parsed.target)) throw new Error("--target source|restore is required.");
  if (!["json", "summary"].includes(parsed.format)) throw new Error("--format must be json or summary.");
  if (parsed.command === "backfill" && !parsed.execute) throw new Error("backfill requires explicit --execute.");
  if (parsed.command !== "backfill" && parsed.execute) throw new Error("--execute is permitted only with --command backfill.");
  return parsed;
}

export function assertLocalTarget(databaseUrl, target) {
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const url = new URL(databaseUrl);
  const expectedPort = target === "source" ? "5434" : "5435";
  if (url.hostname !== "127.0.0.1" || url.port !== expectedPort) throw new Error(`Target mismatch: ${target} requires 127.0.0.1:${expectedPort}.`);
  return { host: url.hostname, port: url.port, target };
}

export async function inspectApprovedScope(prisma) {
  const [tenant, clients, memberships, access] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: APPROVED_TENANT_ID }, select: { id: true, name: true, slug: true, status: true } }),
    prisma.client.findMany({ where: { tenantId: APPROVED_TENANT_ID }, select: { id: true, isArchived: true }, orderBy: { id: "asc" } }),
    prisma.tenantMembership.findMany({ where: { tenantId: APPROVED_TENANT_ID }, select: { id: true, tenantId: true, userId: true, status: true, membershipRoles: { select: { role: { select: { key: true, status: true } } } } }, orderBy: { id: "asc" } }),
    prisma.clientUserAccess.findMany({ where: { tenantId: APPROVED_TENANT_ID }, select: { id: true, tenantId: true, userId: true, clientId: true, isArchived: true }, orderBy: { id: "asc" } })
  ]);
  const blockers = [];
  if (!tenant || tenant.status !== "ACTIVE" || !tenant.name || !tenant.slug) blockers.push("TENANT_IDENTITY_MISMATCH");
  const activeClients = clients.filter((item) => !item.isArchived);
  const activeAccess = access.filter((item) => !item.isArchived);
  if (activeClients.length !== 789 || hash(activeClients.map((item) => item.id)) !== EXPECTED_CLIENT_HASH) blockers.push("CLIENT_SCOPE_DRIFT");
  if (activeAccess.length !== 279 || hash(activeAccess.map((item) => item.id)) !== EXPECTED_ACCESS_HASH) blockers.push("CLIENT_ACCESS_SCOPE_DRIFT");
  const byId = new Map(memberships.map((item) => [item.id, item]));
  const approved = [[OWNER_MEMBERSHIP_ID, "owner"], ...CLIENT_MEMBERSHIP_IDS.map((id) => [id, "client"])];
  const userIds = new Set();
  for (const [id, expectedRole] of approved) {
    const item = byId.get(id); const roles = item ? activeRoles(item) : [];
    if (!item || item.status !== "ACTIVE" || item.tenantId !== APPROVED_TENANT_ID || roles.length !== 1 || roles[0] !== expectedRole || userIds.has(item.userId)) blockers.push(`MEMBERSHIP_MISMATCH:${id}`);
    if (item) userIds.add(item.userId);
  }
  const users = await prisma.user.findMany({ where: { id: { in: [...userIds] } }, select: { id: true } });
  if (users.length !== 7) blockers.push("APPROVED_USER_MISSING_OR_DUPLICATE");
  const noRole = memberships.filter((item) => item.status === "ACTIVE" && activeRoles(item).length === 0);
  if (memberships.filter((item) => item.status === "ACTIVE").length !== 12 || noRole.length !== 5) blockers.push("NO_ROLE_EXCEPTION_DRIFT");
  const clientUsers = new Set(CLIENT_MEMBERSHIP_IDS.map((id) => byId.get(id)?.userId));
  const ownerUser = byId.get(OWNER_MEMBERSHIP_ID)?.userId;
  if (activeAccess.filter((item) => clientUsers.has(item.userId)).length !== 35 || activeAccess.filter((item) => item.userId === ownerUser).length !== 244) blockers.push("CLIENT_ACCESS_DISTRIBUTION_DRIFT");
  const clientById = new Map(clients.map((item) => [item.id, item]));
  if (access.some((item) => !clientById.has(item.clientId) || clientById.get(item.clientId).tenantId !== item.tenantId)) blockers.push("CLIENT_ACCESS_ORPHAN_OR_CROSS_TENANT");
  return { tenant, memberships: byId, expectedMemberships: approved.map(([id, role]) => ({ tenantMembershipId: id, userId: byId.get(id)?.userId ?? null, role: role === "owner" ? "ADMIN" : "CLIENT_USER" })), noRoleMembershipIds: noRole.map((item) => item.id).sort(), counts: { activeClients: activeClients.length, activeClientUserAccess: activeAccess.length }, hashes: { clientIds: hash(activeClients.map((item) => item.id)), clientUserAccessIds: hash(activeAccess.map((item) => item.id)) }, blockers };
}

export async function createPlan(prisma) {
  const scope = await inspectApprovedScope(prisma);
  const workspace = await prisma.workspace.findUnique({ where: { legacyTenantId: APPROVED_TENANT_ID }, select: { id: true, legacyTenantId: true, name: true, slug: true } });
  if (workspace && (workspace.name !== scope.tenant?.name || workspace.slug !== scope.tenant?.slug)) scope.blockers.push("EXISTING_WORKSPACE_MAPPING_MISMATCH");
  return { mode: "LOCAL_EXECUTION_PLAN", dataMutation: false, tenantId: APPROVED_TENANT_ID, workspace: workspace ? { id: workspace.id, state: "EXISTING" } : { state: "CREATE_ON_EXECUTE" }, intendedMemberships: scope.expectedMemberships, excludedNoRoleMembershipIds: scope.noRoleMembershipIds, counts: scope.counts, hashes: scope.hashes, blockers: [...new Set(scope.blockers)].sort(), status: scope.blockers.length ? "BLOCKED" : "READY_TO_EXECUTE" };
}

export async function executeBackfill(prisma) {
  return prisma.$transaction(async (tx) => {
    const plan = await createPlan(tx);
    if (plan.blockers.length) throw new Error(`BACKFILL_ABORT:${plan.blockers.join(",")}`);
    const tenant = await tx.tenant.findUniqueOrThrow({ where: { id: APPROVED_TENANT_ID }, select: { name: true, slug: true } });
    const collision = await tx.workspace.findFirst({ where: { slug: tenant.slug, legacyTenantId: { not: APPROVED_TENANT_ID } }, select: { id: true } });
    if (collision) throw new Error("BACKFILL_ABORT:WORKSPACE_SLUG_COLLISION");
    const workspace = await tx.workspace.upsert({ where: { legacyTenantId: APPROVED_TENANT_ID }, create: { legacyTenantId: APPROVED_TENANT_ID, name: tenant.name, slug: tenant.slug }, update: {}, select: { id: true, name: true, slug: true, legacyTenantId: true } });
    if (workspace.name !== tenant.name || workspace.slug !== tenant.slug || workspace.legacyTenantId !== APPROVED_TENANT_ID) throw new Error("BACKFILL_ABORT:WORKSPACE_MAPPING_MISMATCH");
    for (const item of plan.intendedMemberships) {
      if (!item.userId) throw new Error("BACKFILL_ABORT:APPROVED_USER_MISSING");
      const membership = await tx.workspaceMembership.upsert({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: item.userId } }, create: { workspaceId: workspace.id, userId: item.userId, status: "ACTIVE" }, update: {}, select: { id: true } });
      await tx.workspaceMembershipRole.upsert({ where: { workspaceMembershipId_role: { workspaceMembershipId: membership.id, role: item.role } }, create: { workspaceMembershipId: membership.id, role: item.role }, update: {} });
    }
    return { ...plan, dataMutation: true, workspaceId: workspace.id, status: "BACKFILL_EXECUTED_LOCAL_ONLY" };
  });
}

export async function reconcile(prisma) {
  const plan = await createPlan(prisma);
  const workspace = await prisma.workspace.findUnique({ where: { legacyTenantId: APPROVED_TENANT_ID }, include: { memberships: { include: { roles: true } } } });
  const actual = workspace?.memberships ?? [];
  const roleCount = (role) => actual.filter((membership) => membership.status === "ACTIVE" && membership.roles.some((entry) => entry.role === role)).length;
  const exactMappings = plan.intendedMemberships.every((expected) => expected.userId && actual.some((item) => item.userId === expected.userId && item.status === "ACTIVE" && item.roles.length === 1 && item.roles[0].role === expected.role));
  const pass = plan.blockers.length === 0 && workspace?.name === (await prisma.tenant.findUniqueOrThrow({where:{id:APPROVED_TENANT_ID},select:{name:true}})).name && actual.length === 7 && exactMappings && roleCount("ADMIN") === 1 && roleCount("CLIENT_USER") === 6 && roleCount("WORKSPACE_MANAGER") === 0 && roleCount("TEAM_MEMBER") === 0 && roleCount("CLIENT_MANAGER") === 0;
  return { mode: "LOCAL_RECONCILIATION", dataMutation: false, reconciliationExecuted: true, workspaceId: workspace?.id ?? null, counts: { workspace: workspace ? 1 : 0, memberships: actual.length, admin: roleCount("ADMIN"), clientUser: roleCount("CLIENT_USER") }, excludedNoRoleMembershipIds: plan.excludedNoRoleMembershipIds, hashes: plan.hashes, status: pass ? "RECONCILIATION_PASSED" : "RECONCILIATION_FAILED", blockers: plan.blockers };
}

export async function runExecutionCli(args, env = process.env, io = { stdout: process.stdout, stderr: process.stderr }) {
  try {
    const options = parseExecutionArgs(args); if (options.help) { io.stdout.write("Usage: workspace:execution:local --target source|restore --command plan|backfill|reconcile [--execute] [--format json|summary]\n"); return 0; }
    assertLocalTarget(env.DATABASE_URL, options.target); const prisma = new PrismaClient();
    try { const result = options.command === "plan" ? await createPlan(prisma) : options.command === "backfill" ? await executeBackfill(prisma) : await reconcile(prisma); io.stdout.write(`${options.format === "json" ? JSON.stringify(result, null, 2) : `${result.status}; blockers=${result.blockers.length}`}\n`); return result.status.includes("FAILED") || result.status === "BLOCKED" ? 2 : 0; } finally { await prisma.$disconnect(); }
  } catch (error) { io.stderr.write(`P1 LOCAL EXECUTION ABORT: ${error.message}\n`); return 64; }
}

if (process.argv[1]?.endsWith("p1-execution-local.mjs")) process.exitCode = await runExecutionCli(process.argv.slice(2));
