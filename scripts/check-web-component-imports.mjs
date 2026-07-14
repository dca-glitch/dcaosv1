/**
 * DCA OS Lite — Wave 0 component import architecture guard.
 *
 * Canonical public API: apps/web/src/components/ui/index.ts
 * Private foundation: apps/web/src/design-system
 * Existing violations are frozen in scripts/baselines/web-component-import-allowlist.json
 *
 * Modes:
 *   (default)                 compare scan vs baseline; exit 0 on PASS
 *   --print-current-violations  print JSON candidates (does not write baseline)
 *   --self-test                 run pure/temp fixture proofs; exit non-zero on failure
 */

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const DEFAULT_SRC_ROOT = path.join(REPO_ROOT, "apps", "web", "src");
const DEFAULT_BASELINE = path.join(
  REPO_ROOT,
  "scripts",
  "baselines",
  "web-component-import-allowlist.json"
);

const LEGACY_ROOT_FILES = new Set([
  // Removed after Modal Wave — recreating this path and importing it remains forbidden.
  "apps/web/src/components/Modal.tsx"
]);

const DOMAIN_PREFIXES = [
  "apps/web/src/components/shell/",
  "apps/web/src/components/admin/",
  "apps/web/src/components/auth/",
  "apps/web/src/components/clients/",
  "apps/web/src/components/permissions/",
  "apps/web/src/components/tenant/"
];

const DOMAIN_FILES = new Set([
  "apps/web/src/components/AppLayout.tsx",
  "apps/web/src/components/DashboardCard.tsx"
]);

const UI_INDEX = "apps/web/src/components/ui/index.ts";
const UI_DIR_PREFIX = "apps/web/src/components/ui/";
const DS_COMPONENTS_PREFIX = "apps/web/src/design-system/components/";
const DS_INDEX = "apps/web/src/design-system/index.ts";
const DS_STATUS = "apps/web/src/design-system/status.ts";
const DS_LAYOUT_FILES = new Set([
  "apps/web/src/design-system/components/Layout.tsx"
]);

const RULES = {
  LEGACY: "legacy-root-component",
  UI_DEEP: "ui-deep-import",
  DS_DEEP: "ds-deep-component",
  DS_LAYOUT: "ds-layout",
  DS_BARREL: "ds-barrel",
  DS_STATUS: "ds-status-registry"
};

const REPLACEMENT = {
  [RULES.LEGACY]:
    "Import from components/ui instead.\nExisting legacy use is frozen; new use is prohibited.",
  [RULES.UI_DEEP]:
    "Import from the components/ui barrel (index.ts) instead of deep files.\nExisting deep use is frozen; new use is prohibited.",
  [RULES.DS_DEEP]:
    "Expose the primitive through components/ui. Do not import design-system/components/** from app code.\nExisting use is frozen; new use is prohibited.",
  [RULES.DS_LAYOUT]:
    "Do not import design-system Layout/AppShell into product app code. Use components/shell / AppLayout.\nExisting use is frozen; new use is prohibited.",
  [RULES.DS_BARREL]:
    "Expose the primitive through components/ui instead of importing the design-system barrel from app code.\nExisting use is frozen; new use is prohibited.",
  [RULES.DS_STATUS]:
    "Import status helpers (normalizeStatusKey, STATUS, StatusBadge, ClientStatusBadge, …) from components/ui.\nDo not import design-system/status from page/domain code.\nAdapters under components/ui and design-system internals remain allowed."
};

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function repoRel(absPath, repoRoot = REPO_ROOT) {
  return toPosix(path.relative(repoRoot, absPath));
}

function stripComments(source) {
  let out = source.replace(/\/\*[\s\S]*?\*\//g, (block) => " ".repeat(block.length));
  out = out.replace(/(^|[^:])\/\/.*$/gm, (line) => {
    const idx = line.indexOf("//");
    if (idx === -1) return line;
    return line.slice(0, idx) + " ".repeat(line.length - idx);
  });
  return out;
}

function extractSpecifiers(source) {
  const text = stripComments(source);
  const specs = [];
  const fromRe = /\b(?:import|export)\s+(?:type\s+)?[\s\S]*?\bfrom\s*['"]([^'"]+)['"]/g;
  const sideRe = /\bimport\s*['"]([^'"]+)['"]/g;
  const dynRe = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const re of [fromRe, sideRe, dynRe]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      specs.push(m[1]);
    }
  }
  return specs;
}

