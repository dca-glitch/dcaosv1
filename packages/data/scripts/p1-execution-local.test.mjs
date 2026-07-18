import assert from "node:assert/strict";
import test from "node:test";
import { assertLocalTarget, parseExecutionArgs } from "./p1-execution-local.mjs";
test("execution tooling fails closed for targets and flags", () => {
  assert.deepEqual(parseExecutionArgs(["--target", "source", "--command", "plan"]), { command: "plan", execute: false, target: "source", format: "summary" });
  assert.throws(() => parseExecutionArgs(["--target", "source", "--command", "backfill"]), /requires explicit/);
  assert.throws(() => parseExecutionArgs(["--target", "source", "--command", "plan", "--apply"]), /Unsupported execution flag/);
  assert.throws(() => assertLocalTarget("postgresql://opaque@remote.example:5434/db", "source"), /Target mismatch/);
  assert.deepEqual(assertLocalTarget("postgresql://opaque@127.0.0.1:5435/db", "restore"), { host: "127.0.0.1", port: "5435", target: "restore" });
});
