import { existsSync } from "node:fs";
import path from "node:path";

const packageKind = process.argv[2];
const cwd = process.cwd();

const checksByKind = {
  api: ["package.json", "src/app.ts", "src/server.ts", "src/routes/v1.ts"],
  web: ["package.json", "index.html", "src/App.tsx", "src/main.tsx"],
  shared: ["package.json", "src/index.ts"],
  data: ["package.json", "prisma/schema.prisma", "scripts/validate-prisma-schema.mjs"]
};

const checks = checksByKind[packageKind];

if (!checks) {
  console.error(`Unknown package check target: ${packageKind ?? "(missing)"}`);
  process.exit(1);
}

const missing = checks.filter((relativePath) => !existsSync(path.join(cwd, relativePath)));

if (missing.length > 0) {
  console.error(`${packageKind} package check failed. Missing paths:`);
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log(`${packageKind} package check passed.`);