function listSourceFiles(srcRoot) {
  const out = [];
  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (
          ent.name === "node_modules" ||
          ent.name === "dist" ||
          ent.name === "coverage" ||
          ent.name === "generated"
        ) {
          continue;
        }
        walk(full);
        continue;
      }
      if (!ent.isFile()) continue;
      if (ent.name.endsWith(".d.ts")) continue;
      if (!(ent.name.endsWith(".ts") || ent.name.endsWith(".tsx"))) continue;
      out.push(full);
    }
  }
  walk(srcRoot);
  return out;
}

function tryFile(candidate) {
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  return null;
}

/**
 * Resolve a relative specifier to an absolute file path under src, or null.
 * Throws on ambiguous resolution (.ts and .tsx both exist).
 */
function resolveSpecifier(importerAbs, specifier, repoRoot = REPO_ROOT) {
  if (!specifier.startsWith(".")) {
    return { kind: "external", abs: null, rel: null };
  }

  const importerDir = path.dirname(importerAbs);
  const joined = path.normalize(path.join(importerDir, specifier));

  const assetExts = [".css", ".scss", ".sass", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".json"];
  for (const ext of assetExts) {
    if (joined.toLowerCase().endsWith(ext)) {
      const hit = tryFile(joined);
      if (hit) return { kind: "asset", abs: hit, rel: repoRel(hit, repoRoot) };
      return { kind: "unresolved", abs: null, rel: null, reason: `missing asset ${specifier}` };
    }
  }

  const direct = tryFile(joined);
  if (direct) return { kind: "file", abs: direct, rel: repoRel(direct, repoRoot) };

  const tsHits = [".ts", ".tsx"]
    .map((ext) => tryFile(joined + ext))
    .filter(Boolean);
  if (tsHits.length > 1) {
    const err = new Error(
      `Ambiguous resolution for ${specifier} from ${repoRel(importerAbs, repoRoot)}: ${tsHits
        .map((h) => repoRel(h, repoRoot))
        .join(", ")}`
    );
    err.code = "AMBIGUOUS";
    throw err;
  }
  if (tsHits.length === 1) {
    return { kind: "file", abs: tsHits[0], rel: repoRel(tsHits[0], repoRoot) };
  }

  if (existsSync(joined) && statSync(joined).isDirectory()) {
    const indexHits = ["index.ts", "index.tsx"]
      .map((name) => tryFile(path.join(joined, name)))
      .filter(Boolean);
    if (indexHits.length > 1) {
      const err = new Error(
        `Ambiguous index resolution for ${specifier} from ${repoRel(importerAbs, repoRoot)}`
      );
      err.code = "AMBIGUOUS";
      throw err;
    }
    if (indexHits.length === 1) {
      return { kind: "file", abs: indexHits[0], rel: repoRel(indexHits[0], repoRoot) };
    }
  }

  return {
    kind: "unresolved",
    abs: null,
    rel: null,
    reason: `cannot resolve ${specifier} from ${repoRel(importerAbs, repoRoot)}`
  };
}

function isUnderUi(importerRel) {
  return importerRel === UI_INDEX || importerRel.startsWith(UI_DIR_PREFIX);
}

function isUnderDesignSystem(importerRel) {
  return importerRel.startsWith("apps/web/src/design-system/");
}

function isDomainTarget(targetRel) {
  if (DOMAIN_FILES.has(targetRel)) return true;
  return DOMAIN_PREFIXES.some((p) => targetRel.startsWith(p));
}

