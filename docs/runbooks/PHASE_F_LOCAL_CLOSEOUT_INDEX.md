# Phase F — Local Closeout Index (Blocks 58–77)

**Status:** Active local closeout index after Post-MVP Block 57.

**Purpose:** Single map of Phase F local smokes, runbooks, and validation gates.

**Roadmap:** [`docs/ROADMAP_LOCAL_COMPLETION_PHASE_F.md`](../ROADMAP_LOCAL_COMPLETION_PHASE_F.md)

**Prior closeout:** [`POST_MVP_BLOCK_57_LOCAL_REPO_FINAL_CLOSEOUT.md`](./POST_MVP_BLOCK_57_LOCAL_REPO_FINAL_CLOSEOUT.md)

---

## One-command gate

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run smoke:pre-staging:local
```

See [`PRE_STAGING_VALIDATION_GATE.md`](./PRE_STAGING_VALIDATION_GATE.md).

---

## Block index

| Block | Topic | Runbook | Primary smoke |
|-------|--------|---------|---------------|
| 58 | Docs consistency | `PHASE_F_BLOCK_58_*` | (validate only) |
| 59 | Module middleware enforce/dry_run | `PHASE_F_BLOCK_59_*` | `smoke:tenant-module:dry-run-probe` + `smoke:tenant-module:local` |
| 60 | Client Hub + PublicationTarget edge cases | `PHASE_F_BLOCK_60_*` | `smoke:client-domain:browser` |
| 61 | Encrypted credentials local checklist | `PHASE_F_BLOCK_61_*` | `smoke:credential-master-key-probe:local` |
| 62 | Settings/Team/Company Profile polish | `PHASE_F_BLOCK_62_*` | `smoke:settings-team:browser` |
| 63 | Monthly Reports compact UX | `PHASE_F_BLOCK_63_*` | `smoke:monthly-report:browser` |
| 64 | WordPress handoff local guarded flow | `PHASE_F_BLOCK_64_*` | `smoke:wordpress-publish:local` |
| 65 | Clients/Projects/Tasks regression | `PHASE_F_BLOCK_65_*` | `smoke:client-domain:browser` |
| 66 | AI Delivery operator UX | `PHASE_F_BLOCK_66_*` | `smoke:ai-delivery-workflow:browser` |
| 67 | Market Intelligence compact/handoff | `PHASE_F_BLOCK_67_*` | `smoke:mi-operator:browser` |
| 68 | Client Portal MVP polish | `PHASE_F_BLOCK_68_*` | `smoke:client-portal:edge-cases:browser` |
| 69 | Finance second-tenant cross-tenant proof | `PHASE_F_BLOCK_69_*` | `smoke:finance-admin:browser` |
| 70 | Audit/activity read UI | `PHASE_F_BLOCK_70_*` | `smoke:audit-activity:browser` |
| 71 | AI SEO + Content Production shell | `PHASE_F_BLOCK_71_*` | `smoke:content-plan-review:browser` |
| 72 | Google Drive export guarded contract | `PHASE_F_BLOCK_72_*` | `smoke:google-drive-export` |
| 73 | R2/private storage local guard | `PHASE_F_BLOCK_73_*` | `smoke:r2-byte-roundtrip:local` |
| 74 | AI provider deterministic/guarded UX | `PHASE_F_BLOCK_74_*` | `smoke:openrouter-guarded:local` |
| 75 | Email/notifications EN2 lite | `PHASE_F_BLOCK_75_*` | `smoke:email-outbox:local` |
| 76 | First-client practice run | `PHASE_F_BLOCK_76_*` | (process + docs) |
| 77 | Phase F local closeout | `PHASE_F_BLOCK_77_*` | `validate` + `smoke:pre-staging:local` |

Runbooks are added per block under `docs/runbooks/PHASE_F_BLOCK_<n>_*.md`.

---

## Explicitly out of scope

- VPS/staging execution before confirmed staging target
- Production Google service account, credential master key, WordPress live publish
- Production tenant module `enforce` without seeded entitlements
- Auth invite flows, password reset, Turnstile changes
- Schema/API contract changes without separate approval

---

## Pass criteria for Phase F closeout (Block 77)

- `npm run validate` — PASS
- `npm run smoke:pre-staging:local` — PASS
- All Phase F runbooks present for completed blocks
- `docs/STATUS_COMPLETION.md` updated with Phase F closeout note
- No secrets printed in smoke logs
