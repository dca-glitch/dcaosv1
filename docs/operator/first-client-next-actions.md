# First Client Next Actions

Status: Short working list for the first client practice run after PR #13 merge to `main`.

Before step 1, open [`PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md`](../runbooks/PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md) and verify the client identity, service areas, approval contacts, and compliance rules.

Before the first local execution pass, also open [`PURIVA_OPERATING_PACK_V1_GO_NO_GO.md`](../runbooks/PURIVA_OPERATING_PACK_V1_GO_NO_GO.md) and confirm the approval checklist, integration decisions, and local go/no-go gates.

Current baseline: local `main` is synced and validated, and local pre-staging proof was accepted. This is still local/admin work only: no deploy, no VPS migration, no production restart/release, and no confirmed staging target.

## Next Actions

1. Pick one test client.
2. Confirm the intake facts that are already verified.
3. Pick one test month.
4. Create one monthly project.
5. Add a short brief.
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

For a local rehearsal of the full Puriva operator path, use [`PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md`](../runbooks/PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md) after the intake/compliance source is confirmed.

For any future environment proof, read [`G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md`](../runbooks/G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md) first, wait for explicit owner approval, and then use the Sonnet-only execution prompt there. Do not treat the planning gate as execution.
No environment proof has run yet.

## Stop Conditions

Stop the practice run if the client, month, project, or final item becomes unclear.

## Repo Note

Keep first-client practice local/admin-only unless a separate staging or production block is explicitly approved. Merge to `main` does not mean production was updated.
