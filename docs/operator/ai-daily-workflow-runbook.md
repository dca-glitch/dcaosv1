# AI Operator Daily Workflow Runbook

**Scope:** DCA OS Lite local/admin AI operations after PR #33 (AI Gateway v1) and PR #34 (AI Operations Console v1).

Production/VPS deploy and live provider proof are **out of scope** for this runbook.

## What is on main today

- **AI Gateway v1** — guarded provider config; default execution is **local/deterministic**
- **AI workflow smoke matrix** — `npm run smoke:ai-matrix`
- **AI Operations Console** — admin-only review of AI Delivery workflow runs and Market Intelligence research runs

OpenRouter/live provider paths exist but remain **opt-in** and are **not production-proven**.

## Daily operator flow

### 1. Start local services (when needed)

```powershell
cd C:\dcaosv1
npm.cmd run dev:api
```

In a second terminal:

```powershell
cd C:\dcaosv1
npm.cmd run dev:web
```

Default URLs: API `http://localhost:4000`, Web `http://localhost:5173`.

### 2. Review AI Operations Console

Navigation: **AI Operations** (admin/owner only).

Use the console to answer:

| Field | Meaning |
|-------|---------|
| **Source** | AI Delivery workflow run vs Market Intelligence research run |
| **Gateway / provider mode** | `local` = deterministic default; `openrouter` = opt-in live path |
| **Context** | Whether approved knowledge/MI context was included, skipped, or not loaded |
| **Status** | Workflow/research run lifecycle state |
| **Tokens (est.)** | Approximate metadata from execution logs — **not billing records** |
| **Safe error** | Operator-safe failure summary — no secrets |

Filter by source, status, gateway, output type. Export visible rows to CSV for offline review (admin-safe fields only).

### 3. Run AI Delivery safely

1. Confirm project brief and approved research sources.
2. Apply **READY** MI handoff to project context when market intelligence should inform delivery.
3. Execute workflow runs — default path stays local/deterministic unless env explicitly enables OpenRouter.
4. Review output in workflow run detail; move to REVIEW/APPROVED per existing gates.
5. Package deliverables and monthly reports only after admin review.

### 4. Market Intelligence → AI Delivery handoff

1. Run MI research (deterministic local execution).
2. Review and approve insight.
3. Prepare handoff → move to **READY** → apply to AI Delivery project context.
4. Confirm AI Delivery workflow execution log references applied MI context.

### 5. Monthly report / SEO / content flow

- Monthly reports use snapshot-first metrics (manual/imported); live GA/GSC is deferred.
- Generate recommendation draft (local deterministic) → admin edits text → set **FINAL** for Client Portal visibility.
- Client Portal shows final recommendations and deliverables only — not admin notes, MI drafts, or provider internals.

## Local sanity smokes

Quick AI-focused pack:

```powershell
cd C:\dcaosv1
npm.cmd run smoke:ai-post-merge:sanity
```

Or individual steps:

```powershell
npm.cmd run validate
npm.cmd run smoke:ai-provider-config:local
npm.cmd run smoke:ai-operations:local
npm.cmd run smoke:ai-operations:browser
npm.cmd run smoke:ai-matrix
```

Requires `$env:AUTH_SEED_TEST_PASSWORD` (never commit or print).

## What NOT to do

- Do **not** enable live OpenRouter/production provider without explicit owner approval.
- Do **not** deploy to VPS or production from local validation alone.
- Do **not** paste secrets, `.env` values, API keys, or raw provider payloads into tickets/logs.
- Do **not** expose workflow logs, prompts, gateway audit data, or MI internals in Client Portal.
- Do **not** treat token estimates as billing or spend caps (persistent cost analytics is deferred).

## Checklists

### Daily

- [ ] Scan AI Operations Console for failed/review-pending runs
- [ ] Confirm new runs show `local` gateway unless live path was intentionally enabled
- [ ] Clear or investigate safe errors before client-facing steps

### Weekly

- [ ] Run `npm.cmd run smoke:ai-matrix` on a fresh API process if rate-limited
- [ ] Verify MI handoffs applied to active delivery projects are still **READY/APPLIED**
- [ ] Review monthly report drafts awaiting FINAL status

### Monthly

- [ ] Run full post-merge sanity pack after AI-related merges
- [ ] Update operator notes if gateway/env assumptions change
- [ ] Confirm deferred items (live provider proof, persistent cost analytics, full router) remain out of scope

## Windows recovery

| Issue | Recovery |
|-------|----------|
| Prisma `EPERM` on generate | Stop the API process holding `query_engine-windows.dll.node`, then retry `npm.cmd run validate` |
| Port 4000/5173 in use | Stop stale dev server for that port or set `PORT` / use alternate web port |
| HTTP 429 during smokes | Restart API to reset in-memory rate limits; avoid duplicate browser smokes in one session |
| Smoke matrix failure | Check log path printed by `[AI_MATRIX] Failure log:` under `$env:TEMP` |
