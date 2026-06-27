# Puriva MVP Block 30 — Local Closeout Index

**Status:** Complete local Puriva MVP operator gate index (Blocks 7–30). VPS/staging deploy remains a separate owner gate.

**Purpose:** Single map of all Puriva MVP local smokes, runbooks, and pre-staging coverage for PR #13 repo closeout review.

---

## One-command gate

```powershell
cd C:\dcaosv1
npm.cmd run smoke:pre-staging:local
```

See [`PRE_STAGING_VALIDATION_GATE.md`](./PRE_STAGING_VALIDATION_GATE.md).

---

## Block map

| Block | Topic | Runbook | Primary smoke |
|-------|--------|---------|---------------|
| 7 | Delivery summary API | `PURIVA_MVP_BLOCK_7_*` | `smoke:client-portal:local` |
| 8 | Client access API | `PURIVA_MVP_BLOCK_8_*` | `smoke:client-access:local` |
| 9 | Portal delivery overview browser | `PURIVA_MVP_BLOCK_9_*` | `smoke:client-portal:browser` |
| 10 | Portal catalog inquiry browser | `PURIVA_MVP_BLOCK_10_*` | `smoke:client-portal:browser` |
| 11 | MI pre-staging | `PURIVA_MVP_BLOCK_11_*` | `smoke:ai-market-intelligence` |
| 12 | Portal edge cases browser | `PURIVA_MVP_BLOCK_12_*` | `smoke:client-portal:edge-cases:browser` |
| 13 | Sparse delivery overview browser | `PURIVA_MVP_BLOCK_13_*` | `smoke:client-portal:sparse-delivery:browser` |
| 14 | Access revoke browser | `PURIVA_MVP_BLOCK_14_*` | `smoke:client-portal:access-revoke:browser` |
| 15 | Google Drive export pre-staging | `PURIVA_MVP_BLOCK_15_*` | `smoke:google-drive-export` |
| 16 | Empty archive browser | `PURIVA_MVP_BLOCK_16_*` | `smoke:client-portal:empty-archive:browser` |
| 17 | Hub catalog inquiry browser | `PURIVA_MVP_BLOCK_17_*` | `smoke:client-hub:catalog-inquiry:browser` |
| 18 | Monthly report MI context | `PURIVA_MVP_BLOCK_18_*` | `smoke:monthly-report:mi-context` |
| 19 | Portal project filter browser | `PURIVA_MVP_BLOCK_19_*` | `smoke:client-portal:project-filter:browser` |
| 20 | Hub publication log browser | `PURIVA_MVP_BLOCK_20_*` | `smoke:client-hub:publication-log:browser` |
| 21 | Monthly report local + PDF | `PURIVA_MVP_BLOCK_21_*` | `smoke:monthly-report:local`, `:pdf` |
| 22 | Monthly report metrics | `PURIVA_MVP_BLOCK_22_*` | `smoke:monthly-report:metrics` |
| 23 | Portal signed-out browser | `PURIVA_MVP_BLOCK_23_*` | `smoke:client-portal:signed-out:browser` |
| 24 | Monthly report admin browser | `PURIVA_MVP_BLOCK_24_*` | `smoke:monthly-report:browser` |
| 25 | Client domain hub extensions | `PURIVA_MVP_BLOCK_25_*` | `smoke:client-domain:browser` |
| 26 | Client access admin browser | `PURIVA_MVP_BLOCK_26_*` | `smoke:client-access:browser` |
| 27 | Populated delivery overview browser | `PURIVA_MVP_BLOCK_27_*` | `smoke:client-portal:populated-delivery:browser` |
| 28 | Login shell browser | `PURIVA_MVP_BLOCK_28_*` | `smoke:browser` |
| 29 | Architecture blocks 4–6 reference | `PURIVA_MVP_BLOCK_29_*` | credential / WP / tenant smokes |
| 30 | Local closeout index | this document | `smoke:pre-staging:local` |

Additional pre-staging smokes outside numbered Puriva blocks: `smoke:local`, `smoke:mvp:local`, `smoke:client-portal-monthly-report:browser`, `smoke:ai-delivery-reviews`.

---

## Explicitly out of scope (owner gates)

- VPS staging deploy and `smoke:mvp:staging`
- Production Puriva publish and live integrations
- Schema/API contract changes without separate approval

---

## Pass criteria for local closeout

- `npm run validate` — PASS
- `npm run smoke:pre-staging:local` — PASS
- All runbooks in this index present under `docs/runbooks/PURIVA_MVP_BLOCK_*`
- No secrets printed in smoke logs
