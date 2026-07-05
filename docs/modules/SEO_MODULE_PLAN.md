# SEO Module

## Purpose

The SEO module supports admin-operated planning, tracking, and reporting for content delivery.

## Current state

- deterministic local planning and research scaffolds exist
- AI SEO admin shell and content-plan workflow are in place
- manual review and approval remain the operating model
- live crawling, live Google sync, and autonomous SEO agents are deferred

## Current scope

- SEO topic list
- keyword targets
- content status
- approval status
- research requests and summaries
- content plan generation and review
- admin-only content plan PDF export + private R2 storage (Block 3B)
- admin UI shows PDF handoff readiness state on open (Block 3E) — Download PDF is enabled only once a document exists
- editing plan items or changing plan status automatically invalidates a previously generated PDF (Block 3F) — prevents handing off a stale document

## Operator path

Puriva SEO planning is the upstream start of the delivery chain, but it may only proceed after verified intake and approved knowledge/context are in place:

Verified Puriva intake + approved KB/context -> SEO plan objectives -> content draft -> image/asset package -> compliance review checkpoint -> admin review -> draft-only WordPress prepared draft handoff -> final archive/monthly report -> read-only archive.

Puriva planning should only use verified intake facts and approved WorkflowBriefs knowledge/context. If a claim or contact fact is still pending verification, keep it as an objective or note only and do not turn it into SEO copy yet.

- **Context ready / missing:** A project brief and approved knowledge items (CLIENT_FACT, BRAND_VOICE, PROJECT_CONTEXT) should be present before the monthly content plan is treated as grounded. If these are missing, the plan remains a speculative scaffold.
- **No draft is final before compliance review:** Planning items, generated drafts, and prepared WordPress payloads are objectives or internal scaffolds until the compliance review checkpoint and admin review pass.
- **WordPress is draft-only:** The WordPress handoff prepares a local draft payload only. Live publish remains deferred and disabled unless a separately approved block enables it.
- **Client sees final/review-safe outputs only:** Client Portal and monthly reports expose only FINAL or approved deliverables. Internal drafts, review notes, workflow runs, and provider metadata stay admin-only.

## Reusable knowledge / context relationship (Blocks 5A / 6A / 6B / XXL 3)

AI SEO content-plan work in this module uses `AiDeliveryContentPlan` (see
[`docs/modules/WORKFLOW_BRIEFS_MODULE_PLAN.md`](./WORKFLOW_BRIEFS_MODULE_PLAN.md)).
Knowledge integration depends on **how** the plan rows were created:

| Origin | Knowledge integration |
| --- | --- |
| **Manual admin CRUD** (`POST`/`PUT` content plan) | **Not needed** — admin-authored rows, not an AI workflow run. |
| **PDF export** (`generate-pdf` / download) | **Not needed** — render-only export of existing plan rows; no generation. |
| **AiDelivery workflow run** with `[generate-content-plan]` in admin notes | **Already wired** — `executeAiDeliveryWorkflowRun` composes approved knowledge via `buildAiWorkflowKnowledgeContext` with `workflowType: content_plan_draft`. |
| **AiDelivery workflow run** per plan item (article draft) | **Already wired** — same execute path with `workflowType: article_draft`. |
| **WorkflowBriefs seed** / **Puriva seed** | **No direct Knowledge call** — deterministic mapping or upstream WorkflowBriefs MI/SEO/plan/draft context (Blocks 6A/6B). |

Manual CRUD and PDF export are **intentionally not** Knowledge execution paths. Workflow-generated
content plans already use the AiDelivery workflow Knowledge path. See
[`docs/modules/KNOWLEDGE_BASE.md`](./KNOWLEDGE_BASE.md).

For Puriva, the SEO plan is the bridge between verified clinic facts and the AI Delivery handoff. The plan can point to approved context and topic priorities, but it remains draft-only until compliance review and admin review are complete.

## Deferred

- live search performance tracking
- live competitor gap tracking
- live crawling
- Google OAuth / GSC sync
- report automation
- autonomous agents
- live WordPress publishing (disabled/deferred)

## Source of truth

- `docs/STATUS.md`
- `docs/AI_MODULES.md`
- `docs/ai-delivery-projects-mvp-prd.md`
