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

## Reusable knowledge / context relationship (Block 5A)

Content plan creation/editing in this module is direct, deterministic admin CRUD (see
`AiDeliveryContentPlan` in [`docs/modules/WORKFLOW_BRIEFS_MODULE_PLAN.md`](./WORKFLOW_BRIEFS_MODULE_PLAN.md))
and is not itself an AI workflow run. The separate reusable AI Knowledge Base /
Context Builder layer ([`docs/modules/KNOWLEDGE_BASE.md`](./KNOWLEDGE_BASE.md)) composes
approved knowledge (including `SEO_KEYWORD_GROUP`/`MARKET_INSIGHT`/`REPORT_INSIGHT` types)
into **AiDelivery workflow-run execution context** generally, but is not specifically wired
into this module's content-plan or PDF export path.

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
