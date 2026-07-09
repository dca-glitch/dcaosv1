# Client Delivery SOP

Status: Simple admin/client delivery process for the local/admin MVP.

For Puriva work, use [`PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md`](../runbooks/PURIVA_OPERATIONAL_INTAKE_AND_COMPLIANCE.md) as the single working source of truth before drafting or publishing any client-facing material.

For the local/admin operating-pack completion layer, use [`PURIVA_OPERATING_PACK_V1_GO_NO_GO.md`](../runbooks/PURIVA_OPERATING_PACK_V1_GO_NO_GO.md) as the first-client go/no-go pack.

For launch blockers and canonical article/image and monthly report workflows, use [`docs/architecture/PURIVA_OPERATING_PACK_V1.md`](../architecture/PURIVA_OPERATING_PACK_V1.md).

If the next step is an owner decision on environment proof, read [`G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md`](../runbooks/G9_ENVIRONMENT_PROOF_APPROVAL_GATE.md) first and do not treat it as execution.

This document explains the standard delivery process in plain language. It is written for admins and for explaining the process to clients without technical detail.

## Purpose

The purpose of this process is to make monthly client delivery predictable.

Each month should have:

- a clear client brief;
- a clear monthly project;
- research or market context where useful;
- an approved content plan;
- reviewed content drafts;
- final deliverables;
- a monthly report;
- a clean client archive.

## Simple Client Explanation

The client-facing explanation can be:

`Each month we collect your priorities, research the market, prepare a content plan, produce and review the content, prepare final deliverables, and summarize the completed work in a monthly report. You see the final approved work in your client archive.`

## Admin-Controlled Process

The admin controls the process from start to finish.

AI can help with research, plans, drafts, images, and summaries, but the admin checks the work before it becomes final.

The client sees final approved information only.

## SEO Operator Path

For SEO work, the operating sequence is:

verified intake -> SEO plan objectives -> content objectives -> draft/asset work -> compliance review -> admin review -> final deliverable -> archive/report.

The SEO plan is the operator scaffold that turns verified facts into content objectives the AI Delivery work can use.

Progress stops when:

- a client fact is unverified;
- a medical, partner, or license claim still needs review;
- the month, audience, or service focus is unclear;
- a draft would rely on unsupported claims;
- a step would require live publish or any other blocked runtime action.

What becomes AI Delivery work:

- content objectives;
- draft briefs;
- draft copy or draft shells;
- image or asset package notes;
- review comments and handoff notes.

What stays for archive or report later:

- approved deliverables;
- final client-safe summaries;
- monthly report notes;
- read-only archive items.

## Step 1: Create Or Confirm The Client

Before starting monthly work, confirm the client record exists and is correct.

Admin checks:

- client name;
- contact details;
- business notes;
- website or service focus if available;
- whether the client should have portal access yet.

Do not grant client access too early. Client access should be used when final client-safe material is available.

## Step 2: Create The Monthly Project

Create one clear project for the month.

Recommended name:

`Client Name - SEO Content - Month Year`

Example:

`Example Client - SEO Content - July 2026`

The project should help the admin keep all monthly work connected to the right client and month.

## Step 3: Collect Client Priorities

Collect the client’s current priorities.

Useful questions:

- What products or services should we focus on this month?
- Are there seasonal offers or campaigns?
- Are there topics the client wants to avoid?
- Are there competitors or examples the client wants us to understand?
- Are there pages, products, or services that need more visibility?

Keep this brief and practical. The goal is to guide the work, not create a long questionnaire.

For Puriva work, verify the facts against the operational intake and compliance source before moving them into WorkflowBriefs or AI Knowledge. Unverified facts stay in admin notes until they are reviewed.

## Step 4: Prepare Market Context

Use Market Intelligence when the admin needs better understanding of the market.

Good reasons to use it:

- new client;
- new niche;
- unclear audience;
- new monthly direction;
- competitor or opportunity check.

