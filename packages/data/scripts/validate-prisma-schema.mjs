import { readFileSync } from "node:fs";
import path from "node:path";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const schema = readFileSync(schemaPath, "utf8");
const schemaWithoutComments = schema.replace(/\/\/.*$/gm, "");

const requiredModels = [
  "User",
  "Tenant",
  "TenantMembership",
  "Role",
  "Permission",
  "RolePermission",
  "MembershipRole",
  "ModuleDefinition",
  "TenantModule",
  "TenantSetting",
  "AuditLog"
];

const forbiddenModels = [
  "UserProfile",
  "TenantUser",
  "UserRole",
  "Module",
  "TenantModuleEntitlement",
  "SettingDefinition",
  "SettingValue"
];

const missing = requiredModels.filter((modelName) => {
  return !new RegExp(`model\\s+${modelName}\\s+\\{`).test(schema);
});

if (missing.length > 0) {
  console.error("Prisma schema validation failed. Missing models:");
  for (const modelName of missing) {
    console.error(`- ${modelName}`);
  }
  process.exit(1);
}

const disallowedPatterns = [
  /db\s+push/i,
  /migrate\s+dev/i,
  /prisma\s+generate/i
];

for (const pattern of disallowedPatterns) {
  if (pattern.test(schemaWithoutComments)) {
    console.error(`Prisma schema validation failed. Disallowed migration/generate wording found: ${pattern}`);
    process.exit(1);
  }
}

const forbidden = forbiddenModels.filter((modelName) => {
  return new RegExp(`model\\s+${modelName}\\s+\\{`).test(schema);
});

if (forbidden.length > 0) {
  console.error("Prisma schema validation failed. Forbidden legacy models found:");
  for (const modelName of forbidden) {
    console.error(`- ${modelName}`);
  }
  process.exit(1);
}

console.log("Prisma schema foundation check passed.");
