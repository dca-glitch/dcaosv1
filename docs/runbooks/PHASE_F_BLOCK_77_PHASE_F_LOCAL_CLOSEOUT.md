# Phase F Block 77 — Phase F Local Closeout

**Status:** Final validation gate for Blocks 58–77.

## Run

```powershell
cd C:\dcaosv1
npm.cmd run validate
npm.cmd run smoke:pre-staging:local
```

Stop API before `validate` on Windows (Prisma DLL lock). Restart API + web (5173/4000) for browser smokes inside pre-staging.

## Pass criteria

- `validate` — PASS
- `smoke:pre-staging:local` — PASS
- All Phase F runbooks `PHASE_F_BLOCK_58_*` … `PHASE_F_BLOCK_77_*` present
- `docs/STATUS_COMPLETION.md` updated with Phase F closeout note
- No secrets printed in smoke logs

## After Phase F

Owner gates: staging host, VPS pack, production env keys (credentials, R2, OpenRouter, Google, WP publish).
