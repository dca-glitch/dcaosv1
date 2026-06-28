# E2E Client Delivery Smoke (Local Proof)

**Status:** Local-only operator runbook. Does not deploy, migrate, or change product behavior.

**Purpose:** Prove one realistic admin-operated monthly client delivery flow end-to-end after Market Intelligence + AI Delivery + SEO/content production hardening.

Related:

- [`docs/runbooks/PRE_STAGING_VALIDATION_GATE.md`](./PRE_STAGING_VALIDATION_GATE.md) — broader local closeout gate
- [`.github/instructions/validation.instructions.md`](../../.github/instructions/validation.instructions.md) — validate order and Windows EPERM recovery

---

## Required environment

| Variable | Required | Default / notes |
|----------|----------|-----------------|
| `AUTH_SEED_TEST_PASSWORD` | **Yes** | Local admin password from seed; never commit or print |
| `AUTH_SEED_TEST_EMAIL` | No | Defaults to `admin@dca.local` in smoke scripts (including AI Delivery reviews) |

Optional overrides (only when needed):

- `AI_DELIVERY_REVIEW_SMOKE_API_BASE_URL` — default `http://127.0.0.1:4000/api/v1`
- `AI_DELIVERY_REVIEW_SMOKE_WEB_URL` — default `http://localhost:5173/#/ai-delivery`
- `MVP_SMOKE_API_BASE_URL` / `MVP_SMOKE_WEB_BASE_URL` — workflow browser smoke

---

## Windows operational caveats

### 1. Run `validate` before starting dev API/Web

`npm run validate` runs `prisma generate`. On Windows, a running API or other `node.exe` process can lock `query_engine-windows.dll.node` and cause:

```text
EPERM: operation not permitted, rename ... query_engine-windows.dll.node
```

**Preferred order:**

1. Stop local API/Web if already running (see below).
2. Run `npm.cmd run validate`.
3. Start API and Web only when smoke proof requires them.

**Recovery if EPERM appears:**

1. List node processes: `Get-Process -Name node | Select-Object Id, StartTime`
2. Stop only the dev API/Web PIDs: `Stop-Process -Id <PID> -Force`
3. Do **not** use `Stop-Process -Name node` (can kill unrelated processes).
4. Retry `npm.cmd run validate` once.

### 2. Long smoke chains can hit local HTTP 429

The local API uses an in-memory global rate limit (300 requests per 15 minutes per client IP). Running many smokes back-to-back can return **429** on later API calls.

**If 429 appears:**

1. Restart the local API (`npm.cmd run dev:api`) to reset the in-memory bucket, **or**
2. Wait for the rate-limit window to expire, **or**
3. Space heavy smokes across separate API sessions.

Do not change rate-limit middleware for local proof; treat 429 as an operational constraint.

---

## Service startup (when smoke requires live API/Web)

```powershell
cd C:\dcaosv1
npm.cmd run dev:api
```

In a second terminal:

```powershell
cd C:\dcaosv1
npm.cmd run dev:web
```

Confirm API readiness: `http://localhost:4000/api/v1/health` returns database `ready`.

---

## E2E proof command order

Run from `C:\dcaosv1` in **external PowerShell** (not inside a locked Prisma/API session). Use `npm.cmd` on Windows.

### Step 0 — Validate (before or after stopping dev node processes)

```powershell
cd C:\dcaosv1
npm.cmd run validate
```

If validate fails, stop. Do not run smoke.

### Step 1 — Start API + Web (if not already running)

See [Service startup](#service-startup-when-smoke-requires-live-apiweb) above.

### Step 2 — Core E2E smokes (required proof chain)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:ai-market-intelligence
npm.cmd run smoke:ai-delivery-workflow:browser
node scripts/smoke-ai-delivery-reviews-local.mjs
```

**What this chain proves:**

| Smoke | Coverage |
|-------|----------|
| `smoke:ai-market-intelligence` | Smoke client, MI project (July 2026), sources, research run, insight approval, handoff READY/APPLIED, MI → AI Delivery apply, workflow execution log MI context |
| `smoke:ai-delivery-workflow:browser` | AI Delivery operator shell, workflow runs modal, content plan panel |
| `smoke-ai-delivery-reviews-local.mjs` | Content plan approve, drafts, article images, deliverables, WordPress draft prep, admin UI panels, client review deferrals |

### Step 3 — Monthly report proof (recommended for full delivery closeout)

```powershell
cd C:\dcaosv1
npm.cmd run smoke:monthly-report:local
npm.cmd run smoke:monthly-report:browser
npm.cmd run smoke:monthly-report:mi-context
```

---

## Pass criteria

- `npm.cmd run validate` — PASS (or EPERM recovered per Windows caveat above)
- All commands in Step 2 — PASS without setting `AUTH_SEED_TEST_EMAIL` explicitly
- Step 3 — PASS when monthly report closeout is in scope
- No secrets, raw prompts, or storage keys printed in logs

---

## Stop conditions

- Do not run smoke after a failed validate.
- Stop on first real product/proof failure; report exact command and output.
- Fix stale smoke selectors only when failure is test-only; report product bugs before coding.
