export {
  P2A_EXECUTION_PREPARATION_AUTHORIZATION_CONSUMED,
  P2A_EXECUTION_PREPARATION_AUTHORIZATION_KIND,
  P2A_EXECUTION_PREPARATION_AUTHORIZATION_UNUSED,
  P2A_EXECUTION_PREPARATION_EVIDENCE_LOCATION as P2A_OWNER_EXPORTER_OUTPUT_DIRECTORY,
  P2A_EXECUTION_PREPARATION_TARGET as P2A_OWNER_EXPORTER_TARGET,
  P2aExecutionPreparationError as P2aOwnerExporterError,
  assertP2aExecutionPreparationTarget as assertP2aOwnerExporterTarget,
  assertUnusedOwnerAuthorization as assertSingleUseOwnerAuthorization,
  buildP2aExecutionPreparationSnapshot as buildP2aOwnerSnapshot,
  derivePseudonymousKey,
  prepareAndPublishP2aSnapshot as exportP2aOwnerSnapshot
} from "./p2-a-execution-preparation.mjs";

export const P2A_OWNER_EXPORTER_STATUS = "DISABLED_BY_DEFAULT";

export function parseP2aOwnerExporterArgs() {
  throw new Error("P2-A owner exporter is disabled by default; no execution is authorized.");
}

if (process.argv[1]?.endsWith("p2-a-owner-local-exporter.mjs")) {
  try { parseP2aOwnerExporterArgs(process.argv.slice(2)); } catch (error) { process.stderr.write(`P2-A OWNER EXPORTER / ${error.message}\n`); process.exitCode = 64; }
}
