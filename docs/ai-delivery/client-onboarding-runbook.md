# First Client Onboarding Operating Runbook

This runbook covers the local/admin MVP path for starting real client work with the closed client onboarding foundation.

For Puriva, the working source of truth is [`PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md`](../runbooks/PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md).

## Operating Path

Market Intelligence -> AI Delivery brief/context -> SEO plan -> content draft -> image/asset package -> compliance review checkpoint -> draft-only WordPress handoff -> final monthly report -> read-only client archive.

## First-Client Setup Checklist

**Operating model:** Each domain = one `Client`. See [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](../architecture/CLIENT_DOMAIN_OPERATING_MODEL.md).

1. Create or select the **Client** record (domain / agency client) in the admin area.
2. Create the monthly AI Delivery project for that client and target month.
3. Collect the client brief and record only the approved client-facing needs.
4. Run Market Intelligence/admin research and capture the internal findings.
5. Attach the approved MI context to the AI Delivery project.
6. Create the SEO/content plan, draft content, and image/asset package; complete the compliance review before anything leaves admin scope.
7. Prepare the draft-only WordPress handoff using only client-safe references.
8. Create the final monthly report for the project.
9. Grant client access with client-level `ClientUserAccess`.
10. Verify the client can see only final client-safe data in the Client Portal.

## Client Visibility Rules

- Client Portal MVP is required for Puriva — client-safe visibility only.
- Client visibility includes final deliverables, final monthly reports, client-safe MI summary, SEO status, Google Docs exports, and publishing handoff/status where implemented.
- WordPress handoff means draft-only preparation only; live publish stays deferred.
- Monthly Reports must be `FINAL` before they are client-visible.
- No internal prompts, workflow runs, provider metadata, review notes, draft bodies, storage keys, AI costs, credentials, or admin-only notes are exposed to the client.
- Client access is granted through tenant-scoped client-level `ClientUserAccess`.
- Client-facing archive views must not expose unrelated client or project data.

## Deferred Items

- Approvals, comments, and request changes.
- Public links.
- Invite emails, magic links, and password UI.
- Project-specific access.
- Live GA/GSC sync.
- Full WordPress publishing automation.
- Google OAuth.
- Production deploy.
- Revenue Hub, POD, scraping, and autonomous agents.

## Operator QA Checklist

- Run `npm.cmd run validate` before any release block.
- Run `npm.cmd run smoke:client-access:local`.
- Run the relevant client portal or monthly report smoke when changing client visibility.
- Verify no client can see unrelated client or project data.
- Verify no non-`FINAL` monthly report is visible.

## Ready To Use Locally

The local/admin MVP supports controlled DCA-operated client work **locally** only.

This is **not** production ready, **not** Puriva Launch ready, and **not** live-integration proven (R2 / email / GA/GSC / WordPress HTTP / image provider remain deferred). Production or live client access requires a separate deploy and security approval block.
