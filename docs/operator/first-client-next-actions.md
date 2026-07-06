# First Client Next Actions

Status: Short working list for the first client practice run after PR #13 merge to `main`.

Before step 1, open [`PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md`](../runbooks/PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md) and verify the client identity, service areas, approval contacts, and compliance rules.

Before the first local execution pass, also open [`PURIVA_OPERATING_PACK_V1_GO_NO_GO.md`](../runbooks/PURIVA_OPERATING_PACK_V1_GO_NO_GO.md) and confirm the approval checklist, integration decisions, and local go/no-go gates.

Current baseline: local `main` is synced and validated, and local pre-staging proof was accepted. This is still local/admin work only: no deploy, no VPS migration, no production restart/release, and no confirmed staging target.

Use the Admin Daily Operations Cockpit first so ready work, review work, and blocked work stay separated before you open deeper consoles.

## Next Actions

1. Pick one test client.
2. Confirm the intake facts that are already verified.
3. Pick one test month.
4. Create one monthly project.
5. Add a short brief, then **submit the brief** — the WorkflowBrief must be submitted before `run-ai` will accept it.
6. Prepare one SEO plan scaffold with objectives only.
7. Turn the plan into content objectives.
8. Review one draft or draft shell.
9. Package one final item.
10. Prepare one simple monthly summary.
11. Check the client archive view.
12. Record what blocked progress and what should become AI Delivery work next.

## Done When

The run is done when the admin can explain:

- what was created;
- what was blocked or left as an objective;
- what moved into AI Delivery work;
- where the final work is stored;
- what the client would see;
- what still needs improvement.

## Keep It Small

Use one client, one month, one draft, and one final item for the first run.

For Puriva, keep unresolved facts in brief notes or WorkflowBriefs until the compliance review is documented and the approved context is ready.

WorkflowBriefs is the AI SEO / context-composition surface here: the admin page is where you submit the brief, run AI, review MI/SEO outputs, generate the production plan, and hand off into AI Delivery. The client-facing label is `Production Plan Review`.

For a local rehearsal of the full Puriva operator path, use [`PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md`](../runbooks/PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md) after the intake/compliance source is confirmed.

For any future environment proof, read [`G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md`](../runbooks/G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md) first, wait for explicit owner approval, and then use the Sonnet-only execution prompt there. Do not treat the planning gate as execution.
No environment proof has run yet.

## Local Dry-Run Recap (2026-07-06)

A local/admin-only placeholder practice run of this 12-step list was completed via direct authenticated local API calls (mirroring existing smoke-script patterns), not through the browser. Repo was clean and synced (`## main...origin/main`) before and after; latest commit at the time was `9251315` (`docs: record business modules polish closeout`); no files changed during the run.

**Fixtures used (placeholder only):**

- Client: `"ZZZ LOCAL PRACTICE CLIENT (placeholder - not a real client)"`
- Month: `2026-07`
- Brief: `"PLACEHOLDER local practice brief - operator review required"`
- All brief fields were explicit placeholder text; no medical/legal/license/before-after claims were used.

**Chain proven end-to-end locally:** intake/client → WorkflowBrief submit → MI + SEO reports → production plan → client send/approval → AI Delivery monthly project → content production seed → 12 content drafts → package deliverables → monthly report → FINAL status → client portal visibility.

**Client boundary result:** PASS. The client-side monthly report view showed only the FINAL report with client-safe fields (`id`, `aiDeliveryProjectId`, `title`, `displayTitle`, `recommendationsText`, `exportUrl`, `status`, `hasDocument`, `finalizedAt`, `createdAt`, `updatedAt`). No `storageKey`, provider/model/gateway, prompt, job/run id, cost, or review notes were exposed.

**Local API/Web state:** the local API was already running on `:4000` (health OK) and used for all steps; local Web on `:5173` was running but not browser-driven for this recap.

**Discovered documentation gap (now fixed above):** this doc did not previously state that a WorkflowBrief must be submitted before `run-ai` will accept it — step 5 above now reflects that.

**Scope of this proof:** local/admin-only, placeholder data only. This does not constitute real-client readiness, environment proof, or production readiness. No code fix was needed and no environment escalation is needed. Environment/VPS/staging/production remain untouched, and live provider, live WordPress, GA/GSC, and R2 live IO remain deferred.

## Stop Conditions

Stop the practice run if the client, month, project, or final item becomes unclear.

## Repo Note

Keep first-client practice local/admin-only unless a separate staging or production block is explicitly approved. Merge to `main` does not mean production was updated.