function classifyImport(importerRel, specifier, targetRel) {
  if (!targetRel) return null;

  // Adapters and DS internals are privileged / self-contained.
  if (isUnderUi(importerRel) || isUnderDesignSystem(importerRel)) {
    return null;
  }

  // Importing domain/shell targets is never a primitive-system violation.
  if (isDomainTarget(targetRel)) {
    return null;
  }

  if (LEGACY_ROOT_FILES.has(targetRel)) {
    return RULES.LEGACY;
  }

  if (targetRel === UI_INDEX) {
    return null; // canonical barrel
  }

  if (targetRel.startsWith(UI_DIR_PREFIX)) {
    return RULES.UI_DEEP;
  }

  if (DS_LAYOUT_FILES.has(targetRel)) {
    return RULES.DS_LAYOUT;
  }

  if (targetRel.startsWith(DS_COMPONENTS_PREFIX)) {
    return RULES.DS_DEEP;
  }

  if (targetRel === DS_INDEX) {
    return RULES.DS_BARREL;
  }

  if (targetRel === DS_STATUS) {
    return RULES.DS_STATUS;
  }

  // design-system/panel, useOverlayA11y, showcase, tokens: allowed for now
  return null;
}

function violationKey(entry) {
  return `${entry.importer}||${entry.specifier}||${entry.resolvedTarget}||${entry.rule}`;
}

function scanViolations({ srcRoot, repoRoot }) {
  const files = listSourceFiles(srcRoot);
  const violations = [];
  const unresolved = [];

  for (const abs of files) {
    const importerRel = repoRel(abs, repoRoot);
    let source;
    try {
      source = readFileSync(abs, "utf8");
    } catch (err) {
      throw new Error(`Cannot read ${importerRel}: ${err.message}`);
    }

    const specs = extractSpecifiers(source);
    const seenInFile = new Set();

    for (const specifier of specs) {
      let resolved;
      try {
        resolved = resolveSpecifier(abs, specifier, repoRoot);
      } catch (err) {
        if (err.code === "AMBIGUOUS") throw err;
        throw err;
      }

      if (resolved.kind === "external" || resolved.kind === "asset") continue;

      if (resolved.kind === "unresolved") {
        // Only track unresolved relative imports that look architecture-related.
        if (
          /components\/(ui|Modal|EmptyState|ErrorState|LoadingState|StatusNotice)|design-system/.test(
            specifier
          )
        ) {
          unresolved.push({
            importer: importerRel,
            specifier,
            reason: resolved.reason
          });
        }
        continue;
      }

      const rule = classifyImport(importerRel, specifier, resolved.rel);
      if (!rule) continue;

      const entry = {
        importer: importerRel,
        specifier,
        resolvedTarget: resolved.rel,
        rule
      };
      const key = violationKey(entry);
      if (seenInFile.has(key)) continue;
      seenInFile.add(key);
      violations.push(entry);
    }
  }

  violations.sort((a, b) => violationKey(a).localeCompare(violationKey(b)));
  return { violations, unresolved };
}

