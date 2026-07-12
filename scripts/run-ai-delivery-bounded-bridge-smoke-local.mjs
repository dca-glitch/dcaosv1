import path from "node:path";
import { fileURLToPath } from "node:url";
import { runIsolatedPostgresProof } from "./lib/run-isolated-postgres-proof.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await runIsolatedPostgresProof({
  root,
  label: "Bounded execution bridge CLI smoke",
  env: { BOUNDED_BRIDGE_SMOKE: "true" },
  nodeArgs: [
    "--import",
    "tsx",
    "scripts/smoke-ai-delivery-bounded-execution-bridge-local.mjs"
  ]
});
