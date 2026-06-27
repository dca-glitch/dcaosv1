# Post-MVP Phases A–D — Closeout Index (Blocks 31–53)

**Status:** Local Post-MVP operator gate index complete. PR #13 is merged to `main`; VPS/staging execution still requires a confirmed staging target and separate owner approval.

**Purpose:** Single map of Post-MVP local smokes and runbooks after Puriva MVP Blocks 7–30.

Related:

- [`PURIVA_MVP_BLOCK_30_LOCAL_CLOSEOUT_INDEX.md`](./PURIVA_MVP_BLOCK_30_LOCAL_CLOSEOUT_INDEX.md) — Puriva MVP Blocks 7–30
- [`POST_MVP_PHASE_C_D_CLOSEOUT_INDEX.md`](./POST_MVP_PHASE_C_D_CLOSEOUT_INDEX.md) — Phase C/D detail (Blocks 43–53)
- [`PRE_STAGING_VALIDATION_GATE.md`](./PRE_STAGING_VALIDATION_GATE.md) — one-command orchestrator

---

## Phase A — Polish & smoke (Blocks 31–36)

| Block | Topic | Runbook | Primary smoke |
|-------|--------|---------|---------------|
| 31 | Audit feed UI | `POST_MVP_BLOCK_31_*` | `smoke:dashboard:audit-feed:browser` |
| 32 | Dashboard metrics polish | `POST_MVP_BLOCK_32_*` | (extends Block 31 smoke) |
| 33 | Settings / Team shell | `POST_MVP_BLOCK_33_*` | `smoke:settings-team:browser` |
| 34 | Content plan review browser | `POST_MVP_BLOCK_34_*` | `smoke:content-plan-review:browser` |
| 35 | Content draft review browser | `POST_MVP_BLOCK_35_*` | `smoke:content-draft-review:browser` |
| 36 | Finance admin browser sanity | `POST_MVP_BLOCK_36_*` | `smoke:finance-admin:browser` |

---

## Phase B — Platform depth local (Blocks 37–42)

| Block | Topic | Runbook | Primary smoke |
|-------|--------|---------|---------------|
| 37 | R2 byte roundtrip | `POST_MVP_BLOCK_37_*` | `smoke:r2-byte-roundtrip:local` |
| 38 | Email outbox read-only API | `POST_MVP_BLOCK_38_*` | `smoke:email-outbox:local` |
| 39 | Tenant module dry_run probe | `POST_MVP_BLOCK_39_*` | `smoke:tenant-module:dry-run-probe` |
| 40 | OpenRouter guarded local | `POST_MVP_BLOCK_40_*` | `smoke:openrouter-guarded:local` |
| 41 | MI operator browser | `POST_MVP_BLOCK_41_*` | `smoke:mi-operator:browser` |
| 42 | AI Delivery workflow browser | `POST_MVP_BLOCK_42_*` | `smoke:ai-delivery-workflow:browser` |

---

## Phase C — Integration sandbox (Blocks 43–46)

See [`POST_MVP_PHASE_C_D_CLOSEOUT_INDEX.md`](./POST_MVP_PHASE_C_D_CLOSEOUT_INDEX.md).

---

## Phase D — Platform MVP browser gates (Blocks 47–53)

See [`POST_MVP_PHASE_C_D_CLOSEOUT_INDEX.md`](./POST_MVP_PHASE_C_D_CLOSEOUT_INDEX.md).

---

## One-command gate

```powershell
cd C:\dcaosv1
npm.cmd run smoke:pre-staging:local
```

Fast Post-MVP read-only API probe:

```powershell
npm.cmd run smoke:post-mvp-readonly-apis:local
```