function loadBaseline(baselinePath) {
  if (!existsSync(baselinePath)) {
    const err = new Error(`Baseline missing: ${baselinePath}`);
    err.code = "BASELINE_MISSING";
    throw err;
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(baselinePath, "utf8"));
  } catch (err) {
    const e = new Error(`Malformed baseline JSON: ${err.message}`);
    e.code = "BASELINE_MALFORMED";
    throw e;
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    const e = new Error("Malformed baseline: root must be an object");
    e.code = "BASELINE_MALFORMED";
    throw e;
  }
  if (raw.version !== 1) {
    const e = new Error(`Malformed baseline: unsupported version ${String(raw.version)}`);
    e.code = "BASELINE_MALFORMED";
    throw e;
  }
  if (!Array.isArray(raw.entries)) {
    const e = new Error("Malformed baseline: entries must be an array");
    e.code = "BASELINE_MALFORMED";
    throw e;
  }

  const required = ["importer", "specifier", "resolvedTarget", "rule"];
  const keys = new Set();
  const entries = [];

  for (let i = 0; i < raw.entries.length; i++) {
    const ent = raw.entries[i];
    if (!ent || typeof ent !== "object" || Array.isArray(ent)) {
      const e = new Error(`Malformed baseline entry at index ${i}`);
      e.code = "BASELINE_MALFORMED";
      throw e;
    }
    for (const field of required) {
      if (typeof ent[field] !== "string" || ent[field].length === 0) {
        const e = new Error(`Malformed baseline entry at index ${i}: missing ${field}`);
        e.code = "BASELINE_MALFORMED";
        throw e;
      }
    }
    if (!Object.values(RULES).includes(ent.rule)) {
      const e = new Error(`Malformed baseline entry at index ${i}: unknown rule ${ent.rule}`);
      e.code = "BASELINE_MALFORMED";
      throw e;
    }
    // Canonical imports must never appear in the allowlist.
    if (ent.resolvedTarget === UI_INDEX && ent.rule !== RULES.UI_DEEP) {
      const e = new Error(
        `Malformed baseline entry at index ${i}: canonical ui barrel must not be allowlisted`
      );
      e.code = "BASELINE_MALFORMED";
      throw e;
    }
    if (ent.resolvedTarget === UI_INDEX) {
      const e = new Error(
        `Malformed baseline entry at index ${i}: resolvedTarget must not be the canonical ui barrel`
      );
      e.code = "BASELINE_MALFORMED";
      throw e;
    }

    const key = violationKey(ent);
    if (keys.has(key)) {
      const e = new Error(`Duplicate baseline entry: ${key}`);
      e.code = "BASELINE_DUPLICATE";
      throw e;
    }
    keys.add(key);
    entries.push({
      importer: ent.importer,
      specifier: ent.specifier,
      resolvedTarget: ent.resolvedTarget,
      rule: ent.rule
    });
  }

  return { version: 1, entries };
}

function compareToBaseline(violations, baselineEntries) {
  const currentMap = new Map(violations.map((v) => [violationKey(v), v]));
  const baselineMap = new Map(baselineEntries.map((v) => [violationKey(v), v]));

  const newViolations = [];
  for (const [key, v] of currentMap) {
    if (!baselineMap.has(key)) newViolations.push(v);
  }

  const stale = [];
  for (const [key, v] of baselineMap) {
    if (!currentMap.has(key)) stale.push(v);
  }

  return { newViolations, stale, matched: baselineEntries.length - stale.length };
}

function printFailure(v) {
  const lines = [
    "[COMPONENT_IMPORT_GUARD] FAIL",
    "",
    `Rule: ${v.rule}`,
    `Importer: ${v.importer}`,
    `Import: ${v.specifier}`,
    `Resolved: ${v.resolvedTarget}`,
    "Canonical replacement: components/ui",
    "",
    REPLACEMENT[v.rule] || "New prohibited imports are blocked.",
    "Do not update the baseline unless explicitly approved by the owner."
  ];
  console.error(lines.join("\n"));
}

function countByRule(entries) {
  const counts = {};
  for (const rule of Object.values(RULES)) counts[rule] = 0;
  for (const e of entries) counts[e.rule] = (counts[e.rule] || 0) + 1;
  return counts;
}

