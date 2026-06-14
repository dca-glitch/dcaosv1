import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(apiRoot, "..", "..");
const distRoot = path.join(apiRoot, "dist");
const sharedEntry = path.join(distRoot, "packages", "shared", "src", "index.js");

function runTsc() {
  rmSync(distRoot, { recursive: true, force: true });

  const tscCommand = process.platform === "win32" ? "cmd.exe" : "npx";
  const tscArgs = process.platform === "win32"
    ? ["/d", "/s", "/c", "npx.cmd tsc -p tsconfig.json --pretty false"]
    : ["tsc", "-p", "tsconfig.json", "--pretty", "false"];
  const result = spawnSync(tscCommand, tscArgs, {
    cwd: apiRoot,
    stdio: "inherit",
    shell: false
  });

  if (result.error) {
    console.error(`API build failed to start TypeScript: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function listJavaScriptFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...listJavaScriptFiles(fullPath));
    } else if (entry.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

function toPosixRelativeImport(fromFile, toFile) {
  let relativePath = path.relative(path.dirname(fromFile), toFile).replaceAll(path.sep, "/");
  if (!relativePath.startsWith(".")) {
    relativePath = `./${relativePath}`;
  }

  return relativePath;
}

function resolveRelativeSpecifier(fromFile, specifier) {
  const absoluteTarget = path.resolve(path.dirname(fromFile), specifier);
  if (existsSync(`${absoluteTarget}.js`)) {
    return `${specifier}.js`;
  }

  const indexTarget = path.join(absoluteTarget, "index.js");
  if (existsSync(indexTarget)) {
    return `${specifier.replace(/\/$/, "")}/index.js`;
  }

  return specifier;
}

function rewriteSpecifier(fromFile, specifier) {
  if (specifier === "@dca-os-v1/shared") {
    return toPosixRelativeImport(fromFile, sharedEntry);
  }

  if (specifier.startsWith(".")) {
    return resolveRelativeSpecifier(fromFile, specifier);
  }

  return specifier;
}

function rewriteImports(file) {
  const source = readFileSync(file, "utf8");
  const rewritten = source
    .replaceAll(/(from\s+["'])([^"']+)(["'])/g, (_match, prefix, specifier, suffix) =>
      `${prefix}${rewriteSpecifier(file, specifier)}${suffix}`
    )
    .replaceAll(/(import\s+["'])([^"']+)(["'])/g, (_match, prefix, specifier, suffix) =>
      `${prefix}${rewriteSpecifier(file, specifier)}${suffix}`
    );

  if (rewritten !== source) {
    writeFileSync(file, rewritten);
  }
}

runTsc();

for (const file of listJavaScriptFiles(distRoot)) {
  rewriteImports(file);
}

const serverEntry = path.join(distRoot, "apps", "api", "src", "server.js");
if (!existsSync(serverEntry)) {
  console.error(`API build failed: missing ${path.relative(repoRoot, serverEntry)}`);
  process.exit(1);
}

console.log(`API build output ready: ${path.relative(repoRoot, serverEntry)}`);
