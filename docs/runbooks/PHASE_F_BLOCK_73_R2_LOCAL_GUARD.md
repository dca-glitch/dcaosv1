# Phase F Block 73 — R2 Local Guard Runbook

**Scope:** Disabled guard + optional byte roundtrip. Production bucket deferred.

Related:

- [`POST_MVP_BLOCK_37_R2_BYTE_ROUNDTRIP_LOCAL_GATE.md`](./POST_MVP_BLOCK_37_R2_BYTE_ROUNDTRIP_LOCAL_GATE.md)
- `scripts/smoke-r2-byte-roundtrip-local.mjs`

## Run

```powershell
cd C:\dcaosv1
npm.cmd run smoke:r2-byte-roundtrip:local
```

## Pass criteria

- Baseline PASS with R2 disabled (guard path)
- Optional strict roundtrip documented in Block 37 runbook when env configured

## Deferred

- Production R2 bucket on VPS
