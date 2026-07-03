# AI Modules

## Current status

**Merged AI operating baseline on `main` (2026-06):**

- **AI Gateway v1** (PR #33) — guarded provider config, local deterministic default, workflow observability metadata (`AI_WORKFLOW_RESULT_V1`, execution log `[OBSERVABILITY]` blocks).
- **AI workflow smoke matrix** (PR #33) — sequential local proof across provider config, knowledge context, MI, monthly report, AI Delivery, AI Operations, and guarded OpenRouter skip path.
- **AI Operations Console v1** (PR #34) — admin-only operator surface for reviewing AI Delivery workflow runs. Not exposed in Client Portal.

Default execution is **local/deterministic**. OpenRouter/live provider paths exist but remain **opt-in, env-guarded, and not production-proven**.

## Current module split

- **AI Delivery**: the operational production workspace and canonical production data surface — Project / simple project-attached Brief (`AiDeliveryBrief`) / content plan / content drafts / article images / Deliverable / Review / exports / WordPress draft-prep boundary / monthly report / client portal archive flow.
- **Workflow Briefs**: the composable intake / context-composition / production-automation layer — rich structured brief intake, AI run tracking, MI/SEO reports, `ProductionPlan` with client sign-off, and batch generation/packaging that writes into AiDelivery's shared production tables (content drafts, article images, deliverables). Not legacy and not a duplicate production workspace. See [`docs/modules/WORKFLOW_BRIEFS_MODULE_PLAN.md`](./modules/WORKFLOW_BRIEFS_MODULE_PLAN.md).
- **Market Intelligence**: admin-operated Research / Insight flow with bounded deterministic analysis.
- **AI Knowledge Base / Context Builder**: admin-only, route-hard-gated (`requireRole("owner","admin")`) reusable memory layer (`AiKnowledgeItem`, versioned, scoped SYSTEM/CLIENT/PROJECT/INDUSTRY) and context assembly service (`ai-context-builder.service.ts`) that composes approved (`status=APPROVED`, `allowedForPrompt=true`, non-expired) knowledge into **AiDelivery workflow-run execution** and **WorkflowBriefs MI/SEO/plan/draft** context (Blocks 6A/6B), with prompt-injection sanitization and immutable `AiContextSnapshot` audit records. **Block 6C-v1 (planned):** admin read-only Workflow Briefs knowledge-usage visibility — not client-visible. See [`docs/modules/KNOWLEDGE_BASE.md`](./modules/KNOWLEDGE_BASE.md) and [`docs/ai-delivery/ai-operating-layer-architecture.md`](./ai-delivery/ai-operating-layer-architecture.md). The separate AI SEO module content-plan/PDF path is not wired to this layer — see [`docs/modules/SEO_MODULE_PLAN.md`](./modules/SEO_MODULE_PLAN.md).

All four are admin-operated, bounded, and review-gated. Human review is required before any publish or client-visible output.

## Design rule

AI features support human-reviewed workflows.

AI helps prepare, summarize, draft, classify, and recommend.

Critical business actions remain reviewable and require admin approval.

External integrations remain guarded gates. AI SEO admin-operated MVP work exists as deterministic planning/shell behavior, not live automation.

## Current AI workflow pattern

1. input source (project, research, or market data)
2. bounded context collection
3. default local deterministic processing
4. draft output
5. human admin review
6. admin approval decision
7. publication, Google Docs export, or Client Portal visibility
8. audit record

## Guarded external integrations

- **Live provider execution** — opt-in only; default stays local.
- **WordPress publishing integration** — gated.
- **Google Docs export** — admin foundation exists.
- **Client Portal** — client-safe final deliverables and reports only.
- **Autonomous monitoring** — admin-operated only, no autonomous agents.

## AI Delivery scope

AI Delivery serves agency clients first. Required outputs:

- Final deliverables
- Google Docs export
- Website publishing / WordPress workflow
- Monthly report final client view

## Integration direction

AI modules integrate with:

- module registry
- permissions
- tenant context
- audit logs
- dashboards
- reports
- Client Portal
