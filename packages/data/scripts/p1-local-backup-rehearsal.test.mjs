import assert from "node:assert/strict";
import test from "node:test";
import { parseBackupArgs } from "./p1-local-backup-rehearsal.mjs";
test("backup rehearsal requires explicit execution and an absolute destination", () => {
  assert.throws(() => parseBackupArgs([]), /Explicit --execute/);
  assert.throws(() => parseBackupArgs(["--execute", "--backup-dir", "relative"]), /absolute path/);
  assert.throws(() => parseBackupArgs(["--execute", "--backup-dir", "C:\\safe", "--cleanup"]), /Forbidden/);
  assert.deepEqual(parseBackupArgs(["--execute", "--backup-dir", "C:\\safe"]), { execute: true, backupDir: "C:\\safe", postMigration: false });
});
