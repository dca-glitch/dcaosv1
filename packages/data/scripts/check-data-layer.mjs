import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "src/index.ts",
  "src/types/context.ts",
  "src/types/result.ts",
  "src/client/prisma.ts",
  "src/client/index.ts",
  "src/repositories/index.ts",
  "src/repositories/tenantRepository.ts",
  "src/repositories/userRepository.ts",
  "src/repositories/membershipRepository.ts",
  "src/repositories/roleRepository.ts",
  "src/repositories/permissionRepository.ts",
  "src/repositories/moduleRepository.ts",
  "src/repositories/settingRepository.ts",
  "src/repositories/auditLogRepository.ts",
  "src/audit/index.ts",
  "src/audit/auditService.ts"
];

const forbiddenTokens = ["TenantUser", "UserRole"];
const forbiddenImports = [
  "@dca-os-v1/api",
  "@dca-os-v1/web",
  "express",
  "../../../apps/",
  "../../apps/"
];

const missingFiles = requiredFiles.filter((relativePath) => {
  return !existsSync(path.join(root, relativePath));
});

if (missingFiles.length > 0) {
  console.error("Data layer check failed. Missing files:");
  for (const file of missingFiles) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

const scanRoots = ["src"];

const selfPath = path.join(root, "scripts", "check-data-layer.mjs");
const filesToScan = [];
for (const scanRoot of scanRoots) {
  const absRoot = path.join(root, scanRoot);
  if (!existsSync(absRoot)) {
    continue;
  }

  const stack = [absRoot];
  while (stack.length > 0) {
    const current = stack.pop();
      const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.isFile() && /\.(mjs|ts|prisma|json|md)$/.test(entry.name) && entryPath !== selfPath) {
        filesToScan.push(entryPath);
      }
    }
  }
}

for (const filePath of filesToScan) {
  const content = readFileSync(filePath, "utf8");
  for (const token of forbiddenTokens) {
    if (content.includes(token)) {
      console.error(`Data layer check failed. Forbidden token found in ${path.relative(root, filePath)}: ${token}`);
      process.exit(1);
    }
  }

  for (const token of forbiddenImports) {
    if (content.includes(token)) {
      console.error(`Data layer check failed. Forbidden import or path found in ${path.relative(root, filePath)}: ${token}`);
      process.exit(1);
    }
  }
}

console.log("Data layer structural check passed.");
