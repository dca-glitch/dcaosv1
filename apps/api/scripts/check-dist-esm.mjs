import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(apiRoot, "..", "..");
const distRoot = path.join(apiRoot, "dist");

const relativeImportPatterns = [
  {
    kind: "static import/export",
    regex: /\bfrom\s+["']([^"']+)["']/g
  },
  {
    kind: "side-effect import",
    regex: /\bimport\s+["']([^"']+)["']/g
  },
  {
    kind: "dynamic import",
    regex: /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  }
];

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

function isRelativeSpecifier(specifier) {
  return specifier.startsWith(".");
}

function hasSupportedExtension(specifier) {
  const strippedSpecifier = specifier.split(/[?#]/, 1)[0];
  return [".js", ".mjs", ".cjs", ".json"].includes(path.extname(strippedSpecifier));
}

function getLineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

function findRelativeSpecifierIssues(file) {
  const source = readFileSync(file, "utf8");
  const issues = [];

  for (const pattern of relativeImportPatterns) {
    pattern.regex.lastIndex = 0;
    for (let match = pattern.regex.exec(source); match; match = pattern.regex.exec(source)) {
      const specifier = match[1];
      if (!isRelativeSpecifier(specifier)) {
        continue;
      }

      if (hasSupportedExtension(specifier)) {
        continue;
      }

      issues.push({
        file,
        kind: pattern.kind,
        line: getLineNumber(source, match.index),
        specifier
      });
    }
  }

  return issues;
}

const issues = listJavaScriptFiles(distRoot).flatMap(findRelativeSpecifierIssues);

if (issues.length > 0) {
  console.error("API build guard failed: extensionless relative ESM specifiers remain in dist.");
  for (const issue of issues) {
    const relativeFile = path.relative(repoRoot, issue.file);
    console.error(`- ${relativeFile}:${issue.line} [${issue.kind}] ${issue.specifier}`);
  }
  process.exit(1);
}

console.log(`API dist ESM guard passed: ${path.relative(repoRoot, distRoot)}`);
