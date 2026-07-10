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

**Related admin surfaces (G429–G448):**

- Daily Cockpit — `#/admin-daily-cockpit` ([`AdminDailyOperationsCockpit.tsx`](../../apps/web/src/pages/ai-operations/AdminDailyOperationsCockpit.tsx))
- Admin surface inventory — [`docs/ui/admin-surface-inventory.md`](../ui/admin-surface-inventory.md)
- Proof-state vocabulary — [`docs/ux/proof-state-vocabulary.md`](../ux/proof-state-vocabulary.md)
- Integration truth matrix — [`docs/runbooks/INTEGRATIONS_TRUTH_MATRIX.md`](../runbooks/INTEGRATIONS_TRUTH_MATRIX.md)

## Access

- **Admin / owner only** — same RBAC as AI Delivery workflow runs.
- **Not exposed** in Client Portal.
- Navigation: **AI Operations** in the core sidebar (`#/ai-operations`).
- Daily Cockpit is a separate core nav item (`#/admin-daily-cockpit`).

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

**Copy rule:** Showing `openrouter` or `liveProviderCalled: yes` on a **local** run does **not** mean staging/production proof. Use proof-state vocabulary (`local_only`, `owner_gated`, etc.) when labeling integration readiness elsewhere.

## API (read-only)

- `GET /api/v1/ai-operations/runs` — recent runs, tenant-scoped, paginated by `limit` (default 100)
- `GET /api/v1/ai-operations/runs/:runId` — run detail with parsed summaries and sanitized previews

Optional query filters: `status`, `outputType`, `gateway`, `workflowKind`, `clientId`, `aiDeliveryProjectId`, `miProjectId`.

## UI surfaces

| Hash | Component | Role |
|------|-----------|------|
| `#/ai-operations` | `AiOperationsPage.tsx` | Run list + detail drawer; filters; CSV export columns include `live_provider_called` as factual run metadata |
| `#/admin-daily-cockpit` | `AdminDailyOperationsCockpit.tsx` | Ready/blocked queues; Puriva practice path; explicit non-production disclaimers |

Supporting panels (embedded elsewhere, not separate nav):

- `AdminOperationsPanel.tsx` — read-only external-integration **config-shape** signals; states “no live calls”
- `AiOrchestratorLitePanel.tsx` — pre-live registry / dry-run ledger; kill-switch and “live proof pending” copy

## Safety boundaries

- No provider calls from console endpoints.
- No secrets, API keys, cookies, or raw provider bodies in responses.
- Raw JSON preview is sanitized and truncated.
- No VPS/deploy changes are part of this console.
- Admin copy must not upgrade local run metadata into “production ready” or “fully connected” claims.

## Empty / error / loading

| State | Current pattern | Polish note |
|-------|-----------------|-------------|
| Loading | Inline spinner / state panel on cockpit | Prefer shared `LoadingState` in a future UX-P block |
| Error | `Alert` / danger title | Prefer `ErrorState` for fatal load failures |
| Empty runs | `EmptyState` on AI Operations | Good |
| Empty queues | Muted paragraph on cockpit | UX-P11 — add CTAs to WorkflowBriefs / AI Delivery / MI |

## Deferred

- Real provider production proof at scale
- Full multi-provider router
- Persistent cost analytics tables
- Per-tenant spend caps
- Deeper provider observability (latency, retries, billing)
- Autonomous agents
- Launch-blocker board UI (design only — [`launch-blocker-board-ui-design.md`](../ui/launch-blocker-board-ui-design.md))

## Local validation

```powershell
cd C:\dcaosv1
npm.cmd run smoke:ai-post-merge:sanity
npm.cmd run smoke:ai-operations:local
npm.cmd run smoke:ai-operations:browser
```

Operator runbook: [`docs/operator/ai-daily-workflow-runbook.md`](../operator/ai-daily-workflow-runbook.md)
