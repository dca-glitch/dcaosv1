import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredPaths = [
  "apps/web/package.json",
  "apps/api/package.json",
  "packages/shared/package.json",
  "packages/data/package.json",
  "packages/data/prisma/schema.prisma"
];

const missing = requiredPaths.filter((relativePath) => {
  return !existsSync(path.join(root, relativePath));
});

if (missing.length > 0) {
  console.error("Workspace check failed. Missing paths:");
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));

if (!Array.isArray(packageJson.workspaces) || packageJson.workspaces.length < 2) {
  console.error("Workspace check failed. Root package.json must define npm workspaces.");
  process.exit(1);
}

console.log("Workspace check passed.");
