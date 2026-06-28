# AI Operations Console v1 — Operator Guide

## Purpose

The AI Operations Console is an **admin-only** operator surface for reviewing AI workflow executions across the tenant.

**Current scope (v1.1 closeout):** AI Delivery workflow runs and Market Intelligence research runs (read-only, no provider calls).

It answers:

- What AI workflow runs happened?
- What gateway/provider mode was used?
- What context was included or skipped?
- What result metadata was recorded?
- What failed, and what safe error summary exists?

## Access

- **Admin / owner only** — same RBAC as AI Delivery workflow runs.
- **Not exposed** in Client Portal.
- Navigation: **AI Operations** in the core sidebar.

## Data sources (no new schema)

The console reads existing records and parses:

- **AI Delivery:** `AiDeliveryWorkflowRun` — `resultPlaceholder` → `AI_WORKFLOW_RESULT_V1` summary; `executionLog` → `[OBSERVABILITY]` metadata
- **Market Intelligence:** `MarketIntelligenceResearchRun` — safe result summary preview, execution log preview, linked insight/handoff status when available
- project/client joins for operator context

Missing or legacy fields render as **Unknown** / **Not recorded** without crashing.

## Gateway modes

| Mode | Operator meaning |
|------|------------------|
| `disabled` | AI gateway disabled; deterministic/safe fallback behavior |
| `local` | Local deterministic execution (default smoke/dev path) |
| `openrouter` | Live provider path — **opt-in only**; not required for local operation |

## API (read-only)

- `GET /api/v1/ai-operations/runs` — recent runs, tenant-scoped, paginated by `limit` (default 100)
- `GET /api/v1/ai-operations/runs/:runId` — run detail with parsed summaries and sanitized previews

Optional query filters: `status`, `outputType`, `gateway`, `workflowKind`, `clientId`, `aiDeliveryProjectId`, `miProjectId`.

## Safety boundaries

- No provider calls from console endpoints.
- No secrets, API keys, cookies, or raw provider bodies in responses.
- Raw JSON preview is sanitized and truncated.
- No VPS/deploy changes are part of this console.

## Deferred

- Real provider production proof at scale
- Full multi-provider router
- Persistent cost analytics tables
- Per-tenant spend caps
- Deeper provider observability (latency, retries, billing)
- Autonomous agents

## Local validation

```powershell
cd C:\dcaosv1
npm.cmd run smoke:ai-post-merge:sanity
npm.cmd run smoke:ai-operations:local
npm.cmd run smoke:ai-operations:browser
```

Operator runbook: [`docs/operator/ai-daily-workflow-runbook.md`](../operator/ai-daily-workflow-runbook.md)
