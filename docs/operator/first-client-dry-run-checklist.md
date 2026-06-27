# First Client Dry-Run Checklist

Status: Plain-language checklist for testing the first client workflow before production.

This checklist is for a controlled admin dry run. It helps confirm that the full client delivery path makes sense before using it with a real live client portal.

Current post-merge note: PR #13 is merged to `main`, local validation passed, and local pre-staging proof was accepted. Current `main` is not deployed to production, and no separate staging target is confirmed.

Phase F operator runbook: [`docs/runbooks/PHASE_F_BLOCK_76_FIRST_CLIENT_PRACTICE_RUN.md`](../runbooks/PHASE_F_BLOCK_76_FIRST_CLIENT_PRACTICE_RUN.md).

## Goal

Prove that an admin can complete the full monthly delivery flow from client setup to final client-safe archive.

The dry run should answer one question:

`Can we run one complete client month safely, clearly, and without exposing internal work to the client?`

## Dry-Run Rules

- Use local/admin operation only.
- Do not deploy.
- Do not enable production client access.
- Do not send real emails automatically.
- Do not publish anything automatically.
- Do not expose unfinished drafts to the client.
- Use only final client-safe material in the client archive.

## Before Starting

Confirm:

- local app opens correctly;
- admin can log in;
- correct tenant is active;
- admin can access Clients, Projects, AI Delivery, Market Intelligence, Monthly Reports, and Finance if needed;
- current branch is clean and synced;
- production remains frozen.
- `system.digitalcubeagency.net` is not treated as staging; it is a live production VPS target unless explicitly reclassified by the owner.

## Step 1: Create Or Select Test Client

Admin action:

- create a test client or select an existing safe test client;
- confirm the client name is clear;
- confirm notes/contact details are safe and not confusing;
- do not connect a real client user yet unless intentionally testing read-only access.

Pass condition:

- the admin can clearly identify the client record.

## Step 2: Create Monthly Project

Admin action:

- create a project for the test month;
- use a clear name such as `Test Client - SEO Content - July 2026`;
- confirm the project belongs to the correct client.

Pass condition:

- the project is easy to find and clearly tied to the client/month.

## Step 3: Add Client Brief

Admin action:

- add a simple client brief;
- include business focus, target audience, services/products, and monthly priority;
- keep it short enough for practical use.

Pass condition:

- the brief gives enough direction to prepare research and content planning.

## Step 4: Prepare Market Intelligence Context

Admin action:

- run or prepare a Market Intelligence item for the test client/month;
- review the summary;
- mark the handoff ready only if it is useful;
- attach it to the AI Delivery project if appropriate.

Pass condition:

- admin can use market context without exposing raw internal research to the client.

## Step 5: Prepare Content Plan

Admin action:

- create or generate a content plan;
- review the planned topics;
- confirm each topic has a clear reason;
- adjust anything that does not fit the client.

Pass condition:

- the content plan looks realistic for one month and fits the client.

## Step 6: Produce Draft Content

Admin action:

- generate or prepare at least one article/content draft;
- review for accuracy, tone, structure, and usefulness;
- remove placeholders, internal notes, and unsupported claims;
- request changes or regenerate if needed.

Pass condition:

- at least one draft is admin-reviewed and acceptable for packaging.

## Step 7: Prepare Images Or Asset Notes

Admin action:

- prepare image plans or final image assets if the workflow requires them;
- confirm image text/alt text is client-safe;
- confirm the image belongs to the correct article/deliverable.

Pass condition:

- image or asset handling does not confuse the admin and does not expose unfinished material.

## Step 8: Package Final Deliverable

Admin action:

- package the final content as a deliverable;
- confirm it belongs to the correct client and project;
- confirm the status means final/client-safe;
- prepare export or document handoff if needed.

Pass condition:

- the deliverable is clearly final and safe for client archive or handoff.

## Step 9: Prepare WordPress Draft Handoff If Needed

Admin action:

- prepare the WordPress draft handoff for the final deliverable if the client workflow requires it;
- confirm this is a draft handoff, not automatic publishing.

Pass condition:

- admin understands what is ready for WordPress and what still needs final publishing control.

## Step 10: Prepare Monthly Report

Admin action:

- prepare the monthly report for the test project;
- include completed work and next-month recommendations;
- keep wording client-safe;
- include only final deliverables or final links.

Pass condition:

- the report can be shown to a client without exposing internal workflow details.

## Step 11: Review Client Archive

Admin action:

- check what the client would see;
- confirm only final/client-safe items appear;
- confirm no raw research, prompts, drafts, admin notes, or workflow statuses are visible.

Pass condition:

- the client archive is safe and read-only.

## Step 12: Review Admin Experience

Admin should answer:

- Was it clear what to do next?
- Were any buttons confusing?
- Was any screen too large or hard to scan?
- Did any action feel risky?
- Did any final/client-safe status feel unclear?
- Were client and project links clear enough?

Pass condition:

- the admin can repeat the flow without guessing.

## Step 13: Record Issues

For every issue, record:

- screen or area;
- what was confusing;
- what should happen instead;
- whether it blocks real client work.

Use three levels:

- Must fix before production;
- Should improve before first client;
- Nice to improve later.

## Dry-Run Exit Decision

### Ready For Controlled Client Work

Use this only if:

- admin can complete the flow;
- final deliverables are clear;
- monthly report is client-safe;
- client archive shows only final approved work;
- no blocker exists.

### Needs Fixes First

Use this if:

- admin gets stuck;
- client-safe visibility is unclear;
- deliverables or reports are confusing;
- wrong client/project data could be exposed;
- core workflow actions fail.

### Not Ready For Production

Use this if:

- production deployment is still not reviewed;
- a real staging target is missing or not confirmed;
- storage/email/provider settings are not production-ready;
- client access safety is not proven;
- rollback plan does not exist.

## Final Dry-Run Summary Template

Use this after the dry run:

`Dry run result: Ready / Needs Fixes / Not Ready.`

`Client/project tested:`

`What worked:`

`What was confusing:`

`Must-fix before real client:`

`Nice-to-fix later:`

`Client archive safe: Yes / No.`

`Recommended next action:`

## Current Recommendation

Run this checklist locally before any staging/prod deployment or live client access. The goal is to prove the admin delivery flow first, then decide what UI or workflow issues must be fixed before a real client sees the system. Do not treat the PR #13 merge as production readiness or production deployment.
