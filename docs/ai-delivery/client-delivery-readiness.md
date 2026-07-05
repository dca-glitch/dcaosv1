# Client Delivery Readiness Closure

## Closed

- Client Portal archive API.
- Client Portal archive UI.
- Client Portal browser proof.
- Client-safe archive contract docs.
- Client Portal monthly reports archive API/UI/browser proof.
- Monthly Report document handoff API/UI/browser proof.
- Client Access Admin UI/API foundation for tenant-scoped client-level grants.
- First-client onboarding runbook for controlled local/admin MVP work.
- Export handoff foundation.
- Puriva delivery chain summary: SEO plan -> content draft -> image/asset package -> compliance review checkpoint -> admin review -> draft-only WordPress prepared draft handoff -> final archive/monthly report.

## Proof

- `npm.cmd run validate` proves workspace type-check and build health.
- `npm.cmd run smoke:client-portal:local` proves the read-only archive API, access gating, final-deliverable filtering, and safe download contract.
- `node scripts/smoke-client-portal-browser-local.mjs` proves the archive UI, deferred sections, and forbidden-field non-exposure.
- `npm.cmd run smoke:client-portal-monthly-report:browser` proves FINAL-only monthly report visibility, ClientUserAccess gating, and forbidden-field non-exposure.
- `npm.cmd run smoke:client-access:local` proves admin grant/list/revoke, client-level portal bounds, FINAL-only monthly report visibility, unrelated-client blocking, and revoke behavior.
- `npm.cmd run smoke:monthly-report:local` proves monthly report document handoff, storageKey tightening, and safe admin download behavior.
- `npm.cmd run smoke:ai-delivery-reviews` remains the admin AI Delivery review/archive smoke when needed for related admin contract checks.
- `npm.cmd run smoke:mvp:local` proves the broader local auth/tenant/module readiness baseline.
- `npm.cmd run smoke:browser` and `scripts/smoke-browser.ps1` remain the general local browser proof wrappers behind `npm.cmd run smoke:browser`.
- `npm.cmd run smoke:local` and `scripts/smoke-local.ps1` remain the general local API proof wrappers behind `npm.cmd run smoke:local`.

## Deferred

- Production and VPS deploy.
- CI automation changes.
- Live Google Docs API / OAuth integration.
- Client review and approval actions.
- Client comments, request-changes workflows, and public approval links.
- Project-specific client access grants; the current `ClientUserAccess` schema is tenant/client/user scoped.
- Public links.
- GA/GSC reporting integration.
- Live GA/GSC provider sync for Monthly Reports. The persisted Monthly Report foundation, admin Monthly Report UI, Client Portal FINAL-only monthly reports, and monthly report document handoff are closed/proven for the current MVP.
- Full/client-facing/future Market Intelligence expansion; the current admin MVP lane is closed where documented.
- Revenue Hub AI.
- POD AI Toolkit.

## Safety rules

- SEO plan and AI Delivery handoff depend on verified Puriva intake and approved knowledge/context. A missing brief or unapproved knowledge items means the downstream plan/draft is not yet grounded.
- Client-visible data must be final or approved only. No draft, scaffold, or prepared WordPress payload is treated as final before the compliance review checkpoint and admin review pass.
- Client portal access is gated by `ClientUserAccess`.
- Admin-managed Client Access is client-level in the current MVP foundation; it does not create invitation emails, password UI, magic links, or public links.
- Owner/admin role alone does not grant client archive access.
- Client portal monthly reports also require `ClientUserAccess` and only expose FINAL, non-archived reports for the linked project.
- WordPress handoff means draft-only preparation only; live publish stays deferred and disabled in the current MVP block.
- Final archive/monthly report is the client-safe end state after the admin-reviewed handoff chain completes.
- Raw `storageKey` stays hidden from client responses.
- Workflow runs, jobs, prompts, research, review notes, draft body, cost, and provider metadata stay internal.
- Client portal monthly reports are FINAL-only and read-only; no public links, comments, or request-changes workflows are introduced by this handoff.
- `exportUrl` is the safe manual client-visible export link.
- PDF handoff is supported through private upload/download.
- Live Google Docs provider work remains deferred.
- For Puriva, verified intake facts should enter AI Delivery only through approved knowledge/context or reviewed plan notes; raw intake notes stay internal until they are explicitly reviewed.

## Next safe handoff

Local client delivery readiness is closed for MVP scope. Staging execution remains a separate G4 owner gate — see [`docs/runbooks/STAGING_LOCAL_EXECUTION_PACK.md`](../runbooks/STAGING_LOCAL_EXECUTION_PACK.md).

For new client-visible outputs in future modules, reuse the same final/approved-only archive pattern, hide internal workflow data, and document proof commands before implementation.

For the local/admin operating-pack completion layer, use [`PURIVA_OPERATING_PACK_V1_GO_NO_GO.md`](../runbooks/PURIVA_OPERATING_PACK_V1_GO_NO_GO.md) as the first-client go/no-go pack.

For any future owner-approved environment proof, use [`G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md`](../runbooks/G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md) as the planning-only gate and Sonnet prompt reference.
