import path from "node:path";
import { fileURLToPath } from "node:url";
import { runIsolatedPostgresProof } from "./lib/run-isolated-postgres-proof.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await runIsolatedPostgresProof({
  root,
  label: "Bounded execution bridge Prisma integration",
  env: { BOUNDED_BRIDGE_PRISMA_TEST: "true" },
  nodeArgs: [
    "--import",
    "tsx",
    "--test",
    "apps/api/tests/integration/ai-delivery-bounded-execution-bridge.prisma.integration.test.ts"
  ]
});