function runCheck({ srcRoot, repoRoot, baselinePath, printOnly = false }) {
  const { violations, unresolved } = scanViolations({ srcRoot, repoRoot });

  if (unresolved.length > 0) {
    console.error("[COMPONENT_IMPORT_GUARD] FAIL");
    console.error("Unresolved architecture-related relative imports:");
    for (const u of unresolved) {
      console.error(`- ${u.importer} -> ${u.specifier} (${u.reason})`);
    }
    return { ok: false, code: 1, violations, unresolved };
  }

  if (printOnly) {
    const payload = {
      version: 1,
      generatedNote:
        "Candidates only. Do not write automatically during validate. Owner-approved baseline required.",
      entries: violations
    };
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return { ok: true, code: 0, violations, unresolved };
  }

  let baseline;
  try {
    baseline = loadBaseline(baselinePath);
  } catch (err) {
    console.error("[COMPONENT_IMPORT_GUARD] FAIL");
    console.error(err.message);
    return { ok: false, code: 1, violations, unresolved, error: err };
  }

  const { newViolations, stale, matched } = compareToBaseline(violations, baseline.entries);

  if (newViolations.length > 0) {
    printFailure(newViolations[0]);
    if (newViolations.length > 1) {
      console.error(`\n… and ${newViolations.length - 1} additional new violation(s).`);
    }
    return { ok: false, code: 1, violations, newViolations, stale, matched };
  }

  if (stale.length > 0) {
    console.error("[COMPONENT_IMPORT_GUARD] FAIL");
    console.error("Stale baseline entries (no longer present as violations):");
    for (const s of stale) {
      console.error(
        `- ${s.importer} | ${s.specifier} | ${s.resolvedTarget} | ${s.rule}`
      );
    }
    console.error(
      "Baseline may only shrink via owner-approved removal after the violation is gone."
    );
    return { ok: false, code: 1, violations, newViolations, stale, matched };
  }

  console.log("[COMPONENT_IMPORT_GUARD] PASS");
  console.log("Canonical public system: apps/web/src/components/ui");
  console.log(`Existing baseline violations: ${baseline.entries.length}`);
  console.log("New violations: 0");
  console.log("Stale baseline entries: 0");
  const counts = countByRule(baseline.entries);
  console.log(
    `By rule: legacy=${counts[RULES.LEGACY]} ui-deep=${counts[RULES.UI_DEEP]} ds-deep=${counts[RULES.DS_DEEP]} ds-barrel=${counts[RULES.DS_BARREL]} ds-layout=${counts[RULES.DS_LAYOUT]} ds-status=${counts[RULES.DS_STATUS]}`
  );

  return {
    ok: true,
    code: 0,
    violations,
    newViolations,
    stale,
    matched,
    baselineCount: baseline.entries.length,
    counts
  };
}

function writeTempTree(files) {
  const root = mkdtempSync(path.join(tmpdir(), "dca-comp-guard-"));
  const srcRoot = path.join(root, "apps", "web", "src");
  for (const [rel, contents] of Object.entries(files)) {
    const abs = path.join(root, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, contents, "utf8");
  }
  return { root, srcRoot };
}

function assert(condition, message) {
  if (!condition) {
    const err = new Error(message);
    err.code = "SELF_TEST";
    throw err;
  }
}

