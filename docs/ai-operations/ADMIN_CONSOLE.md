# AI Operations Console v1 — Operator Guide

## Purpose

The AI Operations Console is an **admin-only** operator surface for reviewing AI workflow executions across the tenant.

**Current scope (v1):** AI Delivery workflow runs. Market Intelligence research runs are included in closeout v1.1 (read-only, no provider calls).

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

The console reads existing `AiDeliveryWorkflowRun` records and parses:

- `resultPlaceholder` → `AI_WORKFLOW_RESULT_V1` summary
- `executionLog` → `[OBSERVABILITY]` metadata and knowledge-context lines
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

Optional query filters: `status`, `outputType`, `gateway`, `clientId`, `aiDeliveryProjectId`.

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
- Cross-module MI research-run listing — **in progress in baseline closeout** (read-only; no schema change)

## Local validation

```powershell
cd C:\dcaosv1
npm.cmd run smoke:ai-operations:local
npm.cmd run smoke:ai-operations:browser
```
