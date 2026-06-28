# Pre-Staging Client Delivery Readiness Gate

**Status:** Local-only proof gate before staging approval. Does not deploy, migrate, or change production.

**Purpose:** Prove and document the full client-delivery readiness layer: admin E2E path, client portal final archive visibility, monthly report client-safe payloads, forbidden-internals guards, and read-only/deferred client actions.

Related:

- [`docs/runbooks/E2E_CLIENT_DELIVERY_SMOKE.md`](./E2E_CLIENT_DELIVERY_SMOKE.md) — admin-operated delivery chain
- [`docs/runbooks/PRE_STAGING_VALIDATION_GATE.md`](./PRE_STAGING_VALIDATION_GATE.md) — broader local closeout
- [`.github/instructions/validation.instructions.md`](../../.github/instructions/validation.instructions.md) — validate order and Windows caveats

---

## Required environment

| Variable | Required | Default / notes |
|----------|----------|-----------------|
| `AUTH_SEED_TEST_PASSWORD` | **Yes** | Local admin password from seed; never commit or print |
| `AUTH_SEED_TEST_EMAIL` | No | Defaults to `admin@dca.local` in smoke scripts |
| `AUTH_SEED_TESTER_EMAIL` / `AUTH_SEED_TESTER_PASSWORD` | No | Optional second-tenant cross-tenant client portal proof |

---

## Local operational caveats

1. **Prisma EPERM on Windows** — run `npm.cmd run check` or `npm.cmd run validate` **before** starting `dev:api` / `dev:web`, or after stopping the dev `node.exe` process that locks `query_engine-windows.dll.node`.
2. **HTTP 429** — long smoke chains share a 300 req / 15 min in-memory API limit. Restart the local API or space runs if 429 appears.
3. **Do not document or print secrets.**

---

## Pre-staging local proof order

Run from `C:\dcaosv1` in external PowerShell. Stop on first failure.

### Step 0 — Static validation (before dev API/Web when possible)

```powershell
cd C:\dcaosv1
npm.cmd run check
```

Use `npm.cmd run validate` when a full generate + build pass is required and no dev `node.exe` is locking Prisma.

### Step 1 — Start fresh API + Web

```powershell
cd C:\dcaosv1
npm.cmd run dev:api
```

Second terminal:

```powershell
cd C:\dcaosv1
npm.cmd run dev:web
```

Confirm: `http://localhost:4000/api/v1/health` → database `ready`.

### Step 2 — Admin E2E delivery chain

```powershell
cd C:\dcaosv1
npm.cmd run smoke:ai-market-intelligence
npm.cmd run smoke:ai-delivery-workflow:browser
node scripts/smoke-ai-delivery-reviews-local.mjs
```

### Step 3 — Client delivery readiness smokes

```powershell
cd C:\dcaosv1
npm.cmd run smoke:client-portal:local
npm.cmd run smoke:client-portal:populated-delivery:browser
npm.cmd run smoke:client-portal-monthly-report:browser
npm.cmd run smoke:monthly-report:local
npm.cmd run smoke:monthly-report:mi-context
npm.cmd run smoke:monthly-report:browser
```

---

## What each readiness smoke proves

| Smoke | Readiness coverage |
|-------|-------------------|
| `smoke:client-portal:local` | Linked client access; unlinked/cross-client denial; DRAFT deliverables excluded; FINAL monthly report API; forbidden MI internals absent; archived projects hidden; optional cross-tenant guard |
| `smoke:client-portal:populated-delivery:browser` | Linked client archive UI; populated delivery summary; safe MI summary; document/publishing handoff; forbidden fields absent in rendered HTML |
| `smoke:client-portal-monthly-report:browser` | FINAL-only monthly reports in UI; DRAFT/ADMIN_REVIEW/ARCHIVED hidden; recommendations visible; forbidden fields absent |
| `smoke:monthly-report:local` | Admin monthly summary/report lifecycle; final-safe payload; forbidden admin fields absent |
| `smoke:monthly-report:mi-context` | MI context on admin report; Client Portal omits raw MI handoff/draft internals |
| `smoke:monthly-report:browser` | Admin monthly report modal lifecycle from AI Delivery workflow |

---

## Pass criteria

- Step 0 — PASS
- Steps 2–3 — PASS without exposing secrets, prompts, workflow logs, or storage keys in output
- Client portal remains read-only (no client approval/comment workflow)
- Linked client sees final/completed archive data only
- Unlinked / cross-client access returns empty list or 404

---

## Explicitly out of scope for staging readiness

- VPS deploy, DNS, Caddy, Docker, staging migrations
- Live AI/provider cost paths (local stub/deterministic only)
- Client approval/comment workflows in portal
- Public approval links
- Production R2/WordPress live publish (local guards only)
- Broad UI polish beyond smoke selector alignment

---

## Staging readiness decision template

After a green local run, record:

1. **Ready for staging?** YES / NO / BLOCKED
2. **Proven:** admin E2E chain + client portal archive + monthly report guards
3. **Blockers:** list any FAIL output or missing optional cross-tenant env
4. **Validation status:** exact commands and PASS/FAIL
