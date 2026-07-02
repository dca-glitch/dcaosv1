# AI Modules

## Current status

**Merged AI operating baseline on `main` (2026-06):**

- **AI Gateway v1** (PR #33) — guarded provider config, local deterministic default, workflow observability metadata (`AI_WORKFLOW_RESULT_V1`, execution log `[OBSERVABILITY]` blocks).
- **AI workflow smoke matrix** (PR #33) — sequential local proof across provider config, knowledge context, MI, monthly report, AI Delivery, AI Operations, and guarded OpenRouter skip path.
- **AI Operations Console v1** (PR #34) — admin-only operator surface for reviewing AI Delivery workflow runs. Not exposed in Client Portal.

Default execution is **local/deterministic**. OpenRouter/live provider paths exist but remain **opt-in, env-guarded, and not production-proven**.

## Current module split

- **AI Delivery**: admin-operated Project / Brief / Workflow / Deliverable / Review / monthly report / client portal archive flow.
- **Market Intelligence**: admin-operated Research / Insight flow with bounded deterministic analysis.

Both modules are admin-operated, bounded, and review-gated. Human review is required before any publish or client-visible output.

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