The admin should review the result and use it as internal context. It is not automatically client-facing.

## Step 5: Prepare The Content Plan

Prepare the content plan based on:

- client priorities;
- market context;
- SEO direction;
- available capacity for the month;
- business value.

For Puriva, the content plan should only use verified facts and approved context. If a contact detail, medical claim, partner statement, or service description is still pending verification, keep it out of the plan until it is reviewed.

A useful content plan should make clear:

- article topic;
- target audience;
- purpose of the article;
- suggested angle;
- why the topic matters.

Treat the plan as an operator scaffold, not a client-ready asset. If the plan is missing verified facts, keep it in objective form until the facts are approved.

Admin should review the content plan before draft production starts.

## Step 6: Produce Drafts

After the content plan is ready, generate or prepare content drafts.

This is where the AI Delivery work begins. The draft should follow the approved content objectives, not invent new direction.

Admin review checklist:

- Does the draft match the approved topic?
- Is it useful for the target audience?
- Is the tone appropriate for the client?
- Is the structure clear?
- Are there unsupported claims?
- Are there placeholders or internal notes?
- Does the draft need changes before becoming final?

AI-generated text is a starting point, not final client work.

## Step 7: Prepare Images Or Asset Notes

When images are part of the service, prepare image ideas, prompts, or final image assets.

Admin checks:

- image matches article topic;
- image is appropriate for the client brand;
- alt text is useful;
- final image is stored safely;
- image is linked to the right article or deliverable.

## Step 8: Package Final Deliverables

A deliverable should be final enough for client archive, export, or final delivery handoff.

Before marking as final, check:

- correct client;
- correct project/month;
- approved draft or final content;
- related images/assets are ready if required;
- export or document handoff is prepared where needed;
- no internal notes remain visible.

## Step 9: Prepare WordPress Draft Handoff

If the client uses WordPress, prepare the WordPress draft after the deliverable is ready.

This step is admin-reviewed draft-only preparation. It does not mutate production WordPress, does not handle credentials, and does not publish live.

The admin remains responsible for the final publishing decision.

Client review before publication is not part of the current MVP unless handled outside the system.

## Step 10: Prepare The Monthly Report

At the end of the month, prepare the monthly report.

The report should be simple, client-safe, and snapshot-based unless live analytics are separately approved.

Include:

- what was completed;
- what was prepared or finalized;
- important performance notes when available;
- recommendations for next month;
- links or references to final deliverables where appropriate.

The monthly report is reviewed by the admin and then made available as final client-safe material.

The report should also reflect what was blocked, what moved into AI Delivery work, and what remains for the next month.

## Step 11: Client Archive

The client archive should contain final approved work only.

Monthly reports in the archive are final snapshot summaries, not live analytics feeds.

Good archive content:

- final reports;
- final deliverables;
- approved documents;
- published links when available.

Do not expose internal drafts, raw AI outputs, hidden context, technical logs, workflow metadata, provider/job/run data, storage references, or unfinished items.

Anything still in operator-review status belongs in notes, not in the archive.

For a full local rehearsal of the Puriva operator path, follow [`PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md`](../runbooks/PURIVA_LOCAL_E2E_OPERATOR_DRY_RUN.md). Keep it local-only and stop if anything would require staging, production, or live provider/publish behavior.

## Client Communication Template

Use this simple message when explaining the process:

`We will prepare your monthly content work in stages: first we confirm your priorities, then we research the market, prepare a content plan, create and review the content, package the final deliverables, and summarize the completed work in your monthly report. Your client area is used for final approved work, not internal drafts.`

## Current MVP Limits

The following are not part of the active process yet:

- client comments inside the portal;
- client approval buttons;
- public approval links;
- project-specific client access;
- automatic live analytics sync;
- fully automatic publishing;
- production deployment without a separate approval block.

Production readiness stays blocked until a separate owner-approved environment-proof block. Live integrations remain deferred.

These limits are intentional. They keep the first delivery path controlled and safe.