function runSelfTests() {
  const results = [];

  function record(name, fn) {
    try {
      fn();
      results.push({ name, ok: true });
      console.log(`PASS  ${name}`);
    } catch (err) {
      results.push({ name, ok: false, error: err.message });
      console.error(`FAIL  ${name}: ${err.message}`);
    }
  }

  // 1) Current repo + baseline → PASS (if baseline exists)
  record("1 current repo + baseline → PASS", () => {
    if (!existsSync(DEFAULT_BASELINE)) {
      throw new Error("Baseline file not found; generate it before self-test case 1");
    }
    const result = runCheck({
      srcRoot: DEFAULT_SRC_ROOT,
      repoRoot: REPO_ROOT,
      baselinePath: DEFAULT_BASELINE,
      printOnly: false
    });
    // Suppress duplicate PASS noise already printed — still assert.
    assert(result.ok === true, "expected PASS on current repo");
  });

  // Shared fixture helpers
  const uiIndex = `export {};\n`;
  const dsButton = `export default function Button(){return null}\n`;
  const dsIndex = `export { default as Button } from "./components/Button";\n`;
  const legacyModal = `export function Modal(){return null}\n`;
  const domainShell = `export function Shell(){return null}\n`;

  record("2 simulated new components/Modal import → FAIL", () => {
    const { root, srcRoot } = writeTempTree({
      "apps/web/src/components/ui/index.ts": uiIndex,
      "apps/web/src/components/Modal.tsx": legacyModal,
      "apps/web/src/pages/NewPage.tsx": `import { Modal } from "../components/Modal";\n`
    });
    try {
      const baselinePath = path.join(root, "baseline.json");
      writeFileSync(
        baselinePath,
        JSON.stringify({ version: 1, entries: [] }, null, 2),
        "utf8"
      );
      const result = runCheck({
        srcRoot,
        repoRoot: root,
        baselinePath,
        printOnly: false
      });
      assert(result.ok === false, "expected FAIL");
      assert(
        result.newViolations?.some((v) => v.rule === RULES.LEGACY),
        "expected legacy-root-component"
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  record("3 simulated new deep components/ui/Button import → FAIL", () => {
    const { root, srcRoot } = writeTempTree({
      "apps/web/src/components/ui/index.ts": uiIndex,
      "apps/web/src/components/ui/Button.tsx": `export function Button(){return null}\n`,
      "apps/web/src/pages/NewPage.tsx": `import { Button } from "../components/ui/Button";\n`
    });
    try {
      const baselinePath = path.join(root, "baseline.json");
      writeFileSync(
        baselinePath,
        JSON.stringify({ version: 1, entries: [] }, null, 2),
        "utf8"
      );
      const result = runCheck({
        srcRoot,
        repoRoot: root,
        baselinePath,
        printOnly: false
      });
      assert(result.ok === false, "expected FAIL");
      assert(
        result.newViolations?.some((v) => v.rule === RULES.UI_DEEP),
        "expected ui-deep-import"
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  record("4 simulated new page import from design-system/components/Button → FAIL", () => {
    const { root, srcRoot } = writeTempTree({
      "apps/web/src/components/ui/index.ts": uiIndex,
      "apps/web/src/design-system/components/Button.tsx": dsButton,
      "apps/web/src/pages/NewPage.tsx": `import Button from "../design-system/components/Button";\n`
    });
    try {
      const baselinePath = path.join(root, "baseline.json");
      writeFileSync(
        baselinePath,
        JSON.stringify({ version: 1, entries: [] }, null, 2),
        "utf8"
      );
      const result = runCheck({
        srcRoot,
        repoRoot: root,
        baselinePath,
        printOnly: false
      });
      assert(result.ok === false, "expected FAIL");
      assert(
        result.newViolations?.some((v) => v.rule === RULES.DS_DEEP),
        "expected ds-deep-component"
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  record("5 adapter under components/ui importing DS Button → PASS", () => {
    const { root, srcRoot } = writeTempTree({
      "apps/web/src/components/ui/index.ts": uiIndex,
      "apps/web/src/components/ui/Button.tsx": `import DSButton from "../../design-system/components/Button";\nexport function Button(){return DSButton()}\n`,
      "apps/web/src/design-system/components/Button.tsx": dsButton
    });
    try {
      const baselinePath = path.join(root, "baseline.json");
      writeFileSync(
        baselinePath,
        JSON.stringify({ version: 1, entries: [] }, null, 2),
        "utf8"
      );
      const result = runCheck({
        srcRoot,
        repoRoot: root,
        baselinePath,
        printOnly: false
      });
      assert(result.ok === true, "expected PASS for ui adapter");
      assert(result.violations.length === 0, "expected zero violations");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  record("6 domain component import → PASS", () => {
    const { root, srcRoot } = writeTempTree({
      "apps/web/src/components/ui/index.ts": uiIndex,
      "apps/web/src/components/shell/ShellBrand.tsx": domainShell,
      "apps/web/src/pages/NewPage.tsx": `import { Shell } from "../components/shell/ShellBrand";\n`
    });
    try {
      const baselinePath = path.join(root, "baseline.json");
      writeFileSync(
        baselinePath,
        JSON.stringify({ version: 1, entries: [] }, null, 2),
        "utf8"
      );
      const result = runCheck({
        srcRoot,
        repoRoot: root,
        baselinePath,
        printOnly: false
      });
      assert(result.ok === true, "expected PASS for domain import");
      assert(result.violations.length === 0, "expected zero violations");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  record("7 duplicate baseline entry → FAIL", () => {
    const entry = {
      importer: "apps/web/src/pages/X.tsx",
      specifier: "../../components/Modal",
      resolvedTarget: "apps/web/src/components/Modal.tsx",
      rule: RULES.LEGACY
    };
    const baselinePath = path.join(
      mkdtempSync(path.join(tmpdir(), "dca-bl-")),
      "baseline.json"
    );
    try {
      writeFileSync(
        baselinePath,
        JSON.stringify({ version: 1, entries: [entry, entry] }, null, 2),
        "utf8"
      );
      let threw = false;
      try {
        loadBaseline(baselinePath);
      } catch (err) {
        threw = true;
        assert(err.code === "BASELINE_DUPLICATE", `expected DUPLICATE, got ${err.code}`);
      }
      assert(threw, "expected loadBaseline to throw");
    } finally {
      rmSync(path.dirname(baselinePath), { recursive: true, force: true });
    }
  });

  record("8 stale baseline entry → FAIL", () => {
    const { root, srcRoot } = writeTempTree({
      "apps/web/src/components/ui/index.ts": uiIndex,
      "apps/web/src/pages/CleanPage.tsx": `export {};\n`
    });
    try {
      const baselinePath = path.join(root, "baseline.json");
      writeFileSync(
        baselinePath,
        JSON.stringify(
          {
            version: 1,
            entries: [
              {
                importer: "apps/web/src/pages/Gone.tsx",
                specifier: "../../components/Modal",
                resolvedTarget: "apps/web/src/components/Modal.tsx",
                rule: RULES.LEGACY
              }
            ]
          },
          null,
          2
        ),
        "utf8"
      );
      const result = runCheck({
        srcRoot,
        repoRoot: root,
        baselinePath,
        printOnly: false
      });
      assert(result.ok === false, "expected FAIL on stale baseline");
      assert((result.stale?.length || 0) > 0, "expected stale entries");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  record("9 malformed baseline → FAIL", () => {
    const baselinePath = path.join(
      mkdtempSync(path.join(tmpdir(), "dca-bl-bad-")),
      "baseline.json"
    );
    try {
      writeFileSync(baselinePath, JSON.stringify({ version: 1, entries: "nope" }), "utf8");
      let threw = false;
      try {
        loadBaseline(baselinePath);
      } catch (err) {
        threw = true;
        assert(err.code === "BASELINE_MALFORMED", `expected MALFORMED, got ${err.code}`);
      }
      assert(threw, "expected loadBaseline to throw");
    } finally {
      rmSync(path.dirname(baselinePath), { recursive: true, force: true });
    }
  });

  // Extra: new ds-barrel import fails
  record("bonus new ds-barrel import → FAIL", () => {
    const { root, srcRoot } = writeTempTree({
      "apps/web/src/components/ui/index.ts": uiIndex,
      "apps/web/src/design-system/index.ts": dsIndex,
      "apps/web/src/design-system/components/Button.tsx": dsButton,
      "apps/web/src/pages/NewPage.tsx": `import { Button } from "../design-system";\n`
    });
    try {
      const baselinePath = path.join(root, "baseline.json");
      writeFileSync(
        baselinePath,
        JSON.stringify({ version: 1, entries: [] }, null, 2),
        "utf8"
      );
      const result = runCheck({
        srcRoot,
        repoRoot: root,
        baselinePath,
        printOnly: false
      });
      assert(result.ok === false, "expected FAIL");
      assert(
        result.newViolations?.some((v) => v.rule === RULES.DS_BARREL),
        "expected ds-barrel"
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  record("10 page import from design-system/status → FAIL", () => {
    const { root, srcRoot } = writeTempTree({
      "apps/web/src/components/ui/index.ts": uiIndex,
      "apps/web/src/design-system/status.ts": `export function normalizeStatusKey(){return null}\n`,
      "apps/web/src/pages/NewPage.tsx": `import { normalizeStatusKey } from "../design-system/status";\n`
    });
    try {
      const baselinePath = path.join(root, "baseline.json");
      writeFileSync(
        baselinePath,
        JSON.stringify({ version: 1, entries: [] }, null, 2),
        "utf8"
      );
      const result = runCheck({
        srcRoot,
        repoRoot: root,
        baselinePath,
        printOnly: false
      });
      assert(result.ok === false, "expected FAIL");
      assert(
        result.newViolations?.some((v) => v.rule === RULES.DS_STATUS),
        "expected ds-status-registry"
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  record("11 components/ui adapter importing design-system/status → PASS", () => {
    const { root, srcRoot } = writeTempTree({
      "apps/web/src/components/ui/index.ts": uiIndex,
      "apps/web/src/components/ui/StatusBadge.tsx": `import { normalizeStatusKey } from "../../design-system/status";\nexport function StatusBadge(){return normalizeStatusKey("DRAFT")}\n`,
      "apps/web/src/design-system/status.ts": `export function normalizeStatusKey(){return "draft"}\n`
    });
    try {
      const baselinePath = path.join(root, "baseline.json");
      writeFileSync(
        baselinePath,
        JSON.stringify({ version: 1, entries: [] }, null, 2),
        "utf8"
      );
      const result = runCheck({
        srcRoot,
        repoRoot: root,
        baselinePath,
        printOnly: false
      });
      assert(result.ok === true, "expected PASS for ui status adapter");
      assert(result.violations.length === 0, "expected zero violations");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  record("12 page import from components/ui status helpers → PASS", () => {
    const { root, srcRoot } = writeTempTree({
      "apps/web/src/components/ui/index.ts": `export { normalizeStatusKey } from "../../design-system/status";\n`,
      "apps/web/src/design-system/status.ts": `export function normalizeStatusKey(){return null}\n`,
      "apps/web/src/pages/NewPage.tsx": `import { normalizeStatusKey } from "../components/ui";\n`
    });
    try {
      const baselinePath = path.join(root, "baseline.json");
      writeFileSync(
        baselinePath,
        JSON.stringify({ version: 1, entries: [] }, null, 2),
        "utf8"
      );
      const result = runCheck({
        srcRoot,
        repoRoot: root,
        baselinePath,
        printOnly: false
      });
      assert(result.ok === true, "expected PASS for ui barrel status import");
      assert(result.violations.length === 0, "expected zero violations");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  record("13 page import design-system/components/Table → FAIL", () => {
    const { root, srcRoot } = writeTempTree({
      "apps/web/src/components/ui/index.ts": uiIndex,
      "apps/web/src/design-system/components/Table.tsx": `export const Table = () => null;\n`,
      "apps/web/src/pages/NewPage.tsx": `import { Table } from "../design-system/components/Table";\n`
    });
    try {
      const baselinePath = path.join(root, "baseline.json");
      writeFileSync(
        baselinePath,
        JSON.stringify({ version: 1, entries: [] }, null, 2),
        "utf8"
      );
      const result = runCheck({
        srcRoot,
        repoRoot: root,
        baselinePath,
        printOnly: false
      });
      assert(result.ok === false, "expected FAIL");
      assert(
        result.newViolations?.some((v) => v.rule === RULES.DS_DEEP),
        "expected ds-deep-component for Table"
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  record("14 page import EmptyState from components/ui barrel → PASS", () => {
    const { root, srcRoot } = writeTempTree({
      "apps/web/src/components/ui/index.ts": `export function EmptyState(){return null}\nexport function Table(){return null}\n`,
      "apps/web/src/pages/NewPage.tsx": `import { EmptyState, Table } from "../components/ui";\n`
    });
    try {
      const baselinePath = path.join(root, "baseline.json");
      writeFileSync(
        baselinePath,
        JSON.stringify({ version: 1, entries: [] }, null, 2),
        "utf8"
      );
      const result = runCheck({
        srcRoot,
        repoRoot: root,
        baselinePath,
        printOnly: false
      });
      assert(result.ok === true, "expected PASS for ui barrel state/table import");
      assert(result.violations.length === 0, "expected zero violations");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  const failed = results.filter((r) => !r.ok);
  console.log("");
  console.log(
    `[COMPONENT_IMPORT_GUARD] SELF-TEST ${failed.length === 0 ? "PASS" : "FAIL"} (${results.filter((r) => r.ok).length}/${results.length})`
  );
  return failed.length === 0 ? 0 : 1;
}

function main(argv) {
  const printOnly = argv.includes("--print-current-violations");
  const selfTest = argv.includes("--self-test");

  if (selfTest) {
    // Case 1 needs baseline present; if missing, still run other cases after advising.
    return runSelfTests();
  }

  const result = runCheck({
    srcRoot: DEFAULT_SRC_ROOT,
    repoRoot: REPO_ROOT,
    baselinePath: DEFAULT_BASELINE,
    printOnly
  });
  return result.code;
}

const exitCode = main(process.argv.slice(2));
process.exit(exitCode);
