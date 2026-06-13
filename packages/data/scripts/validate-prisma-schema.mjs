import { readFileSync } from "node:fs";
import path from "node:path";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const schema = readFileSync(schemaPath, "utf8");
const schemaWithoutComments = schema.replace(/\/\/.*$/gm, "");

const requiredModels = [
  "User",
  "UserProfile",
  "Tenant",
  "TenantUser",
  "Session",
  "Role",
  "Permission",
  "UserRole",
  "RolePermission",
  "Module",
  "TenantModuleEntitlement",
  "SettingDefinition",
  "SettingValue",
  "AuditLog"
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

console.log("Prisma schema foundation check passed.");
