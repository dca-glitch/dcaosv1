/**
 * Operator entry for staging WordPress one-draft live proof.
 * Not a public HTTP route. Never prints secrets.
 *
 * Required env:
 *   DCA_WP_DRAFT_PROOF_CONFIRM=I_UNDERSTAND_STAGING_ONE_DRAFT_ONLY
 *   PUBLICATION_TARGET_ID=<uuid>
 *   WORDPRESS_DRAFT_LIVE_ENABLED=true
 *   WORDPRESS_DRAFT_LIVE_CALLS_ALLOWED=true
 *
 * Optional:
 *   DCA_WP_DRAFT_PROOF_CLEANUP=true|false (default true)
 */
import { runWordPressStagingOneDraftProof } from "../apps/api/src/services/wordpress-staging-one-draft-proof.ts";
import { DCA_WP_DRAFT_PROOF_CONFIRM_VALUE } from "../apps/api/src/services/wordpress-staging-one-draft-proof.ts";

async function main() {
  const confirm = process.env.DCA_WP_DRAFT_PROOF_CONFIRM ?? "";
  const publicationTargetId = process.env.PUBLICATION_TARGET_ID ?? "";
  const cleanupRaw = (process.env.DCA_WP_DRAFT_PROOF_CLEANUP ?? "true").trim().toLowerCase();
  const cleanup = cleanupRaw !== "false" && cleanupRaw !== "0";

  if (confirm !== DCA_WP_DRAFT_PROOF_CONFIRM_VALUE) {
    console.error(
      JSON.stringify({
        ok: false,
        phase: "guard",
        safeError: "Set DCA_WP_DRAFT_PROOF_CONFIRM exactly to the staging one-draft confirm value."
      })
    );
    process.exit(2);
  }
  if (!publicationTargetId.trim()) {
    console.error(JSON.stringify({ ok: false, phase: "guard", safeError: "PUBLICATION_TARGET_ID required." }));
    process.exit(2);
  }

  const evidence = await runWordPressStagingOneDraftProof({
    publicationTargetId: publicationTargetId.trim(),
    confirm,
    cleanup
  });

  console.log(JSON.stringify(evidence));
  process.exit(evidence.ok ? 0 : 1);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "proof harness crashed";
  const safe = String(message)
    .replace(/Basic\s+[A-Za-z0-9+/=]+/gi, "Basic [REDACTED]")
    .replace(/applicationPassword[=:]\s*\S+/gi, "applicationPassword=[REDACTED]");
  console.error(JSON.stringify({ ok: false, phase: "crash", safeError: safe }));
  process.exit(1);
});
