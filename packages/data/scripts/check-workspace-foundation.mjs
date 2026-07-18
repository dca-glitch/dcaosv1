import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = readFileSync(path.join(root, "prisma", "schema.prisma"), "utf8");
const migration = readFileSync(path.join(root, "prisma", "migrations", "20260717160000_add_workspace_foundation", "migration.sql"), "utf8");
const required = ["Workspace", "WorkspaceMembership", "WorkspaceMembershipRole"];
const roles = ["ADMIN", "WORKSPACE_MANAGER", "TEAM_MEMBER", "CLIENT_MANAGER", "CLIENT_USER"];

for (const model of required) {
  if (!new RegExp(`model\\s+${model}\\s+\\{`).test(schema)) throw new Error(`Missing ${model} model`);
}
for (const role of roles) {
  if (!new RegExp(`\\b${role}\\b`).test(schema)) throw new Error(`Missing canonical role ${role}`);
}
const workspaceModel = schema.match(/model Workspace\s+\{[\s\S]*?\n\}/)?.[0] ?? "";
if (/\btenantId\b|\bclientId\b/i.test(workspaceModel) || /legacyTenantId[^\n]*@relation/i.test(workspaceModel)) {
  throw new Error("Workspace foundation must not bind legacy Tenant or Client scope");
}
if (workspaceModel.includes("legacyTenantId") && !/legacyTenantId\s+String\?\s+@unique/.test(workspaceModel)) {
  throw new Error("Workspace legacyTenantId must remain nullable, unique, and FK-free.");
}
if (/UPDATE\s+"(?:Tenant|Client|User)"|DELETE\s+FROM|ALTER TABLE\s+"(?:Tenant|Client)"/i.test(migration)) {
  throw new Error("Workspace migration must remain expand-only");
}
console.log("Workspace foundation isolation check passed.");
