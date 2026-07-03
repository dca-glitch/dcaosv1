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

## Deferred

- live search performance tracking
- live competitor gap tracking
- live crawling
- Google OAuth / GSC sync
- report automation
- autonomous agents

## Source of truth

- `docs/STATUS.md`
- `docs/AI_MODULES.md`
- `docs/ai-delivery-projects-mvp-prd.md`
