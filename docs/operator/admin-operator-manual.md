# Admin Operator Manual

Status: Local/admin MVP operating guide.

This guide explains how an admin should use DCA OS Lite in simple working language. It avoids technical details and focuses on the daily operating flow.

## What DCA OS Lite Is For

DCA OS Lite is the workspace where the admin runs client work, tracks the monthly delivery process, prepares AI-assisted content, keeps finance records, and gives clients access to final approved work.

The admin controls the process. AI helps prepare research, plans, drafts, images, and handoff material, but the admin reviews and decides what becomes final.

## Main Admin Rule

The admin should treat the system as a control room:

1. Create or select the client.
2. Create the monthly project.
3. Add the client brief and business context.
4. Use research and market intelligence to understand the client and market.
5. Prepare the content plan.
6. Review and improve drafts.
7. Prepare final deliverables.
8. Prepare the monthly report.
9. Give the client access only to final client-safe work.

Clients should not see internal drafts, raw AI work, prompts, technical logs, or unfinished material.

## Clients

Use Clients to keep the client profile and access setup.

The admin should:

- create the client record;
- keep the contact and business information clear;
- connect the correct user only when client access is ready;
- avoid giving access before final client-safe content exists.

Client access is currently client-level. This means the connected user can see the final client-safe archive for that client. Project-specific access is not part of the current MVP.

## Projects

Use Projects for internal work tracking.

A project should represent a real piece of work, such as a client month, campaign, or internal delivery block.

For monthly SEO/content delivery, the recommended pattern is one project per client per month.

Example:

`Client Name - SEO Content - July 2026`

The project should make it easy to know what month, client, and delivery goal the work belongs to.

## Tasks

Use Tasks for admin reminders and operational work.

Good task examples:

- collect client priorities;
- review market intelligence;
- approve content plan;
- review article draft;
- prepare WordPress draft;
- check monthly report;
- send final update to client.

Tasks should stay practical. They are not a replacement for the AI Delivery workflow, but they help the admin remember what needs action.

## Market Intelligence

Use Market Intelligence to understand the market, audience, competitors, and opportunities before preparing content.

The admin should use it when:

- starting work with a new client;
- preparing a new monthly content plan;
- entering a new niche;
- deciding what topics or angles matter;
- checking risks and opportunities before writing.

Market Intelligence is internal by default. The admin may use the summary to improve the client brief or delivery direction, but raw internal research is not client-facing unless prepared and approved separately.

## AI Delivery

Use AI Delivery as the main workspace for client content delivery.

The admin should:

1. create the AI Delivery project for the client and month;
2. add the brief and client priorities;
3. attach approved Market Intelligence context when available;
4. prepare or review the content plan;
5. generate and review content drafts;
6. prepare image planning and final assets;
7. package the final deliverable;
8. prepare WordPress draft handoff when needed;
9. prepare the monthly report after work is published or ready to report.

The system may generate drafts, but the admin remains responsible for quality and final approval.

## AI SEO

Use AI SEO to turn research and brief information into a clear content plan.

The admin should check:

- topic relevance;
- client business fit;
- keyword and audience fit;
- article intent;
- whether the plan is realistic for the month;
- whether anything needs client clarification.

The content plan should be approved before producing drafts.

## Content Production

Use content production to prepare article drafts and related image plans.

The admin should review every draft before it becomes a deliverable.

Check for:

- accuracy;
- tone;
- client brand fit;
- clear structure;
- useful headings;
- no unsupported claims;
- no private/internal notes;
- no unfinished placeholders.

A draft is not final until the admin accepts it.

## Quality Review Before Final

Before any work becomes final, the admin should check:

- the correct client is attached;
- the correct project or month is attached;
- the work matches the brief;
- the title is clear;
- the content is useful for the intended audience;
- the wording is ready for handoff;
- there are no unfinished placeholders;
- there are no internal working notes;
- any included links or files are appropriate for final use.

If any item is uncertain, keep the work in review instead of treating it as final.

## Deliverables

A deliverable is the final package prepared for client work.

A good deliverable should be:

- connected to the correct client;
- connected to the correct project or month;
- based on an approved draft or plan;
- reviewed by the admin;
- safe for the client to see;
- ready for export, download, WordPress draft, or monthly report use.

Do not mark unfinished internal material as final.

## Monthly Reports

Use monthly reports to summarize the final work for the month.

The report should include only client-safe and final information.

A good monthly report explains:

- what was completed;
- what was published or prepared;
- what changed this month;
- important performance notes when available;
- what is recommended next month.

The client does not approve the monthly report in the current MVP. The admin reviews and finalizes it.

## Client Portal

Client Portal MVP is **required for Puriva** (active agreement). The portal shows client-safe delivery visibility only.

Clients should see final, approved, client-safe information including:

- final deliverables and monthly reports (FINAL status);
- client-safe Market Intelligence summary;
- AI SEO delivery status and approved content;
- Google Docs final export links;
- website publishing handoff/status.

Clients should not see:

- internal AI prompts;
- raw research or MI internals;
- workflow statuses and runs;
- unfinished drafts;
- admin comments;
- technical logs;
- AI costs or credentials;
- hidden internal context.

Public approval links, magic links, and full client comment/action threads remain phased after MVP visibility scope.

## Finance

Use finance areas to keep operational business records clear.

Main areas:

- Invoices;
- Recurring invoices;
- Credit Notes;
- Bills;
- Vendors;
- Services Library.

The admin should keep finance records accurate and avoid changing financial meaning for presentation reasons. UI changes should make finance easier to scan, not change calculations or business rules.

## Daily Admin Routine

A simple daily routine:

1. Open Dashboard and check what needs attention.
2. Review active clients and projects.
3. Check tasks due soon.
4. Continue active AI Delivery work.
5. Review drafts or deliverables waiting for admin action.
6. Update finance records if needed.
7. Keep final client-safe items ready for client archive or report.

## Monthly Delivery Routine

A simple monthly routine:

1. Create the monthly client project.
2. Collect or update client priorities.
3. Prepare Market Intelligence context.
4. Prepare and approve the content plan.
5. Produce and review drafts.
6. Prepare images/assets where needed.
7. Package deliverables.
8. Prepare WordPress drafts if needed.
9. Prepare and finalize the monthly report.
10. Make sure the client archive contains only final client-safe material.

## What To Avoid

Avoid:

- showing clients unfinished work;
- treating AI output as final without review;
- mixing clients or months;
- creating deliverables without clear client/project context;
- using the Client Portal for approvals before the feature is formally built;
- using production or live provider features unless separately approved;
- changing business rules during UI cleanup.

## Current MVP Boundaries

Currently active:

- admin-operated client and project work;
- admin-run AI Delivery flow;
- admin review and finalization;
- read-only client archive for final work;
- local-first validation and smoke checks.

Currently deferred:

- live production deployment;
- project-specific client access;
- public approval links;
- client comments and request-changes actions;
- live Google OAuth / GSC sync;
- autonomous background agents;
- automatic client-facing publishing.
