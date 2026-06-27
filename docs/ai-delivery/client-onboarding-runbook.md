# First Client Onboarding Operating Runbook

This runbook covers the local/admin MVP path for starting real client work with the closed client onboarding foundation.

## Operating Path

Market Intelligence -> AI Delivery brief/context -> AI SEO content plan/drafts -> deliverables/export handoff -> final monthly report -> read-only client archive.

## First-Client Setup Checklist

**Operating model:** Each domain = one `Client`. See [`docs/architecture/CLIENT_DOMAIN_OPERATING_MODEL.md`](../architecture/CLIENT_DOMAIN_OPERATING_MODEL.md).

1. Create or select the **Client** record (domain / agency client) in the admin area.
2. Create the monthly AI Delivery project for that client and target month.
3. Collect the client brief and record only the approved client-facing needs.
4. Run Market Intelligence/admin research and capture the internal findings.
5. Attach the approved MI context to the AI Delivery project.
6. Create the SEO/content plan and any draft content needed for delivery.
7. Review drafts and package the final deliverables.
8. Prepare the export or document handoff using only client-safe references.
9. Create the final monthly report for the project.
10. Grant client access with client-level `ClientUserAccess`.
11. Verify the client can see only final client-safe data in the Client Portal.

## Client Visibility Rules

- Client Portal MVP is required for Puriva — client-safe visibility only.
- Client visibility includes final deliverables, final monthly reports, client-safe MI summary, SEO status, Google Docs exports, and publishing handoff/status where implemented.
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

The local/admin MVP is ready for controlled DCA-operated client work.

Production or live client access requires a separate deploy and security approval block.
